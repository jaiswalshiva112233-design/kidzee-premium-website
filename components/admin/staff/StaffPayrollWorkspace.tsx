"use client";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Calculator,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  FileCheck2,
  Loader2,
  MinusCircle,
  RefreshCw,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserCheck,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type {
  FormEvent,
  ReactNode,
} from "react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type PayrollStatus =
  | "DRAFT"
  | "APPROVED"
  | "PAID"
  | "CANCELLED";

type StaffStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "LEFT";

type PaymentMethod =
  | "CASH"
  | "UPI"
  | "BANK_TRANSFER"
  | "CARD"
  | "CHEQUE"
  | "OTHER";

type PayrollSettings = {
  workingDaysPerMonth: number;
  standardHoursPerDay: number;
  absentDeductionDays: number;
  halfDayDeductionDays: number;
  lateDeductionDays: number;
};

type PayrollSummary = {
  records: number;
  draft: number;
  approved: number;
  paid: number;
  cancelled: number;
  grossEarnings: number;
  deductions: number;
  netPayable: number;
};

type PayrollCalculation = {
  staffId: string;
  payrollMonth: string;
  periodStart: string;
  periodEnd: string;
  staffNumberSnapshot: string;
  staffNameSnapshot: string;
  designationSnapshot: string;
  baseSalary: number;
  workingDaysInMonth: number;
  standardHoursPerDay: number;
  dailyRate: number;
  hourlyRate: number;
  presentDays: number;
  lateDays: number;
  halfDays: number;
  holidayDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  absentDays: number;
  unmarkedDays: number;
  deductionDays: number;
  leaveDeduction: number;
  absenceDeduction: number;
  manualDeduction: number;
  extraDutyHours: number;
  extraDutyAmount: number;
  manualAddition: number;
  grossEarnings: number;
  totalDeductions: number;
  netPayable: number;
  manualAdjustmentNotes: string | null;
  notes: string | null;
  extraDutyIds: string[];
};

type PayrollRecord = {
  id: string;
  payrollNumber: string;
  staffId: string;
  payrollMonth: string;
  periodStart: string;
  periodEnd: string;
  status: PayrollStatus;
  staffNumberSnapshot: string;
  staffNameSnapshot: string;
  designationSnapshot: string;
  baseSalary: string;
  workingDaysInMonth: number;
  standardHoursPerDay: string;
  dailyRate: string;
  hourlyRate: string;
  presentDays: string;
  lateDays: string;
  halfDays: string;
  holidayDays: string;
  paidLeaveDays: string;
  unpaidLeaveDays: string;
  absentDays: string;
  unmarkedDays: string;
  deductionDays: string;
  leaveDeduction: string;
  absenceDeduction: string;
  manualDeduction: string;
  extraDutyHours: string;
  extraDutyAmount: string;
  manualAddition: string;
  grossEarnings: string;
  totalDeductions: string;
  netPayable: string;
  manualAdjustmentNotes: string | null;
  notes: string | null;
  paymentMethod: PaymentMethod | null;
  paymentReference: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    staffNumber: string;
    name: string;
    designation: string;
    status: StaffStatus;
  };
  generatedBy: {
    id: string;
    name: string;
  } | null;
  approvedBy: {
    id: string;
    name: string;
  } | null;
  paidBy: {
    id: string;
    name: string;
  } | null;
  extraDuties: Array<{
    id: string;
    dutyNumber: string;
    dutyDate: string;
    hours: string;
    hourlyRate: string;
    amount: string;
    status: string;
  }>;
};

type PayrollStaff = {
  id: string;
  staffNumber: string;
  name: string;
  designation: string;
  status: StaffStatus;
  joiningDate: string;
  leavingDate: string | null;
  monthlySalary: string | null;
  paidLeaveCycle: string;
  paidLeaveAllowance: string;
  payroll: PayrollRecord | null;
  preview: PayrollCalculation | null;
  previewError: string | null;
};

type PayrollApiResponse = {
  success?: boolean;
  message?: string;
  month?: string;
  settings?: PayrollSettings;
  settingsConfigured?: boolean;
  weeklyOffDays?: number[];
  canApprove?: boolean;
  paymentMethods?: readonly PaymentMethod[];
  staff?: PayrollStaff[];
  payrolls?: PayrollRecord[];
  payroll?: PayrollRecord;
  summary?: PayrollSummary;
};

type StaffPayrollWorkspaceProps = {
  initialMonth: string;
};

type GenerateForm = {
  manualAddition: string;
  manualDeduction: string;
  manualAdjustmentNotes: string;
  notes: string;
};

type PaymentForm = {
  paymentMethod: PaymentMethod;
  paymentReference: string;
  notes: string;
};

type StatusFilter =
  | "ALL"
  | "NOT_GENERATED"
  | PayrollStatus;

const defaultSettings: PayrollSettings = {
  workingDaysPerMonth: 26,
  standardHoursPerDay: 8,
  absentDeductionDays: 1,
  halfDayDeductionDays: 0.5,
  lateDeductionDays: 0,
};

const defaultPaymentMethods = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
] as const satisfies readonly PaymentMethod[];

const emptySummary: PayrollSummary = {
  records: 0,
  draft: 0,
  approved: 0,
  paid: 0,
  cancelled: 0,
  grossEarnings: 0,
  deductions: 0,
  netPayable: 0,
};

const statusLabels: Record<
  StatusFilter,
  string
> = {
  ALL: "All Staff",
  NOT_GENERATED: "Not Generated",
  DRAFT: "Draft",
  APPROVED: "Approved",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

const statusClasses: Record<
  "NOT_GENERATED" | PayrollStatus,
  string
> = {
  NOT_GENERATED:
    "border-slate-200 bg-slate-100 text-slate-700",
  DRAFT:
    "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED:
    "border-sky-200 bg-sky-50 text-sky-700",
  PAID:
    "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED:
    "border-red-200 bg-red-50 text-red-700",
};

const paymentMethodLabels: Record<
  PaymentMethod,
  string
> = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
  OTHER: "Other",
};

