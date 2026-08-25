import type { $Enums, Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const LEAVE_SETTINGS_KEY = "STAFF_LEAVE_SETTINGS";

const LEAVE_TYPES = ["PAID_LEAVE", "UNPAID_LEAVE"] as const;

const LEAVE_STATUSES = [
  "PENDING",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
] as const;

const DEFAULT_LEAVE_SETTINGS = {
  weeklyOffDays: [0],
  sandwichRuleEnabled: true,
  leaveYearStartMonth: 1,
} satisfies LeaveSettings;

type LeaveTypeValue = (typeof LEAVE_TYPES)[number];

type LeaveStatusValue = (typeof LEAVE_STATUSES)[number];

type LeaveSettings = {
  weeklyOffDays: number[];
  sandwichRuleEnabled: boolean;
  leaveYearStartMonth: number;
};

type CreateLeaveBody = {
  action?: unknown;
  staffId?: unknown;
  startDate?: unknown;
  endDate?: unknown;
  leaveType?: unknown;
  reason?: unknown;
  notes?: unknown;
};

type SaveSettingsBody = {
  action?: unknown;
  weeklyOffDays?: unknown;
  sandwichRuleEnabled?: unknown;
  leaveYearStartMonth?: unknown;
};

type UpdateLeaveBody = {
  action?: unknown;
  leaveId?: unknown;
  notes?: unknown;
};

type PlanningRequest = {
  id: string;
  startDate: Date;
  endDate: Date;
  leaveType: LeaveTypeValue;
  createdAt: Date;
};

type PlannedDay = {
  date: Date;
  dateKey: string;
  requestId: string;
  isSandwichDay: boolean;
  paidPart: number;
  unpaidPart: number;
};

type RequestPlan = {
  requestedDays: number;
  sandwichDays: number;
  chargedDays: number;
  paidDays: number;
  unpaidDays: number;
  days: PlannedDay[];
};

type StaffPolicy = {
  paidLeaveCycle: $Enums.StaffPaidLeaveCycle;
  paidLeaveAllowance: number;
};

class LeaveLedgerConflictError extends Error {}

const leaveInclude = {
  staff: {
    select: {
      id: true,
      staffNumber: true,
      name: true,
      designation: true,
      status: true,
      paidLeaveCycle: true,
      paidLeaveAllowance: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      name: true,
      role: true,
    },
  },
} satisfies Prisma.StaffLeaveRequestInclude;

type LeaveWithRelations = Prisma.StaffLeaveRequestGetPayload<{
  include: typeof leaveInclude;
}>;

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function roundDays(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseDateOnly(value: unknown) {
  const text = cleanText(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDateKey(value: Date) {
  return [
    value.getUTCFullYear(),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function countCalendarDays(start: Date, end: Date) {
  return (
    Math.floor((end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)) + 1
  );
}

function enumerateDates(start: Date, end: Date) {
  const dates: Date[] = [];

  for (
    let cursor = new Date(start);
    cursor <= end;
    cursor = addDays(cursor, 1)
  ) {
    dates.push(cursor);
  }

  return dates;
}

function getCurrentMonthKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
}

function parseMonth(value: unknown) {
  const text = cleanText(value);
  const match = /^(\d{4})-(\d{2})$/.exec(text);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (month < 1 || month > 12) {
    return null;
  }

  return {
    key: text,
    start: new Date(Date.UTC(year, month - 1, 1)),
    end: new Date(Date.UTC(year, month, 1)),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseStoredSettings(value: unknown): LeaveSettings {
  if (!isRecord(value)) {
    return DEFAULT_LEAVE_SETTINGS;
  }

  const rawWeeklyOffDays = value.weeklyOffDays;
  const weeklyOffDays = Array.isArray(rawWeeklyOffDays)
    ? Array.from(
        new Set(
          rawWeeklyOffDays.filter(
            (day): day is number =>
              typeof day === "number" &&
              Number.isInteger(day) &&
              day >= 0 &&
              day <= 6,
          ),
        ),
      ).sort((a, b) => a - b)
    : DEFAULT_LEAVE_SETTINGS.weeklyOffDays;

  const leaveYearStartMonth =
    typeof value.leaveYearStartMonth === "number" &&
    Number.isInteger(value.leaveYearStartMonth) &&
    value.leaveYearStartMonth >= 1 &&
    value.leaveYearStartMonth <= 12
      ? value.leaveYearStartMonth
      : DEFAULT_LEAVE_SETTINGS.leaveYearStartMonth;

  return {
    weeklyOffDays,
    sandwichRuleEnabled:
      typeof value.sandwichRuleEnabled === "boolean"
        ? value.sandwichRuleEnabled
        : DEFAULT_LEAVE_SETTINGS.sandwichRuleEnabled,
    leaveYearStartMonth,
  };
}

function parseSettingsBody(body: SaveSettingsBody) {
  if (!Array.isArray(body.weeklyOffDays)) {
    return {
      settings: null,
      message: "Select the centre weekly off days.",
    };
  }

  const weeklyOffDays = Array.from(
    new Set(
      body.weeklyOffDays.map((value) =>
        typeof value === "number" ? value : Number(cleanText(value)),
      ),
    ),
  );

  if (
    weeklyOffDays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)
  ) {
    return {
      settings: null,
      message: "Weekly off days must be valid days of the week.",
    };
  }

  const leaveYearStartMonth = Number(body.leaveYearStartMonth);

  if (
    !Number.isInteger(leaveYearStartMonth) ||
    leaveYearStartMonth < 1 ||
    leaveYearStartMonth > 12
  ) {
    return {
      settings: null,
      message: "Leave year start month must be between 1 and 12.",
    };
  }

  if (typeof body.sandwichRuleEnabled !== "boolean") {
    return {
      settings: null,
      message: "Choose whether the sandwich leave rule is enabled.",
    };
  }

  return {
    settings: {
      weeklyOffDays: weeklyOffDays.sort((a, b) => a - b),
      sandwichRuleEnabled: body.sandwichRuleEnabled,
      leaveYearStartMonth,
    } satisfies LeaveSettings,
    message: null,
  };
}

function isLeaveType(value: string): value is LeaveTypeValue {
  return LEAVE_TYPES.includes(value as LeaveTypeValue);
}

function isLeaveStatus(value: string): value is LeaveStatusValue {
  return LEAVE_STATUSES.includes(value as LeaveStatusValue);
}

function canManageLeave(session: { role: string; permissions: string[] }) {
  return (
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("staff.manage") ||
    session.permissions.includes("staff.view") ||
    session.permissions.includes("attendance.manage")
  );
}

function getLeaveYearRange(referenceDate: Date, startMonth: number) {
  const referenceYear = referenceDate.getUTCFullYear();
  const referenceMonth = referenceDate.getUTCMonth() + 1;
  const startYear =
    referenceMonth >= startMonth ? referenceYear : referenceYear - 1;

  return {
    start: new Date(Date.UTC(startYear, startMonth - 1, 1)),
    end: new Date(Date.UTC(startYear + 1, startMonth - 1, 1)),
  };
}

function getAllowanceBucket(
  date: Date,
  cycle: $Enums.StaffPaidLeaveCycle,
  leaveYearStartMonth: number,
) {
  if (cycle === "MONTHLY") {
    return formatDateKey(date).slice(0, 7);
  }

  const range = getLeaveYearRange(date, leaveYearStartMonth);

  return `YEAR-${formatDateKey(range.start)}`;
}

function emptyRequestPlan(): RequestPlan {
  return {
    requestedDays: 0,
    sandwichDays: 0,
    chargedDays: 0,
    paidDays: 0,
    unpaidDays: 0,
    days: [],
  };
}

function buildLeavePlans(
  requests: PlanningRequest[],
  settings: LeaveSettings,
  policy: StaffPolicy,
  workedDateKeys: Set<string>,
) {
  const sortedRequests = [...requests].sort(
    (left, right) =>
      left.startDate.getTime() - right.startDate.getTime() ||
      left.createdAt.getTime() - right.createdAt.getTime(),
  );

  const plans = new Map<string, RequestPlan>();
  const baseDateOwner = new Map<string, string>();
  const dateByKey = new Map<string, Date>();

  for (const request of sortedRequests) {
    plans.set(request.id, emptyRequestPlan());

    for (const date of enumerateDates(request.startDate, request.endDate)) {
      if (settings.weeklyOffDays.includes(date.getUTCDay())) {
        continue;
      }

      const dateKey = formatDateKey(date);

      if (!baseDateOwner.has(dateKey)) {
        baseDateOwner.set(dateKey, request.id);
        dateByKey.set(dateKey, date);
      }
    }
  }

  const baseKeys = Array.from(baseDateOwner.keys()).sort();

  for (const dateKey of baseKeys) {
    const requestId = baseDateOwner.get(dateKey);
    const date = dateByKey.get(dateKey);
    const plan = requestId ? plans.get(requestId) : null;

    if (!requestId || !date || !plan) {
      continue;
    }

    plan.days.push({
      date,
      dateKey,
      requestId,
      isSandwichDay: false,
      paidPart: 0,
      unpaidPart: 0,
    });
  }

  if (settings.sandwichRuleEnabled && baseKeys.length > 1) {
    const firstBaseDate = dateByKey.get(baseKeys[0]);
    const lastBaseDate = dateByKey.get(baseKeys[baseKeys.length - 1]);

    if (firstBaseDate && lastBaseDate) {
      let cursor = addDays(firstBaseDate, 1);

      while (cursor < lastBaseDate) {
        if (!settings.weeklyOffDays.includes(cursor.getUTCDay())) {
          cursor = addDays(cursor, 1);
          continue;
        }

        const offBlock: Date[] = [];

        while (
          cursor < lastBaseDate &&
          settings.weeklyOffDays.includes(cursor.getUTCDay())
        ) {
          offBlock.push(cursor);
          cursor = addDays(cursor, 1);
        }

        const leftDate = addDays(offBlock[0], -1);
        const rightDate = cursor;
        const leftKey = formatDateKey(leftDate);
        const rightKey = formatDateKey(rightDate);
        const rightRequestId = baseDateOwner.get(rightKey);
        const hasWorkedOffDay = offBlock.some((date) =>
          workedDateKeys.has(formatDateKey(date)),
        );

        if (baseDateOwner.has(leftKey) && rightRequestId && !hasWorkedOffDay) {
          const plan = plans.get(rightRequestId);

          if (plan) {
            for (const date of offBlock) {
              const dateKey = formatDateKey(date);

              plan.days.push({
                date,
                dateKey,
                requestId: rightRequestId,
                isSandwichDay: true,
                paidPart: 0,
                unpaidPart: 0,
              });
            }
          }
        }
      }
    }
  }

  const requestById = new Map(
    sortedRequests.map((request) => [request.id, request]),
  );
  const allowanceRemaining = new Map<string, number>();
  const allDays = Array.from(plans.values())
    .flatMap((plan) => plan.days)
    .sort(
      (left, right) =>
        left.date.getTime() - right.date.getTime() ||
        Number(left.isSandwichDay) - Number(right.isSandwichDay),
    );

  for (const day of allDays) {
    const request = requestById.get(day.requestId);

    if (!request) {
      continue;
    }

    if (
      request.leaveType === "PAID_LEAVE" &&
      policy.paidLeaveCycle !== "NONE" &&
      policy.paidLeaveAllowance > 0
    ) {
      const bucket = getAllowanceBucket(
        day.date,
        policy.paidLeaveCycle,
        settings.leaveYearStartMonth,
      );
      const remaining = allowanceRemaining.has(bucket)
        ? (allowanceRemaining.get(bucket) ?? 0)
        : policy.paidLeaveAllowance;
      const paidPart = roundDays(Math.min(1, Math.max(remaining, 0)));

      day.paidPart = paidPart;
      day.unpaidPart = roundDays(1 - paidPart);
      allowanceRemaining.set(bucket, roundDays(remaining - paidPart));
    } else {
      day.paidPart = 0;
      day.unpaidPart = 1;
    }
  }

  for (const plan of plans.values()) {
    plan.days.sort((left, right) => left.date.getTime() - right.date.getTime());
    plan.requestedDays = plan.days.filter((day) => !day.isSandwichDay).length;
    plan.sandwichDays = plan.days.filter((day) => day.isSandwichDay).length;
    plan.chargedDays = plan.days.length;
    plan.paidDays = roundDays(
      plan.days.reduce((total, day) => total + day.paidPart, 0),
    );
    plan.unpaidDays = roundDays(
      plan.days.reduce((total, day) => total + day.unpaidPart, 0),
    );
  }

  return plans;
}

function createLeaveNumber() {
  const year = new Date().getUTCFullYear();
  const time = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).slice(2, 7).toUpperCase();

  return `LV-${year}-${time}-${random}`;
}

function serialiseLeave(leave: LeaveWithRelations) {
  return {
    ...leave,
    requestedDays: leave.requestedDays.toString(),
    sandwichDays: leave.sandwichDays.toString(),
    chargedDays: leave.chargedDays.toString(),
    paidDays: leave.paidDays.toString(),
    unpaidDays: leave.unpaidDays.toString(),
    staff: {
      ...leave.staff,
      paidLeaveAllowance: leave.staff.paidLeaveAllowance.toString(),
    },
  };
}

async function loadSettings(
  client: Pick<Prisma.TransactionClient, "centreSetting"> = prisma,
) {
  const record = await client.centreSetting.findUnique({
    where: {
      key: LEAVE_SETTINGS_KEY,
    },
  });

  return {
    settings: parseStoredSettings(record?.value),
    configured: Boolean(record),
  };
}

async function reconcileStaffLeaveLedger(
  transaction: Prisma.TransactionClient,
  staffId: string,
  settings: LeaveSettings,
  markedById: string,
) {
  const [staff, approvedRequests, attendance] = await Promise.all([
    transaction.staff.findUnique({
      where: { id: staffId },
      select: {
        id: true,
        name: true,
        paidLeaveCycle: true,
        paidLeaveAllowance: true,
      },
    }),
    transaction.staffLeaveRequest.findMany({
      where: {
        staffId,
        status: "APPROVED",
      },
      orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
    }),
    transaction.staffAttendance.findMany({
      where: { staffId },
      select: {
        attendanceDate: true,
        status: true,
        leaveRequestId: true,
      },
    }),
  ]);

  if (!staff) {
    throw new LeaveLedgerConflictError(
      "The selected staff record no longer exists.",
    );
  }

  const workedDateKeys = new Set(
    attendance
      .filter((record) =>
        ["PRESENT", "LATE", "HALF_DAY"].includes(record.status),
      )
      .map((record) => formatDateKey(record.attendanceDate)),
  );

  const plans = buildLeavePlans(
    approvedRequests.map((request) => ({
      id: request.id,
      startDate: request.startDate,
      endDate: request.endDate,
      leaveType: request.leaveType,
      createdAt: request.createdAt,
    })),
    settings,
    {
      paidLeaveCycle: staff.paidLeaveCycle,
      paidLeaveAllowance: Number(staff.paidLeaveAllowance.toString()),
    },
    workedDateKeys,
  );

  const conflictingDates = Array.from(plans.values())
    .flatMap((plan) => plan.days)
    .filter((day) => !day.isSandwichDay && workedDateKeys.has(day.dateKey))
    .map((day) => day.dateKey);

  if (conflictingDates.length > 0) {
    throw new LeaveLedgerConflictError(
      `${staff.name} is already marked present on ${Array.from(
        new Set(conflictingDates),
      ).join(", ")}. Correct attendance before approving this leave.`,
    );
  }

  await transaction.staffAttendance.deleteMany({
    where: {
      staffId,
      leaveRequestId: {
        not: null,
      },
    },
  });

  for (const request of approvedRequests) {
    const plan = plans.get(request.id) ?? emptyRequestPlan();

    await transaction.staffLeaveRequest.update({
      where: { id: request.id },
      data: {
        requestedDays: plan.requestedDays,
        sandwichDays: plan.sandwichDays,
        chargedDays: plan.chargedDays,
        paidDays: plan.paidDays,
        unpaidDays: plan.unpaidDays,
      },
    });

    for (const day of plan.days) {
      await transaction.staffAttendance.upsert({
        where: {
          staffId_attendanceDate: {
            staffId,
            attendanceDate: day.date,
          },
        },
        create: {
          staffId,
          attendanceDate: day.date,
          status: "LEAVE",
          markedById,
          leaveRequestId: request.id,
          isSandwichDay: day.isSandwichDay,
          notes: day.isSandwichDay
            ? "Automatically counted under the sandwich leave rule."
            : "Approved staff leave.",
        },
        update: {
          status: "LEAVE",
          checkInAt: null,
          checkOutAt: null,
          markedById,
          leaveRequestId: request.id,
          isSandwichDay: day.isSandwichDay,
        },
      });
    }
  }

  return plans;
}

function calculateBalance(
  staff: {
    id: string;
    paidLeaveCycle: $Enums.StaffPaidLeaveCycle;
    paidLeaveAllowance: {
      toString(): string;
    };
  },
  plans: Map<string, RequestPlan>,
  month: {
    key: string;
    start: Date;
    end: Date;
  },
  settings: LeaveSettings,
) {
  const allDays = Array.from(plans.values()).flatMap((plan) => plan.days);
  const allowance = Number(staff.paidLeaveAllowance.toString());
  const yearlyRange = getLeaveYearRange(
    month.start,
    settings.leaveYearStartMonth,
  );
  const periodStart =
    staff.paidLeaveCycle === "YEARLY" ? yearlyRange.start : month.start;
  const periodEnd =
    staff.paidLeaveCycle === "YEARLY" ? yearlyRange.end : month.end;
  const periodDays = allDays.filter(
    (day) => day.date >= periodStart && day.date < periodEnd,
  );
  const paidUsed = roundDays(
    periodDays.reduce((total, day) => total + day.paidPart, 0),
  );
  const unpaidDays = roundDays(
    periodDays.reduce((total, day) => total + day.unpaidPart, 0),
  );

  return {
    staffId: staff.id,
    cycle: staff.paidLeaveCycle,
    allowance: allowance.toFixed(2),
    periodStart: formatDateKey(periodStart),
    periodEnd: formatDateKey(addDays(periodEnd, -1)),
    paidUsed: paidUsed.toFixed(2),
    paidRemaining: Math.max(roundDays(allowance - paidUsed), 0).toFixed(2),
    chargedDays: periodDays.length.toFixed(2),
    unpaidDays: unpaidDays.toFixed(2),
  };
}

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    if (!canManageLeave(session)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to view staff leave records.",
        },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const month = parseMonth(
      url.searchParams.get("month") ?? getCurrentMonthKey(),
    );

    if (!month) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid month in YYYY-MM format.",
        },
        { status: 400 },
      );
    }

    const requestedStatus = cleanText(
      url.searchParams.get("status"),
    ).toUpperCase();
    const status = isLeaveStatus(requestedStatus) ? requestedStatus : null;
    const requestedStaffId = cleanText(url.searchParams.get("staffId"));

    const [settingsResult, staffRecords, leaves] = await Promise.all([
      loadSettings(),
      prisma.staff.findMany({
        select: {
          id: true,
          staffNumber: true,
          name: true,
          designation: true,
          status: true,
          joiningDate: true,
          leavingDate: true,
          paidLeaveCycle: true,
          paidLeaveAllowance: true,
        },
        orderBy: [{ status: "asc" }, { name: "asc" }],
      }),
      prisma.staffLeaveRequest.findMany({
        where: {
          startDate: { lt: month.end },
          endDate: { gte: month.start },
          ...(status ? { status } : {}),
          ...(requestedStaffId ? { staffId: requestedStaffId } : {}),
        },
        include: leaveInclude,
        orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
      }),
    ]);

    const [approvedLeaves, attendance] = await Promise.all([
      prisma.staffLeaveRequest.findMany({
        where: {
          status: "APPROVED",
        },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      }),
      prisma.staffAttendance.findMany({
        where: {
          status: {
            in: ["PRESENT", "LATE", "HALF_DAY"],
          },
        },
        select: {
          staffId: true,
          attendanceDate: true,
        },
      }),
    ]);

    const approvedByStaff = new Map<string, typeof approvedLeaves>();

    for (const leave of approvedLeaves) {
      const list = approvedByStaff.get(leave.staffId) ?? [];
      list.push(leave);
      approvedByStaff.set(leave.staffId, list);
    }

    const workedByStaff = new Map<string, Set<string>>();

    for (const record of attendance) {
      const set = workedByStaff.get(record.staffId) ?? new Set<string>();
      set.add(formatDateKey(record.attendanceDate));
      workedByStaff.set(record.staffId, set);
    }

    const balances = staffRecords.map((staff) => {
      const plans = buildLeavePlans(
        (approvedByStaff.get(staff.id) ?? []).map((leave) => ({
          id: leave.id,
          startDate: leave.startDate,
          endDate: leave.endDate,
          leaveType: leave.leaveType,
          createdAt: leave.createdAt,
        })),
        settingsResult.settings,
        {
          paidLeaveCycle: staff.paidLeaveCycle,
          paidLeaveAllowance: Number(staff.paidLeaveAllowance.toString()),
        },
        workedByStaff.get(staff.id) ?? new Set<string>(),
      );

      return calculateBalance(staff, plans, month, settingsResult.settings);
    });

    const summary = leaves.reduce(
      (result, leave) => {
        result.total += 1;
        result.chargedDays = roundDays(
          result.chargedDays + Number(leave.chargedDays.toString()),
        );
        result.paidDays = roundDays(
          result.paidDays + Number(leave.paidDays.toString()),
        );
        result.unpaidDays = roundDays(
          result.unpaidDays + Number(leave.unpaidDays.toString()),
        );
        result[
          leave.status.toLowerCase() as
            "pending" | "approved" | "rejected" | "cancelled"
        ] += 1;
        return result;
      },
      {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        cancelled: 0,
        chargedDays: 0,
        paidDays: 0,
        unpaidDays: 0,
      },
    );

    return NextResponse.json({
      success: true,
      month: month.key,
      settings: settingsResult.settings,
      settingsConfigured: settingsResult.configured,
      canApprove: session.role === "OWNER",
      leaveTypes: LEAVE_TYPES,
      leaveStatuses: LEAVE_STATUSES,
      staff: staffRecords.map((staff) => ({
        ...staff,
        paidLeaveAllowance: staff.paidLeaveAllowance.toString(),
      })),
      balances,
      leaves: leaves.map(serialiseLeave),
      summary,
    });
  } catch (error) {
    console.error("Unable to load staff leave register:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the staff leave register. Check the server terminal.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    let body: CreateLeaveBody | SaveSettingsBody;

    try {
      body = (await request.json()) as CreateLeaveBody | SaveSettingsBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The staff leave request is invalid.",
        },
        { status: 400 },
      );
    }

    const action = cleanText(body.action).toLowerCase();

    if (action === "save_settings") {
      if (session.role !== "OWNER") {
        return NextResponse.json(
          {
            success: false,
            message: "Only the owner can change staff leave settings.",
          },
          { status: 403 },
        );
      }

      const parsed = parseSettingsBody(body as SaveSettingsBody);

      if (!parsed.settings) {
        return NextResponse.json(
          {
            success: false,
            message: parsed.message,
          },
          { status: 400 },
        );
      }

      const settings = parsed.settings;

      await prisma.$transaction(async (transaction) => {
        const previous = await transaction.centreSetting.findUnique({
          where: {
            key: LEAVE_SETTINGS_KEY,
          },
        });

        await transaction.centreSetting.upsert({
          where: {
            key: LEAVE_SETTINGS_KEY,
          },
          create: {
            key: LEAVE_SETTINGS_KEY,
            value: settings,
            description:
              "Editable weekly off, sandwich rule and leave-year settings.",
          },
          update: {
            value: settings,
            description:
              "Editable weekly off, sandwich rule and leave-year settings.",
          },
        });

        const approvedStaff = await transaction.staffLeaveRequest.findMany({
          where: {
            status: "APPROVED",
          },
          distinct: ["staffId"],
          select: {
            staffId: true,
          },
        });

        for (const record of approvedStaff) {
          await reconcileStaffLeaveLedger(
            transaction,
            record.staffId,
            settings,
            session.userId,
          );
        }

        await transaction.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "UPDATED",
            entityType: "StaffLeaveSettings",
            entityId: LEAVE_SETTINGS_KEY,
            description: "Staff leave calculation settings updated.",
            previousData: previous?.value ?? undefined,
            newData: settings,
          },
        });
      });

      return NextResponse.json({
        success: true,
        message:
          "Staff leave settings saved and existing leave balances recalculated.",
        settings,
      });
    }

    if (action !== "create") {
      return NextResponse.json(
        {
          success: false,
          message: "Please select a valid staff leave action.",
        },
        { status: 400 },
      );
    }

    if (!canManageLeave(session)) {
      return NextResponse.json(
        {
          success: false,
          message: "You do not have permission to create staff leave requests.",
        },
        { status: 403 },
      );
    }

    const createBody = body as CreateLeaveBody;
    const staffId = cleanText(createBody.staffId);
    const startDate = parseDateOnly(createBody.startDate);
    const endDate = parseDateOnly(createBody.endDate);
    const leaveTypeText = cleanText(createBody.leaveType).toUpperCase();

    if (!staffId) {
      return NextResponse.json(
        {
          success: false,
          message: "Select a staff member.",
        },
        { status: 400 },
      );
    }

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Enter valid leave start and end dates.",
        },
        { status: 400 },
      );
    }

    if (endDate < startDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Leave end date cannot be before the start date.",
        },
        { status: 400 },
      );
    }

    if (countCalendarDays(startDate, endDate) > 366) {
      return NextResponse.json(
        {
          success: false,
          message: "One leave request cannot exceed 366 calendar days.",
        },
        { status: 400 },
      );
    }

    if (!isLeaveType(leaveTypeText)) {
      return NextResponse.json(
        {
          success: false,
          message: "Select paid leave or unpaid leave.",
        },
        { status: 400 },
      );
    }

    const [settingsResult, staff, overlap] = await Promise.all([
      loadSettings(),
      prisma.staff.findUnique({
        where: { id: staffId },
      }),
      prisma.staffLeaveRequest.findFirst({
        where: {
          staffId,
          status: {
            in: ["PENDING", "APPROVED"],
          },
          startDate: { lte: endDate },
          endDate: { gte: startDate },
        },
        select: {
          leaveNumber: true,
        },
      }),
    ]);

    if (!staff) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff record was not found.",
        },
        { status: 404 },
      );
    }

    if (
      startDate < staff.joiningDate ||
      (staff.leavingDate && endDate > staff.leavingDate)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Leave dates must fall within the employee's joining and leaving dates.",
        },
        { status: 409 },
      );
    }

    if (overlap) {
      return NextResponse.json(
        {
          success: false,
          message: `These dates overlap ${overlap.leaveNumber}. Edit, reject or cancel that request first.`,
        },
        { status: 409 },
      );
    }

    const [approvedRequests, workedAttendance] = await Promise.all([
      prisma.staffLeaveRequest.findMany({
        where: {
          staffId,
          status: "APPROVED",
        },
        orderBy: [{ startDate: "asc" }, { createdAt: "asc" }],
      }),
      prisma.staffAttendance.findMany({
        where: {
          staffId,
          status: {
            in: ["PRESENT", "LATE", "HALF_DAY"],
          },
        },
        select: {
          attendanceDate: true,
        },
      }),
    ]);

    const previewId = "__NEW_LEAVE_PREVIEW__";
    const previewCreatedAt = new Date();
    const plans = buildLeavePlans(
      [
        ...approvedRequests.map((leave) => ({
          id: leave.id,
          startDate: leave.startDate,
          endDate: leave.endDate,
          leaveType: leave.leaveType,
          createdAt: leave.createdAt,
        })),
        {
          id: previewId,
          startDate,
          endDate,
          leaveType: leaveTypeText,
          createdAt: previewCreatedAt,
        },
      ],
      settingsResult.settings,
      {
        paidLeaveCycle: staff.paidLeaveCycle,
        paidLeaveAllowance: Number(staff.paidLeaveAllowance.toString()),
      },
      new Set(
        workedAttendance.map((record) => formatDateKey(record.attendanceDate)),
      ),
    );
    const preview = plans.get(previewId) ?? emptyRequestPlan();

    if (preview.requestedDays === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The selected dates contain only weekly off days. Select at least one working day.",
        },
        { status: 400 },
      );
    }

    const created = await prisma.$transaction(async (transaction) => {
      const leave = await transaction.staffLeaveRequest.create({
        data: {
          leaveNumber: createLeaveNumber(),
          staffId,
          startDate,
          endDate,
          leaveType: leaveTypeText,
          status: "PENDING",
          requestedDays: preview.requestedDays,
          sandwichDays: preview.sandwichDays,
          chargedDays: preview.chargedDays,
          paidDays: preview.paidDays,
          unpaidDays: preview.unpaidDays,
          reason: cleanOptionalText(createBody.reason),
          notes: cleanOptionalText(createBody.notes),
          createdById: session.userId,
        },
        include: leaveInclude,
      });

      await transaction.activityLog.create({
        data: {
          adminUserId: session.userId,
          action: "CREATED",
          entityType: "StaffLeaveRequest",
          entityId: leave.id,
          description: `${leave.leaveNumber} created for ${staff.name}.`,
          newData: {
            leaveNumber: leave.leaveNumber,
            staffId,
            startDate: formatDateKey(startDate),
            endDate: formatDateKey(endDate),
            leaveType: leaveTypeText,
            requestedDays: preview.requestedDays,
            sandwichDays: preview.sandwichDays,
            chargedDays: preview.chargedDays,
            paidDays: preview.paidDays,
            unpaidDays: preview.unpaidDays,
            status: "PENDING",
          },
        },
      });

      return leave;
    });

    return NextResponse.json(
      {
        success: true,
        message: "Leave request created and sent for owner approval.",
        leave: serialiseLeave(created),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof LeaveLedgerConflictError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    console.error("Unable to save staff leave request:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "The staff leave request could not be saved. Check the server terminal.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    if (session.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          message: "Only the owner can approve, reject or cancel staff leave.",
        },
        { status: 403 },
      );
    }

    let body: UpdateLeaveBody;

    try {
      body = (await request.json()) as UpdateLeaveBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The staff leave update is invalid.",
        },
        { status: 400 },
      );
    }

    const leaveId = cleanText(body.leaveId);
    const action = cleanText(body.action).toLowerCase();

    if (!leaveId) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff leave record is required.",
        },
        { status: 400 },
      );
    }

    const existing = await prisma.staffLeaveRequest.findUnique({
      where: { id: leaveId },
      include: leaveInclude,
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff leave request was not found.",
        },
        { status: 404 },
      );
    }

    const now = new Date();
    const notes = cleanOptionalText(body.notes);

    if (action === "approve") {
      if (existing.status !== "PENDING") {
        return NextResponse.json(
          {
            success: false,
            message: "Only pending leave requests can be approved.",
          },
          { status: 409 },
        );
      }

      const overlappingApproved = await prisma.staffLeaveRequest.findFirst({
        where: {
          id: { not: existing.id },
          staffId: existing.staffId,
          status: "APPROVED",
          startDate: { lte: existing.endDate },
          endDate: { gte: existing.startDate },
        },
        select: {
          leaveNumber: true,
        },
      });

      if (overlappingApproved) {
        return NextResponse.json(
          {
            success: false,
            message: `This request overlaps approved leave ${overlappingApproved.leaveNumber}.`,
          },
          { status: 409 },
        );
      }

      const { settings } = await loadSettings();

      await prisma.$transaction(async (transaction) => {
        await transaction.staffLeaveRequest.update({
          where: { id: existing.id },
          data: {
            status: "APPROVED",
            approvedById: session.userId,
            approvedAt: now,
            rejectedAt: null,
            cancelledAt: null,
            notes: notes ?? existing.notes,
          },
        });

        await reconcileStaffLeaveLedger(
          transaction,
          existing.staffId,
          settings,
          session.userId,
        );

        await transaction.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "UPDATED",
            entityType: "StaffLeaveRequest",
            entityId: existing.id,
            description: `${existing.leaveNumber} approved for ${existing.staff.name}.`,
            previousData: {
              status: existing.status,
            },
            newData: {
              status: "APPROVED",
            },
          },
        });
      });
    } else if (action === "reject") {
      if (existing.status !== "PENDING") {
        return NextResponse.json(
          {
            success: false,
            message: "Only pending leave requests can be rejected.",
          },
          { status: 409 },
        );
      }

      await prisma.$transaction(async (transaction) => {
        await transaction.staffLeaveRequest.update({
          where: { id: existing.id },
          data: {
            status: "REJECTED",
            rejectedAt: now,
            notes: notes ?? existing.notes,
          },
        });

        await transaction.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "UPDATED",
            entityType: "StaffLeaveRequest",
            entityId: existing.id,
            description: `${existing.leaveNumber} rejected for ${existing.staff.name}.`,
            previousData: {
              status: existing.status,
            },
            newData: {
              status: "REJECTED",
            },
          },
        });
      });
    } else if (action === "cancel") {
      if (existing.status === "REJECTED" || existing.status === "CANCELLED") {
        return NextResponse.json(
          {
            success: false,
            message: "Rejected or already-cancelled leave cannot be cancelled.",
          },
          { status: 409 },
        );
      }

      const { settings } = await loadSettings();

      await prisma.$transaction(async (transaction) => {
        await transaction.staffLeaveRequest.update({
          where: { id: existing.id },
          data: {
            status: "CANCELLED",
            cancelledAt: now,
            notes: notes ?? existing.notes,
          },
        });

        if (existing.status === "APPROVED") {
          await reconcileStaffLeaveLedger(
            transaction,
            existing.staffId,
            settings,
            session.userId,
          );
        }

        await transaction.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "CANCELLED",
            entityType: "StaffLeaveRequest",
            entityId: existing.id,
            description: `${existing.leaveNumber} cancelled for ${existing.staff.name}.`,
            previousData: {
              status: existing.status,
            },
            newData: {
              status: "CANCELLED",
            },
          },
        });
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Please select approve, reject or cancel.",
        },
        { status: 400 },
      );
    }

    const updated = await prisma.staffLeaveRequest.findUnique({
      where: { id: existing.id },
      include: leaveInclude,
    });

    if (!updated) {
      return NextResponse.json(
        {
          success: false,
          message: "The updated leave request could not be loaded.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message:
        action === "approve"
          ? "Staff leave approved and the leave balance was recalculated."
          : action === "reject"
            ? "Staff leave request rejected."
            : "Staff leave cancelled and the leave balance was recalculated.",
      leave: serialiseLeave(updated),
    });
  } catch (error) {
    if (error instanceof LeaveLedgerConflictError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    console.error("Unable to update staff leave request:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "The staff leave request could not be updated. Check the server terminal.",
      },
      { status: 500 },
    );
  }
}
