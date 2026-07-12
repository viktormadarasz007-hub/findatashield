import type { BillingPeriod, PaidSelfServeTierId } from "@/lib/subscription";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; needsAuth: true }
  | { ok: false; needsAuth: false; error: string };

export async function createCheckoutSession(
  tier: PaidSelfServeTierId,
  billing: BillingPeriod,
): Promise<CheckoutResult> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier, billing }),
  });

  const data = (await res.json()) as { url?: string; error?: string };

  if (res.status === 401) {
    return { ok: false, needsAuth: true };
  }

  if (!res.ok) {
    return {
      ok: false,
      needsAuth: false,
      error: data.error ?? "Could not start checkout.",
    };
  }

  if (!data.url) {
    return { ok: false, needsAuth: false, error: "No checkout URL returned." };
  }

  return { ok: true, url: data.url };
}

export function redirectToCheckout(url: string): void {
  window.location.assign(url);
}
