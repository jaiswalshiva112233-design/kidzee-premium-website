import type { MetadataRoute } from "next";

import { programmes, site } from "@/lib/site";

const staticPages = [
  {
    path: "",
    changeFrequency: "weekly",
    priority: 1,
  },
  {
    path: "/about",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/programmes",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/daycare",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/admissions",
    changeFrequency: "monthly",
    priority: 0.9,
  },
  {
    path: "/gallery",
    changeFrequency: "monthly",
    priority: 0.7,
  },
  {
    path: "/contact",
    changeFrequency: "monthly",
    priority: 0.8,
  },
  {
    path: "/blog",
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    path: "/privacy-policy",
    changeFrequency: "yearly",
    priority: 0.2,
  },
  {
    path: "/terms",
    changeFrequency: "yearly",
    priority: 0.2,
  },
] satisfies Array<{
  path: string;
  changeFrequency: NonNullable<
    MetadataRoute.Sitemap[number]["changeFrequency"]
  >;
  priority: number;
}>;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${site.url}${page.path}`,
    lastModified,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const programmeEntries: MetadataRoute.Sitemap = programmes.map(
    (programme) => ({
      url: `${site.url}/programmes/${programme.slug}`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.8,
    })
  );

  return [...staticEntries, ...programmeEntries];
}