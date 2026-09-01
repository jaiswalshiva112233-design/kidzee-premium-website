import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import type {
  BlogArticle,
  BlogArticleInput,
  BlogArticleSection,
} from "@/lib/blog";
import { createBlogSlug } from "@/lib/blog";
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

type StoredArticle = BlogArticle & {
  assetId: string | null;
};

type ArticleRequest = Partial<BlogArticleInput>;

type BlogSanityDocument = {
  _id: string;
  _type: string;
  coverImage?: Record<string, unknown>;
  [key: string]: unknown;
};

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store, max-age=0" },
  });
}

function cleanText(value: unknown, maximumLength: number) {
  return typeof value === "string"
    ? value
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, maximumLength)
    : "";
}

function cleanLongText(value: unknown, maximumLength: number) {
  return typeof value === "string"
    ? value
        .replace(/\r\n?/g, "\n")
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
        .trim()
        .slice(0, maximumLength)
    : "";
}

function cleanTextList(
  value: unknown,
  itemLength: number,
  maximumItems: number,
) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => cleanLongText(item, itemLength))
    .filter(Boolean)
    .slice(0, maximumItems);
}

function cleanSections(value: unknown): BlogArticleSection[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .slice(0, 12)
    .map((section) => {
      const record =
        section && typeof section === "object"
          ? (section as Record<string, unknown>)
          : {};

      return {
        heading: cleanText(record.heading, 180),
        paragraphs: cleanTextList(record.paragraphs, 1800, 12),
        bullets: cleanTextList(record.bullets, 500, 20),
      };
    })
    .filter(
      (section) =>
        Boolean(section.heading) && section.paragraphs.length > 0,
    );
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
    // The request origin is still checked.
  }

  return allowedOrigins.has(origin);
}

async function requireWebsiteManager() {
  if (!(await isAdminAuthenticated())) {
    return {
      allowed: false as const,
      response: noStoreJson(
        { success: false, message: "You are not authorised." },
        401,
      ),
    };
  }

  if (!(await hasAdminPermission("website.manage"))) {
    return {
      allowed: false as const,
      response: noStoreJson(
        {
          success: false,
          message: "You do not have permission to manage website articles.",
        },
        403,
      ),
    };
  }

  return { allowed: true as const };
}

function refreshBlog(previousSlug?: string, nextSlug?: string) {
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/website");
  revalidatePath("/admin/website/blog");

  if (previousSlug) {
    revalidatePath(`/blog/${previousSlug}`);
  }

  if (nextSlug && nextSlug !== previousSlug) {
    revalidatePath(`/blog/${nextSlug}`);
  }
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
    logServerWarning("An unused blog cover asset could not be removed.", error);
  }
}

