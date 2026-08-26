import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import StorageHealthCenter from "@/components/admin/settings/StorageHealthCenter";
import { getAdminSession } from "@/lib/admin/auth";
import { getStorageHealthSnapshot } from "@/lib/admin/storageHealth";

export const dynamic = "force-dynamic";

export default async function StorageHealthPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fsettings%2Fstorage");
  if (session.role !== "OWNER") redirect("/admin");
  const snapshot = await getStorageHealthSnapshot();
  return <AdminLayout><StorageHealthCenter initialSnapshot={JSON.parse(JSON.stringify(snapshot))} /></AdminLayout>;
}
