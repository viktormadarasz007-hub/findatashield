import {
  type BillingPeriod,
  PAID_SELF_SERVE_TIER_IDS,
  type PaidSelfServeTierId,
} from "@/lib/subscription";

import {
  createCheckoutSession,
  redirectToCheckout,
} from "@/lib/stripe-client";

export type CheckoutIntent = {
  tier: PaidSelfServeTierId;
  billing: BillingPeriod;
};

function isPaidSelfServeTier(value: string | null): value is PaidSelfServeTierId {
  return (
    value !== null &&
    (PAID_SELF_SERVE_TIER_IDS as readonly string[]).includes(value)
  );
}

function normalizeBilling(value: string | null): BillingPeriod {
  return value === "yearly" ? "yearly" : "monthly";
}

export function parseCheckoutIntent(
  searchParams: Pick<URLSearchParams, "get">,
): CheckoutIntent | null {
  const tier = searchParams.get("tier") ?? searchParams.get("checkout");
  const billing = normalizeBilling(searchParams.get("billing"));

  if (!isPaidSelfServeTier(tier)) {
    return null;
  }

  return { tier, billing };
}

export function buildSignupUrl(intent?: CheckoutIntent | null): string {
  if (!intent) {
    return "/signup";
  }

  const params = new URLSearchParams({
    tier: intent.tier,
    billing: intent.billing,
  });
  return `/signup?${params.toString()}`;
}

export function buildLoginUrl(intent?: CheckoutIntent | null): string {
  if (!intent) {
    return "/login";
  }

  const params = new URLSearchParams({
    tier: intent.tier,
    billing: intent.billing,
  });
  return `/login?${params.toString()}`;
}

export function buildPricingCheckoutUrl(intent: CheckoutIntent): string {
  const params = new URLSearchParams({
    checkout: intent.tier,
    billing: intent.billing,
  });
  return `/pricing?${params.toString()}`;
}

export function buildAuthCallbackUrl(intent?: CheckoutIntent | null): string {
  const url = new URL("/auth/callback", "http://local");
  if (intent) {
    url.searchParams.set("tier", intent.tier);
    url.searchParams.set("billing", intent.billing);
  }
  return `${url.pathname}${url.search}`;
}

export async function startPaidCheckout(
  intent: CheckoutIntent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await createCheckoutSession(intent.tier, intent.billing);

  if (!result.ok) {
    return {
      ok: false,
      error: result.needsAuth
        ? "Authentication required."
        : result.error,
    };
  }

  redirectToCheckout(result.url);
  return { ok: true };
}
