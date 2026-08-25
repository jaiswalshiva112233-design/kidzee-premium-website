import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const PAYROLL_SETTINGS_KEY =
  "STAFF_PAYROLL_SETTINGS";

const EXTRA_DUTY_STATUSES = [
  "PENDING",
  "APPROVED",
  "PAID",
  "CANCELLED",
] as const;

type ExtraDutyStatusValue =
  (typeof EXTRA_DUTY_STATUSES)[number];

type PayrollSettings = {
  workingDaysPerMonth: number;
  standardHoursPerDay: number;
};

type CreateDutyBody = {
  action?: unknown;
  coveringStaffId?: unknown;
  absentStaffId?: unknown;
  dutyDate?: unknown;
  startTime?: unknown;
  endTime?: unknown;
  reason?: unknown;
  notes?: unknown;
};

type SaveSettingsBody = {
  action?: unknown;
  workingDaysPerMonth?: unknown;
  standardHoursPerDay?: unknown;
};

type UpdateDutyBody = {
  action?: unknown;
  dutyId?: unknown;
  notes?: unknown;
};

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

function parsePositiveNumber(
  value: unknown,
  maximum: number,
) {
  const numberValue =
    typeof value === "number"
      ? value
      : Number(cleanText(value));

  if (
    !Number.isFinite(numberValue) ||
    numberValue <= 0 ||
    numberValue > maximum
  ) {
    return null;
  }

  return numberValue;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundHours(value: number) {
  return Math.round(value * 100) / 100;
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
    String(value.getUTCMonth() + 1).padStart(
      2,
      "0",
    ),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function parseMonth(value: unknown) {
  const text = cleanText(value);
  const match = /^(\d{4})-(\d{2})$/.exec(text);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);

  if (year < 2000 || year > 2200 || month < 1 || month > 12) {
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
  const parts =
    new Intl.DateTimeFormat("en-CA", {
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

function parseTimeForDate(
  dutyDate: Date,
  value: unknown,
) {
  const text = cleanText(value);
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
    text,
  );

  if (!match) {
    return null;
  }

  const indiaOffsetMinutes = 330;

  return new Date(
    Date.UTC(
      dutyDate.getUTCFullYear(),
      dutyDate.getUTCMonth(),
      dutyDate.getUTCDate(),
      Number(match[1]),
      Number(match[2]),
    ) -
      indiaOffsetMinutes * 60 * 1000,
  );
}

function formatTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function parseStoredSettings(
  value: unknown,
): PayrollSettings | null {
  if (!isRecord(value)) {
    return null;
  }

  const workingDaysPerMonth =
    parsePositiveNumber(
      value.workingDaysPerMonth,
      31,
    );
  const standardHoursPerDay =
    parsePositiveNumber(
      value.standardHoursPerDay,
      24,
    );

  if (
    workingDaysPerMonth === null ||
    standardHoursPerDay === null
  ) {
    return null;
  }

  return {
    workingDaysPerMonth,
    standardHoursPerDay,
  };
}

function createDutyNumber() {
  const year = new Date().getFullYear();
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `XDT-${year}-${timestamp}-${randomPart}`;
}

function canManageAttendance(session: {
  role: "OWNER" | "CENTRE_HEAD";
  permissions: string[];
}) {
  return (
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("staff.view") ||
    session.permissions.includes(
      "attendance.manage",
    )
  );
}

function serialiseDuty(duty: {
  id: string;
  dutyNumber: string;
  dutyDate: Date;
  startAt: Date;
  endAt: Date;
  hours: { toString(): string };
  hourlyRate: { toString(): string };
  amount: { toString(): string };
  reason: string;
  status: $Enums.StaffExtraDutyStatus;
  notes: string | null;
  approvedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  coveringStaff: {
    id: string;
    staffNumber: string;
    name: string;
    designation: string;
  };
  absentStaff: {
    id: string;
    staffNumber: string;
    name: string;
    designation: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
  } | null;
  approvedBy: {
    id: string;
    name: string;
  } | null;
}) {
  return {
    id: duty.id,
    dutyNumber: duty.dutyNumber,
    dutyDate: formatDateKey(duty.dutyDate),
    startTime: formatTime(duty.startAt),
    endTime: formatTime(duty.endAt),
    hours: duty.hours.toString(),
    hourlyRate: duty.hourlyRate.toString(),
    amount: duty.amount.toString(),
    reason: duty.reason,
    status: duty.status,
    notes: duty.notes,
    coveringStaff: duty.coveringStaff,
    absentStaff: duty.absentStaff,
    createdBy: duty.createdBy,
    approvedBy: duty.approvedBy,
    approvedAt: duty.approvedAt,
    paidAt: duty.paidAt,
    createdAt: duty.createdAt,
    updatedAt: duty.updatedAt,
  };
}

const dutyInclude = {
  coveringStaff: {
    select: {
      id: true,
      staffNumber: true,
      name: true,
      designation: true,
    },
  },
  absentStaff: {
    select: {
      id: true,
      staffNumber: true,
      name: true,
      designation: true,
    },
  },
  createdBy: {
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
} as const;

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

    if (!canManageAttendance(session)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to view substitute duties.",
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
            "Please provide a valid month in YYYY-MM format.",
        },
        { status: 400 },
      );
    }

    const requestedStatus = cleanText(
      url.searchParams.get("status"),
    ).toUpperCase();

    const status = EXTRA_DUTY_STATUSES.includes(
      requestedStatus as ExtraDutyStatusValue,
    )
      ? (requestedStatus as ExtraDutyStatusValue)
      : null;

    const [setting, staffRecords, duties] =
      await Promise.all([
        prisma.centreSetting.findUnique({
          where: {
            key: PAYROLL_SETTINGS_KEY,
          },
        }),
        prisma.staff.findMany({
          select: {
            id: true,
            staffNumber: true,
            name: true,
            designation: true,
            status: true,
            joiningDate: true,
            leavingDate: true,
            monthlySalary: true,
          },
          orderBy: [
            { status: "asc" },
            { name: "asc" },
          ],
        }),
        prisma.staffExtraDuty.findMany({
          where: {
            dutyDate: {
              gte: month.start,
              lt: month.end,
            },
            ...(status ? { status } : {}),
          },
          include: dutyInclude,
          orderBy: [
            { dutyDate: "desc" },
            { startAt: "desc" },
          ],
        }),
      ]);

    const settings = parseStoredSettings(
      setting?.value,
    );

    const totals = duties.reduce(
      (result, duty) => {
        const amount = Number(
          duty.amount.toString(),
        );
        const hours = Number(
          duty.hours.toString(),
        );

        result.hours = roundHours(
          result.hours + hours,
        );
        result.amount = roundMoney(
          result.amount + amount,
        );

        if (duty.status === "PENDING") {
          result.pending += 1;
        } else if (duty.status === "APPROVED") {
          result.approved += 1;
        } else if (duty.status === "PAID") {
          result.paid += 1;
        } else if (duty.status === "CANCELLED") {
          result.cancelled += 1;
        }

        return result;
      },
      {
        records: duties.length,
        hours: 0,
        amount: 0,
        pending: 0,
        approved: 0,
        paid: 0,
        cancelled: 0,
      },
    );

    return NextResponse.json({
      success: true,
      month: month.key,
      settings,
      settingsConfigured: settings !== null,
      canApprove: session.role === "OWNER",
      staff: staffRecords.map((staff) => ({
        ...staff,
        monthlySalary:
          staff.monthlySalary?.toString() ??
          null,
      })),
      duties: duties.map(serialiseDuty),
      totals,
    });
  } catch (error) {
    console.error(
      "Unable to load substitute duties:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load substitute duties. Check the server terminal.",
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

    let body:
      | CreateDutyBody
      | SaveSettingsBody;

    try {
      body = (await request.json()) as
        | CreateDutyBody
        | SaveSettingsBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "The substitute-duty request is invalid.",
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
              "Only the owner can change salary calculation settings.",
          },
          { status: 403 },
        );
      }

      const settingsBody =
        body as SaveSettingsBody;
      const workingDaysPerMonth =
        parsePositiveNumber(
          settingsBody.workingDaysPerMonth,
          31,
        );
      const standardHoursPerDay =
        parsePositiveNumber(
          settingsBody.standardHoursPerDay,
          24,
        );

      if (
        workingDaysPerMonth === null ||
        !Number.isInteger(
          workingDaysPerMonth,
        )
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Working days per month must be a whole number between 1 and 31.",
          },
          { status: 400 },
        );
      }

      if (standardHoursPerDay === null) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Standard working hours per day must be between 1 and 24.",
          },
          { status: 400 },
        );
      }

      const settings: PayrollSettings = {
        workingDaysPerMonth,
        standardHoursPerDay:
          roundHours(standardHoursPerDay),
      };

      await prisma.$transaction(
        async (transaction) => {
          const existingSetting =
            await transaction.centreSetting.findUnique({
              where: {
                key: PAYROLL_SETTINGS_KEY,
              },
            });
          const mergedSettings = {
            ...(isRecord(existingSetting?.value)
              ? existingSetting.value
              : {}),
            ...settings,
          };

          await transaction.centreSetting.upsert({
            where: {
              key: PAYROLL_SETTINGS_KEY,
            },
            create: {
              key: PAYROLL_SETTINGS_KEY,
              value: mergedSettings,
              description:
                "Editable staff hourly salary calculation settings.",
            },
            update: {
              value: mergedSettings,
              description:
                "Editable staff hourly salary calculation settings.",
            },
          });

          await transaction.activityLog.create({
            data: {
              adminUserId: session.userId,
              action: "UPDATED",
              entityType:
                "StaffPayrollSettings",
              entityId: PAYROLL_SETTINGS_KEY,
              description:
                "Staff hourly salary calculation settings updated.",
              newData: mergedSettings,
            },
          });
        },
      );

      return NextResponse.json({
        success: true,
        message:
          "Staff salary calculation settings saved.",
        settings,
      });
    }

    if (action !== "create") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid substitute-duty action.",
        },
        { status: 400 },
      );
    }

    if (!canManageAttendance(session)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to record substitute duties.",
        },
        { status: 403 },
      );
    }

    const dutyBody = body as CreateDutyBody;
    const coveringStaffId = cleanText(
      dutyBody.coveringStaffId,
    );
    const absentStaffId = cleanText(
      dutyBody.absentStaffId,
    );
    const dutyDate = parseDateOnly(
      dutyBody.dutyDate,
    );
    const reason =
      cleanText(dutyBody.reason) ||
      "LEAVE_COVER";

    if (!coveringStaffId || !absentStaffId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Select both the absent staff member and the substitute staff member.",
        },
        { status: 400 },
      );
    }

    if (coveringStaffId === absentStaffId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "The absent and substitute staff members must be different.",
        },
        { status: 400 },
      );
    }

    if (!dutyDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid substitute-duty date.",
        },
        { status: 400 },
      );
    }

    const startAt = parseTimeForDate(
      dutyDate,
      dutyBody.startTime,
    );
    const endAt = parseTimeForDate(
      dutyDate,
      dutyBody.endTime,
    );

    if (!startAt || !endAt) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Enter valid start and end times for the extra duty.",
        },
        { status: 400 },
      );
    }

    if (endAt <= startAt) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Extra-duty end time must be later than its start time.",
        },
        { status: 400 },
      );
    }

    const hours = roundHours(
      (endAt.getTime() - startAt.getTime()) /
        (60 * 60 * 1000),
    );

    if (hours <= 0 || hours > 16) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Extra duty must be longer than zero and cannot exceed 16 hours in one entry.",
        },
        { status: 400 },
      );
    }

    const [setting, coveringStaff, absentStaff] =
      await Promise.all([
        prisma.centreSetting.findUnique({
          where: {
            key: PAYROLL_SETTINGS_KEY,
          },
        }),
        prisma.staff.findUnique({
          where: { id: coveringStaffId },
        }),
        prisma.staff.findUnique({
          where: { id: absentStaffId },
        }),
      ]);

    const settings = parseStoredSettings(
      setting?.value,
    );

    if (!settings) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Configure working days and daily working hours before recording extra-duty salary.",
        },
        { status: 409 },
      );
    }

    if (!coveringStaff || !absentStaff) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or both staff records could not be found.",
        },
        { status: 404 },
      );
    }

    const invalidEmployment = [
      coveringStaff,
      absentStaff,
    ].find(
      (staff) =>
        staff.joiningDate > dutyDate ||
        (staff.leavingDate !== null &&
          staff.leavingDate < dutyDate),
    );

    if (invalidEmployment) {
      return NextResponse.json(
        {
          success: false,
          message: `${invalidEmployment.name} was not employed on the selected date.`,
        },
        { status: 409 },
      );
    }

    const monthlySalary = Number(
      coveringStaff.monthlySalary?.toString() ??
        "0",
    );

    if (
      !Number.isFinite(monthlySalary) ||
      monthlySalary <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `${coveringStaff.name} needs a monthly salary before hourly substitute pay can be calculated.`,
        },
        { status: 409 },
      );
    }

    const [coverAttendance, absentAttendance] =
      await Promise.all([
        prisma.staffAttendance.findUnique({
          where: {
            staffId_attendanceDate: {
              staffId: coveringStaffId,
              attendanceDate: dutyDate,
            },
          },
          select: { status: true },
        }),
        prisma.staffAttendance.findUnique({
          where: {
            staffId_attendanceDate: {
              staffId: absentStaffId,
              attendanceDate: dutyDate,
            },
          },
          select: { status: true },
        }),
      ]);

    if (
      !coverAttendance ||
      ![
        "PRESENT",
        "LATE",
        "HALF_DAY",
      ].includes(coverAttendance.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Mark ${coveringStaff.name} present before recording extra duty.`,
        },
        { status: 409 },
      );
    }

    if (
      !absentAttendance ||
      ![
        "ABSENT",
        "LEAVE",
        "HALF_DAY",
      ].includes(absentAttendance.status)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: `Mark ${absentStaff.name} absent, on leave or half day before assigning a substitute.`,
        },
        { status: 409 },
      );
    }

    const monthlyHours =
      settings.workingDaysPerMonth *
      settings.standardHoursPerDay;
    const hourlyRate = roundMoney(
      monthlySalary / monthlyHours,
    );
    const amount = roundMoney(
      hourlyRate * hours,
    );

    const duty = await prisma.$transaction(
      async (transaction) => {
        const created =
          await transaction.staffExtraDuty.create({
            data: {
              dutyNumber: createDutyNumber(),
              coveringStaffId,
              absentStaffId,
              dutyDate,
              startAt,
              endAt,
              hours,
              hourlyRate,
              amount,
              reason,
              status: "PENDING",
              notes: cleanOptionalText(
                dutyBody.notes,
              ),
              createdById: session.userId,
            },
            include: dutyInclude,
          });

        await transaction.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "CREATED",
            entityType: "StaffExtraDuty",
            entityId: created.id,
            description: `${created.dutyNumber} created for ${coveringStaff.name} covering ${absentStaff.name}.`,
            newData: {
              dutyNumber: created.dutyNumber,
              dutyDate: formatDateKey(dutyDate),
              coveringStaffId,
              absentStaffId,
              hours,
              hourlyRate,
              amount,
              status: "PENDING",
            },
          },
        });

        return created;
      },
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Substitute duty recorded and sent for owner approval.",
        duty: serialiseDuty(duty),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Unable to save substitute duty:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The substitute-duty record could not be saved. Check the server terminal.",
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
            "Only the owner can approve or cancel substitute-duty salary.",
        },
        { status: 403 },
      );
    }

    let body: UpdateDutyBody;

    try {
      body =
        (await request.json()) as UpdateDutyBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "The substitute-duty update is invalid.",
        },
        { status: 400 },
      );
    }

    const dutyId = cleanText(body.dutyId);
    const action = cleanText(
      body.action,
    ).toLowerCase();

    if (!dutyId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Substitute-duty record is required.",
        },
        { status: 400 },
      );
    }

    const existing =
      await prisma.staffExtraDuty.findUnique({
        where: { id: dutyId },
        include: dutyInclude,
      });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Substitute-duty record was not found.",
        },
        { status: 404 },
      );
    }

    let nextStatus: ExtraDutyStatusValue;

    if (action === "approve") {
      if (existing.status !== "PENDING") {
        return NextResponse.json(
          {
            success: false,
            message:
              "Only pending substitute duties can be approved.",
          },
          { status: 409 },
        );
      }

      nextStatus = "APPROVED";
    } else if (action === "mark_paid") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Approved substitute duty is paid through monthly payroll so the payslip and salary expense stay reconciled.",
        },
        { status: 409 },
      );
    } else if (action === "cancel") {
      if (
        existing.status === "PAID" ||
        existing.status === "CANCELLED"
      ) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Paid or already-cancelled duties cannot be cancelled.",
          },
          { status: 409 },
        );
      }

      nextStatus = "CANCELLED";
    } else {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select approve or cancel.",
        },
        { status: 400 },
      );
    }

    const now = new Date();

    const updated = await prisma.$transaction(
      async (transaction) => {
        const saved =
          await transaction.staffExtraDuty.update({
            where: { id: dutyId },
            data: {
              status: nextStatus,
              notes:
                cleanOptionalText(body.notes) ??
                existing.notes,
              ...(nextStatus === "APPROVED"
                ? {
                    approvedById: session.userId,
                    approvedAt: now,
                  }
                : {}),
            },
            include: dutyInclude,
          });

        await transaction.activityLog.create({
          data: {
            adminUserId: session.userId,
            action:
              nextStatus === "CANCELLED"
                ? "CANCELLED"
                : "UPDATED",
            entityType: "StaffExtraDuty",
            entityId: saved.id,
            description: `${saved.dutyNumber} changed from ${existing.status} to ${nextStatus}.`,
            previousData: {
              status: existing.status,
            },
            newData: {
              status: nextStatus,
            },
          },
        });

        return saved;
      },
    );

    return NextResponse.json({
      success: true,
      message:
        nextStatus === "APPROVED"
          ? "Substitute-duty salary approved."
          : "Substitute duty cancelled.",
      duty: serialiseDuty(updated),
    });
  } catch (error) {
    console.error(
      "Unable to update substitute duty:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The substitute-duty record could not be updated. Check the server terminal.",
      },
      { status: 500 },
    );
  }
}
