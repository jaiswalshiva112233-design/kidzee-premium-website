import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import CampaignUrlBuilder from "@/components/admin/marketing/CampaignUrlBuilder";
import MarketingPageFrame from "@/components/admin/marketing/MarketingPageFrame";
import { getAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";
export default async function CampaignUrlsPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "OWNER") redirect("/admin");
  return <AdminLayout><MarketingPageFrame current="/admin/marketing/campaign-urls" eyebrow="Campaign tracking" title="Campaign URL Builder" description="Create reusable, purpose-safe URLs for Google, Meta, recruitment, referrals and future campaigns."><CampaignUrlBuilder /></MarketingPageFrame></AdminLayout>;
}
