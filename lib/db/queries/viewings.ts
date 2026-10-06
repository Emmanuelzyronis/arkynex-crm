import "server-only";
import { db } from "@/lib/db";
import { viewings, leads, properties } from "@/lib/db/schema";
import type { Viewing, Lead, Property } from "@/lib/db/schema";
import { eq, and, asc } from "drizzle-orm";

export type { Viewing };

export type ViewingWithDetails = Viewing & {
  lead: Pick<Lead, "fullName" | "phone"> | null;
  property: Pick<Property, "title" | "area"> | null;
};

export type ViewingFilter = {
  status?: string;
  search?: string;
};

/**
 * All viewings for the agent, with joined lead/property data.
 */
export async function getViewings(
  agentId: string,
  filters: ViewingFilter = {},
): Promise<ViewingWithDetails[]> {
  const conditions = [eq(viewings.agentId, agentId)];

  if (filters.status && filters.status !== "all") {
    conditions.push(eq(viewings.status, filters.status));
  }

  const rows = await db
    .select({
      viewing: viewings,
      lead: {
        fullName: leads.fullName,
        phone: leads.phone,
      },
      property: {
        title: properties.title,
        area: properties.area,
      },
    })
    .from(viewings)
    .innerJoin(leads, eq(viewings.leadId, leads.id))
    .innerJoin(properties, eq(viewings.propertyId, properties.id))
    .where(and(...conditions))
    .orderBy(asc(viewings.scheduledAt));

  return rows.map((r) => ({
    ...r.viewing,
    lead: r.lead.fullName
      ? { fullName: r.lead.fullName, phone: r.lead.phone }
      : null,
    property: r.property.title
      ? { title: r.property.title, area: r.property.area }
      : null,
  }));
}

/**
 * Single viewing with joined lead/property data.
 */
export async function getViewing(
  agentId: string,
  id: string,
): Promise<ViewingWithDetails | null> {
  const [row] = await db
    .select({
      viewing: viewings,
      lead: {
        fullName: leads.fullName,
        phone: leads.phone,
      },
      property: {
        title: properties.title,
        area: properties.area,
      },
    })
    .from(viewings)
    .innerJoin(leads, eq(viewings.leadId, leads.id))
    .innerJoin(properties, eq(viewings.propertyId, properties.id))
    .where(and(eq(viewings.id, id), eq(viewings.agentId, agentId)))
    .limit(1);

  if (!row) return null;

  return {
    ...row.viewing,
    lead: row.lead.fullName
      ? { fullName: row.lead.fullName, phone: row.lead.phone }
      : null,
    property: row.property.title
      ? { title: row.property.title, area: row.property.area }
      : null,
  };
}
