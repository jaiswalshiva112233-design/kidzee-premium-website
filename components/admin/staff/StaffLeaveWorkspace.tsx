"use client";

import {
  AlertCircle,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Download,
  Filter,
  Loader2,
  Plus,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  WalletCards,
  X,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type LeaveType = "PAID_LEAVE" | "UNPAID_LEAVE";

type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

type PaidLeaveCycle = "NONE" | "MONTHLY" | "YEARLY";

type StaffRecord = {
  id: string;
  staffNumber: string;
  name: string;
  designation: string;
  status: "ACTIVE" | "INACTIVE" | "LEFT";
  joiningDate: string;
  leavingDate: string | null;
  paidLeaveCycle: PaidLeaveCycle;
  paidLeaveAllowance: string;
};

type StaffBalance = {
  staffId: string;
  cycle: PaidLeaveCycle;
  allowance: string;
  periodStart: string;
  periodEnd: string;
  paidUsed: string;
  paidRemaining: string;
  chargedDays: string;
  unpaidDays: string;
};

type LeavePerson = {
  id: string;
  name: string;
  role: string;
};

type LeaveRecord = {
  id: string;
  leaveNumber: string;
  staffId: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  status: LeaveStatus;
  requestedDays: string;
  sandwichDays: string;
  chargedDays: string;
  paidDays: string;
  unpaidDays: string;
  reason: string | null;
  notes: string | null;
  approvedAt: string | null;
  rejectedAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  staff: {
    id: string;
    staffNumber: string;
    name: string;
    designation: string;
    status: "ACTIVE" | "INACTIVE" | "LEFT";
    paidLeaveCycle: PaidLeaveCycle;
    paidLeaveAllowance: string;
  };
  createdBy: LeavePerson | null;
  approvedBy: LeavePerson | null;
};

type LeaveSettings = {
  weeklyOffDays: number[];
  sandwichRuleEnabled: boolean;
  leaveYearStartMonth: number;
};

type LeaveSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  chargedDays: number;
  paidDays: number;
  unpaidDays: number;
};

type LeaveApiResponse = {
  success?: boolean;
  message?: string;
  month?: string;
  settings?: LeaveSettings;
  settingsConfigured?: boolean;
  canApprove?: boolean;
  staff?: StaffRecord[];
  balances?: StaffBalance[];
  leaves?: LeaveRecord[];
  summary?: LeaveSummary;
  leave?: LeaveRecord;
};

type StaffLeaveWorkspaceProps = {
  initialMonth: string;
};

type LeaveForm = {
  staffId: string;
  startDate: string;
  endDate: string;
  leaveType: LeaveType;
  reason: string;
  notes: string;
};

const defaultSettings: LeaveSettings = {
  weeklyOffDays: [0],
  sandwichRuleEnabled: true,
  leaveYearStartMonth: 1,
};

const emptySummary: LeaveSummary = {
  total: 0,
  pending: 0,
  approved: 0,
  rejected: 0,
  cancelled: 0,
  chargedDays: 0,
  paidDays: 0,
  unpaidDays: 0,
};

const emptyLeaveForm: LeaveForm = {
  staffId: "",
  startDate: "",
  endDate: "",
  leaveType: "PAID_LEAVE",
  reason: "",
  notes: "",
};

const weekDays = [
  { value: 0, short: "Sun", label: "Sunday" },
  { value: 1, short: "Mon", label: "Monday" },
  { value: 2, short: "Tue", label: "Tuesday" },
  { value: 3, short: "Wed", label: "Wednesday" },
  { value: 4, short: "Thu", label: "Thursday" },
  { value: 5, short: "Fri", label: "Friday" },
  { value: 6, short: "Sat", label: "Saturday" },
] as const;

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const statusLabels: Record<LeaveStatus, string> = {
  PENDING: "Pending Approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

const statusClasses: Record<LeaveStatus, string> = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  APPROVED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  REJECTED: "border-red-200 bg-red-50 text-red-700",
  CANCELLED: "border-slate-200 bg-slate-100 text-slate-600",
};

