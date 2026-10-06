"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq, and } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, leadStageHistory } from "@/lib/db/schema";
import type { Lead } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

type LeadInsert = typeof leads.$inferInsert;

/** Create a new lead from form data. */
export async function createLead(formData: FormData) {
  const userId = await requireUser();

  const phone = String(formData.get("phone") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!fullName || !phone) {
    redirect(`/leads/new?error=${encodeURIComponent("Name and phone are required.")}`);
  }

  const budgetMin = Number(formData.get("budgetMin")) || null;
  const budgetMax = Number(formData.get("budgetMax")) || null;
  const bedrooms = Number(formData.get("bedrooms")) || null;
  const locationPrefs = formData.getAll("areas").map(String).filter(Boolean);

  const insert: LeadInsert = {
    agentId: userId,
    fullName,
    phone,
    email: String(formData.get("email") ?? "").trim() || null,
    company: String(formData.get("company") ?? "").trim() || null,
    source: String(formData.get("source") ?? "manual"),
    propertyType: String(formData.get("propertyType") ?? "").trim() || null,
    bedrooms,
    budgetMin,
    budgetMax,
    locationPrefs: locationPrefs.length > 0 ? locationPrefs : null,
    timeline: String(formData.get("timeline") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    stage: "new",
    score: 0,
  };

  try {
    const [lead] = await db.insert(leads).values(insert).returning({ id: leads.id });

    revalidatePath("/leads");
    redirect(`/leads/${lead.id}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message.includes("leads_agent_phone_unique") || message.includes("23505")) {
      redirect(`/leads/new?error=${encodeURIComponent("A lead with that phone number already exists.")}`);
    }
    redirect(`/leads/new?error=${encodeURIComponent(message)}`);
  }
}

/** Move a lead to a new stage, writing to lead_stage_history. */
export async function updateLeadStage(formData: FormData) {
  const userId = await requireUser();

  const leadId = String(formData.get("leadId") ?? "");
  const toStage = String(formData.get("toStage") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const [current] = await db
    .select({ stage: leads.stage })
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!current) redirect(`/leads/${leadId}?error=Lead+not+found`);

  // Write immutable history row
  await db.insert(leadStageHistory).values({
    leadId,
    agentId: userId,
    fromStage: current.stage,
    toStage,
    notes,
  });

  await db
    .update(leads)
    .set({ stage: toStage, stageEnteredAt: new Date() })
    .where(eq(leads.id, leadId));

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

/**
 * Archive a lead (soft delete).
 * Used with .bind(null, leadId) so formData arrives as the second arg (ignored).
 */
export async function archiveLead(leadId: string, _formData?: FormData) {
  await requireUser();

  await db
    .update(leads)
    .set({ archived: true })
    .where(eq(leads.id, leadId));

  revalidatePath("/leads");
  redirect("/leads");
}

/** Hard delete a lead. */
export async function deleteLead(formData: FormData) {
  await requireUser();
  const leadId = String(formData.get("leadId") ?? "");

  await db.delete(leads).where(eq(leads.id, leadId));

  revalidatePath("/leads");
  redirect("/leads");
}
