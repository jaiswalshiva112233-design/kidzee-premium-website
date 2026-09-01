import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import { sanityServerClient } from "@/lib/sanity/serverClient";
import { logServerError } from "@/lib/server/safeLogging";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTINGS_ID = "website-tracking-settings";

type TrackingSettings = {
  googleTagManagerId: string;
  googleAnalyticsId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  metaPixelId: string;
  googleSearchConsoleVerification: string;
  bingWebmasterVerification: string;
  analyticsEnabled: boolean;
  advertisingEnabled: boolean;
  metaPixelEnabled: boolean;
  updatedAt: string | null;
};

type SettingsRequestBody = {
  googleTagManagerId?: unknown;
  googleAnalyticsId?: unknown;
  googleAdsId?: unknown;
  googleAdsConversionLabel?: unknown;
  metaPixelId?: unknown;
  googleSearchConsoleVerification?: unknown;
  bingWebmasterVerification?: unknown;
  analyticsEnabled?: unknown;
  advertisingEnabled?: unknown;
  metaPixelEnabled?: unknown;
};

const emptySettings: TrackingSettings = {
  googleTagManagerId: "",
  googleAnalyticsId: "",
  googleAdsId: "",
  googleAdsConversionLabel: "",
  metaPixelId: "",
  googleSearchConsoleVerification: "",
  bingWebmasterVerification: "",
  analyticsEnabled: false,
  advertisingEnabled: false,
  metaPixelEnabled: false,
  updatedAt: null,
};

function noStoreJson(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

function cleanText(value: unknown, maximumLength: number) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .trim()
    .slice(0, maximumLength);
}

function cleanBoolean(value: unknown) {
  return value === true || value === "true" || value === "1";
}

function extractVerificationToken(value: unknown) {
  const cleaned = cleanText(value, 500);

  if (!cleaned) {
    return "";
  }

  const contentMatch = cleaned.match(
    /content\s*=\s*["']([^"']+)["']/i,
  );

  const token = (contentMatch?.[1] ?? cleaned)
    .replace(/^google-site-verification\s*[:=]\s*/i, "")
    .trim()
    .slice(0, 220);

  return /^[A-Za-z0-9._:+/=-]{5,220}$/.test(token) ? token : "";
}

function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set<string>([new URL(request.url).origin]);

  try {
    allowedOrigins.add(new URL(site.url).origin);
  } catch {
    // The request origin is still checked when the configured URL is invalid.
  }

  return allowedOrigins.has(origin);
}

async function requireWebsiteManager() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return {
      allowed: false as const,
      response: noStoreJson(
        {
          success: false,
          message: "You are not authorised.",
        },
        401,
      ),
    };
  }

  const allowed = await hasAdminPermission("website.manage");

  if (!allowed) {
    return {
      allowed: false as const,
      response: noStoreJson(
        {
          success: false,
          message:
            "You do not have permission to manage website tracking settings.",
        },
        403,
      ),
    };
  }

  return {
    allowed: true as const,
  };
}

async function loadSettings(): Promise<TrackingSettings> {
  const settings = await sanityServerClient.fetch<TrackingSettings | null>(
    `*[
      _type == "websiteTrackingSettings" &&
      _id == $settingsId
    ][0] {
      googleTagManagerId,
      googleAnalyticsId,
      googleAdsId,
      googleAdsConversionLabel,
      metaPixelId,
      googleSearchConsoleVerification,
      bingWebmasterVerification,
      analyticsEnabled,
      advertisingEnabled,
      metaPixelEnabled,
      updatedAt
    }`,
    {
      settingsId: SETTINGS_ID,
    },
  );

  return {
    ...emptySettings,
    ...(settings ?? {}),
  };
}