function parseArticle(value: unknown) {
  const body =
    value && typeof value === "object"
      ? (value as ArticleRequest)
      : {};

  const title = cleanText(body.title, 160);
  const slug = createBlogSlug(cleanText(body.slug, 120) || title);
  const excerpt = cleanText(body.excerpt, 360);
  const category = cleanText(body.category, 80);
  const author = cleanText(body.author, 100);
  const publishedAtValue = cleanText(body.publishedAt, 30);
  const publishedAtDate = new Date(publishedAtValue);
  const coverImageAlt = cleanText(body.coverImageAlt, 180) || title;
  const seoTitle = cleanText(body.seoTitle, 70) || title;
  const seoDescription = cleanText(body.seoDescription, 180) || excerpt;
  const intro = cleanTextList(body.intro, 1800, 8);
  const sections = cleanSections(body.sections);
  const conclusion = cleanLongText(body.conclusion, 2200);
  const errors: string[] = [];

  if (title.length < 10) {
    errors.push("Enter a clear article title of at least 10 characters.");
  }

  if (!/^[a-z0-9-]{3,100}$/.test(slug)) {
    errors.push("The article URL is invalid.");
  }

  if (excerpt.length < 40) {
    errors.push("Enter a useful article summary of at least 40 characters.");
  }

  if (!category) {
    errors.push("Choose or enter an article category.");
  }

  if (!author) {
    errors.push("Enter the article author.");
  }

  if (Number.isNaN(publishedAtDate.getTime())) {
    errors.push("Choose a valid publishing date.");
  }

  if (intro.length === 0) {
    errors.push("Add at least one opening paragraph.");
  }

  if (sections.length === 0) {
    errors.push("Add at least one complete article section.");
  }

  if (conclusion.length < 30) {
    errors.push("Add a short conclusion of at least 30 characters.");
  }

  if (seoTitle.length > 60) {
    errors.push("Keep the Google SEO title within 60 characters.");
  }

  if (seoDescription.length < 80 || seoDescription.length > 160) {
    errors.push("Keep the Google SEO description between 80 and 160 characters.");
  }

  const article: BlogArticleInput = {
    title,
    slug,
    excerpt,
    category,
    author,
    publishedAt: Number.isNaN(publishedAtDate.getTime())
      ? ""
      : publishedAtDate.toISOString(),
    coverImageAlt,
    featured: body.featured === true,
    published: body.published === true,
    seoTitle,
    seoDescription,
    intro,
    sections,
    conclusion,
  };

  return { article, errors };
}

const adminProjection = `{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  author,
  publishedAt,
  updatedAt,
  "coverImageUrl": coverImage.asset->url,
  "assetId": coverImage.asset->_id,
  coverImageAlt,
  featured,
  published,
  seoTitle,
  seoDescription,
  intro,
  sections[] { heading, paragraphs, bullets },
  conclusion
}`;

export async function GET() {
  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    const articles = await sanityServerClient.fetch<StoredArticle[]>(
      `*[_type == "websiteBlogPost"] |
        order(featured desc, publishedAt desc, updatedAt desc) ${adminProjection}`,
      {},
      { cache: "no-store" },
    );

    return noStoreJson({ success: true, articles: articles ?? [] });
  } catch (error) {
    logServerError("Unable to load website articles.", error);
    return noStoreJson(
      { success: false, message: "Website articles could not be loaded." },
      500,
    );
  }
}

