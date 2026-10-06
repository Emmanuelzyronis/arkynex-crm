import { NextResponse } from "next/server";

import { searchEverything } from "@/lib/db/queries/search";
import { getAuthContext } from "@/lib/auth/user";

export async function GET(request: Request) {
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q") ?? "";
  const results = await searchEverything(context.workspaceId, query);

  return NextResponse.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
