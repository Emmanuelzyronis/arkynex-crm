import { createClient } from "@supabase/supabase-js";
import type { Database, TablesInsert } from "@/lib/supabase/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PAIRING_PREFIX = "ARK-";

/** Verify the X-Hub-Signature-256 header from Meta. */
async function verifyMetaSignature(
  body: string,
  signature: string | null,
  appSecret: string,
): Promise<boolean> {
  if (!signature?.startsWith("sha256=")) return false;
  const expected = signature.slice(7);

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  const hex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hex === expected;
}

/** Normalise any phone format to +234XXXXXXXXXX. */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("234")) return `+${digits}`;
  if (digits.startsWith("0")) return `+234${digits.slice(1)}`;
  if (digits.length === 10) return `+234${digits}`;
  return `+${digits}`;
}

// ─── Service-role Supabase client (server-only) ────────────────────────────

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient<Database>(url, key);
}

// ─── GET — Meta webhook verification ──────────────────────────────────────────

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === "subscribe" && token === verifyToken) {
    console.log("[wa-webhook] ✓ verified by Meta");
    return new Response(challenge, { status: 200 });
  }

  return new Response("Forbidden", { status: 403 });
}

// ─── POST — incoming messages ──────────────────────────────────────────────────

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-hub-signature-256");
  const appSecret = process.env.WHATSAPP_APP_SECRET ?? "";

  // Verify signature (skip in dev if secret not set)
  if (appSecret && !(await verifyMetaSignature(rawBody, signature, appSecret))) {
    console.warn("[wa-webhook] ✗ invalid signature");
    return new Response("Unauthorized", { status: 401 });
  }

  // Log raw payload for debugging
  const supabase = getServiceClient();
  let payload: Record<string, unknown>;

  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Always log to webhook_logs for debugging
  await supabase.from("webhook_logs").insert({
    source: "whatsapp",
    event_type: "incoming",
    payload: payload as Record<string, unknown>,
  });

  // Extract messages from the Meta payload structure
  const entries = (payload.entry as Record<string, unknown>[] | undefined) ?? [];

  for (const entry of entries) {
    const changes = (entry.changes as Record<string, unknown>[] | undefined) ?? [];

    for (const change of changes) {
      const value = change.value as Record<string, unknown> | undefined;
      if (!value) continue;

      const messages = (value.messages as Record<string, unknown>[] | undefined) ?? [];
      const contacts = (value.contacts as Record<string, unknown>[] | undefined) ?? [];

      for (const message of messages) {
        const messageId = String(message.id ?? "");
        const from = String(message.from ?? "");
        const timestamp = String(message.timestamp ?? "");
        const msgType = String(message.type ?? "text");

        // Extract text content
        let content: string | null = null;
        if (msgType === "text") {
          content = String(
            (message.text as Record<string, unknown> | undefined)?.body ?? "",
          );
        } else if (msgType === "image" || msgType === "document") {
          content = `[${msgType}]`;
        }

        const senderPhone = normalisePhone(from);
        const senderName =
          (contacts[0] as Record<string, unknown> | undefined)?.profile
            ? String(
                (
                  (contacts[0] as Record<string, unknown>).profile as Record<
                    string,
                    unknown
                  >
                ).name ?? "",
              )
            : null;

        // ── Check for pairing code ────────────────────────────────────────────
        if (content?.trim().toUpperCase().startsWith(PAIRING_PREFIX)) {
          const code = content.trim().toUpperCase();
          await handlePairing(supabase, code, senderPhone, messageId);
          continue;
        }

        // ── Route message to the correct agent + lead ─────────────────────────
        await routeMessage(supabase, {
          senderPhone,
          senderName,
          content,
          messageId,
          timestamp,
          msgType,
        });
      }
    }
  }

  // Always return 200 — Meta retries on anything else
  return new Response("OK", { status: 200 });
}

// ─── Pairing ──────────────────────────────────────────────────────────────────

