import "server-only";

import { cache } from "react";

import type {
  BlogArticle,
  BlogArticleSection,
} from "@/lib/blog";
import { sanityServerClient } from "@/lib/sanity/serverClient";

type StoredSection = Partial<BlogArticleSection> | null;
type StoredArticle = Partial<BlogArticle> & {
  _id?: string;
  sections?: StoredSection[];
};

function text(value: unknown, limit: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, limit)
    : "";
}

function textList(value: unknown, itemLimit: number, maximumItems: number) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => text(item, itemLimit))
    .filter(Boolean)
    .slice(0, maximumItems);
}

function prepareSection(value: StoredSection): BlogArticleSection | null {
  if (!value) {
    return null;
  }

  const heading = text(value.heading, 180);
  const paragraphs = textList(value.paragraphs, 1800, 12);
  const bullets = textList(value.bullets, 500, 20);

  if (!heading || paragraphs.length === 0) {
    return null;
  }

  return { heading, paragraphs, bullets };
}

function prepareArticle(value: StoredArticle): BlogArticle | null {
  const id = text(value._id, 160);
  const title = text(value.title, 160);
  const slug = text(value.slug, 100).toLowerCase();
  const excerpt = text(value.excerpt, 360);

  if (!id || !title || !slug || !excerpt) {
    return null;
  }

  return {
    _id: id,
    title,
    slug,
    excerpt,
    category: text(value.category, 80) || "Parenting",
    author: text(value.author, 100) || "Kidzee Sector 12, Dwarka",
    publishedAt: text(value.publishedAt, 30),
    updatedAt: text(value.updatedAt, 30),
    coverImageUrl: text(value.coverImageUrl, 1000) || null,
    coverImageAlt: text(value.coverImageAlt, 180) || title,
    featured: value.featured === true,
    published: value.published === true,
    seoTitle: text(value.seoTitle, 70) || title,
    seoDescription: text(value.seoDescription, 180) || excerpt,
    intro: textList(value.intro, 1800, 8),
    sections: (value.sections ?? [])
      .map(prepareSection)
      .filter((section): section is BlogArticleSection => Boolean(section)),
    conclusion: text(value.conclusion, 2200),
  };
}

const articleProjection = `{
  _id,
  title,
  "slug": slug.current,
  excerpt,
  category,
  author,
  publishedAt,
  updatedAt,
  "coverImageUrl": coverImage.asset->url,
  coverImageAlt,
  featured,
  published,
  seoTitle,
  seoDescription,
  intro,
  sections[] {
    heading,
    paragraphs,
    bullets
  },
  conclusion
}`;

async function loadPublishedBlogArticles(): Promise<BlogArticle[]> {
  try {
    const articles = await sanityServerClient.fetch<StoredArticle[]>(
      `*[
        _type == "websiteBlogPost" &&
        published == true &&
        publishedAt <= now()
      ] | order(featured desc, publishedAt desc) ${articleProjection}`,
      {},
      { next: { revalidate: 300 } },
    );

    return (articles ?? [])
      .map(prepareArticle)
      .filter((article): article is BlogArticle => Boolean(article));
  } catch {
    console.error("Unable to load public blog articles.");
    return [];
  }
}

export const getPublishedBlogArticles = cache(
  loadPublishedBlogArticles,
);

export const getPublishedBlogArticleBySlug = cache(
  async (slug: string): Promise<BlogArticle | null> => {
    const cleanSlug = slug.trim().toLowerCase();

    if (!/^[a-z0-9-]{1,100}$/.test(cleanSlug)) {
      return null;
    }

    try {
      const article = await sanityServerClient.fetch<StoredArticle | null>(
        `*[
          _type == "websiteBlogPost" &&
          published == true &&
          publishedAt <= now() &&
          slug.current == $slug
        ][0] ${articleProjection}`,
        { slug: cleanSlug },
        { next: { revalidate: 300 } },
      );

      return article ? prepareArticle(article) : null;
    } catch {
      console.error(`Unable to load blog article ${cleanSlug}.`);
      return null;
    }
  },
);
