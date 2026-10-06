import { test } from "node:test";
import { strict as assert } from "node:assert";

import { ACTION_PLANS } from "../lib/leads/action-plans.js";

test("every action plan has a unique key and at least one step", () => {
  const keys = new Set(ACTION_PLANS.map((plan) => plan.key));
  assert.equal(keys.size, ACTION_PLANS.length);
  for (const plan of ACTION_PLANS) {
    assert.ok(plan.name.length > 0);
    assert.ok(plan.steps.length > 0);
  }
});

test("action plan steps are ordered by day offset and non-negative", () => {
  for (const plan of ACTION_PLANS) {
    const offsets = plan.steps.map((step) => step.dayOffset);
    assert.deepEqual(offsets, [...offsets].sort((a, b) => a - b));
    assert.ok(offsets.every((offset) => offset >= 0));
  }
});
