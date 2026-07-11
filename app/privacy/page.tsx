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
        <p className={styles.updated}>Last updated: July 2026</p>

        <p>
          FinDataShield (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) respects
          your privacy. This Privacy Policy explains how we collect, use, store, and
          protect personal information when you use our website and SaaS platform
          (the &quot;Service&quot;).
        </p>

        <h2>1. Information We Collect</h2>
        <p>We collect the following categories of information:</p>
        <ul>
          <li>
            <strong>Account information:</strong> your email address and authentication
            credentials when you register or sign in.
          </li>
          <li>
            <strong>Usage data:</strong> your subscription tier, monthly example usage,
            generation history metadata (such as data type, example count, and
            timestamps), and records of datasets saved to your account.
          </li>
          <li>
            <strong>Billing information:</strong> payment and subscription details
            processed by our payment provider, Stripe. We do not store full payment
            card numbers on our servers.
          </li>
          <li>
            <strong>Technical data:</strong> basic log and session information needed
            to operate and secure the Service, such as browser type, IP address, and
            cookie identifiers described below.
          </li>
        </ul>

        <h2>2. How We Use Your Information</h2>
        <p>We use personal information to:</p>
        <ul>
          <li>Create and manage your account.</li>
          <li>Authenticate access and maintain session security.</li>
          <li>Enforce subscription plan limits and track monthly usage.</li>
          <li>Process payments and manage billing through Stripe.</li>
          <li>Save your generated datasets and compliance reports to your account.</li>
          <li>Respond to support requests and service-related communications.</li>
          <li>Improve reliability, security, and performance of the Service.</li>
        </ul>

        <h2>3. Generated Datasets Belong to You</h2>
        <p>
          Datasets and compliance reports you generate through FinDataShield belong to
          you. We store this content in your account so you can access, download, and
          manage your generation history. We do not use your Generated Data to train
          third-party models or sell it to other parties.
        </p>

        <h2>4. We Do Not Sell Your Data</h2>
        <p>
          FinDataShield does not sell, rent, or trade your personal information to
          third parties for their marketing purposes. We share information only with
          service providers that help us operate the Service (such as Supabase for
          authentication and database hosting, Stripe for payments, and Anthropic for
          AI generation), and only as necessary to provide the Service under
          appropriate contractual safeguards.
        </p>

        <h2>5. Data Storage and Security</h2>
        <p>
          Account and usage data are stored in secure cloud infrastructure. We apply
          access controls, encryption in transit, and other reasonable technical and
          organizational measures to protect your information. No method of storage or
          transmission is completely secure, and we cannot guarantee absolute security.
        </p>

        <h2>6. Cookies and Similar Technologies</h2>
        <p>
          We use essential cookies and similar technologies to maintain your login
          session, remember authentication state, and protect the Service. These cookies
          are necessary for the platform to function and are not used for third-party
          advertising. You can control cookies through your browser settings, but
          disabling essential cookies may prevent you from using authenticated features.
        </p>

        <h2>7. Data Retention</h2>
        <p>
          We retain account and usage information for as long as your account is
          active or as needed to provide the Service, comply with legal obligations,
          resolve disputes, and enforce our agreements. You may request deletion of
          your account by contacting us.
        </p>

        <h2>8. Your Rights</h2>
        <p>
          Depending on your location, you may have rights to access, correct, delete,
          or restrict processing of your personal information. To exercise these
          rights, contact us at the email below. We will respond within a reasonable
          timeframe and in accordance with applicable law.
        </p>

        <h2>9. International Users</h2>
        <p>
          FinDataShield is operated from Australia. If you access the Service from
          outside Australia, your information may be processed in countries where our
          service providers operate. We take steps to ensure appropriate protections
          are in place where required by law.
        </p>

        <h2>10. Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. Changes will be posted
          on this page with an updated date. Continued use of the Service after changes
          take effect constitutes acceptance of the revised policy.
        </p>

        <h2>11. Contact Us</h2>
        <p>
          For privacy questions or requests, contact{" "}
          <a href="mailto:viktorm@findatashield.com">viktorm@findatashield.com</a>.
        </p>
      </article>
    </main>
  );
}
