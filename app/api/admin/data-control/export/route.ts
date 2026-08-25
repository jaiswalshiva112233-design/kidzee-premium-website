import { requireOwner } from "@/lib/admin/auth";
import { createDataControlBackup } from "@/lib/admin/dataControl";

function fileDate() {
  return new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
}

export async function GET() {
  try {
    await requireOwner();

    return new Response(await createDataControlBackup(), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="kidzee-centreos-backup-${fileDate()}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const status = message === "FORBIDDEN" ? 403 : 401;

    return Response.json(
      {
        success: false,
        message:
          status === 403
            ? "Only the owner can export the complete centre backup."
            : "Your session has expired. Please sign in again.",
      },
      {
        status,
      },
    );
  }
}
