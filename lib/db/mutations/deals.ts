"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { deals, dealOffers } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";

type DealInsert = typeof deals.$inferInsert;

/** Create a new deal. */
export async function createDeal(formData: FormData) {
  const userId = await requireUser();

  const leadId = String(formData.get("lead") ?? "").trim();
  const propertyId = String(formData.get("property") ?? "").trim();
  const askingPrice = Number(formData.get("askingPrice")) || 0;

  if (!leadId || !propertyId || !askingPrice) {
    redirect(`/deals/new?error=${encodeURIComponent("Lead, property and asking price are required.")}`);
  }

  const agreedPrice = Number(formData.get("agreedPrice")) || null;
  const commissionRate = Number(formData.get("commissionRate")) / 100 || 0.05;
  const closeDateStr = String(formData.get("closeDate") ?? "").trim();

  const insert: DealInsert = {
    agentId: userId,
    leadId,
    propertyId,
    askingPrice,
    agreedPrice,
    commissionRate,
    expectedCloseDate: closeDateStr || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    status: "negotiating",
    closingProbability: 0.3,
  };

  try {
    await db.insert(deals).values(insert);

    revalidatePath("/deals");
    redirect("/deals");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    redirect(`/deals/new?error=${encodeURIComponent(message)}`);
  }
}

/** Move a deal to a new status and optionally update agreed price. */
export async function updateDealStatus(formData: FormData) {
  await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  const status = String(formData.get("status") ?? "");
  const agreedPrice = Number(formData.get("agreedPrice")) || null;

  // Compute commission when completing
  let commissionAmount: number | null = null;
  if (status === "completed" && agreedPrice) {
    const [deal] = await db
      .select({ commissionRate: deals.commissionRate })
      .from(deals)
      .where(eq(deals.id, dealId))
      .limit(1);

    if (deal) {
      commissionAmount = Math.round(agreedPrice * deal.commissionRate);
    }
  }

  await db
    .update(deals)
    .set({
      status,
      agreedPrice,
      commissionAmount,
    })
    .where(eq(deals.id, dealId));

  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

/** Log a counter-offer in deal_offers. */
export async function logOffer(formData: FormData) {
  await requireUser();

  const dealId = String(formData.get("dealId") ?? "");
  const amount = Number(formData.get("amount")) || 0;
  const offeredBy = String(formData.get("offeredBy") ?? "buyer");
  const notes = String(formData.get("notes") ?? "").trim() || null;

  await db.insert(dealOffers).values({ dealId, amount, offeredBy, notes });

  revalidatePath("/deals");
}

/** Hard delete a deal. */
export async function deleteDeal(formData: FormData) {
  await requireUser();
  const dealId = String(formData.get("dealId") ?? "");

  await db.delete(deals).where(eq(deals.id, dealId));

  revalidatePath("/deals");
  redirect("/deals");
}
