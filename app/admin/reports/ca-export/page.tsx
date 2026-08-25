import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowLeft,
  Baby,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Download,
  FileText,
  GraduationCap,
  HandCoins,
  IndianRupee,
  ReceiptText,
  ShieldCheck,
  SlidersHorizontal,
  Soup,
  TrendingUp,
  UtensilsCrossed,
  WalletCards,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

type ReportOption = {
  value: string;
  title: string;
  description: string;
  icon: LucideIcon;
  accent: string;
};

type ReportGroup = {
  title: string;
  description: string;
  options: ReportOption[];
};

const reportGroups: ReportGroup[] = [
  {
    title: "School fee reports",
    description:
      "Preschool, admission, annual, pending and late-fee reports.",

    options: [
      {
        value: "total-fees",
        title: "Total Fees Received",
        description:
          "All fee collections recorded during the selected period.",
        icon: CircleDollarSign,
        accent:
          "bg-[#F2E8F7] text-[#5B2A86]",
      },
      {
        value: "preschool-fees",
        title: "Preschool Monthly Fees",
        description:
          "Only monthly preschool-fee collections.",
        icon: GraduationCap,
        accent:
          "bg-blue-50 text-blue-700",
      },
      {
        value: "admission-fees",
        title: "Admission Fees",
        description:
          "Admission-fee collections during the selected period.",
        icon: Baby,
        accent:
          "bg-emerald-50 text-emerald-700",
      },
      {
        value: "annual-fees",
        title: "Annual Fees",
        description:
          "Annual-fee collections during the selected period.",
        icon: CalendarDays,
        accent:
          "bg-amber-50 text-amber-700",
      },
      {
        value: "late-fees",
        title: "Late Fees Collected",
        description:
          "Late-fee amounts collected with school fees.",
        icon: IndianRupee,
        accent:
          "bg-red-50 text-red-700",
      },
      {
        value: "pending-fees",
        title: "Pending Fee Register",
        description:
          "Student payments with an outstanding balance.",
        icon: WalletCards,
        accent:
          "bg-orange-50 text-orange-700",
      },
    ],
  },
  {
    title: "Daycare reports",
    description:
      "Daycare hourly, lunch and evening-snack collections. Breakfast is not included.",

    options: [
      {
        value: "daycare-fees",
        title: "Total Daycare Fees",
        description:
          "Hourly daycare, lunch, snack and combined-plan collections.",
        icon: Baby,
        accent:
          "bg-[#F2E8F7] text-[#5B2A86]",
      },
      {
        value: "daycare-hourly-fees",
        title: "Daycare Hourly Fees",
        description:
          "Only hourly daycare-fee collections.",
        icon: CalendarDays,
        accent:
          "bg-blue-50 text-blue-700",
      },
      {
        value: "daycare-lunch-fees",
        title: "Daycare Lunch Fees",
        description:
          "Only daycare lunch-plan collections.",
        icon: Soup,
        accent:
          "bg-emerald-50 text-emerald-700",
      },
      {
        value: "daycare-snack-fees",
        title: "Evening-Snack Fees",
        description:
          "Only daycare evening-snack collections.",
        icon: UtensilsCrossed,
        accent:
          "bg-amber-50 text-amber-700",
      },
      {
        value: "daycare-combo-fees",
        title: "Lunch + Snack Fees",
        description:
          "Combined daycare lunch and evening-snack plan.",
        icon: UtensilsCrossed,
        accent:
          "bg-orange-50 text-orange-700",
      },
    ],
  },
  {
    title: "Accounts and CA reports",
    description:
      "GST, expense, income and receipt-register documents.",

    options: [
      {
        value: "gst-summary",
        title: "GST Summary",
        description:
          "Output GST from fees, input GST from expenses and net GST position.",
        icon: ShieldCheck,
        accent:
          "bg-blue-50 text-blue-700",
      },
      {
        value: "expenses",
        title: "Expense Register",
        description:
          "Centre expenses with vendor, invoice and GST details.",
        icon: HandCoins,
        accent:
          "bg-red-50 text-red-700",
      },
      {
        value: "net-income",
        title: "Income & Expense",
        description:
          "Fee income, expenses, running balance and net position.",
        icon: TrendingUp,
        accent:
          "bg-emerald-50 text-emerald-700",
      },
      {
        value: "receipt-register",
        title: "Fee Receipt Register",
        description:
          "Issued, cancelled and refunded fee-receipt records.",
        icon: ReceiptText,
        accent:
          "bg-[#F2E8F7] text-[#5B2A86]",
      },
    ],
  },
  {
    title: "Centre operation reports",
    description:
      "Download student, admission, enquiry, attendance, staff, leave, extra-duty and payroll registers.",

    options: [
      {
        value: "student-register",
        title: "Student Register",
        description:
          "Student profiles, programmes, guardians and joining information.",
        icon: GraduationCap,
        accent:
          "bg-[#F2E8F7] text-[#5B2A86]",
      },
      {
        value: "admission-register",
        title: "Admission Register",
        description:
          "Admission applications, programme and document status.",
        icon: Baby,
        accent:
          "bg-emerald-50 text-emerald-700",
      },
      {
        value: "enquiry-register",
        title: "Enquiry Register",
        description:
          "Parent enquiries, status, source and next follow-up.",
        icon: FileText,
        accent:
          "bg-blue-50 text-blue-700",
      },
      {
        value: "attendance-register",
        title: "Attendance Register",
        description:
          "Student attendance, check-in, check-out and status.",
        icon: CalendarDays,
        accent:
          "bg-amber-50 text-amber-700",
      },
      {
        value: "staff-register",
        title: "Staff Register",
        description:
          "Staff contact, employment status, joining date and salary.",
        icon: ShieldCheck,
        accent:
          "bg-red-50 text-red-700",
      },
      {
        value: "staff-attendance-register",
        title: "Staff Attendance Register",
        description:
          "Daily staff status, timings, leave links and sandwich days.",
        icon: CalendarDays,
        accent:
          "bg-sky-50 text-sky-700",
      },
      {
        value: "staff-leave-register",
        title: "Staff Leave Register",
        description:
          "Paid leave, unpaid leave, sandwich days and approval history.",
        icon: FileText,
        accent:
          "bg-orange-50 text-orange-700",
      },
      {
        value: "staff-extra-duty-register",
        title: "Staff Extra-Duty Register",
        description:
          "Cover duties, hours, hourly pay, approval and payroll linkage.",
        icon: HandCoins,
        accent:
          "bg-violet-50 text-violet-700",
      },
      {
        value: "payroll-register",
        title: "Staff Payroll Register",
        description:
          "Month-wise salary, deductions, extra-duty pay and payment details.",
        icon: WalletCards,
        accent:
          "bg-emerald-50 text-emerald-700",
      },
    ],
  },
];


