"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { Profile } from "@/lib/db/schema";
import { requireUser, requireOwnProfileId } from "@/lib/auth/user";
import { trialEndsAtFromNow } from "@/lib/billing/access";

/** Upsert a profile row — used on first sign-in and subsequent visits. */
export async function createProfile(
  userId: string,
  fullName: string,
): Promise<Profile> {
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
      fullName,
      workspaceId: userId,
      role: "owner",
      onboardingStep: 0,
      subscriptionStatus: "trialing",
      trialEndsAt: trialEndsAtFromNow(),
    })
    .returning();

  return profile;
}

/** Update profile fields from the settings form. */
export async function updateProfile(formData: FormData) {
  const userId = await requireOwnProfileId();

  const fullName = String(formData.get("fullName") ?? "").trim() || undefined;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const agencyName = String(formData.get("agencyName") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "UTC");

  await db
    .update(profiles)
    .set({ fullName, phone, agencyName, timezone })
    .where(eq(profiles.id, userId));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect("/settings?success=profile");
}


/** Return the agent's lead-capture token, generating one on first use. */
export async function ensureCaptureToken(userId: string): Promise<string> {
  const [row] = await db
    .select({ token: profiles.leadCaptureToken })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (row?.token) return row.token;

  const token = randomBytes(16).toString("hex");
  await db
    .update(profiles)
    .set({ leadCaptureToken: token })
    .where(eq(profiles.id, userId));

  return token;
}

/** Toggle the public lead-capture form on or off. */
export async function setLeadCaptureEnabled(formData: FormData) {
  const userId = await requireUser();
  const enabled = ["true", "on", "1"].includes(
    String(formData.get("enabled") ?? ""),
  );

  await db
    .update(profiles)
    .set({ leadCaptureEnabled: enabled })
    .where(eq(profiles.id, userId));

  revalidatePath("/settings");
}
