import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

function parseDateOnly(val: unknown) {
  if (typeof val !== "string") return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(val.trim());
  if (!match) return null;
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0));
}

function generateLeaveNumber() {
  const year = new Date().getFullYear();
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `LVE-${year}-${rand}`;
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    if (!session.staffId) {
      return NextResponse.json({ success: false, message: "No linked staff record." }, { status: 403 });
    }

    const [staff, requests] = await Promise.all([
      prisma.staff.findUnique({
        where: { id: session.staffId },
        select: {
          id: true,
          name: true,
          staffNumber: true,
          paidLeaveAllowance: true,
          paidLeaveCycle: true,
        },
      }),
      prisma.staffLeaveRequest.findMany({
        where: { staffId: session.staffId },
        orderBy: { startDate: "desc" },
        include: {
          approvedBy: { select: { id: true, name: true } },
        },
      }),
    ]);

    if (!staff) {
      return NextResponse.json({ success: false, message: "Staff record not found." }, { status: 404 });
    }

    const totalPaidDaysUsed = requests
      .filter((r) => r.status === "APPROVED")
      .reduce((sum, r) => sum + Number(r.paidDays), 0);

    const pendingRequestsCount = requests.filter((r) => r.status === "PENDING").length;
    const allowance = Number(staff.paidLeaveAllowance);
    const remainingPaid = Math.max(0, allowance - totalPaidDaysUsed);

    return NextResponse.json({
      success: true,
      staff: {
        id: staff.id,
        name: staff.name,
        staffNumber: staff.staffNumber,
        paidLeaveAllowance: allowance,
        paidLeaveCycle: staff.paidLeaveCycle,
        totalPaidDaysUsed,
        remainingPaidDays: remainingPaid,
        pendingRequestsCount,
      },
      requests,
    });
  } catch (error) {
    console.error("Teacher leave load error:", error);
    return NextResponse.json({ success: false, message: "Unable to load leave details." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    if (!session.staffId) {
      return NextResponse.json({ success: false, message: "No linked staff record." }, { status: 403 });
    }

    const body = await request.json();
    const startDate = parseDateOnly(body.startDate);
    const endDate = parseDateOnly(body.endDate);
    const leaveType = (body.leaveType === "UNPAID_LEAVE" ? "UNPAID_LEAVE" : "PAID_LEAVE") as $Enums.StaffLeaveType;
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!startDate || !endDate) {
      return NextResponse.json({ success: false, message: "Start date and end date are required." }, { status: 400 });
    }

    if (endDate < startDate) {
      return NextResponse.json({ success: false, message: "End date cannot be before start date." }, { status: 400 });
    }

    if (!reason) {
      return NextResponse.json({ success: false, message: "Please provide a reason for leave." }, { status: 400 });
    }

    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    let leaveNumber = generateLeaveNumber();
    let exists = await prisma.staffLeaveRequest.findUnique({ where: { leaveNumber } });
    while (exists) {
      leaveNumber = generateLeaveNumber();
      exists = await prisma.staffLeaveRequest.findUnique({ where: { leaveNumber } });
    }

    const leaveRequest = await prisma.staffLeaveRequest.create({
      data: {
        leaveNumber,
        staffId: session.staffId,
        startDate,
        endDate,
        leaveType,
        status: "PENDING",
        requestedDays: diffDays,
        sandwichDays: 0,
        chargedDays: diffDays,
        paidDays: leaveType === "PAID_LEAVE" ? diffDays : 0,
        unpaidDays: leaveType === "UNPAID_LEAVE" ? diffDays : 0,
        reason,
        createdById: session.userId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Leave application submitted. Centre Head will review shortly.",
      leaveRequest,
    });
  } catch (error) {
    console.error("Teacher leave application error:", error);
    return NextResponse.json({ success: false, message: "Unable to submit leave application." }, { status: 500 });
  }
}
