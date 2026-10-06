import "server-only";
import { db } from "@/lib/db";
import { communications, leads } from "@/lib/db/schema";
import type { Communication, Lead } from "@/lib/db/schema";
import { eq, desc, asc } from "drizzle-orm";

export type { Communication };

export type ConversationSummary = {
  leadId: string;
  leadName: string;
  leadPhone: string;
  lastMessage: Communication;
  unreadCount: number;
};

export type Thread = {
  lead: Pick<Lead, "id" | "fullName" | "phone" | "email">;
  messages: Communication[];
};

/**
 * Returns one entry per lead that has at least one communication.
 * Sorted by most recent message first.
 */
export async function getConversations(
  agentId: string,
): Promise<ConversationSummary[]> {
  const rows = await db
    .select({
      communication: communications,
      lead: {
        id: leads.id,
        fullName: leads.fullName,
        phone: leads.phone,
      },
    })
    .from(communications)
    .innerJoin(leads, eq(communications.leadId, leads.id))
    .where(eq(communications.agentId, agentId))
    .orderBy(desc(communications.createdAt));

  // Group by lead — keep the first (most recent) per lead
  const seen = new Set<string>();
  const conversations: ConversationSummary[] = [];

  for (const row of rows) {
    if (!row.lead || seen.has(row.lead.id)) continue;
    seen.add(row.lead.id);

    conversations.push({
      leadId: row.lead.id,
      leadName: row.lead.fullName,
      leadPhone: row.lead.phone,
      lastMessage: row.communication,
      unreadCount: 0,
    });
  }

  return conversations;
}

/**
 * All messages for a specific lead, ordered oldest-first for chat display.
 */
export async function getThread(
  agentId: string,
  leadId: string,
): Promise<Thread | null> {
  const [lead] = await db
    .select()
    .from(leads)
    .where(eq(leads.id, leadId))
    .limit(1);

  if (!lead || lead.agentId !== agentId) return null;

  const messages = await db
    .select()
    .from(communications)
    .where(eq(communications.leadId, leadId))
    .orderBy(asc(communications.createdAt));

  return {
    lead: {
      id: lead.id,
      fullName: lead.fullName,
      phone: lead.phone,
      email: lead.email,
    },
    messages,
  };
}
