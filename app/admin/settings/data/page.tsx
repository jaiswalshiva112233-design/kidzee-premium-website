import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import DataControlCenter from "@/components/admin/settings/DataControlCenter";
import { getAdminSession } from "@/lib/admin/auth";
import { getDataControlSnapshot } from "@/lib/admin/dataControl";

export const dynamic = "force-dynamic";

export default async function DataControlPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login?next=%2Fadmin%2Fsettings%2Fdata");
  }

  if (session.role !== "OWNER") {
    redirect("/admin");
  }

  return (
    <AdminLayout>
      <DataControlCenter initialSnapshot={await getDataControlSnapshot()} />
    </AdminLayout>
  );
}
