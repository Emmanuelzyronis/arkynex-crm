import { test } from "node:test";
import { strict as assert } from "node:assert";

import { scoreLead, scoreLeadBreakdown } from "../lib/ai/score-lead.js";

test("an empty lead still gets the neutral timeline/source baseline", () => {
  // timeline(null) → 10, source(null) → 8, everything else 0.
  assert.equal(scoreLead({}), 18);
});

test("a fully-qualified, immediately-ready lead scores 100", () => {
  const score = scoreLead({
    fullName: "Ada Lovelace",
    phone: "+15551234567",
    email: "ada@example.com",
    propertyType: "house",
    bedrooms: 4,
    budgetMin: 1_500_000,
    budgetMax: 2_000_000_000,
    locationPrefs: ["Riverside"],
    timeline: "immediately",
    notes: "Pre-approved and ready to move.",
    source: "referral",
    stage: "closed",
    createdAt: new Date(),
  });
  assert.equal(score, 100);
});

test("breakdown components always sum to the total score", () => {
  const lead = {
    fullName: "Grace Hopper",
    phone: "+15557654321",
    timeline: "3_months",
    budgetMax: 950_000,
    source: "web_widget",
    stage: "viewing_scheduled",
    createdAt: new Date(Date.now() - 30 * 86_400_000),
  } as const;
  const breakdown = scoreLeadBreakdown(lead);
  const sum = Object.values(breakdown).reduce((acc, value) => acc + value, 0);
  assert.equal(sum, scoreLead(lead));
  assert.ok(scoreLead(lead) <= 100);
});

test("an old, closed-lost lead scores lower than a fresh one", () => {
  const base = {
    fullName: "Test Lead",
    phone: "+15550000000",
    timeline: "immediately",
    budgetMax: 900_000,
    source: "referral",
  } as const;
  const fresh = scoreLead({ ...base, stage: "negotiating", createdAt: new Date() });
  const stale = scoreLead({
    ...base,
    stage: "lost",
    createdAt: new Date(Date.now() - 365 * 86_400_000),
  });
  assert.ok(fresh > stale);
});
