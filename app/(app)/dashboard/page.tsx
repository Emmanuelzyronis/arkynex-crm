import { redirect } from "next/navigation";

import { getAllDashboardData } from "@/lib/db/queries/dashboard";
import { StatsRow } from "@/components/dashboard/stats-row";
import { LeadFunnel } from "@/components/dashboard/lead-funnel";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { LeadSources } from "@/components/dashboard/lead-sources";
import { UpcomingViewings } from "@/components/dashboard/upcoming-viewings";
import { AIActions } from "@/components/dashboard/ai-actions";
import { requireAuthContext } from "@/lib/auth/user";
import { getProfile } from "@/lib/db/queries/profiles";
import { getBillingState } from "@/lib/billing/access";
import { getOpenTasks } from "@/lib/db/queries/tasks";
import { TaskList } from "@/components/tasks/task-list";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const context = await requireAuthContext();
  const userId = context.workspaceId;

  const [personalProfile, workspaceProfile] = await Promise.all([
    context.userId === context.workspaceId ? Promise.resolve(null) : getProfile(context.userId),
    getProfile(context.workspaceId),
  ]);

  // Trial / subscription gate — resolved from the workspace owner's plan.
  const billing = await getBillingState(workspaceProfile);
  if (!billing.hasAccess) {
    redirect("/settings?tab=billing&error=trial_expired");
  }

  const firstName =
    (personalProfile ?? workspaceProfile)?.fullName?.split(" ")[0] ?? "there";

  // All queries run in parallel — single round-trip per page load
  const [{ stats, funnel, revenue, sources, viewings, actions }, overdueTasks, todayTasks] =
    await Promise.all([
      getAllDashboardData(userId),
      getOpenTasks(userId, "overdue"),
      getOpenTasks(userId, "today"),
    ]);

  const dueTasks = [...overdueTasks, ...todayTasks].slice(0, 6);

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

      <section className="overflow-hidden rounded-2xl border border-line bg-card">
        <header className="flex items-center justify-between border-b border-line px-5 py-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-ink">Due today</h2>
            {overdueTasks.length > 0 && (
              <span className="rounded-full bg-status-lost/10 px-2 py-0.5 text-[10px] font-medium text-status-lost">
                {overdueTasks.length} overdue
              </span>
            )}
          </div>
          <Link
            href="/tasks"
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            All tasks <ArrowRight className="h-3 w-3" />
          </Link>
        </header>
        <TaskList
          tasks={dueTasks}
          redirectTo="/dashboard"
          emptyLabel="No tasks due today. Add one from the Tasks page."
        />
      </section>

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
