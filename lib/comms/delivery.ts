import "server-only";

/**
 * Outbound delivery for email and SMS.
 *
 * Deliberately dependency-free: talks to provider REST APIs over `fetch` so the
 * whole app keeps shipping through the Vercel build without new packages.
 *
 *   Email → Resend  (https://resend.com/docs/api-reference/emails/send-email)
 *   SMS   → Twilio  (https://www.twilio.com/docs/messaging/api/message-resource)
 *
 * When a provider isn't configured, `sendEmail`/`sendSms` return
 * `{ ok: false, error: "not_configured" }` and the caller keeps the message as a
 * logged communication instead of silently dropping it.
 */

export type DeliveryResult =
  | { ok: true; providerId: string | null; skipped?: false }
  | { ok: false; error: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export function isSmsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM_NUMBER,
  );
}

export function deliveriesEnabled(): boolean {
  return isEmailConfigured() || isSmsConfigured();
}

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<DeliveryResult> {
  if (!isEmailConfigured()) return { ok: false, error: "not_configured" };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        ...(input.html ? { html: input.html } : {}),
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
      }),
      signal: controller.signal,
    });

    const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
    if (!res.ok) {
      console.error(`[email] Resend error ${res.status}: ${data.message ?? ""}`);
      return { ok: false, error: data.message ?? `resend_${res.status}` };
    }
    return { ok: true, providerId: data.id ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("[email] send failed:", message);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}

export async function sendSms(input: { to: string; body: string }): Promise<DeliveryResult> {
  if (!isSmsConfigured()) return { ok: false, error: "not_configured" };

  const sid = process.env.TWILIO_ACCOUNT_SID as string;
  const params = new URLSearchParams({
    To: input.to,
    From: process.env.TWILIO_FROM_NUMBER as string,
    Body: input.body,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded",
          authorization:
            "Basic " +
            Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64"),
        },
        body: params.toString(),
        signal: controller.signal,
      },
    );

    const data = (await res.json().catch(() => ({}))) as { sid?: string; message?: string };
    if (!res.ok) {
      console.error(`[sms] Twilio error ${res.status}: ${data.message ?? ""}`);
      return { ok: false, error: data.message ?? `twilio_${res.status}` };
    }
    return { ok: true, providerId: data.sid ?? null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    console.error("[sms] send failed:", message);
    return { ok: false, error: message };
  } finally {
    clearTimeout(timeout);
  }
}
