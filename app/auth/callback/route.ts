import { NextResponse } from "next/server";

import { buildPricingCheckoutUrl, parseCheckoutIntent } from "@/lib/checkout-intent";
import { createClient } from "@/lib/supabase/server";
import { initializeFreeUsage } from "@/lib/usage-db";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const checkoutIntent = parseCheckoutIntent(searchParams);
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user && next !== "/reset-password") {
        try {
          await initializeFreeUsage(user.id);
        } catch {
          // Usage row may already exist for returning users.
        }
      }

      if (checkoutIntent) {
        return NextResponse.redirect(`${origin}${buildPricingCheckoutUrl(checkoutIntent)}`);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
