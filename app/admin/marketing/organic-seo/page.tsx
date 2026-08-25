import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import ChannelDashboard from "@/components/admin/marketing/ChannelDashboard";
import MarketingPageFrame from "@/components/admin/marketing/MarketingPageFrame";
import { getAdminSession } from "@/lib/admin/auth";
import { buildMarketingControlData } from "@/lib/growth/marketingControl";
export const dynamic = "force-dynamic";
export default async function OrganicSeoPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const data = await buildMarketingControlData("ORGANIC");
  return (
    <AdminLayout>
      <MarketingPageFrame
        current="/admin/marketing/organic-seo"
        eyebrow="Organic SEO"
        title="Local organic discovery"
        description="Search Console, GA4, Google Business Profile and CentreOS attribution are reviewed together. Recommendations must be supported by real local-parent searches, qualified leads or admissions before they enter the approval queue."
      >
        <ChannelDashboard data={data} />
      </MarketingPageFrame>
    </AdminLayout>
  );
}