export async function POST(request: Request) {
  let uploadedAssetId: string | null = null;

  try {
    const access = await requireWebsiteManager();

    if (!access.allowed) {
      return access.response;
    }

    if (!hasAllowedOrigin(request)) {
      return noStoreJson(
        { success: false, message: "This article request was blocked for security." },
        403,
      );
    }

    const formData = await request.formData();
    const id = cleanText(formData.get("id"), 160);
    const rawArticle = formData.get("article");

    if (typeof rawArticle !== "string") {
      return noStoreJson(
        { success: false, message: "The article information is missing." },
        400,
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(rawArticle);
    } catch {
      return noStoreJson(
        { success: false, message: "The article information is invalid." },
        400,
      );
    }

    const { article, errors } = parseArticle(parsed);

    if (errors.length > 0) {
      return noStoreJson(
        { success: false, message: errors[0], errors },
        400,
      );
    }

    const existing = id
      ? await sanityServerClient.fetch<StoredArticle | null>(
          `*[_id == $id && _type == "websiteBlogPost"][0] ${adminProjection}`,
          { id },
        )
      : null;

    if (id && !existing) {
      return noStoreJson(
        { success: false, message: "This article no longer exists. Refresh and try again." },
        404,
      );
    }

    const duplicateId = await sanityServerClient.fetch<string | null>(
      `*[
        _type == "websiteBlogPost" &&
        slug.current == $slug &&
        _id != $id
      ][0]._id`,
      { slug: article.slug, id: id || "__new__" },
    );

    if (duplicateId) {
      return noStoreJson(
        { success: false, message: "Another article already uses this page URL." },
        409,
      );
    }

    const fileValue = formData.get("cover");
    let coverImage: Record<string, unknown> | undefined;

    if (fileValue instanceof File && fileValue.size > 0) {
      if (!ALLOWED_IMAGE_TYPES.has(fileValue.type)) {
        return noStoreJson(
          { success: false, message: "Upload a JPG, PNG, WebP or AVIF cover image." },
          400,
        );
      }

      if (fileValue.size > MAX_IMAGE_SIZE_BYTES) {
        return noStoreJson(
          { success: false, message: "The cover image is too large. Maximum size is 12 MB." },
          400,
        );
      }

      const uploadedAsset = await sanityServerClient.assets.upload(
        "image",
        Buffer.from(await fileValue.arrayBuffer()),
        {
          filename: cleanText(fileValue.name, 180) || "blog-cover",
          contentType: fileValue.type,
        },
      );

      uploadedAssetId = uploadedAsset._id;
      coverImage = {
        _type: "image",
        asset: { _type: "reference", _ref: uploadedAsset._id },
      };
    }

    const documentId = existing?._id || `websiteBlogPost.${randomUUID()}`;
    const updatedAt = new Date().toISOString();
    const createdAt = existing
      ? await sanityServerClient.fetch<string | null>(
          `*[_id == $id][0].createdAt`,
          { id: documentId },
        )
      : null;

    const document: BlogSanityDocument = {
      _id: documentId,
      _type: "websiteBlogPost",
      title: article.title,
      slug: { _type: "slug", current: article.slug },
      excerpt: article.excerpt,
      category: article.category,
      author: article.author,
      publishedAt: article.publishedAt,
      featured: article.featured,
      published: article.published,
      seoTitle: article.seoTitle,
      seoDescription: article.seoDescription,
      coverImageAlt: article.coverImageAlt,
      intro: article.intro,
      sections: article.sections.map((section) => ({
        _key: randomUUID(),
        _type: "websiteBlogSection",
        ...section,
      })),
      conclusion: article.conclusion,
      createdAt: createdAt || updatedAt,
      updatedAt,
    };

    if (coverImage) {
      document.coverImage = coverImage;
    } else if (existing?.assetId) {
      document.coverImage = {
        _type: "image",
        asset: { _type: "reference", _ref: existing.assetId },
      };
    }

    await sanityServerClient.createOrReplace(document);
    refreshBlog(existing?.slug, article.slug);

    if (existing?.assetId && uploadedAssetId && existing.assetId !== uploadedAssetId) {
      await removeUnusedAsset(existing.assetId);
    }

    return noStoreJson({
      success: true,
      message: article.published
        ? "The article has been saved and published."
        : "The article has been saved as a draft.",
      id: documentId,
      slug: article.slug,
    });
  } catch (error) {
    if (uploadedAssetId) {
      await removeUnusedAsset(uploadedAssetId);
    }

    logServerError("Unable to save website article.", error);
    return noStoreJson(
      {
        success: false,
        message: "The article could not be saved. Please try again. If the problem continues, contact the Owner.",
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
        { success: false, message: "This delete request was blocked for security." },
        403,
      );
    }

    const body = (await request.json()) as { id?: unknown };
    const id = cleanText(body.id, 160);

    if (!id) {
      return noStoreJson(
        { success: false, message: "Choose an article to delete." },
        400,
      );
    }

    const existing = await sanityServerClient.fetch<StoredArticle | null>(
      `*[_id == $id && _type == "websiteBlogPost"][0] ${adminProjection}`,
      { id },
    );

    if (!existing) {
      return noStoreJson(
        { success: false, message: "This article no longer exists." },
        404,
      );
    }

    await sanityServerClient.delete(id);
    refreshBlog(existing.slug);
    await removeUnusedAsset(existing.assetId);

    return noStoreJson({ success: true, message: "The article has been deleted." });
  } catch (error) {
    logServerError("Unable to delete website article.", error);
    return noStoreJson(
      { success: false, message: "The article could not be deleted." },
      500,
    );
  }
}
