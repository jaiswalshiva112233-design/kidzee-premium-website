import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  dateIsWithinEffectiveRange,
  effectiveRangesOverlap,
  getIndiaMonthRange,
} from "../lib/admin/daycare-rules.ts";
import { allocatePaymentSnapshot } from "../lib/admin/fee-allocation.ts";
import {
  getCategoryAllocationBasis,
  normalisePaymentComponents,
} from "../lib/admin/financial-report-allocation.ts";

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("effective daycare ranges reject only genuine overlaps", () => {
  const first = {
    effectiveFrom: new Date("2026-08-01T00:00:00.000+05:30"),
    effectiveTo: new Date("2026-08-31T23:59:59.999+05:30"),
  };
  assert.equal(
    effectiveRangesOverlap(first, {
      effectiveFrom: new Date("2026-09-01T00:00:00.000+05:30"),
      effectiveTo: null,
    }),
    false,
  );
  assert.equal(
    effectiveRangesOverlap(first, {
      effectiveFrom: new Date("2026-08-31T00:00:00.000+05:30"),
      effectiveTo: null,
    }),
    true,
  );
});

test("plan effective-date guard is inclusive at both boundaries", () => {
  const range = {
    effectiveFrom: new Date("2026-08-01T00:00:00.000+05:30"),
    effectiveTo: new Date("2026-08-31T23:59:59.999+05:30"),
  };
  assert.equal(dateIsWithinEffectiveRange(range.effectiveFrom, range), true);
  assert.equal(dateIsWithinEffectiveRange(range.effectiveTo, range), true);
  assert.equal(
    dateIsWithinEffectiveRange(
      new Date("2026-09-01T00:00:00.000+05:30"),
      range,
    ),
    false,
  );
});

test("India month boundaries remain correct when the server runs in UTC", () => {
  const { start, end } = getIndiaMonthRange(
    new Date("2026-08-31T20:00:00.000Z"),
  );
  assert.equal(start.toISOString(), "2026-08-31T18:30:00.000Z");
  assert.equal(end.toISOString(), "2026-09-30T18:29:59.999Z");
});

test("partial GST allocations reconcile exactly on the final payment", () => {
  const first = allocatePaymentSnapshot({
    amountReceived: 400,
    currentPendingAmount: 1180,
    invoiceCgstAmount: 90,
    invoiceSgstAmount: 90,
    invoiceLateFeeAmount: 0,
    allocatedCgstAmount: 0,
    allocatedSgstAmount: 0,
    allocatedLateFeeAmount: 0,
  });
  const second = allocatePaymentSnapshot({
    amountReceived: 780,
    currentPendingAmount: 780,
    invoiceCgstAmount: 90,
    invoiceSgstAmount: 90,
    invoiceLateFeeAmount: 0,
    allocatedCgstAmount: first.cgstAmount,
    allocatedSgstAmount: first.sgstAmount,
    allocatedLateFeeAmount: first.lateFeeAmount,
  });

  assert.equal(first.cgstAmount + second.cgstAmount, 90);
  assert.equal(first.sgstAmount + second.sgstAmount, 90);
  assert.equal(first.totalAmount + second.totalAmount, 1180);
  assert.equal(
    first.taxableAmount + second.taxableAmount + 180,
    1180,
  );
});

test("payment idempotency is bound to the original payment details", () => {
  const fees = source("app/api/admin/fees/route.ts");

  assert.match(fees, /replayMatchesOriginalRequest/);
  assert.match(fees, /existingPayment\.studentId === studentId/);
  assert.match(fees, /existingPayment\.invoiceId === requestedInvoiceId/);
  assert.match(fees, /target\.includes\("idempotencyKey"\)/);
});

test("opening the fee workspace is read-only until Refresh Dues is selected", () => {
  const form = source("components/admin/fees/CollectFeeForm.tsx");

  assert.match(form, /async \(refreshLedger = false\)/);
  assert.match(form, /void loadFeeData\(\)/);
  assert.match(form, /onClick=\{\(\) => void handleRefreshLedger\(\)\}/);
  assert.match(form, /body: JSON\.stringify\(\{ action: "refresh-ledger" \}\)/);
});

test("combined invoice category filters use item shares instead of the primary invoice category", () => {
  const basis = getCategoryAllocationBasis({
    items: [
      {
        category: "MONTHLY_PRESCHOOL_FEE",
        title: "Preschool",
        totalAmount: 6000,
        cgstAmount: 0,
        sgstAmount: 0,
      },
      {
        category: "DAYCARE_FEE",
        title: "Monthly daycare add-on",
        totalAmount: 6500,
        cgstAmount: 495.76,
        sgstAmount: 495.77,
      },
      {
        category: "DAYCARE_MEAL_COMBO_FEE",
        title: "Lunch + evening snack",
        totalAmount: 2000,
        cgstAmount: 47.62,
        sgstAmount: 47.62,
      },
    ],
    selectedCategories: ["DAYCARE_FEE", "DAYCARE_MEAL_COMBO_FEE"],
    fallbackCategory: "MONTHLY_PRESCHOOL_FEE",
    invoiceTotalAmount: 14500,
  });

  assert.ok(basis);
  assert.equal(basis.feeType, "Monthly daycare add-on + Lunch + evening snack");
  assert.equal(basis.grossShare, 8500 / 14500);
  assert.equal(basis.gstShare, 1);
});

test("legacy partial-payment GST snapshots are scaled once for CA reports", () => {
  const payment = normalisePaymentComponents({
    amountReceived: 590,
    totalAmount: 1180,
    cgstAmount: 90,
    sgstAmount: 90,
    lateFeeAmount: 0,
  });

  assert.equal(payment.snapshotRatio, 0.5);
  assert.equal(payment.cgstAmount, 45);
  assert.equal(payment.sgstAmount, 45);
});
