"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import {
  applyMonthRollover,
  getTierLimit,
  incrementUsedExamples,
  initialUsageState,
  isTierId,
  MONTHLY_LIMIT_ERROR,
  setTier,
  TIERS,
  tierHasFixedMonthlyLimit,
  type UsageState,
} from "@/lib/subscription";

import styles from "./page.module.css";

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
  compliance_report: {
    report_id: string;
    generated_at: string;
    dataset_type: string;
    total_examples: number;
    quality_score: string;
    synthetic_confirmed: boolean;
    pii_confirmed_absent: boolean;
    intended_use: string;
    risk_classification: string;
    regulation_compliance: string;
    data_standards: string;
    audit_trail: string;
    recommendations: string[];
  };
};

const DATA_TYPES: DataType[] = [
  "Fraud Transactions",
  "Credit Profiles",
  "Compliance Documents",
  "Customer Service Logs",
];

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";

  const headers = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  );

  const escapeCsv = (value: unknown) => {
    const raw =
      value === null || value === undefined
        ? ""
        : typeof value === "object"
          ? JSON.stringify(value)
          : String(value);
    const escaped = raw.replaceAll('"', '""');
    return `"${escaped}"`;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => escapeCsv(row[header])).join(",")),
  ];

  return lines.join("\n");
}

function formatExampleCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function Home() {
  const [type, setType] = useState<DataType>("Fraud Transactions");
  const [count, setCount] = useState<number>(50);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateResponse | null>(null);

  const rows = useMemo(() => result?.data ?? [], [result?.data]);

  const [usage, setUsage] = useState<UsageState>(() =>
    applyMonthRollover(initialUsageState()),
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    if (!plan || !isTierId(plan)) {
      return;
    }

    window.history.replaceState({}, "", "/");

    queueMicrotask(() => {
      setUsage((prev) => setTier(applyMonthRollover(prev), plan));
    });
  }, []);
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

  const usageSnapshot = useMemo(() => applyMonthRollover(usage), [usage]);

  const usedThisMonth = usageSnapshot.usedExamples;
  const hasMonthlyCap = tierHasFixedMonthlyLimit(usageSnapshot.tier);
  const monthlyLimit = getTierLimit(usageSnapshot.tier);
  const usagePercent =
    hasMonthlyCap && Number.isFinite(monthlyLimit)
      ? Math.min(100, (usedThisMonth / monthlyLimit) * 100)
      : 0;

  async function handleGenerate() {
    setError(null);

    const rolled = applyMonthRollover(usage);
    setUsage(rolled);

    const limit = getTierLimit(rolled.tier);
    if (
      Number.isFinite(limit) &&
      rolled.usedExamples + count > limit
    ) {
      setError(MONTHLY_LIMIT_ERROR);
      return;
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
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Generation failed.");
      }

      setResult(payload);

      setUsage((prev) => incrementUsedExamples(prev, payload.count));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setIsGenerating(false);
    }
  }

  function handleDownloadCsv() {
    if (!result?.data?.length) return;

    const csv = toCsv(result.data);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeType = result.type.toLowerCase().replaceAll(/\s+/g, "-");

    link.href = url;
    link.download = `${safeType}-${result.count}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function handleDownloadCompliancePdf() {
    if (!result?.compliance_report) return;
    window.print();
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
            <Link href="/" aria-current="page">
              Dashboard
            </Link>
            <Link href="/pricing">Pricing</Link>
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
                <strong>{TIERS[usageSnapshot.tier].name}</strong>
                <Link href="/pricing" className={styles.usageUpgrade}>
                  Upgrade
                </Link>
              </p>
            </div>
          </div>
          {hasMonthlyCap ? (
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
          ) : (
            <>
              <p className={styles.usageCounts}>
                {formatExampleCount(usedThisMonth)} examples generated this month
              </p>
              <p className={styles.usageUnlimited}>
                Enterprise has no fixed monthly example limit.
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
          onClick={handleGenerate}
          disabled={isGenerating}
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
