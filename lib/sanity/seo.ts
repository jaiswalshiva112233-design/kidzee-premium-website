import "server-only";

import type { Metadata } from "next";

import { sanityServerClient } from "@/lib/sanity/serverClient";
import { site } from "@/lib/site";

export type WebsiteSeoPageKey =
  | "home"
  | "about"
  | "programmes"
  | "daycare"
  | "gallery"
  | "admissions"
  | "contact"
  | "blog";

export type WebsiteMetadataFallback = {
  pageKey: WebsiteSeoPageKey;
  path: `/${string}` | "/";
  title: string;
  description: string;
  keywords: readonly string[];
  socialImage: string;
  socialImageAlt: string;
};

type StoredSeoPage = {
  pageKey?: unknown;
  seoTitle?: unknown;
  metaDescription?: unknown;
  keywords?: unknown;
  socialImageUrl?: unknown;
  socialImageAlt?: unknown;
};

type ResolvedWebsiteSeo = {
  title: string;
  description: string;
  keywords: string[];
  socialImage: string;
  socialImageAlt: string;
};

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

function cleanKeywords(
  value: unknown,
  fallback: readonly string[],
) {
  if (!Array.isArray(value)) {
    return [...fallback];
  }

  const keywords = Array.from(
    new Set(
      value
        .map((keyword) => cleanText(keyword, 60))
        .filter((keyword) => keyword.length >= 2),
    ),
  ).slice(0, 12);

  return keywords.length > 0 ? keywords : [...fallback];
}

function cleanImageUrl(value: unknown, fallback: string) {
  const cleaned = cleanText(value, 500);

  if (
    cleaned.startsWith("/") ||
    /^https:\/\/[A-Za-z0-9.-]+(?:\/|$)/.test(cleaned)
  ) {
    return cleaned;
  }

  return fallback;
}

async function loadStoredSeoPage(
  pageKey: WebsiteSeoPageKey,
): Promise<StoredSeoPage | null> {
  try {
    return await sanityServerClient.fetch<StoredSeoPage | null>(
      `*[
        _id == "website-seo-settings" &&
        _type == "websiteSeoSettings"
      ][0].pages[pageKey == $pageKey][0] {
        pageKey,
        seoTitle,
        metaDescription,
        keywords,
        socialImageAlt,
        "socialImageUrl": socialImage.asset->url
      }`,
      {
        pageKey,
      },
    );
  } catch {
    console.error(`Unable to load website SEO for ${pageKey}.`);

    return null;
  }
}

export async function getResolvedWebsiteSeo(
  fallback: WebsiteMetadataFallback,
): Promise<ResolvedWebsiteSeo> {
  const stored = await loadStoredSeoPage(fallback.pageKey);
  const storedTitle = cleanText(stored?.seoTitle, 70);
  const resolvedTitle =
    storedTitle.length >= 20 ? storedTitle : fallback.title;
  const brandedTitle =
    fallback.pageKey === "home" && !/\bkidzee\b/i.test(resolvedTitle)
      ? cleanText(`Kidzee ${resolvedTitle}`, 70)
      : resolvedTitle;
  const storedDescription = cleanText(
    stored?.metaDescription,
    180,
  );

  return {
    title: brandedTitle,
    description:
      storedDescription.length >= 70
        ? storedDescription
        : fallback.description,
    keywords: cleanKeywords(stored?.keywords, fallback.keywords),
    socialImage: cleanImageUrl(
      stored?.socialImageUrl,
      fallback.socialImage,
    ),
    socialImageAlt:
      cleanText(stored?.socialImageAlt, 140) ||
      fallback.socialImageAlt,
  };
}

export async function buildWebsitePageMetadata(
  fallback: WebsiteMetadataFallback,
): Promise<Metadata> {
  const seo = await getResolvedWebsiteSeo(fallback);

  return {
    title: seo.title,
    description: seo.description,
    keywords: seo.keywords,
    alternates: {
      canonical: fallback.path,
    },
    openGraph: {
      title: seo.title,
      description: seo.description,
      url: fallback.path,
      siteName: site.shortName,
      locale: "en_IN",
      type: "website",
      images: [
        {
          url: seo.socialImage,
          width: 1200,
          height: 630,
          alt: seo.socialImageAlt,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seo.title,
      description: seo.description,
      images: [seo.socialImage],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}
