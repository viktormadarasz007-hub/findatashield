import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

type DataType =
  | "Fraud Transactions"
  | "Credit Profiles"
  | "Compliance Documents"
  | "Customer Service Logs";

const VALID_TYPES: DataType[] = [
  "Fraud Transactions",
  "Credit Profiles",
  "Compliance Documents",
  "Customer Service Logs",
];

function buildPrompt(type: DataType, count: number): string {
  return `You are generating realistic but fully synthetic financial training data.

Dataset type: ${type}
Number of examples: ${count}

Rules:
- Return ONLY valid JSON.
- Top-level structure must be: { "data": [ ... ] }.
- Include exactly ${count} objects in the data array.
- No markdown, no code fences, no extra text.
- Use realistic values and domain-relevant fields.
- Do not include any real personally identifiable information.
- Use plausible dates, amounts, IDs, and statuses.

Type-specific guidance:
- Fraud Transactions: transaction_id, account_id, amount, currency, timestamp, merchant, location, channel, risk_score, fraud_label, reason.
- Credit Profiles: profile_id, age_band, employment_status, annual_income, debt_to_income_ratio, credit_utilization, payment_history_score, open_accounts, delinquencies, default_risk_band.
- Compliance Documents: document_id, regulation_type, jurisdiction, submission_date, entity_type, risk_rating, findings_summary, action_required, deadline, status.
- Customer Service Logs: case_id, customer_segment, channel, issue_type, severity, opened_at, resolved_at, sentiment, resolution_summary, escalation_flag.

Output JSON now.`;
}

function buildCompliancePrompt(
  type: DataType,
  totalExamples: number,
  auditTrail: string,
): string {
  return `Generate a EU AI Act compliance report for a synthetic financial dataset.

Dataset type: ${type}
Total examples: ${totalExamples}
Audit trail context: ${auditTrail}

Return ONLY valid JSON with exactly these fields:
- report_id (unique string)
- generated_at (ISO 8601 timestamp)
- dataset_type
- total_examples
- quality_score (percentage string like "97%")
- synthetic_confirmed (boolean true)
- pii_confirmed_absent (boolean true)
- intended_use ("AI model training and development")
- risk_classification ("Limited Risk - EU AI Act Article 6")
- regulation_compliance ("EU Artificial Intelligence Act 2024")
- data_standards ("ISO/IEC 23053:2022")
- audit_trail (string)
- recommendations (array of exactly 3 strings)

Rules:
- JSON only. No markdown, no code fences, no commentary.
- Ensure synthetic_confirmed is true.
- Ensure pii_confirmed_absent is true.
- Ensure intended_use matches exactly.
- Ensure risk_classification matches exactly.
- Ensure regulation_compliance matches exactly.
- Ensure data_standards matches exactly.
- Ensure dataset_type matches "${type}".
- Ensure total_examples is ${totalExamples}.`;
}

function extractTextContent(content: Anthropic.Messages.ContentBlock[]): string {
  return content
    .filter(
      (block): block is Anthropic.Messages.TextBlock => block.type === "text",
    )
    .map((block) => block.text)
    .join("\n")
    .trim();
}

function safeParseData(text: string): Array<Record<string, unknown>> {
  const parsed = JSON.parse(text) as {
    data?: unknown;
  };

  if (!parsed || !Array.isArray(parsed.data)) {
    throw new Error("Claude response did not include a valid data array.");
  }

  return parsed.data.filter(
    (item): item is Record<string, unknown> =>
      Boolean(item) && typeof item === "object" && !Array.isArray(item),
  );
}

function safeParseCompliance(text: string): Record<string, unknown> {
  const parsed = JSON.parse(text) as Record<string, unknown>;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Claude response did not include a valid compliance report object.");
  }
  return parsed;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as null | {
    type?: unknown;
    count?: unknown;
  };

  if (!body || typeof body.type !== "string") {
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON: { type: string, count?: number }" },
      { status: 400 },
    );
  }

  if (!VALID_TYPES.includes(body.type as DataType)) {
    return NextResponse.json(
      { error: `Invalid type. Must be one of: ${VALID_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  const type = body.type as DataType;
  const requestedCount =
    typeof body.count === "number" && Number.isFinite(body.count) ? body.count : 50;
  const count = Math.max(1, Math.min(10000, Math.floor(requestedCount)));

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not configured." },
      { status: 500 },
    );
  }

  try {
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
      temperature: 0.4,
      messages: [
        {
          role: "user",
          content: buildPrompt(type, count),
        },
      ],
    });

    const text = extractTextContent(completion.content);
    const data = safeParseData(text);
    const generatedAt = new Date().toISOString();

    const complianceCompletion = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      temperature: 0.2,
      messages: [
        {
          role: "user",
          content: buildCompliancePrompt(
            type,
            data.length,
            `Generated ${data.length} fully synthetic ${type} records for AI model development.`,
          ),
        },
      ],
    });

    const complianceText = extractTextContent(complianceCompletion.content);
    const compliance_report = safeParseCompliance(complianceText);

    return NextResponse.json({
      type,
      count: data.length,
      generatedAt,
      data,
      compliance_report,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Generation request failed.";
    return NextResponse.json(
      { error: `Failed to generate synthetic data: ${message}` },
      { status: 500 },
    );
  }
}

