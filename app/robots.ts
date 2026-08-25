import type { MetadataRoute } from "next";

import { site } from "@/lib/site";

const privatePaths = ["/admin/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "OAI-SearchBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "OAI-AdsBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "ChatGPT-User",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Claude-SearchBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Claude-User",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "PerplexityBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Perplexity-User",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "Google-Extended",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "GPTBot",
        allow: "/",
        disallow: privatePaths,
      },
      {
        userAgent: "ClaudeBot",
        allow: "/",
        disallow: privatePaths,
      },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
