"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/lib/supabase/types";

async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

export async function createDeal(formData: FormData) {
  const { supabase, userId } = await getUser();

  const leadId = String(formData.get("lead") ?? "").trim();
  const propertyId = String(formData.get("property") ?? "").trim();
  const askingPrice = Number(formData.get("askingPrice")) || 0;

  if (!leadId || !propertyId || !askingPrice) {
    redirect(`/deals/new?error=${encodeURIComponent("Lead, property and asking price are required.")}`);
  }

  const agreedPrice = Number(formData.get("agreedPrice")) || null;
  const commissionRate = Number(formData.get("commissionRate")) / 100 || 0.05;
  const closeDateStr = String(formData.get("closeDate") ?? "").trim();

  const insert: TablesInsert<"deals"> = {
    agent_id: userId,
    lead_id: leadId,
    property_id: propertyId,
    asking_price: askingPrice,
    agreed_price: agreedPrice,
    commission_rate: commissionRate,
    expected_close_date: closeDateStr || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    status: "negotiating",
    closing_probability: 0.3,
  };

  const { data, error } = await supabase.from("deals").insert(insert).select("id").single();

  if (error) {
    redirect(`/deals/new?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/deals");
  redirect(`/deals`);
}

/** Move a deal to a new status and optionally update agreed price. */
export async function updateDealStatus(formData: FormData) {
  const { supabase } = await getUser();

  const dealId = String(formData.get("dealId") ?? "");
  const status = String(formData.get("status") ?? "") as DealRow["status"];
  const agreedPrice = Number(formData.get("agreedPrice")) || null;

  type DealRow = { status: "negotiating" | "offer_accepted" | "docs_processing" | "completed" | "fallen_through" };

  // Compute commission when completing
  let commissionAmount: number | null = null;
  if (status === "completed" && agreedPrice) {
    const { data: deal } = await supabase
      .from("deals")
      .select("commission_rate")
      .eq("id", dealId)
      .single();
    if (deal) {
      commissionAmount = Math.round(agreedPrice * deal.commission_rate);
    }
  }

  const { error } = await supabase
    .from("deals")
    .update({
      status,
      agreed_price: agreedPrice,
      commission_amount: commissionAmount,
    })
    .eq("id", dealId);

  if (error) throw new Error(error.message);

  revalidatePath("/deals");
  revalidatePath("/dashboard");
}

/** Log a counter-offer in deal_offers. */
export async function logOffer(formData: FormData) {
  const { supabase } = await getUser();

  const dealId = String(formData.get("dealId") ?? "");
  const amount = Number(formData.get("amount")) || 0;
  const offeredBy = String(formData.get("offeredBy") ?? "buyer") as "buyer" | "seller";
  const notes = String(formData.get("notes") ?? "").trim() || null;

  const { error } = await supabase.from("deal_offers").insert({ deal_id: dealId, amount, offered_by: offeredBy, notes });
  if (error) throw new Error(error.message);

  revalidatePath("/deals");
}

/** Hard delete a deal. */
export async function deleteDeal(formData: FormData) {
  const { supabase } = await getUser();
  const dealId = String(formData.get("dealId") ?? "");

  const { error } = await supabase.from("deals").delete().eq("id", dealId);
  if (error) throw new Error(error.message);

  revalidatePath("/deals");
  redirect("/deals");
}
