import { redirect } from "next/navigation";
import { Check, Copy, PartyPopper, X } from "lucide-react";

import { getAIActions } from "@/lib/db/queries/ai-actions";
import { completeAction, dismissAction } from "@/lib/db/mutations/ai-actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/user";

const ACTION_TYPE_LABELS: Record<string, string> = {
  follow_up: "Follow Up",
  call_back: "Call Back",
  send_property: "Send Property",
  confirm_viewing: "Confirm Viewing",
  re_engage: "Re-engage",
  log_outcome: "Log Outcome",
  close_deal: "Close Deal",
  check_deal: "Check Deal",
};

export default async function AIActionsPage() {
  const userId = await requireUser();

  const groups = await getAIActions(userId);

  if (groups.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">AI Actions</h1>
          <p className="mt-1 text-sm text-ink-muted">Generated from your leads, viewings and deals.</p>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-line bg-card px-6 py-16 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-closed/10 text-status-closed">
            <PartyPopper className="h-6 w-6" />
          </div>
          <p className="mt-4 text-base font-semibold text-ink">You&apos;re all caught up!</p>
          <p className="mt-1 text-sm text-ink-muted">
            AI actions are generated from your leads, viewings and deals. Add some data and check back.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">AI Actions</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {groups.reduce((sum, g) => sum + g.actions.length, 0)} pending action{groups.reduce((sum, g) => sum + g.actions.length, 0) !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.priority}>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: group.color }} />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {group.label}
              </h2>
              <span className="text-xs text-ink-muted">{group.actions.length}</span>
            </div>

            <div className="mt-3 space-y-3">
              {group.actions.map((action) => (
                <div key={action.id} className="rounded-2xl border border-line bg-card p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-xs font-medium text-primary">
                      {ACTION_TYPE_LABELS[action.actionType]?.split(" ").map((w: string) => w[0]).join("") ?? "AI"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-ink">{action.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted capitalize">
                        {ACTION_TYPE_LABELS[action.actionType] ?? action.actionType}
                        {action.leadId && " · Lead"}
                        {action.dealId && " · Deal"}
                      </p>
                      <p className="mt-2 text-sm text-ink-muted">{action.body}</p>

                      {action.suggestedMessage && (
                        <div className="mt-3 rounded-xl bg-surface p-3">
                          <p className="text-xs font-medium text-ink-muted">Suggested message</p>
                          <p className="mt-1 text-sm text-ink">{action.suggestedMessage}</p>
                          <form className="mt-2">
                            <input type="hidden" name="text" value={action.suggestedMessage} />
                            <button
                              type="button"
                              onClick={async () => {
                                await navigator.clipboard.writeText(action.suggestedMessage ?? "");
                              }}
                              className="flex items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-medium text-ink-muted hover:bg-surface"
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </button>
                          </form>
                        </div>
                      )}

                      <div className="mt-4 flex items-center gap-2">
                        <form>
                          <input type="hidden" name="actionId" value={action.id} />
                          <Button size="sm" formAction={completeAction}>
                            <Check className="h-3.5 w-3.5" />
                            Mark complete
                          </Button>
                        </form>
                        <form>
                          <input type="hidden" name="actionId" value={action.id} />
                          <Button size="sm" variant="ghost" formAction={dismissAction}>
                            <X className="h-3.5 w-3.5" />
                            Dismiss
                          </Button>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
