import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";
import {
  getWebsiteOperationalSettings,
  normaliseWebsiteOperations,
  WEBSITE_OPERATIONS_KEY,
  websiteOperationsJson,
} from "@/lib/website/operationalSettings";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ success: true, settings: await getWebsiteOperationalSettings() });
  } catch {
    return NextResponse.json({ success: false, message: "Website operations settings are unavailable." }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await requireAdmin();
    const settings = normaliseWebsiteOperations(await request.json());
    if (!/^20\d{2}(?:-\d{2,4})?$/.test(settings.admissionsYear)) {
      return NextResponse.json({ success: false, message: "Use an admissions year such as 2026-27." }, { status: 400 });
    }
    if (settings.noticeEnabled && !settings.noticeText) {
      return NextResponse.json({ success: false, message: "Enter notice text before publishing it." }, { status: 400 });
    }
    if (settings.noticeLink && !settings.noticeLink.startsWith("/") && !/^https:\/\//i.test(settings.noticeLink)) {
      return NextResponse.json({ success: false, message: "Notice link must start with / or https://." }, { status: 400 });
    }
    const previous = await prisma.centreSetting.findUnique({ where: { key: WEBSITE_OPERATIONS_KEY } });
    await prisma.$transaction([
      prisma.centreSetting.upsert({
        where: { key: WEBSITE_OPERATIONS_KEY },
        create: { key: WEBSITE_OPERATIONS_KEY, value: websiteOperationsJson(settings), description: "Editable public website operations, campaign defaults, MIRA knowledge and notices." },
        update: { value: websiteOperationsJson(settings) },
      }),
      prisma.activityLog.create({
        data: {
          adminUserId: session.userId,
          action: "UPDATED",
          entityType: "WEBSITE_OPERATIONS",
          entityId: WEBSITE_OPERATIONS_KEY,
          description: "Website operating defaults were updated from CentreOS.",
          previousData: previous?.value ?? undefined,
          newData: websiteOperationsJson(settings),
        },
      }),
    ]);
    revalidatePath("/", "layout");
    return NextResponse.json({ success: true, settings });
  } catch (error) {
    logServerError("Unable to save website operations settings.", error);
    return NextResponse.json({ success: false, message: "Website operations settings could not be saved." }, { status: 500 });
  }
}
