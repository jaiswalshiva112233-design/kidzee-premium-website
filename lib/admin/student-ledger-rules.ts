export class LedgerRequestError extends Error {
  readonly status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

export interface FeeInvoiceItemFinder {
  feeInvoiceItem: {
    findFirst(args: {
      where: Record<string, unknown>;
      select?: Record<string, boolean>;
    }): Promise<{ id: string; category?: string; title?: string } | null>;
  };
}

export async function assertNoDuplicateAnnualOrKitCharge(
  tx: FeeInvoiceItemFinder,
  category: string,
  studentId: string,
  academicYear: string,
) {
  if (!["ANNUAL_FEE", "KIT_FEE"].includes(category) || !academicYear) {
    return;
  }
  const sessionYear = academicYear.slice(0, 4);
  const specificPrefix =
    category === "ANNUAL_FEE"
      ? "programme-annual:"
      : "programme-kit:";
  const combinedPrefix = "programme-annual-kit:";

  const alreadyBilled = await tx.feeInvoiceItem.findFirst({
    where: {
      invoice: {
        studentId,
        status: { not: "CANCELLED" },
      },
      OR: [
        {
          category,
          chargeKey: {
            startsWith: `${specificPrefix}${studentId}:`,
            endsWith: `:${sessionYear}`,
          },
        },
        {
          chargeKey: {
            startsWith: `${combinedPrefix}${studentId}:`,
            endsWith: `:${sessionYear}`,
          },
        },
        {
          category,
          chargeKey: {
            startsWith: "contract-onetime:",
          },
          contractService: {
            contract: {
              academicSession: {
                contains: sessionYear,
              },
            },
          },
        },
      ],
    },
    select: { id: true, category: true, title: true },
  });

  if (alreadyBilled) {
    throw new LedgerRequestError(
      `The ${category === "KIT_FEE" ? "kit" : "annual"} fee for ${academicYear} is already on this child's financial history.`,
      409,
    );
  }
}
