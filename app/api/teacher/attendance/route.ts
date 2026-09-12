import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { canTeacherAccessBatch, getTeacherAssignedBatchIds } from "@/lib/admin/teacherService";

function getIndiaDateKey() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function parseDateOnly(val: unknown) {
  if (typeof val !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val.trim());
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0));
}

function parseTimeForDate(attendanceDate: Date, value: unknown) {
  if (typeof value !== "string" || !value.trim()) return null;
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const indiaOffsetMinutes = 330;
  return new Date(
    Date.UTC(
      attendanceDate.getUTCFullYear(),
      attendanceDate.getUTCMonth(),
      attendanceDate.getUTCDate(),
      Number(match[1]),
      Number(match[2])
    ) - indiaOffsetMinutes * 60 * 1000
  );
}

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const url = new URL(request.url);
    const dateStr = url.searchParams.get("date") ?? getIndiaDateKey();
    const attendanceDate = parseDateOnly(dateStr) ?? parseDateOnly(getIndiaDateKey())!;
    let batchId = url.searchParams.get("batchId")?.trim();

    // If teacher, resolve their staffId and verify batch access
    const isTeacher = session.role === "TEACHER";
    if (isTeacher) {
      if (!session.staffId) {
        return NextResponse.json({ success: false, message: "Teacher account is not linked to a staff record." }, { status: 403 });
      }

      if (!batchId) {
        const assigned = await getTeacherAssignedBatchIds(session.staffId);
        if (assigned.length === 0) {
          return NextResponse.json({ success: true, batches: [], register: [], message: "No batches currently assigned to you." });
        }
        batchId = assigned[0];
      } else {
        const hasAccess = await canTeacherAccessBatch(session.staffId, batchId);
        if (!hasAccess) {
          return NextResponse.json({ success: false, message: "Access denied to this batch." }, { status: 403 });
        }
      }
    }

    // Get list of teacher's batches for the batch selector dropdown
    const availableBatches = await prisma.batch.findMany({
      where: isTeacher
        ? {
            status: "ACTIVE",
            OR: [
              { primaryTeacherId: session.staffId! },
              { assistantTeacherId: session.staffId! },
            ],
          }
        : { status: "ACTIVE" },
      select: { id: true, name: true, programme: true, room: true },
      orderBy: { name: "asc" },
    });

    if (!batchId) {
      batchId = availableBatches[0]?.id;
    }

    if (!batchId) {
      return NextResponse.json({ success: true, batches: [], register: [], message: "No active batches available." });
    }

    // Get active students assigned to this batch
    const assignments = await prisma.studentBatchAssignment.findMany({
      where: { batchId, status: "ACTIVE" },
      include: {
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            preferredName: true,
            profilePhotoUrl: true,
            allergies: true,
            medicalNotes: true,
          },
        },
      },
      orderBy: [{ rollNumber: "asc" }, { assignedAt: "asc" }],
    });

    const studentIds = assignments.map((a) => a.studentId);

    // Get existing attendance records for these students on this date
    const attendanceRecords = await prisma.studentAttendance.findMany({
      where: {
        studentId: { in: studentIds },
        attendanceDate,
      },
      select: {
        id: true,
        studentId: true,
        status: true,
        checkInAt: true,
        checkOutAt: true,
        notes: true,
      },
    });

    const attendanceMap = new Map(attendanceRecords.map((r) => [r.studentId, r]));

    const register = assignments.map((a) => {
      const s = a.student;
      const fullName = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
      const att = attendanceMap.get(s.id);
      return {
        studentId: s.id,
        rollNumber: a.rollNumber,
        studentNumber: s.studentNumber,
        name: s.preferredName ? `${s.preferredName} (${fullName})` : fullName,
        profilePhotoUrl: s.profilePhotoUrl,
        allergies: s.allergies,
        medicalNotes: s.medicalNotes,
        attendance: att
          ? {
              id: att.id,
              status: att.status,
              checkInTime: att.checkInAt ? att.checkInAt.toISOString() : "",
              checkOutTime: att.checkOutAt ? att.checkOutAt.toISOString() : "",
              notes: att.notes ?? "",
            }
          : {
              id: null,
              status: null,
              checkInTime: "",
              checkOutTime: "",
              notes: "",
            },
      };
    });

    const summary = {
      total: register.length,
      marked: attendanceRecords.length,
      unmarked: register.length - attendanceRecords.length,
      present: attendanceRecords.filter((r) => r.status === "PRESENT").length,
      absent: attendanceRecords.filter((r) => r.status === "ABSENT").length,
      late: attendanceRecords.filter((r) => r.status === "LATE").length,
      halfDay: attendanceRecords.filter((r) => r.status === "HALF_DAY").length,
      leave: attendanceRecords.filter((r) => r.status === "LEAVE").length,
    };

    return NextResponse.json({
      success: true,
      selectedBatchId: batchId,
      date: dateStr,
      batches: availableBatches,
      register,
      summary,
    });
  } catch (error) {
    console.error("Teacher attendance load error:", error);
    return NextResponse.json({ success: false, message: "Unable to load attendance register." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const body = await request.json();
    const batchId = typeof body.batchId === "string" ? body.batchId.trim() : "";
    const dateStr = typeof body.date === "string" ? body.date.trim() : getIndiaDateKey();
    const entries = Array.isArray(body.entries) ? body.entries : [];

    if (!batchId) {
      return NextResponse.json({ success: false, message: "Batch ID is required." }, { status: 400 });
    }

    const attendanceDate = parseDateOnly(dateStr);
    if (!attendanceDate) {
      return NextResponse.json({ success: false, message: "Invalid date format." }, { status: 400 });
    }

    // IDOR Security check: verify teacher has access to this batch
    const isTeacher = session.role === "TEACHER";
    if (isTeacher) {
      if (!session.staffId) {
        return NextResponse.json({ success: false, message: "Teacher account has no linked staff record." }, { status: 403 });
      }
      const hasAccess = await canTeacherAccessBatch(session.staffId, batchId);
      if (!hasAccess) {
        return NextResponse.json({ success: false, message: "Access denied to mark attendance for this batch." }, { status: 403 });
      }
    }

    // Load active students in this batch to verify student ownership
    const validStudents = await prisma.studentBatchAssignment.findMany({
      where: { batchId, status: "ACTIVE" },
      select: { studentId: true },
    });
    const validStudentSet = new Set(validStudents.map((s) => s.studentId));

    const upsertPromises = entries
      .filter((e: any) => e && typeof e.studentId === "string" && validStudentSet.has(e.studentId))
      .map((entry: any) => {
        const studentId = String(entry.studentId).trim();
        const status = (entry.status as $Enums.AttendanceStatus) || "PRESENT";
        const notes = typeof entry.notes === "string" ? entry.notes.trim() || null : null;
        const checkInAt = parseTimeForDate(attendanceDate, entry.checkInTime);
        const checkOutAt = parseTimeForDate(attendanceDate, entry.checkOutTime);

        return prisma.studentAttendance.upsert({
          where: {
            studentId_attendanceDate: {
              studentId,
              attendanceDate,
            },
          },
          create: {
            studentId,
            attendanceDate,
            status,
            checkInAt,
            checkOutAt,
            notes,
            markedById: session.userId,
          },
          update: {
            status,
            checkInAt,
            checkOutAt,
            notes,
            markedById: session.userId,
          },
        });
      });

    await prisma.$transaction(upsertPromises);

    return NextResponse.json({
      success: true,
      message: `Attendance marked for ${upsertPromises.length} students.`,
      markedCount: upsertPromises.length,
    });
  } catch (error) {
    console.error("Teacher attendance save error:", error);
    return NextResponse.json({ success: false, message: "Unable to save attendance register." }, { status: 500 });
  }
}
