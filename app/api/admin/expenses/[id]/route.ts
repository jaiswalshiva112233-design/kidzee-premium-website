import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateExpenseBody = {
  category?: unknown;
  title?: unknown;
  vendorName?: unknown;
  expenseDate?: unknown;
  amountBeforeTax?: unknown;
  gstApplicable?: unknown;
  gstRate?: unknown;
  paymentMethod?: unknown;
  transactionReference?: unknown;
  invoiceNumber?: unknown;
  invoiceFileUrl?: unknown;
  notes?: unknown;
};

const EXPENSE_CATEGORIES = [
  "RENT",
  "GST",
  "SALARY",
  "ELECTRICITY",
  "FOOD",
  "SECURITY",
  "MAINTENANCE",
  "MARKETING",
  "STATIONERY",
  "ACTIVITIES",
  "TRANSPORT",
  "PROFESSIONAL_FEES",
  "SOFTWARE",
  "EQUIPMENT",
  "OTHER",
] as const;

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
] as const;

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptionalText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function parseBoolean(value: unknown) {
  return (
    value === true ||
    cleanText(value).toLowerCase() === "true"
  );
}

function isExpenseCategory(
  value: string,
): value is $Enums.ExpenseCategory {
  return EXPENSE_CATEGORIES.includes(
    value as $Enums.ExpenseCategory,
  );
}

function isPaymentMethod(
  value: string,
): value is $Enums.PaymentMethod {
  return PAYMENT_METHODS.includes(
    value as $Enums.PaymentMethod,
  );
}

