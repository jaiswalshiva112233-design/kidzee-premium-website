import assert from "node:assert/strict";
import test from "node:test";

const calculate = ({ plan, hours = 0, days = 0, meals = "NONE" }) => {
  const mealPackage = meals === "BOTH" ? 2000 : meals === "NONE" ? 0 : 1200;
  if (plan === "EMERGENCY") return hours * 100 + (meals === "NONE" ? 0 : meals === "BOTH" ? 100 : 50);
  if (plan === "FULL_DAY") return 400;
  if (plan === "FLEXIBLE") return days * 400 + mealPackage;
  if (plan === "MONTHLY_6H") return 6000 + mealPackage;
  if (plan === "MONTHLY_6_5H") return 6500 + mealPackage;
  throw new Error("Unknown plan");
};

test("emergency daycare is hourly with per-meal pricing", () => {
  assert.equal(calculate({ plan: "EMERGENCY", hours: 2, meals: "LUNCH" }), 250);
});

test("full day is 400 and includes food", () => {
  assert.equal(calculate({ plan: "FULL_DAY", meals: "BOTH" }), 400);
});

test("flexible days examples are exact", () => {
  assert.equal(calculate({ plan: "FLEXIBLE", days: 8 }), 3200);
  assert.equal(calculate({ plan: "FLEXIBLE", days: 8, meals: "LUNCH" }), 4400);
  assert.equal(calculate({ plan: "FLEXIBLE", days: 8, meals: "BOTH" }), 5200);
});

test("monthly plan examples are exact", () => {
  assert.equal(calculate({ plan: "MONTHLY_6H", meals: "LUNCH" }), 7200);
  assert.equal(calculate({ plan: "MONTHLY_6H", meals: "BOTH" }), 8000);
  assert.equal(calculate({ plan: "MONTHLY_6_5H", meals: "LUNCH" }), 7700);
  assert.equal(calculate({ plan: "MONTHLY_6_5H", meals: "BOTH" }), 8500);
});
