import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireAuthContext } from "@/lib/auth/user";
import { getProfile } from "@/lib/db/queries/profiles";
import { countPendingAIActions } from "@/lib/db/queries/ai-actions";
import { getBillingState } from "@/lib/billing/access";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const context = await requireAuthContext();

  const [personalProfile, workspaceProfile, pendingActionCount] = await Promise.all([
    context.userId === context.workspaceId ? Promise.resolve(null) : getProfile(context.userId),
    getProfile(context.workspaceId),
    countPendingAIActions(context.workspaceId),
  ]);

  // The workspace profile is created on first sign-in; if it's missing the
  // account needs onboarding.
  if (!workspaceProfile) redirect("/onboarding/profile");

  // Onboarding is a workspace-level concern (teammates join an onboarded workspace).
  if (!workspaceProfile.onboardedAt && workspaceProfile.onboardingStep < 4) {
    const steps = ["profile", "business", "goals"];
    const step = steps[Math.min(workspaceProfile.onboardingStep, 2)];
    redirect(`/onboarding/${step}`);
  }

  const billing = await getBillingState(workspaceProfile);

  return (
    <DashboardShell
      profile={personalProfile ?? workspaceProfile}
      billing={{ status: billing.status, trialDaysLeft: billing.trialDaysLeft }}
      userId={context.workspaceId}
      pendingActionCount={pendingActionCount}
    >
      {children}
    </DashboardShell>
  );
}
