import { NextResponse } from "next/server";
import Stripe from "stripe";

import {
  type BillingPeriod,
  type PaidSelfServeTierId,
  PAID_SELF_SERVE_TIER_IDS,
} from "@/lib/subscription";

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(key);
}

function getPriceId(
  tier: PaidSelfServeTierId,
  billing: BillingPeriod,
): string | undefined {
  const env =
    tier === "starter"
      ? billing === "monthly"
        ? process.env.STRIPE_PRICE_ID_STARTER_MONTHLY
        : process.env.STRIPE_PRICE_ID_STARTER_YEARLY
      : tier === "growth"
        ? billing === "monthly"
          ? process.env.STRIPE_PRICE_ID_GROWTH_MONTHLY
          : process.env.STRIPE_PRICE_ID_GROWTH_YEARLY
        : billing === "monthly"
          ? process.env.STRIPE_PRICE_ID_SCALE_MONTHLY
          : process.env.STRIPE_PRICE_ID_SCALE_YEARLY;
  return env?.trim() || undefined;
}

function appOrigin(request: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (envUrl) return envUrl;
  const host = request.headers.get("host");
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return "http://localhost:3000";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      tier?: unknown;
      billing?: unknown;
    } | null;

    const tier = body?.tier;
    const billingRaw = body?.billing;

    if (
      typeof tier !== "string" ||
      !(PAID_SELF_SERVE_TIER_IDS as readonly string[]).includes(tier)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid tier. Checkout is available for Starter, Growth, and Scale. Choose Free for no charge, or Enterprise via Contact Sales.",
        },
        { status: 400 },
      );
    }

    const billing: BillingPeriod =
      billingRaw === "yearly" ? "yearly" : "monthly";

    const tierId = tier as PaidSelfServeTierId;
    const priceId = getPriceId(tierId, billing);
    if (!priceId) {
      const hint =
        billing === "monthly"
          ? "STRIPE_PRICE_ID_STARTER_MONTHLY, STRIPE_PRICE_ID_GROWTH_MONTHLY, STRIPE_PRICE_ID_SCALE_MONTHLY"
          : "STRIPE_PRICE_ID_STARTER_YEARLY, STRIPE_PRICE_ID_GROWTH_YEARLY, STRIPE_PRICE_ID_SCALE_YEARLY";
      return NextResponse.json(
        {
          error: `Stripe price ID missing for ${tierId} (${billing} billing). Add ${hint} to .env.local.`,
        },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const origin = appOrigin(request);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      metadata: { tier: tierId, billing },
      subscription_data: {
        metadata: { tier: tierId, billing },
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Checkout session did not return a URL." },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
