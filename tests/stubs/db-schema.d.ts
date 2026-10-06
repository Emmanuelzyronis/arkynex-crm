/** Minimal test-only shape of the Lead row used by the scoring heuristics. */
export type Lead = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  company: string | null;
  source: string | null;
  propertyType: string | null;
  bedrooms: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  locationPrefs: string[] | null;
  timeline: string | null;
  notes: string | null;
  stage: string | null;
  score: number;
  archived: boolean;
  lastContactedAt: Date | string | null;
  createdAt: Date | string | null;
};
