"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { communications, leads } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";
import { channelName, publishEvent } from "@/lib/realtime/ably";
import { getThread } from "@/lib/db/queries/communications";
import { sendEmail, sendSms } from "@/lib/comms/delivery";
import { chat, isLlmConfigured } from "@/lib/ai/llm";
import { revalidateDashboard } from "@/lib/cache";

type CommunicationInsert = typeof communications.$inferInsert;

/** Server action — load a lead's full message thread for the inbox. */
export async function loadThread(leadId: string) {
  const userId = await requireUser();
  return getThread(userId, leadId);
}

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

  const [row] = await db.insert(communications).values(insert).returning();
  await publishEvent(channelName("communications", leadId), "communication", row);

  // Update last_contacted_at on the lead
  await db
    .update(leads)
    .set({ lastContactedAt: new Date() })
    .where(eq(leads.id, leadId));

  revalidatePath("/communications");
  revalidateDashboard();
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

  const [row] = await db.insert(communications).values(insert).returning();
  await publishEvent(channelName("communications", leadId), "communication", row);

  await db
    .update(leads)
    .set({ lastContactedAt: new Date() })
    .where(eq(leads.id, leadId));

  revalidatePath("/communications");
  revalidateDashboard();
}


export type SendResult = {
  ok: boolean;
  channel: "email" | "sms";
  delivered: boolean;
  providerId?: string | null;
  error?: string;
};

/** Deliver an email to a lead through Resend and log it on the thread. */
export async function sendEmailToLead(formData: FormData): Promise<SendResult> {
  const agentId = await requireUser();
  const leadId = String(formData.get("leadId") ?? "");
  const subject = String(formData.get("subject") ?? "").trim() || "Following up";
  const content = String(formData.get("content") ?? "").trim();
  if (!leadId || !content) {
    return { ok: false, channel: "email", delivered: false, error: "missing_content" };
  }

  const [lead] = await db
    .select({ id: leads.id, email: leads.email })
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.agentId, agentId)))
    .limit(1);

  if (!lead?.email) {
    return { ok: false, channel: "email", delivered: false, error: "lead_has_no_email" };
  }

  const result = await sendEmail({ to: lead.email, subject, text: content });

  const [row] = await db
    .insert(communications)
    .values({
      leadId,
      agentId,
      channel: "email",
      direction: "outbound",
      content,
    })
    .returning();

  await db
    .update(leads)
    .set({ lastContactedAt: new Date() })
    .where(eq(leads.id, leadId));
  await publishEvent(channelName("communications", leadId), "communication", row);
  revalidatePath("/communications");
  revalidateDashboard();

  return {
    ok: result.ok,
    channel: "email",
    delivered: result.ok,
    providerId: result.ok ? result.providerId : null,
    ...(result.ok ? {} : { error: result.error }),
  };
}

/** Deliver an SMS to a lead through Twilio and log it on the thread. */
export async function sendSmsToLead(formData: FormData): Promise<SendResult> {
  const agentId = await requireUser();
  const leadId = String(formData.get("leadId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!leadId || !content) {
    return { ok: false, channel: "sms", delivered: false, error: "missing_content" };
  }

  const [lead] = await db
    .select({ id: leads.id, phone: leads.phone })
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.agentId, agentId)))
    .limit(1);

  if (!lead?.phone) {
    return { ok: false, channel: "sms", delivered: false, error: "lead_has_no_phone" };
  }

  const result = await sendSms({ to: lead.phone, body: content });

  const [row] = await db
    .insert(communications)
    .values({
      leadId,
      agentId,
      channel: "sms",
      direction: "outbound",
      content,
    })
    .returning();

  await db
    .update(leads)
    .set({ lastContactedAt: new Date() })
    .where(eq(leads.id, leadId));
  await publishEvent(channelName("communications", leadId), "communication", row);
  revalidatePath("/communications");
  revalidateDashboard();

  return {
    ok: result.ok,
    channel: "sms",
    delivered: result.ok,
    providerId: result.ok ? result.providerId : null,
    ...(result.ok ? {} : { error: result.error }),
  };
}

/** Draft a personalised follow-up with the configured LLM. */
export async function draftLeadMessage(
  leadId: string,
): Promise<{ ok: boolean; draft?: string; error?: string }> {
  const agentId = await requireUser();
  if (!isLlmConfigured()) return { ok: false, error: "llm_not_configured" };

  const thread = await getThread(agentId, leadId);
  if (!thread) return { ok: false, error: "lead_not_found" };

  const history = thread.messages
    .slice(-8)
    .map((m) => `${m.direction ?? "inbound"} ${m.channel}: ${m.content ?? ""}`)
    .join("\n");

  const draft = await chat({
    messages: [
      {
        role: "system",
        content:
          "You write short, warm, professional follow-up messages for a real estate " +
          "agent. Return only the message body (no subject, no markdown, no quotes), " +
          "under 90 words. Never invent prices, dates or facts.",
      },
      {
        role: "user",
        content:
          `Lead: ${thread.lead.fullName}\n` +
          `Recent conversation:\n${history || "(no messages yet)"}\n\n` +
          "Write the next follow-up for this lead.",
      },
    ],
    temperature: 0.6,
    maxTokens: 300,
  });

  if (!draft) return { ok: false, error: "llm_failed" };
  return { ok: true, draft };
}
