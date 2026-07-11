import Link from "next/link";

import { PricingCards } from "@/components/PricingCards";

import styles from "./landing.module.css";

const SAMPLE_ROWS = [
  {
    transaction_id: "TXN-48291",
    amount: "$1,247.50",
    merchant: "GlobalPay Ltd",
    risk_score: "0.92",
    fraud_label: "Confirmed",
  },
  {
    transaction_id: "TXN-48292",
    amount: "$89.00",
    merchant: "RetailCo",
    risk_score: "0.14",
    fraud_label: "Legitimate",
  },
  {
    transaction_id: "TXN-48293",
    amount: "$3,420.00",
    merchant: "WireTransfer EU",
    risk_score: "0.87",
    fraud_label: "Suspected",
  },
];

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroTop}>
            <Link href="/" className={styles.logo}>
              FinDataShield
            </Link>
            <nav className={styles.heroNav}>
              <a href="#pricing">Pricing</a>
              <Link href="/login">Sign in</Link>
            </nav>
          </div>

          <div className={styles.heroContent}>
            <p className={styles.heroEyebrow}>FinDataShield</p>
            <h1>
              Synthetic Financial Training Data with EU AI Act Compliance — Built
              for Fintech AI Teams
            </h1>
            <p className={styles.heroLead}>
              Generate realistic fraud transactions, credit profiles, and compliance
              documents in seconds — with automatic EU AI Act compliance reports and
              ready-to-use CSV exports.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryButton} href="/signup">
                Start Free
              </Link>
              <a className={styles.secondaryButton} href="#pricing">
                View Pricing
              </a>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.container}>
          <span className={styles.sectionLabel}>The Problem</span>
          <h2>Fintech teams need realistic data — without real customer risk</h2>
          <p className={styles.sectionLead}>
            ML and fraud teams struggle to obtain realistic transaction datasets for
            model training. Production data is locked behind privacy walls, synthetic
            vendors are expensive, and using real customer records creates GDPR, PCI,
            and regulatory exposure. Most teams spend months negotiating data access
            before writing a single training pipeline.
          </p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`}>
        <div className={styles.container}>
          <span className={styles.sectionLabel}>The Solution</span>
          <h2>Production-grade synthetic data, generated on demand</h2>
          <div className={styles.featureGrid}>
            <article className={styles.featureCard}>
              <h3>Generate in seconds</h3>
              <p>
                Create synthetic fraud transactions, credit profiles, and compliance
                documents instantly — no data engineering pipeline required.
              </p>
            </article>
            <article className={styles.featureCard}>
              <h3>EU AI Act compliance included</h3>
              <p>
                Every dataset ships with an automatic EU AI Act compliance report,
                documenting synthetic confirmation, PII absence, and risk
                classification.
              </p>
            </article>
            <article className={styles.featureCard}>
              <h3>CSV-ready for model training</h3>
              <p>
                Download structured CSV datasets for immediate use in fraud detection,
                credit scoring, and compliance model development.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.container}>
          <span className={styles.sectionLabel}>Platform Preview</span>
          <h2>See what your team gets on every generation</h2>
          <div className={styles.mockup}>
            <div className={styles.mockupChrome}>
              <span />
              <span />
              <span />
              <p>FinDataShield Dashboard</p>
            </div>
            <div className={styles.mockupBody}>
              <div className={styles.mockupTableWrap}>
                <table className={styles.mockupTable}>
                  <thead>
                    <tr>
                      <th>transaction_id</th>
                      <th>amount</th>
                      <th>merchant</th>
                      <th>risk_score</th>
                      <th>fraud_label</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SAMPLE_ROWS.map((row) => (
                      <tr key={row.transaction_id}>
                        <td>{row.transaction_id}</td>
                        <td>{row.amount}</td>
                        <td>{row.merchant}</td>
                        <td>{row.risk_score}</td>
                        <td>{row.fraud_label}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className={styles.mockupCompliance}>
                <div className={styles.mockupComplianceHeader}>
                  <strong>EU AI Act Compliance Report</strong>
                  <span>COMPLIANT</span>
                </div>
                <div className={styles.mockupComplianceBody}>
                  <div>
                    <span>Dataset Type</span>
                    <strong>Fraud Transactions</strong>
                  </div>
                  <div>
                    <span>Quality Score</span>
                    <strong>97%</strong>
                  </div>
                  <div>
                    <span>Synthetic Confirmed</span>
                    <strong>true</strong>
                  </div>
                  <div>
                    <span>PII Confirmed Absent</span>
                    <strong>true</strong>
                  </div>
                  <div>
                    <span>Risk Classification</span>
                    <strong>Limited Risk — EU AI Act Article 6</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.sectionAlt}`} id="pricing">
        <div className={styles.container}>
          <span className={styles.sectionLabel}>Pricing</span>
          <h2>Simple, transparent plans</h2>
          <p className={styles.sectionLead}>
            Start free with 500 examples per month. Switch between monthly and yearly
            billing — save 17% with an annual plan. All prices in USD.
          </p>
          <PricingCards variant="landing" />
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <strong className={styles.footerBrand}>FinDataShield</strong>
            <p>Synthetic Financial Data & EU AI Act Compliance</p>
          </div>
          <nav className={styles.footerNav}>
            <Link href="/terms">Terms</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </div>
        <p className={styles.footerCopy}>
          © {new Date().getFullYear()} FinDataShield. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
