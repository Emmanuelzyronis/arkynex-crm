"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { smartLists } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";
import { parseSmartListFilters } from "@/lib/leads/smart-lists";

const FILTER_FIELDS = [
  "stage",
  "search",
  "source",
  "propertyType",
  "timeline",
  "assignedToId",
  "sort",
  "minScore",
  "maxScore",
  "minBudget",
  "maxBudget",
  "lastContactedDays",
  "createdWithinDays",
] as const;

function readFilters(formData: FormData) {
  const raw: Record<string, string> = {};
  for (const field of FILTER_FIELDS) {
    const value = String(formData.get(field) ?? "").trim();
    if (value) raw[field] = value;
  }
  return parseSmartListFilters(raw);
}

export async function createSmartList(formData: FormData) {
  const userId = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;

  const filters = readFilters(formData);
  const icon = String(formData.get("icon") ?? "").trim() || null;

  const [maxRow] = await db
    .select({ max: sql<number>`coalesce(max(${smartLists.sortOrder}), 0)::int` })
    .from(smartLists)
    .where(eq(smartLists.agentId, userId));

  const [created] = await db
    .insert(smartLists)
    .values({
      agentId: userId,
      name,
      icon,
      filters,
      sortOrder: (maxRow?.max ?? 0) + 1,
    })
    .returning({ id: smartLists.id });

  revalidatePath("/leads");
  redirect(`/leads?list=${created.id}`);
}

export async function updateSmartList(formData: FormData) {
  const userId = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const name = String(formData.get("name") ?? "").trim();
  const filters = readFilters(formData);

  await db
    .update(smartLists)
    .set({
      ...(name ? { name } : {}),
      filters,
    })
    .where(and(eq(smartLists.id, id), eq(smartLists.agentId, userId)));

  revalidatePath("/leads");
  redirect(`/leads?list=${id}`);
}

export async function deleteSmartList(formData: FormData) {
  const userId = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .delete(smartLists)
    .where(and(eq(smartLists.id, id), eq(smartLists.agentId, userId)));

  revalidatePath("/leads");
  redirect("/leads");
}
