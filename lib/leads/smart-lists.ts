import type { LeadFilters, LeadSort } from "@/lib/db/queries/leads";

/** Serializable filter shape stored in smart_lists.filters (jsonb). */
export type SmartListFilters = {
  stage?: string;
  search?: string;
  source?: string;
  propertyType?: string;
  timeline?: string;
  minScore?: number;
  maxScore?: number;
  minBudget?: number;
  maxBudget?: number;
  assignedToId?: string;
  /** Only leads not contacted in the last N days. */
  lastContactedDays?: number;
  /** Only leads created within the last N days. */
  createdWithinDays?: number;
  sort?: LeadSort;
};

export const SMART_LIST_PRESETS: {
  key: string;
  name: string;
  filters: SmartListFilters;
}[] = [
  { key: "hot", name: "Hot leads", filters: { minScore: 80, sort: "score" } },
  {
    key: "followup",
    name: "Needs follow-up",
    filters: { lastContactedDays: 3, sort: "last_contact" },
  },
  {
    key: "new_week",
    name: "New this week",
    filters: { createdWithinDays: 7, sort: "recent" },
  },
  {
    key: "big_budget",
    name: "Big budgets",
    filters: { minBudget: 1_000_000, sort: "score" },
  },
  {
    key: "unassigned",
    name: "Unassigned",
    filters: { assignedToId: "unassigned", sort: "recent" },
  },
  {
    key: "viewing",
    name: "In viewing stage",
    filters: { stage: "viewing_scheduled,viewed", sort: "score" },
  },
];

const SORTS: LeadSort[] = ["score", "recent", "name", "last_contact"];

function cleanString(value: unknown): string | undefined {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" || trimmed === "any" ? undefined : trimmed;
}

function cleanNumber(value: unknown): number | undefined {
  if (value === "" || value == null) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Sanitize arbitrary jsonb into a known filter shape. */
export function parseSmartListFilters(value: unknown): SmartListFilters {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  const filters: SmartListFilters = {};

  const stage = cleanString(raw.stage);
  const search = cleanString(raw.search);
  const source = cleanString(raw.source);
  const propertyType = cleanString(raw.propertyType);
  const timeline = cleanString(raw.timeline);
  const assignedToId = cleanString(raw.assignedToId);
  if (stage) filters.stage = stage;
  if (search) filters.search = search;
  if (source) filters.source = source;
  if (propertyType) filters.propertyType = propertyType;
  if (timeline) filters.timeline = timeline;
  if (assignedToId) filters.assignedToId = assignedToId;

  const minScore = cleanNumber(raw.minScore);
  const maxScore = cleanNumber(raw.maxScore);
  const minBudget = cleanNumber(raw.minBudget);
  const maxBudget = cleanNumber(raw.maxBudget);
  const lastContactedDays = cleanNumber(raw.lastContactedDays);
  const createdWithinDays = cleanNumber(raw.createdWithinDays);
  if (minScore != null) filters.minScore = minScore;
  if (maxScore != null) filters.maxScore = maxScore;
  if (minBudget != null) filters.minBudget = minBudget;
  if (maxBudget != null) filters.maxBudget = maxBudget;
  if (lastContactedDays != null) filters.lastContactedDays = lastContactedDays;
  if (createdWithinDays != null) filters.createdWithinDays = createdWithinDays;

  const sort = cleanString(raw.sort);
  if (sort && SORTS.includes(sort as LeadSort)) filters.sort = sort as LeadSort;

  return filters;
}

/** Convert stored filters into the query layer's date-based filter shape. */
export function smartListToLeadFilters(filters: SmartListFilters): LeadFilters {
  const out: LeadFilters = {};
  if (filters.stage) out.stage = filters.stage;
  if (filters.search) out.search = filters.search;
  if (filters.source) out.source = filters.source;
  if (filters.propertyType) out.propertyType = filters.propertyType;
  if (filters.timeline) out.timeline = filters.timeline;
  if (filters.assignedToId) out.assignedToId = filters.assignedToId;
  if (filters.minScore != null) out.minScore = filters.minScore;
  if (filters.maxScore != null) out.maxScore = filters.maxScore;
  if (filters.minBudget != null) out.minBudget = filters.minBudget;
  if (filters.maxBudget != null) out.maxBudget = filters.maxBudget;
  if (filters.sort) out.sort = filters.sort;

  if (filters.lastContactedDays && filters.lastContactedDays > 0) {
    out.lastContactedBefore = new Date(Date.now() - filters.lastContactedDays * 86_400_000);
  }
  if (filters.createdWithinDays && filters.createdWithinDays > 0) {
    out.createdAfter = new Date(Date.now() - filters.createdWithinDays * 86_400_000);
  }
  return out;
}

const SORT_LABELS: Record<LeadSort, string> = {
  score: "Highest score",
  recent: "Newest first",
  name: "Name A–Z",
  last_contact: "Longest since contact",
};

/** Short human-readable summary shown on the smart-list chip / card. */
export function describeSmartList(filters: SmartListFilters): string {
  const parts: string[] = [];
  if (filters.minScore != null) parts.push(`score ≥ ${filters.minScore}`);
  if (filters.lastContactedDays) parts.push(`no contact ${filters.lastContactedDays}d+`);
  if (filters.createdWithinDays) parts.push(`new in ${filters.createdWithinDays}d`);
  if (filters.minBudget != null) parts.push(`budget ≥ $${Math.round(filters.minBudget / 1000)}k`);
  if (filters.assignedToId === "unassigned") parts.push("unassigned");
  if (filters.stage) parts.push(filters.stage.replace(/_/g, " ").replace(/,/g, " / "));
  if (filters.source) parts.push(filters.source.replace(/_/g, " "));
  if (filters.propertyType) parts.push(filters.propertyType);
  return parts.length > 0 ? parts.join(" · ") : SORT_LABELS[filters.sort ?? "score"];
}
