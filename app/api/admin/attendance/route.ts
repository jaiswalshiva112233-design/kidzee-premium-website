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

type AttendanceStatusValue =
  (typeof ATTENDANCE_STATUSES)[number];

type AttendanceEntryInput = {
  studentId?: unknown;
  status?: unknown;
  checkInTime?: unknown;
  checkOutTime?: unknown;
  notes?: unknown;
};

type SaveAttendanceBody = {
  date?: unknown;
  entries?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptionalText(value: unknown) {
  const cleaned = cleanText(value);

  return cleaned.length > 0 ? cleaned : null;
}

function isAttendanceStatus(
  value: string,
): value is AttendanceStatusValue {
  return ATTENDANCE_STATUSES.includes(
    value as AttendanceStatusValue,
  );
}

function parseDateOnly(value: unknown) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    cleaned,
  );

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0, 0),
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

function getTodayDateKey() {
  const now = new Date();

  const indiaDate = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    },
  ).format(now);

  return indiaDate;
}

function isFutureAttendanceDate(value: Date) {
  return formatDateKey(value) > getTodayDateKey();
}

function parseTimeForDate(
  attendanceDate: Date,
  value: unknown,
) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return null;
  }

  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(
    cleaned,
  );

  if (!match) {
    return null;
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  /*
   * Attendance dates are stored as UTC midnight.
   * Time values are converted from India time to UTC.
   */
  const indiaOffsetMinutes = 330;

  const utcTimestamp =
    Date.UTC(
      attendanceDate.getUTCFullYear(),
      attendanceDate.getUTCMonth(),
      attendanceDate.getUTCDate(),
      hours,
      minutes,
      0,
      0,
    ) -
    indiaOffsetMinutes * 60 * 1000;

  return new Date(utcTimestamp);
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

function getStudentName(student: {
  firstName: string;
  middleName: string | null;
  lastName: string | null;
}) {
  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function calculateSummary(
  records: Array<{
    status: $Enums.AttendanceStatus;
  }>,
  totalStudents: number,
) {
  const summary = {
    totalStudents,
    marked: records.length,
    unmarked: Math.max(
      totalStudents - records.length,
      0,
    ),
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    leave: 0,
    holiday: 0,
  };

  records.forEach((record) => {
    switch (record.status) {
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

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    const url = new URL(request.url);

    const requestedDate =
      url.searchParams.get("date") ??
      getTodayDateKey();

    const attendanceDate = parseDateOnly(
      requestedDate,
    );

    if (!attendanceDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid attendance date in YYYY-MM-DD format.",
        },
        {
          status: 400,
        },
      );
    }

    if (isFutureAttendanceDate(attendanceDate)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance cannot be opened for a future date.",
        },
        { status: 400 },
      );
    }

    const isHistoricalDate =
      formatDateKey(attendanceDate) < getTodayDateKey();

    const [students, attendanceRecords] =
      await Promise.all([
        prisma.student.findMany({
          where: {
            OR: [
              {
                joiningDate: { lte: attendanceDate },
                ...(isHistoricalDate
                  ? {}
                  : { status: "ACTIVE" as const }),
                OR: [
                  { leavingDate: null },
                  { leavingDate: { gte: attendanceDate } },
                ],
                enrollmentContract: {
                  is: {
                    preschoolEnabled: true,
                    startDate: { lte: attendanceDate },
                    OR: [
                      { endDate: null },
                      { endDate: { gte: attendanceDate } },
                    ],
                    ...(isHistoricalDate
                      ? { status: { in: ["ACTIVE", "ENDED"] as const } }
                      : { status: "ACTIVE" as const }),
                  },
                },
              },
              {
                attendanceRecords: {
                  some: { attendanceDate },
                },
              },
            ],
          },

          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            preferredName: true,
            programme: true,
            profilePhotoUrl: true,

            guardians: {
              where: {
                isPrimary: true,
              },

              select: {
                id: true,
                name: true,
                phone: true,
                relationship: true,
              },

              take: 1,
            },
          },

          orderBy: [
            {
              programme: "asc",
            },
            {
              firstName: "asc",
            },
            {
              createdAt: "asc",
            },
          ],
        }),

        prisma.studentAttendance.findMany({
          where: {
            attendanceDate,
          },

          select: {
            id: true,
            studentId: true,
            status: true,
            checkInAt: true,
            checkOutAt: true,
            notes: true,
            markedById: true,
            createdAt: true,
            updatedAt: true,

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
      attendanceRecords.map((record) => [
        record.studentId,
        record,
      ]),
    );

    const register = students.map((student) => {
      const attendance =
        attendanceMap.get(student.id) ?? null;

      return {
        student: {
          id: student.id,
          studentNumber:
            student.studentNumber,
          name: getStudentName(student),
          preferredName:
            student.preferredName,
          programme: student.programme,
          profilePhotoUrl:
            student.profilePhotoUrl,
          primaryGuardian:
            student.guardians[0] ?? null,
        },

        attendance: attendance
          ? {
              id: attendance.id,
              status: attendance.status,
              checkInTime: formatTime(
                attendance.checkInAt,
              ),
              checkOutTime: formatTime(
                attendance.checkOutAt,
              ),
              notes: attendance.notes ?? "",
              markedBy: attendance.markedBy,
              createdAt:
                attendance.createdAt,
              updatedAt:
                attendance.updatedAt,
            }
          : {
              id: null,
              status: null,
              checkInTime: "",
              checkOutTime: "",
              notes: "",
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
      summary: calculateSummary(
        attendanceRecords,
        students.length,
      ),
    });
  } catch (error) {
    console.error(
      "Unable to load attendance register:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the attendance register. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
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
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    let body: SaveAttendanceBody;

    try {
      body =
        (await request.json()) as SaveAttendanceBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid attendance request.",
        },
        {
          status: 400,
        },
      );
    }

    const attendanceDate = parseDateOnly(
      body.date,
    );

    if (!attendanceDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please provide a valid attendance date.",
        },
        {
          status: 400,
        },
      );
    }

    if (isFutureAttendanceDate(attendanceDate)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance cannot be marked for a future date.",
        },
        { status: 400 },
      );
    }

    const isHistoricalDate =
      formatDateKey(attendanceDate) < getTodayDateKey();

    if (!Array.isArray(body.entries)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance entries are required.",
        },
        {
          status: 400,
        },
      );
    }

    const rawEntries =
      body.entries as AttendanceEntryInput[];

    if (rawEntries.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please include at least one attendance entry.",
        },
        {
          status: 400,
        },
      );
    }

    const normalisedEntries: Array<{
      studentId: string;
      status: $Enums.AttendanceStatus;
      checkInAt: Date | null;
      checkOutAt: Date | null;
      notes: string | null;
    }> = [];

    const studentIds = new Set<string>();

    for (
      let index = 0;
      index < rawEntries.length;
      index += 1
    ) {
      const entry = rawEntries[index];

      if (
        typeof entry !== "object" ||
        entry === null ||
        Array.isArray(entry)
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Attendance entry ${
              index + 1
            } is invalid.`,
          },
          {
            status: 400,
          },
        );
      }

      const studentId = cleanText(
        entry.studentId,
      );

      const statusValue = cleanText(
        entry.status,
      );

      if (!studentId) {
        return NextResponse.json(
          {
            success: false,
            message: `Student is missing from attendance entry ${
              index + 1
            }.`,
          },
          {
            status: 400,
          },
        );
      }

      if (studentIds.has(studentId)) {
        return NextResponse.json(
          {
            success: false,
            message:
              "The same student cannot appear more than once in the attendance register.",
          },
          {
            status: 400,
          },
        );
      }

      studentIds.add(studentId);

      if (!isAttendanceStatus(statusValue)) {
        return NextResponse.json(
          {
            success: false,
            message: `Please select a valid attendance status for entry ${
              index + 1
            }.`,
          },
          {
            status: 400,
          },
        );
      }

      const checkInText = cleanText(
        entry.checkInTime,
      );

      const checkOutText = cleanText(
        entry.checkOutTime,
      );

      const checkInAt = checkInText
        ? parseTimeForDate(
            attendanceDate,
            checkInText,
          )
        : null;

      const checkOutAt = checkOutText
        ? parseTimeForDate(
            attendanceDate,
            checkOutText,
          )
        : null;

      if (checkInText && !checkInAt) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid check-in time for attendance entry ${
              index + 1
            }.`,
          },
          {
            status: 400,
          },
        );
      }

      if (checkOutText && !checkOutAt) {
        return NextResponse.json(
          {
            success: false,
            message: `Invalid check-out time for attendance entry ${
              index + 1
            }.`,
          },
          {
            status: 400,
          },
        );
      }

      if (
        checkInAt &&
        checkOutAt &&
        checkOutAt <= checkInAt
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `Check-out time must be later than check-in time for attendance entry ${
              index + 1
            }.`,
          },
          {
            status: 400,
          },
        );
      }

      const status =
        statusValue as $Enums.AttendanceStatus;

      const shouldStoreTimes =
        status === "PRESENT" ||
        status === "LATE" ||
        status === "HALF_DAY";

      normalisedEntries.push({
        studentId,
        status,
        checkInAt: shouldStoreTimes
          ? checkInAt
          : null,
        checkOutAt: shouldStoreTimes
          ? checkOutAt
          : null,
        notes: cleanOptionalText(entry.notes),
      });
    }

    const existingStudents =
      await prisma.student.findMany({
        where: {
          id: {
            in: Array.from(studentIds),
          },
        },

        select: {
          id: true,
          status: true,
          joiningDate: true,
          leavingDate: true,
          enrollmentContract: {
            select: {
              preschoolEnabled: true,
              status: true,
              startDate: true,
              endDate: true,
            },
          },
          attendanceRecords: {
            where: { attendanceDate },
            select: { id: true },
            take: 1,
          },
        },
      });

    if (
      existingStudents.length !==
      studentIds.size
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "One or more student records could not be found.",
        },
        {
          status: 404,
        },
      );
    }

    const inactiveStudent =
      existingStudents.find(
        (student) =>
          student.joiningDate > attendanceDate ||
          !student.enrollmentContract?.preschoolEnabled ||
          student.enrollmentContract.startDate > attendanceDate ||
          (student.enrollmentContract.endDate != null &&
            student.enrollmentContract.endDate < attendanceDate) ||
          (!isHistoricalDate && student.enrollmentContract.status !== "ACTIVE") ||
          ((student.leavingDate != null &&
            student.leavingDate < attendanceDate) ||
            (!isHistoricalDate && student.status !== "ACTIVE")) &&
            student.attendanceRecords.length === 0,
      );

    if (inactiveStudent) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Attendance can only be marked for active students.",
        },
        {
          status: 409,
        },
      );
    }

    const savedRecords = await prisma.$transaction(
      async (transaction) => {
        const saved = [];

        for (const entry of normalisedEntries) {
          const record =
            await transaction.studentAttendance.upsert({
            where: {
              studentId_attendanceDate: {
                studentId: entry.studentId,
                attendanceDate,
              },
            },

            create: {
              studentId: entry.studentId,
              attendanceDate,
              status: entry.status,
              checkInAt: entry.checkInAt,
              checkOutAt: entry.checkOutAt,
              notes: entry.notes,
              markedById: session.userId,
            },

            update: {
              status: entry.status,
              checkInAt: entry.checkInAt,
              checkOutAt: entry.checkOutAt,
              notes: entry.notes,
              markedById: session.userId,
            },

            select: {
              id: true,
              studentId: true,
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
            adminUserId: session.userId,
            action: "UPDATED",
            entityType: "StudentAttendance",
            entityId: formatDateKey(attendanceDate),
            description: `Student attendance saved for ${saved.length} student${
              saved.length === 1 ? "" : "s"
            } on ${formatDateKey(attendanceDate)}.`,
            newData: {
              attendanceDate: formatDateKey(attendanceDate),
              entries: saved.map((record) => ({
                studentId: record.studentId,
                status: record.status,
                checkInTime: formatTime(record.checkInAt),
                checkOutTime: formatTime(record.checkOutAt),
              })),
            },
          },
        });

        return saved;
      },
    );

    return NextResponse.json({
      success: true,
      message: `Attendance saved successfully for ${savedRecords.length} student${
        savedRecords.length === 1 ? "" : "s"
      }.`,
      date: formatDateKey(attendanceDate),
      records: savedRecords.map((record) => ({
        ...record,
        checkInTime: formatTime(
          record.checkInAt,
        ),
        checkOutTime: formatTime(
          record.checkOutAt,
        ),
      })),
      summary: calculateSummary(
        savedRecords,
        savedRecords.length,
      ),
    });
  } catch (error) {
    console.error(
      "Unable to save attendance:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Attendance could not be saved. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}
