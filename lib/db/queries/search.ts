import "server-only";

import { and, desc, eq, ilike, or } from "drizzle-orm";

import { db } from "@/lib/db";
import { deals, leads, properties } from "@/lib/db/schema";

export type SearchResults = {
  leads: { id: string; fullName: string; phone: string; stage: string }[];
  properties: { id: string; title: string; city: string; area: string | null; price: number }[];
  deals: { id: string; leadName: string; propertyTitle: string; stage: string }[];
};

/** Lightweight cross-entity search for the ⌘K command palette. */
export async function searchEverything(
  agentId: string,
  rawQuery: string,
): Promise<SearchResults> {
  const query = rawQuery.trim();
  if (query.length < 2) return { leads: [], properties: [], deals: [] };

  const like = `%${query}%`;

  const [leadRows, propertyRows, dealRows] = await Promise.all([
    db
      .select({ id: leads.id, fullName: leads.fullName, phone: leads.phone, stage: leads.stage })
      .from(leads)
      .where(
        and(
          eq(leads.agentId, agentId),
          eq(leads.archived, false),
          or(ilike(leads.fullName, like), ilike(leads.phone, like), ilike(leads.email, like)),
        ),
      )
      .orderBy(desc(leads.score), desc(leads.createdAt))
      .limit(5),
    db
      .select({
        id: properties.id,
        title: properties.title,
        city: properties.city,
        area: properties.area,
        price: properties.price,
      })
      .from(properties)
      .where(
        and(
          eq(properties.agentId, agentId),
          or(ilike(properties.title, like), ilike(properties.address, like), ilike(properties.area, like)),
        ),
      )
      .orderBy(desc(properties.listedAt))
      .limit(5),
    db
      .select({
        id: deals.id,
        leadName: leads.fullName,
        propertyTitle: properties.title,
        stage: deals.status,
      })
      .from(deals)
      .innerJoin(leads, eq(deals.leadId, leads.id))
      .innerJoin(properties, eq(deals.propertyId, properties.id))
      .where(
        and(
          eq(deals.agentId, agentId),
          or(ilike(leads.fullName, like), ilike(properties.title, like)),
        ),
      )
      .orderBy(desc(deals.createdAt))
      .limit(5),
  ]);

  return { leads: leadRows, properties: propertyRows, deals: dealRows };
}
