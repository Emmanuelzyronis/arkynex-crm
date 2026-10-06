"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { communications, leads } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

type CommunicationInsert = typeof communications.$inferInsert;

/** Log a manual note against a lead. */
export async function logNote(formData: FormData) {
  const userId = await requireUser();

  const leadId = String(formData.get("leadId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!leadId || !content) return;

  const insert: CommunicationInsert = {
    leadId,
    agentId: userId,
    channel: "note",
    content,
  };

  await db.insert(communications).values(insert);

  // Update last_contacted_at on the lead
  await db
    .update(leads)
    .set({ lastContactedAt: new Date() })
    .where(eq(leads.id, leadId));

  revalidatePath("/communications");
}

/** Log a call outcome against a lead. */
export async function logCall(formData: FormData) {
  const userId = await requireUser();

  const leadId = String(formData.get("leadId") ?? "");
  const outcome = String(formData.get("callOutcome") ?? "answered");
  const duration = Number(formData.get("durationSeconds")) || 0;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const insert: CommunicationInsert = {
    leadId,
    agentId: userId,
    channel: "call",
    direction: "outbound",
    callOutcome: outcome,
    durationSeconds: duration,
    content: notes,
  };

  await db.insert(communications).values(insert);

  await db
    .update(leads)
    .set({ lastContactedAt: new Date() })
    .where(eq(leads.id, leadId));

  revalidatePath("/communications");
}

/**
 * Log an outbound WhatsApp message.
 * In production, this would also send via the Meta Cloud API.
 */
export async function logWhatsApp(formData: FormData) {
  const userId = await requireUser();

  const leadId = String(formData.get("leadId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!leadId || !content) return;

  const insert: CommunicationInsert = {
    leadId,
    agentId: userId,
    channel: "whatsapp",
    direction: "outbound",
    content,
    waStatus: "sent",
  };

  await db.insert(communications).values(insert);

  await db
    .update(leads)
    .set({ lastContactedAt: new Date() })
    .where(eq(leads.id, leadId));

  revalidatePath("/communications");
}
