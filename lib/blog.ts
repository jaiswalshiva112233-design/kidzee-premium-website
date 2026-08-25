export type BlogArticleSection = {
  heading: string;
  paragraphs: string[];
  bullets: string[];
};

export type BlogArticle = {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  author: string;
  publishedAt: string;
  updatedAt: string;
  coverImageUrl: string | null;
  coverImageAlt: string;
  featured: boolean;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  intro: string[];
  sections: BlogArticleSection[];
  conclusion: string;
};

export type BlogArticleInput = Omit<
  BlogArticle,
  "_id" | "updatedAt" | "coverImageUrl"
>;

export const blogCategories = [
  "Starting Preschool",
  "Preschool Readiness",
  "Early Learning",
  "Child Development",
  "Parenting",
  "Choosing a Preschool",
  "Centre Updates",
] as const;

export function createBlogSlug(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

