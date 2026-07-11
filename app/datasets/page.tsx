"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { downloadComplianceReportPdf } from "@/lib/compliance-pdf";
import { csvFilename, downloadCsvFile } from "@/lib/dataset-export";
import type { StoredDataset } from "@/lib/datasets-db";

import styles from "./datasets.module.css";

type DatasetSummary = {
  id: string;
  data_type: string;
  example_count: number;
  generated_at: string;
};

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export default function DatasetsPage() {
  const router = useRouter();
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const loadDatasets = useCallback(async () => {
    const response = await fetch("/api/datasets");
    const payload = (await response.json()) as {
      datasets?: DatasetSummary[];
      error?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load datasets.");
    }

    setDatasets(payload.datasets ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadDatasets();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load datasets.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loadDatasets]);

  async function fetchDataset(id: string): Promise<StoredDataset> {
    const response = await fetch(`/api/datasets/${encodeURIComponent(id)}`);
    const payload = (await response.json()) as StoredDataset & { error?: string };

    if (!response.ok) {
      throw new Error(payload.error ?? "Could not load dataset.");
    }

    return payload;
  }

  async function handleDownloadCsv(id: string) {
    setError(null);
    setDownloadingId(`${id}-csv`);

    try {
      const dataset = await fetchDataset(id);
      downloadCsvFile(
        csvFilename(dataset.data_type, dataset.example_count),
        dataset.data,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV download failed.");
    } finally {
      setDownloadingId(null);
    }
  }

  async function handleDownloadPdf(id: string) {
    setError(null);
    setDownloadingId(`${id}-pdf`);

    try {
      const dataset = await fetchDataset(id);
      downloadComplianceReportPdf(dataset.compliance_report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "PDF download failed.");
    } finally {
      setDownloadingId(null);
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

  return (
    <main className={styles.page}>
      <header className={styles.topHeader}>
        <div className={styles.topHeaderInner}>
          <div className={styles.brandBlock}>
            <h1>FinDataShield</h1>
            <p>Synthetic Financial Data & EU AI Act Compliance</p>
          </div>
          <nav className={styles.nav}>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/datasets" aria-current="page">
              My Datasets
            </Link>
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

      <section className={styles.shell}>
        <header className={styles.header}>
          <h2>My Datasets</h2>
          <p>
            Every generated dataset and compliance report is saved automatically.
            Download CSV or PDF files again anytime.
          </p>
        </header>

        {error && <p className={styles.error}>{error}</p>}

        {isLoading ? (
          <p className={styles.loading}>Loading your datasets...</p>
        ) : datasets.length === 0 ? (
          <p className={styles.empty}>
            No datasets yet.{" "}
            <Link href="/dashboard">Generate your first dataset</Link> on the
            dashboard.
          </p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Data Type</th>
                  <th>Examples</th>
                  <th>Downloads</th>
                </tr>
              </thead>
              <tbody>
                {datasets.map((dataset) => (
                  <tr key={dataset.id}>
                    <td>{formatDate(dataset.generated_at)}</td>
                    <td>{dataset.data_type}</td>
                    <td>{formatCount(dataset.example_count)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.actionButton}
                          disabled={downloadingId !== null}
                          onClick={() => void handleDownloadCsv(dataset.id)}
                        >
                          {downloadingId === `${dataset.id}-csv`
                            ? "Downloading..."
                            : "Download CSV"}
                        </button>
                        <button
                          type="button"
                          className={`${styles.actionButton} ${styles.actionButtonSecondary}`}
                          disabled={downloadingId !== null}
                          onClick={() => void handleDownloadPdf(dataset.id)}
                        >
                          {downloadingId === `${dataset.id}-pdf`
                            ? "Downloading..."
                            : "Download PDF"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
