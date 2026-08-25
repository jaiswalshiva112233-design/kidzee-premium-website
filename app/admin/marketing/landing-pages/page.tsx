import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import LandingPageManager from "@/components/admin/growth/LandingPageManager";
import AskGrowthAi from "@/components/admin/growth/AskGrowthAi";
import MarketingPageFrame from "@/components/admin/marketing/MarketingPageFrame";
import { getAdminSession } from "@/lib/admin/auth";
export const dynamic = "force-dynamic";
export default async function MarketingLandingPagesPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  return (
    <AdminLayout>
      <MarketingPageFrame
        current="/admin/marketing/landing-pages"
        eyebrow="Landing pages"
        title="Campaign landing-page manager"
        description="Create, duplicate, preview, publish, unpublish, test and roll back admission pages for Google and Meta while preserving every approved version."
      >
        <LandingPageManager />
        <AskGrowthAi />
      </MarketingPageFrame>
    </AdminLayout>
  );
}
