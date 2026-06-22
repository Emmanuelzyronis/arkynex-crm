import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [{ data: profile }, { count: pendingActionCount }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase
      .from("ai_actions")
      .select("*", { count: "exact", head: true })
      .eq("agent_id", user.id)
      .eq("completed", false)
      .eq("dismissed", false),
  ]);

  if (!profile) {
    await supabase.from("profiles").insert({
      id: user.id,
      full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Agent",
      onboarding_step: 0,
    }).single();
    redirect("/onboarding/profile");
  }

  if (!profile.onboarded_at && profile.onboarding_step < 4) {
    const steps = ["profile", "business", "whatsapp", "goals"];
    const step = steps[Math.min(profile.onboarding_step, 3)];
    redirect(`/onboarding/${step}`);
  }

  return (
    <DashboardShell
      profile={profile}
      userId={user.id}
      pendingActionCount={pendingActionCount ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
