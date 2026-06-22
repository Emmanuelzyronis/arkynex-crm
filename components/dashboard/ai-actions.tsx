import Link from "next/link";
import { Sparkles } from "lucide-react";

import type { PendingAIAction } from "@/lib/supabase/queries/dashboard";

const priorityColor: Record<string, string> = {
  urgent: "bg-status-lost",
  today: "bg-status-negotiating",
  this_week: "bg-status-contacted",
};

export function AIActions({ actions }: { actions: PendingAIAction[] }) {
  return (
    <div className="rounded-2xl border border-line bg-card p-5 lg:p-6">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Actions
        </h2>
        <Link href="/ai-actions" className="text-sm font-medium text-primary hover:text-primary-hover">
          View all
        </Link>
      </div>

      {actions.length === 0 ? (
        <div className="mt-4 flex items-center justify-center py-8">
          <p className="text-sm text-ink-muted">No AI actions for today — check back tomorrow.</p>
        </div>
      ) : (
        <ul className="mt-4 space-y-3">
          {actions.map((action) => (
            <li key={action.id} className="flex items-start gap-3">
              <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${priorityColor[action.priority] ?? "bg-ink-muted"}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-ink">{action.title}</p>
                <p className="text-xs text-ink-muted">{action.meta}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
