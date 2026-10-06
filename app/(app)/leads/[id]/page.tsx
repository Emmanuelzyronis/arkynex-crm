import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Clock, Mail, MapPin, Pencil, Phone, StickyNote, Trash2 } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { getLead } from "@/lib/supabase/queries/leads";
import { archiveLead, deleteLead, updateLeadStage } from "@/lib/supabase/mutations/leads";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { stageConfig, initials, avatarPalette, scoreColor } from "@/lib/mock-leads";
import { cn } from "@/lib/utils";
import type { Tables } from "@/lib/supabase/types";

function formatNaira(n: number | null) {
  if (!n) return null;
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  return `₦${Math.round(n / 1_000_000)}M`;
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  let lead: Awaited<ReturnType<typeof getLead>>;
  try {
    lead = await getLead(supabase, id);
  } catch {
    notFound();
  }

  const stage = stageConfig[lead.stage as keyof typeof stageConfig] ?? { label: lead.stage, color: "#64748B" };
  const allStages = Object.entries(stageConfig).map(([value, cfg]) => ({ value, ...cfg }));
  const budget = [formatNaira(lead.budget_min), formatNaira(lead.budget_max)].filter(Boolean).join(" – ");
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
                {initials(lead.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-semibold text-ink">{lead.full_name}</h1>                <div className="mt-2 flex flex-wrap gap-4 text-sm text-ink-muted">
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
              <InfoRow label="Property type" value={lead.property_type} />
              <InfoRow label="Bedrooms" value={lead.bedrooms?.toString()} />
              <InfoRow label="Budget" value={budget || null} />
              <InfoRow label="Timeline" value={lead.timeline?.replace("_", " ") ?? null} />
              {lead.location_prefs && lead.location_prefs.length > 0 && (
                <div className="sm:col-span-2">
                  <p className="text-xs text-ink-muted">Preferred areas</p>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    {lead.location_prefs.map((area: string) => (
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

          {(lead.lead_stage_history as Tables<"lead_stage_history">[]).length > 0 && (
            <div className="rounded-2xl border border-line bg-card p-5">
              <h2 className="flex items-center gap-2 text-base font-semibold text-ink">
                <Clock className="h-4 w-4 text-ink-muted" />Stage History
              </h2>
              <ul className="mt-4 space-y-3">
                {(lead.lead_stage_history as Tables<"lead_stage_history">[])
                  .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                  .map((h) => {
                    const toStageCfg = stageConfig[h.to_stage as keyof typeof stageConfig];
                    return (
                      <li key={h.id} className="flex items-start gap-3 text-sm">
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: toStageCfg?.color ?? "#64748B" }} />
                        <div>
                          <p className="text-ink">
                            {h.from_stage
                              ? `${stageConfig[h.from_stage as keyof typeof stageConfig]?.label ?? h.from_stage} → ${toStageCfg?.label ?? h.to_stage}`
                              : toStageCfg?.label ?? h.to_stage}
                          </p>
                          {h.notes && <p className="mt-0.5 text-xs text-ink-muted">{h.notes}</p>}
                          <p className="mt-0.5 text-xs text-ink-muted">
                            {new Date(h.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
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
                  {new Date(lead.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
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
