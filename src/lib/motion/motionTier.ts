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
const STORAGE_TIMESTAMP_KEY = "forever-motion-tier-ts";
const STORAGE_SIGNATURE_KEY = "forever-motion-tier-signature";
const REMEMBERED_TIER_TTL_MS = 10 * 60 * 1000;

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

function forgetRememberedMotionTier(): void {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_REASON_KEY);
    window.sessionStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    window.sessionStorage.removeItem(STORAGE_SIGNATURE_KEY);
  } catch {
    /* sessionStorage can be disabled in private / embedded contexts. */
  }
}

function getSessionSignature(): string {
  if (typeof window === "undefined") return "ssr";
  const minSide = Math.min(window.innerWidth, window.innerHeight);
  const sizeClass = minSide <= 540 ? "compact" : "roomy";
  const coarse =
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(any-pointer: coarse)").matches;
  const touch = navigator.maxTouchPoints > 0;
  const uaClass = /\b(Android|iPhone|iPad|iPod|Mobile)\b/u.test(
    navigator.userAgent,
  )
    ? "mobile-ua"
    : "desktop-ua";
  return `${sizeClass}|${coarse ? "coarse" : "fine"}|${touch ? "touch" : "no-touch"}|${uaClass}`;
}

export function readRememberedMotionTier(): MotionTierDecision | null {
  if (typeof window === "undefined") return null;
  try {
    const tier = normalizeTier(window.sessionStorage.getItem(STORAGE_KEY));
    if (!tier) return null;
    const ts = Number(window.sessionStorage.getItem(STORAGE_TIMESTAMP_KEY));
    const signature = window.sessionStorage.getItem(STORAGE_SIGNATURE_KEY);
    if (
      !Number.isFinite(ts) ||
      Date.now() - ts > REMEMBERED_TIER_TTL_MS ||
      signature !== getSessionSignature()
    ) {
      forgetRememberedMotionTier();
      return null;
    }
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
    window.sessionStorage.setItem(STORAGE_TIMESTAMP_KEY, String(Date.now()));
    window.sessionStorage.setItem(STORAGE_SIGNATURE_KEY, getSessionSignature());
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
  const smallViewport = Math.min(window.innerWidth, window.innerHeight) <= 540;
  const coarse =
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(any-pointer: coarse)").matches;
  const touch = navigator.maxTouchPoints > 0;
  const mobileUa = /\b(Android|iPhone|iPad|iPod|Mobile)\b/u.test(
    navigator.userAgent,
  );
  const mobileLike = coarse || touch || mobileUa;
  const deviceMemory =
    typeof nav.deviceMemory === "number" ? nav.deviceMemory : undefined;
  const hardwareConcurrency =
    typeof navigator.hardwareConcurrency === "number"
      ? navigator.hardwareConcurrency
      : undefined;

  if (nav.connection?.saveData === true) {
    return { tier: "lite", reason: "save-data" };
  }
  if (mobileLike && smallViewport) {
    return { tier: "lite", reason: "mobile-compact-viewport" };
  }
  if (mobileLike && typeof deviceMemory === "number" && deviceMemory <= 4) {
    return { tier: "lite", reason: `mobile-device-memory-${deviceMemory}` };
  }
  if (
    mobileLike &&
    typeof hardwareConcurrency === "number" &&
    hardwareConcurrency <= 4
  ) {
    return {
      tier: "lite",
      reason: `mobile-hardware-concurrency-${hardwareConcurrency}`,
    };
  }
  if (
    !mobileLike &&
    typeof deviceMemory === "number" &&
    deviceMemory <= 4 &&
    typeof hardwareConcurrency === "number" &&
    hardwareConcurrency <= 4
  ) {
    return {
      tier: "lite",
      reason: `desktop-low-device-hints-${deviceMemory}gb-${hardwareConcurrency}cores`,
    };
  }

  return { tier: "full", reason: "default-full" };
}

export function shouldDowngradeForSlowFirstFrame(startMs: number): boolean {
  return performance.now() - startMs > 1400;
}
