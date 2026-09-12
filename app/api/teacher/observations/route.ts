import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { canTeacherAccessStudent } from "@/lib/admin/teacherService";

function generateReportNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `OBS-${year}-${rand}`;
}

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const isTeacher = session.role === "TEACHER";
    const whereClause: Record<string, unknown> = {};

    if (isTeacher) {
      if (!session.staffId) {
        return NextResponse.json({ success: false, message: "Teacher account has no linked staff record." }, { status: 403 });
      }
      whereClause.teacherId = session.staffId;
    }

    const url = new URL(request.url);
    const studentId = url.searchParams.get("studentId")?.trim();
    if (studentId) whereClause.studentId = studentId;

    const reports = await prisma.studentObservationReport.findMany({
      where: whereClause,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
        batch: { select: { id: true, name: true, programme: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: { reportDate: "desc" },
    });

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    console.error("Observation reports load error:", error);
    return NextResponse.json({ success: false, message: "Unable to load observation reports." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const body = await request.json();
    const studentId = typeof body.studentId === "string" ? body.studentId.trim() : "";
    const batchId = typeof body.batchId === "string" ? body.batchId.trim() : "";
    const term = typeof body.term === "string" ? body.term.trim() : "Term 1";
    const strengths = typeof body.strengths === "string" ? body.strengths.trim() : "";
    const areasOfGrowth = typeof body.areasOfGrowth === "string" ? body.areasOfGrowth.trim() : "";
    const socialEmotionalDevelopment = typeof body.socialEmotionalDevelopment === "string" ? body.socialEmotionalDevelopment.trim() || null : null;
    const motorSkillsDevelopment = typeof body.motorSkillsDevelopment === "string" ? body.motorSkillsDevelopment.trim() || null : null;
    const languageCommunication = typeof body.languageCommunication === "string" ? body.languageCommunication.trim() || null : null;
    const cognitiveCuriosity = typeof body.cognitiveCuriosity === "string" ? body.cognitiveCuriosity.trim() || null : null;
    const generalObservations = typeof body.generalObservations === "string" ? body.generalObservations.trim() || null : null;
    const status = (body.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT") as $Enums.ObservationReportStatus;

    if (!studentId || !batchId || !strengths || !areasOfGrowth) {
      return NextResponse.json(
        { success: false, message: "Student, Batch, Strengths, and Areas of Growth are required." },
        { status: 400 }
      );
    }

    const isTeacher = session.role === "TEACHER";
    let teacherStaffId = session.staffId;

    if (isTeacher) {
      if (!teacherStaffId) {
        return NextResponse.json({ success: false, message: "Teacher account has no linked staff record." }, { status: 403 });
      }
      const hasAccess = await canTeacherAccessStudent(teacherStaffId, studentId);
      if (!hasAccess) {
        return NextResponse.json({ success: false, message: "Access denied: student not in your assigned sections." }, { status: 403 });
      }
    } else if (!teacherStaffId) {
      const b = await prisma.batch.findUnique({ where: { id: batchId }, select: { primaryTeacherId: true } });
      teacherStaffId = b?.primaryTeacherId ?? null;
      if (!teacherStaffId) {
        return NextResponse.json({ success: false, message: "Please assign a teacher to this section first." }, { status: 400 });
      }
    }

    let reportNumber = generateReportNumber();
    // Ensure uniqueness
    let exists = await prisma.studentObservationReport.findUnique({ where: { reportNumber } });
    while (exists) {
      reportNumber = generateReportNumber();
      exists = await prisma.studentObservationReport.findUnique({ where: { reportNumber } });
    }

    const report = await prisma.studentObservationReport.create({
      data: {
        reportNumber,
        studentId,
        batchId,
        teacherId: teacherStaffId,
        term,
        reportDate: new Date(),
        strengths,
        areasOfGrowth,
        socialEmotionalDevelopment,
        motorSkillsDevelopment,
        languageCommunication,
        cognitiveCuriosity,
        generalObservations,
        status,
      },
      include: {
        student: { select: { firstName: true, lastName: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: status === "SUBMITTED" ? "Observation report submitted for review." : "Observation report saved as draft.",
      report,
    });
  } catch (error) {
    console.error("Observation report create error:", error);
    return NextResponse.json({ success: false, message: "Unable to create observation report." }, { status: 500 });
  }
}
