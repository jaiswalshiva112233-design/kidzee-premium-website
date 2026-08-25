"use client";

import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RotateCcw,
  Save,
  Search,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

type AttendanceStatus =
  | "PRESENT"
  | "ABSENT"
  | "LATE"
  | "HALF_DAY"
  | "LEAVE"
  | "HOLIDAY";

type Programme =
  | "PLAYGROUP"
  | "NURSERY"
  | "JUNIOR_KG"
  | "SENIOR_KG"
  | "DAYCARE";

type Guardian = {
  id: string;
  name: string;
  phone: string;
  relationship: string;
};

type AttendanceStudent = {
  id: string;
  studentNumber: string;
  name: string;
  preferredName: string | null;
  programme: Programme;
  profilePhotoUrl: string | null;
  primaryGuardian: Guardian | null;
};

type AttendanceRecord = {
  id: string | null;
  status: AttendanceStatus | null;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
  markedBy: {
    id: string;
    name: string;
    role: string;
  } | null;
  createdAt: string | null;
  updatedAt: string | null;
};

type AttendanceRegisterItem = {
  student: AttendanceStudent;
  attendance: AttendanceRecord;
};

type AttendanceSummary = {
  totalStudents: number;
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
  register?: AttendanceRegisterItem[];
  summary?: AttendanceSummary;
};

type EditableAttendanceItem = {
  student: AttendanceStudent;
  attendanceId: string | null;
  status: AttendanceStatus | null;
  checkInTime: string;
  checkOutTime: string;
  notes: string;
  markedBy: AttendanceRecord["markedBy"];
  updatedAt: string | null;
};

type AttendanceRegisterProps = {
  initialDate?: string;
  initialStudentId?: string;
};

const programmeLabels: Record<Programme, string> = {
  PLAYGROUP: "Playgroup",
  NURSERY: "Nursery",
  JUNIOR_KG: "Junior KG",
  SENIOR_KG: "Senior KG",
  DAYCARE: "Daycare",
};

const attendanceStatusLabels: Record<
  AttendanceStatus,
  string
> = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  HALF_DAY: "Half Day",
  LEAVE: "Leave",
  HOLIDAY: "Holiday",
};

const attendanceStatusStyles: Record<
  AttendanceStatus,
  {
    button: string;
    badge: string;
  }
> = {
  PRESENT: {
    button:
      "border-green-200 bg-green-50 text-green-700 hover:bg-green-100",
    badge:
      "border-green-200 bg-green-50 text-green-700",
  },
  ABSENT: {
    button:
      "border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
    badge:
      "border-red-200 bg-red-50 text-red-700",
  },
  LATE: {
    button:
      "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100",
    badge:
      "border-amber-200 bg-amber-50 text-amber-700",
  },
  HALF_DAY: {
    button:
      "border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100",
    badge:
      "border-orange-200 bg-orange-50 text-orange-700",
  },
  LEAVE: {
    button:
      "border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100",
    badge:
      "border-blue-200 bg-blue-50 text-blue-700",
  },
  HOLIDAY: {
    button:
      "border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100",
    badge:
      "border-purple-200 bg-purple-50 text-purple-700",
  },
};

const attendanceStatuses: AttendanceStatus[] = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "LEAVE",
  "HOLIDAY",
];

function getIndiaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function formatDisplayDate(value: string) {
  const [year, month, day] = value
    .split("-")
    .map(Number);

  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function canUseTimes(
  status: AttendanceStatus | null,
) {
  return (
    status === "PRESENT" ||
    status === "LATE" ||
    status === "HALF_DAY"
  );
}

function createEditableRegister(
  items: AttendanceRegisterItem[],
): EditableAttendanceItem[] {
  return items.map((item) => ({
    student: item.student,
    attendanceId: item.attendance.id,
    status: item.attendance.status,
    checkInTime: item.attendance.checkInTime,
    checkOutTime: item.attendance.checkOutTime,
    notes: item.attendance.notes,
    markedBy: item.attendance.markedBy,
    updatedAt: item.attendance.updatedAt,
  }));
}

function calculateLocalSummary(
  register: EditableAttendanceItem[],
): AttendanceSummary {
  const summary: AttendanceSummary = {
    totalStudents: register.length,
    marked: 0,
    unmarked: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    holiday: 0,
  };

  register.forEach((item) => {
    if (!item.status) {
      summary.unmarked += 1;
      return;
    }

    summary.marked += 1;

    switch (item.status) {
      case "PRESENT":
        summary.present += 1;
        break;

      case "ABSENT":
        summary.absent += 1;
        break;

      case "LATE":
        summary.late += 1;
        break;

      case "HALF_DAY":
        summary.halfDay += 1;
        break;

      case "LEAVE":
        summary.leave += 1;
        break;

      case "HOLIDAY":
        summary.holiday += 1;
        break;
    }
  });

  return summary;
}

export default function AttendanceRegister({
  initialDate,
  initialStudentId,
}: AttendanceRegisterProps) {
  const [selectedDate, setSelectedDate] =
    useState(initialDate ?? getIndiaDateKey());

  const [register, setRegister] = useState<
    EditableAttendanceItem[]
  >([]);

  const [savedRegister, setSavedRegister] =
    useState<EditableAttendanceItem[]>([]);

  const [search, setSearch] = useState("");

  const [focusedStudentId, setFocusedStudentId] =
    useState(initialStudentId ?? "");

  const [programmeFilter, setProgrammeFilter] =
    useState<Programme | "ALL">("ALL");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const loadAttendance = useCallback(
    async (date: string) => {
      setLoading(true);
      setError("");
      setSuccessMessage("");

      try {
        const response = await fetch(
          `/api/admin/attendance?date=${encodeURIComponent(
            date,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as AttendanceApiResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.register
        ) {
          throw new Error(
            result.message ??
              "Unable to load attendance.",
          );
        }

        const editableRegister =
          createEditableRegister(result.register);

        setRegister(editableRegister);
        setSavedRegister(editableRegister);
      } catch (loadError) {
        setRegister([]);
        setSavedRegister([]);

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load attendance.",
        );
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    // Load the selected day's register whenever the date changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAttendance(selectedDate);
  }, [loadAttendance, selectedDate]);

  const summary = useMemo(
    () => calculateLocalSummary(register),
    [register],
  );

  const availableProgrammes = useMemo(() => {
    const programmes = new Set<Programme>();

    register.forEach((item) => {
      programmes.add(item.student.programme);
    });

    return Array.from(programmes);
  }, [register]);

  const filteredRegister = useMemo(() => {
    const normalizedSearch = search
      .trim()
      .toLowerCase();

    return register.filter((item) => {
      if (
        focusedStudentId &&
        item.student.id !== focusedStudentId
      ) {
        return false;
      }

      const matchesProgramme =
        programmeFilter === "ALL" ||
        item.student.programme === programmeFilter;

      if (!matchesProgramme) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      const searchableText = [
        item.student.name,
        item.student.preferredName ?? "",
        item.student.studentNumber,
        item.student.primaryGuardian?.name ?? "",
        item.student.primaryGuardian?.phone ?? "",
        programmeLabels[item.student.programme],
      ]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [focusedStudentId, programmeFilter, register, search]);

  const hasChanges = useMemo(() => {
    if (register.length !== savedRegister.length) {
      return true;
    }

    return register.some((item, index) => {
      const saved = savedRegister[index];

      if (!saved) {
        return true;
      }

      return (
        item.student.id !== saved.student.id ||
        item.status !== saved.status ||
        item.checkInTime !== saved.checkInTime ||
        item.checkOutTime !== saved.checkOutTime ||
        item.notes !== saved.notes
      );
    });
  }, [register, savedRegister]);

  function updateStudentAttendance(
    studentId: string,
    changes: Partial<
      Pick<
        EditableAttendanceItem,
        | "status"
        | "checkInTime"
        | "checkOutTime"
        | "notes"
      >
    >,
  ) {
    setRegister((current) =>
      current.map((item) => {
        if (item.student.id !== studentId) {
          return item;
        }

        const nextStatus =
          changes.status !== undefined
            ? changes.status
            : item.status;

        const shouldKeepTimes =
          canUseTimes(nextStatus);

        return {
          ...item,
          ...changes,
          checkInTime: shouldKeepTimes
            ? changes.checkInTime ??
              item.checkInTime
            : "",
          checkOutTime: shouldKeepTimes
            ? changes.checkOutTime ??
              item.checkOutTime
            : "",
        };
      }),
    );

    setError("");
    setSuccessMessage("");
  }

  function setStatusForAll(
    status: AttendanceStatus,
  ) {
    setRegister((current) =>
      current.map((item) => ({
        ...item,
        status,
        checkInTime: canUseTimes(status)
          ? item.checkInTime
          : "",
        checkOutTime: canUseTimes(status)
          ? item.checkOutTime
          : "",
      })),
    );

    setError("");
    setSuccessMessage("");
  }

  function setVisibleStudentsStatus(
    status: AttendanceStatus,
  ) {
    const visibleStudentIds = new Set(
      filteredRegister.map(
        (item) => item.student.id,
      ),
    );

    setRegister((current) =>
      current.map((item) => {
        if (!visibleStudentIds.has(item.student.id)) {
          return item;
        }

        return {
          ...item,
          status,
          checkInTime: canUseTimes(status)
            ? item.checkInTime
            : "",
          checkOutTime: canUseTimes(status)
            ? item.checkOutTime
            : "",
        };
      }),
    );

    setError("");
    setSuccessMessage("");
  }

  function resetChanges() {
    setRegister(savedRegister);
    setError("");
    setSuccessMessage("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const unmarkedStudents = register.filter(
      (item) => !item.status,
    );

    if (unmarkedStudents.length > 0) {
      setError(
        `Please mark attendance for all students. ${unmarkedStudents.length} student${
          unmarkedStudents.length === 1 ? " is" : "s are"
        } still unmarked.`,
      );

      return;
    }

    for (const item of register) {
      if (
        item.checkInTime &&
        item.checkOutTime &&
        item.checkOutTime <= item.checkInTime
      ) {
        setError(
          `Check-out time must be later than check-in time for ${item.student.name}.`,
        );

        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        "/api/admin/attendance",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            date: selectedDate,

            entries: register.map((item) => ({
              studentId: item.student.id,
              status: item.status,
              checkInTime: item.checkInTime,
              checkOutTime: item.checkOutTime,
              notes: item.notes.trim(),
            })),
          }),
        },
      );

      const result =
        (await response.json()) as AttendanceApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "Unable to save attendance.",
        );
      }

      setSavedRegister(
        register.map((item) => ({
          ...item,
        })),
      );

      setSuccessMessage(
        result.message ??
          "Attendance saved successfully.",
      );

      await loadAttendance(selectedDate);

      setSuccessMessage(
        result.message ??
          "Attendance saved successfully.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save attendance.",
      );
    } finally {
      setSaving(false);
    }
  }

  function handleDateChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const nextDate = event.target.value;

    if (!nextDate) {
      return;
    }

    if (
      hasChanges &&
      !window.confirm(
        "You have unsaved attendance changes. Change the date and discard them?",
      )
    ) {
      return;
    }

    setSelectedDate(nextDate);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <section className="overflow-hidden rounded-[30px] border border-[#E9E2ED] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]">
        <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <CalendarDays
                  aria-hidden="true"
                  size={22}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                  Daily register
                </p>

                <h2 className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl">
                  Student Attendance
                </h2>

                <p className="mt-1 text-sm font-semibold text-[#817684]">
                  {formatDisplayDate(selectedDate)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block">
                <span className="text-xs font-black uppercase tracking-[0.08em] text-[#817684]">
                  Attendance date
                </span>

                <span className="mt-2 flex min-h-12 w-full min-w-0 rounded-2xl border border-[#DCCFE4] bg-white px-3 py-2 sm:w-52">
                  <input
                    type="date"
                    value={selectedDate}
                    max={getIndiaDateKey()}
                    disabled={loading || saving}
                    onChange={handleDateChange}
                    className="block w-full min-w-0 border-0 bg-transparent p-0 text-sm font-black text-[#2D1736] outline-none"
                  />
                </span>
              </label>

              {focusedStudentId ? (
                <button
                  type="button"
                  onClick={() => setFocusedStudentId("")}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DCCFE4] bg-[#F3EAF8] px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#E9DDF0]"
                >
                  Show all students
                </button>
              ) : null}

              <button
                type="button"
                disabled={
                  loading || saving || !hasChanges
                }
                onClick={resetChanges}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F3EAF8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw
                  aria-hidden="true"
                  size={17}
                />
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
            <SummaryCard
              label="Students"
              value={summary.totalStudents}
              icon={UsersRound}
              accent="bg-[#F3EAF8] text-[#5B2A86]"
            />

            <SummaryCard
              label="Marked"
              value={summary.marked}
              icon={CheckCircle2}
              accent="bg-green-50 text-green-700"
            />

            <SummaryCard
              label="Unmarked"
              value={summary.unmarked}
              icon={Clock3}
              accent="bg-slate-100 text-slate-700"
            />

            <SummaryCard
              label="Present"
              value={summary.present}
              icon={Check}
              accent="bg-green-50 text-green-700"
            />

            <SummaryCard
              label="Absent"
              value={summary.absent}
              icon={X}
              accent="bg-red-50 text-red-700"
            />

            <SummaryCard
              label="Late"
              value={summary.late}
              icon={Clock3}
              accent="bg-amber-50 text-amber-700"
            />

            <SummaryCard
              label="Half Day"
              value={summary.halfDay}
              icon={Clock3}
              accent="bg-orange-50 text-orange-700"
            />

            <SummaryCard
              label="Leave"
              value={
                summary.leave + summary.holiday
              }
              icon={CalendarDays}
              accent="bg-blue-50 text-blue-700"
            />
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Quick marking
            </p>

            <h3 className="mt-2 text-lg font-black text-[#2D1736]">
              Mark multiple students
            </h3>

            <p className="mt-1 text-sm font-semibold text-[#817684]">
              Apply a status to all students or only the
              currently filtered list.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={loading || saving}
              onClick={() =>
                setStatusForAll("PRESENT")
              }
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 text-xs font-black text-green-700 transition hover:bg-green-100 disabled:opacity-50"
            >
              <Check size={15} />
              All Present
            </button>

            <button
              type="button"
              disabled={loading || saving}
              onClick={() =>
                setVisibleStudentsStatus("PRESENT")
              }
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-[#DCCFE4] bg-white px-4 text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8] disabled:opacity-50"
            >
              Visible Present
            </button>

            <button
              type="button"
              disabled={loading || saving}
              onClick={() =>
                setStatusForAll("HOLIDAY")
              }
              className="inline-flex min-h-10 items-center justify-center rounded-xl border border-purple-200 bg-purple-50 px-4 text-xs font-black text-purple-700 transition hover:bg-purple-100 disabled:opacity-50"
            >
              Mark Holiday
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
          <label className="relative block">
            <span className="sr-only">
              Search students
            </span>

            <Search
              aria-hidden="true"
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#968B9A]"
            />

            <input
              type="search"
              value={search}
              disabled={loading || saving}
              placeholder="Search student, ID, parent or phone"
              onChange={(event) =>
                setSearch(event.target.value)
              }
              className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white py-3 pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
            />
          </label>

          <label className="block">
            <span className="sr-only">
              Filter by programme
            </span>

            <select
              value={programmeFilter}
              disabled={loading || saving}
              onChange={(event) =>
                setProgrammeFilter(
                  event.target.value as
                    | Programme
                    | "ALL",
                )
              }
              className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
            >
              <option value="ALL">
                All programmes
              </option>

              {availableProgrammes.map(
                (programme) => (
                  <option
                    key={programme}
                    value={programme}
                  >
                    {programmeLabels[programme]}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
      </section>

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

      <section className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
        <div className="flex flex-col gap-3 border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Attendance register
            </p>

            <h3 className="mt-2 text-xl font-black text-[#2D1736]">
              {filteredRegister.length} student
              {filteredRegister.length === 1
                ? ""
                : "s"}
            </h3>
          </div>

          {hasChanges ? (
            <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-amber-700">
              Unsaved changes
            </span>
          ) : (
            <span className="w-fit rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-green-700">
              Saved
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <LoaderCircle
              aria-hidden="true"
              size={30}
              className="animate-spin text-[#5B2A86]"
            />
          </div>
        ) : filteredRegister.length === 0 ? (
          <div className="flex min-h-[320px] flex-col items-center justify-center px-5 py-12 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-[22px] bg-[#F3EAF8] text-[#5B2A86]">
              <UsersRound size={28} />
            </span>

            <h3 className="mt-5 text-xl font-black text-[#2D1736]">
              No students found
            </h3>

            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
              Adjust the search or programme filter, or add
              active students first.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EEE8F1]">
            {filteredRegister.map((item) => (
              <StudentAttendanceRow
                key={item.student.id}
                item={item}
                disabled={saving}
                onChange={(changes) =>
                  updateStudentAttendance(
                    item.student.id,
                    changes,
                  )
                }
              />
            ))}
          </div>
        )}
      </section>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[22px] border border-[#DCCFE4] bg-white/95 p-4 shadow-[0_18px_50px_rgba(45,23,54,0.14)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-[#2D1736]">
            {summary.marked} of{" "}
            {summary.totalStudents} students marked
          </p>

          <p className="mt-1 text-xs font-semibold text-[#817684]">
            Complete all entries before saving the daily
            register.
          </p>
        </div>

        <button
          type="submit"
          disabled={
            loading ||
            saving ||
            register.length === 0 ||
            !hasChanges
          }
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.2)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
        >
          {saving ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                size={18}
                className="animate-spin"
              />
              Saving Attendance…
            </>
          ) : (
            <>
              <Save
                aria-hidden="true"
                size={18}
              />
              Save Attendance
            </>
          )}
        </button>
      </div>
    </form>
  );
}

type StudentAttendanceRowProps = {
  item: EditableAttendanceItem;
  disabled: boolean;
  onChange: (
    changes: Partial<
      Pick<
        EditableAttendanceItem,
        | "status"
        | "checkInTime"
        | "checkOutTime"
        | "notes"
      >
    >,
  ) => void;
};

function StudentAttendanceRow({
  item,
  disabled,
  onChange,
}: StudentAttendanceRowProps) {
  const showTimes = canUseTimes(item.status);

  return (
    <article className="p-4 sm:p-5">
      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)_260px] xl:items-start">
        <div className="flex items-start gap-3">
          {item.student.profilePhotoUrl ? (
            // Student photos may be stored on external or uploaded URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.student.profilePhotoUrl}
              alt={item.student.name}
              className="h-12 w-12 shrink-0 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-sm font-black text-[#5B2A86]">
              {getInitials(item.student.name)}
            </span>
          )}

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-[#2D1736]">
              {item.student.name}
            </p>

            <p className="mt-1 text-xs font-semibold text-[#817684]">
              {item.student.studentNumber}
            </p>

            <span className="mt-2 inline-flex rounded-full bg-[#F3EAF8] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.07em] text-[#5B2A86]">
              {
                programmeLabels[
                  item.student.programme
                ]
              }
            </span>

            {item.student.primaryGuardian ? (
              <p className="mt-2 truncate text-[11px] font-semibold text-[#928896]">
                {
                  item.student.primaryGuardian
                    .name
                }{" "}
                ·{" "}
                {
                  item.student.primaryGuardian
                    .phone
                }
              </p>
            ) : null}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.09em] text-[#817684]">
            Attendance status
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {attendanceStatuses.map((status) => {
              const selected =
                item.status === status;

              return (
                <button
                  key={status}
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    onChange({ status })
                  }
                  className={[
                    "inline-flex min-h-9 items-center justify-center rounded-xl border px-3 text-[10px] font-black transition disabled:cursor-not-allowed disabled:opacity-50",
                    selected
                      ? `${attendanceStatusStyles[status].button} ring-2 ring-offset-1`
                      : "border-[#E4DAE8] bg-white text-[#6F6373] hover:bg-[#FAF8FC]",
                  ].join(" ")}
                >
                  {
                    attendanceStatusLabels[
                      status
                    ]
                  }
                </button>
              );
            })}
          </div>

          {item.status ? (
            <span
              className={[
                "mt-3 inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em]",
                attendanceStatusStyles[
                  item.status
                ].badge,
              ].join(" ")}
            >
              {
                attendanceStatusLabels[
                  item.status
                ]
              }
            </span>
          ) : (
            <span className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-slate-600">
              Unmarked
            </span>
          )}
        </div>

        <div className="space-y-3">
          {showTimes ? (
            <div className="grid grid-cols-2 gap-3">
              <TimeField
                label="Check-in"
                value={item.checkInTime}
                disabled={disabled}
                onChange={(value) =>
                  onChange({
                    checkInTime: value,
                  })
                }
              />

              <TimeField
                label="Check-out"
                value={item.checkOutTime}
                disabled={disabled}
                onChange={(value) =>
                  onChange({
                    checkOutTime: value,
                  })
                }
              />
            </div>
          ) : null}

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#817684]">
              Notes
            </span>

            <textarea
              value={item.notes}
              disabled={disabled}
              rows={2}
              maxLength={500}
              placeholder="Optional note"
              onChange={(event) =>
                onChange({
                  notes: event.target.value,
                })
              }
              className="mt-2 w-full resize-y rounded-xl border border-[#DCCFE4] bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          {item.markedBy ? (
            <p className="text-[10px] font-semibold text-[#928896]">
              Last marked by{" "}
              <span className="font-black">
                {item.markedBy.name}
              </span>
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

type TimeFieldProps = {
  label: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
};

function TimeField({
  label,
  value,
  disabled,
  onChange,
}: TimeFieldProps) {
  return (
    <label className="block min-w-0">
      <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#817684]">
        {label}
      </span>

      <span className="mt-2 flex w-full min-w-0 rounded-xl border border-[#DCCFE4] bg-white px-3 py-2">
        <input
          type="time"
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="block w-full min-w-0 border-0 bg-transparent p-0 text-xs font-black text-[#2D1736] outline-none disabled:cursor-not-allowed disabled:opacity-60"
        />
      </span>
    </label>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  icon: typeof UserRound;
  accent: string;
};

function SummaryCard({
  label,
  value,
  icon: Icon,
  accent,
}: SummaryCardProps) {
  return (
    <article className="rounded-2xl bg-[#FAF8FC] p-4">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon
          aria-hidden="true"
          size={17}
        />
      </span>

      <p className="mt-3 text-xs font-bold text-[#817684]">
        {label}
      </p>

      <p className="mt-1 text-2xl font-black text-[#2D1736]">
        {value}
      </p>
    </article>
  );
}
