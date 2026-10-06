"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { aiActions } from "@/lib/db/schema";
import type { AiAction } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

type AiActionInsert = typeof aiActions.$inferInsert;

/** Mark an AI action as completed. */
export async function completeAction(formData: FormData) {
  await requireUser();
  const actionId = String(formData.get("actionId") ?? "");

  await db
    .update(aiActions)
    .set({ completed: true, completedAt: new Date() })
    .where(eq(aiActions.id, actionId));

  revalidatePath("/ai-actions");
  revalidatePath("/dashboard");
}

/** Dismiss an AI action. */
export async function dismissAction(formData: FormData) {
  await requireUser();
  const actionId = String(formData.get("actionId") ?? "");

  await db
    .update(aiActions)
    .set({ dismissed: true })
    .where(eq(aiActions.id, actionId));

  revalidatePath("/ai-actions");
  revalidatePath("/dashboard");
}

/**
 * Server-side insert for scheduled job use (e.g. cron-generated AI actions).
 * Not exposed as a "use server" form action — called directly from server code.
 */
export async function createAIAction(
  agentId: string,
  data: Omit<AiActionInsert, "agentId">,
) {
  await db.insert(aiActions).values({
    agentId,
    ...data,
  });
}
