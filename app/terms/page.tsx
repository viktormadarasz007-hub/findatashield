import Link from "next/link";

import styles from "../legal.module.css";

export default function TermsPage() {
  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <Link href="/" className={styles.back}>
          ← Back to home
        </Link>
        <h1>Terms of Service</h1>
        <p>
          By using FinDataShield, you agree to use the platform for lawful synthetic
          data generation and AI model development purposes only.
        </p>
        <p>
          Generated datasets are fully synthetic and must not be represented as real
          customer data. You are responsible for ensuring your use of generated data
          complies with applicable regulations in your jurisdiction.
        </p>
        <p>
          Subscription plans, usage limits, and pricing are subject to change with
          notice. Paid subscriptions renew monthly unless canceled.
        </p>
        <p>
          For questions about these terms, contact{" "}
          <a href="mailto:viktorm@findatashield.com">viktorm@findatashield.com</a>.
        </p>
      </article>
    </main>
  );
}
