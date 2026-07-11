import Link from "next/link";

import {
  type PaidSelfServeTierId,
  TIERS,
  type TierId,
} from "@/lib/subscription";

import styles from "./pricing-cards.module.css";

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

type PricingCardsProps = {
  variant: "landing" | "app";
  checkoutTier?: PaidSelfServeTierId | null;
  onSubscribe?: (tier: PaidSelfServeTierId) => void;
};

export function PricingCards({
  variant,
  checkoutTier = null,
  onSubscribe,
}: PricingCardsProps) {
  return (
    <div className={styles.grid}>
      {DISPLAY_ORDER.map((id) => {
        const tier = TIERS[id];
        const isCustom = id === "custom";
        const isFree = id === "free";
        const isPopular = tier.recommended === true;
        const isPaidSelfServe = id === "growth" || id === "enterprise";

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

            <h3>{tier.name}</h3>
            <p className={styles.description}>{tier.description}</p>

            {isCustom ? (
              <>
                <p className={styles.price}>Pricing on request</p>
                <p className={styles.period}>
                  Custom example volume tailored to your needs
                </p>
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
              <a className={styles.ctaSecondary} href={CONTACT_SALES_MAIL}>
                Contact Sales
              </a>
            ) : isFree ? (
              variant === "landing" ? (
                <Link className={styles.ctaOutline} href="/signup">
                  Start free
                </Link>
              ) : (
                <Link className={styles.ctaOutline} href="/dashboard">
                  Go to dashboard
                </Link>
              )
            ) : variant === "landing" ? (
              <Link
                className={isPopular ? styles.ctaPopular : styles.ctaPrimary}
                href="/signup"
              >
                Get started
              </Link>
            ) : isPaidSelfServe ? (
              <button
                type="button"
                className={isPopular ? styles.ctaPopular : styles.ctaPrimary}
                disabled={checkoutTier !== null}
                onClick={() => onSubscribe?.(id as PaidSelfServeTierId)}
              >
                {checkoutTier === id ? "Redirecting…" : "Subscribe"}
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
