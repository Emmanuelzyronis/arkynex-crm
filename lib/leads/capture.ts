import "server-only";

import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { communications, leads, tasks } from "@/lib/db/schema";
import { scoreLead } from "@/lib/ai/score-lead";
import { channelName, publishEvent } from "@/lib/realtime/ably";
import { pickNextAssignee } from "@/lib/leads/routing";

export type CaptureInput = {
  fullName: string;
  phone: string;
  email?: string | null;
  propertyType?: string | null;
  bedrooms?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  areas?: string[] | null;
  timeline?: string | null;
  notes?: string | null;
  source?: string | null;
};

export type CaptureResult = {
  leadId: string;
  created: boolean;
};

/**
 * Capture a lead from a public source (website form).
 * Deduplicates on (agentId, phone), logs the inbound message, opens a
 * speed-to-lead task and notifies the agent in realtime.
 */
export async function captureLead(
  agentId: string,
  input: CaptureInput,
): Promise<CaptureResult> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const message = (input.notes ?? "").trim() || null;
  const source = input.source?.trim() || "web_widget";

  const payload = {
    propertyType: input.propertyType?.trim() || null,
    bedrooms: input.bedrooms ?? null,
    budgetMin: input.budgetMin ?? null,
    budgetMax: input.budgetMax ?? null,
    locationPrefs: input.areas && input.areas.length > 0 ? input.areas : null,
    timeline: input.timeline?.trim() || null,
  };

  const [existing] = await db
    .select({ id: leads.id, score: leads.score, assignedToId: leads.assignedToId })
    .from(leads)
    .where(and(eq(leads.agentId, agentId), eq(leads.phone, phone)))
    .limit(1);

  const assigneeId = await pickNextAssignee(agentId);

  let leadId: string;
  let created: boolean;

  if (existing) {
    leadId = existing.id;
    created = false;
    await db
      .update(leads)
      .set({
        ...payload,
        email: input.email?.trim() || undefined,
        notes: message ?? undefined,
        rawIntakeText: message ?? undefined,
        ...(assigneeId && !existing.assignedToId ? { assignedToId: assigneeId } : {}),
        score: scoreLead({
          ...payload,
          fullName,
          phone,
          email: input.email ?? null,
          source,
          stage: "new",
          notes: message,
        }),
      })
      .where(eq(leads.id, leadId));
  } else {
    const insert = {
      agentId,
      fullName,
      phone,
      email: input.email?.trim() || null,
      source,
      stage: "new",
      score: 0,
      ...payload,
      assignedToId: assigneeId,
      notes: message,
      rawIntakeText: message,
    };
    insert.score = scoreLead(insert);

    const [row] = await db
      .insert(leads)
      .values(insert)
      .returning({ id: leads.id });
    leadId = row.id;
    created = true;
  }

  if (message) {
    await db.insert(communications).values({
      leadId,
      agentId,
      channel: "note",
      direction: "inbound",
      content: message,
    });
  }

  const firstName = fullName.split(" ")[0] || fullName;

  await db.insert(tasks).values({
    agentId,
    leadId,
    title: `Call ${firstName} — new website enquiry`,
    notes: "Speed to lead: reach out within 5 minutes while intent is highest.",
    type: "call",
    priority: "high",
    dueAt: new Date(),
  });

  await publishEvent(channelName("leads", agentId), "lead", {
    leadId,
    fullName,
    created,
  });

  return { leadId, created };
}
