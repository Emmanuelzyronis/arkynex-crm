import "server-only";

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import { profiles, teamMembers } from "@/lib/db/schema";
import type { Profile } from "@/lib/db/schema";
import { trialEndsAtFromNow } from "@/lib/billing/access";

export type WorkspaceRole = "owner" | "admin" | "agent";

export type AuthContext = {
  /** Clerk user id — also the id of this user's *personal* profile row. */
  userId: string;
  /** Tenant id used to scope every data query/mutation. */
  workspaceId: string;
  role: WorkspaceRole;
  fullName: string;
  avatarUrl: string | null;
};

function normalizeRole(role: string | null | undefined): WorkspaceRole {
  if (role === "owner" || role === "admin") return role;
  return "agent";
}

async function clerkIdentity(userId: string): Promise<{
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
}> {
  try {
    const user = await currentUser();
    if (!user || user.id !== userId) return { email: null, fullName: null, avatarUrl: null };
    return {
      email: user.emailAddresses?.[0]?.emailAddress?.toLowerCase() ?? null,
      fullName:
        [user.firstName, user.lastName].filter(Boolean).join(" ") ||
        user.username ||
        null,
      avatarUrl: user.imageUrl ?? null,
    };
  } catch {
    return { email: null, fullName: null, avatarUrl: null };
  }
}

function contextFrom(profile: Profile, userId: string): AuthContext {
  return {
    userId,
    workspaceId: profile.workspaceId ?? profile.id,
    role: normalizeRole(profile.role),
    fullName: profile.fullName,
    avatarUrl: profile.avatarUrl,
  };
}

/**
 * Resolve the signed-in user's workspace (tenant).
 *
 * - Owners are their own workspace (`workspaceId === userId`).
 * - Team members are matched to an invitation by email on first sign-in and
 *   then share the owner's workspace, so they see the same leads/deals.
 *
 * The fast path (profile already linked) is a single indexed read and avoids a
 * Clerk API round-trip on every request.
 */
export async function resolveAuthContext(userId: string): Promise<AuthContext> {
  const [existing] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  if (existing?.workspaceId) return contextFrom(existing, userId);

  const identity = await clerkIdentity(userId);

  // A pending/active team invitation for this email makes the user a teammate.
  const [membership] = identity.email
    ? await db
        .select()
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.email, identity.email),
            inArray(teamMembers.status, ["invited", "active"]),
          ),
        )
        .orderBy(asc(teamMembers.invitedAt))
        .limit(1)
    : [];

  if (!existing) {
    const isTeammate = Boolean(membership);
    const [created] = await db
      .insert(profiles)
      .values({
        id: userId,
        fullName:
          identity.fullName ?? identity.email?.split("@")[0] ?? "Agent",
        avatarUrl: identity.avatarUrl,
        workspaceId: membership?.ownerId ?? userId,
        role: isTeammate ? normalizeRole(membership?.role) : "owner",
        // Teammates join an already-onboarded workspace; they skip onboarding.
        onboardingStep: isTeammate ? 4 : 0,
        onboardedAt: isTeammate ? new Date() : null,
        subscriptionStatus: isTeammate ? "active" : "trialing",
        trialEndsAt: isTeammate ? null : trialEndsAtFromNow(),
      })
      .returning();

    if (membership) {
      await db
        .update(teamMembers)
        .set({
          userId,
          status: "active",
          joinedAt: membership.joinedAt ?? new Date(),
          avatarUrl: membership.avatarUrl ?? identity.avatarUrl,
        })
        .where(eq(teamMembers.id, membership.id));
    }

    return contextFrom(created, userId);
  }

  // Pre-tenancy profile: backfill workspace + avatar (self-healing).
  const patch: Partial<typeof profiles.$inferInsert> = {};
  if (!existing.workspaceId) patch.workspaceId = existing.id;
  if (!existing.avatarUrl && identity.avatarUrl) patch.avatarUrl = identity.avatarUrl;
  if (Object.keys(patch).length > 0) {
    const [updated] = await db
      .update(profiles)
      .set(patch)
      .where(eq(profiles.id, userId))
      .returning();
    return contextFrom(updated ?? existing, userId);
  }

  return contextFrom(existing, userId);
}

/**
 * Non-redirecting variant for route handlers: returns the workspace context, or
 * `null` when the caller is not signed in.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const { userId } = await auth();
  if (!userId) return null;
  return resolveAuthContext(userId);
}

/** Require a signed-in user and return their full workspace context. */
export async function requireAuthContext(): Promise<AuthContext> {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  return resolveAuthContext(userId);
}

/**
 * Require a signed-in user and return the workspace id that scopes all data.
 * This is the backwards-compatible entry point used by queries and mutations.
 */
export async function requireUser(): Promise<string> {
  const context = await requireAuthContext();
  return context.workspaceId;
}

/** The signed-in user's *own* profile id (for profile/settings edits). */
export async function requireOwnProfileId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  return userId;
}

/** Require the signed-in user to own (or administer) the workspace. */
export async function requireWorkspaceAdmin(): Promise<AuthContext> {
  const context = await requireAuthContext();
  if (context.role !== "owner" && context.role !== "admin") redirect("/dashboard");
  return context;
}

/**
 * Ensure the user has a profile row in the database.
 * Kept for callers that already hold the Clerk user id.
 */
export async function ensureProfile(userId: string) {
  await resolveAuthContext(userId);
  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);
  return profile ?? null;
}
