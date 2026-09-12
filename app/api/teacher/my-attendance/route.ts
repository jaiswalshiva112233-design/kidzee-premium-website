import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ success: false, message: "Unauthorised." }, { status: 401 });
    }

    if (!session.staffId) {
      return NextResponse.json({ success: false, message: "No linked staff record." }, { status: 403 });
    }

    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year")) || new Date().getFullYear();
    const month = Number(url.searchParams.get("month")) || new Date().getMonth() + 1;

    const startOfMonth = new Date(Date.UTC(year, month - 1, 1));
    const endOfMonth = new Date(Date.UTC(year, month, 0));

    const records = await prisma.staffAttendance.findMany({
      where: {
        staffId: session.staffId,
        attendanceDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: { attendanceDate: "asc" },
      include: {
        leaveRequest: {
          select: { id: true, leaveNumber: true, leaveType: true, reason: true },
        },
      },
    });

    const summary = {
      present: records.filter((r) => r.status === "PRESENT").length,
      absent: records.filter((r) => r.status === "ABSENT").length,
      late: records.filter((r) => r.status === "LATE").length,
      halfDay: records.filter((r) => r.status === "HALF_DAY").length,
      leave: records.filter((r) => r.status === "LEAVE").length,
      sandwichDays: records.filter((r) => r.isSandwichDay).length,
    };

    return NextResponse.json({
      success: true,
      year,
      month,
      records,
      summary,
    });
  } catch (error) {
    console.error("My attendance load error:", error);
    return NextResponse.json({ success: false, message: "Unable to load attendance history." }, { status: 500 });
  }
}
