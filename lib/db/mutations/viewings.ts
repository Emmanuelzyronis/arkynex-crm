"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { viewings } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

type ViewingInsert = typeof viewings.$inferInsert;

/** Schedule a new viewing. */
export async function createViewing(formData: FormData) {
  const userId = await requireUser();

  const leadId = String(formData.get("lead") ?? "").trim();
  const propertyId = String(formData.get("property") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();

  if (!leadId || !propertyId || !date || !time) {
    redirect(`/viewings/new?error=${encodeURIComponent("Lead, property, date and time are all required.")}`);
  }

  const scheduledAt = new Date(`${date}T${time}:00`);

  const insert: ViewingInsert = {
    agentId: userId,
    leadId,
    propertyId,
    scheduledAt,
    status: "scheduled",
    agentNotes: String(formData.get("notes") ?? "").trim() || null,
  };

  try {
    await db.insert(viewings).values(insert);

    revalidatePath("/viewings");
    revalidatePath("/dashboard");
    redirect("/viewings");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(`/viewings/new?error=${encodeURIComponent(message)}`);
  }
}

/**
 * Update a viewing's status (e.g. attended, cancelled, no_show).
 * Also accepts rating and notes when logging an outcome.
 */
export async function updateViewingStatus(formData: FormData) {
  await requireUser();

  const viewingId = String(formData.get("viewingId") ?? "");
  const status = String(formData.get("status") ?? "");
  const rating = Number(formData.get("rating")) || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await db
    .update(viewings)
    .set({
      status,
      rating,
      agentNotes: notes,
    })
    .where(eq(viewings.id, viewingId));

  revalidatePath("/viewings");
  revalidatePath("/dashboard");
}
