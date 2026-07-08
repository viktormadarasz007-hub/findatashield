import type { Metadata } from "next";
import { Suspense } from "react";

import { PricingView } from "./PricingView";
import styles from "./pricing.module.css";

export const metadata: Metadata = {
  title: "Pricing — FinDataShield",
  description: "Subscription plans for synthetic financial data & EU AI Act compliance",
};

function PricingFallback() {
  return (
    <main className={styles.page}>
      <p className={styles.loading}>Loading pricing…</p>
    </main>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={<PricingFallback />}>
      <PricingView />
    </Suspense>
  );
}
