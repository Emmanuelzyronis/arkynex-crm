import "server-only";

import { and, asc, eq, gte, lt, lte, sql } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, tasks } from "@/lib/db/schema";
import type { Task } from "@/lib/db/schema";

export type { Task };

export type TaskWithLead = Task & { leadName: string | null };

export function dayRange(reference = new Date()) {
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/** Open tasks for an agent, optionally limited to a window. */
export async function getOpenTasks(
  agentId: string,
  scope: "overdue" | "today" | "upcoming" | "all" = "all",
): Promise<TaskWithLead[]> {
  const { start, end } = dayRange();
  const conditions = [eq(tasks.agentId, agentId), eq(tasks.completed, false)];

  if (scope === "overdue") conditions.push(lt(tasks.dueAt, start));
  if (scope === "today") conditions.push(gte(tasks.dueAt, start), lt(tasks.dueAt, end));
  if (scope === "upcoming") conditions.push(gte(tasks.dueAt, end));

  const rows = await db
    .select({
      id: tasks.id,
      agentId: tasks.agentId,
      leadId: tasks.leadId,
      dealId: tasks.dealId,
      title: tasks.title,
      notes: tasks.notes,
      type: tasks.type,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      completed: tasks.completed,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      leadName: leads.fullName,
    })
    .from(tasks)
    .leftJoin(leads, eq(tasks.leadId, leads.id))
    .where(and(...conditions))
    .orderBy(asc(tasks.dueAt))
    .limit(200);

  return rows;
}

export async function getCompletedTasks(agentId: string): Promise<TaskWithLead[]> {
  const rows = await db
    .select({
      id: tasks.id,
      agentId: tasks.agentId,
      leadId: tasks.leadId,
      dealId: tasks.dealId,
      title: tasks.title,
      notes: tasks.notes,
      type: tasks.type,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      completed: tasks.completed,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      leadName: leads.fullName,
    })
    .from(tasks)
    .leftJoin(leads, eq(tasks.leadId, leads.id))
    .where(and(eq(tasks.agentId, agentId), eq(tasks.completed, true)))
    .orderBy(asc(tasks.dueAt))
    .limit(100);

  return rows;
}

export async function getTasksForLead(
  agentId: string,
  leadId: string,
): Promise<TaskWithLead[]> {
  const rows = await db
    .select({
      id: tasks.id,
      agentId: tasks.agentId,
      leadId: tasks.leadId,
      dealId: tasks.dealId,
      title: tasks.title,
      notes: tasks.notes,
      type: tasks.type,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      completed: tasks.completed,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      leadName: leads.fullName,
    })
    .from(tasks)
    .leftJoin(leads, eq(tasks.leadId, leads.id))
    .where(and(eq(tasks.agentId, agentId), eq(tasks.leadId, leadId)))
    .orderBy(asc(tasks.completed), asc(tasks.dueAt))
    .limit(50);

  return rows;
}

export async function getTaskCounts(agentId: string) {
  const { start, end } = dayRange();
  const [row] = await db
    .select({
      overdue: sql<number>`count(*) filter (where ${tasks.dueAt} < ${start} and ${tasks.completed} = false)::int`,
      today: sql<number>`count(*) filter (where ${tasks.dueAt} >= ${start} and ${tasks.dueAt} < ${end} and ${tasks.completed} = false)::int`,
      upcoming: sql<number>`count(*) filter (where ${tasks.dueAt} >= ${end} and ${tasks.completed} = false)::int`,
    })
    .from(tasks)
    .where(eq(tasks.agentId, agentId));

  return row ?? { overdue: 0, today: 0, upcoming: 0 };
}

/** Tasks due within a date range — used by the calendar. */
export async function getTasksInRange(
  agentId: string,
  from: Date,
  to: Date,
): Promise<TaskWithLead[]> {
  const rows = await db
    .select({
      id: tasks.id,
      agentId: tasks.agentId,
      leadId: tasks.leadId,
      dealId: tasks.dealId,
      title: tasks.title,
      notes: tasks.notes,
      type: tasks.type,
      priority: tasks.priority,
      dueAt: tasks.dueAt,
      completed: tasks.completed,
      completedAt: tasks.completedAt,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      leadName: leads.fullName,
    })
    .from(tasks)
    .leftJoin(leads, eq(tasks.leadId, leads.id))
    .where(
      and(
        eq(tasks.agentId, agentId),
        eq(tasks.completed, false),
        gte(tasks.dueAt, from),
        lte(tasks.dueAt, to),
      ),
    )
    .orderBy(asc(tasks.dueAt));

  return rows;
}
