import type { $Enums } from "@/generated/prisma/client";

import { requireOwner } from "@/lib/admin/auth";
import { createSafeBackup } from "@/lib/admin/backupExports";

const TYPES = new Set<$Enums.BackupExportType>(["DATABASE", "WEBSITE_CONTENT", "MEDIA_INDEX", "SETTINGS"]);

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await requireOwner();
    const body = (await request.json()) as { exportType?: unknown };
    const exportType = typeof body.exportType === "string" ? body.exportType.toUpperCase() as $Enums.BackupExportType : "" as $Enums.BackupExportType;
    if (!TYPES.has(exportType)) {
      return Response.json({ success: false, message: "Choose a valid backup type." }, { status: 400 });
    }
    const result = await createSafeBackup({ exportType, userId: session.userId, userName: session.name });
    return new Response(result.payload, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="${result.history.fileName}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Backup-Id": result.history.id,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "FORBIDDEN" ? 403 : message === "UNAUTHENTICATED" ? 401 : 500;
    return Response.json({ success: false, message: status === 403 ? "Only the Owner can create backups." : status === 401 ? "Please sign in again." : "The backup could not be created. No existing data was changed." }, { status });
  }
}
