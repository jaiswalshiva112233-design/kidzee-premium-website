import { NextResponse } from "next/server";

import { requireOwner } from "@/lib/admin/auth";
import { getStorageHealthSnapshot } from "@/lib/admin/storageHealth";
import { MEDIA_SAFETY_SETTING_ID } from "@/lib/media/mediaSafety";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireOwner();
    return NextResponse.json({ success: true, snapshot: await getStorageHealthSnapshot() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ success: false, message: status === 403 ? "Only the Owner can view storage health." : "Please sign in again." }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireOwner();
    const body = (await request.json()) as Record<string, unknown>;
    const previous = await prisma.mediaSafetySetting.upsert({ where: { id: MEDIA_SAFETY_SETTING_ID }, create: { id: MEDIA_SAFETY_SETTING_ID }, update: {} });
    const data = {
      aiMediaFeaturesEnabled: false,
      directVideoUploadEnabled: body.directVideoUploadEnabled === true,
      externalEmbedsEnabled: body.externalEmbedsEnabled !== false,
      originalArchiveEnabled: body.originalArchiveEnabled === true,
      compressionEnabled: body.compressionEnabled !== false,
      privateProtectionLocked: true,
      backupWarningsEnabled: body.backupWarningsEnabled !== false,
      growthWarningsEnabled: body.growthWarningsEnabled !== false,
      updatedById: session.userId,
    };
    const settings = await prisma.$transaction(async (transaction) => {
      const updated = await transaction.mediaSafetySetting.update({ where: { id: MEDIA_SAFETY_SETTING_ID }, data });
      await transaction.activityLog.create({
        data: {
          adminUserId: session.userId,
          action: "UPDATED",
          entityType: "MediaSafetySetting",
          entityId: MEDIA_SAFETY_SETTING_ID,
          description: "Owner updated trial media and storage safety controls.",
          previousData: previous,
          newData: updated,
        },
      });
      return updated;
    });
    return NextResponse.json({ success: true, message: "Storage safety settings saved.", settings }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ success: false, message: status === 403 ? "Only the Owner can change storage safety." : "Please sign in again." }, { status });
  }
}
