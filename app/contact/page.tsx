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
        <p>
          Have questions about FinDataShield, enterprise plans, or EU AI Act
          compliance reporting? We&apos;d love to hear from you.
        </p>
        <p>
          Email:{" "}
          <a href="mailto:viktorm@findatashield.com">viktorm@findatashield.com</a>
        </p>
        <p>
          For custom volume plans and dedicated support, include your team size and
          expected monthly example volume in your message.
        </p>
      </article>
    </main>
  );
}
