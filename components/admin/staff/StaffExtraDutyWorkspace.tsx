"use client";

import {
  AlertCircle,
  Banknote,
  Calculator,
  CalendarCheck2,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  IndianRupee,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  UserRoundCog,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type DutyStatus = "PENDING" | "APPROVED" | "PAID" | "CANCELLED";

type PayrollSettings = {
  workingDaysPerMonth: number;
  standardHoursPerDay: number;
};

type StaffRecord = {
  id: string;
  staffNumber: string;
  name: string;
  designation: string;
  status: "ACTIVE" | "INACTIVE" | "LEFT";
  joiningDate: string;
  leavingDate: string | null;
  monthlySalary: string | null;
};

type DutyPerson = {
  id: string;
  staffNumber: string;
  name: string;
  designation: string;
};

type DutyRecord = {
  id: string;
  dutyNumber: string;
  dutyDate: string;
  startTime: string;
  endTime: string;
  hours: string;
  hourlyRate: string;
  amount: string;
  reason: string;
  status: DutyStatus;
  notes: string | null;
  coveringStaff: DutyPerson;
  absentStaff: DutyPerson | null;
  createdBy: {
    id: string;
    name: string;
  } | null;
  approvedBy: {
    id: string;
    name: string;
  } | null;
  approvedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type DutyTotals = {
  records: number;
  hours: number;
  amount: number;
  pending: number;
  approved: number;
  paid: number;
  cancelled: number;
};

type DutyApiResponse = {
  success?: boolean;
  message?: string;
  month?: string;
  settings?: PayrollSettings | null;
  settingsConfigured?: boolean;
  canApprove?: boolean;
  staff?: StaffRecord[];
  duties?: DutyRecord[];
  totals?: DutyTotals;
  duty?: DutyRecord;
};

type StaffExtraDutyWorkspaceProps = {
  initialMonth: string;
  initialDate: string;
};

type DutyForm = {
  coveringStaffId: string;
  absentStaffId: string;
  dutyDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  notes: string;
};

const emptyTotals: DutyTotals = {
  records: 0,
  hours: 0,
  amount: 0,
  pending: 0,
  approved: 0,
  paid: 0,
  cancelled: 0,
};

const defaultSettings: PayrollSettings = {
  workingDaysPerMonth: 26,
  standardHoursPerDay: 8,
};

const statusLabels: Record<DutyStatus, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  PAID: "Paid",
  CANCELLED: "Cancelled",
};

const statusClasses: Record<DutyStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-sky-200 bg-sky-50 text-sky-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

const controlClass =
  "min-h-12 w-full rounded-2xl border border-[#DDD2E2] bg-[#FCFAFD] px-4 text-sm font-bold text-[#2D1736] outline-none transition focus:border-[#5B2A86] focus:ring-4 focus:ring-[#5B2A86]/10 disabled:cursor-not-allowed disabled:bg-[#F1EEF3] disabled:text-[#9B929E]";

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

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function calculateHours(start: string, end: string) {
  if (!start || !end) {
    return 0;
  }

  const [startHours, startMinutes] = start.split(":").map(Number);
  const [endHours, endMinutes] = end.split(":").map(Number);
  const minutes = endHours * 60 + endMinutes - (startHours * 60 + startMinutes);

  if (!Number.isFinite(minutes) || minutes <= 0) {
    return 0;
  }

  return Math.round((minutes / 60) * 100) / 100;
}

export default function StaffExtraDutyWorkspace({
  initialMonth,
  initialDate,
}: StaffExtraDutyWorkspaceProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [statusFilter, setStatusFilter] = useState<"ALL" | DutyStatus>("ALL");
  const [settings, setSettings] = useState<PayrollSettings | null>(null);
  const [settingsConfigured, setSettingsConfigured] = useState(false);
  const [settingsForm, setSettingsForm] =
    useState<PayrollSettings>(defaultSettings);
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [duties, setDuties] = useState<DutyRecord[]>([]);
  const [totals, setTotals] = useState<DutyTotals>(emptyTotals);
  const [canApprove, setCanApprove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [dutyPanelOpen, setDutyPanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dutyForm, setDutyForm] = useState<DutyForm>({
    coveringStaffId: "",
    absentStaffId: "",
    dutyDate: initialDate,
    startTime: "",
    endTime: "",
    reason: "LEAVE_COVER",
    notes: "",
  });

  const loadDuties = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        month: selectedMonth,
      });

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      const response = await fetch(
        `/api/admin/staff-extra-duty?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const result = (await response.json()) as DutyApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "Substitute duties could not be loaded.",
        );
      }

      setStaff(result.staff ?? []);
      setDuties(result.duties ?? []);
      setTotals(result.totals ?? emptyTotals);
      setSettings(result.settings ?? null);
      setSettingsConfigured(Boolean(result.settingsConfigured));
      setSettingsForm(result.settings ?? defaultSettings);
      setCanApprove(Boolean(result.canApprove));
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Substitute duties could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, statusFilter]);

  useEffect(() => {
    // Load extra-duty records whenever the selected month or status changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDuties();
  }, [loadDuties]);

  useEffect(() => {
    if (!dutyPanelOpen && !settingsPanelOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [dutyPanelOpen, settingsPanelOpen]);

  const activeStaff = useMemo(
    () => staff.filter((record) => record.status === "ACTIVE"),
    [staff],
  );

  const coveringStaff = useMemo(
    () =>
      staff.find((record) => record.id === dutyForm.coveringStaffId) ?? null,
    [dutyForm.coveringStaffId, staff],
  );

  const preview = useMemo(() => {
    const hours = calculateHours(dutyForm.startTime, dutyForm.endTime);
    const salary = Number(coveringStaff?.monthlySalary ?? "0");

    if (!settings || hours <= 0 || !Number.isFinite(salary) || salary <= 0) {
      return {
        hours,
        hourlyRate: 0,
        amount: 0,
      };
    }

    const hourlyRate =
      Math.round(
        (salary /
          (settings.workingDaysPerMonth * settings.standardHoursPerDay)) *
          100,
      ) / 100;

    return {
      hours,
      hourlyRate,
      amount: Math.round(hourlyRate * hours * 100) / 100,
    };
  }, [
    coveringStaff?.monthlySalary,
    dutyForm.endTime,
    dutyForm.startTime,
    settings,
  ]);

  function openDutyPanel() {
    setMessage(null);
    setDutyForm({
      coveringStaffId: "",
      absentStaffId: "",
      dutyDate: initialDate,
      startTime: "",
      endTime: "",
      reason: "LEAVE_COVER",
      notes: "",
    });
    setDutyPanelOpen(true);
  }

  async function submitDuty(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!dutyForm.coveringStaffId || !dutyForm.absentStaffId) {
      setMessage({
        type: "error",
        text: "Select both the absent employee and the substitute employee.",
      });
      return;
    }

    if (dutyForm.coveringStaffId === dutyForm.absentStaffId) {
      setMessage({
        type: "error",
        text: "The absent and substitute employees must be different.",
      });
      return;
    }

    if (preview.hours <= 0) {
      setMessage({
        type: "error",
        text: "Enter a valid start and end time for the extra duty.",
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/staff-extra-duty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          ...dutyForm,
        }),
      });
      const result = (await response.json()) as DutyApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The substitute duty could not be saved.",
        );
      }

      setDutyPanelOpen(false);
      await loadDuties();
      setMessage({
        type: "success",
        text: result.message ?? "Substitute duty recorded successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "The substitute duty could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/staff-extra-duty", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save_settings",
          ...settingsForm,
        }),
      });
      const result = (await response.json()) as DutyApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "Salary calculation settings could not be saved.",
        );
      }

      setSettingsPanelOpen(false);
      await loadDuties();
      setMessage({
        type: "success",
        text: result.message ?? "Salary calculation settings saved.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Salary calculation settings could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateDuty(
    duty: DutyRecord,
    action: "approve" | "cancel",
  ) {
    const label =
      action === "approve"
        ? "approve"
        : "cancel";

    if (
      !window.confirm(`Are you sure you want to ${label} ${duty.dutyNumber}?`)
    ) {
      return;
    }

    setActionId(duty.id);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/staff-extra-duty", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dutyId: duty.id,
          action,
        }),
      });
      const result = (await response.json()) as DutyApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The substitute duty could not be updated.",
        );
      }

      await loadDuties();
      setMessage({
        type: "success",
        text: result.message ?? "Substitute duty updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "The substitute duty could not be updated.",
      });
    } finally {
      setActionId(null);
    }
  }

  function exportDuties() {
    if (duties.length === 0) {
      setMessage({
        type: "error",
        text: "There are no substitute duties to export.",
      });
      return;
    }

    const rows = [
      [
        "Duty Number",
        "Date",
        "Absent Employee",
        "Substitute Employee",
        "Start Time",
        "End Time",
        "Hours",
        "Hourly Rate",
        "Amount",
        "Status",
        "Reason",
        "Notes",
        "Approved By",
        "Paid At",
      ],
      ...duties.map((duty) => [
        duty.dutyNumber,
        duty.dutyDate,
        duty.absentStaff?.name ?? "",
        duty.coveringStaff.name,
        duty.startTime,
        duty.endTime,
        duty.hours,
        duty.hourlyRate,
        duty.amount,
        statusLabels[duty.status],
        duty.reason,
        duty.notes ?? "",
        duty.approvedBy?.name ?? "",
        duty.paidAt ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `staff-extra-duty-${selectedMonth}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
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
            <p className="text-sm font-bold leading-6">{message.text}</p>
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

      <section className="rounded-[30px] border border-[#E7DFEB] bg-white p-5 shadow-[0_18px_55px_rgba(45,23,54,0.07)] sm:p-7">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E7F6] text-[#5B2A86]">
                <UserRoundCog aria-hidden="true" size={21} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#6A328F]">
                  Staff salary adjustment
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                  Substitute &amp; Extra Duty
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
              Record an employee covering an absent colleague after regular
              duty. Payment uses the employee’s normal hourly salary only—no
              overtime multiplier.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportDuties}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA]"
            >
              <Download aria-hidden="true" size={18} />
              Export
            </button>
            {canApprove ? (
              <button
                type="button"
                onClick={() => {
                  setSettingsForm(settings ?? defaultSettings);
                  setSettingsPanelOpen(true);
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA]"
              >
                <Settings2 aria-hidden="true" size={18} />
                Salary Settings
              </button>
            ) : null}
            <button
              type="button"
              onClick={openDutyPanel}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)] transition hover:bg-[#4B2270]"
            >
              <Plus aria-hidden="true" size={19} />
              Record Extra Duty
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
              Month
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className={controlClass}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
              Status
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "ALL" | DutyStatus)
              }
              className={`${controlClass} appearance-none`}
            >
              <option value="ALL">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="PAID">Paid</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          <button
            type="button"
            onClick={() => void loadDuties()}
            disabled={loading}
            className="mt-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F2ECF5] px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#E9DDEF] disabled:cursor-wait disabled:opacity-60"
          >
            <RefreshCw
              aria-hidden="true"
              size={18}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </section>

      {!settingsConfigured ? (
        <section className="flex flex-col gap-4 rounded-[26px] border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Calculator
              aria-hidden="true"
              size={21}
              className="mt-0.5 shrink-0 text-amber-700"
            />
            <div>
              <p className="font-black text-amber-950">
                Salary calculation settings required
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-900/75">
                Set the standard working days per month and working hours per
                day before recording extra-duty salary.
              </p>
            </div>
          </div>
          {canApprove ? (
            <button
              type="button"
              onClick={() => {
                setSettingsForm(defaultSettings);
                setSettingsPanelOpen(true);
              }}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-amber-800 px-4 text-sm font-black text-white transition hover:bg-amber-900"
            >
              Configure Now
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Clock3}
          label="Extra Hours"
          value={formatNumber(totals.hours)}
          detail={`${totals.records} duty records`}
          tone="purple"
        />
        <SummaryCard
          icon={IndianRupee}
          label="Salary Amount"
          value={formatMoney(totals.amount)}
          detail="Normal hourly rate only"
          tone="green"
        />
        <SummaryCard
          icon={WalletCards}
          label="Pending"
          value={totals.pending}
          detail="Waiting for owner approval"
          tone="amber"
        />
        <SummaryCard
          icon={Banknote}
          label="Paid Records"
          value={totals.paid}
          detail={`${totals.approved} approved, unpaid`}
          tone="blue"
        />
      </section>

      <section className="rounded-[30px] border border-[#E7DFEB] bg-white p-5 shadow-[0_18px_55px_rgba(45,23,54,0.06)] sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black text-[#2D1736]">
              Extra-Duty Register
            </h2>
            <p className="mt-2 text-sm font-semibold text-[#817684]">
              {totals.records} record
              {totals.records === 1 ? "" : "s"} match the selected filters.
            </p>
          </div>
          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F2ECF5] px-3.5 py-2 text-xs font-black text-[#5B2A86]">
            <ShieldCheck aria-hidden="true" size={15} />
            Owner-approved payroll
          </span>
        </div>

        <div className="mt-6 space-y-4">
          {loading && duties.length === 0 ? (
            <div className="flex min-h-52 items-center justify-center gap-3 text-sm font-black text-[#6A328F]">
              <Loader2 aria-hidden="true" size={21} className="animate-spin" />
              Loading substitute duties…
            </div>
          ) : duties.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#F1E7F6] text-[#5B2A86]">
                <UserRoundCog aria-hidden="true" size={24} />
              </span>
              <h3 className="mt-4 text-lg font-black text-[#2D1736]">
                No substitute duties found
              </h3>
              <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-[#817684]">
                Record extra duty after the absent and substitute employees have
                been marked in Staff Attendance.
              </p>
              <button
                type="button"
                onClick={openDutyPanel}
                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-sm font-black text-white"
              >
                <Plus aria-hidden="true" size={17} />
                Record Extra Duty
              </button>
            </div>
          ) : (
            duties.map((duty) => (
              <DutyCard
                key={duty.id}
                duty={duty}
                canApprove={canApprove}
                busy={actionId === duty.id}
                onAction={(action) => void updateDuty(duty, action)}
              />
            ))
          )}
        </div>
      </section>

      {dutyPanelOpen ? (
        <SidePanel
          title="Record Extra Duty"
          eyebrow="Substitute salary"
          onClose={() => {
            if (!saving) {
              setDutyPanelOpen(false);
            }
          }}
        >
          <form onSubmit={submitDuty} className="space-y-6">
            <PanelSection
              title="Attendance prerequisite"
              description="Both employees must be marked correctly on the selected date before extra duty can be saved."
            >
              <div className="rounded-[20px] border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-start gap-3">
                  <CalendarCheck2
                    aria-hidden="true"
                    size={20}
                    className="mt-0.5 shrink-0 text-sky-700"
                  />
                  <div>
                    <p className="font-black text-sky-950">
                      Mark attendance first
                    </p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-sky-900/75">
                      The substitute must be Present, Late or Half Day. The
                      absent employee must be Absent, Leave or Half Day.
                    </p>
                    <Link
                      href={`/admin/staff/attendance`}
                      className="mt-3 inline-flex min-h-10 items-center justify-center rounded-xl bg-sky-700 px-4 text-xs font-black text-white"
                    >
                      Open Staff Attendance
                    </Link>
                  </div>
                </div>
              </div>
            </PanelSection>

            <PanelSection
              title="Employees"
              description="Select the employee who was absent and the employee who covered the additional duty."
            >
              <Field label="Absent employee" required>
                <select
                  value={dutyForm.absentStaffId}
                  onChange={(event) =>
                    setDutyForm((current) => ({
                      ...current,
                      absentStaffId: event.target.value,
                    }))
                  }
                  required
                  className={`${controlClass} appearance-none`}
                >
                  <option value="">Select absent employee</option>
                  {activeStaff.map((record) => (
                    <option key={record.id} value={record.id}>
                      {record.name} — {record.designation}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Substitute employee" required>
                <select
                  value={dutyForm.coveringStaffId}
                  onChange={(event) =>
                    setDutyForm((current) => ({
                      ...current,
                      coveringStaffId: event.target.value,
                    }))
                  }
                  required
                  className={`${controlClass} appearance-none`}
                >
                  <option value="">Select substitute employee</option>
                  {activeStaff.map((record) => (
                    <option
                      key={record.id}
                      value={record.id}
                      disabled={record.id === dutyForm.absentStaffId}
                    >
                      {record.name} — {record.designation}
                    </option>
                  ))}
                </select>
              </Field>
            </PanelSection>

            <PanelSection
              title="Duty date and time"
              description="Enter only the additional hours worked after the employee’s normal duty."
            >
              <Field label="Duty date" required>
                <input
                  type="date"
                  value={dutyForm.dutyDate}
                  onChange={(event) =>
                    setDutyForm((current) => ({
                      ...current,
                      dutyDate: event.target.value,
                    }))
                  }
                  required
                  className={controlClass}
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Start time" required>
                  <input
                    type="time"
                    value={dutyForm.startTime}
                    onChange={(event) =>
                      setDutyForm((current) => ({
                        ...current,
                        startTime: event.target.value,
                      }))
                    }
                    required
                    className={controlClass}
                  />
                </Field>
                <Field label="End time" required>
                  <input
                    type="time"
                    value={dutyForm.endTime}
                    onChange={(event) =>
                      setDutyForm((current) => ({
                        ...current,
                        endTime: event.target.value,
                      }))
                    }
                    required
                    className={controlClass}
                  />
                </Field>
              </div>
            </PanelSection>

            <PanelSection
              title="Salary preview"
              description="This is a preview. The server recalculates the final amount from saved settings and salary."
            >
              <div className="grid gap-3 sm:grid-cols-3">
                <PreviewCard
                  label="Extra hours"
                  value={formatNumber(preview.hours)}
                />
                <PreviewCard
                  label="Hourly rate"
                  value={formatMoney(preview.hourlyRate)}
                />
                <PreviewCard
                  label="Extra salary"
                  value={formatMoney(preview.amount)}
                  highlight
                />
              </div>
              {!settingsConfigured ? (
                <p className="text-sm font-bold text-amber-700">
                  Configure salary settings before saving this duty.
                </p>
              ) : null}
              {coveringStaff && !coveringStaff.monthlySalary ? (
                <p className="text-sm font-bold text-red-700">
                  Add a monthly salary to {coveringStaff.name} before recording
                  extra duty.
                </p>
              ) : null}
            </PanelSection>

            <PanelSection
              title="Reason and notes"
              description="Keep an explanation for payroll review and future audit."
            >
              <Field label="Reason">
                <input
                  type="text"
                  value={dutyForm.reason}
                  onChange={(event) =>
                    setDutyForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="For example: Leave cover"
                  className={controlClass}
                />
              </Field>
              <Field label="Internal notes">
                <textarea
                  value={dutyForm.notes}
                  onChange={(event) =>
                    setDutyForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Optional payroll note"
                  className={`${controlClass} resize-none py-3`}
                />
              </Field>
            </PanelSection>

            <PanelActions
              saving={saving}
              onCancel={() => setDutyPanelOpen(false)}
              submitLabel="Save Extra Duty"
            />
          </form>
        </SidePanel>
      ) : null}

      {settingsPanelOpen ? (
        <SidePanel
          title="Salary Calculation Settings"
          eyebrow="Owner controls"
          onClose={() => {
            if (!saving) {
              setSettingsPanelOpen(false);
            }
          }}
        >
          <form onSubmit={submitSettings} className="space-y-6">
            <PanelSection
              title="Normal hourly salary"
              description="CentreOS divides monthly salary by normal monthly working hours. No extra multiplier is applied."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Working days per month" required>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    step="1"
                    value={settingsForm.workingDaysPerMonth}
                    onChange={(event) =>
                      setSettingsForm((current) => ({
                        ...current,
                        workingDaysPerMonth: Number(event.target.value),
                      }))
                    }
                    required
                    className={controlClass}
                  />
                </Field>
                <Field label="Standard hours per day" required>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    step="0.25"
                    value={settingsForm.standardHoursPerDay}
                    onChange={(event) =>
                      setSettingsForm((current) => ({
                        ...current,
                        standardHoursPerDay: Number(event.target.value),
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
                    <p className="font-black">Calculation formula</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                      Hourly rate = monthly salary ÷ working days ÷ standard
                      hours. Extra salary = hourly rate × actual extra hours.
                    </p>
                  </div>
                </div>
              </div>
            </PanelSection>

            <PanelActions
              saving={saving}
              onCancel={() => setSettingsPanelOpen(false)}
              submitLabel="Save Settings"
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
  value: string | number;
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
      <p className="mt-3 text-sm font-semibold text-[#817684]">{detail}</p>
    </article>
  );
}

function DutyCard({
  duty,
  canApprove,
  busy,
  onAction,
}: {
  duty: DutyRecord;
  canApprove: boolean;
  busy: boolean;
  onAction: (action: "approve" | "cancel") => void;
}) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-[#E7DFEB] bg-[#FCFAFD]">
      <div className="flex flex-col gap-4 border-b border-[#EEE8F1] bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-black text-[#2D1736]">
              {duty.coveringStaff.name}
            </h3>
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.07em] ${statusClasses[duty.status]}`}
            >
              {statusLabels[duty.status]}
            </span>
          </div>
          <p className="mt-1 text-sm font-semibold text-[#817684]">
            Covering {duty.absentStaff?.name ?? "staff absence"} •{" "}
            {duty.dutyNumber}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canApprove && duty.status === "PENDING" ? (
            <button
              type="button"
              onClick={() => onAction("approve")}
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
                <Check aria-hidden="true" size={15} />
              )}
              Approve
            </button>
          ) : null}
          {canApprove && duty.status === "APPROVED" ? (
            <Link
              href="/admin/staff/payroll"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-xs font-black text-white transition hover:bg-emerald-700"
            >
              <Banknote aria-hidden="true" size={15} />
              Pay through Payroll
            </Link>
          ) : null}
          {canApprove &&
          (duty.status === "PENDING" || duty.status === "APPROVED") ? (
            <button
              type="button"
              onClick={() => onAction("cancel")}
              disabled={busy}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
            >
              <XCircle aria-hidden="true" size={15} />
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-5">
        <InfoBlock
          label="Duty date"
          value={formatDate(duty.dutyDate)}
          detail={`${duty.startTime} - ${duty.endTime}`}
        />
        <InfoBlock
          label="Extra hours"
          value={`${formatNumber(duty.hours)} hours`}
          detail="Actual additional duty"
        />
        <InfoBlock
          label="Hourly rate"
          value={formatMoney(duty.hourlyRate)}
          detail="Normal salary rate"
        />
        <InfoBlock
          label="Extra salary"
          value={formatMoney(duty.amount)}
          detail="No overtime multiplier"
        />
        <InfoBlock
          label="Payroll status"
          value={statusLabels[duty.status]}
          detail={
            duty.paidAt
              ? `Paid ${formatDate(duty.paidAt)}`
              : duty.approvedBy
                ? `By ${duty.approvedBy.name}`
                : "Owner action required"
          }
        />
      </div>

      {duty.notes ? (
        <div className="border-t border-[#EEE8F1] px-5 py-4 text-sm font-semibold leading-6 text-[#817684]">
          {duty.notes}
        </div>
      ) : null}
    </article>
  );
}

function InfoBlock({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8C8190]">
        {label}
      </p>
      <p className="mt-2 text-base font-black text-[#2D1736]">{value}</p>
      <p className="mt-1 text-xs font-semibold text-[#817684]">{detail}</p>
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
        className="absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col bg-[#F8F6F9] shadow-[-24px_0_70px_rgba(31,16,39,0.22)]"
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
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">{children}</div>
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
      <h3 className="text-lg font-black text-[#2D1736]">{title}</h3>
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
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </span>
      {children}
    </label>
  );
}

function PreviewCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={[
        "rounded-[20px] border p-4",
        highlight
          ? "border-[#5B2A86] bg-[#F4ECF8]"
          : "border-[#E7DFEB] bg-[#FCFAFD]",
      ].join(" ")}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
        {label}
      </p>
      <p className="mt-2 text-lg font-black text-[#2D1736]">{value}</p>
    </div>
  );
}

function PanelActions({
  saving,
  onCancel,
  submitLabel,
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="sticky bottom-0 flex gap-3 border-t border-[#EEE8F1] bg-white py-4">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className="inline-flex min-h-12 flex-1 items-center justify-center rounded-2xl border border-[#DDD2E2] px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA] disabled:opacity-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-12 flex-[1.4] items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#4B2270] disabled:cursor-wait disabled:opacity-60"
      >
        {saving ? (
          <Loader2 aria-hidden="true" size={18} className="animate-spin" />
        ) : (
          <Check aria-hidden="true" size={18} />
        )}
        {saving ? "Saving…" : submitLabel}
      </button>
    </div>
  );
}
