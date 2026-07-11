"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  type PaidSelfServeTierId,
  type TierId,
  TIERS,
} from "@/lib/subscription";

import styles from "./pricing.module.css";

const DISPLAY_ORDER: TierId[] = ["free", "growth", "enterprise", "custom"];

const CONTACT_SALES_MAIL =
  "mailto:viktorm@findatashield.com?subject=FinDataShield%20Custom%20Plan";

function formatUsdAmount(n: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function PricingView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processedSessionRef = useRef<string | null>(null);
  const [checkoutTier, setCheckoutTier] = useState<PaidSelfServeTierId | null>(
    null,
  );
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const checkoutCanceled = searchParams.get("canceled") === "1";

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
          router.replace("/", {
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

  async function handleSubscribe(tier: PaidSelfServeTierId) {
    setError(null);
    setBanner(null);
    setCheckoutTier(tier);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });

      const data = (await res.json()) as { url?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error ?? "Could not start checkout.");
      }

      if (!data.url) {
        throw new Error("No checkout URL returned.");
      }

      const link = document.createElement("a");
      link.href = data.url;
      link.rel = "noopener noreferrer";
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed.");
    } finally {
      setCheckoutTier(null);
    }
  }

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
            <Link href="/">FinDataShield</Link>
            <span className={styles.tagline}>
              Synthetic Financial Data & EU AI Act Compliance
            </span>
          </div>
          <nav className={styles.nav}>
            <Link href="/">Dashboard</Link>
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
            Choose the plan that fits your team. All paid plans are billed monthly in
            USD. Usage resets on the first of each month.
          </p>
        </section>

        {checkoutCanceled && (
          <p className={styles.error}>
            Checkout was canceled. You can subscribe anytime.
          </p>
        )}
        {banner && <p className={styles.banner}>{banner}</p>}
        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.grid}>
          {DISPLAY_ORDER.map((id) => {
            const tier = TIERS[id];
            const isCustom = id === "custom";
            const isFree = id === "free";
            const isPopular = tier.recommended === true;

            return (
              <article
                key={id}
                className={
                  isPopular ? `${styles.card} ${styles.cardPopular}` : styles.card
                }
              >
                {isPopular && (
                  <span className={styles.popularBadge}>Most Popular</span>
                )}

                <h2>{tier.name}</h2>
                <p className={styles.description}>{tier.description}</p>

                {isCustom ? (
                  <>
                    <p className={styles.price}>Pricing on request</p>
                    <p className={styles.period}>Custom example volume tailored to your needs</p>
                  </>
                ) : isFree ? (
                  <>
                    <p className={styles.price}>{formatUsdAmount(0)} USD</p>
                    <p className={styles.period}>forever</p>
                  </>
                ) : (
                  <>
                    <p className={styles.price}>
                      {formatUsdAmount(tier.priceMonthlyUsd!)} USD/month
                    </p>
                    <p className={styles.period}>billed monthly</p>
                  </>
                )}

                <p className={styles.limit}>
                  {tier.monthlyExampleLimit === null
                    ? "Custom example volume"
                    : `${formatCount(tier.monthlyExampleLimit)} examples / month`}
                </p>

                {isCustom ? (
                  <a className={styles.contactSales} href={CONTACT_SALES_MAIL}>
                    Contact Sales
                  </a>
                ) : isFree ? (
                  <Link className={styles.chooseFree} href="/">
                    Go to dashboard
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={isPopular ? styles.subscribePopular : styles.subscribe}
                    disabled={checkoutTier !== null}
                    onClick={() => void handleSubscribe(id)}
                  >
                    {checkoutTier === id ? "Redirecting…" : "Subscribe"}
                  </button>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
