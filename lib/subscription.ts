export type TierId = "free" | "starter" | "growth" | "scale" | "enterprise";

/** Tiers that use Stripe Checkout (monthly or yearly). */
export const PAID_SELF_SERVE_TIER_IDS = ["starter", "growth", "scale"] as const;
export type PaidSelfServeTierId = (typeof PAID_SELF_SERVE_TIER_IDS)[number];

export type BillingPeriod = "monthly" | "yearly";

export type TierDefinition = {
  id: TierId;
  name: string;
  /** null = custom pricing (Enterprise only) */
  priceMonthlyUsd: number | null;
  /** null = no fixed monthly example cap */
  monthlyExampleLimit: number | null;
};

export const TIERS: Record<TierId, TierDefinition> = {
  free: {
    id: "free",
    name: "Free",
    priceMonthlyUsd: 0,
    monthlyExampleLimit: 500,
  },
  starter: {
    id: "starter",
    name: "Starter",
    priceMonthlyUsd: 299,
    monthlyExampleLimit: 10_000,
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceMonthlyUsd: 999,
    monthlyExampleLimit: 50_000,
  },
  scale: {
    id: "scale",
    name: "Scale",
    priceMonthlyUsd: 2999,
    monthlyExampleLimit: 200_000,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceMonthlyUsd: null,
    monthlyExampleLimit: null,
  },
};

/** Yearly plans bill 10× monthly (2 months free). */
export function yearlyPriceFromMonthlyUsd(monthlyUsd: number): number {
  return monthlyUsd * 10;
}

/** Savings vs paying monthly × 12 for one year. */
export function yearlySavingsUsd(monthlyUsd: number): number {
  return monthlyUsd * 12 - yearlyPriceFromMonthlyUsd(monthlyUsd);
}

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

/** Infinity means no cap (Enterprise). */
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
    value === "starter" ||
    value === "growth" ||
    value === "scale" ||
    value === "enterprise"
  );
}

export function isPaidSelfServeTierId(id: string): id is PaidSelfServeTierId {
  return (PAID_SELF_SERVE_TIER_IDS as readonly string[]).includes(id);
}
