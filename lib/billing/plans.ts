/** Shared (client-safe) billing constants and types. */

/** Length of the free trial granted to every new agent. */
export const TRIAL_DAYS = 15;
export const TRIAL_MS = TRIAL_DAYS * 24 * 60 * 60 * 1000;

export type BillingStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "cancelled"
  | "expired";

export type BillingState = {
  tier: string;
  status: BillingStatus;
  /** ISO string so it can be serialised to client components. */
  trialEndsAt: string | null;
  trialDaysLeft: number;
  isTrialing: boolean;
  isActive: boolean;
  hasAccess: boolean;
};

/**
 * Clerk Billing must be enabled in the Clerk Dashboard before its components
 * (`<PricingTable />`) and entitlement checks (`has({ plan })`) work. Flip
 * NEXT_PUBLIC_CLERK_BILLING_ENABLED to "true" once Billing + Plans are set up.
 */
export function clerkBillingEnabled(): boolean {
  return process.env.NEXT_PUBLIC_CLERK_BILLING_ENABLED === "true";
}

export const PLAN_SLUGS = ["starter", "pro", "agency"] as const;
export type PlanSlug = (typeof PLAN_SLUGS)[number];
