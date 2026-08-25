import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import ChannelDashboard from "@/components/admin/marketing/ChannelDashboard";
import MarketingPageFrame from "@/components/admin/marketing/MarketingPageFrame";
import { getAdminSession } from "@/lib/admin/auth";
import { buildMarketingControlData } from "@/lib/growth/marketingControl";
export const dynamic = "force-dynamic";
export default async function GoogleAdsPage() {
  if (!(await getAdminSession())) redirect("/admin/login");
  const data = await buildMarketingControlData("GOOGLE");
  return (
    <AdminLayout>
      <MarketingPageFrame
        current="/admin/marketing/google-ads"
        eyebrow="Google Ads"
        title="Google Ads performance"
        description="Campaign delivery, search intent, landing pages and verified CentreOS admissions in one view. Provider statistics are shown only when a connected snapshot exists; recommendations never change campaigns automatically."
      >
        <ChannelDashboard data={data} />
      </MarketingPageFrame>
    </AdminLayout>
  );
}
