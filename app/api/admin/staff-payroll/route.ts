import type {
  $Enums,
  Prisma,
} from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const PAYROLL_SETTINGS_KEY = "STAFF_PAYROLL_SETTINGS";
const LEAVE_SETTINGS_KEY = "STAFF_LEAVE_SETTINGS";

const PAYMENT_METHODS = [
  "CASH",
  "UPI",
  "BANK_TRANSFER",
  "CARD",
  "CHEQUE",
  "OTHER",
] as const;

type PaymentMethodValue =
  (typeof PAYMENT_METHODS)[number];

type PayrollSettings = {
  workingDaysPerMonth: number;
  standardHoursPerDay: number;
  absentDeductionDays: number;
  halfDayDeductionDays: number;
  lateDeductionDays: number;
};

type LeaveSettings = {
  weeklyOffDays: number[];
  leaveYearStartMonth: number;
};

type PayrollCalculation = {
  staffId: string;
  payrollMonth: Date;
  periodStart: Date;
  periodEnd: Date;
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

type SaveSettingsBody = {
  action?: unknown;
  workingDaysPerMonth?: unknown;
  standardHoursPerDay?: unknown;
  absentDeductionDays?: unknown;
  halfDayDeductionDays?: unknown;
  lateDeductionDays?: unknown;
};

type GeneratePayrollBody = {
  action?: unknown;
  staffId?: unknown;
  month?: unknown;
  manualAddition?: unknown;
  manualDeduction?: unknown;
  manualAdjustmentNotes?: unknown;
  notes?: unknown;
};

type UpdatePayrollBody = {
  action?: unknown;
  payrollId?: unknown;
  paymentMethod?: unknown;
  paymentReference?: unknown;
  notes?: unknown;
};

const DEFAULT_PAYROLL_SETTINGS: PayrollSettings = {
  workingDaysPerMonth: 26,
  standardHoursPerDay: 8,
  absentDeductionDays: 1,
  halfDayDeductionDays: 0.5,
  lateDeductionDays: 0,
};

const DEFAULT_LEAVE_SETTINGS: LeaveSettings = {
  weeklyOffDays: [0],
  leaveYearStartMonth: 1,
};

const staffSelect = {
  id: true,
  staffNumber: true,
  name: true,
  designation: true,
  status: true,
  joiningDate: true,
  leavingDate: true,
  monthlySalary: true,
  paidLeaveCycle: true,
  paidLeaveAllowance: true,
} as const;

type PayrollStaff = Prisma.StaffGetPayload<{
  select: typeof staffSelect;
}>;

const payrollInclude = {
  staff: {
    select: {
      id: true,
      staffNumber: true,
      name: true,
      designation: true,
      status: true,
    },
  },
  generatedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  paidBy: {
    select: {
      id: true,
      name: true,
    },
  },
  extraDuties: {
    select: {
      id: true,
      dutyNumber: true,
      dutyDate: true,
      hours: true,
      hourlyRate: true,
      amount: true,
      status: true,
    },
    orderBy: [
      { dutyDate: "asc" },
      { createdAt: "asc" },
    ],
  },
} satisfies Prisma.StaffPayrollInclude;

type PayrollWithRelations =
  Prisma.StaffPayrollGetPayload<{
    include: typeof payrollInclude;
  }>;

class PayrollConflictError extends Error {}

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptionalText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundDays(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function parseNumber(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : Number(cleanText(value));

  return Number.isFinite(parsed) ? parsed : null;
}

function parseNonNegativeNumber(
  value: unknown,
  maximum: number,
) {
  const parsed = parseNumber(value);

  if (
    parsed === null ||
    parsed < 0 ||
    parsed > maximum
  ) {
    return null;
  }

  return parsed;
}

function parsePositiveNumber(
  value: unknown,
  maximum: number,
) {
  const parsed = parseNumber(value);

  if (
    parsed === null ||
    parsed <= 0 ||
    parsed > maximum
  ) {
    return null;
  }

  return parsed;
}

function parseDateOnly(value: unknown) {
  const text = cleanText(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    text,
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(
    Date.UTC(year, month - 1, day),
  );

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
  return new Date(
    Date.UTC(
      value.getUTCFullYear(),
      value.getUTCMonth(),
      value.getUTCDate() + days,
    ),
  );
}

function laterDate(left: Date, right: Date) {
  return left > right ? left : right;
}

function earlierDate(left: Date, right: Date) {
  return left < right ? left : right;
}

function parseMonth(value: unknown) {
  const text = cleanText(value);
  const match = /^(\d{4})-(\d{2})$/.exec(text);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (
    year < 2000 ||
    year > 2200 ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  const start = new Date(
    Date.UTC(year, month - 1, 1),
  );
  const end = new Date(
    Date.UTC(year, month, 1),
  );

  return {
    key: `${year}-${String(month).padStart(2, "0")}`,
    start,
    end,
  };
}

function getCurrentMonthKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const year = parts.find(
    (part) => part.type === "year",
  )?.value;
  const month = parts.find(
    (part) => part.type === "month",
  )?.value;

  return `${year}-${month}`;
}

function getIndiaToday() {
  const key = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return parseDateOnly(key) ?? new Date();
}

function getLeaveYearStart(
  date: Date,
  startMonth: number,
) {
  const year =
    date.getUTCMonth() + 1 >= startMonth
      ? date.getUTCFullYear()
      : date.getUTCFullYear() - 1;

  return new Date(Date.UTC(year, startMonth - 1, 1));
}

function getAllowanceBucket(
  date: Date,
  cycle: $Enums.StaffPaidLeaveCycle,
  leaveYearStartMonth: number,
) {
  if (cycle === "MONTHLY") {
    return formatDateKey(date).slice(0, 7);
  }

  return `YEAR-${formatDateKey(
    getLeaveYearStart(date, leaveYearStartMonth),
  )}`;
}

function parseStoredPayrollSettings(
  value: unknown,
): PayrollSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  const workingDaysPerMonth = parsePositiveNumber(
    value.workingDaysPerMonth,
    31,
  );
  const standardHoursPerDay = parsePositiveNumber(
    value.standardHoursPerDay,
    24,
  );

  if (
    workingDaysPerMonth === null ||
    !Number.isInteger(workingDaysPerMonth) ||
    standardHoursPerDay === null
  ) {
    return null;
  }

  const absentDeductionDays =
    parseNonNegativeNumber(
      value.absentDeductionDays,
      2,
    ) ?? DEFAULT_PAYROLL_SETTINGS.absentDeductionDays;
  const halfDayDeductionDays =
    parseNonNegativeNumber(
      value.halfDayDeductionDays,
      2,
    ) ?? DEFAULT_PAYROLL_SETTINGS.halfDayDeductionDays;
  const lateDeductionDays =
    parseNonNegativeNumber(
      value.lateDeductionDays,
      2,
    ) ?? DEFAULT_PAYROLL_SETTINGS.lateDeductionDays;

  return {
    workingDaysPerMonth,
    standardHoursPerDay: roundDays(
      standardHoursPerDay,
    ),
    absentDeductionDays: roundDays(
      absentDeductionDays,
    ),
    halfDayDeductionDays: roundDays(
      halfDayDeductionDays,
    ),
    lateDeductionDays: roundDays(
      lateDeductionDays,
    ),
  };
}

function parseStoredLeaveSettings(
  value: unknown,
): LeaveSettings {
  if (!isRecord(value)) {
    return DEFAULT_LEAVE_SETTINGS;
  }

  const weeklyOffDays = Array.isArray(
    value.weeklyOffDays,
  )
    ? Array.from(
        new Set(
          value.weeklyOffDays
            .map((day) => Number(day))
            .filter(
              (day) =>
                Number.isInteger(day) &&
                day >= 0 &&
                day <= 6,
            ),
        ),
      ).sort((left, right) => left - right)
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
    leaveYearStartMonth,
  };
}

function parsePayrollSettingsInput(
  body: SaveSettingsBody,
) {
  const workingDaysPerMonth = parsePositiveNumber(
    body.workingDaysPerMonth,
    31,
  );
  const standardHoursPerDay = parsePositiveNumber(
    body.standardHoursPerDay,
    24,
  );
  const absentDeductionDays =
    parseNonNegativeNumber(
      body.absentDeductionDays,
      2,
    );
  const halfDayDeductionDays =
    parseNonNegativeNumber(
      body.halfDayDeductionDays,
      2,
    );
  const lateDeductionDays = parseNonNegativeNumber(
    body.lateDeductionDays,
    2,
  );

  if (
    workingDaysPerMonth === null ||
    !Number.isInteger(workingDaysPerMonth)
  ) {
    throw new PayrollConflictError(
      "Working days per month must be a whole number between 1 and 31.",
    );
  }

  if (standardHoursPerDay === null) {
    throw new PayrollConflictError(
      "Standard hours per day must be between 1 and 24.",
    );
  }

  if (absentDeductionDays === null) {
    throw new PayrollConflictError(
      "Absent-day deduction must be between 0 and 2 salary days.",
    );
  }

  if (halfDayDeductionDays === null) {
    throw new PayrollConflictError(
      "Half-day deduction must be between 0 and 2 salary days.",
    );
  }

  if (lateDeductionDays === null) {
    throw new PayrollConflictError(
      "Late-day deduction must be between 0 and 2 salary days.",
    );
  }

  return {
    workingDaysPerMonth,
    standardHoursPerDay: roundDays(
      standardHoursPerDay,
    ),
    absentDeductionDays: roundDays(
      absentDeductionDays,
    ),
    halfDayDeductionDays: roundDays(
      halfDayDeductionDays,
    ),
    lateDeductionDays: roundDays(
      lateDeductionDays,
    ),
  } satisfies PayrollSettings;
}

async function loadSettings() {
  const [payrollRecord, leaveRecord] =
    await Promise.all([
      prisma.centreSetting.findUnique({
        where: { key: PAYROLL_SETTINGS_KEY },
      }),
      prisma.centreSetting.findUnique({
        where: { key: LEAVE_SETTINGS_KEY },
      }),
    ]);
  const payroll = parseStoredPayrollSettings(
    payrollRecord?.value,
  );

  return {
    payroll:
      payroll ?? DEFAULT_PAYROLL_SETTINGS,
    payrollConfigured: payroll !== null,
    leave: parseStoredLeaveSettings(
      leaveRecord?.value,
    ),
  };
}

function createPayrollNumber(monthKey: string) {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `PAY-${monthKey.replace("-", "")}-${timestamp}-${randomPart}`;
}

function createPayrollExpenseNumber(
  payrollNumber: string,
) {
  return `EXP-${payrollNumber}`;
}

function formatPayrollMonth(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "UTC",
    month: "long",
    year: "numeric",
  }).format(value);
}

