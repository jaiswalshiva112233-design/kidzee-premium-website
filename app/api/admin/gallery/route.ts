import { createHash } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  getCurrentAdminUser,
} from "@/lib/admin/auth";
import { persistExternalEmbedRecord } from "@/lib/media/embed-persistence";
import {
  InstagramShareResolutionError,
  resolveInstagramEmbedUrl,
} from "@/lib/media/instagram-embed";
import { processPublicImage } from "@/lib/media/imageProcessing";
import { getMediaSafetySetting } from "@/lib/media/mediaSafety";
import { storePublicGalleryImage } from "@/lib/media/storedFiles";
import { prisma } from "@/lib/prisma";
import { sanityServerClient } from "@/lib/sanity/serverClient";
import { logServerError, logServerWarning } from "@/lib/server/safeLogging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_SIZE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_SIZE_BYTES = 80 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const ALLOWED_VIDEO_TYPES = new Set([
  "video/mp4",
  "video/webm",
]);

const ALBUM_CATEGORIES = [
  "CELEBRATION",
  "FESTIVAL",
  "CLASSROOM",
  "CREATIVE_LEARNING",
  "SPORTS_AND_MOVEMENT",
  "TRIP_AND_EVENT",
  "CENTRE_FACILITIES",
  "PARENT_STORIES",
  "OTHER",
] as const;

const PROGRAMMES = [
  "PLAYGROUP",
  "NURSERY",
  "JUNIOR_KG",
  "SENIOR_KG",
  "DAYCARE",
] as const;

type AlbumCategory = (typeof ALBUM_CATEGORIES)[number];
type Programme = (typeof PROGRAMMES)[number];
type MediaType = "PHOTO" | "VIDEO";
type EmbedProvider = "INSTAGRAM" | "YOUTUBE" | null;

type GalleryAlbumDocument = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: AlbumCategory;
  programmes: Programme[];
  eventDate: string | null;
  published: boolean;
  featured: boolean;
  coverMediaId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

type GalleryMediaDocument = {
  _id: string;
  albumId: string;
  mediaType: MediaType;
  caption: string;
  altText: string;
  published: boolean;
  sortOrder: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  videoUrl: string | null;
  embedUrl: string | null;
  embedProvider: EmbedProvider;
  storedFileId: string | null;
  createdAt: string;
  updatedAt: string;
};

type GalleryQueryResult = {
  albums: GalleryAlbumDocument[];
  media: GalleryMediaDocument[];
};

type UpdateRequest = {
  action?: unknown;
  albumId?: unknown;
  mediaId?: unknown;
  title?: unknown;
  description?: unknown;
  category?: unknown;
  programmes?: unknown;
  eventDate?: unknown;
  published?: unknown;
  featured?: unknown;
  coverMediaId?: unknown;
  caption?: unknown;
  altText?: unknown;
  orderedIds?: unknown;
  embedUrl?: unknown;
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

function explainGallerySaveError(error: unknown) {
  const rawMessage =
    error instanceof Error ? error.message : String(error ?? "");
  const message = rawMessage.replace(/\s+/g, " ").trim();

  if (/permission|unauthori[sz]ed|forbidden|403/i.test(message)) {
    return "Website media service is not configured correctly. Please contact the Owner.";
  }

  if (/token|credential|authentication|401/i.test(message)) {
    return "Website media service is not configured correctly. Please contact the Owner.";
  }

  if (/dataset/i.test(message) && /not found|does not exist|invalid/i.test(message)) {
    return "Website media service is not configured correctly. Please contact the Owner.";
  }

  if (/fetch failed|network|connect|timeout|econn/i.test(message)) {
    return "The server could not connect to Sanity. Check the internet connection and try again.";
  }

  return "The gallery change could not be saved. Please try again or check the server connection.";
}

async function removeUnusedSanityAsset(assetId: string | null) {
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
      "The unused gallery asset could not be removed.",
      error,
    );
  }
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

  return /^[A-Za-z0-9._-]{1,200}$/.test(cleaned)
    ? cleaned
    : "";
}

function cleanBoolean(value: unknown) {
  return value === true || value === "true" || value === "1";
}

function cleanCategory(value: unknown): AlbumCategory {
  const cleaned = cleanText(value, 80).toUpperCase();

  return ALBUM_CATEGORIES.includes(cleaned as AlbumCategory)
    ? (cleaned as AlbumCategory)
    : "OTHER";
}

function cleanProgrammes(value: unknown): Programme[] {
  let rawValues: unknown[] = [];

  if (Array.isArray(value)) {
    rawValues = value;
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      rawValues = Array.isArray(parsed) ? parsed : value.split(",");
    } catch {
      rawValues = value.split(",");
    }
  }

  return Array.from(
    new Set(
      rawValues
        .map((item) => cleanText(item, 40).toUpperCase())
        .filter((item): item is Programme =>
          PROGRAMMES.includes(item as Programme),
        ),
    ),
  );
}

function cleanDate(value: unknown) {
  const cleaned = cleanText(value, 20);

  if (!cleaned) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return null;
  }

  const parsed = new Date(`${cleaned}T00:00:00.000Z`);

  return Number.isNaN(parsed.getTime()) ? null : cleaned;
}

function createSlug(value: string) {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "gallery-album";
}

function cleanOrderedIds(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(
      value
        .map((item) => cleanId(item))
        .filter(Boolean),
    ),
  );
}

