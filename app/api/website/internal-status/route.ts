import { NextRequest, NextResponse } from "next/server";

import { classifyWebsiteRequest } from "@/lib/marketing/internalTraffic";

export const dynamic = "force-dynamic";

export function GET(request: NextRequest) {
  const classification = classifyWebsiteRequest(request);
  return NextResponse.json(
    {
      excluded: classification.trafficClass !== "GENUINE",
      testMode: classification.isTest,
      trafficClass: classification.trafficClass,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