function canViewPayroll(session: {
  role: "OWNER" | "CENTRE_HEAD";
  permissions: string[];
}) {
  return (
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("payroll.manage")
  );
}

function isPaymentMethod(
  value: string,
): value is PaymentMethodValue {
  return PAYMENT_METHODS.includes(
    value as PaymentMethodValue,
  );
}

function serialisePayroll(
  payroll: PayrollWithRelations,
) {
  return {
    ...payroll,
    payrollMonth: formatDateKey(
      payroll.payrollMonth,
    ).slice(0, 7),
    periodStart: formatDateKey(payroll.periodStart),
    periodEnd: formatDateKey(payroll.periodEnd),
    baseSalary: payroll.baseSalary.toString(),
    standardHoursPerDay:
      payroll.standardHoursPerDay.toString(),
    dailyRate: payroll.dailyRate.toString(),
    hourlyRate: payroll.hourlyRate.toString(),
    presentDays: payroll.presentDays.toString(),
    lateDays: payroll.lateDays.toString(),
    halfDays: payroll.halfDays.toString(),
    holidayDays: payroll.holidayDays.toString(),
    paidLeaveDays: payroll.paidLeaveDays.toString(),
    unpaidLeaveDays:
      payroll.unpaidLeaveDays.toString(),
    absentDays: payroll.absentDays.toString(),
    unmarkedDays: payroll.unmarkedDays.toString(),
    deductionDays: payroll.deductionDays.toString(),
    leaveDeduction:
      payroll.leaveDeduction.toString(),
    absenceDeduction:
      payroll.absenceDeduction.toString(),
    manualDeduction:
      payroll.manualDeduction.toString(),
    extraDutyHours:
      payroll.extraDutyHours.toString(),
    extraDutyAmount:
      payroll.extraDutyAmount.toString(),
    manualAddition:
      payroll.manualAddition.toString(),
    grossEarnings:
      payroll.grossEarnings.toString(),
    totalDeductions:
      payroll.totalDeductions.toString(),
    netPayable: payroll.netPayable.toString(),
    extraDuties: payroll.extraDuties.map(
      (duty) => ({
        ...duty,
        dutyDate: formatDateKey(duty.dutyDate),
        hours: duty.hours.toString(),
        hourlyRate: duty.hourlyRate.toString(),
        amount: duty.amount.toString(),
      }),
    ),
  };
}

