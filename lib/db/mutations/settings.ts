"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

/** Save profile settings (name, phone, agency, timezone). */
export async function saveProfile(formData: FormData) {
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

/** Save WhatsApp phone number in profile settings. */
export async function saveWhatsAppSettings(formData: FormData) {
  const userId = await requireUser();

  const whatsappPhone = String(formData.get("whatsappPhone") ?? "").trim() || null;

  await db
    .update(profiles)
    .set({ whatsappPhone })
    .where(eq(profiles.id, userId));

  revalidatePath("/settings");
  redirect("/settings?success=whatsapp");
}
