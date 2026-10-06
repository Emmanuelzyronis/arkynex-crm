import "server-only";

import { auth } from "@clerk/nextjs/server";

import type { Profile } from "@/lib/db/schema";
import {
  TRIAL_MS,
  clerkBillingEnabled,
  PLAN_SLUGS,
  type BillingState,
  type BillingStatus,
} from "@/lib/billing/plans";

/** Start of a fresh 15-day trial. */
export function trialEndsAtFromNow(): Date {
  return new Date(Date.now() + TRIAL_MS);
}

/** Whole days remaining until `endsAt` (never negative). */
export function daysLeft(endsAt: Date | null): number {
  if (!endsAt) return 0;
  return Math.max(
    0,
    Math.ceil((endsAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
  );
}

/**
 * Resolve the effective billing state for a profile.
 * A Clerk Billing subscription (when enabled) always wins over the stored
 * trial state, so access is restored as soon as a checkout completes.
 */
export async function getBillingState(
  profile: Profile | null,
): Promise<BillingState> {
  const stored = (profile?.subscriptionStatus ?? "trialing") as BillingStatus;
  const trialEndsAt = profile?.trialEndsAt ? new Date(profile.trialEndsAt) : null;
  const remaining = daysLeft(trialEndsAt);

  let clerkPlan: string | null = null;
  if (clerkBillingEnabled()) {
    try {
      const { has } = await auth();
      for (const slug of [...PLAN_SLUGS].reverse()) {
        if (has({ plan: slug })) {
          clerkPlan = slug;
          break;
        }
      }
    } catch {
      clerkPlan = null;
    }
  }

  const isActive = stored === "active" || Boolean(clerkPlan);
  const isTrialing = !isActive && stored === "trialing" && remaining > 0;
  const status: BillingStatus = isActive
    ? "active"
    : isTrialing
      ? "trialing"
      : "expired";

  return {
    tier: clerkPlan ?? profile?.tier ?? "starter",
    status,
    trialEndsAt: trialEndsAt ? trialEndsAt.toISOString() : null,
    trialDaysLeft: remaining,
    isTrialing,
    isActive,
    hasAccess: isActive || isTrialing,
  };
}
