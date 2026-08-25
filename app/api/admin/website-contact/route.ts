import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { sanityServerClient } from "@/lib/sanity/serverClient";
import { logServerError } from "@/lib/server/safeLogging";
import {
  defaultSiteContactSettings,
  type SiteContactSettings,
} from "@/lib/siteContact";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTINGS_ID = "website-contact-settings";

type ContactSettingsRequest = Partial<
  Record<keyof SiteContactSettings, unknown>
>;

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
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function cleanPhone(value: unknown) {
  const digits = cleanText(value, 40).replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 15
    ? `+${digits}`
    : "";
}

function cleanHttpsUrl(value: unknown) {
  const cleaned = cleanText(value, 600);

  if (!cleaned) {
    return "";
  }

  try {
    const url = new URL(cleaned);

    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function cleanTime(value: unknown) {
  const cleaned = cleanText(value, 5);

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(cleaned)
    ? cleaned
    : "";
}

function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set<string>([
    new URL(request.url).origin,
  ]);

  try {
    allowedOrigins.add(new URL(site.url).origin);
  } catch {
    // The current request origin remains allowed.
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
            "You do not have permission to change website contact settings.",
        },
        403,
      ),
    };
  }

  return {
    allowed: true as const,
  };
}

function validateSettings(body: ContactSettingsRequest) {
  const phone = cleanPhone(body.phone);
  const phoneDisplay = cleanText(body.phoneDisplay, 40);
  const email = cleanText(body.email, 180).toLowerCase();
  const address = cleanText(body.address, 260);
  const addressShort = cleanText(body.addressShort, 180);
  const map = cleanHttpsUrl(body.map);
  const mapEmbed = cleanHttpsUrl(body.mapEmbed);
  const googleReviews = cleanHttpsUrl(body.googleReviews);
  const instagram = cleanHttpsUrl(body.instagram);
  const facebook = cleanHttpsUrl(body.facebook);
  const youtube = cleanHttpsUrl(body.youtube);
  const preschoolDays = cleanText(body.preschoolDays, 80);
  const preschoolOpens = cleanTime(body.preschoolOpens);
  const preschoolCloses = cleanTime(body.preschoolCloses);
  const daycareDays = cleanText(body.daycareDays, 80);
  const daycareOpens = cleanTime(body.daycareOpens);
  const daycareCloses = cleanTime(body.daycareCloses);

  const errors: string[] = [];

  if (!phone) {
    errors.push("Enter a valid phone number with 10 to 15 digits.");
  }

  if (!phoneDisplay) {
    errors.push("Enter the phone number as parents should see it.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Enter a valid email address.");
  }

  if (!address || !addressShort) {
    errors.push("Enter both the full and short centre address.");
  }

  if (!map || !mapEmbed || !googleReviews) {
    errors.push(
      "Google Maps, embedded map and Google Reviews must use valid HTTPS links.",
    );
  }

  if (cleanText(body.instagram, 600) && !instagram) {
    errors.push("Instagram must use a valid HTTPS link.");
  }

  if (cleanText(body.facebook, 600) && !facebook) {
    errors.push("Facebook must use a valid HTTPS link.");
  }

  if (cleanText(body.youtube, 600) && !youtube) {
    errors.push("YouTube must use a valid HTTPS link.");
  }

  if (
    !preschoolDays ||
    !preschoolOpens ||
    !preschoolCloses ||
    !daycareDays ||
    !daycareOpens ||
    !daycareCloses
  ) {
    errors.push("Enter valid preschool and daycare days and timings.");
  }

  const settings: SiteContactSettings = {
    phone,
    phoneDisplay,
    email,
    address,
    addressShort,
    map,
    mapEmbed,
    googleReviews,
    instagram,
    facebook,
    youtube,
    preschoolDays,
    preschoolOpens,
    preschoolCloses,
    daycareDays,
    daycareOpens,
    daycareCloses,
  };

  return {
    settings,
    errors,
  };
}

function refreshWebsite() {
  [
    "/",
    "/about",
    "/programmes",
    "/daycare",
    "/admissions",
    "/gallery",
    "/contact",
    "/blog",
    "/privacy-policy",
    "/terms",
    "/admin/website/contact",
  ].forEach((path) => revalidatePath(path));
}

export async function GET() {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    const settings = await getWebsiteContactSettings();

    return noStoreJson({
      success: true,
      settings,
      defaults: defaultSiteContactSettings,
    });
  } catch (error) {
    logServerError(
      "Unable to load website contact settings.",
      error,
    );

    return noStoreJson(
      {
        success: false,
        message:
          "Website contact settings could not be loaded.",
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
          message: "This settings request was blocked for security.",
        },
        403,
      );
    }

    const body =
      (await request.json()) as ContactSettingsRequest;

    const { settings, errors } =
      validateSettings(body);

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

    const updatedAt = new Date().toISOString();

    await sanityServerClient.createOrReplace({
      _id: SETTINGS_ID,
      _type: "websiteContactSettings",
      ...settings,
      updatedAt,
    });

    refreshWebsite();

    return noStoreJson({
      success: true,
      message:
        "Website contact details and timings have been saved.",
      settings,
      updatedAt,
    });
  } catch (error) {
    logServerError(
      "Unable to save website contact settings.",
      error,
    );

    return noStoreJson(
      {
        success: false,
        message:
          "Website contact settings could not be saved. Check the server terminal.",
      },
      500,
    );
  }
}