const formControlClass =
  "min-h-12 w-full rounded-2xl border border-[#DDD2E2] bg-[#FCFAFD] px-4 text-sm font-bold text-[#2D1736] outline-none transition focus:border-[#5B2A86] focus:ring-4 focus:ring-[#5B2A86]/10";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatNumber(value: string | number) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0";
  }

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(number);
}

function paidLeaveLabel(cycle: PaidLeaveCycle, allowance: string) {
  if (cycle === "NONE") {
    return "No paid leave";
  }

  const unit = cycle === "MONTHLY" ? "month" : "year";
  return `${formatNumber(allowance)} days / ${unit}`;
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function SelectChevron() {
  return (
    <ChevronDown
      aria-hidden="true"
      size={17}
      className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#8C8190]"
    />
  );
}

export default function StaffLeaveWorkspace({
  initialMonth,
}: StaffLeaveWorkspaceProps) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [statusFilter, setStatusFilter] = useState<"ALL" | LeaveStatus>("ALL");
  const [staffFilter, setStaffFilter] = useState("ALL");
  const [staff, setStaff] = useState<StaffRecord[]>([]);
  const [balances, setBalances] = useState<StaffBalance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [summary, setSummary] = useState<LeaveSummary>(emptySummary);
  const [settings, setSettings] = useState<LeaveSettings>(defaultSettings);
  const [settingsConfigured, setSettingsConfigured] = useState(false);
  const [canApprove, setCanApprove] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [leavePanelOpen, setLeavePanelOpen] = useState(false);
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState<LeaveForm>(emptyLeaveForm);
  const [settingsForm, setSettingsForm] =
    useState<LeaveSettings>(defaultSettings);

  const loadRegister = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const params = new URLSearchParams({
        month: selectedMonth,
      });

      if (statusFilter !== "ALL") {
        params.set("status", statusFilter);
      }

      if (staffFilter !== "ALL") {
        params.set("staffId", staffFilter);
      }

      const response = await fetch(
        `/api/admin/staff-leave?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const result = (await response.json()) as LeaveApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The staff leave register could not be loaded.",
        );
      }

      const nextSettings = result.settings ?? defaultSettings;

      setStaff(result.staff ?? []);
      setBalances(result.balances ?? []);
      setLeaves(result.leaves ?? []);
      setSummary(result.summary ?? emptySummary);
      setSettings(nextSettings);
      setSettingsForm(nextSettings);
      setSettingsConfigured(Boolean(result.settingsConfigured));
      setCanApprove(Boolean(result.canApprove));
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "The staff leave register could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, staffFilter, statusFilter]);

  useEffect(() => {
    // Load the leave register whenever its month, staff or status filter changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadRegister();
  }, [loadRegister]);

  useEffect(() => {
    if (!leavePanelOpen && !settingsPanelOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [leavePanelOpen, settingsPanelOpen]);

  const activeStaff = useMemo(
    () => staff.filter((record) => record.status === "ACTIVE"),
    [staff],
  );

  const staffById = useMemo(
    () => new Map(staff.map((record) => [record.id, record])),
    [staff],
  );

  const balanceRows = useMemo(() => {
    return balances
      .map((balance) => ({
        balance,
        staff: staffById.get(balance.staffId),
      }))
      .filter(
        (
          row,
        ): row is {
          balance: StaffBalance;
          staff: StaffRecord;
        } => Boolean(row.staff),
      )
      .sort((left, right) => left.staff.name.localeCompare(right.staff.name));
  }, [balances, staffById]);

  function openLeavePanel() {
    setMessage(null);
    setLeaveForm({
      ...emptyLeaveForm,
      staffId: staffFilter !== "ALL" ? staffFilter : "",
    });
    setLeavePanelOpen(true);
  }

  function openSettingsPanel() {
    setMessage(null);
    setSettingsForm(settings);
    setSettingsPanelOpen(true);
  }

  async function submitLeave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!leaveForm.staffId) {
      setMessage({
        type: "error",
        text: "Select a staff member.",
      });
      return;
    }

    if (!leaveForm.startDate || !leaveForm.endDate) {
      setMessage({
        type: "error",
        text: "Enter the leave start and end dates.",
      });
      return;
    }

    if (leaveForm.endDate < leaveForm.startDate) {
      setMessage({
        type: "error",
        text: "The end date cannot be before the start date.",
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/staff-leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create",
          ...leaveForm,
        }),
      });
      const result = (await response.json()) as LeaveApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The leave request could not be saved.",
        );
      }

      setLeavePanelOpen(false);
      setLeaveForm(emptyLeaveForm);
      await loadRegister();
      setMessage({
        type: "success",
        text: result.message ?? "Leave request created successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "The leave request could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function submitSettings(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/staff-leave", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "save_settings",
          ...settingsForm,
        }),
      });
      const result = (await response.json()) as LeaveApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Leave settings could not be saved.");
      }

      setSettingsPanelOpen(false);
      await loadRegister();
      setMessage({
        type: "success",
        text: result.message ?? "Staff leave settings saved.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Leave settings could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateLeave(
    leave: LeaveRecord,
    action: "approve" | "reject" | "cancel",
  ) {
    const actionLabel =
      action === "approve"
        ? "approve"
        : action === "reject"
          ? "reject"
          : "cancel";

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} ${leave.leaveNumber} for ${leave.staff.name}?`,
      )
    ) {
      return;
    }

    setActionId(leave.id);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/staff-leave", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          leaveId: leave.id,
          action,
        }),
      });
      const result = (await response.json()) as LeaveApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The leave request could not be updated.",
        );
      }

      await loadRegister();
      setMessage({
        type: "success",
        text: result.message ?? "Leave request updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "The leave request could not be updated.",
      });
    } finally {
      setActionId(null);
    }
  }

  function exportRegister() {
    if (leaves.length === 0) {
      setMessage({
        type: "error",
        text: "There are no leave records to export.",
      });
      return;
    }

    const rows = [
      [
        "Leave Number",
        "Staff Number",
        "Staff Name",
        "Designation",
        "Start Date",
        "End Date",
        "Leave Type",
        "Status",
        "Requested Days",
        "Sandwich Days",
        "Total Charged Days",
        "Paid Days",
        "Unpaid Days",
        "Reason",
        "Created By",
        "Approved By",
      ],
      ...leaves.map((leave) => [
        leave.leaveNumber,
        leave.staff.staffNumber,
        leave.staff.name,
        leave.staff.designation,
        leave.startDate.slice(0, 10),
        leave.endDate.slice(0, 10),
        leave.leaveType === "PAID_LEAVE" ? "Paid Leave" : "Unpaid Leave",
        statusLabels[leave.status],
        leave.requestedDays,
        leave.sandwichDays,
        leave.chargedDays,
        leave.paidDays,
        leave.unpaidDays,
        leave.reason ?? "",
        leave.createdBy?.name ?? "",
        leave.approvedBy?.name ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `staff-leave-${selectedMonth}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  function toggleWeeklyOff(day: number) {
    setSettingsForm((current) => ({
      ...current,
      weeklyOffDays: current.weeklyOffDays.includes(day)
        ? current.weeklyOffDays.filter((currentDay) => currentDay !== day)
        : [...current.weeklyOffDays, day].sort((left, right) => left - right),
    }));
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
                <CalendarDays aria-hidden="true" size={21} />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#6A328F]">
                  Leave control centre
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                  Staff Leave Register
                </h2>
              </div>
            </div>

            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
              Create leave requests, approve them, monitor paid leave balances
              and let CentreOS calculate sandwich days automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={exportRegister}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA]"
            >
              <Download aria-hidden="true" size={18} />
              Export Register
            </button>

            {canApprove ? (
              <button
                type="button"
                onClick={openSettingsPanel}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA]"
              >
                <Settings2 aria-hidden="true" size={18} />
                Leave Settings
              </button>
            ) : null}

            <button
              type="button"
              onClick={openLeavePanel}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)] transition hover:bg-[#4B2270]"
            >
              <Plus aria-hidden="true" size={19} />
              New Leave
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
              Month
            </span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
              className="min-h-12 w-full rounded-2xl border border-[#DDD2E2] bg-[#FCFAFD] px-4 text-sm font-bold text-[#2D1736] outline-none transition focus:border-[#5B2A86] focus:ring-4 focus:ring-[#5B2A86]/10"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
              Leave status
            </span>
            <span className="relative block">
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "ALL" | LeaveStatus)
                }
                className="min-h-12 w-full appearance-none rounded-2xl border border-[#DDD2E2] bg-[#FCFAFD] px-4 pr-11 text-sm font-bold text-[#2D1736] outline-none transition focus:border-[#5B2A86] focus:ring-4 focus:ring-[#5B2A86]/10"
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <SelectChevron />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
              Staff member
            </span>
            <span className="relative block">
              <select
                value={staffFilter}
                onChange={(event) => setStaffFilter(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-2xl border border-[#DDD2E2] bg-[#FCFAFD] px-4 pr-11 text-sm font-bold text-[#2D1736] outline-none transition focus:border-[#5B2A86] focus:ring-4 focus:ring-[#5B2A86]/10"
              >
                <option value="ALL">All staff</option>
                {staff.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.name} — {record.designation}
                  </option>
                ))}
              </select>
              <SelectChevron />
            </span>
          </label>

          <button
            type="button"
            onClick={() => void loadRegister()}
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
            <Settings2
              aria-hidden="true"
              size={21}
              className="mt-0.5 shrink-0 text-amber-700"
            />
            <div>
              <p className="font-black text-amber-950">
                Confirm your leave rules
              </p>
              <p className="mt-1 text-sm font-semibold leading-6 text-amber-900/75">
                CentreOS is currently using Sunday as the weekly off, the
                sandwich rule is enabled, and the leave year starts in January.
              </p>
            </div>
          </div>

          {canApprove ? (
            <button
              type="button"
              onClick={openSettingsPanel}
              className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-amber-800 px-4 text-sm font-black text-white transition hover:bg-amber-900"
            >
              Review Settings
            </button>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={Clock3}
          label="Pending Approval"
          value={summary.pending}
          description="Waiting for owner decision"
          tone="amber"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Approved Leave"
          value={summary.approved}
          description="Approved in selected month"
          tone="green"
        />
        <SummaryCard
          icon={CalendarDays}
          label="Charged Days"
          value={formatNumber(summary.chargedDays)}
          description="Includes sandwich days"
          tone="purple"
        />
        <SummaryCard
          icon={CircleDollarSign}
          label="Unpaid Days"
          value={formatNumber(summary.unpaidDays)}
          description="For salary calculation"
          tone="red"
        />
      </section>

      <section className="overflow-hidden rounded-[30px] border border-[#E7DFEB] bg-white shadow-[0_18px_55px_rgba(45,23,54,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#EEE8F1] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <div className="flex items-center gap-3">
              <WalletCards
                aria-hidden="true"
                size={22}
                className="text-[#5B2A86]"
              />
              <h2 className="text-xl font-black text-[#2D1736]">
                Paid Leave Balances
              </h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#817684]">
              Current allowance, usage and remaining balance for every employee.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F2ECF5] px-3.5 py-2 text-xs font-black text-[#5B2A86]">
            <ShieldCheck aria-hidden="true" size={15} />
            Auto-calculated
          </span>
        </div>

        {loading && balanceRows.length === 0 ? (
          <LoadingState label="Loading leave balances…" />
        ) : balanceRows.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            title="No staff balances found"
            description="Add staff records before managing paid leave balances."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse">
              <thead>
                <tr className="bg-[#FBF9FC] text-left">
                  {[
                    "Staff Member",
                    "Paid Leave Policy",
                    "Period",
                    "Allowance",
                    "Used",
                    "Remaining",
                    "Unpaid",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="border-b border-[#EEE8F1] px-5 py-4 text-[11px] font-black uppercase tracking-[0.1em] text-[#817684]"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {balanceRows.map(({ staff: record, balance }) => (
                  <tr
                    key={record.id}
                    className="border-b border-[#F0EBF2] last:border-b-0 hover:bg-[#FCFAFD]"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1E7F6] text-sm font-black text-[#5B2A86]">
                          {record.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="font-black text-[#2D1736]">
                            {record.name}
                          </p>
                          <p className="mt-0.5 text-xs font-semibold text-[#817684]">
                            {record.designation}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm font-bold text-[#5F5364]">
                      {paidLeaveLabel(
                        record.paidLeaveCycle,
                        record.paidLeaveAllowance,
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#6F6373]">
                      {formatDate(balance.periodStart)} —{" "}
                      {formatDate(balance.periodEnd)}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-[#2D1736]">
                      {formatNumber(balance.allowance)}
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-amber-700">
                      {formatNumber(balance.paidUsed)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-black text-emerald-700">
                        {formatNumber(balance.paidRemaining)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm font-black text-red-600">
                      {formatNumber(balance.unpaidDays)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-[#E7DFEB] bg-white p-5 shadow-[0_18px_55px_rgba(45,23,54,0.06)] sm:p-7">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Filter aria-hidden="true" size={21} className="text-[#5B2A86]" />
              <h2 className="text-xl font-black text-[#2D1736]">
                Leave Requests
              </h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#817684]">
              {summary.total} record
              {summary.total === 1 ? "" : "s"} match the selected filters.
            </p>
          </div>

          {loading ? (
            <span className="inline-flex items-center gap-2 text-sm font-bold text-[#6A328F]">
              <Loader2 aria-hidden="true" size={17} className="animate-spin" />
              Updating…
            </span>
          ) : null}
        </div>

        <div className="mt-6 space-y-4">
          {loading && leaves.length === 0 ? (
            <LoadingState label="Loading leave requests…" />
          ) : leaves.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No leave requests found"
              description="Create the first leave request or change the selected filters."
              action={
                <button
                  type="button"
                  onClick={openLeavePanel}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-sm font-black text-white"
                >
                  <Plus aria-hidden="true" size={17} />
                  New Leave
                </button>
              }
            />
          ) : (
            leaves.map((leave) => (
              <LeaveCard
                key={leave.id}
                leave={leave}
                canApprove={canApprove}
                busy={actionId === leave.id}
                onAction={(action) => void updateLeave(leave, action)}
              />
            ))
          )}
        </div>
      </section>

      {leavePanelOpen ? (
        <SidePanel
          title="New Leave Request"
          eyebrow="Staff leave"
          onClose={() => {
            if (!saving) {
              setLeavePanelOpen(false);
            }
          }}
        >
          <form onSubmit={submitLeave} className="space-y-6">
            <PanelSection
              title="Employee and leave type"
              description="Select the employee and whether the request should use their paid leave balance."
            >
              <Field label="Staff member" required>
                <span className="relative block">
                  <select
                    value={leaveForm.staffId}
                    onChange={(event) =>
                      setLeaveForm((current) => ({
                        ...current,
                        staffId: event.target.value,
                      }))
                    }
                    required
                    className={`${formControlClass} appearance-none pr-11`}
                  >
                    <option value="">Select staff</option>
                    {activeStaff.map((record) => (
                      <option key={record.id} value={record.id}>
                        {record.name} — {record.designation}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </span>
              </Field>

              <Field label="Leave type" required>
                <div className="grid gap-3 sm:grid-cols-2">
                  <ChoiceCard
                    active={leaveForm.leaveType === "PAID_LEAVE"}
                    icon={WalletCards}
                    title="Paid Leave"
                    description="Use available allowance first"
                    onClick={() =>
                      setLeaveForm((current) => ({
                        ...current,
                        leaveType: "PAID_LEAVE",
                      }))
                    }
                  />
                  <ChoiceCard
                    active={leaveForm.leaveType === "UNPAID_LEAVE"}
                    icon={CircleDollarSign}
                    title="Unpaid Leave"
                    description="Count for salary deduction"
                    onClick={() =>
                      setLeaveForm((current) => ({
                        ...current,
                        leaveType: "UNPAID_LEAVE",
                      }))
                    }
                  />
                </div>
              </Field>
            </PanelSection>

            <PanelSection
              title="Leave dates"
              description="CentreOS will remove weekly offs and add them only when the sandwich rule applies."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Start date" required>
                  <input
                    type="date"
                    value={leaveForm.startDate}
                    onChange={(event) =>
                      setLeaveForm((current) => ({
                        ...current,
                        startDate: event.target.value,
                      }))
                    }
                    required
                    className={formControlClass}
                  />
                </Field>

                <Field label="End date" required>
                  <input
                    type="date"
                    value={leaveForm.endDate}
                    min={leaveForm.startDate || undefined}
                    onChange={(event) =>
                      setLeaveForm((current) => ({
                        ...current,
                        endDate: event.target.value,
                      }))
                    }
                    required
                    className={formControlClass}
                  />
                </Field>
              </div>

              <div className="rounded-2xl bg-[#F6F1F8] p-4">
                <div className="flex items-start gap-3">
                  <Sparkles
                    aria-hidden="true"
                    size={19}
                    className="mt-0.5 shrink-0 text-[#6A328F]"
                  />
                  <p className="text-sm font-semibold leading-6 text-[#625768]">
                    Example: leave on Saturday and Monday counts Sunday too.
                    Monday leave alone counts only Monday. The final calculation
                    appears after saving.
                  </p>
                </div>
              </div>
            </PanelSection>

            <PanelSection
              title="Reason and notes"
              description="Record enough information for the owner to review the request."
            >
              <Field label="Reason">
                <input
                  type="text"
                  value={leaveForm.reason}
                  onChange={(event) =>
                    setLeaveForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  placeholder="For example: Medical leave"
                  className={formControlClass}
                />
              </Field>

              <Field label="Internal notes">
                <textarea
                  value={leaveForm.notes}
                  onChange={(event) =>
                    setLeaveForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  rows={4}
                  placeholder="Optional note for the leave record"
                  className={`${formControlClass} resize-none py-3`}
                />
              </Field>
            </PanelSection>

            <div className="sticky bottom-0 flex gap-3 border-t border-[#EEE8F1] bg-white py-4">
              <button
                type="button"
                onClick={() => setLeavePanelOpen(false)}
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
                  <Loader2
                    aria-hidden="true"
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Check aria-hidden="true" size={18} />
                )}
                {saving ? "Saving…" : "Create Leave"}
              </button>
            </div>
          </form>
        </SidePanel>
      ) : null}

      {settingsPanelOpen ? (
        <SidePanel
          title="Leave Settings"
          eyebrow="Owner controls"
          onClose={() => {
            if (!saving) {
              setSettingsPanelOpen(false);
            }
          }}
        >
          <form onSubmit={submitSettings} className="space-y-6">
            <PanelSection
              title="Centre weekly off"
              description="Choose every regular weekly holiday. These days are normally not charged as leave."
            >
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
                {weekDays.map((day) => {
                  const active = settingsForm.weeklyOffDays.includes(day.value);

                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleWeeklyOff(day.value)}
                      aria-pressed={active}
                      title={day.label}
                      className={[
                        "min-h-12 rounded-2xl border text-xs font-black transition",
                        active
                          ? "border-[#5B2A86] bg-[#5B2A86] text-white shadow-[0_8px_20px_rgba(91,42,134,0.2)]"
                          : "border-[#DDD2E2] bg-white text-[#625768] hover:bg-[#F7F2FA]",
                      ].join(" ")}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
            </PanelSection>

            <PanelSection
              title="Sandwich leave rule"
              description="Control whether weekly offs between leave days should also be charged."
            >
              <button
                type="button"
                onClick={() =>
                  setSettingsForm((current) => ({
                    ...current,
                    sandwichRuleEnabled: !current.sandwichRuleEnabled,
                  }))
                }
                aria-pressed={settingsForm.sandwichRuleEnabled}
                className={[
                  "flex w-full items-center justify-between gap-4 rounded-[22px] border p-4 text-left transition",
                  settingsForm.sandwichRuleEnabled
                    ? "border-[#B98BD0] bg-[#F7F0FA]"
                    : "border-[#DDD2E2] bg-white",
                ].join(" ")}
              >
                <span>
                  <span className="block font-black text-[#2D1736]">
                    {settingsForm.sandwichRuleEnabled
                      ? "Rule enabled"
                      : "Rule disabled"}
                  </span>
                  <span className="mt-1 block text-sm font-semibold leading-6 text-[#817684]">
                    Saturday leave + Monday leave counts the weekly holiday
                    between them.
                  </span>
                </span>

                <span
                  className={[
                    "relative h-7 w-12 shrink-0 rounded-full transition",
                    settingsForm.sandwichRuleEnabled
                      ? "bg-[#5B2A86]"
                      : "bg-[#C9C1CC]",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "absolute top-1 h-5 w-5 rounded-full bg-white shadow transition",
                      settingsForm.sandwichRuleEnabled ? "left-6" : "left-1",
                    ].join(" ")}
                  />
                </span>
              </button>
            </PanelSection>

            <PanelSection
              title="Yearly leave cycle"
              description="Yearly paid leave allowances reset from the first day of this month."
            >
              <Field label="Leave year starts in" required>
                <span className="relative block">
                  <select
                    value={settingsForm.leaveYearStartMonth}
                    onChange={(event) =>
                      setSettingsForm((current) => ({
                        ...current,
                        leaveYearStartMonth: Number(event.target.value),
                      }))
                    }
                    className={`${formControlClass} appearance-none pr-11`}
                  >
                    {months.map((month, index) => (
                      <option key={month} value={index + 1}>
                        {month}
                      </option>
                    ))}
                  </select>
                  <SelectChevron />
                </span>
              </Field>
            </PanelSection>

            <div className="rounded-[22px] bg-[#2D1736] p-5 text-white">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  aria-hidden="true"
                  size={21}
                  className="mt-0.5 shrink-0 text-[#FFD34E]"
                />
                <div>
                  <p className="font-black">Existing records stay safe</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                    After saving, CentreOS recalculates approved leave and
                    balances using the new rules. Every change is recorded in
                    the activity log.
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-[#EEE8F1] bg-white py-4">
              <button
                type="button"
                onClick={() => setSettingsPanelOpen(false)}
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
                  <Loader2
                    aria-hidden="true"
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Check aria-hidden="true" size={18} />
                )}
                {saving ? "Saving…" : "Save Settings"}
              </button>
            </div>
          </form>
        </SidePanel>
      ) : null}
    </div>
  );
}

type SummaryCardProps = {
  icon: typeof CalendarDays;
  label: string;
  value: string | number;
  description: string;
  tone: "amber" | "green" | "purple" | "red";
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  description,
  tone,
}: SummaryCardProps) {
  const toneClasses = {
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    purple: "bg-[#F1E7F6] text-[#5B2A86]",
    red: "bg-red-50 text-red-600",
  }[tone];

  return (
    <article className="rounded-[26px] border border-[#E7DFEB] bg-white p-5 shadow-[0_12px_35px_rgba(45,23,54,0.05)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#2D1736]">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClasses}`}
        >
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#817684]">{description}</p>
    </article>
  );
}

type LeaveCardProps = {
  leave: LeaveRecord;
  canApprove: boolean;
  busy: boolean;
  onAction: (action: "approve" | "reject" | "cancel") => void;
};

function LeaveCard({ leave, canApprove, busy, onAction }: LeaveCardProps) {
  return (
    <article className="overflow-hidden rounded-[26px] border border-[#E7DFEB] bg-[#FCFAFD]">
      <div className="flex flex-col gap-4 border-b border-[#EEE8F1] bg-white p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F1E7F6] text-[#5B2A86]">
            <UserRound aria-hidden="true" size={20} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-lg font-black text-[#2D1736]">
                {leave.staff.name}
              </h3>
              <span
                className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.07em] ${statusClasses[leave.status]}`}
              >
                {statusLabels[leave.status]}
              </span>
            </div>
            <p className="mt-1 text-sm font-semibold text-[#817684]">
              {leave.staff.designation} • {leave.leaveNumber}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {canApprove && leave.status === "PENDING" ? (
            <>
              <button
                type="button"
                onClick={() => onAction("approve")}
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3.5 text-xs font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
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
              <button
                type="button"
                onClick={() => onAction("reject")}
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
              >
                <XCircle aria-hidden="true" size={15} />
                Reject
              </button>
            </>
          ) : null}

          {canApprove &&
          (leave.status === "PENDING" || leave.status === "APPROVED") ? (
            <button
              type="button"
              onClick={() => onAction("cancel")}
              disabled={busy}
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DDD2E2] bg-white px-3.5 text-xs font-black text-[#625768] transition hover:bg-[#F7F2FA] disabled:opacity-50"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        <InfoBlock
          label="Leave dates"
          value={`${formatDate(leave.startDate)} — ${formatDate(leave.endDate)}`}
          detail={
            leave.leaveType === "PAID_LEAVE"
              ? "Paid leave requested"
              : "Unpaid leave requested"
          }
        />
        <InfoBlock
          label="Days requested"
          value={formatNumber(leave.requestedDays)}
          detail={`${formatNumber(leave.sandwichDays)} sandwich day${Number(leave.sandwichDays) === 1 ? "" : "s"}`}
        />
        <InfoBlock
          label="Total charged"
          value={`${formatNumber(leave.chargedDays)} days`}
          detail="After weekly-off calculation"
        />
        <InfoBlock
          label="Salary split"
          value={`${formatNumber(leave.paidDays)} paid`}
          detail={`${formatNumber(leave.unpaidDays)} unpaid`}
        />
      </div>

      {(leave.reason || leave.notes) && (
        <div className="border-t border-[#EEE8F1] px-5 py-4">
          {leave.reason ? (
            <p className="text-sm font-bold text-[#5F5364]">
              <span className="text-[#2D1736]">Reason:</span> {leave.reason}
            </p>
          ) : null}
          {leave.notes ? (
            <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
              {leave.notes}
            </p>
          ) : null}
        </div>
      )}
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

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center gap-3 p-8 text-sm font-black text-[#6A328F]">
      <Loader2 aria-hidden="true" size={20} className="animate-spin" />
      {label}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof CalendarDays;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#F1E7F6] text-[#5B2A86]">
        <Icon aria-hidden="true" size={24} />
      </span>
      <h3 className="mt-4 text-lg font-black text-[#2D1736]">{title}</h3>
      <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-[#817684]">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
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
  children: React.ReactNode;
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
  children: React.ReactNode;
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
  children: React.ReactNode;
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

function ChoiceCard({
  active,
  icon: Icon,
  title,
  description,
  onClick,
}: {
  active: boolean;
  icon: typeof WalletCards;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "flex min-h-28 items-start gap-3 rounded-[20px] border p-4 text-left transition",
        active
          ? "border-[#5B2A86] bg-[#F6F0F9] shadow-[0_8px_24px_rgba(91,42,134,0.1)]"
          : "border-[#DDD2E2] bg-white hover:bg-[#FCFAFD]",
      ].join(" ")}
    >
      <span
        className={[
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl",
          active ? "bg-[#5B2A86] text-white" : "bg-[#F1E7F6] text-[#5B2A86]",
        ].join(" ")}
      >
        <Icon aria-hidden="true" size={19} />
      </span>
      <span>
        <span className="block font-black text-[#2D1736]">{title}</span>
        <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
          {description}
        </span>
      </span>
    </button>
  );
}