function serialiseCalculation(
  calculation: PayrollCalculation,
) {
  return {
    ...calculation,
    payrollMonth: formatDateKey(
      calculation.payrollMonth,
    ).slice(0, 7),
    periodStart: formatDateKey(
      calculation.periodStart,
    ),
    periodEnd: formatDateKey(
      calculation.periodEnd,
    ),
  };
}

async function calculatePayroll(
  staff: PayrollStaff,
  month: NonNullable<ReturnType<typeof parseMonth>>,
  payrollSettings: PayrollSettings,
  leaveSettings: LeaveSettings,
  adjustments: {
    manualAddition: number;
    manualDeduction: number;
    manualAdjustmentNotes: string | null;
    notes: string | null;
  },
  existingPayrollId: string | null,
): Promise<PayrollCalculation> {
  const monthlySalary = Number(
    staff.monthlySalary?.toString() ?? "0",
  );

  if (
    !Number.isFinite(monthlySalary) ||
    monthlySalary <= 0
  ) {
    throw new PayrollConflictError(
      `${staff.name} needs a monthly salary before payroll can be generated.`,
    );
  }

  const ledgerStart =
    staff.paidLeaveCycle === "YEARLY"
      ? getLeaveYearStart(
          month.start,
          leaveSettings.leaveYearStartMonth,
        )
      : month.start;
  const employmentStart = laterDate(
    month.start,
    staff.joiningDate,
  );
  const leavingEnd = staff.leavingDate
    ? addDays(staff.leavingDate, 1)
    : month.end;
  const employmentEnd = earlierDate(
    month.end,
    leavingEnd,
  );

  if (employmentStart >= employmentEnd) {
    throw new PayrollConflictError(
      `${staff.name} was not employed during ${month.key}.`,
    );
  }

  const dailyRate = roundMoney(
    monthlySalary /
      payrollSettings.workingDaysPerMonth,
  );
  const hourlyRate = roundMoney(
    dailyRate /
      payrollSettings.standardHoursPerDay,
  );
  const isFullEmploymentMonth =
    employmentStart.getTime() ===
      month.start.getTime() &&
    employmentEnd.getTime() === month.end.getTime();
  let employedWorkingDays = 0;

  if (!isFullEmploymentMonth) {
    for (
      let cursor = employmentStart;
      cursor < employmentEnd;
      cursor = addDays(cursor, 1)
    ) {
      if (
        !leaveSettings.weeklyOffDays.includes(
          cursor.getUTCDay(),
        )
      ) {
        employedWorkingDays += 1;
      }
    }
  }

  const earnedBaseSalary = isFullEmploymentMonth
    ? roundMoney(monthlySalary)
    : roundMoney(
        dailyRate *
          Math.min(
            employedWorkingDays,
            payrollSettings.workingDaysPerMonth,
          ),
      );

  const [attendance, leaveLedger, extraDuties] =
    await Promise.all([
      prisma.staffAttendance.findMany({
        where: {
          staffId: staff.id,
          attendanceDate: {
            gte: employmentStart,
            lt: employmentEnd,
          },
        },
        select: {
          attendanceDate: true,
          status: true,
          leaveRequestId: true,
        },
        orderBy: { attendanceDate: "asc" },
      }),
      prisma.staffAttendance.findMany({
        where: {
          staffId: staff.id,
          status: "LEAVE",
          attendanceDate: {
            gte: ledgerStart,
            lt: month.end,
          },
        },
        select: {
          attendanceDate: true,
          leaveRequestId: true,
          leaveRequest: {
            select: {
              status: true,
              leaveType: true,
            },
          },
        },
        orderBy: [
          { attendanceDate: "asc" },
          { createdAt: "asc" },
        ],
      }),
      prisma.staffExtraDuty.findMany({
        where: {
          coveringStaffId: staff.id,
          dutyDate: {
            gte: month.start,
            lt: month.end,
          },
          status: "APPROVED",
          OR: [
            { payrollId: null },
            ...(existingPayrollId
              ? [{ payrollId: existingPayrollId }]
              : []),
          ],
        },
        select: {
          id: true,
          hours: true,
          amount: true,
        },
        orderBy: [
          { dutyDate: "asc" },
          { createdAt: "asc" },
        ],
      }),
    ]);

  const allowance = Number(
    staff.paidLeaveAllowance.toString(),
  );
  const allowanceRemaining = new Map<
    string,
    number
  >();
  const paidLeaveByDate = new Map<
    string,
    number
  >();

  for (const record of leaveLedger) {
    let paidPart = 0;

    if (
      record.leaveRequestId &&
      record.leaveRequest?.status === "APPROVED" &&
      record.leaveRequest.leaveType === "PAID_LEAVE" &&
      staff.paidLeaveCycle !== "NONE" &&
      allowance > 0
    ) {
      const bucket = getAllowanceBucket(
        record.attendanceDate,
        staff.paidLeaveCycle,
        leaveSettings.leaveYearStartMonth,
      );
      const remaining = allowanceRemaining.has(bucket)
        ? (allowanceRemaining.get(bucket) ?? 0)
        : allowance;
      paidPart = roundDays(
        Math.min(1, Math.max(remaining, 0)),
      );
      allowanceRemaining.set(
        bucket,
        roundDays(remaining - paidPart),
      );
    }

    if (
      record.attendanceDate >= month.start &&
      record.attendanceDate < month.end
    ) {
      paidLeaveByDate.set(
        formatDateKey(record.attendanceDate),
        paidPart,
      );
    }
  }

  let presentDays = 0;
  let lateDays = 0;
  let halfDays = 0;
  let holidayDays = 0;
  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;
  let absentDays = 0;

  const attendanceDateKeys = new Set<string>();

  for (const record of attendance) {
    const dateKey = formatDateKey(
      record.attendanceDate,
    );
    attendanceDateKeys.add(dateKey);

    if (record.status === "PRESENT") {
      presentDays += 1;
    } else if (record.status === "LATE") {
      lateDays += 1;
    } else if (record.status === "HALF_DAY") {
      halfDays += 1;
    } else if (record.status === "HOLIDAY") {
      holidayDays += 1;
    } else if (record.status === "ABSENT") {
      absentDays += 1;
    } else if (record.status === "LEAVE") {
      const paidPart =
        paidLeaveByDate.get(dateKey) ?? 0;
      paidLeaveDays = roundDays(
        paidLeaveDays + paidPart,
      );
      unpaidLeaveDays = roundDays(
        unpaidLeaveDays + (1 - paidPart),
      );
    }
  }

  const todayEnd = addDays(getIndiaToday(), 1);
  const attendanceReviewEnd = earlierDate(
    employmentEnd,
    todayEnd,
  );
  let unmarkedDays = 0;

  for (
    let cursor = employmentStart;
    cursor < attendanceReviewEnd;
    cursor = addDays(cursor, 1)
  ) {
    if (
      leaveSettings.weeklyOffDays.includes(
        cursor.getUTCDay(),
      )
    ) {
      continue;
    }

    if (!attendanceDateKeys.has(formatDateKey(cursor))) {
      unmarkedDays += 1;
    }
  }

  const absenceDeductionDays = roundDays(
    absentDays *
      payrollSettings.absentDeductionDays +
      halfDays *
        payrollSettings.halfDayDeductionDays +
      lateDays * payrollSettings.lateDeductionDays,
  );
  const deductionDays = roundDays(
    unpaidLeaveDays + absenceDeductionDays,
  );
  const leaveDeduction = roundMoney(
    unpaidLeaveDays * dailyRate,
  );
  const absenceDeduction = roundMoney(
    absenceDeductionDays * dailyRate,
  );
  const extraDutyHours = roundDays(
    extraDuties.reduce(
      (total, duty) =>
        total + Number(duty.hours.toString()),
      0,
    ),
  );
  const extraDutyAmount = roundMoney(
    extraDuties.reduce(
      (total, duty) =>
        total + Number(duty.amount.toString()),
      0,
    ),
  );
  const grossEarnings = roundMoney(
    earnedBaseSalary +
      extraDutyAmount +
      adjustments.manualAddition,
  );
  const totalDeductions = roundMoney(
    leaveDeduction +
      absenceDeduction +
      adjustments.manualDeduction,
  );
  const netPayable = roundMoney(
    Math.max(grossEarnings - totalDeductions, 0),
  );

  return {
    staffId: staff.id,
    payrollMonth: month.start,
    periodStart: employmentStart,
    periodEnd: addDays(employmentEnd, -1),
    staffNumberSnapshot: staff.staffNumber,
    staffNameSnapshot: staff.name,
    designationSnapshot: staff.designation,
    baseSalary: earnedBaseSalary,
    workingDaysInMonth:
      payrollSettings.workingDaysPerMonth,
    standardHoursPerDay:
      payrollSettings.standardHoursPerDay,
    dailyRate,
    hourlyRate,
    presentDays,
    lateDays,
    halfDays,
    holidayDays,
    paidLeaveDays,
    unpaidLeaveDays,
    absentDays,
    unmarkedDays,
    deductionDays,
    leaveDeduction,
    absenceDeduction,
    manualDeduction:
      adjustments.manualDeduction,
    extraDutyHours,
    extraDutyAmount,
    manualAddition: adjustments.manualAddition,
    grossEarnings,
    totalDeductions,
    netPayable,
    manualAdjustmentNotes:
      adjustments.manualAdjustmentNotes,
    notes: adjustments.notes,
    extraDutyIds: extraDuties.map(
      (duty) => duty.id,
    ),
  };
}

