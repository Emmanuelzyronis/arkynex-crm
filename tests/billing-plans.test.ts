import { test } from "node:test";
import { strict as assert } from "node:assert";

import { PLAN_SLUGS, TRIAL_DAYS, TRIAL_MS, clerkBillingEnabled } from "../lib/billing/plans.js";

test("trial constants are internally consistent", () => {
  assert.equal(TRIAL_DAYS, 15);
  assert.equal(TRIAL_MS, TRIAL_DAYS * 24 * 60 * 60 * 1000);
});

test("plan slugs are unique and stable", () => {
  const slugs = new Set(PLAN_SLUGS);
  assert.equal(slugs.size, PLAN_SLUGS.length);
  assert.deepEqual([...PLAN_SLUGS], ["starter", "pro", "agency"]);
});

test("billing enablement is a boolean flag", () => {
  assert.equal(typeof clerkBillingEnabled(), "boolean");
});
