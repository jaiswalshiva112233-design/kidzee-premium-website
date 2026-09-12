import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    const [pendingObservations, pendingActivities, pendingLeaves] = await Promise.all([
      prisma.studentObservationReport.findMany({
        where: { status: "SUBMITTED" },
        include: {
          student: { select: { id: true, firstName: true, lastName: true, preferredName: true } },
          batch: { select: { id: true, name: true, programme: true } },
          teacher: { select: { id: true, name: true, designation: true } },
        },
        orderBy: { reportDate: "desc" },
      }),
      prisma.teacherActivity.findMany({
        where: { status: "SUBMITTED" },
        include: {
          batch: { select: { id: true, name: true, programme: true } },
          teacher: { select: { id: true, name: true, designation: true } },
        },
        orderBy: { activityDate: "desc" },
      }),
      prisma.staffLeaveRequest.findMany({
        where: { status: "PENDING" },
        include: {
          staff: { select: { id: true, staffNumber: true, name: true, designation: true } },
        },
        orderBy: { startDate: "asc" },
      }),
    ]);

    return NextResponse.json({
      success: true,
      pendingObservations,
      pendingActivities,
      pendingLeaves,
      summary: {
        observationsCount: pendingObservations.length,
        activitiesCount: pendingActivities.length,
        leavesCount: pendingLeaves.length,
        totalPending: pendingObservations.length + pendingActivities.length + pendingLeaves.length,
      },
    });
  } catch (error) {
    console.error("Teacher reviews load error:", error);
    return NextResponse.json({ success: false, message: "Unable to load review queue." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    // Only Owner and Centre Head can approve / review
    if (session.role === "TEACHER") {
      return NextResponse.json({ success: false, message: "Only Centre Head or Owner can approve records." }, { status: 403 });
    }

    const body = await request.json();
    const action = typeof body.action === "string" ? body.action.trim() : "";

    if (action === "APPROVE_OBSERVATION") {
      const id = String(body.id || "");
      const feedback = typeof body.feedback === "string" ? body.feedback.trim() || null : null;
      const updated = await prisma.studentObservationReport.update({
        where: { id },
        data: {
          status: "APPROVED",
          centreHeadFeedback: feedback,
          reviewedById: session.userId,
          reviewedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: "Observation report approved.", report: updated });
    }

    if (action === "REQUEST_OBSERVATION_CHANGES") {
      const id = String(body.id || "");
      const feedback = typeof body.feedback === "string" ? body.feedback.trim() : "";
      if (!feedback) {
        return NextResponse.json({ success: false, message: "Please provide feedback on changes needed." }, { status: 400 });
      }
      const updated = await prisma.studentObservationReport.update({
        where: { id },
        data: {
          status: "CHANGES_REQUESTED",
          centreHeadFeedback: feedback,
          reviewedById: session.userId,
          reviewedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: "Sent back to teacher for revisions.", report: updated });
    }

    if (action === "REVIEW_ACTIVITY") {
      const id = String(body.id || "");
      const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
      const updated = await prisma.teacherActivity.update({
        where: { id },
        data: {
          status: "REVIEWED",
          reviewNotes: notes,
          reviewedById: session.userId,
          reviewedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, message: "Activity plan reviewed.", activity: updated });
    }

    if (action === "APPROVE_LEAVE") {
      const id = String(body.id || "");
      const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;

      const leave = await prisma.staffLeaveRequest.findUnique({
        where: { id },
      });
      if (!leave) {
        return NextResponse.json({ success: false, message: "Leave request not found." }, { status: 404 });
      }

      const updated = await prisma.staffLeaveRequest.update({
        where: { id },
        data: {
          status: "APPROVED",
          approvedById: session.userId,
          approvedAt: new Date(),
          notes: notes ?? leave.notes,
        },
      });

      // Synchronize attendance records for approved leave days
      const current = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const attendanceUpserts = [];

      while (current <= end) {
        const attDate = new Date(current);
        attendanceUpserts.push(
          prisma.staffAttendance.upsert({
            where: {
              staffId_attendanceDate: {
                staffId: leave.staffId,
                attendanceDate: attDate,
              },
            },
            create: {
              staffId: leave.staffId,
              attendanceDate: attDate,
              status: "LEAVE",
              leaveRequestId: leave.id,
              markedById: session.userId,
              notes: `Approved leave: ${leave.reason ?? ""}`,
            },
            update: {
              status: "LEAVE",
              leaveRequestId: leave.id,
              markedById: session.userId,
              notes: `Approved leave: ${leave.reason ?? ""}`,
            },
          })
        );
        current.setUTCDate(current.getUTCDate() + 1);
      }

      await prisma.$transaction(attendanceUpserts);

      return NextResponse.json({ success: true, message: "Teacher leave approved.", leave: updated });
    }

    if (action === "REJECT_LEAVE") {
      const id = String(body.id || "");
      const notes = typeof body.notes === "string" ? body.notes.trim() || null : null;
      const updated = await prisma.staffLeaveRequest.update({
        where: { id },
        data: {
          status: "REJECTED",
          approvedById: session.userId,
          rejectedAt: new Date(),
          notes,
        },
      });
      return NextResponse.json({ success: true, message: "Leave request rejected.", leave: updated });
    }

    return NextResponse.json({ success: false, message: "Unknown review action." }, { status: 400 });
  } catch (error) {
    console.error("Teacher review action error:", error);
    return NextResponse.json({ success: false, message: "Unable to process review action." }, { status: 500 });
  }
}