function calculationData(
  calculation: PayrollCalculation,
  status: $Enums.StaffPayrollStatus,
  generatedById: string,
) {
  return {
    staffId: calculation.staffId,
    payrollMonth: calculation.payrollMonth,
    periodStart: calculation.periodStart,
    periodEnd: calculation.periodEnd,
    status,
    staffNumberSnapshot:
      calculation.staffNumberSnapshot,
    staffNameSnapshot:
      calculation.staffNameSnapshot,
    designationSnapshot:
      calculation.designationSnapshot,
    baseSalary: calculation.baseSalary,
    workingDaysInMonth:
      calculation.workingDaysInMonth,
    standardHoursPerDay:
      calculation.standardHoursPerDay,
    dailyRate: calculation.dailyRate,
    hourlyRate: calculation.hourlyRate,
    presentDays: calculation.presentDays,
    lateDays: calculation.lateDays,
    halfDays: calculation.halfDays,
    holidayDays: calculation.holidayDays,
    paidLeaveDays: calculation.paidLeaveDays,
    unpaidLeaveDays: calculation.unpaidLeaveDays,
    absentDays: calculation.absentDays,
    unmarkedDays: calculation.unmarkedDays,
    deductionDays: calculation.deductionDays,
    leaveDeduction: calculation.leaveDeduction,
    absenceDeduction:
      calculation.absenceDeduction,
    manualDeduction:
      calculation.manualDeduction,
    extraDutyHours: calculation.extraDutyHours,
    extraDutyAmount: calculation.extraDutyAmount,
    manualAddition: calculation.manualAddition,
    grossEarnings: calculation.grossEarnings,
    totalDeductions:
      calculation.totalDeductions,
    netPayable: calculation.netPayable,
    manualAdjustmentNotes:
      calculation.manualAdjustmentNotes,
    notes: calculation.notes,
    generatedById,
    approvedById: null,
    paidById: null,
    approvedAt: null,
    paidAt: null,
    cancelledAt: null,
    paymentMethod: null,
    paymentReference: null,
  };
}

