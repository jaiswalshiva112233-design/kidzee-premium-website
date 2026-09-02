import type { Prisma } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { safeFirestoreMirror } from "@/lib/firebase/firestoreRest";
import { classifyWebsiteRequest } from "@/lib/marketing/internalTraffic";
import { site } from "@/lib/site";
import {
  consumeDistributedRateLimit,
  requestIp,
} from "@/lib/server/distributedRateLimit";
import { logServerError } from "@/lib/server/safeLogging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 24_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_EVENTS = 80;

const eventTypes = [
  "PAGE_VIEW",
  "CTA_CLICK",
  "PHONE_CLICK",
  "WHATSAPP_CLICK",
  "MAP_CLICK",
  "FORM_STARTED",
  "FORM_SUBMITTED",
  "GALLERY_OPEN",
  "VIDEO_PLAY",
  "WEB_VITAL",
  "LANDING_VARIANT_VIEW",
  "SCROLL_DEPTH",
  "SESSION_ENGAGEMENT",
  "BROKEN_IMAGE",
] as const;

type WebsiteEventType = (typeof eventTypes)[number];

type WebsiteEventBody = {
  eventType?: unknown;
  eventName?: unknown;
  pagePath?: unknown;
  pageTitle?: unknown;
  targetUrl?: unknown;
  targetText?: unknown;
  visitorId?: unknown;
  sessionId?: unknown;
  enquiryNumber?: unknown;
  landingPage?: unknown;
  referrer?: unknown;
  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmContent?: unknown;
  utmTerm?: unknown;
  gclid?: unknown;
  gbraid?: unknown;
  wbraid?: unknown;
  fbclid?: unknown;
  fbc?: unknown;
  fbp?: unknown;
  campaignTrackingKey?: unknown;
  firstTouch?: unknown;
  lastTouch?: unknown;
  deviceType?: unknown;
  viewportWidth?: unknown;
  language?: unknown;
  timeZone?: unknown;
  metricValue?: unknown;
  metricDelta?: unknown;
  metricRating?: unknown;
  landingPageId?: unknown;
  landingVariantId?: unknown;
  growthExperimentId?: unknown;
};

function noStoreJson(
  body: Record<string, unknown>,
  status: number,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function cleanText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function cleanAnonymousId(value: unknown) {
  const cleaned = cleanText(value, 100);

  return /^[A-Za-z0-9_-]{8,100}$/.test(cleaned)
    ? cleaned
    : "";
}

function cleanPagePath(value: unknown) {
  const cleaned = cleanText(value, 500);

  if (!cleaned.startsWith("/")) {
    return "/";
  }

  try {
    const parsed = new URL(cleaned, site.url);

    const allowedParameters = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ];

    const safeParameters = new URLSearchParams();

    for (const parameter of allowedParameters) {
      const parameterValue =
        parsed.searchParams.get(parameter);

      if (parameterValue) {
        safeParameters.set(
          parameter,
          parameterValue.slice(0, 150),
        );
      }
    }

    const query = safeParameters.toString();

    return `${parsed.pathname}${
      query ? `?${query}` : ""
    }`.slice(0, 500);
  } catch {
    return "/";
  }
}

function cleanExternalReference(value: unknown) {
  const cleaned = cleanText(value, 500);

  if (!cleaned) {
    return "";
  }

  try {
    const parsed = new URL(cleaned, site.url);

    if (
      parsed.origin === new URL(site.url).origin
    ) {
      return parsed.pathname.slice(0, 500);
    }

    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.slice(
      0,
      500,
    );
  } catch {
    return "";
  }
}

function cleanTargetUrl(value: unknown) {
  const cleaned = cleanText(value, 500);

  if (!cleaned) {
    return "";
  }

  if (
    cleaned.startsWith("/") ||
    cleaned.startsWith("#") ||
    cleaned.startsWith("tel:")
  ) {
    return cleaned;
  }

  try {
    const parsed = new URL(cleaned, site.url);

    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.slice(
      0,
      500,
    );
  } catch {
    return "";
  }
}

function cleanEventType(
  value: unknown,
): WebsiteEventType | null {
  if (
    typeof value === "string" &&
    eventTypes.includes(
      value as WebsiteEventType,
    )
  ) {
    return value as WebsiteEventType;
  }

  return null;
}

function eventScope(
  eventType: WebsiteEventType,
  eventName: string,
  pagePath: string,
  targetUrl: string,
) {
  const name = eventName.toLowerCase();
  const path = pagePath.toLowerCase();
  const target = targetUrl.toLowerCase();
  if (path.startsWith("/careers") || name.startsWith("career_")) {
    return "RECRUITMENT" as const;
  }
  if (
    name.startsWith("admission_") ||
    eventType === "FORM_STARTED" ||
    eventType === "FORM_SUBMITTED" ||
    ((eventType === "CTA_CLICK" ||
      eventType === "PHONE_CLICK" ||
      eventType === "WHATSAPP_CLICK") &&
      (/admission|book.*visit|enquir/.test(name) ||
        /admission|enquir/.test(path + target)))
  ) {
    return "ADMISSION" as const;
  }
  return "GENERAL" as const;
}

