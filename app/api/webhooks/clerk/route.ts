import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles, subscriptions, webhookLogs } from "@/lib/db/schema";
import { verifySvixSignature } from "@/lib/billing/svix";
import { PLAN_SLUGS } from "@/lib/billing/plans";

type Json = Record<string, unknown>;

function str(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function toDate(value: unknown): Date | null {
  if (typeof value === "number") {
    const ms = value < 1e12 ? value * 1000 : value;
    const date = new Date(ms);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function extractUserId(data: Json): string | null {
  const payer = data.payer as Json | undefined;
  return (
    str(data.payer_id) ??
    str(data.user_id) ??
    (payer ? str(payer.user_id) ?? str(payer.id) : null)
  );
}

function extractPlan(data: Json): { slug: string | null; id: string | null } {
  const plan = data.plan as Json | undefined;
  let slug = plan ? str(plan.slug) : null;
  let id = plan ? str(plan.id) : null;
  if (!slug) slug = str(data.plan_slug);
  if (!id) id = str(data.plan_id);

  const items = (data.items ?? data.subscription_items) as unknown;
  if ((!slug || !id) && Array.isArray(items)) {
    for (const raw of items) {
      const item = raw as Json;
      const itemPlan = item.plan as Json | undefined;
      if (!slug) slug = (itemPlan ? str(itemPlan.slug) : null) ?? str(item.plan_slug);
      if (!id) id = (itemPlan ? str(itemPlan.id) : null) ?? str(item.plan_id);
    }
  }
  return { slug, id };
}

function mapStatus(status: string | null): string | null {
  if (!status) return null;
  switch (status.toLowerCase()) {
    case "active":
    case "paid":
      return "active";
    case "trialing":
    case "trial":
      return "trialing";
    case "past_due":
    case "pastdue":
      return "past_due";
    case "canceled":
    case "cancelled":
      return "cancelled";
    case "expired":
    case "ended":
    case "abandoned":
      return "expired";
    default:
      return status.toLowerCase();
  }
}

async function applySubscriptionEvent(data: Json): Promise<boolean> {
  const userId = extractUserId(data);
  const status = mapStatus(str(data.status));
  if (!userId || !status) return false;

  const [profile] = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  if (!profile) return false;

  const { slug, id: planId } = extractPlan(data);
  const tier =
    slug && (PLAN_SLUGS as readonly string[]).includes(slug) ? slug : undefined;

  await db
    .update(profiles)
    .set({ subscriptionStatus: status, ...(tier ? { tier } : {}) })
    .where(eq(profiles.id, userId));

  const subscriptionId = str(data.id);
  if (subscriptionId) {
    const [existing] = await db
      .select({ id: subscriptions.id })
      .from(subscriptions)
      .where(eq(subscriptions.clerkSubscriptionId, subscriptionId))
      .limit(1);

    const values = {
      agentId: userId,
      plan: tier ?? slug ?? "unknown",
      status,
      clerkSubscriptionId: subscriptionId,
      clerkPlanId: planId,
      currentPeriodStart: toDate(data.current_period_start ?? data.current_period_start_at),
      currentPeriodEnd: toDate(data.current_period_end ?? data.current_period_end_at),
    };

    if (existing) {
      await db.update(subscriptions).set(values).where(eq(subscriptions.id, existing.id));
    } else {
      await db.insert(subscriptions).values(values);
    }
  }

  return true;
}

export async function POST(request: Request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Clerk webhook not configured" }, { status: 503 });
  }

  const payload = await request.text();
  if (!verifySvixSignature(payload, request.headers, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { type?: string; data?: Json };
  try {
    event = JSON.parse(payload) as { type?: string; data?: Json };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.type ?? "unknown";
  const data = event.data ?? {};

  const [log] = await db
    .insert(webhookLogs)
    .values({ source: "clerk", eventType: type, payload: event })
    .returning({ id: webhookLogs.id });

  try {
    // Only top-level subscription events carry a trustworthy status + payer.
    const handled = type.startsWith("subscription.")
      ? await applySubscriptionEvent(data)
      : false;

    await db.update(webhookLogs).set({ processed: true }).where(eq(webhookLogs.id, log.id));
    return NextResponse.json({ ok: true, handled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    await db.update(webhookLogs).set({ error: message }).where(eq(webhookLogs.id, log.id));
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
