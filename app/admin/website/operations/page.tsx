import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import WebsiteOperationsManager from "@/components/admin/website/WebsiteOperationsManager";
import { getAdminSession } from "@/lib/admin/auth";
import { getWebsiteOperationalSettings } from "@/lib/website/operationalSettings";

export const dynamic = "force-dynamic";

export default async function WebsiteOperationsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  const allowed = session.role === "OWNER" || session.permissions.includes("*") || session.permissions.includes("website.manage");
  if (!allowed) redirect("/admin?access=denied");
  return <AdminLayout><WebsiteOperationsManager initialSettings={await getWebsiteOperationalSettings()} /></AdminLayout>;
}
