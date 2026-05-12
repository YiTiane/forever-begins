import {
  detectInitialMotionTier,
  rememberMotionTier,
  shouldDowngradeForSlowFirstFrame,
  type MotionTierDecision,
} from "@/lib/motion/motionTier";

const FIRST_MEANINGFUL_FRAME_TIMEOUT_MS = 1400;

function setDecision(root: HTMLElement, decision: MotionTierDecision): void {
  root.dataset["motionTier"] = decision.tier;
  root.dataset["motionReason"] = decision.reason;
}

function syncStaticShell(
  root: HTMLElement,
  decision: MotionTierDecision,
): void {
  setDecision(root, decision);
  root.dataset["progress"] = "1.000";
  root.dataset["currentIndex"] = "14";
  root.dataset["fallback"] =
    decision.reason === "prefers-reduced-motion" ? "static" : decision.reason;
  root.closest(".finale-canvas")?.classList.add("is-static-fallback");
}

async function hydrateFinale(
  root: HTMLElement,
  decision: MotionTierDecision,
): Promise<void> {
  const started = performance.now();
  let activeDecision = decision;
  let firstFrameResolved = false;
  const cleanupFirstFrameWatch = () => {
    firstFrameResolved = true;
    window.clearTimeout(firstFrameTimer);
    window.removeEventListener(
      "finale:scene-first-frame-ready",
      onFirstFrameReady,
    );
  };
  const downgradeToLite = (reason: string) => {
    if (firstFrameResolved || activeDecision.tier !== "full") return;
    activeDecision = { tier: "lite", reason };
    rememberMotionTier("lite", reason);
    setDecision(root, activeDecision);
    console.warn("[FinaleMotionLoader] downgraded motion tier", {
      previous: "full",
      next: "lite",
      reason,
    });
    window.dispatchEvent(
      new CustomEvent("motion-tier:downgrade", {
        detail: { component: "finale", tier: "lite", reason },
      }),
    );
  };
  const onFirstFrameReady = () => cleanupFirstFrameWatch();
  const firstFrameTimer = window.setTimeout(
    () => downgradeToLite("finale-first-meaningful-frame-timeout"),
    FIRST_MEANINGFUL_FRAME_TIMEOUT_MS,
  );
  window.addEventListener("finale:scene-first-frame-ready", onFirstFrameReady, {
    once: true,
  });
  try {
    const [{ createElement }, { createRoot }, { StarCarouselFinale }] =
      await Promise.all([
        import("react"),
        import("react-dom/client"),
        import("@/components/story/StarCarouselFinale"),
      ]);
    if (
      shouldDowngradeForSlowFirstFrame(started) &&
      activeDecision.tier === "full"
    ) {
      downgradeToLite("slow-first-frame-import");
    }
    createRoot(root).render(
      createElement(StarCarouselFinale, {
        initialMotionTier: activeDecision.tier,
        initialMotionReason: activeDecision.reason,
      }),
    );
  } catch (error) {
    cleanupFirstFrameWatch();
    const next = { tier: "static" as const, reason: "finale-hydration-failed" };
    rememberMotionTier("static", next.reason);
    syncStaticShell(root, next);
    console.warn("[FinaleMotionLoader] static fallback after hydrate failure", {
      error,
    });
  }
}

function setup(root: HTMLElement): void {
  if (root.dataset["motionHydrated"] === "true") return;
  root.dataset["motionHydrated"] = "true";

  const decision = detectInitialMotionTier();
  setDecision(root, decision);
  if (decision.tier === "static") {
    syncStaticShell(root, decision);
    return;
  }

  const hydrate = () => void hydrateFinale(root, decision);
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
    .querySelectorAll<HTMLElement>("[data-finale-motion-root]")
    .forEach(setup);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
}
