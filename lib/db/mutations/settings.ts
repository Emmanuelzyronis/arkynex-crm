"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser, requireOwnProfileId } from "@/lib/auth/user";
import { notificationGroups } from "@/lib/mock-settings";

/** Save profile settings (name, phone, agency, timezone). */
export async function saveProfile(formData: FormData) {
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

/** Save business preferences (market, areas, property types, website). */
export async function saveBusinessSettings(formData: FormData) {
  const userId = await requireUser();

  const market = String(formData.get("primaryMarket") ?? "Other").trim() || "Other";
  const areas = formData.getAll("areas").map(String).filter(Boolean);
  const propertyTypes = formData.getAll("propertyTypes").map(String).filter(Boolean);
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim() || null;

  await db
    .update(profiles)
    .set({ businessPrefs: { market, areas, propertyTypes }, websiteUrl })
    .where(eq(profiles.id, userId));

  revalidatePath("/settings");
  redirect("/settings?success=business");
}

/** Persist notification preferences as a jsonb map of id -> enabled. */
export async function saveNotificationPrefs(formData: FormData) {
  const userId = await requireOwnProfileId();

  const prefs = Object.fromEntries(
    notificationGroups.flatMap((group) =>
      group.items.map((item) => [item.id, String(formData.get(item.id) ?? "") === "on"]),
    ),
  );

  await db
    .update(profiles)
    .set({ notificationPrefs: prefs })
    .where(eq(profiles.id, userId));

  revalidatePath("/settings");
  redirect("/settings?success=notifications");
}
