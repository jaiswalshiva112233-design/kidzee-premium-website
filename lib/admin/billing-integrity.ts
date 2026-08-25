export class BillingIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BillingIntegrityError";
  }
}

type SourceCharge = {
  chargeKey: string;
  sourceType: string;
  sourceId: string;
  amount: number;
};

function paise(value: number) {
  if (!Number.isFinite(value)) {
    throw new BillingIntegrityError("Invoice generation stopped because a charge contains an invalid amount.");
  }
  return Math.round(value * 100);
}

export function assertSourceCharges(items: SourceCharge[]) {
  if (items.length === 0) {
    throw new BillingIntegrityError("Invoice generation stopped because the bill has no charge items.");
  }
  const keys = new Set<string>();
  for (const item of items) {
    if (!item.chargeKey || !item.sourceType || !item.sourceId) {
      throw new BillingIntegrityError("Invoice generation stopped because a charge is missing its authoritative ledger source.");
    }
    if (paise(item.amount) <= 0) {
      throw new BillingIntegrityError("Invoice generation stopped because a charge is zero or negative.");
    }
    if (keys.has(item.chargeKey)) {
      throw new BillingIntegrityError(`Invoice generation stopped because charge ${item.chargeKey} appears more than once.`);
    }
    keys.add(item.chargeKey);
  }
}

export function assertUniqueChargeKeys(items: Array<{ chargeKey: string }>) {
  const keys = new Set<string>();
  for (const item of items) {
    if (keys.has(item.chargeKey)) {
      throw new BillingIntegrityError(`Invoice generation stopped because charge ${item.chargeKey} was assigned to more than one bill.`);
    }
    keys.add(item.chargeKey);
  }
}

export function assertInvoiceArithmetic(input: {
  itemTotals: number[];
  discountAmount?: number;
  lateFeeAmount?: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
}) {
  const itemPaise = input.itemTotals.reduce((sum, value) => sum + paise(value), 0);
  const expectedTotal = itemPaise - paise(input.discountAmount ?? 0) + paise(input.lateFeeAmount ?? 0);
  const total = paise(input.totalAmount);
  const paid = paise(input.paidAmount);
  const pending = paise(input.pendingAmount);
  if (expectedTotal !== total || paid < 0 || pending < 0 || paid + pending !== total) {
    throw new BillingIntegrityError("Invoice generation stopped because the invoice arithmetic or outstanding balance is inconsistent.");
  }
}