function getAllowedOrigins(request: NextRequest) {
  const origins = new Set<string>([
    request.nextUrl.origin,
    "https://kidzeedwarka.com",
    "https://www.kidzeedwarka.com",
    "http://localhost:3000",
  ]);

  const host = request.headers.get("host");
  if (host) {
    origins.add(`https://${host}`);
    origins.add(`http://${host}`);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  if (forwardedHost) {
    origins.add(`https://${forwardedHost}`);
    origins.add(`http://${forwardedHost}`);
  }

  try {
    origins.add(new URL(site.url).origin);
  } catch {
    // The request origin is still checked if
    // the configured website URL is invalid.
  }

  return origins;
}

function hasAllowedOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowed = getAllowedOrigins(request);
  if (allowed.has(origin)) {
    return true;
  }

  try {
    const originUrl = new URL(origin);
    const hostname = originUrl.hostname.toLowerCase();
    if (
      hostname === "kidzeedwarka.com" ||
      hostname.endsWith(".kidzeedwarka.com") ||
      hostname.endsWith(".hosted.app") ||
      hostname === "localhost" ||
      hostname === "127.0.0.1"
    ) {
      return true;
    }
  } catch {
    // invalid URL format
  }

  return false;
}

function describeEvent(
  eventType: WebsiteEventType,
  pagePath: string,
  targetText: string,
) {
  const descriptions: Record<
    WebsiteEventType,
    string
  > = {
    PAGE_VIEW:
      `Website page viewed: ${pagePath}`,

    CTA_CLICK:
      `Website enquiry button clicked: ${
        targetText || pagePath
      }`,

    PHONE_CLICK:
      `Website Call button clicked: ${pagePath}`,

    WHATSAPP_CLICK:
      `Website WhatsApp button clicked: ${pagePath}`,

    MAP_CLICK:
      `Website directions clicked: ${pagePath}`,

    FORM_STARTED:
      `Website enquiry form started: ${pagePath}`,

    FORM_SUBMITTED:
      `Website enquiry form submitted: ${pagePath}`,

    GALLERY_OPEN:
      `Website gallery item opened: ${
        targetText || pagePath
      }`,

    VIDEO_PLAY:
      `Website video played: ${
        targetText || pagePath
      }`,

    WEB_VITAL:
      `Website performance metric recorded: ${targetText || pagePath}`,
    LANDING_VARIANT_VIEW: `Landing-page variant viewed: ${targetText || pagePath}`,
    SCROLL_DEPTH: `Website scroll depth recorded: ${pagePath}`,
    SESSION_ENGAGEMENT: `Website engagement duration recorded: ${pagePath}`,
    BROKEN_IMAGE: `Website image failed to load: ${targetText || pagePath}`,
  };

  return descriptions[eventType].slice(
    0,
    500,
  );
}

