import type { ComplianceReport } from "@/lib/compliance-pdf";
import { createAdminClient } from "@/lib/supabase/admin";

/** Column name in Supabase: example_count */
export type DatasetSummary = {
  id: string;
  data_type: string;
  example_count: number;
  generated_at: string;
};

export type StoredDataset = DatasetSummary & {
  data: Array<Record<string, unknown>>;
  compliance_report: ComplianceReport;
};

type SaveDatasetInput = {
  data_type: string;
  example_count: number;
  generated_at: string;
  data: Array<Record<string, unknown>>;
  compliance_report: ComplianceReport;
};

function mapDatasetSummary(row: {
  id: string;
  data_type: string;
  example_count: number;
  generated_at: string;
}): DatasetSummary {
  return {
    id: row.id,
    data_type: row.data_type,
    example_count: row.example_count,
    generated_at: row.generated_at,
  };
}

function mapStoredDataset(row: {
  id: string;
  data_type: string;
  example_count: number;
  generated_at: string;
  data: unknown;
  compliance_report: unknown;
}): StoredDataset {
  return {
    ...mapDatasetSummary(row),
    data: row.data as Array<Record<string, unknown>>,
    compliance_report: normalizeComplianceReport(row.compliance_report),
  };
}

const DATASET_SUMMARY_COLUMNS = "id, data_type, example_count, generated_at";
const DATASET_FULL_COLUMNS =
  "id, data_type, example_count, generated_at, data, compliance_report";

function normalizeComplianceReport(value: unknown): ComplianceReport {
  const report = value as ComplianceReport;
  if (!report || typeof report !== "object") {
    throw new Error("Invalid compliance report stored in database.");
  }
  return report;
}

export async function saveDataset(
  userId: string,
  input: SaveDatasetInput,
): Promise<StoredDataset> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("datasets")
    .insert({
      user_id: userId,
      data_type: input.data_type,
      example_count: input.example_count,
      generated_at: input.generated_at,
      data: input.data,
      compliance_report: input.compliance_report,
    })
    .select(DATASET_FULL_COLUMNS)
    .single();

  if (error || !data) {
    throw new Error(`Failed to save dataset: ${error?.message ?? "Unknown error"}`);
  }

  return mapStoredDataset(data);
}

export async function listDatasets(userId: string): Promise<DatasetSummary[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("datasets")
    .select(DATASET_SUMMARY_COLUMNS)
    .eq("user_id", userId)
    .order("generated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load datasets: ${error.message}`);
  }

  return (data ?? []).map(mapDatasetSummary);
}

export async function getDataset(
  userId: string,
  datasetId: string,
): Promise<StoredDataset | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("datasets")
    .select(DATASET_FULL_COLUMNS)
    .eq("user_id", userId)
    .eq("id", datasetId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load dataset: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapStoredDataset(data);
}
