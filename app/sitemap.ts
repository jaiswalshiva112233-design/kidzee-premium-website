import type { MetadataRoute } from "next";
import { posts, programmes, site } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: site.url,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${site.url}/about`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/programmes`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/daycare`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/admissions`,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${site.url}/gallery`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${site.url}/contact`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${site.url}/blog`,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${site.url}/privacy-policy`,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  const programmeRoutes: MetadataRoute.Sitemap = programmes.map(
    (programme) => ({
      url: `${site.url}/programmes/${programme.slug}`,
      changeFrequency: "monthly",
      priority: 0.8,
    }),
  );

  const blogRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${site.url}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticRoutes, ...programmeRoutes, ...blogRoutes];
}