async function parseEmbedUrl(value: unknown) {
  const raw = cleanText(value, 500);
  if (!raw) return null;
  const instagram = await resolveInstagramEmbedUrl(raw);
  if (instagram) return instagram;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (host === "youtu.be" || host === "youtube.com" || host === "m.youtube.com") {
    const id = host === "youtu.be"
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")
        ? url.pathname.split("/").filter(Boolean)[1]
        : url.searchParams.get("v");
    if (!id || !/^[A-Za-z0-9_-]{6,20}$/.test(id)) return null;
    return {
      provider: "YOUTUBE" as const,
      publicUrl: `https://www.youtube.com/watch?v=${id}`,
      embedUrl: `https://www.youtube-nocookie.com/embed/${id}?rel=0`,
      duplicateKey: `youtube:${id}`,
    };
  }
  return null;
}

function stableEmbedIds(albumId: string, duplicateKey: string) {
  const digest = createHash("sha256")
    .update(`${albumId}:${duplicateKey}`)
    .digest("hex")
    .slice(0, 40);
  return {
    mediaId: `galleryEmbed.${digest}`,
    storedFileId: `gallery_embed_${digest}`,
    activityId: `gallery_embed_activity_${digest}`,
  };
}

function isUniqueConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    String((error as { code?: unknown }).code) === "P2002"
  );
}

