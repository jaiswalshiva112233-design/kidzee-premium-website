import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { canTeacherAccessBatch, getTeacherAssignedBatchIds } from "@/lib/admin/teacherService";

function parseDateOnly(val: unknown) {
  if (typeof val !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val.trim());
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0));
}

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
    }

    const url = new URL(request.url);
    const batchId = url.searchParams.get("batchId")?.trim();

    const whereClause: Record<string, unknown> = {};
    if (batchId) {
      if (isTeacher && !allowedBatchIds.includes(batchId)) {
        return NextResponse.json({ success: false, message: "Access denied." }, { status: 403 });
      }
      whereClause.batchId = batchId;
    } else if (isTeacher) {
      whereClause.batchId = { in: allowedBatchIds };
    }

    const activities = await prisma.teacherActivity.findMany({
      where: whereClause,
      include: {
        batch: { select: { id: true, name: true, programme: true } },
        teacher: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
      orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ success: true, activities });
  } catch (error) {
    console.error("Teacher activities load error:", error);
    return NextResponse.json({ success: false, message: "Unable to load activities." }, { status: 500 });
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
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const domain = typeof body.domain === "string" ? body.domain.trim() : "GENERAL_THEME";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const learningOutcome = typeof body.learningOutcome === "string" ? body.learningOutcome.trim() || null : null;
    const materialsNeeded = typeof body.materialsNeeded === "string" ? body.materialsNeeded.trim() || null : null;
    const status = (body.status === "DRAFT" ? "DRAFT" : "SUBMITTED") as $Enums.ActivityPlanStatus;

    if (!batchId || !title || !description) {
      return NextResponse.json({ success: false, message: "Batch, Title, and Description are required." }, { status: 400 });
    }

    const isTeacher = session.role === "TEACHER";
    let teacherStaffId = session.staffId;

    if (isTeacher) {
      if (!teacherStaffId) {
        return NextResponse.json({ success: false, message: "Teacher account has no linked staff record." }, { status: 403 });
      }
      const hasAccess = await canTeacherAccessBatch(teacherStaffId, batchId);
      if (!hasAccess) {
        return NextResponse.json({ success: false, message: "Access denied to this batch." }, { status: 403 });
      }
    } else {
      // Centre Head / Owner can specify teacher or default to batch primary teacher
      if (!teacherStaffId) {
        const b = await prisma.batch.findUnique({ where: { id: batchId }, select: { primaryTeacherId: true } });
        teacherStaffId = b?.primaryTeacherId ?? null;
      }
      if (!teacherStaffId) {
        return NextResponse.json({ success: false, message: "Please assign a teacher to this section first." }, { status: 400 });
      }
    }

    const activityDate = parseDateOnly(body.activityDate) ?? new Date();
    const weekStartDate = parseDateOnly(body.weekStartDate) ?? activityDate;

    const activity = await prisma.teacherActivity.create({
      data: {
        batchId,
        teacherId: teacherStaffId,
        activityDate,
        weekStartDate,
        title,
        domain: domain as $Enums.LearningDomain,
        description,
        learningOutcome,
        materialsNeeded,
        status,
      },
      include: {
        batch: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: status === "SUBMITTED" ? "Activity submitted for review." : "Activity saved as draft.",
      activity,
    });
  } catch (error) {
    console.error("Teacher activity create error:", error);
    return NextResponse.json({ success: false, message: "Unable to create activity." }, { status: 500 });
  }
}
