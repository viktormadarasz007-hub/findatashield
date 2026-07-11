import Link from "next/link";
import { Suspense } from "react";

import { LoginForm } from "./LoginForm";
import styles from "../auth/auth.module.css";

export default function LoginPage() {
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
        </div>
      </header>

      <section className={styles.card}>
        <h1>Sign in</h1>
        <p>Sign in to generate synthetic datasets and track your monthly usage.</p>

        <Suspense fallback={<p className={styles.footer}>Loading...</p>}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
