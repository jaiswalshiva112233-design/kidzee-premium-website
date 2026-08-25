import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getMediaSlot } from "@/lib/admin/mediaSlots";
import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import { sanityServerClient } from "@/lib/sanity/serverClient";
import { logServerError, logServerWarning } from "@/lib/server/safeLogging";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE_BYTES = 12 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type SavedMediaSlot = {
  _id: string;
  slotKey: string;
  label: string;
  altText: string;
  imageUrl: string | null;
  updatedAt: string;
};

type StoredMediaDocument = {
  _id: string;
  assetId: string | null;
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
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function createDocumentId(slotKey: string) {
  return `websiteMediaSlot.${slotKey.replace(
    /[^a-zA-Z0-9_-]/g,
    "-",
  )}`;
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
            "You do not have permission to manage website photos.",
        },
        403,
      ),
    };
  }

  return {
    allowed: true as const,
  };
}

function refreshMediaPages(page: string) {
  const publicPathByPage: Record<string, string> = {
    Homepage: "/",
    About: "/about",
    Programmes: "/programmes",
    Daycare: "/daycare",
    Admissions: "/admissions",
    Contact: "/contact",
    Blog: "/blog",
  };

  revalidatePath(publicPathByPage[page] ?? "/");
  revalidatePath("/admin/media");
  revalidatePath("/admin/website");
  revalidatePath(
    `/admin/website/${page.toLowerCase()}`,
  );
}

async function removeUnusedAsset(assetId: string | null) {
  if (!assetId) {
    return;
  }

  try {
    const referenceCount =
      await sanityServerClient.fetch<number>(
        "count(*[references($assetId)])",
        {
          assetId,
        },
      );

    if (referenceCount === 0) {
      await sanityServerClient.delete(assetId);
    }
  } catch (error) {
    logServerWarning(
      "The unused website photo asset could not be removed.",
      error,
    );
  }
}

export async function GET() {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    const media = await sanityServerClient.fetch<
      SavedMediaSlot[]
    >(
      `*[_type == "websiteMediaSlot"] | order(updatedAt desc) {
        _id,
        slotKey,
        label,
        altText,
        "imageUrl": image.asset->url,
        updatedAt
      }`,
      {},
      {
        cache: "no-store",
      },
    );

    return noStoreJson({
      success: true,
      media,
    });
  } catch (error) {
    logServerError("Unable to load media.", error);

    return noStoreJson(
      {
        success: false,
        message: "Unable to load website photos.",
      },
      500,
    );
  }
}

export async function POST(request: Request) {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    if (!hasAllowedOrigin(request)) {
      return noStoreJson(
        {
          success: false,
          message: "This upload request was blocked for security.",
        },
        403,
      );
    }

    const formData = await request.formData();

    const slotKey = cleanText(
      formData.get("slotKey"),
      120,
    );
    const altTextValue = cleanText(
      formData.get("altText"),
      180,
    );
    const fileValue = formData.get("file");

    const slot = getMediaSlot(slotKey);

    if (!slot) {
      return noStoreJson(
        {
          success: false,
          message: "This website photo position is invalid.",
        },
        400,
      );
    }

    if (!(fileValue instanceof File)) {
      return noStoreJson(
        {
          success: false,
          message: "Please select a photograph.",
        },
        400,
      );
    }

    if (!ALLOWED_IMAGE_TYPES.has(fileValue.type)) {
      return noStoreJson(
        {
          success: false,
          message:
            "Please upload a JPG, PNG, WebP or AVIF image.",
        },
        400,
      );
    }

    if (fileValue.size === 0) {
      return noStoreJson(
        {
          success: false,
          message: "The selected photograph is empty.",
        },
        400,
      );
    }

    if (fileValue.size > MAX_IMAGE_SIZE_BYTES) {
      return noStoreJson(
        {
          success: false,
          message:
            "The photograph is too large. The maximum size is 12 MB.",
        },
        400,
      );
    }

    const altText = altTextValue || slot.label;
    const documentId = createDocumentId(slot.key);

    const existingDocument =
      await sanityServerClient.fetch<StoredMediaDocument | null>(
        `*[_id == $documentId][0] {
          _id,
          "assetId": image.asset->_id
        }`,
        {
          documentId,
        },
      );

    const uploadedAsset =
      await sanityServerClient.assets.upload(
        "image",
        Buffer.from(await fileValue.arrayBuffer()),
        {
          filename: cleanText(fileValue.name, 180) || "website-photo",
          contentType: fileValue.type,
        },
      );

    const updatedAt = new Date().toISOString();

    await sanityServerClient.createOrReplace({
      _id: documentId,
      _type: "websiteMediaSlot",
      slotKey: slot.key,
      page: slot.page,
      section: slot.section,
      label: slot.label,
      altText,
      fallbackPath: slot.fallbackPath,
      image: {
        _type: "image",
        asset: {
          _type: "reference",
          _ref: uploadedAsset._id,
        },
      },
      updatedAt,
    });

    refreshMediaPages(slot.page);

    if (
      existingDocument?.assetId &&
      existingDocument.assetId !== uploadedAsset._id
    ) {
      await removeUnusedAsset(existingDocument.assetId);
    }

    return noStoreJson({
      success: true,
      message: `${slot.label} has been updated.`,
      media: {
        _id: documentId,
        slotKey: slot.key,
        label: slot.label,
        altText,
        imageUrl: uploadedAsset.url,
        updatedAt,
      },
    });
  } catch (error) {
    logServerError("Unable to upload media.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "The photograph could not be uploaded. Check the server terminal.",
      },
      500,
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    if (!hasAllowedOrigin(request)) {
      return noStoreJson(
        {
          success: false,
          message: "This restore request was blocked for security.",
        },
        403,
      );
    }

    const body = (await request.json()) as {
      slotKey?: unknown;
    };

    const slotKey = cleanText(body.slotKey, 120);
    const slot = getMediaSlot(slotKey);

    if (!slot) {
      return noStoreJson(
        {
          success: false,
          message: "This website photo position is invalid.",
        },
        400,
      );
    }

    const documentId = createDocumentId(slot.key);

    const existingDocument =
      await sanityServerClient.fetch<StoredMediaDocument | null>(
        `*[_id == $documentId][0] {
          _id,
          "assetId": image.asset->_id
        }`,
        {
          documentId,
        },
      );

    if (existingDocument?._id) {
      await sanityServerClient.delete(existingDocument._id);
      await removeUnusedAsset(existingDocument.assetId);
    }

    refreshMediaPages(slot.page);

    return noStoreJson({
      success: true,
      message:
        `${slot.label} has been restored to the original website photo.`,
    });
  } catch (error) {
    logServerError("Unable to restore website photo.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "The original photograph could not be restored. Check the server terminal.",
      },
      500,
    );
  }
}
