import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const ATTENDANCE_STATUSES = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "HALF_DAY",
  "LEAVE",
  "HOLIDAY",
] as const;

type AttendanceStatusValue = (typeof ATTENDANCE_STATUSES)[number];

type StaffAttendanceEntryInput = {
  staffId?: unknown;
  status?: unknown;
  checkInTime?: unknown;
  checkOutTime?: unknown;
  notes?: unknown;
};

type SaveStaffAttendanceBody = {
  date?: unknown;
  entries?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function isAttendanceStatus(value: string): value is AttendanceStatusValue {
  return ATTENDANCE_STATUSES.includes(value as AttendanceStatusValue);
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

function getTodayDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseTimeForDate(attendanceDate: Date, value: unknown) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(text);

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const indiaOffsetMinutes = 330;

  return new Date(
    Date.UTC(
      attendanceDate.getUTCFullYear(),
      attendanceDate.getUTCMonth(),
      attendanceDate.getUTCDate(),
      hours,
      minutes,
    ) -
      indiaOffsetMinutes * 60 * 1000,
  );
}

function formatTime(value: Date | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function calculateSummary(
  records: Array<{
    status: $Enums.AttendanceStatus;
  }>,
  totalStaff: number,
) {
  const summary = {
    totalStaff,
    marked: records.length,
    unmarked: Math.max(totalStaff - records.length, 0),
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    holiday: 0,
  };

  for (const record of records) {
    if (record.status === "PRESENT") {
      summary.present += 1;
    } else if (record.status === "ABSENT") {
      summary.absent += 1;
    } else if (record.status === "LATE") {
      summary.late += 1;
    } else if (record.status === "HALF_DAY") {
      summary.halfDay += 1;
    } else if (record.status === "LEAVE") {
      summary.leave += 1;
    } else if (record.status === "HOLIDAY") {
      summary.holiday += 1;
    }
  }

  return summary;
}

async function getAuthorisedSession() {
  const session = await getAdminSession();

  if (!session) {
    return {
      session: null,
      response: NextResponse.json(
        {
          success: false,
          message: "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      ),
    };
  }

  const allowed =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("attendance.manage") ||
    session.permissions.includes("staff.view");

  if (!allowed) {
    return {
      session: null,
      response: NextResponse.json(
        {
          success: false,
          message: "You do not have permission to manage staff attendance.",
        },
        { status: 403 },
      ),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function GET(request: Request) {
  try {
    const authorisation = await getAuthorisedSession();

    if (authorisation.response) {
      return authorisation.response;
    }

    const url = new URL(request.url);
    const requestedDate = url.searchParams.get("date") ?? getTodayDateKey();

    const attendanceDate = parseDateOnly(requestedDate);

    if (!attendanceDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid attendance date in YYYY-MM-DD format.",
        },
        { status: 400 },
      );
    }

    if (formatDateKey(attendanceDate) > getTodayDateKey()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Staff attendance cannot be opened for a future date.",
        },
        { status: 400 },
      );
    }

    const [staffRecords, attendanceRecords] = await Promise.all([
      prisma.staff.findMany({
        where: {
          joiningDate: {
            lte: attendanceDate,
          },
          OR: [
            { leavingDate: null },
            {
              leavingDate: {
                gte: attendanceDate,
              },
            },
          ],
        },
        select: {
          id: true,
          staffNumber: true,
          name: true,
          designation: true,
          phone: true,
          joiningDate: true,
        },
        orderBy: [{ designation: "asc" }, { name: "asc" }],
      }),
      prisma.staffAttendance.findMany({
        where: {
          attendanceDate,
        },
        select: {
          id: true,
          staffId: true,
          status: true,
          checkInAt: true,
          checkOutAt: true,
          notes: true,
          leaveRequestId: true,
          isSandwichDay: true,
          createdAt: true,
          updatedAt: true,
          leaveRequest: {
            select: {
              id: true,
              leaveNumber: true,
              leaveType: true,
              status: true,
            },
          },
          markedBy: {
            select: {
              id: true,
              name: true,
              role: true,
            },
          },
        },
      }),
    ]);

    const attendanceMap = new Map(
      attendanceRecords.map((record) => [record.staffId, record]),
    );

    const register = staffRecords.map((staff) => {
      const attendance = attendanceMap.get(staff.id) ?? null;

      return {
        staff: {
          id: staff.id,
          staffNumber: staff.staffNumber,
          name: staff.name,
          designation: staff.designation,
          phone: staff.phone,
          joiningDate: staff.joiningDate,
        },
        attendance: attendance
          ? {
              id: attendance.id,
              status: attendance.status,
              checkInTime: formatTime(attendance.checkInAt),
              checkOutTime: formatTime(attendance.checkOutAt),
              notes: attendance.notes ?? "",
              leaveRequestId: attendance.leaveRequestId,
              isSandwichDay: attendance.isSandwichDay,
              lockedByApprovedLeave:
                attendance.leaveRequest?.status === "APPROVED",
              leaveRequest: attendance.leaveRequest,
              markedBy: attendance.markedBy,
              createdAt: attendance.createdAt,
              updatedAt: attendance.updatedAt,
            }
          : {
              id: null,
              status: null,
              checkInTime: "",
              checkOutTime: "",
              notes: "",
              leaveRequestId: null,
              isSandwichDay: false,
              lockedByApprovedLeave: false,
              leaveRequest: null,
              markedBy: null,
              createdAt: null,
              updatedAt: null,
            },
      };
    });

    return NextResponse.json({
      success: true,
      date: formatDateKey(attendanceDate),
      statuses: ATTENDANCE_STATUSES,
      register,
      summary: calculateSummary(attendanceRecords, staffRecords.length),
    });
  } catch (error) {
    console.error("Unable to load staff attendance:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the staff attendance register. Please try again. If the problem continues, contact the Owner.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authorisation = await getAuthorisedSession();

    if (authorisation.response || !authorisation.session) {
      return authorisation.response;
    }

    let body: SaveStaffAttendanceBody;

    try {
      body = (await request.json()) as SaveStaffAttendanceBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The staff attendance request is invalid.",
        },
        { status: 400 },
      );
    }

    const attendanceDate = parseDateOnly(body.date);

    if (!attendanceDate) {
      return NextResponse.json(
        {
          success: false,
          message: "Please provide a valid attendance date.",
        },
        { status: 400 },
      );
    }

    if (formatDateKey(attendanceDate) > getTodayDateKey()) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Staff attendance cannot be marked for a future date.",
        },
        { status: 400 },
      );
    }

    if (!Array.isArray(body.entries)) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff attendance entries are required.",
        },
        { status: 400 },
      );
    }

    const rawEntries = body.entries as StaffAttendanceEntryInput[];

    if (rawEntries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Please mark at least one staff member.",
        },
        { status: 400 },
      );
    }

    const normalisedEntries: Array<{
      staffId: string;
      status: $Enums.AttendanceStatus;
      checkInAt: Date | null;
      checkOutAt: Date | null;
      notes: string | null;
    }> = [];

    const staffIds = new Set<string>();

    for (let index = 0; index < rawEntries.length; index += 1) {
      const entry = rawEntries[index];

      if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
        return NextResponse.json(
          {
            success: false,
            message: `Staff attendance entry ${index + 1} is invalid.`,
          },
          { status: 400 },
        );
      }

      const staffId = cleanText(entry.staffId);
      const statusText = cleanText(entry.status);

      if (!staffId) {
        return NextResponse.json(
          {
            success: false,
            message: `Staff member is missing from entry ${index + 1}.`,
          },
          { status: 400 },
        );
      }

      if (staffIds.has(staffId)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The same staff member cannot appear twice in one register.",
          },
          { status: 400 },
        );
      }

      staffIds.add(staffId);

      if (!isAttendanceStatus(statusText)) {
        return NextResponse.json(
          {
            success: false,
            message: `Select a valid status for staff entry ${index + 1}.`,
          },
          { status: 400 },
        );
      }

      const checkInText = cleanText(entry.checkInTime);
      const checkOutText = cleanText(entry.checkOutTime);

      const checkInAt = checkInText
        ? parseTimeForDate(attendanceDate, checkInText)
        : null;
      const checkOutAt = checkOutText
        ? parseTimeForDate(attendanceDate, checkOutText)
        : null;

      if (checkInText && !checkInAt) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid check-in time for staff entry ${index + 1}.`,
          },
          { status: 400 },
        );
      }

      if (checkOutText && !checkOutAt) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid check-out time for staff entry ${index + 1}.`,
          },
          { status: 400 },
        );
      }

      if (checkInAt && checkOutAt && checkOutAt <= checkInAt) {
        return NextResponse.json(
          {
            success: false,
            message: `Check-out must be later than check-in for staff entry ${
              index + 1
            }.`,
          },
          { status: 400 },
        );
      }

      const status = statusText as $Enums.AttendanceStatus;
      const keepsTime =
        status === "PRESENT" || status === "LATE" || status === "HALF_DAY";

      normalisedEntries.push({
        staffId,
        status,
        checkInAt: keepsTime ? checkInAt : null,
        checkOutAt: keepsTime ? checkOutAt : null,
        notes: cleanOptionalText(entry.notes),
      });
    }

    const existingStaff = await prisma.staff.findMany({
      where: {
        id: {
          in: Array.from(staffIds),
        },
      },
      select: {
        id: true,
        name: true,
        staffNumber: true,
        joiningDate: true,
        leavingDate: true,
      },
    });

    if (existingStaff.length !== staffIds.size) {
      return NextResponse.json(
        {
          success: false,
          message: "One or more staff records could not be found.",
        },
        { status: 404 },
      );
    }

    const invalidStaff = existingStaff.find(
      (staff) =>
        staff.joiningDate > attendanceDate ||
        (staff.leavingDate !== null && staff.leavingDate < attendanceDate),
    );

    if (invalidStaff) {
      return NextResponse.json(
        {
          success: false,
          message: `${invalidStaff.name} is not active on the selected attendance date.`,
        },
        { status: 409 },
      );
    }

    const lockedAttendance = await prisma.staffAttendance.findMany({
      where: {
        attendanceDate,
        staffId: {
          in: Array.from(staffIds),
        },
        leaveRequest: {
          is: {
            status: "APPROVED",
          },
        },
      },
      select: {
        staffId: true,
        leaveRequest: {
          select: {
            leaveNumber: true,
          },
        },
      },
    });

    const lockedStaffIds = new Set(
      lockedAttendance.map((record) => record.staffId),
    );
    const entriesToSave = normalisedEntries.filter(
      (entry) => !lockedStaffIds.has(entry.staffId),
    );

    if (entriesToSave.length === 0) {
      return NextResponse.json({
        success: true,
        message:
          lockedAttendance.length === 1
            ? "This attendance record is protected by approved leave and was not changed."
            : `${lockedAttendance.length} attendance records are protected by approved leave and were not changed.`,
        date: formatDateKey(attendanceDate),
        records: [],
        lockedCount: lockedAttendance.length,
      });
    }

    const savedRecords = await prisma.$transaction(async (transaction) => {
      const saved = [];

      for (const entry of entriesToSave) {
        const record = await transaction.staffAttendance.upsert({
          where: {
            staffId_attendanceDate: {
              staffId: entry.staffId,
              attendanceDate,
            },
          },
          create: {
            staffId: entry.staffId,
            attendanceDate,
            status: entry.status,
            checkInAt: entry.checkInAt,
            checkOutAt: entry.checkOutAt,
            notes: entry.notes,
            leaveRequestId: null,
            isSandwichDay: false,
            markedById: authorisation.session.userId,
          },
          update: {
            status: entry.status,
            checkInAt: entry.checkInAt,
            checkOutAt: entry.checkOutAt,
            notes: entry.notes,
            leaveRequestId: null,
            isSandwichDay: false,
            markedById: authorisation.session.userId,
          },
          select: {
            id: true,
            staffId: true,
            attendanceDate: true,
            status: true,
            checkInAt: true,
            checkOutAt: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },
        });

        saved.push(record);
      }

      await transaction.activityLog.create({
        data: {
          adminUserId: authorisation.session.userId,
          action: "UPDATED",
          entityType: "StaffAttendance",
          entityId: formatDateKey(attendanceDate),
          description: `Staff attendance saved for ${saved.length} staff member${
            saved.length === 1 ? "" : "s"
          } on ${formatDateKey(attendanceDate)}.`,
          newData: {
            attendanceDate: formatDateKey(attendanceDate),
            entries: saved.map((record) => ({
              staffId: record.staffId,
              status: record.status,
              checkInTime: formatTime(record.checkInAt),
              checkOutTime: formatTime(record.checkOutAt),
            })),
          },
        },
      });

      return saved;
    });

    return NextResponse.json({
      success: true,
      message:
        lockedAttendance.length > 0
          ? `Staff attendance saved for ${savedRecords.length} staff member${
              savedRecords.length === 1 ? "" : "s"
            }. ${lockedAttendance.length} approved-leave record${
              lockedAttendance.length === 1 ? " was" : "s were"
            } protected and not changed.`
          : `Staff attendance saved for ${savedRecords.length} staff member${
              savedRecords.length === 1 ? "" : "s"
            }.`,
      date: formatDateKey(attendanceDate),
      lockedCount: lockedAttendance.length,
      records: savedRecords.map((record) => ({
        ...record,
        checkInTime: formatTime(record.checkInAt),
        checkOutTime: formatTime(record.checkOutAt),
      })),
      summary: calculateSummary(savedRecords, savedRecords.length),
    });
  } catch (error) {
    console.error("Unable to save staff attendance:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Staff attendance could not be saved. Please try again. If the problem continues, contact the Owner.",
      },
      { status: 500 },
    );
  }
}