const feeCategories = [
  {
    value: "",
    label: "All fee categories",
  },
  {
    value: "ADMISSION_FEE",
    label: "Admission Fee",
  },
  {
    value: "ANNUAL_FEE",
    label: "Annual Fee",
  },
  {
    value:
      "MONTHLY_PRESCHOOL_FEE",
    label: "Monthly Preschool Fee",
  },
  {
    value: "DAYCARE_FEE",
    label: "Daycare Hourly Fee",
  },
  {
    value: "DAYCARE_LUNCH_FEE",
    label: "Daycare Lunch Fee",
  },
  {
    value:
      "DAYCARE_EVENING_SNACK_FEE",
    label:
      "Daycare Evening-Snack Fee",
  },
  {
    value:
      "DAYCARE_MEAL_COMBO_FEE",
    label:
      "Daycare Lunch + Snack Fee",
  },
  {
    value: "FOOD_FEE",
    label: "Other Food Fee",
  },
  {
    value: "LATE_FEE",
    label: "Late Fee",
  },
  {
    value: "ACTIVITY_FEE",
    label: "Activity Fee",
  },
  {
    value: "KIT_FEE",
    label: "Kit Fee",
  },
  {
    value: "OTHER",
    label: "Other Fee",
  },
];

const expenseCategories = [
  {
    value: "",
    label: "All expense categories",
  },
  {
    value: "RENT",
    label: "Rent",
  },
  {
    value: "GST",
    label: "GST Payment",
  },
  {
    value: "SALARY",
    label: "Salary",
  },
  {
    value: "ELECTRICITY",
    label: "Electricity",
  },
  {
    value: "FOOD",
    label: "Food",
  },
  {
    value: "SECURITY",
    label: "Security",
  },
  {
    value: "MAINTENANCE",
    label: "Maintenance",
  },
  {
    value: "MARKETING",
    label: "Marketing",
  },
  {
    value: "STATIONERY",
    label: "Stationery",
  },
  {
    value: "ACTIVITIES",
    label: "Activities",
  },
  {
    value: "TRANSPORT",
    label: "Transport",
  },
  {
    value: "PROFESSIONAL_FEES",
    label: "Professional Fees",
  },
  {
    value: "SOFTWARE",
    label: "Software",
  },
  {
    value: "EQUIPMENT",
    label: "Equipment",
  },
  {
    value: "OTHER",
    label: "Other Expense",
  },
];

