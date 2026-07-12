"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  buildSignupUrl,
  parseCheckoutIntent,
  startPaidCheckout,
} from "@/lib/checkout-intent";
import { createClient } from "@/lib/supabase/client";

import styles from "../auth/auth.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const checkoutIntent = parseCheckoutIntent(searchParams);
  const nextPath = searchParams.get("next") ?? "/dashboard";
  const callbackError = searchParams.get("error");
  const resetSuccess = searchParams.get("reset") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    callbackError ? "Sign in failed. Please try again." : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (checkoutIntent) {
        const checkout = await startPaidCheckout(checkoutIntent);
        if (!checkout.ok) {
          throw new Error(checkout.error);
        }
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {checkoutIntent && (
        <p>
          Sign in to continue to secure checkout for your selected plan.
        </p>
      )}

      {resetSuccess && (
        <p className={styles.success}>
          Your password has been updated. Sign in with your new password.
        </p>
      )}

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
            autoComplete="current-password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={isSubmitting}
          />
        </label>

        {error && <p className={styles.error}>{error}</p>}

        <button className={styles.submit} type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </button>

        <p className={styles.forgotLink}>
          <Link href="/forgot-password">Forgot your password?</Link>
        </p>
      </form>

      <p className={styles.footer}>
        Don&apos;t have an account?{" "}
        <Link href={buildSignupUrl(checkoutIntent)}>Create one</Link>
      </p>
    </>
  );
}

export { LoginForm };
