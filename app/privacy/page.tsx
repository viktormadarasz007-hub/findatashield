import Link from "next/link";

import styles from "../legal.module.css";

export default function PrivacyPage() {
  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <Link href="/" className={styles.back}>
          ← Back to home
        </Link>
        <h1>Privacy Policy</h1>
        <p>
          FinDataShield collects account information (email address) and usage data
          necessary to provide the service, enforce plan limits, and improve platform
          reliability.
        </p>
        <p>
          Generated datasets are synthetic. We do not require or store real customer
          financial records. Usage metrics such as examples generated and subscription
          tier are stored securely in our database.
        </p>
        <p>
          We do not sell personal information. Data is processed in accordance with
          applicable privacy regulations including GDPR where applicable.
        </p>
        <p>
          For privacy inquiries, contact{" "}
          <a href="mailto:viktorm@findatashield.com">viktorm@findatashield.com</a>.
        </p>
      </article>
    </main>
  );
}
