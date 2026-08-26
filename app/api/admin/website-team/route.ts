import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  getCurrentAdminUser,
} from "@/lib/admin/auth";
import { storePublicGalleryImage } from "@/lib/media/storedFiles";
import { prisma } from "@/lib/prisma";
import { sanityServerClient } from "@/lib/sanity/serverClient";
import { logServerError, logServerWarning } from "@/lib/server/safeLogging";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE_BYTES = 12 * 1024 * 1024;
const MAX_TEAM_MEMBERS = 9;
const MAX_FEATURED_MEMBERS = 9;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

type AdminTeamMember = {
  _id: string;
  name: string;
  role: string;
  programme: string;
  qualification: string;
  experience: string;
  introduction: string;
  photoAlt: string;
  imageUrl: string | null;
  published: boolean;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type StoredTeamMember = AdminTeamMember & {
  assetId: string | null;
  storedFileId: string | null;
  consentConfirmedAt: string | null;
};

type TeamUpdateRequest = {
  action?: unknown;
  id?: unknown;
  value?: unknown;
  orderedIds?: unknown;
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

function cleanId(value: unknown) {
  const cleaned = cleanText(value, 200);

  return /^websiteTeamMember\.[A-Za-z0-9_-]{1,160}$/.test(cleaned)
    ? cleaned
    : "";
}

function cleanBoolean(value: unknown) {
  return value === true || value === "true" || value === "1";
}

function cleanSortOrder(value: unknown) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.min(999, Math.round(parsed)));
}

function cleanOrderedIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(value.map((item) => cleanId(item)).filter(Boolean)),
  );
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
  const session = await getCurrentAdminUser();

  if (!session) {
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

  if (
    session.role !== "OWNER" &&
    !session.permissions.includes("*") &&
    !session.permissions.includes("website.manage")
  ) {
    return {
      allowed: false as const,
      response: noStoreJson(
        {
          success: false,
          message:
            "You do not have permission to manage website team profiles.",
        },
        403,
      ),
    };
  }

  return {
    allowed: true as const,
    session,
  };
}

function refreshTeamPages() {
  revalidatePath("/");
  revalidatePath("/about");
  revalidatePath("/admin/website");
  revalidatePath("/admin/website/team");
}

async function getStoredMember(id: string) {
  return sanityServerClient.fetch<StoredTeamMember | null>(
    `*[
      _type == "websiteTeamMember" &&
      _id == $id
    ][0] {
      _id,
      name,
      role,
      programme,
      qualification,
      experience,
      introduction,
      photoAlt,
      "imageUrl": coalesce(externalImageUrl, photo.asset->url),
      "assetId": photo.asset->_id,
      storedFileId,
      consentConfirmedAt,
      published,
      featured,
      sortOrder,
      createdAt,
      updatedAt
    }`,
    { id },
  );
}

async function removeUnusedAsset(assetId: string | null) {
  if (!assetId) {
    return;
  }

  try {
    const referenceCount = await sanityServerClient.fetch<number>(
      "count(*[references($assetId)])",
      { assetId },
    );

    if (referenceCount === 0) {
      await sanityServerClient.delete(assetId);
    }
  } catch (error) {
    logServerWarning(
      "The unused team photograph could not be removed.",
      error,
    );
  }
}

function explainTeamError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message.replace(/\s+/g, " ").trim()
      : "";

  if (/permission|unauthori[sz]ed|forbidden|403/i.test(message)) {
    return "Sanity refused the change. Check that SANITY_API_WRITE_TOKEN has Editor permission.";
  }

  if (/token|credential|authentication|401/i.test(message)) {
    return "The Sanity write token is invalid or expired.";
  }

  if (/fetch failed|network|connect|timeout|econn/i.test(message)) {
    return "The server could not connect to Sanity. Check the internet connection and try again.";
  }

  return "The team change could not be saved. Check the server terminal.";
}

