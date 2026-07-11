import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getAuthenticatedUser } from "@/lib/auth";
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
  if (tier === "growth") {
    return billing === "yearly"
      ? process.env.STRIPE_PRICE_ID_GROWTH_YEARLY
      : process.env.STRIPE_PRICE_ID_GROWTH;
  }

  return billing === "yearly"
    ? process.env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY
    : process.env.STRIPE_PRICE_ID_ENTERPRISE;
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
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      tier?: unknown;
      billing?: unknown;
    } | null;

    const tier = body?.tier;
    const billing: BillingPeriod = body?.billing === "yearly" ? "yearly" : "monthly";

    if (
      typeof tier !== "string" ||
      !(PAID_SELF_SERVE_TIER_IDS as readonly string[]).includes(tier)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid tier. Checkout is available for Growth and Enterprise. Choose Free for no charge, or Custom via Contact Sales.",
        },
        { status: 400 },
      );
    }

    const tierId = tier as PaidSelfServeTierId;
    const priceId = getPriceId(tierId, billing)?.trim();
    if (!priceId) {
      const hint =
        billing === "yearly"
          ? tierId === "growth"
            ? "STRIPE_PRICE_ID_GROWTH_YEARLY"
            : "STRIPE_PRICE_ID_ENTERPRISE_YEARLY"
          : tierId === "growth"
            ? "STRIPE_PRICE_ID_GROWTH"
            : "STRIPE_PRICE_ID_ENTERPRISE";
      return NextResponse.json(
        {
          error: `Stripe price ID missing for ${tierId} (${billing}). Add ${hint} to .env.local.`,
        },
        { status: 500 },
      );
    }

    const stripe = getStripe();
    const origin = appOrigin(request);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/pricing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=1`,
      metadata: { tier: tierId, billing, user_id: user.id },
      subscription_data: {
        metadata: { tier: tierId, billing, user_id: user.id },
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
