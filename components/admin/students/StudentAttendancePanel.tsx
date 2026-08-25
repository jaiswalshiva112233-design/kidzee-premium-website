"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  History,
  MinusCircle,
  Palmtree,
  TrendingUp,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "LEAVE"
  | "HOLIDAY";

export type StudentAttendanceRecord = {
  id: string;
  attendanceDate: string | Date;
  status: AttendanceStatus;
  checkInAt: string | Date | null;
  checkOutAt: string | Date | null;
  notes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

type StudentAttendancePanelProps = {
  studentId: string;
  studentName: string;
  records: StudentAttendanceRecord[];
};

type MonthOption = {
  key: string;
  year: number;
  month: number;
  label: string;
};

const statusLabels: Record<AttendanceStatus, string> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
  HOLIDAY: "Holiday",
};

const statusStyles: Record<
  AttendanceStatus,
  {
    badge: string;
    calendar: string;
    dot: string;
  }
> = {
  PRESENT: {
    badge:
      "border-green-200 bg-green-50 text-green-700",
    calendar:
      "border-green-200 bg-green-50 text-green-700",
    dot: "bg-green-500",
  },

  ABSENT: {
    badge: "border-red-200 bg-red-50 text-red-700",
    calendar:
      "border-red-200 bg-red-50 text-red-700",
    dot: "bg-red-500",
  },

  LATE: {
    badge:
      "border-amber-200 bg-amber-50 text-amber-700",
    calendar:
      "border-amber-200 bg-amber-50 text-amber-700",
    dot: "bg-amber-500",
  },

  HALF_DAY: {
    badge:
      "border-orange-200 bg-orange-50 text-orange-700",
    calendar:
      "border-orange-200 bg-orange-50 text-orange-700",
    dot: "bg-orange-500",
  },

  LEAVE: {
    badge:
      "border-blue-200 bg-blue-50 text-blue-700",
    calendar:
      "border-blue-200 bg-blue-50 text-blue-700",
    dot: "bg-blue-500",
  },

  HOLIDAY: {
    badge:
      "border-purple-200 bg-purple-50 text-purple-700",
    calendar:
      "border-purple-200 bg-purple-50 text-purple-700",
    dot: "bg-purple-500",
  },
};

const weekdayLabels = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

function toDate(value: string | Date) {
  return value instanceof Date
    ? value
    : new Date(value);
}

