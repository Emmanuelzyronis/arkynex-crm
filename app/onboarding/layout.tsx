import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Not authenticated at all → go sign up
  if (!user) redirect("/signup");

  // Already completed onboarding → go to dashboard
  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_step, onboarded_at")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded_at) redirect("/dashboard");

  return <OnboardingShell>{children}</OnboardingShell>;
}
