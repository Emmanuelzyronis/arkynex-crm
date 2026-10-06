import { redirect } from "next/navigation";

import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { requireAuthContext } from "@/lib/auth/user";
import { getProfile } from "@/lib/db/queries/profiles";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const context = await requireAuthContext();

  // Teammates join an onboarded workspace and never run onboarding.
  if (context.role !== "owner") redirect("/dashboard");

  const profile = await getProfile(context.workspaceId);

  if (profile?.onboardedAt) redirect("/dashboard");

  return <OnboardingShell>{children}</OnboardingShell>;
}