function createDateKey(value: string | Date) {
  const date = toDate(value);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function createMonthKey(value: string | Date) {
  const dateKey = createDateKey(value);

  return dateKey.slice(0, 7);
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(toDate(value));
}

function formatTime(value: string | Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(toDate(value));
}

function getIndiaToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function getCurrentMonth() {
  return getIndiaToday().slice(0, 7);
}

function createMonthOptions(
  records: StudentAttendanceRecord[],
) {
  const monthKeys = new Set<string>();

  monthKeys.add(getCurrentMonth());

  records.forEach((record) => {
    monthKeys.add(
      createMonthKey(record.attendanceDate),
    );
  });

  const options: MonthOption[] = Array.from(
    monthKeys,
  ).map((key) => {
    const [year, month] = key.split("-").map(Number);

    const date = new Date(
      Date.UTC(year, month - 1, 1),
    );

    return {
      key,
      year,
      month,
      label: new Intl.DateTimeFormat("en-IN", {
        month: "long",
        year: "numeric",
        timeZone: "UTC",
      }).format(date),
    };
  });

  return options.sort((first, second) =>
    second.key.localeCompare(first.key),
  );
}

function createCalendarDays(
  year: number,
  month: number,
) {
  const firstDay = new Date(
    Date.UTC(year, month - 1, 1),
  );

  const numberOfDays = new Date(
    Date.UTC(year, month, 0),
  ).getUTCDate();

  const rawDay = firstDay.getUTCDay();

  const leadingEmptyDays =
    rawDay === 0 ? 6 : rawDay - 1;

  const days: Array<number | null> = [];

  for (
    let index = 0;
    index < leadingEmptyDays;
    index += 1
  ) {
    days.push(null);
  }

  for (let day = 1; day <= numberOfDays; day += 1) {
    days.push(day);
  }

  while (days.length % 7 !== 0) {
    days.push(null);
  }

  return days;
}

function calculateAttendancePercentage(
  records: StudentAttendanceRecord[],
) {
  const consideredRecords = records.filter(
    (record) => record.status !== "HOLIDAY",
  );

  if (consideredRecords.length === 0) {
    return 0;
  }

  const attended = consideredRecords.reduce(
    (total, record) => {
      if (record.status === "PRESENT" || record.status === "LATE") {
        return total + 1;
      }

      return record.status === "HALF_DAY" ? total + 0.5 : total;
    },
    0,
  );

  return Math.round(
    (attended / consideredRecords.length) * 100,
  );
}

export default function StudentAttendancePanel({
  studentId,
  studentName,
  records,
}: StudentAttendancePanelProps) {
  const monthOptions = useMemo(
    () => createMonthOptions(records),
    [records],
  );

  const [selectedMonthKey, setSelectedMonthKey] =
    useState(monthOptions[0]?.key ?? getCurrentMonth());

  const selectedMonth =
    monthOptions.find(
      (option) => option.key === selectedMonthKey,
    ) ??
    monthOptions[0] ?? {
      key: getCurrentMonth(),
      year: Number(getCurrentMonth().slice(0, 4)),
      month: Number(getCurrentMonth().slice(5, 7)),
      label: "",
    };

  const selectedMonthRecords = useMemo(
    () =>
      records
        .filter(
          (record) =>
            createMonthKey(record.attendanceDate) ===
            selectedMonth.key,
        )
        .sort(
          (first, second) =>
            toDate(second.attendanceDate).getTime() -
            toDate(first.attendanceDate).getTime(),
        ),
    [records, selectedMonth.key],
  );

  const calendarRecordMap = useMemo(
    () =>
      new Map(
        selectedMonthRecords.map((record) => [
          createDateKey(record.attendanceDate),
          record,
        ]),
      ),
    [selectedMonthRecords],
  );

  const calendarDays = useMemo(
    () =>
      createCalendarDays(
        selectedMonth.year,
        selectedMonth.month,
      ),
    [selectedMonth.month, selectedMonth.year],
  );

  const overallPercentage =
    calculateAttendancePercentage(records);

  const monthlyPercentage =
    calculateAttendancePercentage(
      selectedMonthRecords,
    );

  const counts = useMemo(() => {
    const result = {
      present: 0,
      absent: 0,
      late: 0,
      halfDay: 0,
      leave: 0,
      holiday: 0,
    };

    selectedMonthRecords.forEach((record) => {
      switch (record.status) {
        case "PRESENT":
          result.present += 1;
          break;

        case "ABSENT":
          result.absent += 1;
          break;

        case "LATE":
          result.late += 1;
          break;

        case "HALF_DAY":
          result.halfDay += 1;
          break;

        case "LEAVE":
          result.leave += 1;
          break;

        case "HOLIDAY":
          result.holiday += 1;
          break;
      }
    });

    return result;
  }, [selectedMonthRecords]);

  const recentRecords = useMemo(
    () =>
      [...records]
        .sort(
          (first, second) =>
            toDate(second.attendanceDate).getTime() -
            toDate(first.attendanceDate).getTime(),
        )
        .slice(0, 10),
    [records],
  );

  function moveMonth(direction: -1 | 1) {
    const currentIndex = monthOptions.findIndex(
      (option) => option.key === selectedMonth.key,
    );

    const nextIndex = currentIndex - direction;

    const nextOption = monthOptions[nextIndex];

    if (nextOption) {
      setSelectedMonthKey(nextOption.key);
    }
  }

  const selectedIndex = monthOptions.findIndex(
    (option) => option.key === selectedMonth.key,
  );

  const canMovePrevious =
    selectedIndex < monthOptions.length - 1;

  const canMoveNext = selectedIndex > 0;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AttendanceSummaryCard
          label="Overall attendance"
          value={`${overallPercentage}%`}
          helper={`${records.length} attendance records`}
          icon={TrendingUp}
          accent="bg-[#F3EAF8] text-[#5B2A86]"
        />

        <AttendanceSummaryCard
          label="Monthly attendance"
          value={`${monthlyPercentage}%`}
          helper={selectedMonth.label}
          icon={CalendarCheck2}
          accent="bg-green-50 text-green-700"
        />

        <AttendanceSummaryCard
          label="Present this month"
          value={counts.present.toString()}
          helper={`${counts.late} late arrival${
            counts.late === 1 ? "" : "s"
          }`}
          icon={CheckCircle2}
          accent="bg-green-50 text-green-700"
        />

        <AttendanceSummaryCard
          label="Absent or leave"
          value={(
            counts.absent + counts.leave
          ).toString()}
          helper={`${counts.halfDay} half day${
            counts.halfDay === 1 ? "" : "s"
          }`}
          icon={XCircle}
          accent="bg-red-50 text-red-700"
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
          <div className="flex flex-col gap-4 border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                Monthly calendar
              </p>

              <h2 className="mt-2 text-xl font-black text-[#2D1736]">
                {selectedMonth.label}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!canMovePrevious}
                onClick={() => moveMonth(-1)}
                aria-label="Previous attendance month"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDD2E2] bg-white text-[#5B2A86] transition hover:bg-[#F3EAF8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft
                  aria-hidden="true"
                  size={18}
                />
              </button>

              <select
                value={selectedMonth.key}
                onChange={(event) =>
                  setSelectedMonthKey(
                    event.target.value,
                  )
                }
                className="min-h-10 rounded-xl border border-[#DDD2E2] bg-white px-3 text-xs font-black text-[#2D1736] outline-none focus:border-[#5B2A86]"
              >
                {monthOptions.map((option) => (
                  <option
                    key={option.key}
                    value={option.key}
                  >
                    {option.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!canMoveNext}
                onClick={() => moveMonth(1)}
                aria-label="Next attendance month"
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#DDD2E2] bg-white text-[#5B2A86] transition hover:bg-[#F3EAF8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight
                  aria-hidden="true"
                  size={18}
                />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {weekdayLabels.map((weekday) => (
                <div
                  key={weekday}
                  className="py-2 text-center text-[9px] font-black uppercase tracking-[0.08em] text-[#817684] sm:text-xs"
                >
                  {weekday}
                </div>
              ))}

              {calendarDays.map((day, index) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-16 rounded-xl bg-transparent sm:min-h-20"
                    />
                  );
                }

                const dateKey = `${selectedMonth.year}-${String(
                  selectedMonth.month,
                ).padStart(2, "0")}-${String(day).padStart(
                  2,
                  "0",
                )}`;

                const record =
                  calendarRecordMap.get(dateKey);

                const isToday =
                  dateKey === getIndiaToday();

                return (
                  <article
                    key={dateKey}
                    title={
                      record
                        ? `${statusLabels[record.status]}${
                            record.notes
                              ? ` — ${record.notes}`
                              : ""
                          }`
                        : "No attendance record"
                    }
                    className={[
                      "relative min-h-16 rounded-xl border p-2 transition sm:min-h-20 sm:p-3",
                      record
                        ? statusStyles[record.status]
                            .calendar
                        : "border-[#EEE8F1] bg-[#FCFAFD] text-[#817684]",
                      isToday
                        ? "ring-2 ring-[#5B2A86] ring-offset-1"
                        : "",
                    ].join(" ")}
                  >
                    <p className="text-xs font-black sm:text-sm">
                      {day}
                    </p>

                    {record ? (
                      <>
                        <span
                          className={`absolute right-2 top-2 h-2 w-2 rounded-full ${
                            statusStyles[record.status].dot
                          }`}
                        />

                        <p className="mt-2 hidden text-[9px] font-black uppercase tracking-[0.05em] sm:block">
                          {statusLabels[record.status]}
                        </p>
                      </>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {(
                Object.keys(
                  statusLabels,
                ) as AttendanceStatus[]
              ).map((status) => (
                <span
                  key={status}
                  className="inline-flex items-center gap-2 text-[10px] font-black text-[#625768]"
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      statusStyles[status].dot
                    }`}
                  />

                  {statusLabels[status]}
                </span>
              ))}
            </div>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Monthly summary
            </p>

            <h2 className="mt-2 text-lg font-black text-[#2D1736]">
              {selectedMonth.label}
            </h2>

            <div className="mt-5 space-y-3">
              <StatusCount
                label="Present"
                value={counts.present}
                icon={CheckCircle2}
                accent="bg-green-50 text-green-700"
              />

              <StatusCount
                label="Absent"
                value={counts.absent}
                icon={XCircle}
                accent="bg-red-50 text-red-700"
              />

              <StatusCount
                label="Late"
                value={counts.late}
                icon={Clock3}
                accent="bg-amber-50 text-amber-700"
              />

              <StatusCount
                label="Half Day"
                value={counts.halfDay}
                icon={MinusCircle}
                accent="bg-orange-50 text-orange-700"
              />

              <StatusCount
                label="Leave"
                value={counts.leave}
                icon={Palmtree}
                accent="bg-blue-50 text-blue-700"
              />

              <StatusCount
                label="Holiday"
                value={counts.holiday}
                icon={CalendarDays}
                accent="bg-purple-50 text-purple-700"
              />
            </div>
          </section>

          <Link
            href={`/admin/attendance?studentId=${encodeURIComponent(
              studentId,
            )}`}
            className="group flex items-center justify-between gap-4 rounded-[24px] bg-[#2D1736] p-5 text-white shadow-[0_18px_48px_rgba(45,23,54,0.16)] transition hover:-translate-y-0.5"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#F6C84B]">
                Daily register
              </p>

              <p className="mt-2 text-base font-black">
                Open attendance
              </p>

              <p className="mt-1 text-xs font-semibold leading-5 text-white/60">
                Mark or update attendance for{" "}
                {studentName}.
              </p>
            </div>

            <ArrowRight
              aria-hidden="true"
              size={19}
              className="shrink-0 text-[#F6C84B] transition group-hover:translate-x-1"
            />
          </Link>
        </aside>
      </section>

      <section className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
        <div className="flex flex-col gap-3 border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Attendance history
            </p>

            <h2 className="mt-2 text-xl font-black text-[#2D1736]">
              Recent attendance records
            </h2>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[#F3EAF8] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#5B2A86]">
            <History
              aria-hidden="true"
              size={13}
            />

            Last {recentRecords.length}
          </span>
        </div>

        {recentRecords.length === 0 ? (
          <div className="flex min-h-[260px] flex-col items-center justify-center px-5 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F3EAF8] text-[#5B2A86]">
              <CalendarCheck2
                aria-hidden="true"
                size={28}
              />
            </span>

            <h3 className="mt-5 text-xl font-black text-[#2D1736]">
              No attendance history
            </h3>

            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
              Attendance records will appear here after
              the student is marked in the daily register.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEE8F1]">
            {recentRecords.map((record) => (
              <article
                key={record.id}
                className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_150px_150px] sm:items-center sm:p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black text-[#2D1736]">
                      {formatDate(
                        record.attendanceDate,
                      )}
                    </p>

                    <span
                      className={[
                        "rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em]",
                        statusStyles[record.status]
                          .badge,
                      ].join(" ")}
                    >
                      {statusLabels[record.status]}
                    </span>
                  </div>

                  <p className="mt-2 text-xs font-semibold leading-5 text-[#817684]">
                    {record.notes ||
                      "No attendance note"}
                  </p>
                </div>

                <HistoryValue
                  label="Check-in"
                  value={formatTime(
                    record.checkInAt,
                  )}
                />

                <HistoryValue
                  label="Check-out"
                  value={formatTime(
                    record.checkOutAt,
                  )}
                />
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

type AttendanceSummaryCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: typeof CalendarCheck2;
  accent: string;
};

function AttendanceSummaryCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: AttendanceSummaryCardProps) {
  return (
    <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}
      >
        <Icon
          aria-hidden="true"
          size={20}
        />
      </span>

      <p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-[#2D1736]">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold text-[#928896]">
        {helper}
      </p>
    </article>
  );
}

type StatusCountProps = {
  label: string;
  value: number;
  icon: typeof CalendarCheck2;
  accent: string;
};

function StatusCount({
  label,
  value,
  icon: Icon,
  accent,
}: StatusCountProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-[#FAF8FC] p-3">
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon
          aria-hidden="true"
          size={16}
        />
      </span>

      <p className="min-w-0 flex-1 text-sm font-bold text-[#625768]">
        {label}
      </p>

      <p className="text-lg font-black text-[#2D1736]">
        {value}
      </p>
    </div>
  );
}

type HistoryValueProps = {
  label: string;
  value: string;
};

function HistoryValue({
  label,
  value,
}: HistoryValueProps) {
  return (
    <div className="rounded-2xl bg-[#FAF8FC] p-3">
      <p className="text-[9px] font-black uppercase tracking-[0.09em] text-[#8B808F]">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-[#2D1736]">
        {value}
      </p>
    </div>
  );
}
