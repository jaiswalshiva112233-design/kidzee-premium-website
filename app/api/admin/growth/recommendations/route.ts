import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { buildGrowthSnapshot } from "@/lib/growth/analysis";
import { persistGrowthFindings } from "@/lib/growth/recommendations";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";

function text(value: unknown, maximum = 1_000) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

export async function GET() {
  try {
    const session = await requireAdmin();
    const recommendations = await prisma.growthRecommendation.findMany({
      include: {
        createdBy: { select: { name: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      take: 100,
    });
    return NextResponse.json({ success: true, role: session.role, recommendations });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 500;
    return NextResponse.json({ success: false, message: "Recommendations are unavailable." }, { status });
  }
}

export async function POST() {
  try {
    const session = await requireAdmin();
    const snapshot = await buildGrowthSnapshot(30);
    await persistGrowthFindings(snapshot.findings, session.userId || null);
    return GET();
  } catch (error) {
    logServerError("Unable to generate growth recommendations.", error);
    return NextResponse.json({ success: false, message: "Recommendations could not be generated." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();
    if (session.role !== "OWNER") {
      return NextResponse.json({ success: false, message: "Only the owner can approve or roll back recommendations." }, { status: 403 });
    }
    const body = (await request.json()) as { id?: unknown; action?: unknown; note?: unknown };
    const id = text(body.id, 100);
    const action = text(body.action, 30).toUpperCase();
    const existing = await prisma.growthRecommendation.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, message: "Recommendation not found." }, { status: 404 });

    const allowed: Record<string, { status: "APPROVED" | "REJECTED" | "APPLIED" | "ROLLED_BACK"; valid: string[] }> = {
      APPROVE: { status: "APPROVED", valid: ["RECOMMENDED"] },
      REJECT: { status: "REJECTED", valid: ["RECOMMENDED", "APPROVED"] },
      MARK_APPLIED: { status: "APPLIED", valid: ["APPROVED"] },
      ROLLBACK: { status: "ROLLED_BACK", valid: ["APPLIED"] },
    };
    const transition = allowed[action];
    if (!transition || !transition.valid.includes(existing.status)) {
      return NextResponse.json({ success: false, message: "That approval transition is not allowed." }, { status: 409 });
    }
    const now = new Date();
    await prisma.$transaction([
      prisma.growthRecommendation.update({
        where: { id },
        data: {
          status: transition.status,
          reviewedById: session.userId,
          reviewedAt: now,
          appliedAt: transition.status === "APPLIED" ? now : existing.appliedAt,
          rolledBackAt: transition.status === "ROLLED_BACK" ? now : existing.rolledBackAt,
        },
      }),
      prisma.activityLog.create({
        data: {
          adminUserId: session.userId,
          action: "UPDATED",
          entityType: "GROWTH_RECOMMENDATION",
          entityId: id,
          description: `Growth recommendation marked ${transition.status}. No website change was applied automatically.`,
          previousData: {
            status: existing.status,
            title: existing.title,
            preview: existing.preview,
            affectedModules: existing.affectedModules,
            rollbackPlan: existing.rollbackPlan,
            appliedAt: existing.appliedAt,
            rolledBackAt: existing.rolledBackAt,
          },
          newData: {
            status: transition.status,
            note: text(body.note) || null,
            ownerApproved: true,
            automaticProductionChange: false,
            beforeSnapshotPreserved: true,
            rollbackAvailable: transition.status === "APPLIED",
          },
        },
      }),
    ]);
    return GET();
  } catch (error) {
    logServerError("Unable to update a growth recommendation.", error);
    return NextResponse.json({ success: false, message: "Recommendation status could not be updated." }, { status: 500 });
  }
}
