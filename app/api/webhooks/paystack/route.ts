import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// ─── Plan mapping — Paystack plan codes → Arkynex tier ────────────────────────
// Add your actual Paystack plan codes here after creating plans in the dashboard.
const PLAN_CODE_TO_TIER: Record<string, "starter" | "pro" | "agency"> = {
  [process.env.PAYSTACK_PLAN_STARTER ?? "PLN_starter"]: "starter",
  [process.env.PAYSTACK_PLAN_PRO ?? "PLN_pro"]: "pro",
  [process.env.PAYSTACK_PLAN_AGENCY ?? "PLN_agency"]: "agency",
};

function planFromCode(code: string): "starter" | "pro" | "agency" {
  return PLAN_CODE_TO_TIER[code] ?? "starter";
}

function getServiceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/** Verify Paystack HMAC-SHA512 signature. */
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret || !signature) return false;
  const expected = crypto
    .createHmac("sha512", secret)
    .update(body)
    .digest("hex");
  return expected === signature;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifySignature(rawBody, signature)) {
    console.warn("[paystack-webhook] ✗ invalid signature");
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const event = String(payload.event ?? "");
  const data = (payload.data ?? {}) as Record<string, unknown>;
  const supabase = getServiceClient();

  // Log every event for debugging
  await supabase.from("webhook_logs").insert({
    source: "paystack",
    event_type: event,
    payload: payload as Record<string, unknown>,
    processed: false,
  });

  try {
    switch (event) {
      case "charge.success":
        await handleChargeSuccess(supabase, data);
        break;
      case "subscription.create":
        await handleSubscriptionCreate(supabase, data);
        break;
      case "subscription.disable":
      case "subscription.not_renew":
        await handleSubscriptionDisable(supabase, data, event);
        break;
      case "invoice.payment_failed":
        await handlePaymentFailed(supabase, data);
        break;
      default:
        console.log(`[paystack-webhook] unhandled event: ${event}`);
    }

    // Mark as processed
    await supabase
      .from("webhook_logs")
      .update({ processed: true })
      .eq("event_type", event)
      .order("created_at", { ascending: false })
      .limit(1);
  } catch (err) {
    console.error(`[paystack-webhook] error handling ${event}:`, err);
    await supabase
      .from("webhook_logs")
      .update({ error: String(err) })
      .eq("event_type", event)
      .order("created_at", { ascending: false })
      .limit(1);
  }

  // Always return 200 — Paystack retries on non-2xx
  return new Response("OK", { status: 200 });
}

// ─── Event handlers ────────────────────────────────────────────────────────────

async function handleChargeSuccess(
  supabase: ReturnType<typeof getServiceClient>,
  data: Record<string, unknown>,
) {
  // charge.success fires on first payment of a new subscription and renewals
  const customer = data.customer as Record<string, unknown> | undefined;
  const paystackCustomerCode = String(customer?.customer_code ?? "");
  const subscriptionCode = String(
    (data.subscription as Record<string, unknown> | undefined)?.subscription_code ?? "",
  );
  const planCode = String(
    (
      (data.subscription as Record<string, unknown> | undefined)
        ?.plan as Record<string, unknown> | undefined
    )?.plan_code ?? "",
  );

  if (!paystackCustomerCode) return;

  const tier = planFromCode(planCode);
  const paidAt = String(data.paid_at ?? new Date().toISOString());

  // Find agent by Paystack customer code
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("paystack_customer_code", paystackCustomerCode)
    .single();

  if (!profile) {
    console.warn(`[paystack] no agent for customer ${paystackCustomerCode}`);
    return;
  }

  // Update profile tier + subscription_status
  await supabase.from("profiles").update({
    tier,
    subscription_status: "active",
    trial_ends_at: null,
  }).eq("id", profile.id);

  // Upsert subscription row
  if (subscriptionCode) {
    await supabase.from("subscriptions").upsert({
      agent_id: profile.id,
      plan: tier,
      status: "active",
      paystack_subscription_code: subscriptionCode,
      paystack_plan_code: planCode,
      current_period_start: paidAt,
      current_period_end: new Date(
        new Date(paidAt).getTime() + 30 * 24 * 60 * 60 * 1000,
      ).toISOString(),
    }, {
      onConflict: "paystack_subscription_code",
    });
  }

  console.log(
    `[paystack] ✓ charge.success → agent ${profile.id} → ${tier} (active)`,
  );
}

async function handleSubscriptionCreate(
  supabase: ReturnType<typeof getServiceClient>,
  data: Record<string, unknown>,
) {
  const customer = data.customer as Record<string, unknown> | undefined;
  const paystackCustomerCode = String(customer?.customer_code ?? "");
  const subscriptionCode = String(data.subscription_code ?? "");
  const planCode = String(
    (data.plan as Record<string, unknown> | undefined)?.plan_code ?? "",
  );
  const nextPaymentDate = String(data.next_payment_date ?? "");
  const startedAt = String(data.createdAt ?? new Date().toISOString());

  if (!paystackCustomerCode) return;

  const tier = planFromCode(planCode);

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("paystack_customer_code", paystackCustomerCode)
    .single();

  if (!profile) return;

  await supabase.from("subscriptions").upsert({
    agent_id: profile.id,
    plan: tier,
    status: "active",
    paystack_subscription_code: subscriptionCode,
    paystack_plan_code: planCode,
    current_period_start: startedAt,
    current_period_end: nextPaymentDate || null,
  }, { onConflict: "paystack_subscription_code" });

  await supabase.from("profiles").update({
    tier,
    subscription_status: "active",
    trial_ends_at: null,
  }).eq("id", profile.id);

  console.log(`[paystack] ✓ subscription.create → agent ${profile.id} → ${tier}`);
}

async function handleSubscriptionDisable(
  supabase: ReturnType<typeof getServiceClient>,
  data: Record<string, unknown>,
  event: string,
) {
  const subscriptionCode = String(data.subscription_code ?? "");
  if (!subscriptionCode) return;

  const newStatus = event === "subscription.not_renew" ? "cancelled" : "cancelled";

  await supabase
    .from("subscriptions")
    .update({ status: newStatus })
    .eq("paystack_subscription_code", subscriptionCode);

  // Find the agent via subscription
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("agent_id")
    .eq("paystack_subscription_code", subscriptionCode)
    .single();

  if (sub) {
    await supabase.from("profiles").update({
      subscription_status: "cancelled",
    }).eq("id", sub.agent_id);
    console.log(`[paystack] ✓ ${event} → agent ${sub.agent_id} → cancelled`);
  }
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof getServiceClient>,
  data: Record<string, unknown>,
) {
  const customer = data.customer as Record<string, unknown> | undefined;
  const paystackCustomerCode = String(customer?.customer_code ?? "");
  if (!paystackCustomerCode) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("paystack_customer_code", paystackCustomerCode)
    .single();

  if (!profile) return;

  await supabase.from("profiles").update({
    subscription_status: "past_due",
  }).eq("id", profile.id);

  console.log(`[paystack] invoice.payment_failed → agent ${profile.id} → past_due`);
}
