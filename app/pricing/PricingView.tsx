"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { PricingCards } from "@/components/PricingCards";
import {
  buildSignupUrl,
  parseCheckoutIntent,
} from "@/lib/checkout-intent";
import {
  createCheckoutSession,
  redirectToCheckout,
} from "@/lib/stripe-client";
import type { BillingPeriod, PaidSelfServeTierId, TierId } from "@/lib/subscription";

import styles from "./pricing.module.css";

export function PricingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedSessionRef = useRef<string | null>(null);
  const processedCheckoutRef = useRef<string | null>(null);
  const [checkoutTier, setCheckoutTier] = useState<PaidSelfServeTierId | null>(
    null,
  );
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const checkoutCanceled = searchParams.get("canceled") === "1";
  const pendingCheckout = parseCheckoutIntent(searchParams);

  const finalizeCheckout = useCallback(
    async (sessionId: string) => {
      setError(null);
      try {
        const res = await fetch(
          `/api/checkout/confirm?session_id=${encodeURIComponent(sessionId)}`,
        );
        const data = (await res.json()) as { tier?: TierId; error?: string };

        if (!res.ok) {
          throw new Error(data.error ?? "Could not confirm checkout.");
        }

        if (data.tier) {
          router.replace("/dashboard", {
            scroll: false,
          });
          return;
        }

        setBanner("Subscription updated. Thank you — your plan is now active.");
        router.replace("/pricing", { scroll: false });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Checkout confirmation failed.");
      }
    },
    [router],
  );

  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (sessionId && processedSessionRef.current !== sessionId) {
      processedSessionRef.current = sessionId;
      void finalizeCheckout(sessionId);
    }
  }, [finalizeCheckout, searchParams]);

  const handleSubscribe = useCallback(
    async (tier: PaidSelfServeTierId, billing: BillingPeriod) => {
      setError(null);
      setBanner(null);
      setCheckoutTier(tier);

      try {
        const result = await createCheckoutSession(tier, billing);

        if (!result.ok) {
          if (result.needsAuth) {
            router.push(buildSignupUrl({ tier, billing }));
            return;
          }
          throw new Error(result.error);
        }

        redirectToCheckout(result.url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Checkout failed.");
      } finally {
        setCheckoutTier(null);
      }
    },
    [router],
  );

  useEffect(() => {
    if (!pendingCheckout) {
      return;
    }

    const checkoutKey = `${pendingCheckout.tier}:${pendingCheckout.billing}`;
    if (processedCheckoutRef.current === checkoutKey) {
      return;
    }

    processedCheckoutRef.current = checkoutKey;
    router.replace("/pricing", { scroll: false });
    void handleSubscribe(pendingCheckout.tier, pendingCheckout.billing);
  }, [handleSubscribe, pendingCheckout, router]);

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topHeader}>
        <div className={styles.topHeaderInner}>
          <div className={styles.brand}>
            <Link href="/dashboard">FinDataShield</Link>
            <span className={styles.tagline}>
              Synthetic Financial Data & EU AI Act Compliance
            </span>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/datasets">My Datasets</Link>
            <Link href="/pricing" aria-current="page">
              Pricing
            </Link>
            <button
              type="button"
              className={styles.signOutButton}
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </nav>
        </div>
      </header>

      <div className={styles.shell}>
        <section className={styles.intro}>
          <h1>Simple, transparent pricing</h1>
          <p>
            Choose the plan that fits your team. Switch between monthly and yearly
            billing — save 17% with an annual plan. Usage resets on the first of
            each month.
          </p>
        </section>

        {checkoutCanceled && (
          <p className={styles.error}>
            Checkout was canceled. You can subscribe anytime.
          </p>
        )}
        {banner && <p className={styles.banner}>{banner}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <PricingCards
          variant="app"
          checkoutTier={checkoutTier}
          onSubscribe={(tier, billing) => void handleSubscribe(tier, billing)}
        />
      </div>
    </main>
  );
}
