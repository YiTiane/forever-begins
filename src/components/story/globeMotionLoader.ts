import {
  detectInitialMotionTier,
  rememberMotionTier,
  shouldDowngradeForSlowFirstFrame,
  type MotionTierDecision,
} from "@/lib/motion/motionTier";

const FIRST_MEANINGFUL_FRAME_TIMEOUT_MS = 1400;

interface GlobeLoaderProps {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  routes: Array<{
    from: { name: string; lat: number; lng: number };
    to: { name: string; lat: number; lng: number };
    kind?: "primary" | "secondary";
  }>;
}

function readProps(root: HTMLElement): GlobeLoaderProps | null {
  const raw = root.dataset["globeProps"];
  if (!raw) return null;
  try {
    return JSON.parse(raw) as GlobeLoaderProps;
  } catch (error) {
    console.warn("[GlobeMotionLoader] invalid data-globe-props", error);
    return null;
  }
}

function setDecision(root: HTMLElement, decision: MotionTierDecision): void {
  root.dataset["motionTier"] = decision.tier;
  root.dataset["motionReason"] = decision.reason;
}

function markStatic(root: HTMLElement, decision: MotionTierDecision): void {
  setDecision(root, decision);
  root.dataset["progress"] = "1.000";
}

async function hydrateGlobe(
  root: HTMLElement,
  props: GlobeLoaderProps,
  decision: MotionTierDecision,
): Promise<void> {
  const started = performance.now();
  let activeDecision = decision;
  let firstFrameResolved = false;
  const cleanupFirstFrameWatch = () => {
    firstFrameResolved = true;
    window.clearTimeout(firstFrameTimer);
    window.removeEventListener("globe:first-frame-ready", onFirstFrameReady);
  };
  const downgradeToLite = (reason: string) => {
    if (firstFrameResolved || activeDecision.tier !== "full") return;
    activeDecision = { tier: "lite", reason };
    rememberMotionTier("lite", reason);
    setDecision(root, activeDecision);
    console.warn("[GlobeMotionLoader] downgraded motion tier", {
      previous: "full",
      next: "lite",
      reason,
    });
    window.dispatchEvent(
      new CustomEvent("motion-tier:downgrade", {
        detail: { component: "globe", tier: "lite", reason },
      }),
    );
  };
  const onFirstFrameReady = () => cleanupFirstFrameWatch();
  const firstFrameTimer = window.setTimeout(
    () => downgradeToLite("globe-first-meaningful-frame-timeout"),
    FIRST_MEANINGFUL_FRAME_TIMEOUT_MS,
  );
  window.addEventListener("globe:first-frame-ready", onFirstFrameReady, {
    once: true,
  });
  try {
    const [{ createElement }, { createRoot }, { GlobeDistanceScene }] =
      await Promise.all([
        import("react"),
        import("react-dom/client"),
        import("@/components/story/GlobeDistanceScene"),
      ]);
    if (
      shouldDowngradeForSlowFirstFrame(started) &&
      activeDecision.tier === "full"
    ) {
      downgradeToLite("slow-first-frame-import");
    }
    createRoot(root).render(
      createElement(GlobeDistanceScene, {
        ...props,
        initialMotionTier: activeDecision.tier,
        initialMotionReason: activeDecision.reason,
      }),
    );
  } catch (error) {
    cleanupFirstFrameWatch();
    const next = { tier: "static" as const, reason: "globe-hydration-failed" };
    rememberMotionTier("static", next.reason);
    markStatic(root, next);
    console.warn("[GlobeMotionLoader] static fallback after hydrate failure", {
      error,
    });
  }
}

function setup(root: HTMLElement): void {
  if (root.dataset["motionHydrated"] === "true") return;
  root.dataset["motionHydrated"] = "true";

  const props = readProps(root);
  if (!props) {
    markStatic(root, { tier: "static", reason: "missing-props" });
    return;
  }

  const decision = detectInitialMotionTier();
  setDecision(root, decision);
  if (decision.tier === "static") {
    markStatic(root, decision);
    return;
  }

  const hydrate = () => void hydrateGlobe(root, props, decision);
  if (!("IntersectionObserver" in window)) {
    hydrate();
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      hydrate();
    },
    { rootMargin: "400px 0px" },
  );
  io.observe(root);
}

function boot(): void {
  document
    .querySelectorAll<HTMLElement>("[data-globe-motion-root]")
    .forEach(setup);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}
