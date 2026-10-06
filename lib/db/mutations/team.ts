"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { leads, profiles, teamMembers } from "@/lib/db/schema";
import { requireUser, requireWorkspaceAdmin } from "@/lib/auth/user";

const ROLES = ["admin", "agent"] as const;
const STATUSES = ["active", "invited", "inactive"] as const;

function normalize(value: unknown, allowed: readonly string[], fallback: string): string {
  const v = String(value ?? "").trim();
  return allowed.includes(v) ? v : fallback;
}

export async function createTeamMember(formData: FormData) {
  const userId = (await requireWorkspaceAdmin()).workspaceId;

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = normalize(formData.get("role"), ROLES, "agent");
  const status = normalize(formData.get("status"), STATUSES, "active");

  if (!fullName || !email) {
    redirect(`/settings?tab=team&error=${encodeURIComponent("Name and email are required.")}`);
  }

  try {
    await db.insert(teamMembers).values({
      ownerId: userId,
      fullName,
      email,
      role,
      status,
      joinedAt: status === "active" ? new Date() : null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const friendly =
      message.includes("team_members_owner_email_unique") || message.includes("23505")
        ? "That email is already on your team."
        : message;
    redirect(`/settings?tab=team&error=${encodeURIComponent(friendly)}`);
  }

  revalidatePath("/settings");
  revalidatePath("/leads");
  redirect("/settings?tab=team&success=team");
}

export async function updateTeamMember(formData: FormData) {
  const userId = (await requireWorkspaceAdmin()).workspaceId;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const role = normalize(formData.get("role"), ROLES, "agent");
  const status = normalize(formData.get("status"), STATUSES, "active");

  await db
    .update(teamMembers)
    .set({ role, status })
    .where(and(eq(teamMembers.id, id), eq(teamMembers.ownerId, userId)));

  revalidatePath("/settings");
  revalidatePath("/leads");
}

export async function removeTeamMember(formData: FormData) {
  const userId = (await requireWorkspaceAdmin()).workspaceId;
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  await db
    .delete(teamMembers)
    .where(and(eq(teamMembers.id, id), eq(teamMembers.ownerId, userId)));

  revalidatePath("/settings");
  revalidatePath("/leads");
}

/** Assign (or unassign) a lead to a team member. */
export async function assignLeadToMember(formData: FormData) {
  const userId = await requireUser();

  const leadId = String(formData.get("leadId") ?? "");
  const memberId = String(formData.get("memberId") ?? "").trim() || null;
  if (!leadId) return;

  let assignedToId: string | null = null;
  if (memberId) {
    const [member] = await db
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(and(eq(teamMembers.id, memberId), eq(teamMembers.ownerId, userId)))
      .limit(1);
    if (!member) return;
    assignedToId = member.id;
  }

  await db
    .update(leads)
    .set({ assignedToId })
    .where(and(eq(leads.id, leadId), eq(leads.agentId, userId)));

  revalidatePath(`/leads/${leadId}`);
  revalidatePath("/leads");

  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  if (redirectTo) redirect(redirectTo);
}

/** Toggle round-robin lead routing for new website enquiries. */
export async function setLeadRouting(formData: FormData) {
  const userId = (await requireWorkspaceAdmin()).workspaceId;
  const enabled = ["true", "on", "1"].includes(String(formData.get("enabled") ?? ""));

  await db.update(profiles).set({ leadRoutingEnabled: enabled }).where(eq(profiles.id, userId));

  revalidatePath("/settings");
  revalidatePath("/leads");
}
