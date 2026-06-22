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

/** Schedule a new viewing. */
export async function createViewing(formData: FormData) {
  const { supabase, userId } = await getUser();

  const leadId = String(formData.get("lead") ?? "").trim();
  const propertyId = String(formData.get("property") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();

  if (!leadId || !propertyId || !date || !time) {
    redirect(`/viewings/new?error=${encodeURIComponent("Lead, property, date and time are all required.")}`);
  }

  const scheduledAt = new Date(`${date}T${time}:00`).toISOString();

  const insert: TablesInsert<"viewings"> = {
    agent_id: userId,
    lead_id: leadId,
    property_id: propertyId,
    scheduled_at: scheduledAt,
    status: "scheduled",
    agent_notes: String(formData.get("notes") ?? "").trim() || null,
  };

  const { error } = await supabase.from("viewings").insert(insert);

  if (error) {
    redirect(`/viewings/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/viewings");
  revalidatePath("/dashboard");
  redirect("/viewings");
}

/**
 * Update a viewing's status (e.g. attended, cancelled, no_show).
 * Also accepts rating and notes when logging an outcome.
 */
export async function updateViewingStatus(formData: FormData) {
  const { supabase } = await getUser();

  const viewingId = String(formData.get("viewingId") ?? "");
  const status = String(formData.get("status") ?? "");
  const rating = Number(formData.get("rating")) || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase
    .from("viewings")
    .update({
      status: status as "scheduled" | "attended" | "no_show" | "cancelled",
      rating,
      agent_notes: notes,
    })
    .eq("id", viewingId);

  if (error) throw new Error(error.message);

  revalidatePath("/viewings");
  revalidatePath("/dashboard");
}
