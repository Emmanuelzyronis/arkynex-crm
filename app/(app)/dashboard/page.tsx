import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { getAllDashboardData } from "@/lib/supabase/queries/dashboard";
import { StatsRow } from "@/components/dashboard/stats-row";
import { LeadFunnel } from "@/components/dashboard/lead-funnel";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { LeadSources } from "@/components/dashboard/lead-sources";
import { UpcomingViewings } from "@/components/dashboard/upcoming-viewings";
import { AIActions } from "@/components/dashboard/ai-actions";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  // All queries run in parallel — single round-trip per page load
  const { stats, funnel, revenue, sources, viewings, actions } =
    await getAllDashboardData(supabase);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          {greeting()}, {firstName} 👋
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      <StatsRow stats={stats} />

      <div className="grid gap-6 lg:grid-cols-2">
        <LeadFunnel stages={funnel} />
        <RevenueChart data={revenue} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <LeadSources sources={sources} />
        <UpcomingViewings viewings={viewings} />
        <AIActions actions={actions} />
      </div>
    </div>
  );
}
