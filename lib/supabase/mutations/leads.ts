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

/** Create a new lead from form data. */
export async function createLead(formData: FormData) {
  const { supabase, userId } = await getUser();

  const phone = String(formData.get("phone") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();

  if (!fullName || !phone) {
    redirect(`/leads/new?error=${encodeURIComponent("Name and phone are required.")}`);
  }

  const budgetMin = Number(formData.get("budgetMin")) || null;
  const budgetMax = Number(formData.get("budgetMax")) || null;
  const bedrooms = Number(formData.get("bedrooms")) || null;
  const locationPrefs = formData.getAll("areas").map(String).filter(Boolean);

  const insert: TablesInsert<"leads"> = {
    agent_id: userId,
    full_name: fullName,
    phone,
    email: String(formData.get("email") ?? "").trim() || null,
    company: String(formData.get("company") ?? "").trim() || null,
    source: (String(formData.get("source") ?? "manual")) as TablesInsert<"leads">["source"],
    property_type: (String(formData.get("propertyType") ?? "").trim() || null) as TablesInsert<"leads">["property_type"],
    bedrooms,
    budget_min: budgetMin,
    budget_max: budgetMax,
    location_prefs: locationPrefs.length > 0 ? locationPrefs : null,
    timeline: (String(formData.get("timeline") ?? "").trim() || null) as TablesInsert<"leads">["timeline"],
    notes: String(formData.get("notes") ?? "").trim() || null,
    stage: "new",
    score: 0,
  };

  const { data, error } = await supabase.from("leads").insert(insert).select("id").single();

  if (error) {
    if (error.code === "23505") {
      redirect(`/leads/new?error=${encodeURIComponent("A lead with that phone number already exists.")}`);
    }
    redirect(`/leads/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/leads");
  redirect(`/leads/${data.id}`);
}

/** Move a lead to a new stage, writing to lead_stage_history. */
export async function updateLeadStage(formData: FormData) {
  const { supabase, userId } = await getUser();

  const leadId = String(formData.get("leadId") ?? "");
  const toStage = String(formData.get("toStage") ?? "");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { data: current, error: readError } = await supabase
    .from("leads")
    .select("stage")
    .eq("id", leadId)
    .single();

  if (readError || !current) redirect(`/leads/${leadId}?error=Lead+not+found`);

  // Write immutable history row
  await supabase.from("lead_stage_history").insert({
    lead_id: leadId,
    agent_id: userId,
    from_stage: current!.stage,
    to_stage: toStage,
    notes,
  });

  const { error } = await supabase
    .from("leads")
    .update({ stage: toStage, stage_entered_at: new Date().toISOString() })
    .eq("id", leadId);

  if (error) redirect(`/leads/${leadId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
}

/**
 * Archive a lead (soft delete).
 * Used with .bind(null, leadId) so formData arrives as the second arg (ignored).
 */
export async function archiveLead(leadId: string, _formData?: FormData) {
  const { supabase } = await getUser();

  const { error } = await supabase.from("leads").update({ archived: true }).eq("id", leadId);
  if (error) redirect(`/leads/${leadId}?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/leads");
  redirect("/leads");
}

/** Hard delete a lead. */
export async function deleteLead(formData: FormData) {
  const { supabase } = await getUser();
  const leadId = String(formData.get("leadId") ?? "");

  const { error } = await supabase.from("leads").delete().eq("id", leadId);
  if (error) throw new Error(error.message);

  revalidatePath("/leads");
  redirect("/leads");
}
