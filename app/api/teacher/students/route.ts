import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { getTeacherAssignedBatchIds } from "@/lib/admin/teacherService";

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const isTeacher = session.role === "TEACHER";
    let allowedBatchIds: string[] = [];

    if (isTeacher) {
      if (!session.staffId) {
        return NextResponse.json({ success: false, message: "Teacher profile not linked." }, { status: 403 });
      }
      allowedBatchIds = await getTeacherAssignedBatchIds(session.staffId);
      if (allowedBatchIds.length === 0) {
        return NextResponse.json({ success: true, students: [] });
      }
    }

    const url = new URL(request.url);
    const batchFilter = url.searchParams.get("batchId")?.trim();

    const whereClause: Record<string, unknown> = {
      status: "ACTIVE",
      student: { status: "ACTIVE" },
    };

    if (batchFilter) {
      if (isTeacher && !allowedBatchIds.includes(batchFilter)) {
        return NextResponse.json({ success: false, message: "Access denied." }, { status: 403 });
      }
      whereClause.batchId = batchFilter;
    } else if (isTeacher) {
      whereClause.batchId = { in: allowedBatchIds };
    }

    const assignments = await prisma.studentBatchAssignment.findMany({
      where: whereClause,
      include: {
        batch: {
          select: { id: true, name: true, programme: true, room: true },
        },
        student: {
          select: {
            id: true,
            studentNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
            preferredName: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            medicalNotes: true,
            allergies: true,
            profilePhotoUrl: true,
            guardians: {
              where: { isPrimary: true },
              select: { name: true, phone: true, relationship: true },
              take: 1,
            },
          },
        },
      },
      orderBy: [{ batch: { name: "asc" } }, { rollNumber: "asc" }, { student: { firstName: "asc" } }],
    });

    const students = assignments.map((a) => {
      const s = a.student;
      const fullName = [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ");
      return {
        assignmentId: a.id,
        rollNumber: a.rollNumber,
        batch: a.batch,
        studentId: s.id,
        studentNumber: s.studentNumber,
        name: s.preferredName ? `${s.preferredName} (${fullName})` : fullName,
        dateOfBirth: s.dateOfBirth,
        gender: s.gender,
        bloodGroup: s.bloodGroup,
        medicalNotes: s.medicalNotes,
        allergies: s.allergies,
        profilePhotoUrl: s.profilePhotoUrl,
        emergencyContact: s.guardians[0] ?? null,
      };
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error("Teacher students load error:", error);
    return NextResponse.json({ success: false, message: "Unable to load student roster." }, { status: 500 });
  }
}