function validateSettings(body: SettingsRequestBody) {
  const settings: TrackingSettings = {
    googleTagManagerId: cleanText(body.googleTagManagerId, 30).toUpperCase(),
    googleAnalyticsId: cleanText(body.googleAnalyticsId, 30).toUpperCase(),
    googleAdsId: cleanText(body.googleAdsId, 30).toUpperCase(),
    googleAdsConversionLabel: cleanText(
      body.googleAdsConversionLabel,
      100,
    ),
    metaPixelId: cleanText(body.metaPixelId, 35),
    googleSearchConsoleVerification: extractVerificationToken(
      body.googleSearchConsoleVerification,
    ),
    bingWebmasterVerification: extractVerificationToken(
      body.bingWebmasterVerification,
    ),
    analyticsEnabled: cleanBoolean(body.analyticsEnabled),
    advertisingEnabled: cleanBoolean(body.advertisingEnabled),
    metaPixelEnabled: cleanBoolean(body.metaPixelEnabled),
    updatedAt: new Date().toISOString(),
  };

  const errors: string[] = [];

  if (
    settings.googleTagManagerId &&
    !/^GTM-[A-Z0-9]{4,20}$/.test(settings.googleTagManagerId)
  ) {
    errors.push("Enter a valid Google Tag Manager ID such as GTM-ABC1234.");
  }

  if (
    settings.googleAnalyticsId &&
    !/^G-[A-Z0-9]{4,20}$/.test(settings.googleAnalyticsId)
  ) {
    errors.push("Enter a valid Google Analytics ID such as G-ABC1234567.");
  }

  if (
    settings.googleAdsId &&
    !/^AW-[0-9]{5,20}$/.test(settings.googleAdsId)
  ) {
    errors.push("Enter a valid Google Ads ID such as AW-123456789.");
  }

  if (
    settings.googleAdsConversionLabel &&
    !/^[A-Za-z0-9_-]{1,100}$/.test(settings.googleAdsConversionLabel)
  ) {
    errors.push("The Google Ads conversion label is invalid.");
  }

  if (settings.googleAdsConversionLabel && !settings.googleAdsId) {
    errors.push("Enter the Google Ads ID before adding its conversion label.");
  }

  if (settings.metaPixelId && !/^[0-9]{5,35}$/.test(settings.metaPixelId)) {
    errors.push("Enter a valid numeric Meta Pixel ID.");
  }

  if (
    cleanText(body.googleSearchConsoleVerification, 500) &&
    !settings.googleSearchConsoleVerification
  ) {
    errors.push("The Google Search Console verification token is invalid.");
  }

  if (
    cleanText(body.bingWebmasterVerification, 500) &&
    !settings.bingWebmasterVerification
  ) {
    errors.push("The Bing Webmaster verification token is invalid.");
  }

  if (
    settings.analyticsEnabled &&
    !settings.googleTagManagerId &&
    !settings.googleAnalyticsId
  ) {
    errors.push(
      "Add a Google Tag Manager or Google Analytics ID before enabling analytics.",
    );
  }

  if (settings.advertisingEnabled && !settings.googleAdsId) {
    errors.push("Add a Google Ads ID before enabling advertising tracking.");
  }

  if (settings.metaPixelEnabled && !settings.metaPixelId) {
    errors.push("Add a Meta Pixel ID before enabling Meta tracking.");
  }

  return {
    settings,
    errors,
  };
}

export async function GET() {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    const settings = await loadSettings();

    return noStoreJson({
      success: true,
      settings,
      websiteUrl: site.url,
    });
  } catch (error) {
    logServerError("Unable to load website tracking settings.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "Website tracking settings could not be loaded. Please try again. If the problem continues, contact the Owner.",
      },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    if (!hasAllowedOrigin(request)) {
      return noStoreJson(
        {
          success: false,
          message: "This settings request is not allowed.",
        },
        403,
      );
    }

    let body: SettingsRequestBody;

    try {
      body = (await request.json()) as SettingsRequestBody;
    } catch {
      return noStoreJson(
        {
          success: false,
          message: "The tracking settings are invalid.",
        },
        400,
      );
    }

    const { settings, errors } = validateSettings(body);

    if (errors.length > 0) {
      return noStoreJson(
        {
          success: false,
          message: errors[0],
          errors,
        },
        400,
      );
    }

    await sanityServerClient.createOrReplace({
      _id: SETTINGS_ID,
      _type: "websiteTrackingSettings",
      ...settings,
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin/website/seo");

    return noStoreJson({
      success: true,
      message:
        "Website verification and tracking settings have been saved.",
      settings,
    });
  } catch (error) {
    logServerError("Unable to save website tracking settings.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "Website tracking settings could not be saved. Please try again. If the problem continues, contact the Owner.",
      },
      500,
    );
  }
}
