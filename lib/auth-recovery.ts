import type { SupabaseClient } from "@supabase/supabase-js";

export type RecoveryUrlParams = {
  code?: string | null;
  tokenHash?: string | null;
  type?: string | null;
};

export function hasRecoveryParamsInLocation(
  search: string,
  hash: string,
): boolean {
  const searchParams = new URLSearchParams(search);
  if (searchParams.get("code")) {
    return true;
  }

  if (
    searchParams.get("token_hash") &&
    searchParams.get("type") === "recovery"
  ) {
    return true;
  }

  if (!hash.startsWith("#")) {
    return false;
  }

  const hashParams = new URLSearchParams(hash.slice(1));
  return (
    hashParams.get("type") === "recovery" ||
    Boolean(hashParams.get("access_token") && hashParams.get("refresh_token"))
  );
}

export async function establishRecoverySession(
  supabase: SupabaseClient,
  params: RecoveryUrlParams,
): Promise<{ ok: true } | { ok: false; error: string }> {
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

  if (typeof window !== "undefined" && window.location.hash.startsWith("#")) {
    const hashParams = new URLSearchParams(window.location.hash.slice(1));
    const accessToken = hashParams.get("access_token");
    const refreshToken = hashParams.get("refresh_token");

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
