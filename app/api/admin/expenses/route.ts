import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type CreateExpenseBody = {
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
    rate > 100
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

function createExpenseNumber() {
  const year = new Date().getFullYear();

  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `EXP-${year}-${timestamp}-${randomPart}`;
}

function formatDateForExport(value: Date) {
  return value.toISOString().slice(0, 10);
}

function protectCsvValue(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  const protectedText = /^[=+\-@]/.test(text)
    ? `'${text}`
    : text;

  return `"${protectedText.replaceAll('"', '""')}"`;
}

function createExpenseCsv(
  expenses: Awaited<
    ReturnType<typeof prisma.expense.findMany>
  >,
) {
  const headers = [
    "Expense Number",
    "Expense Date",
    "Category",
    "Title",
    "Vendor",
    "Amount Before Tax",
    "GST Applicable",
    "GST Rate",
    "CGST Amount",
    "SGST Amount",
    "Total Amount",
    "Payment Method",
    "Transaction Reference",
    "Invoice Number",
    "Invoice File URL",
    "Notes",
    "Created At",
    "Updated At",
  ];

  const rows = expenses.map((expense) => [
    expense.expenseNumber,
    formatDateForExport(expense.expenseDate),
    expense.category,
    expense.title,
    expense.vendorName,
    expense.amountBeforeTax.toString(),
    expense.gstApplicable ? "Yes" : "No",
    expense.gstRate?.toString() ?? "",
    expense.cgstAmount.toString(),
    expense.sgstAmount.toString(),
    expense.totalAmount.toString(),
    expense.paymentMethod,
    expense.transactionReference,
    expense.invoiceNumber,
    expense.invoiceFileUrl,
    expense.notes,
    expense.createdAt.toISOString(),
    expense.updatedAt.toISOString(),
  ]);

  return [
    headers.map(protectCsvValue).join(","),
    ...rows.map((row) =>
      row.map(protectCsvValue).join(","),
    ),
  ].join("\r\n");
}

export async function GET(request: Request) {
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

    const url = new URL(request.url);

    const requestedCategory =
      url.searchParams.get("category") ?? "";

    const format =
      url.searchParams.get("format") ?? "";

    const fromDate = parseDate(
      url.searchParams.get("from"),
    );

    const toDate = parseDate(
      url.searchParams.get("to"),
    );

    const category = isExpenseCategory(
      requestedCategory,
    )
      ? requestedCategory
      : null;

    const expenses =
      await prisma.expense.findMany({
        where: {
          ...(category
            ? {
                category,
              }
            : {}),

          ...(fromDate || toDate
            ? {
                expenseDate: {
                  ...(fromDate
                    ? {
                        gte: fromDate,
                      }
                    : {}),

                  ...(toDate
                    ? {
                        lte: new Date(
                          `${toDate
                            .toISOString()
                            .slice(
                              0,
                              10,
                            )}T23:59:59.999Z`,
                        ),
                      }
                    : {}),
                },
              }
            : {}),
        },

        orderBy: [
          {
            expenseDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      });

    if (format.toLowerCase() === "csv") {
      const csv =
        createExpenseCsv(expenses);

      return new NextResponse(`\uFEFF${csv}`, {
        status: 200,
        headers: {
          "Content-Type":
            "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="kidzee-expense-register.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    const totalAmount = expenses.reduce(
      (total, expense) =>
        total + Number(expense.totalAmount),
      0,
    );

    const totalBeforeTax = expenses.reduce(
      (total, expense) =>
        total +
        Number(expense.amountBeforeTax),
      0,
    );

    const totalGst = expenses.reduce(
      (total, expense) =>
        total +
        Number(expense.cgstAmount) +
        Number(expense.sgstAmount),
      0,
    );

    return NextResponse.json({
      success: true,
      expenses,
      summary: {
        recordCount: expenses.length,
        totalBeforeTax: roundMoney(
          totalBeforeTax,
        ),
        totalGst: roundMoney(totalGst),
        totalAmount: roundMoney(totalAmount),
      },
    });
  } catch (error) {
    console.error(
      "Unable to load expenses:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the expense register.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
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

    const body =
      (await request.json()) as CreateExpenseBody;

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
          const createdExpense =
            await transaction.expense.create({
              data: {
                expenseNumber:
                  createExpenseNumber(),
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
              action: "CREATED",
              entityType: "Expense",
              entityId: createdExpense.id,
              description: `Expense ${createdExpense.expenseNumber} created for ${createdExpense.title}.`,
              newData: {
                expenseNumber:
                  createdExpense.expenseNumber,
                title:
                  createdExpense.title,
                category:
                  createdExpense.category,
                totalAmount:
                  createdExpense.totalAmount.toString(),
                paymentMethod:
                  createdExpense.paymentMethod,
              },
            },
          });

          return createdExpense;
        },
      );

    return NextResponse.json(
      {
        success: true,
        message: `${expense.expenseNumber} has been added to the expense register.`,
        expense,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Unable to create expense:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The expense could not be saved.",
      },
      {
        status: 500,
      },
    );
  }
}