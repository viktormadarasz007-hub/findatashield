import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail, ADMIN_PLAN_NAME } from "@/lib/admin";
import {
  getTierLimit,
  isTierId,
  type TierId,
} from "@/lib/subscription";

export type UsageRecord = {
  user_id: string;
  month: number;
  year: number;
  examples_used: number;
  tier: TierId;
};

export type UsageSnapshot = {
  tier: TierId;
  month: number;
  year: number;
  examples_used: number;
  limit: number;
  is_admin?: boolean;
  plan_name?: string;
};

function getCurrentPeriod(now = new Date()) {
  return {
    month: now.getUTCMonth() + 1,
    year: now.getUTCFullYear(),
  };
}

function normalizeTier(value: unknown): TierId {
  return typeof value === "string" && isTierId(value) ? value : "free";
}

async function getLatestTier(userId: string): Promise<TierId> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("usage")
    .select("tier, year, month")
    .eq("user_id", userId)
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load tier for user: ${error.message}`);
  }

  return normalizeTier(data?.tier);
}

export async function getOrCreateUsageRecord(
  userId: string,
): Promise<UsageRecord> {
  const supabase = createAdminClient();
  const { month, year } = getCurrentPeriod();

  const { data: existing, error: selectError } = await supabase
    .from("usage")
    .select("user_id, month, year, examples_used, tier")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year)
    .maybeSingle();

  if (selectError) {
    throw new Error(`Failed to load usage: ${selectError.message}`);
  }

  if (existing) {
    return {
      user_id: existing.user_id,
      month: existing.month,
      year: existing.year,
      examples_used: existing.examples_used,
      tier: normalizeTier(existing.tier),
    };
  }

  const tier = await getLatestTier(userId);

  const { data: created, error: insertError } = await supabase
    .from("usage")
    .insert({
      user_id: userId,
      month,
      year,
      examples_used: 0,
      tier,
    })
    .select("user_id, month, year, examples_used, tier")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: raced, error: raceError } = await supabase
        .from("usage")
        .select("user_id, month, year, examples_used, tier")
        .eq("user_id", userId)
        .eq("month", month)
        .eq("year", year)
        .single();

      if (raceError || !raced) {
        throw new Error(`Failed to load usage after conflict: ${raceError?.message}`);
      }

      return {
        user_id: raced.user_id,
        month: raced.month,
        year: raced.year,
        examples_used: raced.examples_used,
        tier: normalizeTier(raced.tier),
      };
    }

    throw new Error(`Failed to initialize usage: ${insertError.message}`);
  }

  if (!created) {
    throw new Error("Failed to initialize usage: no row returned.");
  }

  return {
    user_id: created.user_id,
    month: created.month,
    year: created.year,
    examples_used: created.examples_used,
    tier: normalizeTier(created.tier),
  };
}

export async function initializeFreeUsage(userId: string): Promise<void> {
  const supabase = createAdminClient();
  const { month, year } = getCurrentPeriod();

  const { error } = await supabase.from("usage").upsert(
    {
      user_id: userId,
      month,
      year,
      examples_used: 0,
      tier: "free",
    },
    { onConflict: "user_id,month,year", ignoreDuplicates: true },
  );

  if (error) {
    throw new Error(`Failed to initialize free usage: ${error.message}`);
  }
}

export function toUsageSnapshot(
  record: UsageRecord,
  email?: string | null,
): UsageSnapshot {
  const tier = normalizeTier(record.tier);

  if (isAdminEmail(email)) {
    return {
      tier,
      month: record.month,
      year: record.year,
      examples_used: record.examples_used,
      limit: Number.POSITIVE_INFINITY,
      is_admin: true,
      plan_name: ADMIN_PLAN_NAME,
    };
  }

  return {
    tier,
    month: record.month,
    year: record.year,
    examples_used: record.examples_used,
    limit: getTierLimit(tier),
  };
}

export async function getUsageSnapshot(
  userId: string,
  email?: string | null,
): Promise<UsageSnapshot> {
  const record = await getOrCreateUsageRecord(userId);
  return toUsageSnapshot(record, email);
}

export async function canGenerateExamples(
  userId: string,
  requested: number,
  email?: string | null,
): Promise<{ allowed: boolean; snapshot: UsageSnapshot }> {
  const record = await getOrCreateUsageRecord(userId);
  const snapshot = toUsageSnapshot(record, email);

  if (snapshot.is_admin || !Number.isFinite(snapshot.limit)) {
    return { allowed: true, snapshot };
  }

  return {
    allowed: record.examples_used + requested <= snapshot.limit,
    snapshot,
  };
}

export async function incrementUsage(
  userId: string,
  delta: number,
  email?: string | null,
): Promise<UsageSnapshot> {
  const supabase = createAdminClient();
  const amount = Math.max(0, Math.floor(delta));
  const record = await getOrCreateUsageRecord(userId);

  const { data, error } = await supabase
    .from("usage")
    .update({ examples_used: record.examples_used + amount })
    .eq("user_id", userId)
    .eq("month", record.month)
    .eq("year", record.year)
    .select("user_id, month, year, examples_used, tier")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update usage: ${error?.message ?? "Unknown error"}`);
  }

  return toUsageSnapshot(
    {
      user_id: data.user_id,
      month: data.month,
      year: data.year,
      examples_used: data.examples_used,
      tier: normalizeTier(data.tier),
    },
    email,
  );
}

export async function setUserTier(
  userId: string,
  tier: TierId,
  email?: string | null,
): Promise<UsageSnapshot> {
  const supabase = createAdminClient();
  const record = await getOrCreateUsageRecord(userId);

  const { data, error } = await supabase
    .from("usage")
    .update({ tier })
    .eq("user_id", userId)
    .eq("month", record.month)
    .eq("year", record.year)
    .select("user_id, month, year, examples_used, tier")
    .single();

  if (error || !data) {
    throw new Error(`Failed to update tier: ${error?.message ?? "Unknown error"}`);
  }

  return toUsageSnapshot(
    {
      user_id: data.user_id,
      month: data.month,
      year: data.year,
      examples_used: data.examples_used,
      tier: normalizeTier(data.tier),
    },
    email,
  );
}
