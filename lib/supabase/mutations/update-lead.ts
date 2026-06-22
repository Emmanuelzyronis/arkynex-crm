"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase };
}

export async function updateLead(formData: FormData) {
  const { supabase } = await getUser();

  const leadId = String(formData.get("leadId") ?? "");
  const locationPrefs = formData.getAll("areas").map(String).filter(Boolean);

  const { error } = await supabase
    .from("leads")
    .update({
      full_name: String(formData.get("fullName") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      email: String(formData.get("email") ?? "").trim() || null,
      company: String(formData.get("company") ?? "").trim() || null,
      property_type: (String(formData.get("propertyType") ?? "").trim() || null) as
        | "apartment" | "house" | "land" | "commercial" | "any" | null,
      bedrooms: Number(formData.get("bedrooms")) || null,
      budget_min: Number(formData.get("budgetMin")) || null,
      budget_max: Number(formData.get("budgetMax")) || null,
      location_prefs: locationPrefs.length > 0 ? locationPrefs : null,
      timeline: (String(formData.get("timeline") ?? "").trim() || null) as
        | "immediately" | "1_month" | "3_months" | "6_months" | "just_looking" | null,
      notes: String(formData.get("notes") ?? "").trim() || null,
    })
    .eq("id", leadId);

  if (error) {
    redirect(`/leads/${leadId}?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");
  redirect(`/leads/${leadId}?success=1`);
}
