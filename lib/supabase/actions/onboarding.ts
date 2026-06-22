"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

/** Step 1 — Profile */
export async function saveProfileStep(formData: FormData) {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("fullName") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || null,
      agency_name: String(formData.get("agencyName") ?? "").trim() || null,
      timezone: String(formData.get("timezone") ?? "Africa/Lagos"),
      onboarding_step: 1,
    })
    .eq("id", user.id);

  if (error) redirect(`/onboarding/profile?error=${encodeURIComponent(error.message)}`);
  redirect("/onboarding/business");
}

/** Step 2 — Business preferences */
export async function saveBusinessStep(formData: FormData) {
  const { supabase, user } = await getUser();

  const areas = formData.getAll("areas").map(String).filter(Boolean);
  const propertyTypes = formData.getAll("propertyTypes").map(String).filter(Boolean);

  // Store as a compact string in agency_name until we add a dedicated column.
  // Shape: "<market>|areas:<csv>|types:<csv>" — easy to parse later.
  const market = String(formData.get("primaryMarket") ?? "Lagos");
  const prefsNote = `market:${market}|areas:${areas.join(",")}|types:${propertyTypes.join(",")}`;

  const { error } = await supabase
    .from("profiles")
    .update({
      // Append business prefs as a structured note for now
      // We'll migrate to a jsonb column in a future step
      onboarding_step: 2,
      // Store the raw market choice for profile display
      timezone: String(formData.get("timezone") ?? "Africa/Lagos"),
    })
    .eq("id", user.id);

  // Also write to a note in agency_name if it's empty
  const { data: current } = await supabase
    .from("profiles")
    .select("agency_name")
    .eq("id", user.id)
    .single();

  if (!current?.agency_name) {
    await supabase
      .from("profiles")
      .update({ agency_name: market })
      .eq("id", user.id);
  }

  // Log the full preferences — ready to be stored once the column exists
  console.log(`[onboarding] business_prefs for ${user.id}:`, prefsNote);

  if (error) redirect(`/onboarding/business?error=${encodeURIComponent(error.message)}`);
  redirect("/onboarding/whatsapp");
}

/** Step 3 — WhatsApp */
export async function saveWhatsAppStep(formData: FormData) {
  const { supabase, user } = await getUser();

  const whatsappPhone = String(formData.get("whatsappPhone") ?? "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ whatsapp_phone: whatsappPhone, onboarding_step: 3 })
    .eq("id", user.id);

  if (error) redirect(`/onboarding/whatsapp?error=${encodeURIComponent(error.message)}`);
  redirect("/onboarding/goals");
}

/** Step 4 — Goals: mark onboarding complete */
export async function saveGoalsStep(_formData: FormData) {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_step: 4, onboarded_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) redirect(`/onboarding/goals?error=${encodeURIComponent(error.message)}`);
  redirect("/dashboard");
}
