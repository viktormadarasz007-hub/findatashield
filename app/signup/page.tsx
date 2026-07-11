"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

import styles from "../auth/auth.module.css";

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [isResending, setIsResending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setAwaitingVerification(false);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (data.session) {
        const initRes = await fetch("/api/auth/initialize", { method: "POST" });
        if (!initRes.ok) {
          const payload = (await initRes.json()) as { error?: string };
          throw new Error(payload.error ?? "Could not initialize your account.");
        }

        router.push("/");
        router.refresh();
        return;
      }

      setAwaitingVerification(true);
      setMessage(
        "Account created. Check your email to confirm your address, then sign in.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (!email) {
      setError("Enter your email address above, then resend the verification email.");
      return;
    }

    setError(null);
    setIsResending(true);

    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (resendError) {
        throw resendError;
      }

      setMessage("Verification email sent. Check your inbox and spam folder.");
      setAwaitingVerification(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not resend verification email.",
      );
    } finally {
      setIsResending(false);
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
        <h1>Create account</h1>
        <p>
          Sign up with email and password. New accounts start on the Free plan with
          500 examples per month.
        </p>

        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isSubmitting}
            />
          </label>

          <label className={styles.field}>
            <span>Password</span>
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

          {error && <p className={styles.error}>{error}</p>}
          {message && <p className={styles.success}>{message}</p>}

          <button className={styles.submit} type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign up"}
          </button>

          {awaitingVerification && (
            <button
              type="button"
              className={styles.secondary}
              onClick={() => void handleResendVerification()}
              disabled={isResending || isSubmitting}
            >
              {isResending ? "Sending..." : "Resend verification email"}
            </button>
          )}
        </form>

        <p className={styles.footer}>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