function refreshGalleryPages() {
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/gallery/[slug]", "page");
  revalidatePath("/admin/website/gallery");
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

  const allowed =
    session.role === "OWNER" ||
    session.permissions.includes("*") ||
    session.permissions.includes("website.manage");

  if (!allowed) {
    return {
      allowed: false as const,
      response: noStoreJson(
        {
          success: false,
          message:
            "You do not have permission to manage the website gallery.",
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

async function loadGallery() {
  const result = await sanityServerClient.fetch<GalleryQueryResult>(
    `{
      "albums": *[_type == "websiteGalleryAlbum"] | order(sortOrder asc, eventDate desc, createdAt desc) {
        _id,
        title,
        "slug": slug.current,
        description,
        category,
        programmes,
        eventDate,
        published,
        featured,
        coverMediaId,
        sortOrder,
        createdAt,
        updatedAt
      },
      "media": *[_type == "websiteGalleryMedia"] | order(albumId asc, sortOrder asc, createdAt desc) {
        _id,
        albumId,
        mediaType,
        caption,
        altText,
        published,
        sortOrder,
        fileName,
        mimeType,
        fileSize,
        storedFileId,
        embedUrl,
        embedProvider,
        "imageUrl": coalesce(externalImageUrl, image.asset->url),
        "thumbnailUrl": coalesce(externalThumbnailUrl, externalImageUrl, image.asset->url),
        "videoUrl": video.asset->url,
        createdAt,
        updatedAt
      }
    }`,
  );

  const mediaByAlbum = new Map<string, GalleryMediaDocument[]>();

  for (const item of result.media ?? []) {
    const albumMedia = mediaByAlbum.get(item.albumId) ?? [];
    albumMedia.push(item);
    mediaByAlbum.set(item.albumId, albumMedia);
  }

  return (result.albums ?? []).map((album) => ({
    ...album,
    media: mediaByAlbum.get(album._id) ?? [],
  }));
}

async function createUniqueSlug(title: string, excludedId = "") {
  const baseSlug = createSlug(title);
  let candidate = baseSlug;
  let suffix = 2;

  while (
    await sanityServerClient.fetch<boolean>(
      `count(*[
        _type == "websiteGalleryAlbum" &&
        slug.current == $slug &&
        _id != $excludedId
      ]) > 0`,
      {
        slug: candidate,
        excludedId,
      },
    )
  ) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function GET() {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    const [albums, mediaSafety] = await Promise.all([
      loadGallery(),
      getMediaSafetySetting(),
    ]);

    return noStoreJson({
      success: true,
      albums,
      limits: {
        imageMegabytes: MAX_IMAGE_SIZE_BYTES / 1024 / 1024,
        videoMegabytes: mediaSafety.directVideoUploadEnabled
          ? MAX_VIDEO_SIZE_BYTES / 1024 / 1024
          : 0,
      },
      mediaSafety: {
        directVideoUploadEnabled: mediaSafety.directVideoUploadEnabled,
        externalEmbedsEnabled: mediaSafety.externalEmbedsEnabled,
        originalArchiveEnabled: mediaSafety.originalArchiveEnabled,
        compressionEnabled: mediaSafety.compressionEnabled,
      },
    });
  } catch (error) {
    logServerError("Unable to load the website gallery.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "The website gallery could not be loaded. Please try again. If the problem continues, contact the Owner.",
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

    const contentType = request.headers.get("content-type") ?? "";
    const binaryAction = cleanText(
      request.headers.get("x-gallery-action"),
      50,
    );
    let postData: { get(name: string): unknown };

    if (
      binaryAction === "uploadMedia" ||
      binaryAction === "uploadVideoThumbnail"
    ) {
      postData = {
        get(name: string) {
          if (name === "action") return binaryAction;
          if (name === "albumId") {
            return request.headers.get("x-gallery-album-id");
          }
          if (name === "mediaId") {
            return request.headers.get("x-gallery-media-id");
          }
          if (name === "consentConfirmed") {
            return request.headers.get("x-gallery-consent");
          }
          return null;
        },
      };
    } else if (contentType.includes("application/json")) {
      const body = (await request.json()) as Record<string, unknown>;
      postData = {
        get(name: string) {
          return body[name] ?? null;
        },
      };
    } else {
      postData = await request.formData();
    }

    const action = cleanText(postData.get("action"), 50);

    if (action === "createAlbum") {
      const title = cleanText(postData.get("title"), 100);

      if (title.length < 2) {
        return noStoreJson(
          {
            success: false,
            message: "Please enter an album title.",
          },
          400,
        );
      }

      const existingCount = await sanityServerClient.fetch<number>(
        `count(*[_type == "websiteGalleryAlbum"])`,
      );

      const now = new Date().toISOString();
      const slug = await createUniqueSlug(title);

      const album = await sanityServerClient.create({
        _type: "websiteGalleryAlbum",
        title,
        slug: {
          _type: "slug",
          current: slug,
        },
        description: cleanText(postData.get("description"), 700),
        category: cleanCategory(postData.get("category")),
        programmes: cleanProgrammes(postData.get("programmes")),
        eventDate: cleanDate(postData.get("eventDate")),
        published: false,
        featured: false,
        coverMediaId: null,
        sortOrder: existingCount,
        createdAt: now,
        updatedAt: now,
      });

      refreshGalleryPages();

      return noStoreJson({
        success: true,
        message:
          "The album has been created as a draft. Add approved media before publishing it.",
        albumId: album._id,
      });
    }

    if (action === "uploadVideoThumbnail") {
      const albumId = cleanId(postData.get("albumId"));
      const mediaId = cleanId(postData.get("mediaId"));

      if (!albumId || !mediaId || binaryAction !== "uploadVideoThumbnail") {
        return noStoreJson(
          {
            success: false,
            message: "Choose the review video and its thumbnail image again.",
          },
          400,
        );
      }

      const existingMedia = await sanityServerClient.fetch<{
        _id: string;
        albumId: string;
        mediaType: MediaType;
      } | null>(
        `*[
          _type == "websiteGalleryMedia" &&
          _id == $mediaId
        ][0]{ _id, albumId, mediaType }`,
        {
          mediaId,
        },
      );

      if (
        !existingMedia ||
        existingMedia.albumId !== albumId ||
        existingMedia.mediaType !== "VIDEO"
      ) {
        return noStoreJson(
          {
            success: false,
            message: "That review video could not be found in this album.",
          },
          404,
        );
      }

      const thumbnailMimeType = contentType
        .split(";")[0]
        .trim()
        .toLowerCase();

      if (!ALLOWED_IMAGE_TYPES.has(thumbnailMimeType)) {
        return noStoreJson(
          {
            success: false,
            message: "Choose a JPG, PNG, WebP or AVIF image for the video thumbnail.",
          },
          400,
        );
      }

      const thumbnailBytes = Buffer.from(await request.arrayBuffer());

      if (thumbnailBytes.byteLength === 0) {
        return noStoreJson(
          {
            success: false,
            message: "The selected thumbnail image is empty.",
          },
          400,
        );
      }

      if (thumbnailBytes.byteLength > MAX_IMAGE_SIZE_BYTES) {
        return noStoreJson(
          {
            success: false,
            message: "The thumbnail image is too large. The maximum size is 12 MB.",
          },
          400,
        );
      }

      const encodedFileName = request.headers.get("x-gallery-filename") ?? "";
      let thumbnailFileName = encodedFileName;

      try {
        thumbnailFileName = decodeURIComponent(encodedFileName);
      } catch {
        // A readable fallback filename is used below when a browser sends an invalid header.
      }

      thumbnailFileName =
        cleanText(thumbnailFileName, 220) || "review-video-thumbnail";

      const storedThumbnail = await storePublicGalleryImage({
        bytes: thumbnailBytes,
        fileName: thumbnailFileName,
        mimeType: thumbnailMimeType,
        albumId,
        uploadedById: access.session.userId,
      });
      const thumbnailMetadata = storedThumbnail.metadata as {
        thumbnailUrl?: string;
      } | null;
      const now = new Date().toISOString();

      await sanityServerClient
        .patch(mediaId)
        .set({
          externalImageUrl: storedThumbnail.publicUrl,
          externalThumbnailUrl:
            thumbnailMetadata?.thumbnailUrl ?? storedThumbnail.publicUrl,
          thumbnailStoredFileId: storedThumbnail.id,
          updatedAt: now,
        })
        .commit();

      await prisma.storedFile.update({
        where: { id: storedThumbnail.id },
        data: {
          linkedRecordType: "WebsiteGalleryMediaThumbnail",
          linkedRecordId: mediaId,
        },
      });

      const currentCover = await sanityServerClient.fetch<string | null>(
        `*[
          _type == "websiteGalleryAlbum" &&
          _id == $albumId
        ][0].coverMediaId`,
        {
          albumId,
        },
      );

      if (!currentCover) {
        await sanityServerClient
          .patch(albumId)
          .set({
            coverMediaId: mediaId,
            updatedAt: now,
          })
          .commit();
      }

      refreshGalleryPages();

      return noStoreJson({
        success: true,
        message: currentCover
          ? "The video thumbnail has been saved. You can now set this video as the album cover."
          : "The video thumbnail has been saved and set as this album's cover.",
        mediaId,
      });
    }

    if (action === "createEmbed") {
      const albumId = cleanId(postData.get("albumId"));
      let parsedEmbed: Awaited<ReturnType<typeof parseEmbedUrl>>;
      try {
        parsedEmbed = await parseEmbedUrl(postData.get("embedUrl"));
      } catch (error) {
        if (error instanceof InstagramShareResolutionError) {
          const message =
            error.code === "TIMEOUT"
              ? "Instagram took too long to open that share link. Please try again, or paste the Reel's full browser URL."
              : error.code === "UNSAFE_REDIRECT"
                ? "That link left Instagram and was blocked for safety. Please copy the Reel link again from Instagram."
                : "CentreOS could not resolve that Instagram share link. Open the Reel, tap Share → Copy link, and try once more.";
          return noStoreJson({ success: false, message }, 422);
        }
        throw error;
      }
      const consentConfirmed = cleanBoolean(postData.get("consentConfirmed"));
      const settings = await getMediaSafetySetting();

      if (!settings.externalEmbedsEnabled) {
        return noStoreJson(
          { success: false, message: "Instagram and YouTube embeds are disabled in Storage & Media Health." },
          409,
        );
      }
      if (!albumId) {
        return noStoreJson(
          { success: false, message: "Choose a gallery album first." },
          400,
        );
      }
      if (!parsedEmbed) {
        return noStoreJson(
          {
            success: false,
            message:
              "Please paste a complete Instagram Reel link. In Instagram, open the Reel, tap Share → Copy link, then paste it here.",
          },
          400,
        );
      }
      if (!consentConfirmed) {
        return noStoreJson(
          { success: false, message: "Confirm that the centre has permission to publish this reel." },
          400,
        );
      }
      const albumExists = await sanityServerClient.fetch<boolean>(
        `defined(*[_type == "websiteGalleryAlbum" && _id == $albumId][0]._id)`,
        { albumId },
      );
      if (!albumExists) {
        return noStoreJson({ success: false, message: "This gallery album no longer exists." }, 404);
      }
      const duplicateUrls =
        parsedEmbed.provider === "INSTAGRAM"
          ? [
              `https://www.instagram.com/reel/${parsedEmbed.shortcode}/`,
              `https://www.instagram.com/p/${parsedEmbed.shortcode}/`,
            ]
          : [parsedEmbed.publicUrl];
      const stableIds = stableEmbedIds(albumId, parsedEmbed.duplicateKey);
      const existingMedia = await sanityServerClient.fetch<{
        _id: string;
        storedFileId: string | null;
      } | null>(
        `*[
          _type == "websiteGalleryMedia" &&
          albumId == $albumId &&
          (_id == $mediaId || embedUrl in $duplicateUrls)
        ][0]{ _id, storedFileId }`,
        { albumId, mediaId: stableIds.mediaId, duplicateUrls },
      );
      const existingInventory = existingMedia?.storedFileId
        ? await prisma.storedFile.findUnique({
            where: { id: existingMedia.storedFileId },
            select: { id: true },
          })
        : null;
      if (existingMedia && existingInventory) {
        return noStoreJson(
          {
            success: false,
            message: "This reel is already in the selected album.",
          },
          409,
        );
      }
      const albumMediaCount = await sanityServerClient.fetch<number>(
        `count(*[_type == "websiteGalleryMedia" && albumId == $albumId])`,
        { albumId },
      );
      const now = new Date().toISOString();
      const caption = cleanText(postData.get("caption"), 300);
      const altText = cleanText(postData.get("altText"), 180);
      const mediaId = existingMedia?._id ?? stableIds.mediaId;
      const storedFileId = existingMedia?.storedFileId ?? stableIds.storedFileId;
      await persistExternalEmbedRecord({
        findStoredFile: () =>
          prisma.storedFile.findUnique({
            where: { id: storedFileId },
          }),
        createStoredFile: () =>
          prisma.storedFile.create({
            data: {
              id: storedFileId,
              provider: "EXTERNAL_EMBED",
              publicUrl: parsedEmbed.publicUrl,
              visibility: "PUBLIC",
              module: "WEBSITE_GALLERY",
              linkedRecordType: "WebsiteGalleryMedia",
              linkedRecordId: mediaId,
              originalName: `${parsedEmbed.provider.toLowerCase()}-embed`,
              mimeType: "text/uri-list",
              originalSize: 0,
              optimizedSize: 0,
              status: "READY",
              uploadedById: access.session.userId,
              metadata: {
                provider: parsedEmbed.provider,
                playerUrl: parsedEmbed.embedUrl,
                duplicateKey: parsedEmbed.duplicateKey,
              },
            },
          }),
        recoverStoredFile: () =>
          prisma.storedFile.findUnique({
            where: { id: storedFileId },
          }),
        isUniqueConflict,
        persistMedia: async (persistedStoredFile) => {
          const mediaDocument = {
            _id: mediaId,
            _type: "websiteGalleryMedia",
            albumId,
            mediaType: "VIDEO",
            mediaSource: "EXTERNAL_EMBED",
            embedProvider: parsedEmbed.provider,
            embedUrl: parsedEmbed.publicUrl,
            embedPlayerUrl: parsedEmbed.embedUrl,
            caption,
            altText:
              altText ||
              caption ||
              `${parsedEmbed.provider === "INSTAGRAM" ? "Instagram Reel" : "YouTube video"} from Kidzee Sector 12 Dwarka`,
            published: false,
            sortOrder: albumMediaCount,
            consentConfirmed: true,
            consentConfirmedAt: now,
            fileName: `${parsedEmbed.provider.toLowerCase()}-embed`,
            mimeType: "text/uri-list",
            fileSize: 0,
            storedFileId: persistedStoredFile.id,
            createdAt: now,
            updatedAt: now,
          };
          if (existingMedia) {
            await sanityServerClient.patch(mediaId).set(mediaDocument).commit();
          } else {
            await sanityServerClient.createIfNotExists(mediaDocument);
          }
        },
        compensateStoredFile: async () => {
          try {
            const linkedStoredFileId = await sanityServerClient.fetch<
              string | null
            >(`*[_id == $mediaId][0].storedFileId`, { mediaId });
            if (linkedStoredFileId !== storedFileId) {
              await prisma.storedFile.deleteMany({
                where: { id: storedFileId },
              });
            }
          } catch (cleanupError) {
            logServerError(
              "Gallery embed compensation needs a retry.",
              cleanupError,
            );
          }
        },
      });

      try {
        await prisma.activityLog.upsert({
          where: { id: stableIds.activityId },
          update: {},
          create: {
            id: stableIds.activityId,
            adminUserId: access.session.userId,
            action: "CREATED",
            entityType: "WebsiteGalleryMedia",
            entityId: mediaId,
            description: `${parsedEmbed.provider} gallery reel added as a draft.`,
            newData: {
              albumId,
              provider: parsedEmbed.provider,
              storedFileId,
            },
          },
        });
      } catch (activityError) {
        logServerError(
          "Gallery embed saved but its activity entry needs a retry.",
          activityError,
        );
      }
      refreshGalleryPages();
      return noStoreJson({
        success: true,
        message: "The reel has been added as a draft. Add a thumbnail, caption and publish it when ready.",
        mediaId,
      });
    }

    if (action === "uploadMedia") {
      const albumId = cleanId(postData.get("albumId"));
      const consentConfirmed = cleanBoolean(
        postData.get("consentConfirmed"),
      );

      if (!albumId) {
        return noStoreJson(
          {
            success: false,
            message: "Please select an album.",
          },
          400,
        );
      }

      const albumExists = await sanityServerClient.fetch<boolean>(
        `defined(*[_type == "websiteGalleryAlbum" && _id == $albumId][0]._id)`,
        {
          albumId,
        },
      );

      if (!albumExists) {
        return noStoreJson(
          {
            success: false,
            message: "This gallery album no longer exists.",
          },
          404,
        );
      }

      if (!consentConfirmed) {
        return noStoreJson(
          {
            success: false,
            message:
              "Confirm that the centre has permission to use this media before uploading it.",
          },
          400,
        );
      }

      let fileName = "";
      let fileMimeType = "";
      let fileBytes: Buffer;

      if (binaryAction === "uploadMedia") {
        const encodedFileName =
          request.headers.get("x-gallery-filename") ?? "";

        try {
          fileName = decodeURIComponent(encodedFileName);
        } catch {
          fileName = encodedFileName;
        }

        fileMimeType = contentType.split(";")[0].trim().toLowerCase();
        fileBytes = Buffer.from(await request.arrayBuffer());
      } else {
        const fileValue = postData.get("file");

        if (!(fileValue instanceof File)) {
          return noStoreJson(
            {
              success: false,
              message: "Please select a photograph or short video.",
            },
            400,
          );
        }

        fileName = fileValue.name;
        fileMimeType = fileValue.type;
        fileBytes = Buffer.from(await fileValue.arrayBuffer());
      }

      fileName = cleanText(fileName, 220) || "gallery-upload";

      if (fileBytes.byteLength === 0) {
        return noStoreJson(
          {
            success: false,
            message: "The selected file is empty.",
          },
          400,
        );
      }

      const mediaType: MediaType | null = ALLOWED_IMAGE_TYPES.has(
        fileMimeType,
      )
        ? "PHOTO"
        : ALLOWED_VIDEO_TYPES.has(fileMimeType)
          ? "VIDEO"
          : null;

      if (!mediaType) {
        return noStoreJson(
          {
            success: false,
            message:
              "Upload a JPG, PNG, WebP or AVIF photograph, or an MP4 or WebM video.",
          },
          400,
        );
      }

      const mediaSafety = await getMediaSafetySetting();
      if (mediaType === "VIDEO" && !mediaSafety.directVideoUploadEnabled) {
        return noStoreJson(
          {
            success: false,
            message: "Direct video upload is off for the trial launch. Add an Instagram Reel or YouTube URL instead.",
          },
          409,
        );
      }

      const maximumSize =
        mediaType === "PHOTO"
          ? MAX_IMAGE_SIZE_BYTES
          : MAX_VIDEO_SIZE_BYTES;

      if (fileBytes.byteLength > maximumSize) {
        return noStoreJson(
          {
            success: false,
            message:
              mediaType === "PHOTO"
                ? "The photograph is too large. The maximum size is 12 MB."
                : "The video is too large. Keep short reels below 80 MB.",
          },
          400,
        );
      }

      const albumMediaCount = await sanityServerClient.fetch<number>(
        `count(*[
          _type == "websiteGalleryMedia" &&
          albumId == $albumId
        ])`,
        {
          albumId,
        },
      );

      const now = new Date().toISOString();
      const caption = cleanText(postData.get("caption"), 300);
      const altText = cleanText(postData.get("altText"), 180);

      const processedPhoto = mediaType === "PHOTO"
        ? await processPublicImage(fileBytes)
        : null;
      const uploadedPhotoAsset = processedPhoto
        ? await sanityServerClient.assets.upload("image", processedPhoto.web, {
            filename: `${fileName.replace(/\.[^.]+$/, "") || "gallery-upload"}.webp`,
            contentType: "image/webp",
          })
        : null;
      const uploadedVideoAsset = mediaType === "VIDEO"
        ? await sanityServerClient.assets.upload("file", fileBytes, {
            filename: fileName,
            contentType: fileMimeType,
          })
        : null;

      const sharedMediaFields = {
        _type: "websiteGalleryMedia",
        albumId,
        mediaType,
        caption,
        altText:
          altText ||
          caption ||
          (mediaType === "PHOTO"
            ? "A moment at Kidzee Sector 12 Dwarka"
            : "A short video from Kidzee Sector 12 Dwarka"),
        published: false,
        sortOrder: albumMediaCount,
        consentConfirmed: true,
        consentConfirmedAt: now,
        fileName,
        mimeType: fileMimeType,
        fileSize: fileBytes.byteLength,
        storedFileId: null,
        createdAt: now,
        updatedAt: now,
      };

      const mediaDocument = await (async () => {
        try {
          return mediaType === "PHOTO"
            ? await sanityServerClient.create({
                ...sharedMediaFields,
                mediaSource: "SANITY_ASSET",
                image: {
                  _type: "image",
                  asset: {
                    _type: "reference",
                    _ref: uploadedPhotoAsset?._id,
                  },
                },
                optimizedFileSize: processedPhoto?.web.byteLength,
                width: processedPhoto?.width,
                height: processedPhoto?.height,
              })
            : await sanityServerClient.create({
                ...sharedMediaFields,
                mediaSource: "SANITY_SELF_HOSTED_VIDEO",
                video: {
                  _type: "file",
                  asset: {
                    _type: "reference",
                    _ref: uploadedVideoAsset?._id,
                  },
                },
              });
        } catch (error) {
          await removeUnusedSanityAsset(
            uploadedPhotoAsset?._id ?? uploadedVideoAsset?._id ?? null,
          );
          throw error;
        }
      })();

      if (uploadedVideoAsset) {
        const videoFile = await prisma.storedFile.create({
          data: {
            provider: "SANITY_SELF_HOSTED_VIDEO",
            publicUrl: uploadedVideoAsset.url,
            visibility: "PUBLIC",
            module: "WEBSITE_GALLERY",
            linkedRecordType: "WebsiteGalleryMedia",
            linkedRecordId: mediaDocument._id,
            originalName: fileName,
            mimeType: fileMimeType,
            originalSize: fileBytes.byteLength,
            optimizedSize: fileBytes.byteLength,
            status: "READY",
            uploadedById: access.session.userId,
            metadata: { explicitOwnerOptInRequired: true },
          },
        });
        await sanityServerClient
          .patch(mediaDocument._id)
          .set({ storedFileId: videoFile.id })
          .commit();
      }

      await prisma.activityLog.create({
        data: {
          adminUserId: access.session.userId,
          action: "CREATED",
          entityType: "WebsiteGalleryMedia",
          entityId: mediaDocument._id,
          description: `${mediaType === "PHOTO" ? "Optimised gallery photo" : "Owner-enabled gallery video"} uploaded as a draft.`,
          newData: {
            albumId,
            mediaType,
            originalSize: fileBytes.byteLength,
            optimizedSize: processedPhoto?.web.byteLength ?? fileBytes.byteLength,
            thumbnailSize: null,
            storedFileId: null,
            provider: mediaType === "PHOTO" ? "SANITY_ASSET" : "SANITY_SELF_HOSTED_VIDEO",
          },
        },
      });

      const currentCover = await sanityServerClient.fetch<string | null>(
        `*[
          _type == "websiteGalleryAlbum" &&
          _id == $albumId
        ][0].coverMediaId`,
        {
          albumId,
        },
      );

      if (!currentCover && mediaType === "PHOTO") {
        await sanityServerClient
          .patch(albumId)
          .set({
            coverMediaId: mediaDocument._id,
            updatedAt: now,
          })
          .commit();
      }

      refreshGalleryPages();

      return noStoreJson({
        success: true,
        message:
          processedPhoto
            ? `The photo was compressed from ${Math.round(fileBytes.byteLength / 1024)} KB to ${Math.round(processedPhoto.web.byteLength / 1024)} KB. It remains a draft until you publish it.`
            : "The media has been uploaded as a draft. Review it before publishing.",
        mediaId: mediaDocument._id,
      });
    }

    return noStoreJson(
      {
        success: false,
        message: "This gallery action is not supported.",
      },
      400,
    );
  } catch (error) {
    logServerError("Unable to update the website gallery.", error);

    return noStoreJson(
      {
        success: false,
        message: explainGallerySaveError(error),
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

    let body: UpdateRequest;

    try {
      body = (await request.json()) as UpdateRequest;
    } catch {
      return noStoreJson(
        {
          success: false,
          message: "The gallery update is invalid.",
        },
        400,
      );
    }

    const action = cleanText(body.action, 50);
    const now = new Date().toISOString();

    if (action === "updateAlbum") {
      const albumId = cleanId(body.albumId);
      const title = cleanText(body.title, 100);

      if (!albumId || title.length < 2) {
        return noStoreJson(
          {
            success: false,
            message: "The album title is required.",
          },
          400,
        );
      }

      const existingAlbum = await sanityServerClient.fetch<{
        _id: string;
        published: boolean;
      } | null>(
        `*[
          _type == "websiteGalleryAlbum" &&
          _id == $albumId
        ][0]{ _id, published }`,
        {
          albumId,
        },
      );

      if (!existingAlbum) {
        return noStoreJson(
          {
            success: false,
            message: "This gallery album no longer exists.",
          },
          404,
        );
      }

      const shouldPublish = cleanBoolean(body.published);

      if (shouldPublish && !existingAlbum.published) {
        const publishedMediaCount = await sanityServerClient.fetch<number>(
          `count(*[
            _type == "websiteGalleryMedia" &&
            albumId == $albumId &&
            published == true
          ])`,
          {
            albumId,
          },
        );

        if (publishedMediaCount === 0) {
          return noStoreJson(
            {
              success: false,
              message:
                "Publish at least one approved photograph or video before publishing the album.",
            },
            400,
          );
        }
      }

      const coverMediaId = cleanId(body.coverMediaId) || null;

      if (coverMediaId) {
        const validCover = await sanityServerClient.fetch<boolean>(
          `defined(*[
            _type == "websiteGalleryMedia" &&
            _id == $coverMediaId &&
            albumId == $albumId &&
            (defined(image.asset) || defined(externalImageUrl))
          ][0]._id)`,
          {
            coverMediaId,
            albumId,
          },
        );

        if (!validCover) {
          return noStoreJson(
            {
              success: false,
              message:
                "Select a photograph or a video with a thumbnail from this album as its cover.",
            },
            400,
          );
        }
      }

      const slug = await createUniqueSlug(title, albumId);

      await sanityServerClient
        .patch(albumId)
        .set({
          title,
          slug: {
            _type: "slug",
            current: slug,
          },
          description: cleanText(body.description, 700),
          category: cleanCategory(body.category),
          programmes: cleanProgrammes(body.programmes),
          eventDate: cleanDate(body.eventDate),
          published: shouldPublish,
          featured: cleanBoolean(body.featured),
          coverMediaId,
          updatedAt: now,
        })
        .commit();

      refreshGalleryPages();

      return noStoreJson({
        success: true,
        message: shouldPublish
          ? "The album is published on the website."
          : "The album has been saved as a draft.",
      });
    }

    if (action === "updateMedia") {
      const mediaId = cleanId(body.mediaId);

      if (!mediaId) {
        return noStoreJson(
          {
            success: false,
            message: "The gallery item is missing.",
          },
          400,
        );
      }

      const existingMedia = await sanityServerClient.fetch<{
        _id: string;
        albumId: string;
        mediaType: MediaType;
        published: boolean;
        hasImage: boolean;
        hasVideo: boolean;
      } | null>(
        `*[
          _type == "websiteGalleryMedia" &&
          _id == $mediaId
        ][0]{
          _id,
          albumId,
          mediaType,
          published,
          "hasImage": defined(image.asset) || defined(externalImageUrl),
          "hasVideo": defined(video.asset) || defined(embedUrl)
        }`,
        {
          mediaId,
        },
      );

      if (!existingMedia) {
        return noStoreJson(
          {
            success: false,
            message: "This gallery item no longer exists.",
          },
          404,
        );
      }

      const shouldPublish = cleanBoolean(body.published);

      if (
        shouldPublish &&
        ((existingMedia.mediaType === "PHOTO" && !existingMedia.hasImage) ||
          (existingMedia.mediaType === "VIDEO" &&
            (!existingMedia.hasVideo || !existingMedia.hasImage)))
      ) {
        return noStoreJson(
          {
            success: false,
            message:
              existingMedia.mediaType === "VIDEO"
                ? "Add a working video or reel URL and a thumbnail before publishing."
                : "This photo is not ready. Retry the upload before publishing it.",
          },
          409,
        );
      }

      if (existingMedia.published && !shouldPublish) {
        const publishedAlbum = await sanityServerClient.fetch<boolean>(
          `count(*[
            _type == "websiteGalleryAlbum" &&
            _id == $albumId &&
            published == true
          ]) > 0`,
          {
            albumId: existingMedia.albumId,
          },
        );

        if (publishedAlbum) {
          const otherPublishedMedia = await sanityServerClient.fetch<number>(
            `count(*[
              _type == "websiteGalleryMedia" &&
              albumId == $albumId &&
              _id != $mediaId &&
              published == true
            ])`,
            {
              albumId: existingMedia.albumId,
              mediaId,
            },
          );

          if (otherPublishedMedia === 0) {
            return noStoreJson(
              {
                success: false,
                message:
                  "Hide the album first, or publish another gallery item before hiding this one.",
              },
              400,
            );
          }
        }
      }

      const caption = cleanText(body.caption, 300);
      const altText = cleanText(body.altText, 180);

      await sanityServerClient
        .patch(mediaId)
        .set({
          caption,
          altText:
            altText ||
            caption ||
            (existingMedia.mediaType === "PHOTO"
              ? "A moment at Kidzee Sector 12 Dwarka"
              : "A short video from Kidzee Sector 12 Dwarka"),
          published: shouldPublish,
          updatedAt: now,
        })
        .commit();

      refreshGalleryPages();

      return noStoreJson({
        success: true,
        message: shouldPublish
          ? "The gallery item is published."
          : "The gallery item is hidden from the website.",
      });
    }

    if (action === "reorderAlbums" || action === "reorderMedia") {
      const orderedIds = cleanOrderedIds(body.orderedIds);
      const albumId = cleanId(body.albumId);

      if (orderedIds.length === 0) {
        return noStoreJson(
          {
            success: false,
            message: "There is nothing to reorder.",
          },
          400,
        );
      }

      const expectedType =
        action === "reorderAlbums"
          ? "websiteGalleryAlbum"
          : "websiteGalleryMedia";

      if (action === "reorderMedia" && !albumId) {
        return noStoreJson(
          {
            success: false,
            message: "The album is missing. Refresh the page and try again.",
          },
          400,
        );
      }

      const validIds = await sanityServerClient.fetch<string[]>(
        `*[
          _type == $expectedType &&
          _id in $orderedIds &&
          ($albumId == "" || albumId == $albumId)
        ]._id`,
        {
          expectedType,
          orderedIds,
          albumId: action === "reorderMedia" ? albumId : "",
        },
      );

      if (validIds.length !== orderedIds.length) {
        return noStoreJson(
          {
            success: false,
            message:
              "One or more gallery items could not be found. Refresh the page and try again.",
          },
          400,
        );
      }

      let transaction = sanityServerClient.transaction();

      orderedIds.forEach((id, index) => {
        transaction = transaction.patch(id, {
          set: {
            sortOrder: index,
            updatedAt: now,
          },
        });
      });

      await transaction.commit();
      refreshGalleryPages();

      return noStoreJson({
        success: true,
        message:
          action === "reorderAlbums"
            ? "The album order has been updated."
            : "The media order has been updated.",
      });
    }

    return noStoreJson(
      {
        success: false,
        message: "This gallery update is not supported.",
      },
      400,
    );
  } catch (error) {
    logServerError("Unable to update the website gallery.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "The gallery update could not be saved. Please try again. If the problem continues, contact the Owner.",
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

    const url = new URL(request.url);
    const target = cleanText(url.searchParams.get("target"), 20);
    const id = cleanId(url.searchParams.get("id"));

    if (!id || (target !== "album" && target !== "media")) {
      return noStoreJson(
        {
          success: false,
          message: "The gallery item to remove is invalid.",
        },
        400,
      );
    }

    if (target === "media") {
      const media = await sanityServerClient.fetch<{
        _id: string;
        albumId: string;
        published: boolean;
        storedFileId: string | null;
        thumbnailStoredFileId: string | null;
      } | null>(
        `*[
          _type == "websiteGalleryMedia" &&
          _id == $id
        ][0]{ _id, albumId, published, storedFileId, thumbnailStoredFileId }`,
        {
          id,
        },
      );

      if (!media) {
        return noStoreJson(
          {
            success: false,
            message: "This gallery item no longer exists.",
          },
          404,
        );
      }

      const album = await sanityServerClient.fetch<{
        coverMediaId: string | null;
        published: boolean;
      } | null>(
        `*[
          _type == "websiteGalleryAlbum" &&
          _id == $albumId
        ][0]{ coverMediaId, published }`,
        {
          albumId: media.albumId,
        },
      );

      if (album?.published && media.published) {
        const otherPublishedMedia = await sanityServerClient.fetch<number>(
          `count(*[
            _type == "websiteGalleryMedia" &&
            albumId == $albumId &&
            _id != $mediaId &&
            published == true
          ])`,
          {
            albumId: media.albumId,
            mediaId: id,
          },
        );

        if (otherPublishedMedia === 0) {
          return noStoreJson(
            {
              success: false,
              message:
                "Hide the album first, or publish another gallery item before removing this one.",
            },
            400,
          );
        }
      }

      await sanityServerClient.delete(id);

      const storedFileIds = [media.storedFileId, media.thumbnailStoredFileId].filter(
        (value): value is string => Boolean(value),
      );
      if (storedFileIds.length > 0) {
        await prisma.storedFile.updateMany({
          where: { id: { in: storedFileIds } },
          data: { status: "ARCHIVED", archivedAt: new Date() },
        });
      }
      await prisma.activityLog.create({
        data: {
          adminUserId: access.session.userId,
          action: "ARCHIVED",
          entityType: "WebsiteGalleryMedia",
          entityId: id,
          description: "Gallery entry removed and its external media retained safely in the archive index.",
          previousData: { albumId: media.albumId, storedFileIds },
        },
      });

      if (album?.coverMediaId === id) {
        const nextCover = await sanityServerClient.fetch<string | null>(
          `*[
            _type == "websiteGalleryMedia" &&
            albumId == $albumId &&
            (defined(image.asset) || defined(externalImageUrl)) &&
            ($publishedOnly == false || published == true)
          ] | order(sortOrder asc, createdAt desc)[0]._id`,
          {
            albumId: media.albumId,
            publishedOnly: Boolean(album.published),
          },
        );

        await sanityServerClient
          .patch(media.albumId)
          .set({
            coverMediaId: nextCover,
            updatedAt: new Date().toISOString(),
          })
          .commit();
      }

      refreshGalleryPages();

      return noStoreJson({
        success: true,
        message: "The media has been removed from the website gallery.",
      });
    }

    const albumExists = await sanityServerClient.fetch<boolean>(
      `defined(*[
        _type == "websiteGalleryAlbum" &&
        _id == $id
      ][0]._id)`,
      {
        id,
      },
    );

    if (!albumExists) {
      return noStoreJson(
        {
          success: false,
          message: "This gallery album no longer exists.",
        },
        404,
      );
    }

    const albumMedia = await sanityServerClient.fetch<Array<{
      _id: string;
      storedFileId: string | null;
      thumbnailStoredFileId: string | null;
    }>>(
      `*[
        _type == "websiteGalleryMedia" &&
        albumId == $albumId
      ]{ _id, storedFileId, thumbnailStoredFileId }`,
      {
        albumId: id,
      },
    );

    let transaction = sanityServerClient.transaction();

    for (const item of albumMedia) {
      transaction = transaction.delete(item._id);
    }

    transaction = transaction.delete(id);
    await transaction.commit();

    const storedFileIds = albumMedia
      .flatMap((item) => [item.storedFileId, item.thumbnailStoredFileId])
      .filter((value): value is string => Boolean(value));
    if (storedFileIds.length > 0) {
      await prisma.storedFile.updateMany({
        where: { id: { in: storedFileIds } },
        data: { status: "ARCHIVED", archivedAt: new Date() },
      });
    }
    await prisma.activityLog.create({
      data: {
        adminUserId: access.session.userId,
        action: "ARCHIVED",
        entityType: "WebsiteGalleryAlbum",
        entityId: id,
        description: "Gallery album removed; external media files retained in the archive index.",
        previousData: { mediaCount: albumMedia.length, storedFileIds },
      },
    });

    refreshGalleryPages();

    return noStoreJson({
      success: true,
      message:
        "The album and its website gallery entries have been removed.",
    });
  } catch (error) {
    logServerError("Unable to remove gallery content.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "The gallery content could not be removed. Please try again. If the problem continues, contact the Owner.",
      },
      500,
    );
  }
}
