"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  type BillingPeriod,
  type PaidSelfServeTierId,
  type TierId,
  TIERS,
  yearlyPriceFromMonthlyUsd,
  yearlySavingsUsd,
} from "@/lib/subscription";

import styles from "./pricing.module.css";

const DISPLAY_ORDER: TierId[] = [
  "free",
  "starter",
  "growth",
  "scale",
  "enterprise",
];

const CONTACT_SALES_MAIL =
  "mailto:hello@findata.ai?subject=FinDataShield%20Enterprise";

function formatUsd(n: number): string {
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
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("monthly");
  const [checkoutTier, setCheckoutTier] = useState<PaidSelfServeTierId | null>(
    null,
  );
  const [banner, setBanner] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          router.replace(`/?plan=${encodeURIComponent(data.tier)}`, {
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
    if (
      sessionId &&
      processedSessionRef.current !== sessionId
    ) {
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
        body: JSON.stringify({ tier, billing: billingPeriod }),
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

  return (
    <main className={styles.page}>
      <header className={styles.topHeader}>
        <div className={styles.topHeaderInner}>
          <div className={styles.brand}>
            <Link href="/">FinDataShield</Link>
            <span className={styles.tagline}>Synthetic Financial Data & EU AI Act Compliance</span>
          </div>
          <nav className={styles.nav}>
            <Link href="/">Dashboard</Link>
            <Link href="/pricing" aria-current="page">
              Pricing
            </Link>
          </nav>
        </div>
      </header>

      <div className={styles.shell}>
        <section className={styles.intro}>
          <h1>Plans &amp; pricing</h1>
          <p>
            Pick the volume that fits your team. Paid plans reset usage on the first of
            each month. Annual billing includes two months free (10× monthly). Enterprise
            is tailored to your organization.
          </p>
        </section>

        <div className={styles.billingToggleWrap}>
          <span className={styles.billingToggleLabel}>Billing</span>
          <div className={styles.billingToggle} role="tablist" aria-label="Billing period">
            <button
              type="button"
              role="tab"
              aria-selected={billingPeriod === "monthly"}
              className={
                billingPeriod === "monthly" ? styles.billingTabActive : styles.billingTab
              }
              onClick={() => setBillingPeriod("monthly")}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billingPeriod === "yearly"}
              className={
                billingPeriod === "yearly" ? styles.billingTabActive : styles.billingTab
              }
              onClick={() => setBillingPeriod("yearly")}
            >
              Yearly
              <span className={styles.twoMonthsFree}>2 mo free</span>
            </button>
          </div>
        </div>

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
            const isEnterprise = id === "enterprise";
            const isFree = id === "free";
            const monthly = tier.priceMonthlyUsd;

            return (
              <article key={id} className={styles.card}>
                <h2>{tier.name}</h2>

                {isEnterprise ? (
                  <>
                    <p className={styles.priceCustom}>Custom pricing</p>
                    <p className={styles.period}>Volume &amp; terms built for your team</p>
                    <p className={styles.limit}>Unlimited examples</p>
                    <a className={styles.contactSales} href={CONTACT_SALES_MAIL}>
                      Contact Sales
                    </a>
                  </>
                ) : isFree ? (
                  <>
                    <p className={styles.price}>{formatUsd(0)}</p>
                    <p className={styles.period}>
                      {billingPeriod === "yearly" ? "per year" : "per month"} · always free
                    </p>
                    <p className={styles.limit}>
                      {formatCount(tier.monthlyExampleLimit!)} examples / month
                    </p>
                    <Link className={styles.chooseFree} href="/?plan=free">
                      Start free
                    </Link>
                  </>
                ) : (
                  <>
                    {billingPeriod === "monthly" ? (
                      <>
                        <p className={styles.price}>{formatUsd(monthly!)}</p>
                        <p className={styles.period}>per month</p>
                        <p className={styles.savingsHint}>
                          Save {formatUsd(yearlySavingsUsd(monthly!))}/year with yearly
                          billing
                        </p>
                      </>
                    ) : (
                      <>
                        <p className={styles.price}>
                          {formatUsd(yearlyPriceFromMonthlyUsd(monthly!))}
                        </p>
                        <p className={styles.period}>per year, billed annually</p>
                        <p className={styles.savingsBadge}>
                          Save {formatUsd(yearlySavingsUsd(monthly!))}/year
                        </p>
                      </>
                    )}
                    <p className={styles.limit}>
                      {formatCount(tier.monthlyExampleLimit!)} examples / month
                    </p>
                    <button
                      type="button"
                      className={styles.subscribe}
                      disabled={checkoutTier !== null}
                      onClick={() => void handleSubscribe(id)}
                    >
                      {checkoutTier === id ? "Redirecting…" : "Subscribe"}
                    </button>
                  </>
                )}
              </article>
            );
          })}
        </div>

        <p className={styles.note}>
          Stripe test mode: create recurring monthly and yearly Prices for Starter, Growth,
          and Scale, then set{" "}
          <code>
            STRIPE_PRICE_ID_STARTER_MONTHLY, STRIPE_PRICE_ID_STARTER_YEARLY,
            STRIPE_PRICE_ID_GROWTH_MONTHLY, STRIPE_PRICE_ID_GROWTH_YEARLY,
            STRIPE_PRICE_ID_SCALE_MONTHLY, STRIPE_PRICE_ID_SCALE_YEARLY
          </code>{" "}
          in <code>.env.local</code>. Yearly Prices should match 10× your monthly rate (two
          months free). Free and Enterprise use the dashboard without Stripe checkout.
        </p>
      </div>
    </main>
  );
}
