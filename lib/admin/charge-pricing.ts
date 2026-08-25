export type ChargePriceType = "GST_INCLUSIVE" | "GST_EXCLUSIVE";

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateChargePricing(input: {
  configuredAmount: number;
  gstApplicable: boolean;
  gstRate: number;
  priceType: ChargePriceType;
}) {
  const configuredAmount = money(Math.max(0, input.configuredAmount));
  const gstRate = input.gstApplicable ? Math.max(0, input.gstRate) : 0;

  if (!input.gstApplicable || gstRate === 0) {
    return {
      configuredAmount,
      taxableAmount: configuredAmount,
      cgstAmount: 0,
      sgstAmount: 0,
      totalAmount: configuredAmount,
    };
  }

  const taxableAmount =
    input.priceType === "GST_EXCLUSIVE"
      ? configuredAmount
      : money(configuredAmount / (1 + gstRate / 100));
  const totalAmount =
    input.priceType === "GST_EXCLUSIVE"
      ? money(taxableAmount * (1 + gstRate / 100))
      : configuredAmount;
  const taxAmount = money(totalAmount - taxableAmount);
  const cgstAmount = money(taxAmount / 2);

  return {
    configuredAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount: money(taxAmount - cgstAmount),
    totalAmount,
  };
}

