import Link from "next/link";
import {
  CalendarDays,
  Check,
  Mail,
  MessageSquare,
  Phone,
  StickyNote,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { completeTask, deleteTask } from "@/lib/db/mutations/tasks";
import type { TaskWithLead } from "@/lib/db/queries/tasks";
import { cn } from "@/lib/utils";

const TYPE_ICON: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  text: MessageSquare,
  follow_up: StickyNote,
  viewing: CalendarDays,
  admin: StickyNote,
};

const PRIORITY_STYLE: Record<string, string> = {
  high: "bg-status-lost/10 text-status-lost",
  normal: "bg-primary/10 text-primary",
  low: "bg-surface text-ink-muted",
};

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDue(dueAt: string | Date): { label: string; overdue: boolean } {
  const due = new Date(dueAt);
  const today = startOfToday();
  const dueDay = new Date(due);
  dueDay.setHours(0, 0, 0, 0);

  const dayDiff = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);
  const time = due.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const overdue = due.getTime() < Date.now();

  if (dayDiff < 0) return { label: `Overdue · ${Math.abs(dayDiff)}d`, overdue: true };
  if (dayDiff === 0) return { label: `Today · ${time}`, overdue };
  if (dayDiff === 1) return { label: `Tomorrow · ${time}`, overdue: false };
  if (dayDiff < 7) return { label: `${due.toLocaleDateString("en-US", { weekday: "short" })} · ${time}`, overdue: false };
  return {
    label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    overdue: false,
  };
}

export function TaskList({
  tasks,
  redirectTo,
  hideLead = false,
  emptyLabel = "Nothing here.",
}: {
  tasks: TaskWithLead[];
  redirectTo?: string;
  hideLead?: boolean;
  emptyLabel?: string;
}) {
  if (tasks.length === 0) {
    return <p className="py-6 text-center text-sm text-ink-muted">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-line">
      {tasks.map((task) => {
        const Icon = TYPE_ICON[task.type] ?? StickyNote;
        const due = formatDue(task.dueAt);
        return (
          <li key={task.id} className="flex items-start gap-3 px-4 py-3">
            <form className="contents">
              <input type="hidden" name="taskId" value={task.id} />
              {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
              <button
                type="submit"
                formAction={completeTask}
                title="Mark complete"
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-line text-transparent transition-colors hover:border-status-closed hover:text-status-closed"
              >
                <Check className="h-3 w-3" />
              </button>
            </form>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-ink-muted" />
                <p className="truncate text-sm font-medium text-ink">{task.title}</p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium capitalize",
                    PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.normal,
                  )}
                >
                  {task.priority}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
                <span className={due.overdue ? "font-medium text-status-lost" : ""}>{due.label}</span>
                {!hideLead && task.leadName && task.leadId && (
                  <Link href={`/leads/${task.leadId}`} className="text-primary hover:underline">
                    {task.leadName}
                  </Link>
                )}
                {task.notes && <span className="truncate">{task.notes}</span>}
              </div>
            </div>

            <form>
              <input type="hidden" name="taskId" value={task.id} />
              {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
              <button
                type="submit"
                formAction={deleteTask}
                title="Delete"
                className="mt-0.5 text-ink-muted transition-colors hover:text-status-lost"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </form>
          </li>
        );
      })}
    </ul>
  );
}
