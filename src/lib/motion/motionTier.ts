/**
 * motionTier.ts · shared low-end / reduced-motion detection for R3F scenes
 *
 * This module must stay dependency-free: it is imported by small client loaders
 * before React / Three chunks are requested.
 */

export type MotionTier = "full" | "lite" | "static";

export interface MotionTierDecision {
  tier: MotionTier;
  reason: string;
}

type NavigatorWithDeviceHints = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
};

const STORAGE_KEY = "forever-motion-tier";
const STORAGE_REASON_KEY = "forever-motion-tier-reason";

function hasWebGLSupport(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function normalizeTier(value: string | null): MotionTier | null {
  return value === "full" || value === "lite" || value === "static"
    ? value
    : null;
}

export function readRememberedMotionTier(): MotionTierDecision | null {
  if (typeof window === "undefined") return null;
  try {
    const tier = normalizeTier(window.sessionStorage.getItem(STORAGE_KEY));
    if (!tier) return null;
    return {
      tier,
      reason:
        window.sessionStorage.getItem(STORAGE_REASON_KEY) ??
        "session-remembered",
    };
  } catch {
    return null;
  }
}

export function rememberMotionTier(tier: MotionTier, reason: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, tier);
    window.sessionStorage.setItem(STORAGE_REASON_KEY, reason);
  } catch {
    /* sessionStorage can be disabled in private / embedded contexts. */
  }
}

export function detectInitialMotionTier(): MotionTierDecision {
  if (typeof window === "undefined") return { tier: "full", reason: "ssr" };

  const remembered = readRememberedMotionTier();
  if (remembered?.tier === "static" || remembered?.tier === "lite") {
    return remembered;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return { tier: "static", reason: "prefers-reduced-motion" };
  }
  if (!hasWebGLSupport())
    return { tier: "static", reason: "webgl-unavailable" };

  const nav = navigator as NavigatorWithDeviceHints;
  if (nav.connection?.saveData === true) {
    return { tier: "lite", reason: "save-data" };
  }
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4) {
    return { tier: "lite", reason: `device-memory-${nav.deviceMemory}` };
  }
  if (
    typeof navigator.hardwareConcurrency === "number" &&
    navigator.hardwareConcurrency <= 4
  ) {
    return {
      tier: "lite",
      reason: `hardware-concurrency-${navigator.hardwareConcurrency}`,
    };
  }

  const smallViewport = Math.min(window.innerWidth, window.innerHeight) <= 540;
  const coarseSmall =
    (window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(any-pointer: coarse)").matches) &&
    smallViewport;
  const touchSmall = navigator.maxTouchPoints > 0 && smallViewport;
  const mobileUaSmall =
    /\b(Android|iPhone|iPad|iPod|Mobile)\b/u.test(navigator.userAgent) &&
    smallViewport;
  if (coarseSmall || touchSmall || mobileUaSmall || smallViewport) {
    return { tier: "lite", reason: "small-coarse-viewport" };
  }

  return { tier: "full", reason: "default-full" };
}

export function shouldDowngradeForSlowFirstFrame(startMs: number): boolean {
  return performance.now() - startMs > 1400;
}
