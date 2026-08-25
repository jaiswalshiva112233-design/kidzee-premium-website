import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import ChannelDashboard from "@/components/admin/marketing/ChannelDashboard";
import MarketingPageFrame from "@/components/admin/marketing/MarketingPageFrame";
import { getAdminSession } from "@/lib/admin/auth";
import { buildMarketingControlData } from "@/lib/growth/marketingControl";
export const dynamic = "force-dynamic";
export default async function MetaAdsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const data = await buildMarketingControlData("META");
  return (
    <AdminLayout>
      <MarketingPageFrame
        current="/admin/marketing/meta-ads"
        eyebrow="Meta Ads"
        title="Meta campaign performance"
        description="Campaigns, ad sets, creatives, audiences, placements, qualified leads and confirmed admissions. CentreOS keeps provider metrics separate from verified CRM outcomes so weak evidence is never presented as fact."
      >
        <ChannelDashboard data={data} />
      </MarketingPageFrame>
    </AdminLayout>
  );
}
