import "server-only";
import { db } from "@/lib/db";
import { deals, leads, properties, dealOffers } from "@/lib/db/schema";
import type { Deal, Lead, Property, DealOffer } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export type { Deal, DealOffer };

export type DealWithDetails = Deal & {
  lead: Pick<Lead, "fullName" | "phone"> | null;
  property: Pick<Property, "title" | "area" | "price"> | null;
  dealOffers: DealOffer[];
};

/**
 * All deals for the agent, with joined lead/property/offer data.
 */
export async function getDeals(
  agentId: string,
): Promise<DealWithDetails[]> {
  const rows = await db
    .select({
      deal: deals,
      lead: {
        fullName: leads.fullName,
        phone: leads.phone,
      },
      property: {
        title: properties.title,
        area: properties.area,
        price: properties.price,
      },
    })
    .from(deals)
    .innerJoin(leads, eq(deals.leadId, leads.id))
    .innerJoin(properties, eq(deals.propertyId, properties.id))
    .where(eq(deals.agentId, agentId))
    .orderBy(desc(deals.createdAt));

  // Fetch all offers for the returned deals in one query
  const dealIds = rows.map((r) => r.deal.id);
  const offerRows = dealIds.length > 0
    ? await db
        .select()
        .from(dealOffers)
        .where(inArray(dealOffers.dealId, dealIds))
    : [];
  const offersByDeal = new Map<string, DealOffer[]>();
  for (const offer of offerRows) {
    if (dealIds.includes(offer.dealId)) {
      if (!offersByDeal.has(offer.dealId)) offersByDeal.set(offer.dealId, []);
      offersByDeal.get(offer.dealId)!.push(offer);
    }
  }

  return rows.map((r) => ({
    ...r.deal,
    lead: r.lead.fullName ? { fullName: r.lead.fullName, phone: r.lead.phone } : null,
    property: r.property.title
      ? { title: r.property.title, area: r.property.area, price: r.property.price }
      : null,
    dealOffers: offersByDeal.get(r.deal.id) ?? [],
  }));
}

/**
 * Single deal with joined lead/property/offer data.
 */
export async function getDeal(
  agentId: string,
  id: string,
): Promise<DealWithDetails | null> {
  const [row] = await db
    .select({
      deal: deals,
      lead: {
        fullName: leads.fullName,
        phone: leads.phone,
      },
      property: {
        title: properties.title,
        area: properties.area,
        price: properties.price,
      },
    })
    .from(deals)
    .innerJoin(leads, eq(deals.leadId, leads.id))
    .innerJoin(properties, eq(deals.propertyId, properties.id))
    .where(and(eq(deals.id, id), eq(deals.agentId, agentId)))
    .limit(1);

  if (!row) return null;

  const offers = await db
    .select()
    .from(dealOffers)
    .where(eq(dealOffers.dealId, id))
    .orderBy(dealOffers.createdAt);

  return {
    ...row.deal,
    lead: row.lead.fullName
      ? { fullName: row.lead.fullName, phone: row.lead.phone }
      : null,
    property: row.property.title
      ? { title: row.property.title, area: row.property.area, price: row.property.price }
      : null,
    dealOffers: offers,
  };
}
