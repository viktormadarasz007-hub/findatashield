import type { ComplianceReport } from "@/lib/compliance-pdf";
import { createAdminClient } from "@/lib/supabase/admin";

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
    .select("id, data_type, example_count, generated_at, data, compliance_report")
    .single();

  if (error || !data) {
    throw new Error(`Failed to save dataset: ${error?.message ?? "Unknown error"}`);
  }

  return {
    id: data.id,
    data_type: data.data_type,
    example_count: data.example_count,
    generated_at: data.generated_at,
    data: data.data as Array<Record<string, unknown>>,
    compliance_report: normalizeComplianceReport(data.compliance_report),
  };
}

export async function listDatasets(userId: string): Promise<DatasetSummary[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("datasets")
    .select("id, data_type, example_count, generated_at")
    .eq("user_id", userId)
    .order("generated_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load datasets: ${error.message}`);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    data_type: row.data_type,
    example_count: row.example_count,
    generated_at: row.generated_at,
  }));
}

export async function getDataset(
  userId: string,
  datasetId: string,
): Promise<StoredDataset | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("datasets")
    .select("id, data_type, example_count, generated_at, data, compliance_report")
    .eq("user_id", userId)
    .eq("id", datasetId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load dataset: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    data_type: data.data_type,
    example_count: data.example_count,
    generated_at: data.generated_at,
    data: data.data as Array<Record<string, unknown>>,
    compliance_report: normalizeComplianceReport(data.compliance_report),
  };
}
