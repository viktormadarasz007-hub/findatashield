"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  downloadComplianceReportPdf,
  type ComplianceReport,
} from "@/lib/compliance-pdf";
import { csvFilename, downloadCsvFile } from "@/lib/dataset-export";
import {
  getTierLimit,
  MONTHLY_LIMIT_ERROR,
  TIERS,
  tierHasFixedMonthlyLimit,
  type TierId,
} from "@/lib/subscription";
import type { UsageSnapshot } from "@/lib/usage-db";

import styles from "./dashboard.module.css";

type DataType =
  | "Fraud Transactions"
  | "Credit Profiles"
  | "Compliance Documents"
  | "Customer Service Logs";

type GenerateResponse = {
  type: DataType;
  count: number;
  generatedAt: string;
  data: Array<Record<string, unknown>>;
  compliance_report: ComplianceReport;
  usage: UsageSnapshot;
};

const DATA_TYPES: DataType[] = [
  "Fraud Transactions",
  "Credit Profiles",
  "Compliance Documents",
  "Customer Service Logs",
];

function formatExampleCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function Home() {
  const router = useRouter();
  const [type, setType] = useState<DataType>("Fraud Transactions");
  const [count, setCount] = useState<number>(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingUsage, setIsLoadingUsage] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [usage, setUsage] = useState<UsageSnapshot | null>(null);

  const rows = useMemo(() => result?.data ?? [], [result?.data]);

  const loadUsage = useCallback(async () => {
    const response = await fetch("/api/usage");
    const payload = (await response.json()) as UsageSnapshot & { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load usage.");
    }

    setUsage(payload);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadUsage();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load usage.");
      } finally {
        setIsLoadingUsage(false);
      }
    })();
  }, [loadUsage]);

  const hasData = rows.length > 0;

  const columns = useMemo(
    () => Array.from(new Set(rows.flatMap((row) => Object.keys(row)))),
    [rows],
  );

  const qualityScore = useMemo(() => {
    if (!rows.length || !columns.length) return 0;

    const totalCells = rows.length * columns.length;
    let populatedCells = 0;

    for (const row of rows) {
      for (const column of columns) {
        const value = row[column];
        if (
          value !== null &&
          value !== undefined &&
          !(typeof value === "string" && value.trim() === "")
        ) {
          populatedCells += 1;
        }
      }
    }

    return Math.max(0, Math.min(100, Math.round((populatedCells / totalCells) * 100)));
  }, [columns, rows]);

  const tier = usage?.tier ?? "free";
  const isAdmin = usage?.is_admin === true;
  const planName = usage?.plan_name ?? TIERS[tier as TierId].name;
  const usedThisMonth = usage?.examples_used ?? 0;
  const hasMonthlyCap = !isAdmin && tierHasFixedMonthlyLimit(tier);
  const monthlyLimit = usage?.limit ?? getTierLimit(tier);
  const usagePercent =
    hasMonthlyCap && Number.isFinite(monthlyLimit)
      ? Math.min(100, (usedThisMonth / monthlyLimit) * 100)
      : 0;

  async function handleGenerate() {
    setError(null);

    if (usage && !usage.is_admin) {
      const limit = usage.limit;
      if (Number.isFinite(limit) && usedThisMonth + count > limit) {
        setError(MONTHLY_LIMIT_ERROR);
        return;
      }
    }

    setIsGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ type, count }),
      });

      const payload = (await response.json()) as GenerateResponse & {
        error?: string;
        usage?: UsageSnapshot;
      };

      if (!response.ok) {
        if (payload.usage) {
          setUsage(payload.usage);
        }
        throw new Error(payload.error ?? "Generation failed.");
      }

      setResult(payload);
      setUsage(payload.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  }

  function handleDownloadCsv() {
    if (!result?.data?.length) return;

    downloadCsvFile(
      csvFilename(result.type, result.count),
      result.data,
    );
  }

  function handleDownloadCompliancePdf() {
    if (!result?.compliance_report) return;
    downloadComplianceReportPdf(result.compliance_report);
  }

  return (
    <main className={styles.page}>
      <header className={styles.topHeader}>
        <div className={styles.topHeaderInner}>
          <div className={styles.brandBlock}>
            <h1>FinDataShield</h1>
            <p>Synthetic Financial Data & EU AI Act Compliance</p>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard" aria-current="page">
              Dashboard
            </Link>
            <Link href="/datasets">My Datasets</Link>
            <Link href="/pricing">Pricing</Link>
            <button
              type="button"
              className={styles.signOutButton}
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
            >
              {isSigningOut ? "Signing out..." : "Sign out"}
            </button>
          </nav>
        </div>
      </header>

      <section className={styles.dashboard}>
        <header className={styles.header}>
          <h2>FinDataShield — Synthetic Financial Data & EU AI Act Compliance</h2>
          <p>
            Generate realistic synthetic datasets for model training, QA, and sandbox
            testing.
          </p>
        </header>

        <section className={styles.usageSection}>
          <div className={styles.usageHeader}>
            <div>
              <span className={styles.usageLabel}>Monthly usage</span>
              <p className={styles.usagePlan}>
                Plan:{" "}
                <strong>{planName}</strong>
                {!isAdmin && (
                  <Link href="/pricing" className={styles.usageUpgrade}>
                    Upgrade
                  </Link>
                )}
              </p>
            </div>
          </div>
          {isLoadingUsage ? (
            <p className={styles.usageCounts}>Loading usage...</p>
          ) : hasMonthlyCap ? (
            <>
              <p className={styles.usageCounts}>
                {formatExampleCount(usedThisMonth)} /{" "}
                {formatExampleCount(monthlyLimit)}{" "}
                examples used this month
              </p>
              <div className={styles.usageTrack}>
                <div
                  className={styles.usageFill}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </>
          ) : isAdmin ? (
            <>
              <p className={styles.usageCounts}>
                {formatExampleCount(usedThisMonth)} examples generated this month
              </p>
              <p className={styles.usageUnlimited}>
                Admin account — unlimited generation with no monthly cap.
              </p>
            </>
          ) : (
            <>
              <p className={styles.usageCounts}>
                {formatExampleCount(usedThisMonth)} examples generated this month
              </p>
              <p className={styles.usageUnlimited}>
                Your plan includes a custom example volume tailored to your needs.
              </p>
            </>
          )}
        </section>

        <div className={styles.controls}>
          <label className={styles.field}>
            <span>Data Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as DataType)}
              disabled={isGenerating}
            >
              {DATA_TYPES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>Examples to Generate</span>
            <input
              type="number"
              min={1}
              max={10000}
              value={count}
              disabled={isGenerating}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                if (Number.isNaN(parsed)) {
                  setCount(1);
                  return;
                }
                setCount(Math.min(10000, Math.max(1, parsed)));
              }}
            />
          </label>
        </div>

        <button
          className={styles.generateButton}
          onClick={() => void handleGenerate()}
          disabled={isGenerating || isLoadingUsage}
        >
          {isGenerating ? "Generating..." : "Generate"}
        </button>

        {isGenerating && (
          <div className={styles.progressContainer}>
            <div className={styles.progressBar} />
            <span>Claude is generating your synthetic dataset...</span>
          </div>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <section className={styles.results}>
          <div className={styles.resultsHeader}>
            <h2>Generated Results</h2>
            <button
              className={styles.downloadButton}
              disabled={!hasData}
              onClick={handleDownloadCsv}
            >
              Download as CSV
            </button>
          </div>

          {hasData ? (
            <>
              <div className={styles.datasetReady}>
                Dataset ready - {result?.count ?? 0} examples generated
              </div>

              <div className={styles.qualityScore}>
                <span>Quality Score</span>
                <strong>{qualityScore}%</strong>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      {columns.map((column) => (
                        <th key={column}>{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, index) => (
                      <tr key={`row-${index}`}>
                        {columns.map((column) => {
                          const value = row[column];
                          const display =
                            value === null || value === undefined
                              ? "-"
                              : typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value);
                          return <td key={`${index}-${column}`}>{display}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {result?.compliance_report && (
                <section
                  className={styles.complianceReport}
                  id="compliance-report-section"
                >
                  <div className={styles.complianceHeader}>
                    <h3>EU AI Act Compliance Report</h3>
                    <span className={styles.complianceBadge}>COMPLIANT</span>
                  </div>

                  <div className={styles.complianceBody}>
                    <div className={styles.complianceRow}>
                      <span>Report ID</span>
                      <strong>{result.compliance_report.report_id}</strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Generated At</span>
                      <strong>{result.compliance_report.generated_at}</strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Dataset Type</span>
                      <strong>{result.compliance_report.dataset_type}</strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Total Examples</span>
                      <strong>{result.compliance_report.total_examples}</strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Quality Score</span>
                      <strong>{result.compliance_report.quality_score}</strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Synthetic Confirmed</span>
                      <strong>
                        {result.compliance_report.synthetic_confirmed ? "true" : "false"}
                      </strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>PII Confirmed Absent</span>
                      <strong>
                        {result.compliance_report.pii_confirmed_absent ? "true" : "false"}
                      </strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Intended Use</span>
                      <strong>{result.compliance_report.intended_use}</strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Risk Classification</span>
                      <strong>{result.compliance_report.risk_classification}</strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Regulation Compliance</span>
                      <strong>{result.compliance_report.regulation_compliance}</strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Data Standards</span>
                      <strong>{result.compliance_report.data_standards}</strong>
                    </div>
                    <div className={styles.complianceRow}>
                      <span>Audit Trail</span>
                      <strong>{result.compliance_report.audit_trail}</strong>
                    </div>
                    <div className={styles.complianceRecommendations}>
                      <span>Recommendations</span>
                      <ul>
                        {result.compliance_report.recommendations.map((recommendation) => (
                          <li key={recommendation}>{recommendation}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    className={styles.downloadComplianceButton}
                    onClick={handleDownloadCompliancePdf}
                  >
                    Download Compliance Report as PDF
                  </button>
                </section>
              )}
            </>
          ) : (
            <p className={styles.placeholder}>
              Your generated dataset will appear here in a tabular format.
            </p>
          )}
        </section>
      </section>
    </main>
  );
}
