import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorizedScript(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim() ?? "";
  const secret = process.env.GROWTH_SYNC_SECRET?.trim() || process.env.INTERNAL_DEVICE_SECRET?.trim() || "";
  if (!secret || !authHeader) return false;
  const authBuf = Buffer.from(authHeader);
  const secretBuf = Buffer.from(secret);
  return authBuf.length === secretBuf.length && timingSafeEqual(authBuf, secretBuf);
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const snapshot = await prisma.growthDataSnapshot.findFirst({
    where: { source: "GOOGLE_ADS" },
    orderBy: { collectedAt: "desc" },
  });

  return NextResponse.json({ success: true, snapshot });
}

export async function POST(request: NextRequest) {
  const isScriptAuth = isAuthorizedScript(request);
  const session = await getAdminSession();
  if (!session && !isScriptAuth) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;

    const channel = String(body.channel || "GOOGLE").toUpperCase();
    const source = channel === "META" ? "META_ADS" : "GOOGLE_ADS";
    const budget = Number(body.budget) || 500;
    const spend = Number(body.spend) >= 0 ? Number(body.spend) : 0;
    const clicks = Number(body.clicks) >= 0 ? Number(body.clicks) : 0;
    const impressions = Number(body.impressions) >= 0 ? Number(body.impressions) : 0;
    const conversions = Number(body.conversions) >= 0 ? Number(body.conversions) : 0;
    const campaignName = String(body.campaignName || "Kidzee_Dwarka_Sec12_Search_2KM").trim();
    const campaignStatus = String(body.campaignStatus || "Eligible (Standard)").trim();

    const ctr = impressions > 0 ? Number(((clicks / impressions) * 100).toFixed(1)) : 0;
    const cpc = clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0;

    const todayStr = new Date().toISOString().slice(0, 10);
    const deduplicationKey = `${source}:campaign-performance:${todayStr}`;

    const rawKeywords = Array.isArray(body.keywords) ? body.keywords : null;
    const rawSearchTerms = Array.isArray(body.searchTerms) ? body.searchTerms : null;

    const metricsPayload = {
      budget,
      dailyBudget: budget,
      spend,
      cost: spend,
      amountSpent: spend,
      totalSpend: spend,
      clicks,
      linkClicks: clicks,
      totalClicks: clicks,
      impressions,
      totalImpressions: impressions,
      ctr,
      cpc,
      conversions,
      results: conversions,
      leads: conversions,
      campaigns: [
        {
          campaignName,
          status: campaignStatus,
          budget: `₹${budget} / day`,
          clicks,
          ctr: `${ctr}%`,
          cpc: `₹${cpc}`,
          conversions,
        },
      ],
      keywords: rawKeywords && rawKeywords.length > 0 ? rawKeywords : [],
      searchTerms:
        rawSearchTerms && rawSearchTerms.length > 0
          ? rawSearchTerms.map((item) => {
              const record = item as Record<string, unknown>;
              return {
                ...record,
                searchTerm:
                  record.searchTerm || record.keyword || record.query || record.text || "-",
              };
            })
          : [],
    };

    const now = new Date();
    const periodStart = new Date(now.getTime() - 30 * 86_400_000);

    const snapshot = await prisma.growthDataSnapshot.upsert({
      where: { deduplicationKey },
      create: {
        source,
        dataset: "campaign-performance",
        deduplicationKey,
        periodStart,
        periodEnd: now,
        dimensions: {
          centre: "Kidzee Sector 12B Dwarka",
          provenance: isScriptAuth ? "AUTOMATED_SYNC" : "MANUAL_ENTRY",
        },
        metrics: metricsPayload,
        collectedAt: now,
      },
      update: {
        metrics: metricsPayload,
        dimensions: {
          centre: "Kidzee Sector 12B Dwarka",
          provenance: isScriptAuth ? "AUTOMATED_SYNC" : "MANUAL_ENTRY",
        },
        collectedAt: now,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Campaign snapshot synchronized successfully.",
      snapshot,
    });
  } catch (error) {
    console.error("Marketing snapshot sync error:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Failed to sync snapshot." },
      { status: 500 },
    );
  }
}
