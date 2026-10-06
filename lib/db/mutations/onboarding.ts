"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireOwnProfileId } from "@/lib/auth/user";
import { trialEndsAtFromNow } from "@/lib/billing/access";

/** Step 1 — Profile */
export async function saveProfileStep(formData: FormData) {
  const userId = await requireOwnProfileId();

  await db
    .update(profiles)
    .set({
      fullName: String(formData.get("fullName") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || null,
      agencyName: String(formData.get("agencyName") ?? "").trim() || null,
      timezone: String(formData.get("timezone") ?? "UTC"),
      onboardingStep: 1,
    })
    .where(eq(profiles.id, userId));

  redirect("/onboarding/business");
}

/** Step 2 — Business preferences */
export async function saveBusinessStep(formData: FormData) {
  const userId = await requireOwnProfileId();

  const areas = formData.getAll("areas").map(String).filter(Boolean);
  const propertyTypes = formData.getAll("propertyTypes").map(String).filter(Boolean);
  const market = String(formData.get("primaryMarket") ?? "New York").trim() || "New York";
  const prefsNote = `market:${market}|areas:${areas.join(",")}|types:${propertyTypes.join(",")}`;

  const [current] = await db
    .select({ agencyName: profiles.agencyName })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  await db
    .update(profiles)
    .set({
      onboardingStep: 2,
      timezone: String(formData.get("timezone") ?? "UTC"),
      agencyName: current?.agencyName ?? market,
      businessPrefs: { market, areas, propertyTypes },
    })
    .where(eq(profiles.id, userId));

  console.log(`[onboarding] business_prefs for ${userId}:`, prefsNote);

  redirect("/onboarding/goals");
}

/** Final step — Goals: persist goals and mark onboarding complete. */
export async function saveGoalsStep(formData: FormData) {
  const userId = await requireOwnProfileId();

  const dealsPerMonth = String(formData.get("dealGoal") ?? "5-10");
  const priority = String(formData.get("priority") ?? "follow_up");

  const [current] = await db
    .select({ trialEndsAt: profiles.trialEndsAt })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  await db
    .update(profiles)
    .set({
      onboardingStep: 4,
      onboardedAt: new Date(),
      goals: { dealsPerMonth, priority },
      // Grant a 15-day free trial if the account doesn't have one yet.
      trialEndsAt: current?.trialEndsAt ?? trialEndsAtFromNow(),
    })
    .where(eq(profiles.id, userId));

  redirect("/dashboard");
}