async function saveDraftPayroll(
  calculation: PayrollCalculation,
  monthKey: string,
  existing: {
    id: string;
    status: $Enums.StaffPayrollStatus;
  } | null,
  userId: string,
) {
  if (
    existing?.status === "APPROVED" ||
    existing?.status === "PAID"
  ) {
    throw new PayrollConflictError(
      "Approved or paid payroll cannot be overwritten. Cancel an approved payroll before generating it again.",
    );
  }

  return prisma.$transaction(async (transaction) => {
    if (existing) {
      await transaction.staffExtraDuty.updateMany({
        where: { payrollId: existing.id },
        data: { payrollId: null },
      });
    }

    const payroll = existing
      ? await transaction.staffPayroll.update({
          where: { id: existing.id },
          data: calculationData(
            calculation,
            "DRAFT",
            userId,
          ),
          include: payrollInclude,
        })
      : await transaction.staffPayroll.create({
          data: {
            payrollNumber:
              createPayrollNumber(monthKey),
            ...calculationData(
              calculation,
              "DRAFT",
              userId,
            ),
          },
          include: payrollInclude,
        });

    if (calculation.extraDutyIds.length > 0) {
      await transaction.staffExtraDuty.updateMany({
        where: {
          id: { in: calculation.extraDutyIds },
          status: "APPROVED",
          OR: [
            { payrollId: null },
            { payrollId: payroll.id },
          ],
        },
        data: { payrollId: payroll.id },
      });
    }

    await transaction.activityLog.create({
      data: {
        adminUserId: userId,
        action: existing ? "UPDATED" : "CREATED",
        entityType: "StaffPayroll",
        entityId: payroll.id,
        description: `${payroll.payrollNumber} ${
          existing ? "recalculated" : "generated"
        } for ${calculation.staffNameSnapshot}.`,
        newData: {
          payrollNumber: payroll.payrollNumber,
          staffId: calculation.staffId,
          month: monthKey,
          grossEarnings:
            calculation.grossEarnings,
          totalDeductions:
            calculation.totalDeductions,
          netPayable: calculation.netPayable,
          status: "DRAFT",
        },
      },
    });

    return transaction.staffPayroll.findUniqueOrThrow({
      where: { id: payroll.id },
      include: payrollInclude,
    });
  });
}

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    if (!canViewPayroll(session)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only an authorised payroll user can view salary records.",
        },
        { status: 403 },
      );
    }

    const url = new URL(request.url);
    const month = parseMonth(
      url.searchParams.get("month") ??
        getCurrentMonthKey(),
    );

    if (!month) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid payroll month in YYYY-MM format.",
        },
        { status: 400 },
      );
    }

    if (month.key > getCurrentMonthKey()) {
      return NextResponse.json(
        {
          success: false,
          message: "Future payroll months cannot be opened.",
        },
        { status: 400 },
      );
    }

    const settingsResult = await loadSettings();
    const [staffRecords, payrolls] =
      await Promise.all([
        prisma.staff.findMany({
          where: {
            joiningDate: { lt: month.end },
            OR: [
              { leavingDate: null },
              { leavingDate: { gte: month.start } },
            ],
          },
          select: staffSelect,
          orderBy: [
            { status: "asc" },
            { name: "asc" },
          ],
        }),
        prisma.staffPayroll.findMany({
          where: { payrollMonth: month.start },
          include: payrollInclude,
          orderBy: [
            { status: "asc" },
            { staffNameSnapshot: "asc" },
          ],
        }),
      ]);
    const payrollByStaff = new Map(
      payrolls.map((payroll) => [
        payroll.staffId,
        payroll,
      ]),
    );
    const staff = [];

    for (const record of staffRecords) {
      const existing =
        payrollByStaff.get(record.id) ?? null;
      let preview: ReturnType<
        typeof serialiseCalculation
      > | null = null;
      let previewError: string | null = null;

      try {
        preview = serialiseCalculation(
          await calculatePayroll(
            record,
            month,
            settingsResult.payroll,
            settingsResult.leave,
            {
              manualAddition: existing
                ? Number(
                    existing.manualAddition.toString(),
                  )
                : 0,
              manualDeduction: existing
                ? Number(
                    existing.manualDeduction.toString(),
                  )
                : 0,
              manualAdjustmentNotes:
                existing?.manualAdjustmentNotes ?? null,
              notes: existing?.notes ?? null,
            },
            existing?.id ?? null,
          ),
        );
      } catch (error) {
        previewError =
          error instanceof Error
            ? error.message
            : "Payroll preview is unavailable.";
      }

      staff.push({
        ...record,
        monthlySalary:
          record.monthlySalary?.toString() ?? null,
        paidLeaveAllowance:
          record.paidLeaveAllowance.toString(),
        payroll: existing
          ? serialisePayroll(existing)
          : null,
        preview,
        previewError,
      });
    }

    const summary = payrolls.reduce(
      (result, payroll) => {
        result.records += 1;
        if (payroll.status !== "CANCELLED") {
          result.grossEarnings = roundMoney(
            result.grossEarnings +
              Number(payroll.grossEarnings.toString()),
          );
          result.deductions = roundMoney(
            result.deductions +
              Number(
                payroll.totalDeductions.toString(),
              ),
          );
          result.netPayable = roundMoney(
            result.netPayable +
              Number(payroll.netPayable.toString()),
          );
        }
        result[
          payroll.status.toLowerCase() as
            | "draft"
            | "approved"
            | "paid"
            | "cancelled"
        ] += 1;
        return result;
      },
      {
        records: 0,
        draft: 0,
        approved: 0,
        paid: 0,
        cancelled: 0,
        grossEarnings: 0,
        deductions: 0,
        netPayable: 0,
      },
    );

    return NextResponse.json({
      success: true,
      month: month.key,
      settings: settingsResult.payroll,
      settingsConfigured:
        settingsResult.payrollConfigured,
      weeklyOffDays:
        settingsResult.leave.weeklyOffDays,
      canApprove: session.role === "OWNER",
      paymentMethods: PAYMENT_METHODS,
      staff,
      payrolls: payrolls.map(serialisePayroll),
      summary,
    });
  } catch (error) {
    console.error(
      "Unable to load staff payroll:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load staff payroll. Check the server terminal.",
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
          message:
            "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    if (!canViewPayroll(session)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to manage payroll.",
        },
        { status: 403 },
      );
    }

    let body:
      | SaveSettingsBody
      | GeneratePayrollBody;

    try {
      body = (await request.json()) as
        | SaveSettingsBody
        | GeneratePayrollBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The payroll request is invalid.",
        },
        { status: 400 },
      );
    }

    const action = cleanText(
      body.action,
    ).toLowerCase();

    if (action === "save_settings") {
      if (session.role !== "OWNER") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only the owner can change payroll calculation rules.",
          },
          { status: 403 },
        );
      }

      const settings = parsePayrollSettingsInput(
        body as SaveSettingsBody,
      );

      await prisma.$transaction(
        async (transaction) => {
          await transaction.centreSetting.upsert({
            where: { key: PAYROLL_SETTINGS_KEY },
            create: {
              key: PAYROLL_SETTINGS_KEY,
              value: settings,
              description:
                "Editable staff salary, hourly rate and attendance deduction rules.",
            },
            update: {
              value: settings,
              description:
                "Editable staff salary, hourly rate and attendance deduction rules.",
            },
          });

          await transaction.activityLog.create({
            data: {
              adminUserId: session.userId,
              action: "UPDATED",
              entityType: "StaffPayrollSettings",
              entityId: PAYROLL_SETTINGS_KEY,
              description:
                "Staff payroll calculation rules updated.",
              newData: settings,
            },
          });
        },
      );

      return NextResponse.json({
        success: true,
        message:
          "Payroll calculation settings saved.",
        settings,
      });
    }

    if (action !== "generate") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid payroll action.",
        },
        { status: 400 },
      );
    }

    const generateBody = body as GeneratePayrollBody;
    const staffId = cleanText(generateBody.staffId);
    const month = parseMonth(generateBody.month);
    const manualAddition = parseNonNegativeNumber(
      generateBody.manualAddition ?? 0,
      10000000,
    );
    const manualDeduction = parseNonNegativeNumber(
      generateBody.manualDeduction ?? 0,
      10000000,
    );

    if (!staffId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Select a staff member for payroll.",
        },
        { status: 400 },
      );
    }

    if (!month) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Select a valid payroll month.",
        },
        { status: 400 },
      );
    }

    if (month.key > getCurrentMonthKey()) {
      return NextResponse.json(
        {
          success: false,
          message: "A payroll draft cannot be generated for a future month.",
        },
        { status: 400 },
      );
    }

    if (
      manualAddition === null ||
      manualDeduction === null
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Manual additions and deductions must be valid non-negative amounts.",
        },
        { status: 400 },
      );
    }

    const settingsResult = await loadSettings();

    if (!settingsResult.payrollConfigured) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Save payroll calculation settings before generating salary.",
        },
        { status: 409 },
      );
    }

    const [staff, existing] = await Promise.all([
      prisma.staff.findUnique({
        where: { id: staffId },
        select: staffSelect,
      }),
      prisma.staffPayroll.findUnique({
        where: {
          staffId_payrollMonth: {
            staffId,
            payrollMonth: month.start,
          },
        },
        select: {
          id: true,
          status: true,
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

    const calculation = await calculatePayroll(
      staff,
      month,
      settingsResult.payroll,
      settingsResult.leave,
      {
        manualAddition: roundMoney(manualAddition),
        manualDeduction: roundMoney(manualDeduction),
        manualAdjustmentNotes: cleanOptionalText(
          generateBody.manualAdjustmentNotes,
        ),
        notes: cleanOptionalText(generateBody.notes),
      },
      existing?.id ?? null,
    );
    const payroll = await saveDraftPayroll(
      calculation,
      month.key,
      existing,
      session.userId,
    );

    return NextResponse.json(
      {
        success: true,
        message:
          calculation.unmarkedDays > 0
            ? `Payroll draft saved. ${calculation.unmarkedDays} elapsed working day(s) still need attendance before approval.`
            : "Payroll draft generated and ready for owner approval.",
        payroll: serialisePayroll(payroll),
      },
      { status: existing ? 200 : 201 },
    );
  } catch (error) {
    if (error instanceof PayrollConflictError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    console.error(
      "Unable to generate staff payroll:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The payroll draft could not be saved. Check the server terminal.",
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
          message:
            "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    if (session.role !== "OWNER") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Only the owner can approve, pay or cancel payroll.",
        },
        { status: 403 },
      );
    }

    let body: UpdatePayrollBody;

    try {
      body =
        (await request.json()) as UpdatePayrollBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The payroll update is invalid.",
        },
        { status: 400 },
      );
    }

    const payrollId = cleanText(body.payrollId);
    const action = cleanText(
      body.action,
    ).toLowerCase();

    if (!payrollId) {
      return NextResponse.json(
        {
          success: false,
          message: "Payroll record is required.",
        },
        { status: 400 },
      );
    }

    const existing =
      await prisma.staffPayroll.findUnique({
        where: { id: payrollId },
        include: payrollInclude,
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "Payroll record was not found.",
        },
        { status: 404 },
      );
    }

    const now = new Date();

    if (action === "approve") {
      if (existing.status !== "DRAFT") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only a draft payroll can be approved.",
          },
          { status: 409 },
        );
      }

      const month = parseMonth(
        formatDateKey(existing.payrollMonth).slice(
          0,
          7,
        ),
      );

      if (!month) {
        throw new PayrollConflictError(
          "The payroll month is invalid.",
        );
      }

      if (month.end > getIndiaToday()) {
        return NextResponse.json(
          {
            success: false,
            message:
              "This payroll month is still open. Approve it after the month ends and all attendance is complete.",
          },
          { status: 409 },
        );
      }

      const [settingsResult, staff, pendingLeave, pendingDuty] =
        await Promise.all([
          loadSettings(),
          prisma.staff.findUnique({
            where: { id: existing.staffId },
            select: staffSelect,
          }),
          prisma.staffLeaveRequest.count({
            where: {
              staffId: existing.staffId,
              status: "PENDING",
              startDate: { lt: month.end },
              endDate: { gte: month.start },
            },
          }),
          prisma.staffExtraDuty.count({
            where: {
              coveringStaffId: existing.staffId,
              status: "PENDING",
              dutyDate: {
                gte: month.start,
                lt: month.end,
              },
            },
          }),
        ]);

      if (!settingsResult.payrollConfigured) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Payroll settings must be configured before approval.",
          },
          { status: 409 },
        );
      }

      if (!staff) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The staff record linked to this payroll was not found.",
          },
          { status: 404 },
        );
      }

      if (pendingLeave > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Approve or reject all pending leave requests for this month before payroll approval.",
          },
          { status: 409 },
        );
      }

      if (pendingDuty > 0) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Approve or cancel pending extra-duty records for this month before payroll approval.",
          },
          { status: 409 },
        );
      }

      const calculation = await calculatePayroll(
        staff,
        month,
        settingsResult.payroll,
        settingsResult.leave,
        {
          manualAddition: Number(
            existing.manualAddition.toString(),
          ),
          manualDeduction: Number(
            existing.manualDeduction.toString(),
          ),
          manualAdjustmentNotes:
            existing.manualAdjustmentNotes,
          notes:
            cleanOptionalText(body.notes) ??
            existing.notes,
        },
        existing.id,
      );

      if (calculation.unmarkedDays > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `${calculation.unmarkedDays} elapsed working day(s) have no attendance. Complete attendance before approving payroll.`,
          },
          { status: 409 },
        );
      }

      const approved = await prisma.$transaction(
        async (transaction) => {
          await transaction.staffExtraDuty.updateMany({
            where: { payrollId: existing.id },
            data: { payrollId: null },
          });

          if (calculation.extraDutyIds.length > 0) {
            await transaction.staffExtraDuty.updateMany({
              where: {
                id: {
                  in: calculation.extraDutyIds,
                },
                status: "APPROVED",
                OR: [
                  { payrollId: null },
                  { payrollId: existing.id },
                ],
              },
              data: { payrollId: existing.id },
            });
          }

          const saved =
            await transaction.staffPayroll.update({
              where: { id: existing.id },
              data: {
                ...calculationData(
                  calculation,
                  "APPROVED",
                  existing.generatedById ??
                    session.userId,
                ),
                approvedById: session.userId,
                approvedAt: now,
              },
              include: payrollInclude,
            });

          await transaction.activityLog.create({
            data: {
              adminUserId: session.userId,
              action: "UPDATED",
              entityType: "StaffPayroll",
              entityId: existing.id,
              description: `${existing.payrollNumber} approved for ${existing.staffNameSnapshot}.`,
              previousData: { status: "DRAFT" },
              newData: {
                status: "APPROVED",
                netPayable: calculation.netPayable,
              },
            },
          });

          return saved;
        },
      );

      return NextResponse.json({
        success: true,
        message:
          "Payroll recalculated and approved.",
        payroll: serialisePayroll(approved),
      });
    }

    if (action === "mark_paid") {
      if (existing.status !== "APPROVED") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Approve payroll before marking it paid.",
          },
          { status: 409 },
        );
      }

      const paymentMethodText = cleanText(
        body.paymentMethod,
      ).toUpperCase();

      if (!isPaymentMethod(paymentMethodText)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Select a valid salary payment method.",
          },
          { status: 400 },
        );
      }

      const paid = await prisma.$transaction(
        async (transaction) => {
          const paymentReference =
            cleanOptionalText(
              body.paymentReference,
            );
          const netPayable = Number(
            existing.netPayable.toString(),
          );

          const saved =
            await transaction.staffPayroll.update({
              where: { id: existing.id },
              data: {
                status: "PAID",
                paymentMethod: paymentMethodText,
                paymentReference,
                notes:
                  cleanOptionalText(body.notes) ??
                  existing.notes,
                paidById: session.userId,
                paidAt: now,
              },
              include: payrollInclude,
            });

          await transaction.staffExtraDuty.updateMany({
            where: {
              payrollId: existing.id,
              status: "APPROVED",
            },
            data: {
              status: "PAID",
              paidAt: now,
            },
          });

          const payrollExpenseNumber =
            createPayrollExpenseNumber(
              existing.payrollNumber,
            );

          const existingSalaryExpense =
            await transaction.expense.findFirst({
              where: {
                OR: [
                  {
                    expenseNumber:
                      payrollExpenseNumber,
                  },
                  {
                    category: "SALARY",
                    invoiceNumber:
                      existing.payrollNumber,
                  },
                ],
              },
              select: {
                id: true,
              },
            });

          if (
            !existingSalaryExpense &&
            netPayable > 0
          ) {
            const salaryExpense =
              await transaction.expense.create({
                data: {
                  expenseNumber:
                    payrollExpenseNumber,
                  category: "SALARY",
                  title: `Salary - ${existing.staffNameSnapshot} - ${formatPayrollMonth(
                    existing.payrollMonth,
                  )}`,
                  vendorName:
                    existing.staffNameSnapshot,
                  expenseDate: now,
                  amountBeforeTax: netPayable,
                  gstApplicable: false,
                  gstRate: null,
                  cgstAmount: 0,
                  sgstAmount: 0,
                  totalAmount: netPayable,
                  paymentMethod:
                    paymentMethodText,
                  transactionReference:
                    paymentReference,
                  invoiceNumber:
                    existing.payrollNumber,
                  invoiceFileUrl: null,
                  notes:
                    "Automatically recorded when this staff payroll was marked paid.",
                  createdById: session.userId,
                },
              });

            await transaction.activityLog.create({
              data: {
                adminUserId: session.userId,
                action: "CREATED",
                entityType: "Expense",
                entityId: salaryExpense.id,
                description: `${salaryExpense.expenseNumber} automatically created from ${existing.payrollNumber}.`,
                newData: {
                  category: "SALARY",
                  payrollNumber:
                    existing.payrollNumber,
                  staffName:
                    existing.staffNameSnapshot,
                  totalAmount: netPayable,
                  paymentMethod:
                    paymentMethodText,
                  paymentReference,
                },
              },
            });
          }

          await transaction.activityLog.create({
            data: {
              adminUserId: session.userId,
              action: "UPDATED",
              entityType: "StaffPayroll",
              entityId: existing.id,
              description: `${existing.payrollNumber} marked paid for ${existing.staffNameSnapshot}.`,
              previousData: {
                status: "APPROVED",
              },
              newData: {
                status: "PAID",
                paymentMethod: paymentMethodText,
                paymentReference,
                netPayable,
                salaryExpenseNumber:
                  netPayable > 0
                    ? payrollExpenseNumber
                    : null,
              },
            },
          });

          return transaction.staffPayroll.findUniqueOrThrow({
            where: { id: saved.id },
            include: payrollInclude,
          });
        },
      );

      return NextResponse.json({
        success: true,
        message:
          "Salary marked paid, salary expense recorded and linked extra-duty amounts closed as paid.",
        payroll: serialisePayroll(paid),
      });
    }

    if (action === "cancel") {
      if (
        existing.status === "PAID" ||
        existing.status === "CANCELLED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Paid or already-cancelled payroll cannot be cancelled.",
          },
          { status: 409 },
        );
      }

      const cancelled = await prisma.$transaction(
        async (transaction) => {
          await transaction.staffExtraDuty.updateMany({
            where: { payrollId: existing.id },
            data: { payrollId: null },
          });

          const saved =
            await transaction.staffPayroll.update({
              where: { id: existing.id },
              data: {
                status: "CANCELLED",
                cancelledAt: now,
                notes:
                  cleanOptionalText(body.notes) ??
                  existing.notes,
              },
              include: payrollInclude,
            });

          await transaction.activityLog.create({
            data: {
              adminUserId: session.userId,
              action: "CANCELLED",
              entityType: "StaffPayroll",
              entityId: existing.id,
              description: `${existing.payrollNumber} cancelled for ${existing.staffNameSnapshot}.`,
              previousData: {
                status: existing.status,
              },
              newData: { status: "CANCELLED" },
            },
          });

          return saved;
        },
      );

      return NextResponse.json({
        success: true,
        message:
          "Payroll cancelled. Approved extra-duty records are available for a new payroll draft.",
        payroll: serialisePayroll(cancelled),
      });
    }

    return NextResponse.json(
      {
        success: false,
        message:
          "Please select approve, mark paid or cancel.",
      },
      { status: 400 },
    );
  } catch (error) {
    if (error instanceof PayrollConflictError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 409 },
      );
    }

    console.error(
      "Unable to update staff payroll:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The payroll record could not be updated. Check the server terminal.",
      },
      { status: 500 },
    );
  }
}
