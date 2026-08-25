import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { buildCampaignUrl, campaignDefaults, cleanCampaignValue, isCampaignPlatform, isCampaignPurpose, validateCampaignDestination } from "@/lib/marketing/campaignUrls";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function owner() {
  const session = await getAdminSession();
  return session?.role === "OWNER" ? session : null;
}

export async function GET() {
  const session = await owner();
  if (!session) return NextResponse.json({ success: false, message: "Owner access is required." }, { status: 403 });
  const [items, landingPages] = await Promise.all([
    prisma.campaignUrl.findMany({ orderBy: { createdAt: "desc" }, take: 250, include: { createdBy: { select: { name: true } }, landingPage: { select: { id: true, name: true, slug: true, pageType: true, status: true } } } }),
    prisma.landingPage.findMany({ where: { status: { in: ["PUBLISHED", "DRAFT"] } }, orderBy: [{ status: "desc" }, { name: "asc" }], select: { id: true, name: true, slug: true, pageType: true, status: true } }),
  ]);
  const enriched = await Promise.all(items.map(async (item) => {
    const recruitment = item.purpose === "RECRUITMENT";
    const [admissions, applications] = await Promise.all([
      recruitment ? Promise.resolve(0) : prisma.websiteLeadSubmission.count({ where: { leadType: "admission", trafficClass: "GENUINE", utmSource: item.utmSource, utmCampaign: item.utmCampaign } }),
      recruitment ? prisma.careerApplication.count({ where: { leadType: "recruitment", trafficClass: "GENUINE", source: item.utmSource, campaign: item.utmCampaign } }) : Promise.resolve(0),
    ]);
    return { ...item, leads: admissions, applications };
  }));
  return NextResponse.json({ success: true, items: enriched, landingPages }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const session = await owner();
  if (!session) return NextResponse.json({ success: false, message: "Owner access is required." }, { status: 403 });
  try {
    const body = await request.json() as Record<string, unknown>;
    const platform = cleanCampaignValue(body.platform, 30).toUpperCase();
    const purpose = cleanCampaignValue(body.purpose, 30).toUpperCase();
    const destinationType = cleanCampaignValue(body.destinationType, 50);
    const destinationUrl = cleanCampaignValue(body.destinationUrl, 800);
    const campaignName = cleanCampaignValue(body.campaignName, 150);
    if (!isCampaignPlatform(platform) || !isCampaignPurpose(purpose) || !destinationType || !destinationUrl || !campaignName) {
      return NextResponse.json({ success: false, message: "Platform, purpose, destination and campaign name are required." }, { status: 400 });
    }
    const siteOrigin = new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://kidzeedwarka.com").origin;
    const destination = new URL(destinationUrl, siteOrigin);
    if (destination.origin !== siteOrigin) return NextResponse.json({ success: false, message: "Destination must be on the configured Kidzee website." }, { status: 400 });
    const landingPageId = cleanCampaignValue(body.landingPageId, 100) || null;
    const landing = landingPageId ? await prisma.landingPage.findUnique({ where: { id: landingPageId }, select: { slug: true, pageType: true } }) : null;
    if (landingPageId && !landing) return NextResponse.json({ success: false, message: "The selected landing page no longer exists." }, { status: 400 });
    const recruitmentLanding = Boolean(landing && /career|recruit/i.test(landing.pageType));
    const destinationError = landing
      ? purpose === "RECRUITMENT" && !recruitmentLanding
        ? "Recruitment campaigns must use a recruitment landing page."
        : purpose === "ADMISSION" && recruitmentLanding
          ? "Admission campaigns cannot use a recruitment landing page."
          : null
      : validateCampaignDestination(purpose, destination.toString());
    if (destinationError) return NextResponse.json({ success: false, message: destinationError }, { status: 400 });
    const defaults = campaignDefaults(platform);
    const utmSource = cleanCampaignValue(body.utmSource, 100) || defaults.source;
    const utmMedium = cleanCampaignValue(body.utmMedium, 100) || defaults.medium;
    const utmCampaign = cleanCampaignValue(body.utmCampaign, 150) || campaignName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
    const adSetName = cleanCampaignValue(body.adSetName, 150) || null;
    const creativeName = cleanCampaignValue(body.creativeName, 150) || null;
    const keyword = cleanCampaignValue(body.keyword, 150) || null;
    const generated = buildCampaignUrl({ destinationUrl: destination.toString(), utmSource, utmMedium, utmCampaign, utmContent: creativeName || undefined, utmTerm: keyword || undefined, adSetName: adSetName || undefined });
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.campaignUrl.create({ data: { ...generated, platform, purpose, destinationType, destinationUrl: destination.toString(), campaignName, adSetName, creativeName, keyword, utmSource, utmMedium, utmCampaign, utmContent: creativeName, utmTerm: keyword, landingPageId, createdById: session.userId } });
      await tx.activityLog.create({ data: { adminUserId: session.userId, action: "CREATED", entityType: "CAMPAIGN_URL", entityId: created.id, description: `Created ${purpose.toLowerCase()} campaign URL.`, newData: { platform, purpose, destinationType, campaignName, trackingKey: created.trackingKey } } });
      return created;
    });
    return NextResponse.json({ success: true, item }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ success: false, message: "The campaign URL could not be created. Check all fields and try again." }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await owner();
  if (!session) return NextResponse.json({ success: false, message: "Owner access is required." }, { status: 403 });
  const body = await request.json() as { id?: unknown; active?: unknown };
  const id = cleanCampaignValue(body.id, 100);
  if (!id || typeof body.active !== "boolean") return NextResponse.json({ success: false, message: "Invalid request." }, { status: 400 });
  const item = await prisma.campaignUrl.update({ where: { id }, data: { active: body.active } });
  await prisma.activityLog.create({ data: { adminUserId: session.userId, action: "UPDATED", entityType: "CAMPAIGN_URL", entityId: id, description: body.active ? "Reactivated campaign URL." : "Archived campaign URL." } });
  return NextResponse.json({ success: true, item });
}
