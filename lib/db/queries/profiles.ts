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
