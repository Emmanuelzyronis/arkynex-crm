import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { webhookLogs } from "@/lib/db/schema";
import type { WebhookLog } from "@/lib/db/schema";

type WebhookLogInsert = typeof webhookLogs.$inferInsert;

/** Insert a new webhook log entry. */
export async function createWebhookLog(data: {
  source: string;
  eventType?: string;
  payload?: unknown;
  processed?: boolean;
  error?: string;
}): Promise<WebhookLog> {
  const [log] = await db
    .insert(webhookLogs)
    .values({
      source: data.source,
      eventType: data.eventType ?? null,
      payload: data.payload ?? undefined,
      processed: data.processed ?? false,
      error: data.error ?? null,
    })
    .returning();

  return log;
}

/** Update an existing webhook log entry. */
export async function updateWebhookLog(
  id: string,
  data: { processed?: boolean; error?: string },
): Promise<WebhookLog | undefined> {
  const [log] = await db
    .update(webhookLogs)
    .set({
      processed: data.processed,
      error: data.error,
    })
    .where(eq(webhookLogs.id, id))
    .returning();

  return log;
}
