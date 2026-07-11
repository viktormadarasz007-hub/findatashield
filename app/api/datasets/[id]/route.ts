import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/lib/auth";
import { getDataset } from "@/lib/datasets-db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const dataset = await getDataset(user.id, id);
    if (!dataset) {
      return NextResponse.json({ error: "Dataset not found." }, { status: 404 });
    }

    return NextResponse.json(dataset);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load dataset.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
