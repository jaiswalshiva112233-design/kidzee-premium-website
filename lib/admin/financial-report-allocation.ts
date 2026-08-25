export type FinancialReportItem = {
  category: string;
  title: string;
  totalAmount: number;
  cgstAmount: number;
  sgstAmount: number;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function normalisePaymentComponents(input: {
  amountReceived: number;
  totalAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  lateFeeAmount: number;
}) {
  const amountReceived = roundMoney(input.amountReceived);
  const storedTotal = roundMoney(input.totalAmount);
  const legacyPartialRatio =
    storedTotal > amountReceived && storedTotal > 0
      ? amountReceived / storedTotal
      : 1;

  return {
    amountReceived,
    snapshotRatio: legacyPartialRatio,
    cgstAmount: roundMoney(input.cgstAmount * legacyPartialRatio),
    sgstAmount: roundMoney(input.sgstAmount * legacyPartialRatio),
    lateFeeAmount: roundMoney(input.lateFeeAmount * legacyPartialRatio),
  };
}

export function getCategoryAllocationBasis(input: {
  items: FinancialReportItem[];
  selectedCategories: readonly string[] | null;
  fallbackCategory: string;
  lateFeeAmount?: number;
  invoiceTotalAmount?: number;
}) {
  const { items, selectedCategories, fallbackCategory } = input;

  if (!selectedCategories) {
    return {
      grossShare: 1,
      gstShare: 1,
      feeType: "",
    };
  }

  if (selectedCategories.includes("LATE_FEE")) {
    const invoiceTotal = roundMoney(input.invoiceTotalAmount ?? 0);
    const lateFee = roundMoney(input.lateFeeAmount ?? 0);

    if (lateFee <= 0) return null;

    return {
      grossShare:
        invoiceTotal > 0
          ? Math.min(lateFee / invoiceTotal, 1)
          : 1,
      gstShare: 0,
      feeType: "Late Fee",
    };
  }

  if (items.length === 0) {
    return selectedCategories.includes(fallbackCategory)
      ? {
          grossShare: 1,
          gstShare: 1,
          feeType: "",
        }
      : null;
  }

  const matchingItems = items.filter((item) =>
    selectedCategories.includes(item.category),
  );

  if (matchingItems.length === 0) return null;

  const grossTotal = items.reduce(
    (sum, item) => sum + item.totalAmount,
    0,
  );
  const matchingGross = matchingItems.reduce(
    (sum, item) => sum + item.totalAmount,
    0,
  );
  const gstTotal = items.reduce(
    (sum, item) => sum + item.cgstAmount + item.sgstAmount,
    0,
  );
  const matchingGst = matchingItems.reduce(
    (sum, item) => sum + item.cgstAmount + item.sgstAmount,
    0,
  );

  return {
    grossShare: grossTotal > 0 ? matchingGross / grossTotal : 0,
    gstShare:
      gstTotal > 0 ? matchingGst / gstTotal : 0,
    feeType: [...new Set(matchingItems.map((item) => item.title))].join(" + "),
  };
}

export function allocateReportAmount(amount: number, share: number) {
  return roundMoney(amount * Math.min(Math.max(share, 0), 1));
}
