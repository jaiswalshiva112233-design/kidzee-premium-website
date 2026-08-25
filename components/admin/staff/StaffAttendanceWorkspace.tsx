"use client";

import {
  AlertCircle,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  Download,
  FileLock2,
  Loader2,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserMinus,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import type { FormEvent } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

type AttendanceStatus =
  "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE" | "HOLIDAY";

type StaffRecord = {
  id: string;
  staffNumber: string;
  name: string;
  designation: string;
  phone: string;
  joiningDate: string;
};

type LeaveReference = {
  id: string;
  leaveNumber: string;
  leaveType: "PAID_LEAVE" | "UNPAID_LEAVE";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
};

type AttendanceRecord = {
  id: string | null;
  status: AttendanceStatus | null;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
  leaveRequestId: string | null;
  isSandwichDay: boolean;
  lockedByApprovedLeave: boolean;
  leaveRequest: LeaveReference | null;
  markedBy: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AttendanceItem = {
  staff: StaffRecord;
  attendance: AttendanceRecord;
};

type AttendanceSummary = {
  totalStaff: number;
  marked: number;
  unmarked: number;
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  holiday: number;
};

type AttendanceApiResponse = {
  success?: boolean;
  message?: string;
  date?: string;
  statuses?: AttendanceStatus[];
  register?: AttendanceItem[];
  summary?: AttendanceSummary;
  lockedCount?: number;
};

type StaffAttendanceWorkspaceProps = {
  initialDate: string;
};

const attendanceStatuses: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "LEAVE",
  "HOLIDAY",
];

const statusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
  HOLIDAY: "Holiday",
};

const statusClasses: Record<AttendanceStatus, string> = {
  PRESENT: "border-emerald-200 bg-emerald-50 text-emerald-700",
  ABSENT: "border-red-200 bg-red-50 text-red-700",
  LATE: "border-amber-200 bg-amber-50 text-amber-800",
  HALF_DAY: "border-sky-200 bg-sky-50 text-sky-700",
  LEAVE: "border-purple-200 bg-purple-50 text-purple-700",
  HOLIDAY: "border-slate-200 bg-slate-100 text-slate-700",
};

const controlClass =
  "min-h-12 w-full rounded-2xl border border-[#DDD2E2] bg-[#FCFAFD] px-4 text-sm font-bold text-[#2D1736] outline-none transition focus:border-[#5B2A86] focus:ring-4 focus:ring-[#5B2A86]/10 disabled:cursor-not-allowed disabled:bg-[#F1EEF3] disabled:text-[#9B929E]";

const emptySummary: AttendanceSummary = {
  totalStaff: 0,
  marked: 0,
  unmarked: 0,
  present: 0,
  absent: 0,
  late: 0,
  halfDay: 0,
  leave: 0,
  holiday: 0,
};

function calculateSummary(items: AttendanceItem[]): AttendanceSummary {
  const summary = {
    ...emptySummary,
    totalStaff: items.length,
  };

  for (const item of items) {
    const status = item.attendance.status;

    if (!status) {
      summary.unmarked += 1;
      continue;
    }

    summary.marked += 1;

    if (status === "PRESENT") {
      summary.present += 1;
    } else if (status === "ABSENT") {
      summary.absent += 1;
    } else if (status === "LATE") {
      summary.late += 1;
    } else if (status === "HALF_DAY") {
      summary.halfDay += 1;
    } else if (status === "LEAVE") {
      summary.leave += 1;
    } else if (status === "HOLIDAY") {
      summary.holiday += 1;
    }
  }

  return summary;
}

