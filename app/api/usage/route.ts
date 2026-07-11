import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { getUsageSnapshot } from "@/lib/usage-db";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const usage = await getUsageSnapshot(user.id, user.email);
    return NextResponse.json(usage);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load usage.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
