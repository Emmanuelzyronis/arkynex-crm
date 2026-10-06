"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

/** Update editable fields of an existing lead. */
export async function updateLead(formData: FormData) {
  await requireUser();

  const leadId = String(formData.get("leadId") ?? "");
  const locationPrefs = formData.getAll("areas").map(String).filter(Boolean);

  await db
    .update(leads)
    .set({
      fullName: String(formData.get("fullName") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || null,
      company: String(formData.get("company") ?? "").trim() || null,
      propertyType: String(formData.get("propertyType") ?? "").trim() || null,
      bedrooms: Number(formData.get("bedrooms")) || null,
      budgetMin: Number(formData.get("budgetMin")) || null,
      budgetMax: Number(formData.get("budgetMax")) || null,
      locationPrefs: locationPrefs.length > 0 ? locationPrefs : null,
      timeline: String(formData.get("timeline") ?? "").trim() || null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .where(eq(leads.id, leadId));

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  redirect(`/leads/${leadId}?success=1`);
}