export async function GET() {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    const members = await sanityServerClient.fetch<AdminTeamMember[]>(
      `*[_type == "websiteTeamMember"] |
        order(sortOrder asc, createdAt asc) {
          _id,
          name,
          role,
          programme,
          qualification,
          experience,
          introduction,
          photoAlt,
          "imageUrl": coalesce(externalImageUrl, photo.asset->url),
          published,
          featured,
          sortOrder,
          createdAt,
          updatedAt
        }`,
      {},
      {
        cache: "no-store",
      },
    );

    return noStoreJson({
      success: true,
      members: members ?? [],
    });
  } catch (error) {
    logServerError("Unable to load website team profiles.", error);

    return noStoreJson(
      {
        success: false,
        message: "Unable to load website team profiles.",
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
          message: "This team update was blocked for security.",
        },
        403,
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return noStoreJson(
        {
          success: false,
          message:
            "The team form could not be read. Refresh the page and try again.",
        },
        400,
      );
    }

    const suppliedId = cleanText(formData.get("id"), 200);
    const id = suppliedId ? cleanId(suppliedId) : "";

    if (suppliedId && !id) {
      return noStoreJson(
        {
          success: false,
          message: "This teacher profile is invalid.",
        },
        400,
      );
    }

    const existing = id ? await getStoredMember(id) : null;

    if (id && !existing) {
      return noStoreJson(
        {
          success: false,
          message: "This teacher profile no longer exists.",
        },
        404,
      );
    }

    const name = cleanText(formData.get("name"), 80);
    const role = cleanText(formData.get("role"), 80);
    const programme = cleanText(formData.get("programme"), 80);
    const qualification = cleanText(formData.get("qualification"), 120);
    const experience = cleanText(formData.get("experience"), 80);
    const introduction = cleanText(
      formData.get("introduction"),
      260,
    );
    const photoAlt = cleanText(formData.get("photoAlt"), 180);
    const published = cleanBoolean(formData.get("published"));
    const featured = cleanBoolean(formData.get("featured"));
    const consentConfirmed = cleanBoolean(
      formData.get("consentConfirmed"),
    );
    const fileValue = formData.get("file");
    const file = fileValue instanceof File ? fileValue : null;

    if (name.length < 2) {
      return noStoreJson(
        {
          success: false,
          message: "Enter the teacher's full name.",
        },
        400,
      );
    }

    if (role.length < 2) {
      return noStoreJson(
        {
          success: false,
          message: "Enter the teacher's role or designation.",
        },
        400,
      );
    }

    if (published && introduction.length < 15) {
      return noStoreJson(
        {
          success: false,
          message:
            "Add one short, natural sentence before publishing this profile.",
        },
        400,
      );
    }

    if (file) {
      if (!consentConfirmed) {
        return noStoreJson(
          {
            success: false,
            message:
              "Confirm that the teacher has permitted the centre to use this photograph.",
          },
          400,
        );
      }

      if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
        return noStoreJson(
          {
            success: false,
            message: "Upload a JPG, PNG, WebP or AVIF photograph.",
          },
          400,
        );
      }

      if (file.size === 0) {
        return noStoreJson(
          {
            success: false,
            message: "The selected photograph is empty.",
          },
          400,
        );
      }

      if (file.size > MAX_IMAGE_SIZE_BYTES) {
        return noStoreJson(
          {
            success: false,
            message:
              "The photograph is too large. The maximum size is 12 MB.",
          },
          400,
        );
      }
    }

    const hasPhoto = Boolean(file || existing?.imageUrl);

    if (published && !hasPhoto) {
      return noStoreJson(
        {
          success: false,
          message: "Upload a portrait before publishing this profile.",
        },
        400,
      );
    }

    if (featured && published) {
      const otherFeaturedCount = await sanityServerClient.fetch<number>(
        `count(*[
          _type == "websiteTeamMember" &&
          _id != $id &&
          published == true &&
          featured == true
        ])`,
        { id: id || "" },
      );

      if (otherFeaturedCount >= MAX_FEATURED_MEMBERS) {
        return noStoreJson(
          {
            success: false,
            message:
              "Up to nine published profiles can be selected for the homepage. Unfeature one first.",
          },
          400,
        );
      }
    }

    if (!existing) {
      const profileCount = await sanityServerClient.fetch<number>(
        `count(*[_type == "websiteTeamMember"])`,
      );

      if (profileCount >= MAX_TEAM_MEMBERS) {
        return noStoreJson(
          {
            success: false,
            message:
              "The website team already has 9 profiles. Edit, hide or remove an existing profile before adding another.",
          },
          409,
        );
      }
    }

    const now = new Date().toISOString();
    const documentId = id || `websiteTeamMember.${randomUUID()}`;
    const storedPhoto = file
      ? await storePublicGalleryImage({
          bytes: new Uint8Array(await file.arrayBuffer()),
          fileName: cleanText(file.name, 180) || "teacher-portrait",
          mimeType: file.type,
          albumId: "team",
          uploadedById: access.session.userId,
          module: "WEBSITE_TEAM",
          linkedRecordType: "WebsiteTeamMember",
          linkedRecordId: documentId,
          pathPrefix: "public/website/team",
        })
      : null;
    const sortOrder = existing
      ? cleanSortOrder(formData.get("sortOrder"))
      : await sanityServerClient.fetch<number>(
          `count(*[_type == "websiteTeamMember"])`,
        );
    const assetId = storedPhoto ? null : existing?.assetId ?? null;
    const imageUrl = storedPhoto?.publicUrl ?? existing?.imageUrl ?? null;
    const finalPhotoAlt =
      photoAlt || `${name}, ${role} at Kidzee Sector 12 Dwarka`;

    const document = {
      _id: documentId,
      _type: "websiteTeamMember" as const,
      name,
      role,
      programme,
      qualification,
      experience,
      introduction,
      photoAlt: finalPhotoAlt,
      published,
      featured,
      sortOrder,
      consentConfirmed: file ? true : Boolean(existing),
      consentConfirmedAt: file
        ? now
        : existing?.consentConfirmedAt ?? null,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      externalImageUrl: storedPhoto?.publicUrl ?? (existing?.storedFileId ? existing.imageUrl : null),
      storedFileId: storedPhoto?.id ?? existing?.storedFileId ?? null,
      ...(assetId
        ? {
            photo: {
              _type: "image" as const,
              asset: {
                _type: "reference" as const,
                _ref: assetId,
              },
            },
          }
        : {}),
    };

    await sanityServerClient.createOrReplace(document);
    refreshTeamPages();

    if (storedPhoto && existing?.assetId) {
      await removeUnusedAsset(existing.assetId);
    }

    if (storedPhoto && existing?.storedFileId) {
      await prisma.storedFile.updateMany({
        where: { id: existing.storedFileId, status: { not: "DELETED" } },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
    }
    if (storedPhoto) {
      await prisma.activityLog.create({
        data: {
          adminUserId: access.session.userId,
          action: "CREATED",
          entityType: "WebsiteTeamMedia",
          entityId: storedPhoto.id,
          description: `Optimised public team portrait saved for ${name}.`,
          newData: {
            teamMemberId: documentId,
            originalSize: file?.size,
            optimizedSize: storedPhoto.optimizedSize,
            thumbnailSize: storedPhoto.thumbnailSize,
          },
        },
      });
    }

    return noStoreJson({
      success: true,
      message: published
        ? `${name} is now visible on the website.`
        : `${name} has been saved as a hidden profile.`,
      member: {
        _id: documentId,
        name,
        role,
        programme,
        qualification,
        experience,
        introduction,
        photoAlt: finalPhotoAlt,
        imageUrl,
        published,
        featured,
        sortOrder,
        createdAt: existing?.createdAt || now,
        updatedAt: now,
      } satisfies AdminTeamMember,
    });
  } catch (error) {
    logServerError("Unable to save website team profile.", error);

    return noStoreJson(
      {
        success: false,
        message: explainTeamError(error),
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
          message: "This team update was blocked for security.",
        },
        403,
      );
    }

    let body: TeamUpdateRequest;

    try {
      body = (await request.json()) as TeamUpdateRequest;
    } catch {
      return noStoreJson(
        {
          success: false,
          message: "The team update is invalid.",
        },
        400,
      );
    }

    const action = cleanText(body.action, 40);
    const now = new Date().toISOString();

    if (action === "reorderMembers") {
      const orderedIds = cleanOrderedIds(body.orderedIds);

      if (orderedIds.length === 0) {
        return noStoreJson(
          {
            success: false,
            message: "There are no team profiles to reorder.",
          },
          400,
        );
      }

      const validIds = await sanityServerClient.fetch<string[]>(
        `*[
          _type == "websiteTeamMember" &&
          _id in $orderedIds
        ]._id`,
        { orderedIds },
      );

      if (validIds.length !== orderedIds.length) {
        return noStoreJson(
          {
            success: false,
            message:
              "One or more teacher profiles could not be found. Refresh and try again.",
          },
          400,
        );
      }

      let transaction = sanityServerClient.transaction();

      orderedIds.forEach((memberId, index) => {
        transaction = transaction.patch(memberId, {
          set: {
            sortOrder: index,
            updatedAt: now,
          },
        });
      });

      await transaction.commit();
      refreshTeamPages();

      return noStoreJson({
        success: true,
        message: "The website team order has been updated.",
      });
    }

    const id = cleanId(body.id);
    const existing = id ? await getStoredMember(id) : null;

    if (!existing) {
      return noStoreJson(
        {
          success: false,
          message: "This teacher profile no longer exists.",
        },
        404,
      );
    }

    if (action === "setPublished") {
      const published = cleanBoolean(body.value);

      if (published && !existing.imageUrl) {
        return noStoreJson(
          {
            success: false,
            message: "Upload a portrait before publishing this profile.",
          },
          400,
        );
      }

      if (published && existing.introduction.length < 15) {
        return noStoreJson(
          {
            success: false,
            message:
              "Add one short introduction before publishing this profile.",
          },
          400,
        );
      }

      if (published && existing.featured) {
        const otherFeaturedCount = await sanityServerClient.fetch<number>(
          `count(*[
            _type == "websiteTeamMember" &&
            _id != $id &&
            published == true &&
            featured == true
          ])`,
          { id },
        );

        if (otherFeaturedCount >= MAX_FEATURED_MEMBERS) {
          return noStoreJson(
            {
              success: false,
              message:
                "Up to nine published profiles can be selected for the homepage.",
            },
            400,
          );
        }
      }

      await sanityServerClient
        .patch(id)
        .set({ published, updatedAt: now })
        .commit();
      refreshTeamPages();

      return noStoreJson({
        success: true,
        message: published
          ? `${existing.name} is now visible on the website.`
          : `${existing.name} is hidden from the website.`,
      });
    }

    if (action === "setFeatured") {
      const featured = cleanBoolean(body.value);

      if (featured && !existing.published) {
        return noStoreJson(
          {
            success: false,
            message:
              "Publish this profile before featuring it on the homepage.",
          },
          400,
        );
      }

      if (featured) {
        const otherFeaturedCount = await sanityServerClient.fetch<number>(
          `count(*[
            _type == "websiteTeamMember" &&
            _id != $id &&
            published == true &&
            featured == true
          ])`,
          { id },
        );

        if (otherFeaturedCount >= MAX_FEATURED_MEMBERS) {
          return noStoreJson(
            {
              success: false,
              message:
                "Up to nine published profiles can be selected for the homepage. Unfeature one first.",
            },
            400,
          );
        }
      }

      await sanityServerClient
        .patch(id)
        .set({ featured, updatedAt: now })
        .commit();
      refreshTeamPages();

      return noStoreJson({
        success: true,
        message: featured
          ? `${existing.name} is featured on the homepage.`
          : `${existing.name} was removed from the homepage preview.`,
      });
    }

    return noStoreJson(
      {
        success: false,
        message: "This team update is not supported.",
      },
      400,
    );
  } catch (error) {
    logServerError("Unable to update website team profile.", error);

    return noStoreJson(
      {
        success: false,
        message: explainTeamError(error),
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
          message: "This removal request was blocked for security.",
        },
        403,
      );
    }

    const id = cleanId(new URL(request.url).searchParams.get("id"));
    const existing = id ? await getStoredMember(id) : null;

    if (!existing) {
      return noStoreJson(
        {
          success: false,
          message: "This teacher profile no longer exists.",
        },
        404,
      );
    }

    await sanityServerClient.delete(id);
    await removeUnusedAsset(existing.assetId);
    if (existing.storedFileId) {
      await prisma.storedFile.updateMany({
        where: { id: existing.storedFileId, status: { not: "DELETED" } },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
    }
    await prisma.activityLog.create({
      data: {
        adminUserId: access.session.userId,
        action: "ARCHIVED",
        entityType: "WebsiteTeamMember",
        entityId: id,
        description: `${existing.name} removed from the public team; external portrait retained in the archive index.`,
        previousData: { storedFileId: existing.storedFileId },
      },
    });
    refreshTeamPages();

    return noStoreJson({
      success: true,
      message: `${existing.name} has been removed from the website team.`,
    });
  } catch (error) {
    logServerError("Unable to remove website team profile.", error);

    return noStoreJson(
      {
        success: false,
        message: explainTeamError(error),
      },
      500,
    );
  }
}
