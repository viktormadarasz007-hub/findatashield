import { NextResponse } from "next/server";
import Stripe from "stripe";

import { getAuthenticatedUser } from "@/lib/auth";
import type { TierId } from "@/lib/subscription";
import { setUserTier } from "@/lib/usage-db";

const VALID_CHECKOUT_TIERS: TierId[] = ["growth", "enterprise"];

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured.");
  }
  return new Stripe(key);
}

export async function GET(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

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

    const sessionUserId = session.metadata?.user_id;
    if (sessionUserId && sessionUserId !== user.id) {
      return NextResponse.json(
        { error: "Checkout session does not belong to the signed-in user." },
        { status: 403 },
      );
    }

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

    const usage = await setUserTier(user.id, tier, user.email);

    return NextResponse.json({
      tier,
      usage,
      payment_status: session.payment_status,
    });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Failed to verify checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