async function handlePairing(
  supabase: ReturnType<typeof getServiceClient>,
  code: string,
  senderPhone: string,
  messageId: string,
) {
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, whatsapp_pairing_expires, whatsapp_phone")
    .eq("whatsapp_pairing_code", code)
    .single();

  if (error || !profile) {
    console.warn(`[wa-webhook] pairing code not found: ${code}`);
    return;
  }

  if (new Date(profile.whatsapp_pairing_expires!) < new Date()) {
    console.warn(`[wa-webhook] pairing code expired: ${code}`);
    return;
  }

  // Mark as verified, store confirmed phone number from the actual WA message
  await supabase
    .from("profiles")
    .update({
      whatsapp_phone: senderPhone,       // confirmed from actual message
      whatsapp_verified_at: new Date().toISOString(),
      whatsapp_pairing_code: null,
      whatsapp_pairing_expires: null,
    })
    .eq("id", profile.id);

  console.log(`[wa-webhook] ✓ paired agent ${profile.id} → ${senderPhone}`);

  // Optionally: send a confirmation message back via the Meta API
  // (requires WHATSAPP_PHONE_NUMBER_ID + WHATSAPP_ACCESS_TOKEN env vars)
  await sendWhatsAppMessage(
    senderPhone,
    "✅ Your WhatsApp is now connected to Arkynex CRM. Leads who message this number will be automatically captured in your pipeline.",
  );
}

// ─── Message routing ──────────────────────────────────────────────────────────

async function routeMessage(
  supabase: ReturnType<typeof getServiceClient>,
  {
    senderPhone,
    senderName,
    content,
    messageId,
    timestamp,
    msgType,
  }: {
    senderPhone: string;
    senderName: string | null;
    content: string | null;
    messageId: string;
    timestamp: string;
    msgType: string;
  },
) {
  // 1. Find an existing lead with this phone across all agents
  const { data: existingLead } = await supabase
    .from("leads")
    .select("id, agent_id, full_name")
    .eq("phone", senderPhone)
    .single();

  if (existingLead) {
    // Log the communication to the existing lead's timeline
    await supabase.from("communications").insert({
      lead_id: existingLead.id,
      agent_id: existingLead.agent_id,
      channel: "whatsapp",
      direction: "inbound",
      content,
      whatsapp_message_id: messageId,
      wa_status: "delivered",
    } satisfies TablesInsert<"communications">);

    // Update last contacted timestamp
    await supabase
      .from("leads")
      .update({ last_contacted_at: new Date(Number(timestamp) * 1000).toISOString() })
      .eq("id", existingLead.id);

    // Trigger score refresh via the score-lead Edge Function
    await triggerScoreUpdate(existingLead.id);

    console.log(
      `[wa-webhook] logged message from ${senderPhone} → lead ${existingLead.id} (agent ${existingLead.agent_id})`,
    );
    return;
  }

  // 2. No existing lead — we don't know which agent to assign to
  //    Log to webhook_logs with event_type "unmatched" for manual review
  console.warn(
    `[wa-webhook] unmatched phone ${senderPhone} — no lead found; name: ${senderName}`,
  );

  await supabase.from("webhook_logs").insert({
    source: "whatsapp",
    event_type: "unmatched_lead",
    payload: {
      phone: senderPhone,
      name: senderName,
      content,
      messageId,
      note: "No existing lead found for this phone number. Agent needs to add manually.",
    },
    processed: false,
  });
}

// ─── Meta Cloud API send ──────────────────────────────────────────────────────

async function sendWhatsAppMessage(to: string, text: string) {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn("[wa-webhook] WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN not set — skipping send");
    return;
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: to.replace("+", ""),
          type: "text",
          text: { body: text },
        }),
      },
    );

    if (!res.ok) {
      console.error("[wa-webhook] send failed:", await res.text());
    }
  } catch (err) {
    console.error("[wa-webhook] send error:", err);
  }
}

// ─── Score trigger ─────────────────────────────────────────────────────────────

async function triggerScoreUpdate(leadId: string) {
  const fnUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(
    "supabase.co",
    "supabase.co/functions/v1/score-lead",
  );
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!fnUrl || !serviceKey) return;

  fetch(fnUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ leadId }),
  }).catch(() => {}); // fire-and-forget
}