function formatLongDate(dateKey: string) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateKey}T00:00:00.000Z`));
}

function escapeCsv(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function getInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "S"
  );
}

function allowsTime(status: AttendanceStatus | null) {
  return status === "PRESENT" || status === "LATE" || status === "HALF_DAY";
}

export default function StaffAttendanceWorkspace({
  initialDate,
}: StaffAttendanceWorkspaceProps) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [register, setRegister] = useState<AttendanceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "UNMARKED" | AttendanceStatus
  >("ALL");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadAttendance = useCallback(async () => {
    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch(
        `/api/admin/staff-attendance?date=${encodeURIComponent(selectedDate)}`,
        {
          method: "GET",
          cache: "no-store",
        },
      );
      const result = (await response.json()) as AttendanceApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "The staff attendance register could not be loaded.",
        );
      }

      setRegister(result.register ?? []);
    } catch (error) {
      setRegister([]);
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "The staff attendance register could not be loaded.",
      });
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    // Load the selected staff attendance register when its filters change.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAttendance();
  }, [loadAttendance]);

  const summary = useMemo(() => calculateSummary(register), [register]);

  const visibleRegister = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return register.filter((item) => {
      const matchesSearch =
        !query ||
        [
          item.staff.name,
          item.staff.staffNumber,
          item.staff.designation,
          item.staff.phone,
        ].some((value) => value.toLowerCase().includes(query));

      if (!matchesSearch) {
        return false;
      }

      if (statusFilter === "ALL") {
        return true;
      }

      if (statusFilter === "UNMARKED") {
        return item.attendance.status === null;
      }

      return item.attendance.status === statusFilter;
    });
  }, [register, searchQuery, statusFilter]);

  function updateAttendance(
    staffId: string,
    changes: Partial<AttendanceRecord>,
  ) {
    setRegister((current) =>
      current.map((item) => {
        if (
          item.staff.id !== staffId ||
          item.attendance.lockedByApprovedLeave
        ) {
          return item;
        }

        return {
          ...item,
          attendance: {
            ...item.attendance,
            ...changes,
          },
        };
      }),
    );
  }

  function changeStatus(staffId: string, status: AttendanceStatus | null) {
    const keepsTime = allowsTime(status);

    updateAttendance(staffId, {
      status,
      checkInTime: keepsTime
        ? (register.find((item) => item.staff.id === staffId)?.attendance
            .checkInTime ?? "")
        : "",
      checkOutTime: keepsTime
        ? (register.find((item) => item.staff.id === staffId)?.attendance
            .checkOutTime ?? "")
        : "",
    });
  }

  function markAllPresent() {
    setRegister((current) =>
      current.map((item) => {
        if (item.attendance.lockedByApprovedLeave) {
          return item;
        }

        return {
          ...item,
          attendance: {
            ...item.attendance,
            status: "PRESENT",
          },
        };
      }),
    );
    setMessage({
      type: "success",
      text: "All editable staff were marked present. Approved leave records remained protected. Save the register to confirm.",
    });
  }

  async function saveAttendance(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    setMessage(null);

    const entries = register
      .filter(
        (item) =>
          item.attendance.status !== null &&
          !item.attendance.lockedByApprovedLeave,
      )
      .map((item) => ({
        staffId: item.staff.id,
        status: item.attendance.status,
        checkInTime: item.attendance.checkInTime,
        checkOutTime: item.attendance.checkOutTime,
        notes: item.attendance.notes,
      }));

    if (entries.length === 0) {
      setMessage({
        type: "error",
        text: "Mark at least one editable staff attendance record before saving.",
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/staff-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          date: selectedDate,
          entries,
        }),
      });
      const result = (await response.json()) as AttendanceApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "Staff attendance could not be saved.",
        );
      }

      await loadAttendance();
      setMessage({
        type: "success",
        text: result.message ?? "Staff attendance saved successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Staff attendance could not be saved.",
      });
    } finally {
      setSaving(false);
    }
  }

  function exportAttendance() {
    if (register.length === 0) {
      setMessage({
        type: "error",
        text: "There is no staff attendance to export.",
      });
      return;
    }

    const rows = [
      [
        "Date",
        "Staff Number",
        "Staff Name",
        "Designation",
        "Status",
        "Check In",
        "Check Out",
        "Notes",
        "Approved Leave",
        "Sandwich Day",
        "Marked By",
      ],
      ...register.map((item) => [
        selectedDate,
        item.staff.staffNumber,
        item.staff.name,
        item.staff.designation,
        item.attendance.status
          ? statusLabels[item.attendance.status]
          : "Unmarked",
        item.attendance.checkInTime,
        item.attendance.checkOutTime,
        item.attendance.notes,
        item.attendance.leaveRequest?.leaveNumber ?? "",
        item.attendance.isSandwichDay ? "Yes" : "No",
        item.attendance.markedBy?.name ?? "",
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF", csv], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `staff-attendance-${selectedDate}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <form onSubmit={saveAttendance} className="space-y-7">
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
                <CalendarCheck2 aria-hidden="true" size={21} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#6A328F]">
                  Daily staff register
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                  {formatLongDate(selectedDate)}
                </h2>
              </div>
            </div>
            <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
              Mark presence, absence, late arrival, half day or holiday.
              Approved leave and sandwich days are locked automatically.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/staff/leave"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA]"
            >
              <CalendarDays aria-hidden="true" size={18} />
              Leave Manager
            </Link>
            <button
              type="button"
              onClick={exportAttendance}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA]"
            >
              <Download aria-hidden="true" size={18} />
              Export
            </button>
            <button
              type="button"
              onClick={markAllPresent}
              disabled={loading || register.length === 0}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Check aria-hidden="true" size={18} />
              Mark All Present
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-[1fr_1.2fr_1fr_auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
              Attendance date
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className={controlClass}
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
              Search staff
            </span>
            <span className="relative block">
              <Search
                aria-hidden="true"
                size={17}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#918795]"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Name, role or staff number"
                className={`${controlClass} pl-11`}
              />
            </span>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
              Status filter
            </span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "ALL" | "UNMARKED" | AttendanceStatus,
                )
              }
              className={`${controlClass} appearance-none`}
            >
              <option value="ALL">All staff</option>
              <option value="UNMARKED">Unmarked</option>
              {attendanceStatuses.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => void loadAttendance()}
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

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={UsersRound}
          label="Total Staff"
          value={summary.totalStaff}
          detail={`${summary.marked} marked • ${summary.unmarked} unmarked`}
          tone="purple"
        />
        <SummaryCard
          icon={UserCheck}
          label="Present Today"
          value={summary.present}
          detail={`${summary.late} late • ${summary.halfDay} half day`}
          tone="green"
        />
        <SummaryCard
          icon={UserMinus}
          label="Absent"
          value={summary.absent}
          detail={`${summary.leave} on leave`}
          tone="red"
        />
        <SummaryCard
          icon={FileLock2}
          label="Protected Leave"
          value={
            register.filter((item) => item.attendance.lockedByApprovedLeave)
              .length
          }
          detail="Cannot be overwritten"
          tone="amber"
        />
      </section>

      <section className="overflow-hidden rounded-[30px] border border-[#E7DFEB] bg-white shadow-[0_18px_55px_rgba(45,23,54,0.06)]">
        <div className="flex flex-col gap-3 border-b border-[#EEE8F1] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div>
            <div className="flex items-center gap-3">
              <UsersRound
                aria-hidden="true"
                size={22}
                className="text-[#5B2A86]"
              />
              <h2 className="text-xl font-black text-[#2D1736]">
                Staff Attendance
              </h2>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#817684]">
              Showing {visibleRegister.length} of {register.length} staff
              members.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F2ECF5] px-3.5 py-2 text-xs font-black text-[#5B2A86]">
            <ShieldCheck aria-hidden="true" size={15} />
            Leave-safe register
          </div>
        </div>

        {loading && register.length === 0 ? (
          <div className="flex min-h-64 items-center justify-center gap-3 p-8 text-sm font-black text-[#6A328F]">
            <Loader2 aria-hidden="true" size={21} className="animate-spin" />
            Loading staff attendance…
          </div>
        ) : visibleRegister.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center px-5 py-10 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#F1E7F6] text-[#5B2A86]">
              <Search aria-hidden="true" size={24} />
            </span>
            <h3 className="mt-4 text-lg font-black text-[#2D1736]">
              No matching staff found
            </h3>
            <p className="mt-2 max-w-lg text-sm font-semibold leading-6 text-[#817684]">
              Change the search or status filter, or select another attendance
              date.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEE8F1]">
            {visibleRegister.map((item) => (
              <AttendanceRow
                key={item.staff.id}
                item={item}
                onStatusChange={(status) => changeStatus(item.staff.id, status)}
                onChange={(changes) => updateAttendance(item.staff.id, changes)}
              />
            ))}
          </div>
        )}

        <div className="flex flex-col gap-4 border-t border-[#EEE8F1] bg-[#FBF9FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-7">
          <div className="flex items-start gap-3">
            <Sparkles
              aria-hidden="true"
              size={19}
              className="mt-0.5 shrink-0 text-[#6A328F]"
            />
            <p className="max-w-2xl text-sm font-semibold leading-6 text-[#817684]">
              Approved leave is locked. Correct or cancel it from Leave Manager
              before changing that day’s attendance.
            </p>
          </div>

          <button
            type="submit"
            disabled={saving || loading || register.length === 0}
            className="inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)] transition hover:bg-[#4B2270] disabled:cursor-wait disabled:opacity-50"
          >
            {saving ? (
              <Loader2 aria-hidden="true" size={19} className="animate-spin" />
            ) : (
              <Save aria-hidden="true" size={19} />
            )}
            {saving ? "Saving Attendance…" : "Save Attendance"}
          </button>
        </div>
      </section>
    </form>
  );
}

