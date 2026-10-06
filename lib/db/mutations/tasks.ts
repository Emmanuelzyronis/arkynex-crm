"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, tasks } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";
import { getActionPlan } from "@/lib/leads/action-plans";

const TASK_TYPES = ["call", "email", "text", "follow_up", "viewing", "admin"] as const;
const PRIORITIES = ["high", "normal", "low"] as const;

function normalizeType(value: unknown): string {
  const type = String(value ?? "follow_up");
  return (TASK_TYPES as readonly string[]).includes(type) ? type : "follow_up";
}

function normalizePriority(value: unknown): string {
  const priority = String(value ?? "normal");
  return (PRIORITIES as readonly string[]).includes(priority) ? priority : "normal";
}

function parseDueAt(value: unknown): Date {
  const raw = String(value ?? "").trim();
  if (!raw) {
    const soon = new Date();
    soon.setHours(soon.getHours() + 1, 0, 0, 0);
    return soon;
  }
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function revalidateTaskSurfaces(leadId?: string | null) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  if (leadId) revalidatePath(`/leads/${leadId}`);
}

export async function createTask(formData: FormData) {
  const userId = await requireUser();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const leadId = String(formData.get("leadId") ?? "").trim() || null;
  const dealId = String(formData.get("dealId") ?? "").trim() || null;

  await db.insert(tasks).values({
    agentId: userId,
    leadId,
    dealId,
    title,
    notes: String(formData.get("notes") ?? "").trim() || null,
    type: normalizeType(formData.get("type")),
    priority: normalizePriority(formData.get("priority")),
    dueAt: parseDueAt(formData.get("dueAt")),
  });

  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  revalidateTaskSurfaces(leadId);
  if (redirectTo) redirect(redirectTo);
}

export async function completeTask(formData: FormData) {
  const userId = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  const [task] = await db
    .select({ leadId: tasks.leadId, type: tasks.type })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.agentId, userId)))
    .limit(1);
  if (!task) return;

  await db
    .update(tasks)
    .set({ completed: true, completedAt: new Date() })
    .where(and(eq(tasks.id, taskId), eq(tasks.agentId, userId)));

  // Contact tasks refresh the lead's last-contacted timestamp.
  if (task.leadId && task.type !== "admin") {
    await db
      .update(leads)
      .set({ lastContactedAt: new Date() })
      .where(and(eq(leads.id, task.leadId), eq(leads.agentId, userId)));
  }

  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  revalidateTaskSurfaces(task.leadId);
  if (redirectTo) redirect(redirectTo);
}

export async function reopenTask(formData: FormData) {
  const userId = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  await db
    .update(tasks)
    .set({ completed: false, completedAt: null })
    .where(and(eq(tasks.id, taskId), eq(tasks.agentId, userId)));

  revalidateTaskSurfaces(String(formData.get("leadId") ?? "") || null);
}

export async function rescheduleTask(formData: FormData) {
  const userId = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  await db
    .update(tasks)
    .set({ dueAt: parseDueAt(formData.get("dueAt")) })
    .where(and(eq(tasks.id, taskId), eq(tasks.agentId, userId)));

  revalidateTaskSurfaces(String(formData.get("leadId") ?? "") || null);
}

export async function deleteTask(formData: FormData) {
  const userId = await requireUser();
  const taskId = String(formData.get("taskId") ?? "");
  if (!taskId) return;

  await db
    .delete(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.agentId, userId)));

  revalidateTaskSurfaces(String(formData.get("leadId") ?? "") || null);
}

/** Start a follow-up sequence for a lead, creating one task per step. */
export async function startActionPlan(formData: FormData) {
  const userId = await requireUser();

  const leadId = String(formData.get("leadId") ?? "");
  const planKey = String(formData.get("planKey") ?? "");
  const plan = getActionPlan(planKey);
  if (!leadId || !plan) return;

  const [lead] = await db
    .select({ fullName: leads.fullName })
    .from(leads)
    .where(and(eq(leads.id, leadId), eq(leads.agentId, userId)))
    .limit(1);
  if (!lead) return;

  const firstName = lead.fullName.split(" ")[0] || lead.fullName;
  const now = new Date();

  await db.insert(tasks).values(
    plan.steps.map((step) => {
      const dueAt = new Date(now);
      dueAt.setDate(dueAt.getDate() + step.dayOffset);
      if (step.dayOffset === 0) {
        dueAt.setHours(dueAt.getHours() + 1, 0, 0, 0);
      } else {
        dueAt.setHours(9, 0, 0, 0);
      }
      return {
        agentId: userId,
        leadId,
        title: step.title.replace("{name}", firstName),
        notes: step.notes.replace("{name}", firstName),
        type: step.type,
        priority: step.priority,
        dueAt,
      };
    }),
  );

  revalidateTaskSurfaces(leadId);
}
