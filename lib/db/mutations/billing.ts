"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

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
  const userId = await requireUser();
  const origin = await getOrigin();

  const planCode = String(formData.get("planCode") ?? "").trim();
  if (!planCode) redirect("/settings?tab=billing&error=Plan+not+found");

  // Fetch profile for email and customer code
  const [profile] = await db
    .select({
      fullName: profiles.fullName,
      paystackCustomerCode: profiles.paystackCustomerCode,
    })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  // We need the user's email — fetch from Clerk or use stored profile
  // For now we use the profile's full name as metadata; email comes from Clerk session
  const { clerkClient } = await import("@clerk/nextjs/server");
  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    redirect("/settings?tab=billing&error=" + encodeURIComponent("Paystack not configured."));
  }

  const body: Record<string, unknown> = {
    email,
    plan: planCode,
    callback_url: `${origin}/api/billing/paystack-callback`,
    metadata: {
      agent_id: userId,
      agent_name: profile?.fullName ?? "",
    },
  };

  if (profile?.paystackCustomerCode) {
    body.customer = profile.paystackCustomerCode;
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
  const userId = await requireUser();

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

  const json = (await res.json()) as { status: boolean; message?: string };

  if (!json.status) {
    redirect("/settings?tab=billing&error=" + encodeURIComponent(json.message ?? "Cancellation failed."));
  }

  // Update locally — webhook will also fire, but update optimistically
  await db
    .update(profiles)
    .set({ subscriptionStatus: "cancelled" })
    .where(eq(profiles.id, userId));

  redirect("/settings?tab=billing&success=cancelled");
}
