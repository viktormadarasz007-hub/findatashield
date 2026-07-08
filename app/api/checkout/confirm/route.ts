import { NextResponse } from "next/server";
import Stripe from "stripe";

import type { TierId } from "@/lib/subscription";

const VALID_CHECKOUT_TIERS: TierId[] = ["starter", "growth", "scale"];

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(key);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id query parameter." },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    let tier = session.metadata?.tier as TierId | undefined;
    if (!tier || !VALID_CHECKOUT_TIERS.includes(tier)) {
      tier = undefined;
    }

    if (!tier && session.subscription) {
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;

      const sub = await stripe.subscriptions.retrieve(subId);
      const metaTier = sub.metadata?.tier as TierId | undefined;
      if (metaTier && VALID_CHECKOUT_TIERS.includes(metaTier)) {
        tier = metaTier;
      }
    }

    if (!tier) {
      return NextResponse.json(
        { error: "Could not resolve subscription tier from checkout session." },
        { status: 422 },
      );
    }

    return NextResponse.json({
      tier,
      payment_status: session.payment_status,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to verify checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
