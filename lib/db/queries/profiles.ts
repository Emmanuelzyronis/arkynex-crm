import "server-only";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getProfile(agentId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, agentId))
    .limit(1);
  return profile ?? null;
}

/** Resolve the agent that owns a public lead-capture token. */
export async function getProfileByCaptureToken(token: string) {
  if (!token || token.length < 16) return null;

  const [row] = await db
    .select({
      id: profiles.id,
      fullName: profiles.fullName,
      agencyName: profiles.agencyName,
      leadCaptureEnabled: profiles.leadCaptureEnabled,
    })
    .from(profiles)
    .where(eq(profiles.leadCaptureToken, token))
    .limit(1);

  return row ?? null;
}
