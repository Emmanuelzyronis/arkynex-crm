"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import type { Profile } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

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
      onboardingStep: 0,
    })
    .returning();

  return profile;
}

/** Update profile fields from the settings form. */
export async function updateProfile(formData: FormData) {
  const userId = await requireUser();

  const fullName = String(formData.get("fullName") ?? "").trim() || undefined;
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const agencyName = String(formData.get("agencyName") ?? "").trim() || null;
  const timezone = String(formData.get("timezone") ?? "Africa/Lagos");

  await db
    .update(profiles)
    .set({ fullName, phone, agencyName, timezone })
    .where(eq(profiles.id, userId));

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect("/settings?success=profile");
}
