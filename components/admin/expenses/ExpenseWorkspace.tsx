"use client";

import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileText,
  HandCoins,
  IndianRupee,
  LoaderCircle,
  ReceiptText,
  Save,
  Search,
  ShieldCheck,
  WalletCards,
  X,
} from "lucide-react";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

type ExpenseCategory =
  | "RENT"
  | "GST"
  | "SALARY"
  | "ELECTRICITY"
  | "FOOD"
  | "SECURITY"
  | "MAINTENANCE"
  | "MARKETING"
  | "STATIONERY"
  | "ACTIVITIES"
  | "TRANSPORT"
  | "PROFESSIONAL_FEES"
  | "SOFTWARE"
  | "EQUIPMENT"
  | "OTHER";

type PaymentMethod =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "CARD"
  | "CHEQUE"
  | "OTHER";

export type ExpenseWorkspaceRecord = {
  id: string;
  expenseNumber: string;
  category: ExpenseCategory;
  title: string;
  vendorName: string | null;
  expenseDate: string;
  amountBeforeTax: string;
  gstApplicable: boolean;
  gstRate: string | null;
  cgstAmount: string;
  sgstAmount: string;
  totalAmount: string;
  paymentMethod: PaymentMethod;
  transactionReference: string | null;
  invoiceNumber: string | null;
  invoiceFileUrl: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type ExpenseWorkspaceProps = {
  initialExpenses: ExpenseWorkspaceRecord[];
};

type ExpenseFormData = {
  category: ExpenseCategory;
  title: string;
  vendorName: string;
  expenseDate: string;
  amountBeforeTax: string;
  gstApplicable: boolean;
  gstRate: string;
  paymentMethod: PaymentMethod;
  transactionReference: string;
  invoiceNumber: string;
  invoiceFileUrl: string;
  notes: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  expense?: ExpenseWorkspaceRecord;
};

const today = new Date()
  .toISOString()
  .slice(0, 10);

const currentMonth = new Date()
  .toISOString()
  .slice(0, 7);

const emptyFormData: ExpenseFormData = {
  category: "OTHER",
  title: "",
  vendorName: "",
  expenseDate: today,
  amountBeforeTax: "",
  gstApplicable: false,
  gstRate: "18",
  paymentMethod: "UPI",
  transactionReference: "",
  invoiceNumber: "",
  invoiceFileUrl: "",
  notes: "",
};

const categoryOptions: Array<{
  value: ExpenseCategory;
  label: string;
}> = [
  { value: "RENT", label: "Rent" },
  { value: "GST", label: "GST Payment" },
  { value: "SALARY", label: "Salary" },
  {
    value: "ELECTRICITY",
    label: "Electricity",
  },
  { value: "FOOD", label: "Food" },
  { value: "SECURITY", label: "Security" },
  {
    value: "MAINTENANCE",
    label: "Maintenance",
  },
  { value: "MARKETING", label: "Marketing" },
  {
    value: "STATIONERY",
    label: "Stationery",
  },
  { value: "ACTIVITIES", label: "Activities" },
  { value: "TRANSPORT", label: "Transport" },
  {
    value: "PROFESSIONAL_FEES",
    label: "Professional Fees",
  },
  { value: "SOFTWARE", label: "Software" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "OTHER", label: "Other" },
];

const paymentMethodOptions: Array<{
  value: PaymentMethod;
  label: string;
}> = [
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  {
    value: "BANK_TRANSFER",
    label: "Bank Transfer",
  },
  { value: "CARD", label: "Card" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "OTHER", label: "Other" },
];

const categoryLabels = Object.fromEntries(
  categoryOptions.map((option) => [
    option.value,
    option.label,
  ]),
) as Record<ExpenseCategory, string>;

const paymentMethodLabels = Object.fromEntries(
  paymentMethodOptions.map((option) => [
    option.value,
    option.label,
  ]),
) as Record<PaymentMethod, string>;

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateAmounts(
  amountText: string,
  gstApplicable: boolean,
  gstRateText: string,
) {
  const amount = Number(amountText);
  const rate = Number(gstRateText);

  const amountBeforeTax =
    Number.isFinite(amount) && amount > 0
      ? amount
      : 0;

  const gstRate =
    gstApplicable &&
    Number.isFinite(rate) &&
    rate > 0
      ? rate
      : 0;

  const totalGst = roundMoney(
    amountBeforeTax * (gstRate / 100),
  );

  const cgstAmount = roundMoney(totalGst / 2);
  const sgstAmount = roundMoney(
    totalGst - cgstAmount,
  );

  return {
    amountBeforeTax,
    cgstAmount,
    sgstAmount,
    totalGst,
    totalAmount: roundMoney(
      amountBeforeTax + totalGst,
    ),
  };
}

function formatCurrency(value: number | string) {
  const amount = Number(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(
    Number.isFinite(amount) ? amount : 0,
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatDateInput(value: string) {
  return value.slice(0, 10);
}

function formDataFromExpense(
  expense: ExpenseWorkspaceRecord,
): ExpenseFormData {
  return {
    category: expense.category,
    title: expense.title,
    vendorName:
      expense.vendorName ?? "",
    expenseDate: formatDateInput(
      expense.expenseDate,
    ),
    amountBeforeTax:
      expense.amountBeforeTax,
    gstApplicable:
      expense.gstApplicable,
    gstRate:
      expense.gstRate ?? "18",
    paymentMethod:
      expense.paymentMethod,
    transactionReference:
      expense.transactionReference ?? "",
    invoiceNumber:
      expense.invoiceNumber ?? "",
    invoiceFileUrl:
      expense.invoiceFileUrl ?? "",
    notes: expense.notes ?? "",
  };
}

function isPayrollGeneratedExpense(
  expense: ExpenseWorkspaceRecord,
) {
  return (
    expense.category === "SALARY" &&
    Boolean(expense.invoiceNumber) &&
    expense.expenseNumber ===
      `EXP-${expense.invoiceNumber}`
  );
}

export default function ExpenseWorkspace({
  initialExpenses,
}: ExpenseWorkspaceProps) {
  const [expenses, setExpenses] =
    useState(initialExpenses);

  const [searchQuery, setSearchQuery] =
    useState("");

  const [categoryFilter, setCategoryFilter] =
    useState<"ALL" | ExpenseCategory>("ALL");

  const [monthFilter, setMonthFilter] =
    useState("");

  const [panelOpen, setPanelOpen] =
    useState(false);

  const [editingExpenseId, setEditingExpenseId] =
    useState<string | null>(null);

  const [formData, setFormData] =
    useState<ExpenseFormData>(emptyFormData);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    if (!panelOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [panelOpen]);

  const formAmounts = useMemo(
    () =>
      calculateAmounts(
        formData.amountBeforeTax,
        formData.gstApplicable,
        formData.gstRate,
      ),
    [
      formData.amountBeforeTax,
      formData.gstApplicable,
      formData.gstRate,
    ],
  );

  const visibleExpenses = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return expenses.filter((expense) => {
      if (
        categoryFilter !== "ALL" &&
        expense.category !== categoryFilter
      ) {
        return false;
      }

      if (
        monthFilter &&
        !expense.expenseDate.startsWith(
          monthFilter,
        )
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        expense.expenseNumber,
        expense.title,
        expense.vendorName,
        expense.invoiceNumber,
        expense.transactionReference,
        categoryLabels[expense.category],
        paymentMethodLabels[
          expense.paymentMethod
        ],
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [
    categoryFilter,
    expenses,
    monthFilter,
    searchQuery,
  ]);

  const summary = useMemo(() => {
    const totalExpenses = expenses.reduce(
      (total, expense) =>
        total + Number(expense.totalAmount),
      0,
    );

    const thisMonthTotal = expenses
      .filter((expense) =>
        expense.expenseDate.startsWith(
          currentMonth,
        ),
      )
      .reduce(
        (total, expense) =>
          total + Number(expense.totalAmount),
        0,
      );

    const totalGst = expenses.reduce(
      (total, expense) =>
        total +
        Number(expense.cgstAmount) +
        Number(expense.sgstAmount),
      0,
    );

    return {
      recordCount: expenses.length,
      totalExpenses,
      thisMonthTotal,
      totalGst,
    };
  }, [expenses]);

  function updateField<
    K extends keyof ExpenseFormData,
  >(
    field: K,
    value: ExpenseFormData[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function openCreatePanel() {
    setEditingExpenseId(null);
    setFormData({
      ...emptyFormData,
      expenseDate: new Date()
        .toISOString()
        .slice(0, 10),
    });
    setError("");
    setSuccessMessage("");
    setPanelOpen(true);
  }

  function openEditPanel(
    expense: ExpenseWorkspaceRecord,
  ) {
    setEditingExpenseId(expense.id);
    setFormData(
      formDataFromExpense(expense),
    );
    setError("");
    setSuccessMessage("");
    setPanelOpen(true);
  }

  function closePanel() {
    if (submitting) {
      return;
    }

    setPanelOpen(false);
    setEditingExpenseId(null);
    setError("");
    setSuccessMessage("");
  }

  function clearFilters() {
    setSearchQuery("");
    setCategoryFilter("ALL");
    setMonthFilter("");
  }

  function validateForm() {
    if (formData.title.trim().length < 2) {
      return "Please enter a clear expense title.";
    }

    if (!formData.expenseDate) {
      return "Please enter the expense date.";
    }

    const amount = Number(
      formData.amountBeforeTax,
    );

    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return "Please enter a valid expense amount.";
    }

    const gstRate = Number(formData.gstRate);

if (
  formData.gstApplicable &&
  (!Number.isFinite(gstRate) ||
    gstRate <= 0 ||
    gstRate > 100)
) {
  return "Enter a GST rate between 0.01% and 100%.";
}

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        editingExpenseId
          ? `/api/admin/expenses/${editingExpenseId}`
          : "/api/admin/expenses",
        {
          method: editingExpenseId
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const result =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.expense
      ) {
        throw new Error(
          result.message ??
            "The expense could not be saved.",
        );
      }

      const savedExpense = result.expense;

      if (editingExpenseId) {
        setExpenses((current) =>
          current.map((expense) =>
            expense.id === savedExpense.id
              ? savedExpense
              : expense,
          ),
        );
      } else {
        setExpenses((current) => [
          savedExpense,
          ...current,
        ]);
      }

      setSuccessMessage(
        result.message ??
          "Expense saved successfully.",
      );

      setEditingExpenseId(savedExpense.id);
      setFormData(
        formDataFromExpense(savedExpense),
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The expense could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Expenses"
            value={formatCurrency(
              summary.totalExpenses,
            )}
            description="Complete expense register"
            icon={WalletCards}
            colour="bg-[#F3EAF8] text-[#5B2A86]"
          />

          <SummaryCard
            label="This Month"
            value={formatCurrency(
              summary.thisMonthTotal,
            )}
            description="Current month spending"
            icon={CalendarDays}
            colour="bg-blue-50 text-blue-700"
          />

          <SummaryCard
            label="GST Recorded"
            value={formatCurrency(
              summary.totalGst,
            )}
            description="CGST and SGST combined"
            icon={ShieldCheck}
            colour="bg-amber-50 text-amber-700"
          />

          <SummaryCard
            label="Expense Entries"
            value={summary.recordCount.toString()}
            description="Saved expense records"
            icon={ReceiptText}
            colour="bg-green-50 text-green-700"
          />
        </div>

        <div className="rounded-[30px] border border-[#E8E0EB] bg-white p-5 shadow-[0_20px_60px_rgba(45,23,54,0.08)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                Accounts register
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                Centre expenses
              </h2>

              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#817684]">
                Record every payment, calculate GST
                automatically and maintain invoice
                references for accounts review.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              {/* This API endpoint returns a CSV download, not an app page. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/api/admin/expenses?format=csv"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DED3E3] bg-white px-5 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA]"
              >
                <Download
                  aria-hidden="true"
                  size={18}
                />
                Export All Expenses
              </a>

              <button
                type="button"
                onClick={openCreatePanel}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)] transition hover:-translate-y-0.5 hover:bg-[#4B206F]"
              >
                <HandCoins
                  aria-hidden="true"
                  size={18}
                />
                Add Expense
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_220px_190px_auto]">
            <label className="relative block">
              <span className="sr-only">
                Search expenses
              </span>

              <Search
                aria-hidden="true"
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8D8291]"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                placeholder="Search title, vendor, invoice or expense number"
                className="min-h-12 w-full rounded-2xl border border-[#DDD2E2] bg-[#FAF8FC] pl-12 pr-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#9D939F] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
              />
            </label>

            <label className="block">
              <span className="sr-only">
                Filter by category
              </span>

              <select
                value={categoryFilter}
                onChange={(event) =>
                  setCategoryFilter(
                    event.target.value as
                      | "ALL"
                      | ExpenseCategory,
                  )
                }
                className="min-h-12 w-full rounded-2xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5A4F5F] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
              >
                <option value="ALL">
                  All Categories
                </option>

                {categoryOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block">
              <span className="sr-only">
                Filter by month
              </span>

              <input
                type="month"
                value={monthFilter}
                onChange={(event) =>
                  setMonthFilter(
                    event.target.value,
                  )
                }
                className="min-h-12 w-full rounded-2xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5A4F5F] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
              />
            </label>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DED3E3] bg-white px-5 text-sm font-black text-[#6B6070] transition hover:bg-[#F7F2FA]"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {visibleExpenses.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-[#DCCFE4] bg-white px-6 py-14 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#F3EAF8] text-[#5B2A86]">
              <HandCoins
                aria-hidden="true"
                size={28}
              />
            </span>

            <h3 className="mt-5 text-xl font-black text-[#2D1736]">
              {expenses.length === 0
                ? "No expenses recorded yet"
                : "No matching expenses found"}
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-[#817684]">
              {expenses.length === 0
                ? "Add rent, salary, electricity, food, maintenance and other centre expenses here."
                : "Try a different search, category or month filter."}
            </p>

            {expenses.length === 0 ? (
              <button
                type="button"
                onClick={openCreatePanel}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white"
              >
                <HandCoins
                  aria-hidden="true"
                  size={18}
                />
                Add First Expense
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-5 xl:grid-cols-2">
            {visibleExpenses.map((expense) => (
              <article
                key={expense.id}
                className="overflow-hidden rounded-[28px] border border-[#E8E0EB] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]"
              >
                <div className="bg-[#2D1736] p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFD34E]">
                        {expense.expenseNumber}
                      </p>

                      <h3 className="mt-2 truncate text-xl font-black !text-white">
                        {expense.title}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-white/70">
                        {expense.vendorName ??
                          "No vendor recorded"}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#FFD34E]">
                      {
                        categoryLabels[
                          expense.category
                        ]
                      }
                    </span>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-white/55">
                        Total amount
                      </p>

                      <p className="mt-1 text-2xl font-black">
                        {formatCurrency(
                          expense.totalAmount,
                        )}
                      </p>
                    </div>

                    <p className="text-sm font-bold text-white/70">
                      {formatDate(
                        expense.expenseDate,
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 p-5 sm:grid-cols-2">
                  <DetailItem
                    label="Amount before tax"
                    value={formatCurrency(
                      expense.amountBeforeTax,
                    )}
                  />

                  <DetailItem
                    label="Payment method"
                    value={
                      paymentMethodLabels[
                        expense.paymentMethod
                      ]
                    }
                  />

                  <DetailItem
                    label="GST"
                    value={
                      expense.gstApplicable
                        ? `${expense.gstRate}% · ${formatCurrency(
                            Number(
                              expense.cgstAmount,
                            ) +
                              Number(
                                expense.sgstAmount,
                              ),
                          )}`
                        : "Not applicable"
                    }
                  />

                  <DetailItem
                    label="Invoice number"
                    value={
                      expense.invoiceNumber ??
                      "Not recorded"
                    }
                  />

                  <DetailItem
                    label="Transaction reference"
                    value={
                      expense.transactionReference ??
                      "Not recorded"
                    }
                  />

                  <DetailItem
                    label="Notes"
                    value={
                      expense.notes ??
                      "No notes"
                    }
                  />

                  {expense.invoiceFileUrl ? (
                    <a
                      href={expense.invoiceFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-[#F8F4FA] px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F1E8F6] sm:col-span-2"
                    >
                      <FileText
                        aria-hidden="true"
                        size={17}
                      />
                      Open Invoice Attachment
                    </a>
                  ) : null}

                  {isPayrollGeneratedExpense(
                    expense,
                  ) ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 sm:col-span-2">
                      <div className="flex items-start gap-3">
                        <ShieldCheck
                          aria-hidden="true"
                          size={19}
                          className="mt-0.5 shrink-0 text-emerald-700"
                        />
                        <div>
                          <p className="text-sm font-black text-emerald-900">
                            Managed by Staff Payroll
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-emerald-800/80">
                            This audited salary expense was created
                            automatically when payroll was marked paid and
                            cannot be edited here.
                          </p>
                        </div>
                      </div>
                      <a
                        href="/admin/staff/payroll"
                        className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl bg-white px-4 text-xs font-black text-[#5B2A86] shadow-sm transition hover:bg-[#F8F3FA]"
                      >
                        <WalletCards
                          aria-hidden="true"
                          size={16}
                        />
                        Open Staff Payroll
                      </a>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        openEditPanel(expense)
                      }
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-[#F8F4FA] px-5 text-sm font-black text-[#5B2A86] transition hover:border-[#5B2A86] hover:bg-[#F1E8F6] sm:col-span-2"
                    >
                      <ReceiptText
                        aria-hidden="true"
                        size={18}
                      />
                      Manage Expense
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {panelOpen ? (
        <div className="fixed inset-0 z-[150]">
          <button
            type="button"
            aria-label="Close expense form"
            onClick={closePanel}
            className="absolute inset-0 bg-[#1F1027]/60 backdrop-blur-sm"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={
              editingExpenseId
                ? "Edit expense"
                : "Add expense"
            }
            className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col bg-[#F8F6FA] shadow-[-24px_0_70px_rgba(31,16,39,0.26)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E5DCE9] bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                  Accounts management
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                  {editingExpenseId
                    ? "Edit Expense"
                    : "Add Expense"}
                </h2>

                <p className="mt-1 text-sm font-semibold text-[#817684]">
                  GST totals are calculated
                  automatically.
                </p>
              </div>

              <button
                type="button"
                onClick={closePanel}
                disabled={submitting}
                aria-label="Close expense form"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#E1D7E5] bg-white text-[#685D6C] transition hover:bg-[#F6F1F8] disabled:opacity-50"
              >
                <X
                  aria-hidden="true"
                  size={22}
                />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                <div className="space-y-6">
                  <FormSection
                    title="Expense details"
                    description="Record what was purchased, when and from whom."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-black text-[#35243E]">
                          Category *
                        </span>

                        <select
                          value={formData.category}
                          onChange={(event) =>
                            updateField(
                              "category",
                              event.target
                                .value as ExpenseCategory,
                            )
                          }
                          className={inputClassName}
                        >
                          {categoryOptions.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>

                      <TextField
                        label="Expense date *"
                        type="date"
                        value={
                          formData.expenseDate
                        }
                        onChange={(value) =>
                          updateField(
                            "expenseDate",
                            value,
                          )
                        }
                      />

                      <TextField
                        label="Expense title *"
                        value={formData.title}
                        placeholder="Example: Classroom supplies"
                        onChange={(value) =>
                          updateField(
                            "title",
                            value,
                          )
                        }
                      />

                      <TextField
                        label="Vendor name"
                        value={
                          formData.vendorName
                        }
                        placeholder="Shop or service provider"
                        onChange={(value) =>
                          updateField(
                            "vendorName",
                            value,
                          )
                        }
                      />

                      <TextField
                        label="Amount before tax *"
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={
                          formData.amountBeforeTax
                        }
                        placeholder="0.00"
                        onChange={(value) =>
                          updateField(
                            "amountBeforeTax",
                            value,
                          )
                        }
                      />

                      <label className="block">
                        <span className="text-sm font-black text-[#35243E]">
                          Payment method *
                        </span>

                        <select
                          value={
                            formData.paymentMethod
                          }
                          onChange={(event) =>
                            updateField(
                              "paymentMethod",
                              event.target
                                .value as PaymentMethod,
                            )
                          }
                          className={inputClassName}
                        >
                          {paymentMethodOptions.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </option>
                            ),
                          )}
                        </select>
                      </label>
                    </div>
                  </FormSection>

                  <FormSection
                    title="GST calculation"
                    description="Enable GST only when it appears on the vendor invoice."
                  >
                    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#DED3E3] bg-[#FAF8FC] p-4">
                      <input
                        type="checkbox"
                        checked={
                          formData.gstApplicable
                        }
                        onChange={(event) =>
                          updateField(
                            "gstApplicable",
                            event.target.checked,
                          )
                        }
                        className="mt-1 h-5 w-5 rounded border-[#BFAFC7] accent-[#5B2A86]"
                      />

                      <span>
                        <span className="block text-sm font-black text-[#35243E]">
                          GST applicable
                        </span>

                        <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
                          CGST and SGST will be split
                          equally.
                        </span>
                      </span>
                    </label>

                    {formData.gstApplicable ? (
  <label className="mt-4 block">
    <span className="text-sm font-black text-[#35243E]">
      GST rate *
    </span>

    <input
      type="number"
      inputMode="decimal"
      min="0.01"
      max="100"
      step="0.01"
      list="expense-gst-rate-options"
      value={formData.gstRate}
      onChange={(event) =>
        updateField("gstRate", event.target.value)
      }
      className={inputClassName}
      required
    />

    <datalist id="expense-gst-rate-options">
      <option value="5" />
      <option value="12" />
      <option value="18" />
      <option value="28" />
    </datalist>

    <span className="mt-2 block text-xs font-semibold leading-5 text-[#817684]">
      Enter the GST percentage printed on the vendor invoice.
      Standard rates remain available as suggestions, and any
      future notified rate can be entered.
    </span>
  </label>
) : null}

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <AmountPreview
                        label="Before tax"
                        value={formAmounts.amountBeforeTax}
                      />

                      <AmountPreview
                        label="CGST"
                        value={formAmounts.cgstAmount}
                      />

                      <AmountPreview
                        label="SGST"
                        value={formAmounts.sgstAmount}
                      />

                      <AmountPreview
                        label="Total"
                        value={formAmounts.totalAmount}
                        highlighted
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    title="Payment and invoice"
                    description="References help with reconciliation and CA review."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Transaction reference"
                        value={
                          formData.transactionReference
                        }
                        placeholder="UPI, bank or cheque reference"
                        onChange={(value) =>
                          updateField(
                            "transactionReference",
                            value,
                          )
                        }
                      />

                      <TextField
                        label="Invoice number"
                        value={
                          formData.invoiceNumber
                        }
                        placeholder="Vendor invoice number"
                        onChange={(value) =>
                          updateField(
                            "invoiceNumber",
                            value,
                          )
                        }
                      />

                      <div className="sm:col-span-2">
                        <TextField
                          label="Invoice attachment URL"
                          value={
                            formData.invoiceFileUrl
                          }
                          type="url"
                          placeholder="Optional invoice or receipt link"
                          onChange={(value) =>
                            updateField(
                              "invoiceFileUrl",
                              value,
                            )
                          }
                        />
                      </div>
                    </div>

                    <label className="mt-4 block">
                      <span className="text-sm font-black text-[#35243E]">
                        Internal notes
                      </span>

                      <textarea
                        value={formData.notes}
                        onChange={(event) =>
                          updateField(
                            "notes",
                            event.target.value,
                          )
                        }
                        rows={4}
                        placeholder="Purpose, approval or accounting notes"
                        className={textareaClassName}
                      />
                    </label>
                  </FormSection>

                  {error ? (
                    <div
                      role="alert"
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
                    >
                      {error}
                    </div>
                  ) : null}

                  {successMessage ? (
                    <div
                      role="status"
                      className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        size={19}
                        className="mt-0.5 shrink-0"
                      />

                      {successMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-[#E5DCE9] bg-white px-5 py-4 sm:px-7">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closePanel}
                    disabled={submitting}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DDD2E2] bg-white px-6 text-sm font-black text-[#665A6B] transition hover:bg-[#F7F2FA] disabled:opacity-50"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-7 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)] transition hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle
                          aria-hidden="true"
                          size={18}
                          className="animate-spin"
                        />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save
                          aria-hidden="true"
                          size={18}
                        />
                        {editingExpenseId
                          ? "Save Changes"
                          : "Add Expense"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10";

const textareaClassName =
  "mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10";

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  min?: string;
  step?: string;
  onChange: (value: string) => void;
};

function TextField({
  label,
  value,
  placeholder,
  type = "text",
  min,
  step,
  onChange,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#35243E]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        min={min}
        step={step}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={inputClassName}
      />
    </label>
  );
}

type FormSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 sm:p-6">
      <h3 className="text-lg font-black text-[#2D1736]">
        {title}
      </h3>

      <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
        {description}
      </p>

      <div className="mt-5">{children}</div>
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: string;
  description: string;
  icon: typeof IndianRupee;
  colour: string;
};

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  colour,
}: SummaryCardProps) {
  return (
    <article className="rounded-[26px] border border-[#E8E0EB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)]">
      <span
        className={[
          "flex h-12 w-12 items-center justify-center rounded-2xl",
          colour,
        ].join(" ")}
      >
        <Icon
          aria-hidden="true"
          size={22}
        />
      </span>

      <p className="mt-5 text-sm font-bold text-[#746A78]">
        {label}
      </p>

      <p className="mt-1 break-words text-2xl font-black tracking-[-0.04em] text-[#2D1736]">
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold text-[#928896]">
        {description}
      </p>
    </article>
  );
}

type DetailItemProps = {
  label: string;
  value: string;
};

function DetailItem({
  label,
  value,
}: DetailItemProps) {
  return (
    <div className="rounded-2xl border border-[#EEE7F0] bg-[#FAF8FC] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#918695]">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-bold leading-5 text-[#4E4353]">
        {value}
      </p>
    </div>
  );
}

type AmountPreviewProps = {
  label: string;
  value: number;
  highlighted?: boolean;
};

function AmountPreview({
  label,
  value,
  highlighted,
}: AmountPreviewProps) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        highlighted
          ? "border-[#5B2A86] bg-[#5B2A86] text-white"
          : "border-[#E6DDE9] bg-white",
      ].join(" ")}
    >
      <p
        className={[
          "text-[10px] font-black uppercase tracking-[0.1em]",
          highlighted
            ? "text-white/65"
            : "text-[#918695]",
        ].join(" ")}
      >
        {label}
      </p>

      <p
        className={[
          "mt-1 text-sm font-black",
          highlighted
            ? "text-white"
            : "text-[#2D1736]",
        ].join(" ")}
      >
        {formatCurrency(value)}
      </p>
    </div>
  );
}
