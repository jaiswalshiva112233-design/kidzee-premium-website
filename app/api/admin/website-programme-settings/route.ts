import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import {
  defaultProgrammeRatioSettings,
  getProgrammeRatioSettings,
} from "@/lib/sanity/programmeSettings";
import { sanityServerClient } from "@/lib/sanity/serverClient";
import { logServerError } from "@/lib/server/safeLogging";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SETTINGS_ID = "website-programme-ratio-settings";

type SettingsBody = {
  youngGroupChildrenPerTeacher?: unknown;
  kindergartenChildrenPerTeacher?: unknown;
};

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
    },
  });
}

function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set([new URL(request.url).origin]);

  try {
    allowedOrigins.add(new URL(site.url).origin);
  } catch {
    // The request origin is still checked when the configured URL is invalid.
  }

  return allowedOrigins.has(origin);
}

function parseRatio(value: unknown) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;

  return Number.isInteger(parsed) && parsed >= 2 && parsed <= 30
    ? parsed
    : null;
}

async function requireWebsiteManager() {
  if (!(await isAdminAuthenticated())) {
    return json(
      { success: false, message: "You are not authorised." },
      401,
    );
  }

  if (!(await hasAdminPermission("website.manage"))) {
    return json(
      {
        success: false,
        message:
          "You do not have permission to manage programme settings.",
      },
      403,
    );
  }

  return null;
}

export async function GET() {
  try {
    const denied = await requireWebsiteManager();

    if (denied) {
      return denied;
    }

    return json({
      success: true,
      settings: await getProgrammeRatioSettings(),
    });
  } catch (error) {
    logServerError("Unable to load programme ratio settings.", error);
    return json(
      {
        success: false,
        message:
          "Programme ratio settings could not be loaded. Check the server terminal.",
      },
      500,
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const denied = await requireWebsiteManager();

    if (denied) {
      return denied;
    }

    if (!hasAllowedOrigin(request)) {
      return json(
        { success: false, message: "This settings request is not allowed." },
        403,
      );
    }

    let body: SettingsBody;

    try {
      body = (await request.json()) as SettingsBody;
    } catch {
      return json(
        { success: false, message: "The programme settings are invalid." },
        400,
      );
    }

    const youngGroupChildrenPerTeacher = parseRatio(
      body.youngGroupChildrenPerTeacher,
    );
    const kindergartenChildrenPerTeacher = parseRatio(
      body.kindergartenChildrenPerTeacher,
    );

    if (
      youngGroupChildrenPerTeacher === null ||
      kindergartenChildrenPerTeacher === null
    ) {
      return json(
        {
          success: false,
          message:
            "Enter a whole number between 2 and 30 for both classroom ratios.",
        },
        400,
      );
    }

    const settings = {
      youngGroupChildrenPerTeacher,
      kindergartenChildrenPerTeacher,
    };

    await sanityServerClient.createOrReplace({
      _id: SETTINGS_ID,
      _type: "websiteProgrammeRatioSettings",
      ...settings,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath("/");
    revalidatePath("/programmes");
    revalidatePath("/programmes/playgroup");
    revalidatePath("/programmes/nursery");
    revalidatePath("/programmes/junior-kg");
    revalidatePath("/programmes/senior-kg");
    revalidatePath("/admin/website/programmes");

    return json({
      success: true,
      message: "Teacher-child ratios have been updated across the website.",
      settings,
    });
  } catch (error) {
    logServerError("Unable to save programme ratio settings.", error);
    return json(
      {
        success: false,
        message:
          "Programme ratio settings could not be saved. Check the server terminal.",
        defaults: defaultProgrammeRatioSettings,
      },
      500,
    );
  }
}
