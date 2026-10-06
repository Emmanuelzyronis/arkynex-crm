import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, smartLists } from "@/lib/db/schema";
import type { SmartList } from "@/lib/db/schema";
import { buildLeadConditions } from "@/lib/db/queries/leads";
import {
  parseSmartListFilters,
  smartListToLeadFilters,
  type SmartListFilters,
} from "@/lib/leads/smart-lists";

export type SmartListWithCount = Omit<SmartList, "filters"> & {
  filters: SmartListFilters;
  count: number;
};

async function countFor(agentId: string, filters: SmartListFilters): Promise<number> {
  const conditions = buildLeadConditions(agentId, smartListToLeadFilters(filters));
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(leads)
    .where(and(...conditions));
  return row?.count ?? 0;
}

export async function getSmartLists(agentId: string): Promise<SmartListWithCount[]> {
  const rows = await db
    .select()
    .from(smartLists)
    .where(eq(smartLists.agentId, agentId))
    .orderBy(asc(smartLists.sortOrder), asc(smartLists.createdAt));

  return Promise.all(
    rows.map(async (row) => {
      const filters = parseSmartListFilters(row.filters);
      return { ...row, filters, count: await countFor(agentId, filters) };
    }),
  );
}

export async function getSmartList(
  agentId: string,
  id: string,
): Promise<SmartListWithCount | null> {
  const [row] = await db
    .select()
    .from(smartLists)
    .where(and(eq(smartLists.id, id), eq(smartLists.agentId, agentId)))
    .limit(1);

  if (!row) return null;
  const filters = parseSmartListFilters(row.filters);
  return { ...row, filters, count: await countFor(agentId, filters) };
}
