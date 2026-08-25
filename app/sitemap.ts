import type { MetadataRoute } from "next";

import { getPublishedBlogArticles } from "@/lib/sanity/blog";
import { getPublishedGalleryAlbums } from "@/lib/sanity/gallery";
import { posts, programmes, site } from "@/lib/site";
import { prisma } from "@/lib/prisma";

type SitemapChangeFrequency = NonNullable<
  MetadataRoute.Sitemap[number]["changeFrequency"]
>;

type StaticPage = {
  path: string;
  changeFrequency: SitemapChangeFrequency;
  priority: number;
};

const websiteFoundationUpdatedAt = new Date(
  "2026-08-14T00:00:00+05:30",
);

const staticPages: StaticPage[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/programmes", changeFrequency: "monthly", priority: 0.9 },
  { path: "/daycare", changeFrequency: "monthly", priority: 0.9 },
  { path: "/admissions", changeFrequency: "monthly", priority: 0.9 },
  { path: "/gallery", changeFrequency: "weekly", priority: 0.75 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.5 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.7 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.2 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
];

function absoluteUrl(path: string) {
  return `${site.url}${path}`;
}

function safeDate(value: string | null | undefined) {
  if (!value) {
    return websiteFoundationUpdatedAt;
  }

  const parsed = new Date(value);

  return Number.isNaN(parsed.getTime())
    ? websiteFoundationUpdatedAt
    : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [galleryAlbums, managedArticles, landingPages] = await Promise.all([
    getPublishedGalleryAlbums(),
    getPublishedBlogArticles(),
    prisma.landingPage.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true } }).catch(() => []),
  ]);

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: absoluteUrl(page.path),
    lastModified: websiteFoundationUpdatedAt,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const programmeEntries: MetadataRoute.Sitemap = programmes.map(
    (programme) => ({
      url: absoluteUrl(`/programmes/${programme.slug}`),
      lastModified: websiteFoundationUpdatedAt,
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  const managedSlugs = new Set(
    managedArticles.map((article) => article.slug),
  );

  const blogEntries: MetadataRoute.Sitemap = [
    ...managedArticles.map((article) => ({
      url: absoluteUrl(`/blog/${article.slug}`),
      lastModified: safeDate(article.updatedAt || article.publishedAt),
      changeFrequency: "monthly" as const,
      priority: article.featured ? 0.7 : 0.6,
    })),
    ...posts
      .filter((post) => !managedSlugs.has(post.slug))
      .map((post) => ({
        url: absoluteUrl(`/blog/${post.slug}`),
        lastModified: safeDate(`${post.date}T00:00:00+05:30`),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
  ];

  const galleryEntries: MetadataRoute.Sitemap = galleryAlbums.map(
    (album) => {
      const newestMediaDate = album.media.reduce<Date | null>(
        (newest, item) => {
          const itemDate = safeDate(item.createdAt);

          return !newest || itemDate > newest ? itemDate : newest;
        },
        null,
      );

      return {
        url: absoluteUrl(`/gallery/${album.slug}`),
        lastModified: newestMediaDate ?? safeDate(album.createdAt),
        changeFrequency: "monthly" as const,
        priority: album.category === "PARENT_STORIES" ? 0.7 : 0.65,
      };
    },
  );

  return [
    ...staticEntries,
    ...programmeEntries,
    ...blogEntries,
    ...galleryEntries,
    ...landingPages.map((page) => ({ url: absoluteUrl(`/landing/${page.slug}`), lastModified: page.updatedAt, changeFrequency: "weekly" as const, priority: 0.85 })),
  ];
}
