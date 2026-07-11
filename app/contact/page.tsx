import Link from "next/link";

import styles from "../legal.module.css";

export default function ContactPage() {
  return (
    <main className={styles.page}>
      <article className={styles.container}>
        <Link href="/" className={styles.back}>
          ← Back to home
        </Link>
        <h1>Contact</h1>

        <div className={styles.contactCard}>
          <strong>FinDataShield</strong>
          <p>
            Email:{" "}
            <a href="mailto:viktorm@findatashield.com">viktorm@findatashield.com</a>
          </p>
          <p className={styles.contactNote}>
            We aim to respond to all enquiries within 24 hours on business days.
          </p>
        </div>
      </article>
    </main>
  );
}
