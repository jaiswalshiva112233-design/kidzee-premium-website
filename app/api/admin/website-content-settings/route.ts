import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import {
  defaultWebsiteContentSettings,
  getWebsiteContentSettings,
  type WebsiteContentSettings,
} from "@/lib/sanity/contentSettings";
import { sanityServerClient } from "@/lib/sanity/serverClient";
import { logServerError } from "@/lib/server/safeLogging";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTINGS_ID = "website-content-settings";

type SettingsRequestBody = Partial<
  Record<keyof WebsiteContentSettings, unknown>
>;

const textLimits = {
  academicYear: 20,
  homeHeroHeading: 100,
  homeHeroHighlight: 70,
  homeHeroLead: 220,
  homeHeroSupport: 260,
  aboutHeroHeading: 110,
  aboutHeroHighlight: 70,
  aboutHeroIntro: 280,
  programmesHeroHeading: 110,
  programmesHeroHighlight: 70,
  programmesHeroIntro: 280,
  daycareHeroHeading: 110,
  daycareHeroHighlight: 70,
  daycareHeroIntro: 280,
  admissionsHeroHeading: 130,
  admissionsHeroIntro: 280,
  primaryCtaLabel: 40,
  secondaryCtaLabel: 40,
} as const;

function noStoreJson(body: Record<string, unknown>, status = 200) {
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
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
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
    // The current request origin is still checked.
  }

  return allowedOrigins.has(origin);
}

async function requireWebsiteManager() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return {
      allowed: false as const,
      response: noStoreJson(
        { success: false, message: "You are not authorised." },
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
          message: "You do not have permission to change website content.",
        },
        403,
      ),
    };
  }

  return { allowed: true as const };
}

function validateSettings(body: SettingsRequestBody) {
  const errors: string[] = [];
  const settings = { ...defaultWebsiteContentSettings };

  for (const key of Object.keys(textLimits) as Array<
    keyof typeof textLimits
  >) {
    const value = cleanText(body[key], textLimits[key]);

    if (!value) {
      errors.push(`${key} cannot be empty.`);
      continue;
    }

    settings[key] = value;
  }

  settings.admissionsOpen = body.admissionsOpen !== false;

  settings.homeHeroAutoRotate = body.homeHeroAutoRotate !== false;

  if (
    typeof body.homeHeroRotationSeconds !== "number" ||
    !Number.isInteger(body.homeHeroRotationSeconds) ||
    body.homeHeroRotationSeconds < 3 ||
    body.homeHeroRotationSeconds > 60
  ) {
    errors.push("Hero photo rotation must be a whole number from 3 to 60 seconds.");
  } else {
    settings.homeHeroRotationSeconds = body.homeHeroRotationSeconds;
  }

  settings.updatedAt = new Date().toISOString();

  return { settings, errors };
}

export async function GET() {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    return noStoreJson({
      success: true,
      settings: await getWebsiteContentSettings(),
    });
  } catch (error) {
    logServerError("Unable to load website content settings.", error);
    return noStoreJson(
      {
        success: false,
        message: "Website text could not be loaded. Please try again. If the problem continues, contact the Owner.",
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
        { success: false, message: "This settings request is not allowed." },
        403,
      );
    }

    let body: SettingsRequestBody;

    try {
      body = (await request.json()) as SettingsRequestBody;
    } catch {
      return noStoreJson(
        { success: false, message: "The website text is invalid." },
        400,
      );
    }

    const { settings, errors } = validateSettings(body);

    if (errors.length > 0) {
      return noStoreJson(
        { success: false, message: errors[0], errors },
        400,
      );
    }

    await sanityServerClient.createOrReplace({
      _id: SETTINGS_ID,
      _type: "websiteContentSettings",
      ...settings,
    });

    revalidatePath("/", "layout");
    revalidatePath("/about");
    revalidatePath("/programmes");
    revalidatePath("/daycare");
    revalidatePath("/admissions");
    revalidatePath("/admin/website/content");

    return noStoreJson({
      success: true,
      message: "Admissions year, website text and hero timing have been published.",
      settings,
    });
  } catch (error) {
    logServerError("Unable to save website content settings.", error);
    return noStoreJson(
      {
        success: false,
        message: "Website text could not be saved. Please try again. If the problem continues, contact the Owner.",
      },
      500,
    );
  }
}
