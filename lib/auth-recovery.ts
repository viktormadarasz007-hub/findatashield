import type { SupabaseClient } from "@supabase/supabase-js";

export type RecoveryUrlParams = {
  code?: string | null;
  tokenHash?: string | null;
  type?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
};

export function hasRecoveryQueryParams(
  searchParams: Pick<URLSearchParams, "get" | "has">,
): boolean {
  return (
    searchParams.has("access_token") ||
    searchParams.get("type") === "recovery" ||
    searchParams.has("code") ||
    searchParams.has("token_hash")
  );
}

export function hasRecoveryParamsInLocation(
  search: string,
  hash: string,
): boolean {
  const searchParams = new URLSearchParams(search);
  if (hasRecoveryQueryParams(searchParams)) {
    return true;
  }

  if (!hash.startsWith("#")) {
    return false;
  }

  const hashParams = new URLSearchParams(hash.slice(1));
  return (
    hashParams.get("type") === "recovery" ||
    hashParams.has("access_token") ||
    Boolean(hashParams.get("access_token") && hashParams.get("refresh_token"))
  );
}

export function parseRecoveryParamsFromLocation(
  search: string,
  hash: string,
): RecoveryUrlParams {
  const searchParams = new URLSearchParams(search);
  const hashParams = hash.startsWith("#")
    ? new URLSearchParams(hash.slice(1))
    : new URLSearchParams();

  const type = searchParams.get("type") ?? hashParams.get("type");

  return {
    code: searchParams.get("code"),
    tokenHash: searchParams.get("token_hash"),
    type,
    accessToken:
      searchParams.get("access_token") ?? hashParams.get("access_token"),
    refreshToken:
      searchParams.get("refresh_token") ?? hashParams.get("refresh_token"),
  };
}

export async function establishRecoverySession(
  supabase: SupabaseClient,
  params: RecoveryUrlParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const accessToken = params.accessToken?.trim();
  const refreshToken = params.refreshToken?.trim();

  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const code = params.code?.trim();
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const tokenHash = params.tokenHash?.trim();
  if (tokenHash && params.type === "recovery") {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery",
    });
    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    return { ok: false, error: userError.message };
  }

  if (user) {
    return { ok: true };
  }

  return { ok: false, error: "Missing or invalid recovery token." };
}

export const RECOVERY_HASH_REDIRECT_SCRIPT = `
(function () {
  try {
    var path = window.location.pathname;
    if (path === "/reset-password" || path.indexOf("/auth/") === 0) return;

    var search = window.location.search || "";
    var hash = window.location.hash || "";
    if (!search && (!hash || hash.length < 2)) return;

    var searchParams = new URLSearchParams(search);
    var hasQueryRecovery =
      searchParams.has("access_token") ||
      searchParams.get("type") === "recovery" ||
      searchParams.has("code") ||
      searchParams.has("token_hash");

    var hasHashRecovery = false;
    if (hash.length > 1) {
      var hashParams = new URLSearchParams(hash.slice(1));
      hasHashRecovery =
        hashParams.get("type") === "recovery" ||
        hashParams.has("access_token");
    }

    if (hasQueryRecovery || hasHashRecovery) {
      window.location.replace("/reset-password" + search + hash);
    }
  } catch (e) {}
})();
`;
