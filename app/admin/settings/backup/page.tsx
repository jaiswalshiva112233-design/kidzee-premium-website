import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import BackupExportCenter from "@/components/admin/settings/BackupExportCenter";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function BackupExportPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fsettings%2Fbackup");
  if (session.role !== "OWNER") redirect("/admin");
  const history = await prisma.backupExport.findMany({ orderBy: { createdAt: "desc" }, take: 40 });
  return <AdminLayout><BackupExportCenter initialHistory={history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString(), completedAt: item.completedAt?.toISOString() ?? null }))} /></AdminLayout>;
}
