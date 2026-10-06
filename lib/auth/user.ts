import "server-only";

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";

/**
 * Require a signed-in user via Clerk.
 * Returns the Clerk user ID (string) or redirects to /login.
 */
export async function requireUser() {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  return userId;
}

/**
 * Ensure the user has a profile row in the database.
 * Uses Drizzle — creates on first sign-in, upserts on subsequent visits.
 */
export async function ensureProfile(userId: string, fullName: string) {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (existing) return existing;

  const [profile] = await db
    .insert(profiles)
    .values({
      id: userId,
      full_name: fullName,
      onboarding_step: 0,
    })
    .returning();

  return profile;
}

/**
 * Get the current user's profile.
 */
export async function getProfile(userId: string) {
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  return profile ?? null;
}