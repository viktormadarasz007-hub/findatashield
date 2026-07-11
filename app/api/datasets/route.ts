import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { listDatasets } from "@/lib/datasets-db";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const datasets = await listDatasets(user.id);
    return NextResponse.json({ datasets });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load datasets.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
