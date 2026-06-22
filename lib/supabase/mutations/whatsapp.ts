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

/** Generates a unique ARK-XXXXX pairing code (alphanumeric, uppercase). */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars 0/O/1/I
  let code = "ARK-";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Saves the agent's WhatsApp number and generates a fresh pairing code.
 * Code expires in 30 minutes.
 */
export async function generatePairingCode(formData: FormData) {
  const { supabase, userId } = await getUser();

  const phone = String(formData.get("whatsappPhone") ?? "").trim();
  if (!phone) {
    redirect("/settings?tab=whatsapp&error=" + encodeURIComponent("Phone number is required."));
  }

  // Normalise to E.164 (+234...)
  const normalised = phone.startsWith("+") ? phone : `+234${phone.replace(/^0/, "")}`;

  const code = generateCode();
  const expires = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 min

  const { error } = await supabase
    .from("profiles")
    .update({
      whatsapp_phone: normalised,
      whatsapp_pairing_code: code,
      whatsapp_pairing_expires: expires,
      whatsapp_verified_at: null, // reset verification on new code
    })
    .eq("id", userId);

  if (error) {
    redirect("/settings?tab=whatsapp&error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/settings");
  redirect("/settings?tab=whatsapp&code=" + encodeURIComponent(code));
}

/**
 * Called by the webhook when an agent successfully sends their code.
 * Uses the service-role client (server-only — not exposed as a user action).
 */
export async function verifyPairingCode(code: string) {
  const supabase = await createClient();

  const { data: profile, error: fetchError } = await supabase
    .from("profiles")
    .select("id, whatsapp_pairing_expires")
    .eq("whatsapp_pairing_code", code)
    .single();

  if (fetchError || !profile) {
    return { success: false, error: "Invalid pairing code." };
  }

  if (new Date(profile.whatsapp_pairing_expires!) < new Date()) {
    return { success: false, error: "Pairing code has expired. Generate a new one in Settings." };
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      whatsapp_verified_at: new Date().toISOString(),
      whatsapp_pairing_code: null,       // invalidate after use
      whatsapp_pairing_expires: null,
    })
    .eq("id", profile.id);

  if (updateError) return { success: false, error: updateError.message };

  return { success: true, agentId: profile.id };
}

/** Disconnect WhatsApp — clears number and verification. */
export async function disconnectWhatsApp(_formData?: FormData) {
  const { supabase, userId } = await getUser();

  const { error } = await supabase
    .from("profiles")
    .update({
      whatsapp_phone: null,
      whatsapp_pairing_code: null,
      whatsapp_pairing_expires: null,
      whatsapp_verified_at: null,
    })
    .eq("id", userId);

  if (error) redirect("/settings?tab=whatsapp&error=" + encodeURIComponent(error.message));

  revalidatePath("/settings");
  redirect("/settings?tab=whatsapp");
}
