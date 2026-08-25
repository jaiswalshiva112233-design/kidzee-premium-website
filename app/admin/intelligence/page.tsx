import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import OwnerIntelligenceDashboard from "@/components/admin/intelligence/OwnerIntelligenceDashboard";
import { getAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function OwnerIntelligencePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fintelligence");
  if (session.role !== "OWNER") redirect("/admin");

  return (
    <AdminLayout>
      <OwnerIntelligenceDashboard />
    </AdminLayout>
  );
}
