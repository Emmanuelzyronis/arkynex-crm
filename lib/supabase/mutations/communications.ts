"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

/** Log a manual note against a lead. */
export async function logNote(formData: FormData) {
  const { supabase, userId } = await getUser();

  const leadId = String(formData.get("leadId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!leadId || !content) return;

  const insert: TablesInsert<"communications"> = {
    lead_id: leadId,
    agent_id: userId,
    channel: "note",
    content,
  };

  const { error } = await supabase.from("communications").insert(insert);
  if (error) throw new Error(error.message);

  // Update last_contacted_at on the lead
  await supabase
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", leadId);

  revalidatePath(`/communications`);
}

/** Log a call outcome against a lead. */
export async function logCall(formData: FormData) {
  const { supabase, userId } = await getUser();

  const leadId = String(formData.get("leadId") ?? "");
  const outcome = String(formData.get("callOutcome") ?? "answered");
  const duration = Number(formData.get("durationSeconds")) || 0;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const insert: TablesInsert<"communications"> = {
    lead_id: leadId,
    agent_id: userId,
    channel: "call",
    direction: "outbound",
    call_outcome: outcome as "answered" | "no_answer" | "busy" | "voicemail",
    duration_seconds: duration,
    content: notes,
  };

  const { error } = await supabase.from("communications").insert(insert);
  if (error) throw new Error(error.message);

  await supabase
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", leadId);

  revalidatePath("/communications");
}

/**
 * Log an outbound WhatsApp message.
 * In production, this would also send via the Meta Cloud API.
 */
export async function logWhatsApp(formData: FormData) {
  const { supabase, userId } = await getUser();

  const leadId = String(formData.get("leadId") ?? "");
  const content = String(formData.get("content") ?? "").trim();
  if (!leadId || !content) return;

  const insert: TablesInsert<"communications"> = {
    lead_id: leadId,
    agent_id: userId,
    channel: "whatsapp",
    direction: "outbound",
    content,
    wa_status: "sent",
  };

  const { error } = await supabase.from("communications").insert(insert);
  if (error) throw new Error(error.message);

  await supabase
    .from("leads")
    .update({ last_contacted_at: new Date().toISOString() })
    .eq("id", leadId);

  revalidatePath("/communications");
}
