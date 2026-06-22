"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

export async function saveProfile(formData: FormData) {
  const { supabase, userId } = await getUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("fullName") ?? "").trim() || undefined,
      phone: String(formData.get("phone") ?? "").trim() || null,
      agency_name: String(formData.get("agencyName") ?? "").trim() || null,
      timezone: String(formData.get("timezone") ?? "Africa/Lagos"),
    })
    .eq("id", userId);

  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}&tab=profile`);

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect("/settings?success=profile");
}

export async function saveWhatsAppSettings(formData: FormData) {
  const { supabase, userId } = await getUser();

  const whatsappPhone = String(formData.get("whatsappPhone") ?? "").trim() || null;

  const { error } = await supabase
    .from("profiles")
    .update({ whatsapp_phone: whatsappPhone })
    .eq("id", userId);

  if (error) redirect(`/settings?error=${encodeURIComponent(error.message)}&tab=whatsapp`);

  revalidatePath("/settings");
  redirect("/settings?success=whatsapp");
}
