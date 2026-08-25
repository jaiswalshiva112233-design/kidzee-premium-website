function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

type PaymentAllocationInput = {
  amountReceived: number;
  currentPendingAmount: number;
  invoiceCgstAmount: number;
  invoiceSgstAmount: number;
  invoiceLateFeeAmount: number;
  allocatedCgstAmount: number;
  allocatedSgstAmount: number;
  allocatedLateFeeAmount: number;
};

/**
 * Allocates the remaining inclusive-tax and late-fee amounts to one receipt.
 * The last payment receives every rounding remainder, so the sum of all
 * payment snapshots always reconciles to the invoice.
 */
export function allocatePaymentSnapshot(input: PaymentAllocationInput) {
  const currentPendingAmount = roundMoney(input.currentPendingAmount);
  const amountReceived = roundMoney(input.amountReceived);
  const isFinalPayment = amountReceived >= currentPendingAmount;
  const ratio =
    currentPendingAmount > 0
      ? Math.min(Math.max(amountReceived / currentPendingAmount, 0), 1)
      : 0;

  const allocateRemaining = (invoiceAmount: number, alreadyAllocated: number) => {
    const remaining = roundMoney(
      Math.max(roundMoney(invoiceAmount) - roundMoney(alreadyAllocated), 0),
    );
    return isFinalPayment ? remaining : roundMoney(remaining * ratio);
  };

  const cgstAmount = allocateRemaining(
    input.invoiceCgstAmount,
    input.allocatedCgstAmount,
  );
  const sgstAmount = allocateRemaining(
    input.invoiceSgstAmount,
    input.allocatedSgstAmount,
  );
  const lateFeeAmount = allocateRemaining(
    input.invoiceLateFeeAmount,
    input.allocatedLateFeeAmount,
  );
  const taxableAmount = roundMoney(
    Math.max(amountReceived - cgstAmount - sgstAmount, 0),
  );

  return {
    totalAmount: amountReceived,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    lateFeeAmount,
  };
}
