export type TierId = "free" | "growth" | "enterprise" | "custom";

/** Tiers that use Stripe Checkout (monthly billing). */
export const PAID_SELF_SERVE_TIER_IDS = ["growth", "enterprise"] as const;
export type PaidSelfServeTierId = (typeof PAID_SELF_SERVE_TIER_IDS)[number];

export type TierDefinition = {
  id: TierId;
  name: string;
  description: string;
  /** null = pricing on request (Custom only) */
  priceMonthlyUsd: number | null;
  /** null = custom example volume (Custom only) */
  monthlyExampleLimit: number | null;
  /** Highlight as recommended on pricing page */
  recommended?: boolean;
};

export const TIERS: Record<TierId, TierDefinition> = {
  free: {
    id: "free",
    name: "Free",
    description: "For individuals trying the platform.",
    priceMonthlyUsd: 0,
    monthlyExampleLimit: 500,
  },
  growth: {
    id: "growth",
    name: "Growth",
    description: "Recommended for teams scaling synthetic data workflows.",
    priceMonthlyUsd: 999,
    monthlyExampleLimit: 50_000,
    recommended: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For serious ML teams with high-volume needs.",
    priceMonthlyUsd: 4999,
    monthlyExampleLimit: 500_000,
  },
  custom: {
    id: "custom",
    name: "Custom",
    description: "For large institutions needing dedicated support.",
    priceMonthlyUsd: null,
    monthlyExampleLimit: null,
  },
};

export const MONTHLY_LIMIT_ERROR =
  "Monthly limit reached — upgrade your plan or wait until next month";

export type UsageState = {
  tier: TierId;
  monthKey: string;
  usedExamples: number;
};

/** YYYY-MM in local timezone */
export function getCurrentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** Default in-memory usage (Free tier). */
export function initialUsageState(): UsageState {
  return {
    tier: "free",
    monthKey: getCurrentMonthKey(),
    usedExamples: 0,
  };
}

/** Apply month rollover: reset used count when calendar month changes */
export function applyMonthRollover(state: UsageState): UsageState {
  const now = getCurrentMonthKey();
  if (state.monthKey !== now) {
    return { ...state, monthKey: now, usedExamples: 0 };
  }
  return state;
}

/** Infinity means no fixed cap (Custom). */
export function getTierLimit(tier: TierId): number {
  const lim = TIERS[tier].monthlyExampleLimit;
  return lim === null ? Number.POSITIVE_INFINITY : lim;
}

export function tierHasFixedMonthlyLimit(tier: TierId): boolean {
  return TIERS[tier].monthlyExampleLimit !== null;
}

export function remainingQuota(state: UsageState): number {
  const rolled = applyMonthRollover(state);
  const lim = TIERS[rolled.tier].monthlyExampleLimit;
  if (lim === null) return Number.POSITIVE_INFINITY;
  return Math.max(0, lim - rolled.usedExamples);
}

export function canGenerateExamples(state: UsageState, requested: number): boolean {
  const rolled = applyMonthRollover(state);
  const lim = TIERS[rolled.tier].monthlyExampleLimit;
  if (lim === null) return true;
  return rolled.usedExamples + requested <= lim;
}

export function incrementUsedExamples(state: UsageState, delta: number): UsageState {
  const rolled = applyMonthRollover(state);
  return {
    ...rolled,
    usedExamples: rolled.usedExamples + Math.max(0, Math.floor(delta)),
  };
}

export function setTier(state: UsageState, tier: TierId): UsageState {
  const rolled = applyMonthRollover(state);
  return { ...rolled, tier };
}

export function isTierId(value: string): value is TierId {
  return (
    value === "free" ||
    value === "growth" ||
    value === "enterprise" ||
    value === "custom"
  );
}

export function isPaidSelfServeTierId(id: string): id is PaidSelfServeTierId {
  return (PAID_SELF_SERVE_TIER_IDS as readonly string[]).includes(id);
}
