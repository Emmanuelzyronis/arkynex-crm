import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, ListTodo, Mail, MapPin, Pencil, Phone, Sparkles, StickyNote, Trash2 } from "lucide-react";

import { getLead } from "@/lib/db/queries/leads";
import { getTasksForLead } from "@/lib/db/queries/tasks";
import { getActiveTeamMembers } from "@/lib/db/queries/team";
import { archiveLead, deleteLead, updateLeadStage } from "@/lib/db/mutations/leads";
import { createTask, startActionPlan } from "@/lib/db/mutations/tasks";
import { assignLeadToMember } from "@/lib/db/mutations/team";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { TaskList } from "@/components/tasks/task-list";
import { ACTION_PLANS } from "@/lib/leads/action-plans";
import { stageConfig, initials, avatarPalette, scoreColor } from "@/lib/mock-leads";
import { cn } from "@/lib/utils";
import type { LeadStageHistory } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/user";
import { formatMoneyCompact } from "@/lib/currency";

function defaultDue() {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}


function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-ink-muted">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink">{value}</p>
    </div>
  );
}

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const { id } = await params;
  const { error, success } = await searchParams;
  const userId = await requireUser();

  const lead = await getLead(userId, id);
  if (!lead) notFound();

  const [tasks, members] = await Promise.all([
    getTasksForLead(userId, lead.id),
    getActiveTeamMembers(userId),
  ]);
  const openTasks = tasks.filter((task) => !task.completed);

  const stage = stageConfig[lead.stage as keyof typeof stageConfig] ?? { label: lead.stage, color: "#64748B" };
  const allStages = Object.entries(stageConfig).map(([value, cfg]) => ({ value, ...cfg }));
  const budget = [formatMoneyCompact(lead.budgetMin), formatMoneyCompact(lead.budgetMax)].filter(Boolean).join(" – ");
  const archiveWithId = archiveLead.bind(null, lead.id);

  return (
    <div className="max-w-4xl space-y-6">
      <Link href="/leads" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Leads
      </Link>

      {success && (
        <div className="rounded-xl border border-status-closed/30 bg-status-closed/10 px-4 py-3 text-sm text-status-closed">
          Lead updated successfully.
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-status-lost/30 bg-status-lost/10 px-4 py-3 text-sm text-status-lost">
          {decodeURIComponent(error)}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-card p-5">
            <div className="flex items-start gap-4">
              <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-base font-semibold", avatarPalette[0])}>
                {initials(lead.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold text-ink">{lead.fullName}</h1>                <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-muted">
                  <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{lead.phone}</span>
                  {lead.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{lead.email}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: scoreColor(lead.score) }} />
                {lead.score}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-base font-semibold text-ink">Requirement</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <InfoRow label="Property type" value={lead.propertyType} />
              <InfoRow label="Bedrooms" value={lead.bedrooms?.toString()} />
              <InfoRow label="Budget" value={budget || null} />
              <InfoRow label="Timeline" value={lead.timeline?.replace("_", " ") ?? null} />
              {lead.locationPrefs && lead.locationPrefs.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-ink-muted">Preferred areas</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {lead.locationPrefs.map((area: string) => (
                      <span key={area} className="flex items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-xs text-ink-muted">
                        <MapPin className="h-3 w-3" />{area}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {lead.notes && (
            <div className="rounded-2xl border border-line bg-card p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <StickyNote className="h-4 w-4 text-ink-muted" />Notes
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{lead.notes}</p>
            </div>
          )}

          {(lead.leadStageHistory as LeadStageHistory[]).length > 0 && (
            <div className="rounded-2xl border border-line bg-card p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Clock className="h-4 w-4 text-ink-muted" />Stage History
              </h2>
              <ul className="mt-4 space-y-3">
                {(lead.leadStageHistory as LeadStageHistory[])
                  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                  .map((h) => {
                    const toStageCfg = stageConfig[h.toStage as keyof typeof stageConfig];
                    return (
                      <li key={h.id} className="flex items-start gap-3 text-sm">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: toStageCfg?.color ?? "#64748B" }} />
                        <div>
                          <p className="text-ink">
                            {h.fromStage
                              ? `${stageConfig[h.fromStage as keyof typeof stageConfig]?.label ?? h.fromStage} → ${toStageCfg?.label ?? h.toStage}`
                              : toStageCfg?.label ?? h.toStage}
                          </p>
                          {h.notes && <p className="mt-0.5 text-xs text-ink-muted">{h.notes}</p>}
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-sm font-semibold text-ink">Pipeline Stage</h2>
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium" style={{ backgroundColor: `${stage.color}1A`, color: stage.color }}>
                {stage.label}
              </span>
            </div>
            <form className="mt-4 space-y-3">
              <input type="hidden" name="leadId" value={lead.id} />
              <Select name="toStage" defaultValue={lead.stage}>
                {allStages.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </Select>
              <Button size="sm" className="w-full" formAction={updateLeadStage}>
                Move stage
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5 text-sm">
            <h2 className="font-semibold text-ink">Details</h2>
            <div className="mt-3 space-y-2 text-ink-muted">
              <div className="flex justify-between">
                <span>Source</span>
                <span className="font-medium text-ink capitalize">{lead.source.replace(/_/g, " ")}</span>
              </div>
              <div className="flex justify-between">
                <span>Created</span>
                <span className="font-medium text-ink">
                  {new Date(lead.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              {lead.company && (
                <div className="flex justify-between">
                  <span>Company</span>
                  <span className="font-medium text-ink">{lead.company}</span>
                </div>
              )}
            </div>
          </div>

          {members.length > 0 && (
            <div className="rounded-2xl border border-line bg-card p-5">
              <h2 className="text-sm font-semibold text-ink">Assigned to</h2>
              <p className="mt-1 text-xs text-ink-muted">
                {lead.assignedToName ?? "Unassigned — route to a team member."}
              </p>
              <form className="mt-3 space-y-3">
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="redirectTo" value={`/leads/${lead.id}`} />
                <Select name="memberId" defaultValue={lead.assignedToId ?? ""}>
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.fullName}
                    </option>
                  ))}
                </Select>
                <Button size="sm" variant="outline" className="w-full" formAction={assignLeadToMember}>
                  Update owner
                </Button>
              </form>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-line bg-card">
            <header className="flex items-center gap-2 border-b border-line px-5 py-4">
              <ListTodo className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold text-ink">Tasks</h2>
              <span className="ml-auto text-xs text-ink-muted">{openTasks.length} open</span>
            </header>
            <TaskList tasks={openTasks} redirectTo={`/leads/${lead.id}`} hideLead emptyLabel="No open tasks for this lead." />
            <form className="space-y-3 border-t border-line p-5">
              <input type="hidden" name="leadId" value={lead.id} />
              <input type="hidden" name="redirectTo" value={`/leads/${lead.id}`} />
              <div className="space-y-1.5">
                <Label htmlFor="task-title">New task</Label>
                <Input id="task-title" name="title" placeholder="Follow up about…" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="task-type">Type</Label>
                  <Select id="task-type" name="type" defaultValue="follow_up">
                    <option value="follow_up">Follow up</option>
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="text">Text</option>
                    <option value="viewing">Viewing</option>
                    <option value="admin">Admin</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select id="task-priority" name="priority" defaultValue="normal">
                    <option value="high">High</option>
                    <option value="normal">Normal</option>
                    <option value="low">Low</option>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="task-due">Due</Label>
                <Input id="task-due" name="dueAt" type="datetime-local" defaultValue={defaultDue()} />
              </div>
              <Button size="sm" className="w-full" formAction={createTask}>
                Add task
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
              <Sparkles className="h-4 w-4 text-primary" /> Start an action plan
            </h2>
            <p className="mt-1 text-xs text-ink-muted">
              Schedule a proven follow-up sequence in one click.
            </p>
            <form className="mt-3 flex flex-col gap-2">
              <input type="hidden" name="leadId" value={lead.id} />
              <Select name="planKey" defaultValue={ACTION_PLANS[0].key}>
                {ACTION_PLANS.map((plan) => (
                  <option key={plan.key} value={plan.key}>
                    {plan.name} — {plan.description}
                  </option>
                ))}
              </Select>
              <Button type="submit" size="sm" variant="outline" className="w-full" formAction={startActionPlan}>
                Create tasks
              </Button>
            </form>
          </div>

          <div className="rounded-2xl border border-line bg-card p-5">
            <h2 className="text-sm font-semibold text-ink">Actions</h2>
            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/leads/${lead.id}/edit`}>
                  <Pencil className="h-4 w-4" />
                  Edit lead
                </Link>
              </Button>
              <form>
                <Button type="submit" variant="outline" size="sm" className="w-full" formAction={archiveWithId}>
                  Archive lead
                </Button>
              </form>
              <form>
                <input type="hidden" name="leadId" value={lead.id} />
                <Button type="submit" variant="ghost" size="sm" className="w-full text-status-lost hover:bg-status-lost/5 hover:text-status-lost" formAction={deleteLead}>
                  <Trash2 className="h-4 w-4" />Delete lead
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
