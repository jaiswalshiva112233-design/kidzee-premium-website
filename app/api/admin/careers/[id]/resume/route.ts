import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { downloadPrivateFile } from "@/lib/firebase/storageRest";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await context.params;
    const application = await prisma.careerApplication.findUnique({
      where: { id },
      select: { resumeData: true, resumeStoragePath: true, resumeFileName: true, resumeMimeType: true },
    });
    if (!application || (!application.resumeData && !application.resumeStoragePath)) {
      return NextResponse.json({ success: false, message: "Resume not found." }, { status: 404 });
    }
    const bytes = application.resumeStoragePath
      ? await downloadPrivateFile(application.resumeStoragePath)
      : new Uint8Array(application.resumeData!);
    const safeName = (application.resumeFileName || "resume.pdf").replace(/["\\\r\n]/g, "_");
    return new NextResponse(Buffer.from(bytes), {
      headers: {
        "Content-Type": application.resumeMimeType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 500;
    return NextResponse.json({ success: false, message: "Resume could not be opened." }, { status });
  }
}
