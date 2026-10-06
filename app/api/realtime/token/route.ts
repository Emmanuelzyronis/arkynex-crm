import { NextResponse } from "next/server";

import { getAblyRest, isAblyConfigured } from "@/lib/realtime/ably";
import { getAuthContext } from "@/lib/auth/user";

/** Issues a scoped Ably token for the signed-in Clerk user. */
export async function GET() {
  const context = await getAuthContext();
  if (!context) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAblyConfigured()) {
    return NextResponse.json(
      { error: "Realtime is not configured (ABLY_SERVER_KEY missing)." },
      { status: 503 },
    );
  }

  // Clients only ever subscribe (the server publishes), and only to their own
    // workspace's channels.
  const tokenRequest = await getAblyRest().auth.createTokenRequest({
    clientId: context.userId,
    capability: {
      "communications:*": ["subscribe"],
      [`ai-actions:${context.workspaceId}`]: ["subscribe"],
    },
  });

  return NextResponse.json(tokenRequest);
}
