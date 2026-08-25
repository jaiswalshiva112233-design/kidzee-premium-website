import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { safeFirestoreMirror } from "@/lib/firebase/firestoreRest";
import { prisma } from "@/lib/prisma";

const statuses = new Set(["NEW", "REVIEWED", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED", "JOINED"]);

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const body = (await request.json()) as { status?: unknown; notes?: unknown };
    const status = typeof body.status === "string" ? body.status : "";
    if (!statuses.has(status)) {
      return NextResponse.json({ success: false, message: "Invalid application status." }, { status: 400 });
    }
    const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : undefined;
    const application = await prisma.careerApplication.update({
      where: { id },
      data: {
        status: status as "NEW" | "REVIEWED" | "SHORTLISTED" | "INTERVIEW" | "SELECTED" | "REJECTED" | "JOINED",
        ...(notes !== undefined ? { notes: notes || null } : {}),
        reviewedAt: status === "NEW" ? null : new Date(),
      },
    });
    await safeFirestoreMirror("careerApplications", id, {
      applicationNumber: application.applicationNumber,
      name: application.name,
      phone: application.phone,
      email: application.email,
      position: application.position,
      status: application.status,
      resumeStoragePath: application.resumeStoragePath,
      trafficClass: application.trafficClass,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
    });
    return NextResponse.json({ success: true, status: application.status });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 500;
    return NextResponse.json({ success: false, message: "The application could not be updated." }, { status });
  }
}
