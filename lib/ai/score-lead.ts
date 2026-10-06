import type { Lead } from "@/lib/db/schema";

/** Scoring weights — must sum to 100. */
const WEIGHTS = {
  completeness: 25,
  timeline: 20,
  budget: 20,
  source: 15,
  stage: 10,
  recency: 10,
} as const;

function scoreCompleteness(lead: Partial<Lead>): number {
  const fields = [
    lead.fullName,
    lead.phone,
    lead.email,
    lead.propertyType,
    lead.bedrooms,
    lead.budgetMin,
    lead.budgetMax,
    lead.locationPrefs && lead.locationPrefs.length > 0,
    lead.timeline,
    lead.notes,
  ];
  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * WEIGHTS.completeness);
}

function scoreTimeline(timeline: string | null): number {
  const map: Record<string, number> = {
    immediately: 1.0,
    "1_month": 0.8,
    "3_months": 0.6,
    "6_months": 0.35,
    just_looking: 0.1,
  };
  return Math.round((map[timeline ?? ""] ?? 0.5) * WEIGHTS.timeline);
}

function scoreBudget(budgetMax: number | null, budgetMin: number | null): number {
  const budget = budgetMax ?? budgetMin ?? 0;
  if (budget <= 0) return 0;
  const logScore = Math.min(1, Math.max(0, (Math.log10(budget) - 5.7) / (9.3 - 5.7)));
  return Math.round(logScore * WEIGHTS.budget);
}

function scoreSource(source: string | null): number {
  const map: Record<string, number> = {
    referral: 1.0,
    web_widget: 0.75,
    social_dm: 0.65,
    business_card: 0.6,
    manual: 0.5,
  };
  return Math.round((map[source ?? ""] ?? 0.5) * WEIGHTS.source);
}

function scoreStage(stage: string | null): number {
  const order: Record<string, number> = {
    new: 0,
    contacted: 0.25,
    viewing_scheduled: 0.5,
    viewed: 0.65,
    negotiating: 0.85,
    offer_made: 0.95,
    closed: 1.0,
    lost: 0,
  };
  return Math.round((order[stage ?? "new"] ?? 0) * WEIGHTS.stage);
}

function scoreRecency(createdAt: Date | string | null): number {
  if (!createdAt) return 0;
  const daysOld = Math.max(0, (Date.now() - new Date(createdAt).getTime()) / 86400000);
  const decay = Math.max(0, 1 - daysOld / 90);
  return Math.round(decay * WEIGHTS.recency);
}

export function scoreLeadBreakdown(lead: Partial<Lead>) {
  return {
    completeness: scoreCompleteness(lead),
    timeline: scoreTimeline(lead.timeline ?? null),
    budget: scoreBudget(lead.budgetMax ?? null, lead.budgetMin ?? null),
    source: scoreSource(lead.source ?? null),
    stage: scoreStage(lead.stage ?? null),
    recency: scoreRecency(lead.createdAt ?? null),
  };
}

export function scoreLead(lead: Partial<Lead>): number {
  const b = scoreLeadBreakdown(lead);
  return Math.min(
    100,
    b.completeness + b.timeline + b.budget + b.source + b.stage + b.recency,
  );
}