function parseDate(value: unknown) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const date = new Date(`${text}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseAmount(value: unknown) {
  const amount =
    typeof value === "number"
      ? value
      : Number(cleanText(value).replace(/,/g, ""));

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > 100000000
  ) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function parseGstRate(value: unknown) {
  const rate =
    typeof value === "number"
      ? value
      : Number(cleanText(value));

  if (
    !Number.isFinite(rate) ||
    rate < 0 ||
    rate > 28
  ) {
    return null;
  }

  return Math.round(rate * 100) / 100;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateExpenseAmounts(
  amountBeforeTax: number,
  gstApplicable: boolean,
  gstRate: number,
) {
  if (!gstApplicable || gstRate <= 0) {
    return {
      cgstAmount: 0,
      sgstAmount: 0,
      totalAmount: amountBeforeTax,
    };
  }

  const totalGst = roundMoney(
    amountBeforeTax * (gstRate / 100),
  );

  const cgstAmount = roundMoney(totalGst / 2);
  const sgstAmount = roundMoney(
    totalGst - cgstAmount,
  );

  return {
    cgstAmount,
    sgstAmount,
    totalAmount: roundMoney(
      amountBeforeTax + totalGst,
    ),
  };
}

function isPayrollGeneratedExpense(expense: {
  expenseNumber: string;
  category: $Enums.ExpenseCategory;
  invoiceNumber: string | null;
}) {
  return (
    expense.category === "SALARY" &&
    Boolean(expense.invoiceNumber) &&
    expense.expenseNumber ===
      `EXP-${expense.invoiceNumber}`
  );
}

function expenseAuditData(expense: {
  expenseNumber: string;
  category: $Enums.ExpenseCategory;
  title: string;
  vendorName: string | null;
  expenseDate: Date;
  amountBeforeTax: {
    toString(): string;
  };
  gstApplicable: boolean;
  gstRate: {
    toString(): string;
  } | null;
  cgstAmount: {
    toString(): string;
  };
  sgstAmount: {
    toString(): string;
  };
  totalAmount: {
    toString(): string;
  };
  paymentMethod: $Enums.PaymentMethod;
  transactionReference: string | null;
  invoiceNumber: string | null;
  invoiceFileUrl: string | null;
  notes: string | null;
}) {
  return {
    expenseNumber: expense.expenseNumber,
    category: expense.category,
    title: expense.title,
    vendorName: expense.vendorName,
    expenseDate:
      expense.expenseDate.toISOString(),
    amountBeforeTax:
      expense.amountBeforeTax.toString(),
    gstApplicable:
      expense.gstApplicable,
    gstRate:
      expense.gstRate?.toString() ?? null,
    cgstAmount:
      expense.cgstAmount.toString(),
    sgstAmount:
      expense.sgstAmount.toString(),
    totalAmount:
      expense.totalAmount.toString(),
    paymentMethod:
      expense.paymentMethod,
    transactionReference:
      expense.transactionReference,
    invoiceNumber:
      expense.invoiceNumber,
    invoiceFileUrl:
      expense.invoiceFileUrl,
    notes: expense.notes,
  };
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await context.params;

    const expense =
      await prisma.expense.findUnique({
        where: {
          id,
        },
      });

    if (!expense) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense record not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      expense,
    });
  } catch (error) {
    console.error(
      "Unable to load expense record:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load this expense record.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    const { id } = await context.params;

    const existingExpense =
      await prisma.expense.findUnique({
        where: {
          id,
        },
      });

    if (!existingExpense) {
      return NextResponse.json(
        {
          success: false,
          message: "Expense record not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      isPayrollGeneratedExpense(
        existingExpense,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This salary expense was created from a paid payroll and is locked for audit accuracy. Manage its details from Staff Payroll.",
        },
        {
          status: 409,
        },
      );
    }

    const body =
      (await request.json()) as UpdateExpenseBody;

    const requestedCategory = cleanText(
      body.category,
    ).toUpperCase();

    const requestedPaymentMethod =
      cleanText(
        body.paymentMethod,
      ).toUpperCase();

    const title = cleanText(body.title);
    const vendorName = cleanOptionalText(
      body.vendorName,
    );
    const expenseDate = parseDate(
      body.expenseDate,
    );
    const amountBeforeTax = parseAmount(
      body.amountBeforeTax,
    );
    const gstApplicable = parseBoolean(
      body.gstApplicable,
    );
    const gstRate = gstApplicable
      ? parseGstRate(body.gstRate)
      : 0;

    if (
      !isExpenseCategory(
        requestedCategory,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid expense category.",
        },
        {
          status: 400,
        },
      );
    }

    if (title.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a clear expense title.",
        },
        {
          status: 400,
        },
      );
    }

    if (!expenseDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid expense date.",
        },
        {
          status: 400,
        },
      );
    }

    if (!amountBeforeTax) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid expense amount.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      gstApplicable &&
      (gstRate === null || gstRate <= 0)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid GST rate.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isPaymentMethod(
        requestedPaymentMethod,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid payment method.",
        },
        {
          status: 400,
        },
      );
    }

    const invoiceNumber =
      cleanOptionalText(body.invoiceNumber);

    if (invoiceNumber && vendorName) {
      const duplicateInvoice =
        await prisma.expense.findFirst({
          where: {
            id: {
              not: id,
            },

            vendorName: {
              equals: vendorName,
              mode: "insensitive",
            },

            invoiceNumber: {
              equals: invoiceNumber,
              mode: "insensitive",
            },
          },

          select: {
            id: true,
            expenseNumber: true,
            title: true,
          },
        });

      if (duplicateInvoice) {
        return NextResponse.json(
          {
            success: false,
            message: `This vendor invoice is already recorded as ${duplicateInvoice.expenseNumber}.`,
            existingExpense:
              duplicateInvoice,
          },
          {
            status: 409,
          },
        );
      }
    }

    const amounts =
      calculateExpenseAmounts(
        amountBeforeTax,
        gstApplicable,
        gstRate ?? 0,
      );

    const expense =
      await prisma.$transaction(
        async (transaction) => {
          const updatedExpense =
            await transaction.expense.update({
              where: {
                id,
              },

              data: {
                category:
                  requestedCategory,
                title,
                vendorName,
                expenseDate,
                amountBeforeTax,
                gstApplicable,
                gstRate: gstApplicable
                  ? gstRate
                  : null,
                cgstAmount:
                  amounts.cgstAmount,
                sgstAmount:
                  amounts.sgstAmount,
                totalAmount:
                  amounts.totalAmount,
                paymentMethod:
                  requestedPaymentMethod,
                transactionReference:
                  cleanOptionalText(
                    body.transactionReference,
                  ),
                invoiceNumber,
                invoiceFileUrl:
                  cleanOptionalText(
                    body.invoiceFileUrl,
                  ),
                notes: cleanOptionalText(
                  body.notes,
                ),
              },
            });

          await transaction.activityLog.create({
            data: {
              action: "UPDATED",
              entityType: "Expense",
              entityId: updatedExpense.id,
              description: `Expense ${updatedExpense.expenseNumber} updated for ${updatedExpense.title}.`,
              previousData:
                expenseAuditData(
                  existingExpense,
                ),
              newData:
                expenseAuditData(
                  updatedExpense,
                ),
            },
          });

          return updatedExpense;
        },
      );

    return NextResponse.json({
      success: true,
      message: `${expense.expenseNumber} has been updated successfully.`,
      expense,
    });
  } catch (error) {
    console.error(
      "Unable to update expense:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The expense record could not be updated.",
      },
      {
        status: 500,
      },
    );
  }
}