export async function POST(
  request: NextRequest,
) {
  if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
    return noStoreJson(
      { success: false, message: "Content-Type must be application/json." },
      415,
    );
  }

  if (!hasAllowedOrigin(request)) {
    return noStoreJson(
      {
        success: false,
        message:
          "This analytics request is not allowed.",
      },
      403,
    );
  }

  const contentLength = Number(
    request.headers.get("content-length") ??
      "0",
  );

  if (
    Number.isFinite(contentLength) &&
    contentLength > MAX_BODY_BYTES
  ) {
    return noStoreJson(
      {
        success: false,
        message:
          "The analytics request is too large.",
      },
      413,
    );
  }

  let body: WebsiteEventBody;

  try {
    body =
      (await request.json()) as WebsiteEventBody;
  } catch {
    return noStoreJson(
      {
        success: false,
        message:
          "Invalid analytics request.",
      },
      400,
    );
  }

  const eventType = cleanEventType(
    body.eventType,
  );

  const visitorId = cleanAnonymousId(
    body.visitorId,
  );

  const sessionId = cleanAnonymousId(
    body.sessionId,
  );

  if (
    !eventType ||
    !visitorId ||
    !sessionId
  ) {
    return noStoreJson(
      {
        success: false,
        message:
          "Required analytics information is missing.",
      },
      400,
    );
  }

  const [rateLimit, ipRateLimit] = await Promise.all([
    consumeDistributedRateLimit({
      scope: "website_analytics_session",
      identifier: sessionId,
      limit: RATE_LIMIT_MAX_EVENTS,
      windowMs: RATE_LIMIT_WINDOW_MS,
    }),
    consumeDistributedRateLimit({
      scope: "website_analytics_ip",
      identifier: requestIp(request),
      limit: 300,
      windowMs: RATE_LIMIT_WINDOW_MS,
    }),
  ]);

  if (!rateLimit.allowed || !ipRateLimit.allowed) {
    return noStoreJson(
      {
        success: false,
        message:
          "Too many analytics events.",
      },
      429,
    );
  }

  const pagePath = cleanPagePath(
    body.pagePath,
  );

  const targetText = cleanText(
    body.targetText,
    150,
  );

  const enquiryNumber = cleanText(
    body.enquiryNumber,
    80,
  );

  const viewportWidth = Number(
    body.viewportWidth,
  );

  const metricValue = Number(body.metricValue);
  const metricDelta = Number(body.metricDelta);
  const suppliedEventName = cleanText(body.eventName, 100);
  const targetUrl = cleanTargetUrl(body.targetUrl);
  const scope = eventScope(
    eventType,
    suppliedEventName,
    pagePath,
    targetUrl,
  );
  const eventName =
    scope === "RECRUITMENT" && eventType === "PAGE_VIEW"
      ? "career_page_viewed"
      : scope === "RECRUITMENT" && eventType === "FORM_STARTED"
        ? "career_application_started"
        : scope === "RECRUITMENT" && eventType === "FORM_SUBMITTED"
          ? "career_application_submitted"
          : scope === "ADMISSION" && eventType === "FORM_SUBMITTED"
            ? "admission_lead_submitted"
            : suppliedEventName;

  const eventData: Prisma.InputJsonObject = {
    eventType,
    eventName,
    eventScope: scope,
    leadType:
      scope === "ADMISSION"
        ? "admission"
        : scope === "RECRUITMENT"
          ? "recruitment"
          : "general",
    visitorId,
    sessionId,
    pagePath,
    pageTitle: cleanText(
      body.pageTitle,
      200,
    ),
    targetUrl,
    targetText,
    enquiryNumber,

    landingPage: cleanPagePath(
      body.landingPage,
    ),

    referrer: cleanExternalReference(
      body.referrer,
    ),

    utmSource: cleanText(
      body.utmSource,
      100,
    ),

    utmMedium: cleanText(
      body.utmMedium,
      100,
    ),

    utmCampaign: cleanText(
      body.utmCampaign,
      150,
    ),

    utmContent: cleanText(
      body.utmContent,
      150,
    ),

    utmTerm: cleanText(
      body.utmTerm,
      150,
    ),

    hasGoogleClickId: Boolean(
      cleanText(body.gclid, 200) ||
        cleanText(body.gbraid, 200) ||
        cleanText(body.wbraid, 200),
    ),

    hasMetaClickId: Boolean(
      cleanText(body.fbclid, 200) ||
        cleanText(body.fbc, 250),
    ),

    firstTouch: cleanAttributionTouch(body.firstTouch),
    lastTouch: cleanAttributionTouch(body.lastTouch),

    deviceType: cleanText(
      body.deviceType,
      30,
    ),

    viewportWidth:
      Number.isFinite(viewportWidth) &&
      viewportWidth > 0
        ? Math.round(viewportWidth)
        : 0,

    language: cleanText(
      body.language,
      30,
    ),

    timeZone: cleanText(
      body.timeZone,
      80,
    ),

    metricValue:
      Number.isFinite(metricValue) && metricValue >= 0
        ? metricValue
        : 0,

    metricDelta:
      Number.isFinite(metricDelta)
        ? metricDelta
        : 0,

    metricRating: cleanText(body.metricRating, 20),
    landingPageId: cleanText(body.landingPageId, 100),
    landingVariantId: cleanText(body.landingVariantId, 100),
    growthExperimentId: cleanText(body.growthExperimentId, 100),
    campaignTrackingKey: cleanText(body.campaignTrackingKey, 100),

    anonymous: true,
    ...classifyWebsiteRequest(request),
  };

  try {
    const savedEvent = await prisma.activityLog.create({
      data: {
        action: "CREATED",
        entityType:
          "WEBSITE_ANALYTICS_EVENT",

        entityId:
          enquiryNumber || sessionId,

        description: describeEvent(
          eventType,
          pagePath,
          targetText,
        ),

        newData: eventData,
      },
    });

    await safeFirestoreMirror("websiteEvents", savedEvent.id, {
      ...eventData,
      createdAt: savedEvent.createdAt,
    });

    return new NextResponse(null, {
      status: 204,
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logServerError("Website analytics event could not be saved.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "The analytics event could not be saved.",
      },
      500,
    );
  }
}

function cleanAttributionTouch(value: unknown): Prisma.InputJsonObject | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  return {
    landingPage: cleanText(source.landingPage, 500),
    referrer: cleanText(source.referrer, 500),
    utmSource: cleanText(source.utmSource, 100),
    utmMedium: cleanText(source.utmMedium, 100),
    utmCampaign: cleanText(source.utmCampaign, 150),
    utmContent: cleanText(source.utmContent, 150),
    utmTerm: cleanText(source.utmTerm, 150),
    hasGoogleClickId: Boolean(cleanText(source.gclid, 200) || cleanText(source.gbraid, 200) || cleanText(source.wbraid, 200)),
    hasMetaClickId: Boolean(cleanText(source.fbclid, 200) || cleanText(source.fbc, 250)),
    capturedAt: cleanText(source.capturedAt, 40),
    campaignTrackingKey: cleanText(source.campaignTrackingKey, 100),
  };
}
