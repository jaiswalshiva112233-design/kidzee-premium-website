import { timingSafeEqual } from "node:crypto";

import { NextResponse } from "next/server";

import { generateRecurringInvoices } from "@/lib/admin/recurring-billing";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(request: Request) {
  const secret = process.env.BILLING_CRON_SECRET?.trim() ?? "";
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (secret.length < 32 || supplied.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
}

export async function POST(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  try {
    const owner = await prisma.adminUser.findFirst({
      where: { role: "OWNER", active: true },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (!owner) {
      return NextResponse.json({ success: false, message: "No active Owner account exists." }, { status: 409 });
    }
    const result = await generateRecurringInvoices(owner.id);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    logServerError("Scheduled recurring billing failed.", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
