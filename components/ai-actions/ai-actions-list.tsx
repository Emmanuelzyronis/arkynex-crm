"use client";

import { useState } from "react";
import {
  CalendarCheck,
  Check,
  ClipboardCheck,
  Copy,
  Handshake,
  Home,
  MessageCircle,
  Phone,
  PartyPopper,
  RefreshCw,
  SearchCheck,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  mockAIActions,
  priorityConfig,
  priorityOrder,
  type ActionType,
  type AIAction,
} from "@/lib/mock-ai-actions";

const actionTypeIcon: Record<ActionType, LucideIcon> = {
  follow_up: MessageCircle,
  call_back: Phone,
  send_property: Home,
  confirm_viewing: CalendarCheck,
  re_engage: RefreshCw,
  log_outcome: ClipboardCheck,
  close_deal: Handshake,
  check_deal: SearchCheck,
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // Clipboard API unavailable — fail silently.
        }
      }}
      className="flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-card px-2.5 py-1.5 text-xs font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-status-closed" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function ActionCard({
  action,
  onComplete,
  onDismiss,
}: {
  action: AIAction;
  onComplete: () => void;
  onDismiss: () => void;
}) {
  const Icon = actionTypeIcon[action.actionType];

  return (
    <div className="rounded-2xl border border-line bg-card p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${action.accent}1A`, color: action.accent }}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{action.title}</p>
          {(action.leadName || action.relatedTo) && (
            <p className="mt-0.5 text-xs text-ink-muted">
              {[action.leadName, action.relatedTo].filter(Boolean).join(" · ")}
            </p>
          )}
          <p className="mt-2 text-sm text-ink-muted">{action.body}</p>

          {action.suggestedMessage && (
            <div className="mt-3 flex items-start gap-2 rounded-xl bg-surface p-3">
              <p className="flex-1 text-sm text-ink">{action.suggestedMessage}</p>
              <CopyButton text={action.suggestedMessage} />
            </div>
          )}

          <div className="mt-4 flex items-center gap-2">
            <Button size="sm" onClick={onComplete}>
              <Check className="h-3.5 w-3.5" />
              Mark complete
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              <X className="h-3.5 w-3.5" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AIActionsList() {
  const [actions, setActions] = useState(mockAIActions);

  const remove = (id: string) => setActions((prev) => prev.filter((a) => a.id !== id));

  const groups = priorityOrder
    .map((priority) => ({
      priority,
      items: actions.filter((a) => a.priority === priority),
    }))
    .filter((g) => g.items.length > 0);

  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-line bg-card px-6 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-status-closed/10 text-status-closed">
          <PartyPopper className="h-6 w-6" />
        </div>
        <p className="mt-4 text-base font-semibold text-ink">You&apos;re all caught up!</p>
        <p className="mt-1 text-sm text-ink-muted">
          New AI actions are generated overnight based on your leads and deals.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(({ priority, items }) => {
        const config = priorityConfig[priority];
        return (
          <section key={priority}>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: config.color }}
                aria-hidden="true"
              />
              <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                {config.label}
              </h2>
              <span className="text-xs text-ink-muted">{items.length}</span>
            </div>

            <div className="mt-3 space-y-3">
              {items.map((action) => (
                <ActionCard
                  key={action.id}
                  action={action}
                  onComplete={() => remove(action.id)}
                  onDismiss={() => remove(action.id)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
