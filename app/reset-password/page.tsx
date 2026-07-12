"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

import {
  establishRecoverySession,
  parseRecoveryParamsFromLocation,
} from "@/lib/auth-recovery";
import { createClient } from "@/lib/supabase/client";

import styles from "../auth/auth.module.css";

export default function ResetPasswordPage() {
  const router = useRouter();
  const verifiedRef = useRef(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  useEffect(() => {
    if (verifiedRef.current) {
      return;
    }
    verifiedRef.current = true;

    let isMounted = true;

    async function verifyRecoveryLink() {
      const recoveryParams = parseRecoveryParamsFromLocation(
        window.location.search,
        window.location.hash,
      );

      const supabase = createClient();
      const result = await establishRecoverySession(supabase, recoveryParams);

      if (!isMounted) {
        return;
      }

      if (!result.ok) {
        setHasRecoverySession(false);
        setError(
          "This reset link is invalid or has expired. Request a new password reset email.",
        );
        setIsCheckingSession(false);
        return;
      }

      setHasRecoverySession(true);
      setIsCheckingSession(false);

      if (window.location.search || window.location.hash) {
        window.history.replaceState(null, "", "/reset-password");
      }
    }

    void verifyRecoveryLink();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        throw updateError;
      }

      await supabase.auth.signOut();

      router.push("/login?reset=success");
      router.refresh();
    } catch {
      setError("Could not update password. Please try again or request a new reset link.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topHeader}>
        <div className={styles.topHeaderInner}>
          <div className={styles.brand}>
            <Link href="/">FinDataShield</Link>
            <span className={styles.tagline}>
              Synthetic Financial Data & EU AI Act Compliance
            </span>
          </div>
        </div>
      </header>

      <section className={styles.card}>
        <h1>Choose a new password</h1>
        <p>
          Enter and confirm your new password. You will be signed out and can sign
          in again with the updated credentials.
        </p>

        {isCheckingSession ? (
          <p className={styles.footer}>Verifying reset link...</p>
        ) : (
          <>
            {error && !hasRecoverySession && (
              <>
                <p className={styles.error}>{error}</p>
                <p className={styles.footer}>
                  <Link href="/forgot-password">Request a new reset link</Link>
                </p>
              </>
            )}

            {hasRecoverySession && (
              <form className={styles.form} onSubmit={handleSubmit}>
                <label className={styles.field}>
                  <span>New password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={isSubmitting}
                  />
                </label>

                <label className={styles.field}>
                  <span>Confirm password</span>
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    disabled={isSubmitting}
                  />
                </label>

                {error && <p className={styles.error}>{error}</p>}

                <button
                  className={styles.submit}
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update password"}
                </button>
              </form>
            )}
          </>
        )}

        {!isCheckingSession && hasRecoverySession && (
          <p className={styles.footer}>
            <Link href="/login">Back to sign in</Link>
          </p>
        )}
      </section>
    </main>
  );
}
