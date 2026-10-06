import { CalendarClock, ListTodo, Plus } from "lucide-react";

import { requireUser } from "@/lib/auth/user";
import { getCompletedTasks, getOpenTasks } from "@/lib/db/queries/tasks";
import { getLeads } from "@/lib/db/queries/leads";
import { createTask } from "@/lib/db/mutations/tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TaskList } from "@/components/tasks/task-list";

function defaultDue() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function TasksPage() {
  const userId = await requireUser();

  const [overdue, today, upcoming, completed, leads] = await Promise.all([
    getOpenTasks(userId, "overdue"),
    getOpenTasks(userId, "today"),
    getOpenTasks(userId, "upcoming"),
    getCompletedTasks(userId),
    getLeads(userId),
  ]);

  const openCount = overdue.length + today.length + upcoming.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">Tasks</h1>
          <p className="mt-1 text-sm text-ink-muted">
            {openCount} open task{openCount === 1 ? "" : "s"}
            {overdue.length > 0 ? ` · ${overdue.length} overdue` : ""}
          </p>
        </div>
      </div>

      {/* New task */}
      <div className="rounded-2xl border border-line bg-card p-5">
        <div className="flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-ink">Add a task</h2>
        </div>
        <form className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="title">Task</Label>
            <Input id="title" name="title" placeholder="Call about the Riverside listing" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueAt">Due</Label>
            <Input id="dueAt" name="dueAt" type="datetime-local" defaultValue={defaultDue()} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="type">Type</Label>
            <Select id="type" name="type" defaultValue="follow_up">
              <option value="follow_up">Follow up</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="text">Text</option>
              <option value="viewing">Viewing</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="priority">Priority</Label>
            <Select id="priority" name="priority" defaultValue="normal">
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="leadId">Linked lead (optional)</Label>
            <Select id="leadId" name="leadId" defaultValue="">
              <option value="">No lead</option>
              {leads.map((lead) => (
                <option key={lead.id} value={lead.id}>
                  {lead.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div className="flex items-end">
            <Button type="submit" formAction={createTask} className="w-full">
              Add task
            </Button>
          </div>
        </form>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-line bg-card">
          <header className="flex items-center gap-2 border-b border-line px-4 py-3">
            <ListTodo className="h-4 w-4 text-status-lost" />
            <h2 className="text-sm font-semibold text-ink">Overdue</h2>
            <span className="ml-auto text-xs text-ink-muted">{overdue.length}</span>
          </header>
          <TaskList tasks={overdue} redirectTo="/tasks" emptyLabel="Nothing overdue — nice." />
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-card">
          <header className="flex items-center gap-2 border-b border-line px-4 py-3">
            <CalendarClock className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-ink">Today</h2>
            <span className="ml-auto text-xs text-ink-muted">{today.length}</span>
          </header>
          <TaskList tasks={today} redirectTo="/tasks" emptyLabel="Nothing due today." />
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-card lg:col-span-2">
          <header className="flex items-center gap-2 border-b border-line px-4 py-3">
            <CalendarClock className="h-4 w-4 text-ink-muted" />
            <h2 className="text-sm font-semibold text-ink">Upcoming</h2>
            <span className="ml-auto text-xs text-ink-muted">{upcoming.length}</span>
          </header>
          <TaskList tasks={upcoming} redirectTo="/tasks" emptyLabel="No upcoming tasks." />
        </section>

        <section className="overflow-hidden rounded-2xl border border-line bg-card lg:col-span-2">
          <header className="flex items-center gap-2 border-b border-line px-4 py-3">
            <ListTodo className="h-4 w-4 text-status-closed" />
            <h2 className="text-sm font-semibold text-ink">Recently completed</h2>
            <span className="ml-auto text-xs text-ink-muted">{completed.length}</span>
          </header>
          <ul className="divide-y divide-line">
            {completed.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-ink-muted">No completed tasks yet.</li>
            )}
            {completed.slice(0, 10).map((task) => (
              <li key={task.id} className="flex items-center gap-3 px-4 py-3">
                <span className="text-status-closed">✓</span>
                <p className="flex-1 truncate text-sm text-ink-muted line-through">{task.title}</p>
                <span className="text-xs text-ink-muted">
                  {new Date(task.completedAt ?? task.dueAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
