import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/lib/supabase/types";

export type CommunicationRow = Tables<"communications">;

export type ConversationSummary = {
  leadId: string;
  leadName: string;
  leadPhone: string;
  lastMessage: CommunicationRow;
  unreadCount: number;
};

export type Thread = {
  lead: { id: string; full_name: string; phone: string; email: string | null };
  messages: CommunicationRow[];
};

/**
 * Returns one entry per lead that has at least one communication.
 * Sorted by most recent message first.
 */
export async function getConversations(
  supabase: SupabaseClient<Database>,
): Promise<ConversationSummary[]> {
  // Get all comms, ordered newest first
  const { data, error } = await supabase
    .from("communications")
    .select("*, leads(id, full_name, phone)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Group by lead, keep the first (most recent) per lead
  const seen = new Set<string>();
  const conversations: ConversationSummary[] = [];

  for (const msg of data) {
    const lead = msg.leads as { id: string; full_name: string; phone: string } | null;
    if (!lead || seen.has(lead.id)) continue;
    seen.add(lead.id);

    conversations.push({
      leadId: lead.id,
      leadName: lead.full_name,
      leadPhone: lead.phone,
      lastMessage: msg as CommunicationRow,
      unreadCount: 0,
    });
  }

  return conversations;
}

/**
 * All messages for a specific lead, ordered oldest-first for chat display.
 */
export async function getThread(
  supabase: SupabaseClient<Database>,
  leadId: string,
): Promise<Thread | null> {
  const [{ data: lead, error: leadError }, { data: messages, error: msgError }] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id, full_name, phone, email")
        .eq("id", leadId)
        .single(),
      supabase
        .from("communications")
        .select("*")
        .eq("lead_id", leadId)
        .order("created_at", { ascending: true }),
    ]);

  if (leadError || !lead) return null;
  if (msgError) throw msgError;

  return {
    lead: lead as { id: string; full_name: string; phone: string; email: string | null },
    messages: (messages ?? []) as CommunicationRow[],
  };
}