type SummaryCardProps = {
  icon: typeof UsersRound;
  label: string;
  value: number;
  detail: string;
  tone: "purple" | "green" | "red" | "amber";
};

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  tone,
}: SummaryCardProps) {
  const toneClass = {
    purple: "bg-[#F1E7F6] text-[#5B2A86]",
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-600",
    amber: "bg-amber-50 text-amber-700",
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
          className={`flex h-11 w-11 items-center justify-center rounded-2xl ${toneClass}`}
        >
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#817684]">{detail}</p>
    </article>
  );
}

type AttendanceRowProps = {
  item: AttendanceItem;
  onStatusChange: (status: AttendanceStatus | null) => void;
  onChange: (changes: Partial<AttendanceRecord>) => void;
};

function AttendanceRow({ item, onStatusChange, onChange }: AttendanceRowProps) {
  const { staff, attendance } = item;
  const locked = attendance.lockedByApprovedLeave;
  const showTime = allowsTime(attendance.status);

  return (
    <article
      className={[
        "p-5 transition sm:p-6",
        locked ? "bg-purple-50/45" : "hover:bg-[#FCFAFD]",
      ].join(" ")}
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(240px,0.9fr)_minmax(190px,0.55fr)_minmax(280px,0.8fr)_minmax(220px,1fr)] xl:items-end">
        <div className="flex min-w-0 items-start gap-3 xl:self-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#5B2A86] text-sm font-black text-white shadow-[0_8px_22px_rgba(91,42,134,0.18)]">
            {getInitials(staff.name)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-base font-black text-[#2D1736]">
                {staff.name}
              </h3>
              {attendance.status ? (
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] ${statusClasses[attendance.status]}`}
                >
                  {statusLabels[attendance.status]}
                </span>
              ) : (
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-slate-500">
                  Unmarked
                </span>
              )}
            </div>
            <p className="mt-1 text-sm font-semibold text-[#817684]">
              {staff.designation}
            </p>
            <p className="mt-1 text-xs font-bold text-[#9A8F9D]">
              {staff.staffNumber}
            </p>
          </div>
        </div>

        {locked ? (
          <div className="xl:col-span-3">
            <div className="flex flex-col gap-3 rounded-[22px] border border-purple-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <FileLock2
                  aria-hidden="true"
                  size={20}
                  className="mt-0.5 shrink-0 text-purple-700"
                />
                <div>
                  <p className="font-black text-purple-950">
                    {attendance.isSandwichDay
                      ? "Protected sandwich leave"
                      : "Protected approved leave"}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-purple-900/70">
                    {attendance.leaveRequest?.leaveNumber ??
                      "Approved leave request"}
                    {attendance.leaveRequest?.leaveType === "PAID_LEAVE"
                      ? " • Paid leave"
                      : " • Unpaid leave"}
                  </p>
                </div>
              </div>
              <Link
                href="/admin/staff/leave"
                className="inline-flex min-h-10 shrink-0 items-center justify-center rounded-xl bg-purple-700 px-4 text-xs font-black text-white transition hover:bg-purple-800"
              >
                Open Leave Record
              </Link>
            </div>
          </div>
        ) : (
          <>
            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
                Status
              </span>
              <select
                value={attendance.status ?? ""}
                onChange={(event) =>
                  onStatusChange(
                    event.target.value
                      ? (event.target.value as AttendanceStatus)
                      : null,
                  )
                }
                className={`${controlClass} appearance-none`}
              >
                <option value="">Select status</option>
                {attendanceStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
                  Check in
                </span>
                <input
                  type="time"
                  value={attendance.checkInTime}
                  onChange={(event) =>
                    onChange({
                      checkInTime: event.target.value,
                    })
                  }
                  disabled={!showTime}
                  className={controlClass}
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
                  Check out
                </span>
                <input
                  type="time"
                  value={attendance.checkOutTime}
                  onChange={(event) =>
                    onChange({
                      checkOutTime: event.target.value,
                    })
                  }
                  disabled={!showTime}
                  className={controlClass}
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
                Notes
              </span>
              <input
                type="text"
                value={attendance.notes}
                onChange={(event) => onChange({ notes: event.target.value })}
                placeholder="Optional attendance note"
                className={controlClass}
              />
            </label>
          </>
        )}
      </div>
    </article>
  );
}