const controlClass =
  "min-h-12 w-full rounded-2xl border border-[#DDD2E2] bg-[#FCFAFD] px-4 text-sm font-bold text-[#2D1736] outline-none transition placeholder:text-[#A69DA9] focus:border-[#5B2A86] focus:ring-4 focus:ring-[#5B2A86]/10 disabled:cursor-not-allowed disabled:bg-[#F1EEF3] disabled:text-[#9B929E]";

function formatMoney(value: string | number) {
  const number = Number(value);

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function formatNumber(value: string | number) {
  const number = Number(value);

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatMonth(value: string) {
  const [year, month] = value
    .split("-")
    .map(Number);

  if (!year || !month) {
    return value;
  }

  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function numeric(value: string | number) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export default function StaffPayrollWorkspace({
  initialMonth,
}: StaffPayrollWorkspaceProps) {
  const [selectedMonth, setSelectedMonth] =
    useState(initialMonth);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("ALL");
  const [settingsForm, setSettingsForm] =
    useState<PayrollSettings>(defaultSettings);
  const [settingsConfigured, setSettingsConfigured] =
    useState(false);
  const [weeklyOffDays, setWeeklyOffDays] =
    useState<number[]>([0]);
  const [canApprove, setCanApprove] =
    useState(false);
  const [paymentMethods, setPaymentMethods] =
    useState<readonly PaymentMethod[]>(
      defaultPaymentMethods,
    );
  const [staff, setStaff] =
    useState<PayrollStaff[]>([]);
  const [payrolls, setPayrolls] =
    useState<PayrollRecord[]>([]);
  const [summary, setSummary] =
    useState<PayrollSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] =
    useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [settingsPanelOpen, setSettingsPanelOpen] =
    useState(false);
  const [generateStaff, setGenerateStaff] =
    useState<PayrollStaff | null>(null);
  const [paymentPayroll, setPaymentPayroll] =
    useState<PayrollRecord | null>(null);
  const [generateForm, setGenerateForm] =
    useState<GenerateForm>({
      manualAddition: "0",
      manualDeduction: "0",
      manualAdjustmentNotes: "",
      notes: "",
    });
  const [paymentForm, setPaymentForm] =
    useState<PaymentForm>({
      paymentMethod: "BANK_TRANSFER",
      paymentReference: "",
      notes: "",
    });

  const loadPayroll = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        month: selectedMonth,
      });
      const response = await fetch(
        `/api/admin/staff-payroll?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const result =
        (await response.json()) as PayrollApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Staff payroll could not be loaded.",
        );
      }

      setStaff(result.staff ?? []);
      setPayrolls(result.payrolls ?? []);
      setSummary(result.summary ?? emptySummary);
      setSettingsForm(
        result.settings ?? defaultSettings,
      );
      setSettingsConfigured(
        Boolean(result.settingsConfigured),
      );
      setWeeklyOffDays(result.weeklyOffDays ?? [0]);
      setCanApprove(Boolean(result.canApprove));
      setPaymentMethods(
        result.paymentMethods ?? defaultPaymentMethods,
      );
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Staff payroll could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth]);

  useEffect(() => {
    // Load the monthly payroll register whenever the selected month changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPayroll();
  }, [loadPayroll]);

  useEffect(() => {
    const panelOpen =
      settingsPanelOpen ||
      generateStaff !== null ||
      paymentPayroll !== null;

    if (!panelOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [
    generateStaff,
    paymentPayroll,
    settingsPanelOpen,
  ]);

  const filteredStaff = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return staff.filter((record) => {
      const status = record.payroll?.status ??
        "NOT_GENERATED";
      const matchesStatus =
        statusFilter === "ALL" ||
        statusFilter === status;
      const matchesSearch =
        !searchText ||
        record.name.toLowerCase().includes(searchText) ||
        record.staffNumber
          .toLowerCase()
          .includes(searchText) ||
        record.designation
          .toLowerCase()
          .includes(searchText);

      return matchesStatus && matchesSearch;
    });
  }, [search, staff, statusFilter]);

  const paidAmount = useMemo(
    () =>
      payrolls
        .filter(
          (payroll) => payroll.status === "PAID",
        )
        .reduce(
          (total, payroll) =>
            total + numeric(payroll.netPayable),
          0,
        ),
    [payrolls],
  );

  const pendingAmount = useMemo(
    () =>
      payrolls
        .filter((payroll) =>
          ["DRAFT", "APPROVED"].includes(
            payroll.status,
          ),
        )
        .reduce(
          (total, payroll) =>
            total + numeric(payroll.netPayable),
          0,
        ),
    [payrolls],
  );

  const generatePreview = useMemo(() => {
    const preview = generateStaff?.preview;
    const addition = numeric(
      generateForm.manualAddition,
    );
    const deduction = numeric(
      generateForm.manualDeduction,
    );

    if (!preview) {
      return null;
    }

    const gross =
      preview.baseSalary +
      preview.extraDutyAmount +
      addition;
    const totalDeductions =
      preview.leaveDeduction +
      preview.absenceDeduction +
      deduction;

    return {
      gross,
      totalDeductions,
      net: Math.max(gross - totalDeductions, 0),
    };
  }, [generateForm, generateStaff]);

  function openGeneratePanel(record: PayrollStaff) {
    setMessage(null);
    setGenerateForm({
      manualAddition:
        record.payroll?.manualAddition ?? "0",
      manualDeduction:
        record.payroll?.manualDeduction ?? "0",
      manualAdjustmentNotes:
        record.payroll?.manualAdjustmentNotes ?? "",
      notes: record.payroll?.notes ?? "",
    });
    setGenerateStaff(record);
  }

  async function submitSettings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/staff-payroll",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "save_settings",
            ...settingsForm,
          }),
        },
      );
      const result =
        (await response.json()) as PayrollApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Payroll settings could not be saved.",
        );
      }

      setSettingsPanelOpen(false);
      await loadPayroll();
      setMessage({
        type: "success",
        text:
          result.message ??
          "Payroll settings saved.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Payroll settings could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitGenerate(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!generateStaff) {
      return;
    }

    const hasAdjustment =
      numeric(generateForm.manualAddition) > 0 ||
      numeric(generateForm.manualDeduction) > 0;

    if (
      hasAdjustment &&
      !generateForm.manualAdjustmentNotes.trim()
    ) {
      setMessage({
        type: "error",
        text:
          "Explain every manual salary addition or deduction for the audit history.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/staff-payroll",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "generate",
            staffId: generateStaff.id,
            month: selectedMonth,
            ...generateForm,
          }),
        },
      );
      const result =
        (await response.json()) as PayrollApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Payroll draft could not be generated.",
        );
      }

      setGenerateStaff(null);
      await loadPayroll();
      setMessage({
        type: "success",
        text:
          result.message ??
          "Payroll draft generated.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Payroll draft could not be generated.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function updatePayroll(
    payroll: PayrollRecord,
    action: "approve" | "cancel",
  ) {
    const actionLabel =
      action === "approve" ? "approve" : "cancel";

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} ${payroll.payrollNumber}?`,
      )
    ) {
      return;
    }

    setActionId(payroll.id);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/staff-payroll",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payrollId: payroll.id,
            action,
          }),
        },
      );
      const result =
        (await response.json()) as PayrollApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Payroll could not be updated.",
        );
      }

      await loadPayroll();
      setMessage({
        type: "success",
        text:
          result.message ??
          "Payroll updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Payroll could not be updated.",
      });
    } finally {
      setActionId(null);
    }
  }

  function openPaymentPanel(payroll: PayrollRecord) {
    setMessage(null);
    setPaymentForm({
      paymentMethod:
        payroll.paymentMethod ?? "BANK_TRANSFER",
      paymentReference:
        payroll.paymentReference ?? "",
      notes: payroll.notes ?? "",
    });
    setPaymentPayroll(payroll);
  }

  async function submitPayment(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!paymentPayroll) {
      return;
    }

    if (
      paymentForm.paymentMethod !== "CASH" &&
      !paymentForm.paymentReference.trim()
    ) {
      setMessage({
        type: "error",
        text:
          "Enter a transaction, cheque or payment reference for non-cash salary payments.",
      });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        "/api/admin/staff-payroll",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payrollId: paymentPayroll.id,
            action: "mark_paid",
            ...paymentForm,
          }),
        },
      );
      const result =
        (await response.json()) as PayrollApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Salary payment could not be saved.",
        );
      }

      setPaymentPayroll(null);
      await loadPayroll();
      setMessage({
        type: "success",
        text:
          result.message ??
          "Salary marked paid.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Salary payment could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  function exportPayroll() {
    if (filteredStaff.length === 0) {
      setMessage({
        type: "error",
        text:
          "There are no payroll records in the current view to export.",
      });
      return;
    }

    const rows = [
      [
        "Payroll Month",
        "Payroll Number",
        "Staff Number",
        "Employee",
        "Designation",
        "Status",
        "Base Salary",
        "Present Days",
        "Late Days",
        "Half Days",
        "Paid Leave",
        "Unpaid Leave",
        "Absent Days",
        "Unmarked Days",
        "Leave Deduction",
        "Attendance Deduction",
        "Manual Deduction",
        "Extra Duty Hours",
        "Extra Duty Amount",
        "Manual Addition",
        "Gross Earnings",
        "Total Deductions",
        "Net Payable",
        "Payment Method",
        "Payment Reference",
        "Paid At",
        "Adjustment Notes",
      ],
      ...filteredStaff.map((record) => {
        const payroll = record.payroll;
        const preview = record.preview;

        return [
          selectedMonth,
          payroll?.payrollNumber ?? "",
          record.staffNumber,
          record.name,
          record.designation,
          payroll?.status ?? "NOT_GENERATED",
          payroll?.baseSalary ??
            preview?.baseSalary ??
            record.monthlySalary ??
            "",
          payroll?.presentDays ??
            preview?.presentDays ??
            "",
          payroll?.lateDays ??
            preview?.lateDays ??
            "",
          payroll?.halfDays ??
            preview?.halfDays ??
            "",
          payroll?.paidLeaveDays ??
            preview?.paidLeaveDays ??
            "",
          payroll?.unpaidLeaveDays ??
            preview?.unpaidLeaveDays ??
            "",
          payroll?.absentDays ??
            preview?.absentDays ??
            "",
          payroll?.unmarkedDays ??
            preview?.unmarkedDays ??
            "",
          payroll?.leaveDeduction ??
            preview?.leaveDeduction ??
            "",
          payroll?.absenceDeduction ??
            preview?.absenceDeduction ??
            "",
          payroll?.manualDeduction ?? "",
          payroll?.extraDutyHours ??
            preview?.extraDutyHours ??
            "",
          payroll?.extraDutyAmount ??
            preview?.extraDutyAmount ??
            "",
          payroll?.manualAddition ?? "",
          payroll?.grossEarnings ??
            preview?.grossEarnings ??
            "",
          payroll?.totalDeductions ??
            preview?.totalDeductions ??
            "",
          payroll?.netPayable ??
            preview?.netPayable ??
            "",
          payroll?.paymentMethod ?? "",
          payroll?.paymentReference ?? "",
          payroll?.paidAt ?? "",
          payroll?.manualAdjustmentNotes ?? "",
        ];
      }),
    ];
    const csv = rows
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `staff-payroll-${selectedMonth}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function downloadSalarySlip(
    payroll: PayrollRecord,
  ) {
    const anchor = document.createElement("a");
    anchor.href = `/api/admin/staff-payroll/${encodeURIComponent(
      payroll.id,
    )}/slip`;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  return (
    <div className="space-y-7">
      {message ? (
        <div
          role="alert"
          className={[
            "flex items-start justify-between gap-4 rounded-[22px] border px-5 py-4 shadow-sm",
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900",
          ].join(" ")}
        >
          <div className="flex items-start gap-3">
            {message.type === "success" ? (
              <CheckCircle2
                aria-hidden="true"
                size={20}
                className="mt-0.5 shrink-0 text-emerald-600"
              />
            ) : (
              <AlertCircle
                aria-hidden="true"
                size={20}
                className="mt-0.5 shrink-0 text-red-600"
              />
            )}
            <p className="text-sm font-bold leading-6">
              {message.text}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Dismiss message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-black/5"
          >
            <X aria-hidden="true" size={17} />
          </button>
        </div>
      ) : null}

      <section className="overflow-hidden rounded-[30px] border border-[#E7DFEB] bg-white shadow-[0_18px_55px_rgba(45,23,54,0.08)]">
        <div className="relative overflow-hidden bg-[#2D1736] px-5 py-7 text-white sm:px-7 lg:px-9">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#7A3DA1]/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-1/3 h-52 w-52 rounded-full bg-[#D9A51F]/20 blur-3xl"
          />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <Link
                href="/admin/staff"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-white/65 transition hover:text-white"
              >
                <ArrowLeft
                  aria-hidden="true"
                  size={15}
                />
                Staff Centre
              </Link>
              <div className="mt-5 flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[#FFD34E] text-[#2D1736] shadow-lg shadow-black/10">
                  <WalletCards
                    aria-hidden="true"
                    size={27}
                  />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-[#FFD34E]">
                    Secure Monthly Payroll
                  </p>
                  <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                    Salary, leave and duty in one place
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/70">
                    Review attendance, paid and unpaid leave, approved extra duty,
                    deductions and the final salary before owner approval.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() =>
                  setSettingsPanelOpen(true)
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 text-sm font-black text-white transition hover:bg-white/15"
              >
                <Settings2
                  aria-hidden="true"
                  size={18}
                />
                Payroll Rules
              </button>
              <button
                type="button"
                onClick={exportPayroll}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#FFD34E] px-4 text-sm font-black text-[#2D1736] transition hover:bg-[#F6C932]"
              >
                <Download
                  aria-hidden="true"
                  size={18}
                />
                Export Data
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 sm:p-7">
          <SummaryCard
            icon={CircleDollarSign}
            label="Gross Earnings"
            value={formatMoney(summary.grossEarnings)}
            detail={`${summary.records} saved payroll record(s)`}
            tone="purple"
          />
          <SummaryCard
            icon={MinusCircle}
            label="Deductions"
            value={formatMoney(summary.deductions)}
            detail="Leave, absence and adjustments"
            tone="amber"
          />
          <SummaryCard
            icon={Banknote}
            label="Net Payable"
            value={formatMoney(summary.netPayable)}
            detail={`${formatMoney(pendingAmount)} awaiting payment`}
            tone="blue"
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Salary Paid"
            value={formatMoney(paidAmount)}
            detail={`${summary.paid} employee payroll(s) paid`}
            tone="green"
          />
        </div>
      </section>

      {!settingsConfigured ? (
        <section className="flex flex-col gap-4 rounded-[24px] border border-amber-200 bg-amber-50 p-5 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <AlertCircle
              aria-hidden="true"
              size={21}
              className="mt-0.5 shrink-0 text-amber-700"
            />
            <div>
              <p className="font-black">
                Payroll rules need owner confirmation
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-900/75">
                Review working days, working hours and deduction values before
                generating the first salary.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              setSettingsPanelOpen(true)
            }
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-amber-700 px-4 text-sm font-black text-white transition hover:bg-amber-800"
          >
            <Settings2
              aria-hidden="true"
              size={17}
            />
            Configure Now
          </button>
        </section>
      ) : null}

      <section className="rounded-[30px] border border-[#E7DFEB] bg-white p-5 shadow-[0_14px_45px_rgba(45,23,54,0.06)] sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6A328F]">
              Payroll Register
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
              {formatMonth(selectedMonth)} salaries
            </h2>
            <p className="mt-2 text-sm font-semibold text-[#817684]">
              Weekly offs: {weeklyOffDays.length} day(s) configured in Leave
              Manager.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 xl:w-[720px]">
            <Field label="Payroll month">
              <input
                type="month"
                value={selectedMonth}
                max={initialMonth}
                onChange={(event) =>
                  setSelectedMonth(event.target.value)
                }
                className={controlClass}
              />
            </Field>
            <Field label="Status">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value as StatusFilter,
                  )
                }
                className={controlClass}
              >
                {(
                  Object.keys(statusLabels) as StatusFilter[]
                ).map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Find employee">
              <div className="relative">
                <Search
                  aria-hidden="true"
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#817684]"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Name or staff ID"
                  className={`${controlClass} pl-11`}
                />
              </div>
            </Field>
          </div>
        </div>

        <div className="mt-7">
          {loading ? (
            <div className="flex min-h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-[#DCCFE2] bg-[#FCFAFD] text-center">
              <Loader2
                aria-hidden="true"
                size={30}
                className="animate-spin text-[#6A328F]"
              />
              <p className="mt-4 font-black text-[#2D1736]">
                Calculating payroll previews
              </p>
              <p className="mt-1 text-sm font-semibold text-[#817684]">
                Attendance, leave and approved duties are being checked.
              </p>
            </div>
          ) : filteredStaff.length === 0 ? (
            <EmptyState
              title="No employees match this view"
              description="Change the month, status or search to see payroll records."
            />
          ) : (
            <div className="space-y-4">
              {filteredStaff.map((record) => (
                <PayrollCard
                  key={record.id}
                  record={record}
                  canApprove={canApprove}
                  settingsConfigured={
                    settingsConfigured
                  }
                  busy={actionId === record.payroll?.id}
                  onGenerate={() =>
                    openGeneratePanel(record)
                  }
                  onDownload={() => {
                    if (record.payroll) {
                      downloadSalarySlip(record.payroll);
                    }
                  }}
                  onApprove={() => {
                    if (record.payroll) {
                      void updatePayroll(
                        record.payroll,
                        "approve",
                      );
                    }
                  }}
                  onPay={() => {
                    if (record.payroll) {
                      openPaymentPanel(record.payroll);
                    }
                  }}
                  onCancel={() => {
                    if (record.payroll) {
                      void updatePayroll(
                        record.payroll,
                        "cancel",
                      );
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#EEE8F1] pt-5">
          <p className="text-sm font-semibold text-[#817684]">
            Showing {filteredStaff.length} of {staff.length} employee(s)
          </p>
          <button
            type="button"
            onClick={() => void loadPayroll()}
            disabled={loading}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DDD2E2] bg-white px-4 text-xs font-black text-[#5B2A86] transition hover:bg-[#F8F3FA] disabled:opacity-50"
          >
            <RefreshCw
              aria-hidden="true"
              size={15}
              className={loading ? "animate-spin" : ""}
            />
            Refresh Calculations
          </button>
        </div>
      </section>

      {generateStaff ? (
        <SidePanel
          eyebrow="Payroll Draft"
          title={`${generateStaff.name} - ${formatMonth(
            selectedMonth,
          )}`}
          onClose={() => {
            if (!saving) {
              setGenerateStaff(null);
            }
          }}
        >
          <form
            onSubmit={submitGenerate}
            className="space-y-6"
          >
            {generateStaff.preview ? (
              <>
                <PanelSection
                  title="Automatic salary calculation"
                  description="CentreOS uses saved attendance, approved leave and approved extra duty."
                >
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <PreviewCard
                      label="Monthly salary"
                      value={formatMoney(
                        generateStaff.preview.baseSalary,
                      )}
                    />
                    <PreviewCard
                      label="Extra duty"
                      value={formatMoney(
                        generateStaff.preview
                          .extraDutyAmount,
                      )}
                      detail={`${formatNumber(
                        generateStaff.preview
                          .extraDutyHours,
                      )} hour(s)`}
                    />
                    <PreviewCard
                      label="Automatic deductions"
                      value={formatMoney(
                        generateStaff.preview
                          .leaveDeduction +
                          generateStaff.preview
                            .absenceDeduction,
                      )}
                    />
                  </div>
                  <AttendanceStrip
                    calculation={generateStaff.preview}
                  />
                </PanelSection>

                <PanelSection
                  title="Owner adjustments"
                  description="Use only when a salary needs an addition or deduction that is not already recorded elsewhere."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Manual addition">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          generateForm.manualAddition
                        }
                        onChange={(event) =>
                          setGenerateForm((current) => ({
                            ...current,
                            manualAddition:
                              event.target.value,
                          }))
                        }
                        className={controlClass}
                      />
                    </Field>
                    <Field label="Manual deduction">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={
                          generateForm.manualDeduction
                        }
                        onChange={(event) =>
                          setGenerateForm((current) => ({
                            ...current,
                            manualDeduction:
                              event.target.value,
                          }))
                        }
                        className={controlClass}
                      />
                    </Field>
                  </div>
                  <Field label="Adjustment explanation">
                    <textarea
                      value={
                        generateForm.manualAdjustmentNotes
                      }
                      onChange={(event) =>
                        setGenerateForm((current) => ({
                          ...current,
                          manualAdjustmentNotes:
                            event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Required when any manual addition or deduction is entered"
                      className={`${controlClass} resize-none py-3`}
                    />
                  </Field>
                  <Field label="Internal payroll note">
                    <textarea
                      value={generateForm.notes}
                      onChange={(event) =>
                        setGenerateForm((current) => ({
                          ...current,
                          notes: event.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Optional note for this salary record"
                      className={`${controlClass} resize-none py-3`}
                    />
                  </Field>
                </PanelSection>

                {generatePreview ? (
                  <section className="rounded-[26px] bg-[#2D1736] p-5 text-white sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FFD34E]">
                          Final Preview
                        </p>
                        <p className="mt-2 text-3xl font-black tracking-[-0.04em]">
                          {formatMoney(
                            generatePreview.net,
                          )}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white/65">
                          Gross {formatMoney(
                            generatePreview.gross,
                          )} minus {formatMoney(
                            generatePreview.totalDeductions,
                          )}
                        </p>
                      </div>
                      <Sparkles
                        aria-hidden="true"
                        size={24}
                        className="text-[#FFD34E]"
                      />
                    </div>
                  </section>
                ) : null}
              </>
            ) : (
              <div className="rounded-[24px] border border-red-200 bg-red-50 p-5 text-red-900">
                <div className="flex items-start gap-3">
                  <AlertCircle
                    aria-hidden="true"
                    size={20}
                    className="mt-0.5 shrink-0"
                  />
                  <p className="text-sm font-bold leading-6">
                    {generateStaff.previewError ??
                      "Payroll preview is unavailable."}
                  </p>
                </div>
              </div>
            )}

            <PanelActions
              saving={saving}
              disabled={
                !generateStaff.preview ||
                !settingsConfigured
              }
              onCancel={() => setGenerateStaff(null)}
              submitLabel={
                generateStaff.payroll?.status === "DRAFT"
                  ? "Recalculate Draft"
                  : "Generate Payroll Draft"
              }
            />
          </form>
        </SidePanel>
      ) : null}

      {paymentPayroll ? (
        <SidePanel
          eyebrow="Salary Payment"
          title={`Pay ${paymentPayroll.staffNameSnapshot}`}
          onClose={() => {
            if (!saving) {
              setPaymentPayroll(null);
            }
          }}
        >
          <form
            onSubmit={submitPayment}
            className="space-y-6"
          >
            <section className="rounded-[26px] bg-[#2D1736] p-6 text-white">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#FFD34E]">
                Approved Net Salary
              </p>
              <p className="mt-3 text-4xl font-black tracking-[-0.04em]">
                {formatMoney(
                  paymentPayroll.netPayable,
                )}
              </p>
              <p className="mt-3 text-sm font-semibold text-white/65">
                {paymentPayroll.payrollNumber} - {formatMonth(
                  paymentPayroll.payrollMonth,
                )}
              </p>
            </section>

            <PanelSection
              title="Payment details"
              description="The payment method and reference become part of the permanent payroll audit."
            >
              <Field label="Payment method" required>
                <select
                  value={paymentForm.paymentMethod}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      paymentMethod:
                        event.target
                          .value as PaymentMethod,
                    }))
                  }
                  required
                  className={controlClass}
                >
                  {paymentMethods.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethodLabels[method]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label={
                  paymentForm.paymentMethod === "CASH"
                    ? "Receipt or reference (optional)"
                    : "Transaction or payment reference"
                }
                required={
                  paymentForm.paymentMethod !== "CASH"
                }
              >
                <input
                  type="text"
                  value={
                    paymentForm.paymentReference
                  }
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      paymentReference:
                        event.target.value,
                    }))
                  }
                  placeholder="Transaction ID, cheque number or reference"
                  className={controlClass}
                />
              </Field>
              <Field label="Payment note">
                <textarea
                  value={paymentForm.notes}
                  onChange={(event) =>
                    setPaymentForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={3}
                  placeholder="Optional salary payment note"
                  className={`${controlClass} resize-none py-3`}
                />
              </Field>
            </PanelSection>

            <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 p-5 text-emerald-950">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  aria-hidden="true"
                  size={21}
                  className="mt-0.5 shrink-0 text-emerald-700"
                />
                <p className="text-sm font-bold leading-6">
                  Marking salary paid automatically creates a Salary entry in
                  the Expense Register and closes every approved extra-duty
                  amount included in this payroll. Do not enter the same
                  salary expense manually. A paid payroll cannot be cancelled
                  silently.
                </p>
              </div>
            </div>

            <PanelActions
              saving={saving}
              onCancel={() => setPaymentPayroll(null)}
              submitLabel="Confirm Salary Paid"
              tone="green"
            />
          </form>
        </SidePanel>
      ) : null}

      {settingsPanelOpen ? (
        <SidePanel
          eyebrow="Owner Controls"
          title="Payroll Calculation Rules"
          onClose={() => {
            if (!saving) {
              setSettingsPanelOpen(false);
            }
          }}
        >
          <form
            onSubmit={submitSettings}
            className="space-y-6"
          >
            <PanelSection
              title="Salary rate"
              description="These values control the daily salary and normal hourly extra-duty rate."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Working days per month"
                  required
                >
                  <input
                    type="number"
                    min="1"
                    max="31"
                    step="1"
                    value={
                      settingsForm.workingDaysPerMonth
                    }
                    onChange={(event) =>
                      setSettingsForm((current) => ({
                        ...current,
                        workingDaysPerMonth: Number(
                          event.target.value,
                        ),
                      }))
                    }
                    required
                    className={controlClass}
                  />
                </Field>
                <Field
                  label="Standard hours per day"
                  required
                >
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.25"
                    value={
                      settingsForm.standardHoursPerDay
                    }
                    onChange={(event) =>
                      setSettingsForm((current) => ({
                        ...current,
                        standardHoursPerDay: Number(
                          event.target.value,
                        ),
                      }))
                    }
                    required
                    className={controlClass}
                  />
                </Field>
              </div>
              <div className="rounded-[22px] bg-[#2D1736] p-5 text-white">
                <div className="flex items-start gap-3">
                  <Calculator
                    aria-hidden="true"
                    size={21}
                    className="mt-0.5 shrink-0 text-[#FFD34E]"
                  />
                  <div>
                    <p className="font-black">
                      Automatic formula
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                      Daily rate = monthly salary divided by working days.
                      Hourly rate = daily rate divided by normal hours.
                    </p>
                  </div>
                </div>
              </div>
            </PanelSection>

            <PanelSection
              title="Attendance deductions"
              description="Enter how many daily salary units should be deducted for each attendance status. Enter zero when no deduction applies."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <Field
                  label="One absent day"
                  required
                >
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.25"
                    value={
                      settingsForm.absentDeductionDays
                    }
                    onChange={(event) =>
                      setSettingsForm((current) => ({
                        ...current,
                        absentDeductionDays: Number(
                          event.target.value,
                        ),
                      }))
                    }
                    required
                    className={controlClass}
                  />
                </Field>
                <Field
                  label="One half day"
                  required
                >
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.25"
                    value={
                      settingsForm.halfDayDeductionDays
                    }
                    onChange={(event) =>
                      setSettingsForm((current) => ({
                        ...current,
                        halfDayDeductionDays: Number(
                          event.target.value,
                        ),
                      }))
                    }
                    required
                    className={controlClass}
                  />
                </Field>
                <Field
                  label="One late day"
                  required
                >
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.25"
                    value={
                      settingsForm.lateDeductionDays
                    }
                    onChange={(event) =>
                      setSettingsForm((current) => ({
                        ...current,
                        lateDeductionDays: Number(
                          event.target.value,
                        ),
                      }))
                    }
                    required
                    className={controlClass}
                  />
                </Field>
              </div>
              <p className="rounded-[18px] bg-[#F7F2F9] px-4 py-3 text-xs font-bold leading-5 text-[#6C6070]">
                Unpaid leave always deducts its actual charged days. Paid leave
                never deducts salary while allowance remains. Unmarked elapsed
                days block approval instead of making a hidden deduction.
              </p>
            </PanelSection>

            <PanelActions
              saving={saving}
              onCancel={() =>
                setSettingsPanelOpen(false)
              }
              submitLabel="Save Payroll Rules"
            />
          </form>
        </SidePanel>
      ) : null}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: {
  icon: typeof Clock3;
  label: string;
  value: string;
  detail: string;
  tone: "purple" | "green" | "amber" | "blue";
}) {
  const toneClass = {
    purple: "bg-[#F1E7F6] text-[#5B2A86]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    blue: "bg-sky-50 text-sky-700",
  }[tone];

  return (
    <article className="rounded-[26px] border border-[#E7DFEB] bg-white p-5 shadow-[0_12px_35px_rgba(45,23,54,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
            {label}
          </p>
          <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-[#2D1736]">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}
        >
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#817684]">
        {detail}
      </p>
    </article>
  );
}

function PayrollCard({
  record,
  canApprove,
  settingsConfigured,
  busy,
  onGenerate,
  onDownload,
  onApprove,
  onPay,
  onCancel,
}: {
  record: PayrollStaff;
  canApprove: boolean;
  settingsConfigured: boolean;
  busy: boolean;
  onGenerate: () => void;
  onDownload: () => void;
  onApprove: () => void;
  onPay: () => void;
  onCancel: () => void;
}) {
  const payroll = record.payroll;
  const preview = record.preview;
  const status = payroll?.status ?? "NOT_GENERATED";
  const baseSalary =
    payroll?.baseSalary ??
    preview?.baseSalary ??
    record.monthlySalary ??
    0;
  const extraDuty =
    payroll?.extraDutyAmount ??
    preview?.extraDutyAmount ??
    0;
  const gross =
    payroll?.grossEarnings ??
    preview?.grossEarnings ??
    baseSalary;
  const deductions =
    payroll?.totalDeductions ??
    preview?.totalDeductions ??
    0;
  const net =
    payroll?.netPayable ??
    preview?.netPayable ??
    0;
  const unmarked = numeric(
    payroll?.unmarkedDays ??
      preview?.unmarkedDays ??
      0,
  );

  return (
    <article className="overflow-hidden rounded-[26px] border border-[#E7DFEB] bg-[#FCFAFD]">
      <div className="flex flex-col gap-4 border-b border-[#EEE8F1] bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F1E7F6] font-black text-[#5B2A86]">
            {record.name
              .split(" ")
              .filter(Boolean)
              .slice(0, 2)
              .map((part) => part[0])
              .join("")
              .toUpperCase() || "S"}
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-black text-[#2D1736]">
                {record.name}
              </h3>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.07em] ${statusClasses[status]}`}
              >
                {statusLabels[status]}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#817684]">
              {record.staffNumber} - {record.designation}
              {payroll
                ? ` - ${payroll.payrollNumber}`
                : ""}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {payroll &&
          payroll.status !== "CANCELLED" ? (
            <button
              type="button"
              onClick={onDownload}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#D7C8DF] bg-white px-3.5 text-xs font-black text-[#5B2A86] transition hover:bg-[#F7F1F9]"
            >
              <Download
                aria-hidden="true"
                size={15}
              />
              PDF Salary Slip
            </button>
          ) : null}
          {(!payroll ||
            payroll.status === "DRAFT" ||
            payroll.status === "CANCELLED") &&
          preview ? (
            <button
              type="button"
              onClick={onGenerate}
              disabled={!settingsConfigured}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B2A86] px-3.5 text-xs font-black text-white transition hover:bg-[#48216B] disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Calculator
                aria-hidden="true"
                size={15}
              />
              {payroll?.status === "DRAFT"
                ? "Recalculate"
                : "Generate Draft"}
            </button>
          ) : null}
          {canApprove && payroll?.status === "DRAFT" ? (
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-sky-700 px-3.5 text-xs font-black text-white transition hover:bg-sky-800 disabled:opacity-50"
            >
              {busy ? (
                <Loader2
                  aria-hidden="true"
                  size={15}
                  className="animate-spin"
                />
              ) : (
                <Check
                  aria-hidden="true"
                  size={15}
                />
              )}
              Approve
            </button>
          ) : null}
          {canApprove &&
          payroll?.status === "APPROVED" ? (
            <button
              type="button"
              onClick={onPay}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-xs font-black text-white transition hover:bg-emerald-700"
            >
              <Banknote
                aria-hidden="true"
                size={15}
              />
              Mark Paid
            </button>
          ) : null}
          {canApprove &&
          payroll &&
          (payroll.status === "DRAFT" ||
            payroll.status === "APPROVED") ? (
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle
                aria-hidden="true"
                size={15}
              />
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      {record.previewError ? (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm font-bold text-red-800">
          {record.previewError}
        </div>
      ) : null}

      {unmarked > 0 ? (
        <div className="flex items-start gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3 text-sm font-bold text-amber-900">
          <AlertCircle
            aria-hidden="true"
            size={17}
            className="mt-0.5 shrink-0"
          />
          {formatNumber(unmarked)} elapsed working day(s) need attendance before
          approval.
        </div>
      ) : null}

      <div className="grid gap-px bg-[#EEE8F1] sm:grid-cols-2 xl:grid-cols-5">
        <MoneyBlock
          label="Base Salary"
          value={formatMoney(baseSalary)}
          detail={`Daily ${formatMoney(
            payroll?.dailyRate ??
              preview?.dailyRate ??
              0,
          )}`}
        />
        <MoneyBlock
          label="Extra Duty"
          value={formatMoney(extraDuty)}
          detail={`${formatNumber(
            payroll?.extraDutyHours ??
              preview?.extraDutyHours ??
              0,
          )} approved hour(s)`}
          positive
        />
        <MoneyBlock
          label="Gross Earnings"
          value={formatMoney(gross)}
          detail="Salary plus additions"
        />
        <MoneyBlock
          label="Deductions"
          value={formatMoney(deductions)}
          detail={`${formatNumber(
            payroll?.deductionDays ??
              preview?.deductionDays ??
              0,
          )} salary day(s)`}
          negative
        />
        <MoneyBlock
          label="Net Payable"
          value={formatMoney(net)}
          detail={
            payroll?.status === "PAID"
              ? `Paid ${formatDate(payroll.paidAt)}`
              : "Final salary"
          }
          highlight
        />
      </div>

      {preview || payroll ? (
        <div className="p-5">
          <AttendanceStrip
            calculation={(preview ?? payroll)!}
          />
          {payroll?.manualAdjustmentNotes ? (
            <p className="mt-4 rounded-[18px] bg-[#F7F2F9] px-4 py-3 text-sm font-semibold leading-6 text-[#6C6070]">
              <span className="font-black text-[#2D1736]">
                Adjustment note:
              </span>{" "}
              {payroll.manualAdjustmentNotes}
            </p>
          ) : null}
          {payroll?.status === "PAID" ? (
            <div className="mt-4 border-t border-[#EEE8F1] pt-4">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-[#817684]">
                <span>
                  Method: {payroll.paymentMethod
                    ? paymentMethodLabels[
                        payroll.paymentMethod
                      ]
                    : "-"}
                </span>
                <span>
                  Reference: {payroll.paymentReference ?? "-"}
                </span>
                <span>
                  Paid by: {payroll.paidBy?.name ?? "Owner"}
                </span>
              </div>
              <div className="mt-3 flex flex-col gap-3 rounded-[18px] border border-emerald-200 bg-emerald-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="flex items-center gap-2 text-xs font-black text-emerald-800">
                  <CheckCircle2 aria-hidden="true" size={16} />
                  Included automatically in the Salary Expense Register
                </span>
                <Link
                  href="/admin/expenses"
                  className="text-xs font-black text-[#5B2A86] underline decoration-2 underline-offset-4"
                >
                  Open Expenses
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function MoneyBlock({
  label,
  value,
  detail,
  positive = false,
  negative = false,
  highlight = false,
}: {
  label: string;
  value: string;
  detail: string;
  positive?: boolean;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "p-5",
        highlight
          ? "bg-[#2D1736] text-white"
          : "bg-white text-[#2D1736]",
      ].join(" ")}
    >
      <p
        className={[
          "text-[10px] font-black uppercase tracking-[0.1em]",
          highlight
            ? "text-[#FFD34E]"
            : "text-[#8C8190]",
        ].join(" ")}
      >
        {label}
      </p>
      <p
        className={[
          "mt-2 text-lg font-black",
          positive ? "text-emerald-700" : "",
          negative ? "text-red-700" : "",
        ].join(" ")}
      >
        {value}
      </p>
      <p
        className={[
          "mt-1 text-xs font-semibold",
          highlight
            ? "text-white/60"
            : "text-[#817684]",
        ].join(" ")}
      >
        {detail}
      </p>
    </div>
  );
}

function AttendanceStrip({
  calculation,
}: {
  calculation:
    | PayrollCalculation
    | PayrollRecord;
}) {
  const values = [
    {
      label: "Present",
      value: calculation.presentDays,
      tone: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "Late",
      value: calculation.lateDays,
      tone: "text-amber-700 bg-amber-50",
    },
    {
      label: "Half Day",
      value: calculation.halfDays,
      tone: "text-orange-700 bg-orange-50",
    },
    {
      label: "Paid Leave",
      value: calculation.paidLeaveDays,
      tone: "text-sky-700 bg-sky-50",
    },
    {
      label: "Unpaid Leave",
      value: calculation.unpaidLeaveDays,
      tone: "text-red-700 bg-red-50",
    },
    {
      label: "Absent",
      value: calculation.absentDays,
      tone: "text-red-800 bg-red-50",
    },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((item) => (
        <span
          key={item.label}
          className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${item.tone}`}
        >
          {item.label}
          <strong>{formatNumber(item.value)}</strong>
        </span>
      ))}
    </div>
  );
}

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center rounded-[24px] border border-dashed border-[#DCCFE2] bg-[#FCFAFD] px-5 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#F1E7F6] text-[#5B2A86]">
        <UserCheck aria-hidden="true" size={25} />
      </span>
      <p className="mt-4 text-lg font-black text-[#2D1736]">
        {title}
      </p>
      <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
        {description}
      </p>
    </div>
  );
}

function SidePanel({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[120]">
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close ${title}`}
        className="absolute inset-0 bg-[#1F1027]/55 backdrop-blur-sm"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="absolute inset-y-0 right-0 flex w-full max-w-[760px] flex-col bg-[#F8F6F9] shadow-[-24px_0_70px_rgba(31,16,39,0.22)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E9E2ED] bg-white px-5 py-5 sm:px-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-[#6A328F]">
              {eyebrow}
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E4DAE8] bg-white text-[#625768] transition hover:bg-[#F5F0F7]"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {children}
        </div>
      </aside>
    </div>
  );
}

function PanelSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[26px] border border-[#E7DFEB] bg-white p-5 shadow-[0_10px_30px_rgba(45,23,54,0.04)]">
      <h3 className="text-lg font-black text-[#2D1736]">
        {title}
      </h3>
      <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
        {description}
      </p>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.09em] text-[#817684]">
        {label}{" "}
        {required ? (
          <span aria-hidden="true">*</span>
        ) : null}
      </span>
      {children}
    </label>
  );
}

function PreviewCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-[20px] border border-[#E7DFEB] bg-[#FCFAFD] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-[#2D1736]">
        {value}
      </p>
      {detail ? (
        <p className="mt-1 text-xs font-semibold text-[#817684]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function PanelActions({
  saving,
  disabled = false,
  onCancel,
  submitLabel,
  tone = "purple",
}: {
  saving: boolean;
  disabled?: boolean;
  onCancel: () => void;
  submitLabel: string;
  tone?: "purple" | "green";
}) {
  return (
    <div className="sticky bottom-0 flex gap-3 border-t border-[#EEE8F1] bg-[#F8F6F9]/95 py-4 backdrop-blur">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="min-h-12 flex-1 rounded-2xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5F5363] transition hover:bg-[#F7F2F9] disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving || disabled}
        className={[
          "inline-flex min-h-12 flex-[1.5] items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-white transition disabled:cursor-not-allowed disabled:opacity-50",
          tone === "green"
            ? "bg-emerald-600 hover:bg-emerald-700"
            : "bg-[#5B2A86] hover:bg-[#48216B]",
        ].join(" ")}
      >
        {saving ? (
          <Loader2
            aria-hidden="true"
            size={18}
            className="animate-spin"
          />
        ) : tone === "green" ? (
          <Banknote
            aria-hidden="true"
            size={18}
          />
        ) : (
          <FileCheck2
            aria-hidden="true"
            size={18}
          />
        )}
        {saving ? "Saving..." : submitLabel}
      </button>
    </div>
  );
}
