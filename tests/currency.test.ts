import { test } from "node:test";
import { strict as assert } from "node:assert";

import { formatMoney, formatMoneyCompact } from "../lib/currency.js";

test("formatMoney renders whole US dollars", () => {
  assert.equal(formatMoney(1_250_000), "$1,250,000");
  assert.equal(formatMoney(0), "$0");
  assert.equal(formatMoney(null), "");
  assert.equal(formatMoney(undefined), "");
});

test("formatMoneyCompact abbreviates large amounts", () => {
  assert.equal(formatMoneyCompact(450), "$450");
  assert.equal(formatMoneyCompact(1_500), "$2K");
  assert.equal(formatMoneyCompact(412_000), "$412K");
  assert.equal(formatMoneyCompact(12_400_000), "$12.4M");
  assert.equal(formatMoneyCompact(2_000_000_000), "$2.0B");
  assert.equal(formatMoneyCompact(-3_000_000), "-$3.0M");
});