export default async function CaExportPage() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <header className="overflow-hidden rounded-[30px] bg-[#2D1736] text-white shadow-[0_24px_70px_rgba(45,23,54,0.2)]">
          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10 lg:py-10">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#F6C84B]">
                  <FileText
                    aria-hidden="true"
                    size={23}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B]">
                    Accounts & compliance
                  </p>

                  <p className="mt-1 text-sm font-bold text-white/60">
                    Premium PDF report centre
                  </p>
                </div>
              </div>

              <h1 className="mt-6 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                CA Export Centre
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                Select exactly which report
                you need, apply the required
                period and filters, then
                download a professional
                PDF ready to print, save or
                send to your accountant.
              </p>
            </div>

            <Link
              href="/admin/reports"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              <ArrowLeft
                aria-hidden="true"
                size={18}
              />
              Back to Reports
            </Link>
          </div>
        </header>

        <form
          action="/api/admin/reports/ca-export"
          method="get"
          target="_blank"
          className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_360px]"
        >
          <div className="space-y-7">
            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-6 shadow-[0_18px_55px_rgba(45,23,54,0.07)] sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
                  <FileText
                    aria-hidden="true"
                    size={20}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                    Step 1
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                    Choose your report
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                    Select one report type.
                    Every report uses live
                    CentreOS data.
                  </p>
                </div>
              </div>

              <div className="mt-7 space-y-8">
                {reportGroups.map(
                  (group) => (
                    <div key={group.title}>
                      <div>
                        <h3 className="text-lg font-black text-[#35243E]">
                          {group.title}
                        </h3>

                        <p className="mt-1 text-sm font-semibold text-[#817684]">
                          {
                            group.description
                          }
                        </p>
                      </div>

                      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {group.options.map(
                          (option) => (
                            <ReportOptionCard
                              key={
                                option.value
                              }
                              option={option}
                              defaultChecked={
                                option.value ===
                                "total-fees"
                              }
                            />
                          ),
                        )}
                      </div>
                    </div>
                  ),
                )}
              </div>
            </section>

            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-6 shadow-[0_18px_55px_rgba(45,23,54,0.07)] sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                  <CalendarDays
                    aria-hidden="true"
                    size={20}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-blue-700">
                    Step 2
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                    Select the reporting period
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                    Use a quick period or enter
                    exact dates.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-3">
                <Field
                  label="Quick period"
                  description="Used when custom dates are empty."
                >
                  <select
                    name="range"
                    defaultValue="month"
                    className={inputClassName}
                  >
                    <option value="month">
                      This Month
                    </option>

                    <option value="quarter">
                      This Quarter
                    </option>

                    <option value="year">
                      This Year
                    </option>

                    <option value="all">
                      All Time
                    </option>
                  </select>
                </Field>

                <Field
                  label="Starting date"
                  description="Optional custom start date."
                >
                  <input
                    type="date"
                    name="from"
                    className={inputClassName}
                  />
                </Field>

                <Field
                  label="Ending date"
                  description="Optional custom end date."
                >
                  <input
                    type="date"
                    name="to"
                    className={inputClassName}
                  />
                </Field>
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                <p className="text-xs font-bold leading-5 text-blue-800">
                  If you enter a starting or
                  ending date, the custom dates
                  will automatically replace
                  the quick-period selection.
                </p>
              </div>
            </section>

            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-6 shadow-[0_18px_55px_rgba(45,23,54,0.07)] sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <SlidersHorizontal
                    aria-hidden="true"
                    size={20}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-amber-700">
                    Step 3
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                    Optional filters
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                    Leave a filter on &quot;All&quot; when
                    you want the complete report.
                  </p>
                </div>
              </div>

              <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Field
                  label="Download format"
                  description="PDF for printing, Excel or CSV for analysis."
                >
                  <select
                    name="format"
                    defaultValue="PDF"
                    className={inputClassName}
                  >
                    <option value="PDF">PDF</option>
                    <option value="EXCEL">Excel</option>
                    <option value="CSV">CSV</option>
                  </select>
                </Field>
                <Field
                  label="Payment status"
                  description="Used for fee and receipt reports."
                >
                  <select
                    name="paymentStatus"
                    defaultValue=""
                    className={inputClassName}
                  >
                    <option value="">
                      All received statuses
                    </option>

                    <option value="PAID">
                      Paid
                    </option>

                    <option value="PARTIALLY_PAID">
                      Partially Paid
                    </option>

                    <option value="PENDING">
                      Pending
                    </option>

                    <option value="CANCELLED">
                      Cancelled
                    </option>

                    <option value="REFUNDED">
                      Refunded
                    </option>
                  </select>
                </Field>

                <Field
                  label="Payment method"
                  description="Used for fee and expense reports."
                >
                  <select
                    name="paymentMethod"
                    defaultValue=""
                    className={inputClassName}
                  >
                    <option value="">
                      All payment methods
                    </option>

                    <option value="CASH">
                      Cash
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="BANK_TRANSFER">
                      Bank Transfer
                    </option>

                    <option value="CARD">
                      Card
                    </option>

                    <option value="CHEQUE">
                      Cheque
                    </option>

                    <option value="OTHER">
                      Other
                    </option>
                  </select>
                </Field>

                <Field
                  label="Fee category"
                  description="Used when a report is not already category-specific."
                >
                  <select
                    name="feeCategory"
                    defaultValue=""
                    className={inputClassName}
                  >
                    {feeCategories.map(
                      (category) => (
                        <option
                          key={
                            category.value ||
                            "all-fees"
                          }
                          value={
                            category.value
                          }
                        >
                          {
                            category.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field
                  label="Expense category"
                  description="Used for expense, GST and income reports."
                >
                  <select
                    name="expenseCategory"
                    defaultValue=""
                    className={inputClassName}
                  >
                    {expenseCategories.map(
                      (category) => (
                        <option
                          key={
                            category.value ||
                            "all-expenses"
                          }
                          value={
                            category.value
                          }
                        >
                          {
                            category.label
                          }
                        </option>
                      ),
                    )}
                  </select>
                </Field>

                <Field
                  label="Receipt status"
                  description="Used only for the receipt register."
                >
                  <select
                    name="receiptStatus"
                    defaultValue=""
                    className={inputClassName}
                  >
                    <option value="">
                      All receipt statuses
                    </option>

                    <option value="ISSUED">
                      Issued
                    </option>

                    <option value="CANCELLED">
                      Cancelled
                    </option>

                    <option value="REFUNDED">
                      Refunded
                    </option>
                  </select>
                </Field>
              </div>
            </section>
          </div>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[28px] bg-[#2D1736] p-6 text-white shadow-[0_20px_60px_rgba(45,23,54,0.18)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#F6C84B]">
                <Download
                  aria-hidden="true"
                  size={22}
                />
              </span>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.14em] text-[#F6C84B]">
                Final step
              </p>

              <h2 className="mt-2 text-2xl font-black">
                Generate your report
              </h2>

              <p className="mt-3 text-sm font-semibold leading-6 text-white/65">
                CentreOS will calculate the
                report from your saved records
                and download it in your selected format.
              </p>

              <button
                type="submit"
                className="mt-7 inline-flex min-h-13 w-full items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] shadow-[0_12px_30px_rgba(246,200,75,0.2)] transition hover:-translate-y-0.5 hover:bg-[#FFD968]"
              >
                <Download
                  aria-hidden="true"
                  size={19}
                />
                Download Report
              </button>

              <p className="mt-4 text-center text-xs font-semibold leading-5 text-white/45">
                The report opens or downloads in a
                separate browser tab.
              </p>
            </section>

            <section className="rounded-[26px] border border-[#E3D7E8] bg-[#F8F3FA] p-5">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-sm">
                  <ShieldCheck
                    aria-hidden="true"
                    size={19}
                  />
                </span>

                <div>
                  <h3 className="text-base font-black text-[#2D1736]">
                    Included in every PDF
                  </h3>

                  <div className="mt-4 space-y-3">
                    <Benefit text="Editable school and centre information" />
                    <Benefit text="Selected reporting period" />
                    <Benefit text="Automatic totals and GST summary" />
                    <Benefit text="Detailed transaction table" />
                    <Benefit text="Generation date and page numbers" />
                    <Benefit text="Professional Kidzee styling" />
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[26px] border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-emerald-700"
                  size={20}
                />

                <div>
                  <h3 className="text-sm font-black text-emerald-900">
                    Daycare meal rule
                  </h3>

                  <p className="mt-2 text-xs font-semibold leading-5 text-emerald-800">
                    Daycare reports contain
                    lunch, evening snack and
                    combined plans only.
                    Breakfast is not included.
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-[26px] border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <CreditCard
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-amber-700"
                  size={20}
                />

                <div>
                  <h3 className="text-sm font-black text-amber-900">
                    Accounting note
                  </h3>

                  <p className="mt-2 text-xs font-semibold leading-5 text-amber-800">
                    GST reports show output GST,
                    input GST and the net
                    position. Final statutory
                    filing should still be
                    reviewed by your CA.
                  </p>
                </div>
              </div>
            </section>
          </aside>
        </form>
      </div>
    </AdminLayout>
  );
}

const inputClassName =
  "min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#35243E] outline-none transition focus:border-[#7A459C] focus:ring-4 focus:ring-[#7A459C]/10";

type ReportOptionCardProps = {
  option: ReportOption;
  defaultChecked: boolean;
};

function ReportOptionCard({
  option,
  defaultChecked,
}: ReportOptionCardProps) {
  const Icon = option.icon;

  return (
    <label className="relative cursor-pointer">
      <input
        type="radio"
        name="report"
        value={option.value}
        defaultChecked={defaultChecked}
        required
        className="peer sr-only"
      />

      <span className="flex h-full min-h-40 flex-col rounded-[22px] border-2 border-[#ECE5EF] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#CDBAD8] hover:shadow-[0_14px_35px_rgba(45,23,54,0.08)] peer-checked:border-[#6A328F] peer-checked:bg-[#FAF7FC] peer-focus-visible:ring-4 peer-focus-visible:ring-[#6A328F]/20">
        <span
          className={[
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            option.accent,
          ].join(" ")}
        >
          <Icon
            aria-hidden="true"
            size={20}
          />
        </span>

        <span className="mt-4 block text-sm font-black text-[#2D1736]">
          {option.title}
        </span>

        <span className="mt-2 block text-xs font-semibold leading-5 text-[#817684]">
          {option.description}
        </span>
      </span>
    </label>
  );
}

type FieldProps = {
  label: string;
  description: string;
  children: React.ReactNode;
};

function Field({
  label,
  description,
  children,
}: FieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#35243E]">
        {label}
      </span>

      <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
        {description}
      </span>

      <span className="mt-3 block">
        {children}
      </span>
    </label>
  );
}

function Benefit({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2
        aria-hidden="true"
        className="mt-0.5 shrink-0 text-[#6A328F]"
        size={15}
      />

      <p className="text-xs font-bold leading-5 text-[#625768]">
        {text}
      </p>
    </div>
  );
}
