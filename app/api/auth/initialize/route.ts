import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { initializeFreeUsage } from "@/lib/usage-db";

export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    await initializeFreeUsage(user.id);
    return NextResponse.json({ success: true, tier: "free" });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to initialize account.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
