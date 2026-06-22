"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { createClient } from "@/lib/supabase/server";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

async function getOrigin() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

/**
 * Initialise a Paystack transaction and redirect to the Paystack checkout page.
 * On success, Paystack redirects back to /settings?tab=billing&ref=<reference>.
 */
export async function initializePaystackPayment(formData: FormData) {
  const { supabase, userId } = await getUser();
  const origin = await getOrigin();

  const planCode = String(formData.get("planCode") ?? "").trim();
  if (!planCode) redirect("/settings?tab=billing&error=Plan+not+found");

  // Get the agent's email and existing Paystack customer code
  const { data: { user } } = await supabase.auth.getUser();
  const email = user?.email ?? "";

  const { data: profile } = await supabase
    .from("profiles")
    .select("paystack_customer_code, full_name")
    .eq("id", userId)
    .single();

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    redirect("/settings?tab=billing&error=" + encodeURIComponent("Paystack not configured."));
  }

  // Initialize transaction via Paystack API
  const body: Record<string, unknown> = {
    email,
    plan: planCode,
    callback_url: `${origin}/api/billing/paystack-callback`,
    metadata: {
      agent_id: userId,
      agent_name: profile?.full_name ?? "",
    },
  };

  // If agent already has a Paystack customer, include it
  if (profile?.paystack_customer_code) {
    body.customer = profile.paystack_customer_code;
  }

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as {
    status: boolean;
    data?: { authorization_url: string; reference: string };
    message?: string;
  };

  if (!json.status || !json.data?.authorization_url) {
    redirect("/settings?tab=billing&error=" + encodeURIComponent(json.message ?? "Paystack error."));
  }

  redirect(json.data.authorization_url);
}

/**
 * Cancel a Paystack subscription.
 * Called from the billing section when the agent wants to cancel.
 */
export async function cancelPaystackSubscription(formData: FormData) {
  const { supabase, userId } = await getUser();

  const subscriptionCode = String(formData.get("subscriptionCode") ?? "").trim();
  const emailToken = String(formData.get("emailToken") ?? "").trim();

  if (!subscriptionCode) {
    redirect("/settings?tab=billing&error=No+active+subscription+found");
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) redirect("/settings?tab=billing&error=Paystack+not+configured");

  const res = await fetch("https://api.paystack.co/subscription/disable", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ code: subscriptionCode, token: emailToken }),
  });

  const json = await res.json() as { status: boolean; message?: string };

  if (!json.status) {
    redirect("/settings?tab=billing&error=" + encodeURIComponent(json.message ?? "Cancellation failed."));
  }

  // Update locally — webhook will also fire, but update optimistically
  await supabase.from("profiles").update({
    subscription_status: "cancelled",
  }).eq("id", userId);

  redirect("/settings?tab=billing&success=cancelled");
}
