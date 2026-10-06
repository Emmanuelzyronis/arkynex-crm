import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { subscriptions, webhookLogs } from "@/lib/db/schema";
import type { Subscription } from "@/lib/db/schema";

export type { Subscription };

export async function getLatestSubscription(
  agentId: string,
): Promise<Subscription | null> {
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.agentId, agentId))
    .orderBy(desc(subscriptions.updatedAt))
    .limit(1);
  return row ?? null;
}

export type WebhookSummary = {
  eventType: string | null;
  processed: boolean;
  error: string | null;
  createdAt: Date;
};

/** Latest Clerk Billing delivery (event type + outcome only — no payload). */
export async function getLastClerkWebhook(): Promise<WebhookSummary | null> {
  const [row] = await db
    .select({
      eventType: webhookLogs.eventType,
      processed: webhookLogs.processed,
      error: webhookLogs.error,
      createdAt: webhookLogs.createdAt,
    })
    .from(webhookLogs)
    .where(eq(webhookLogs.source, "clerk"))
    .orderBy(desc(webhookLogs.createdAt))
    .limit(1);
  return row ?? null;
}
