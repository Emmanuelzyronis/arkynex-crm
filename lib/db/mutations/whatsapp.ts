"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

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
  const userId = await requireUser();

  const phone = String(formData.get("whatsappPhone") ?? "").trim();
  if (!phone) {
    redirect("/settings?tab=whatsapp&error=" + encodeURIComponent("Phone number is required."));
  }

  // Normalise to E.164 (+234...)
  const normalised = phone.startsWith("+") ? phone : `+234${phone.replace(/^0/, "")}`;

  const code = generateCode();
  const expires = new Date(Date.now() + 30 * 60 * 1000); // 30 min

  await db
    .update(profiles)
    .set({
      whatsappPhone: normalised,
      whatsappPairingCode: code,
      whatsappPairingExpires: expires,
      whatsappVerifiedAt: null, // reset verification on new code
    })
    .where(eq(profiles.id, userId));

  revalidatePath("/settings");
  redirect("/settings?tab=whatsapp&code=" + encodeURIComponent(code));
}

/**
 * Called by the webhook when an agent successfully sends their code.
 * Server-only — not exposed as a user form action.
 */
export async function verifyPairingCode(code: string) {
  const [profile] = await db
    .select({
      id: profiles.id,
      whatsappPairingExpires: profiles.whatsappPairingExpires,
    })
    .from(profiles)
    .where(eq(profiles.whatsappPairingCode, code))
    .limit(1);

  if (!profile) {
    return { success: false, error: "Invalid pairing code." };
  }

  if (profile.whatsappPairingExpires && new Date(profile.whatsappPairingExpires) < new Date()) {
    return { success: false, error: "Pairing code has expired. Generate a new one in Settings." };
  }

  await db
    .update(profiles)
    .set({
      whatsappVerifiedAt: new Date(),
      whatsappPairingCode: null,       // invalidate after use
      whatsappPairingExpires: null,
    })
    .where(eq(profiles.id, profile.id));

  return { success: true, agentId: profile.id };
}

/** Disconnect WhatsApp — clears number and verification. */
export async function disconnectWhatsApp(_formData?: FormData) {
  const userId = await requireUser();

  await db
    .update(profiles)
    .set({
      whatsappPhone: null,
      whatsappPairingCode: null,
      whatsappPairingExpires: null,
      whatsappVerifiedAt: null,
    })
    .where(eq(profiles.id, userId));

  revalidatePath("/settings");
  redirect("/settings?tab=whatsapp");
}
