import type { Metadata } from "next";

import AboutEnvironment from "@/components/AboutEnvironment";
import AboutHero from "@/components/AboutHero";
import AboutKidzee from "@/components/AboutKidzee";
import AboutSafety from "@/components/AboutSafety";
import PageShell from "@/components/PageShell";
import Team from "@/components/Team";
import { getWebsiteContentSettings } from "@/lib/sanity/contentSettings";
import { getWebsiteMediaBySlotKeys } from "@/lib/sanity/media";
import { buildWebsitePageMetadata } from "@/lib/sanity/seo";
import { getPublishedWebsiteTeamMembers } from "@/lib/sanity/team";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildWebsitePageMetadata({
    pageKey: "about",
    path: "/about",
    title: "About Our Preschool",
    description:
      "Meet Kidzee Preschool & Daycare in Sector 12B, Dwarka. Explore our Péntemind learning approach, real centre environment and everyday care practices.",
    keywords: [
      "Kidzee Sector 12 Dwarka",
      "Kidzee Sector 12B Dwarka",
      "preschool in Dwarka",
      "preschool in Sector 12 Dwarka",
      "daycare in Sector 12 Dwarka",
      "play school in Dwarka",
      "nursery school in Dwarka",
      "early childhood education Dwarka",
    ],
    socialImage: "/images/hero/about-main.jpg",
    socialImageAlt:
      "Kidzee Preschool and Daycare in Sector 12B Dwarka",
  });
}

const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  "@id": `${site.url}/about#webpage`,
  name: "About Kidzee Preschool & Daycare Sector 12 Dwarka",
  description:
    "Information about Kidzee Preschool & Daycare in Sector 12B, Dwarka, including its Péntemind learning approach, centre environment and everyday care practices.",
  url: `${site.url}/about`,
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: `${site.url}/images/hero/about-main.jpg`,
  },
  isPartOf: {
    "@id": `${site.url}/#website`,
  },
  about: {
    "@id": `${site.url}/#preschool`,
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: site.url,
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "About Us",
      item: `${site.url}/about`,
    },
  ],
};

const aboutMediaSlotKeys = [
  "about.hero.main",
  "about.environment.main",
  "about.environment.play",
  "about.environment.activity",
  "about.safety.main",
];

export default async function AboutPage() {
  const [media, teamMembers, contentSettings] = await Promise.all([
    getWebsiteMediaBySlotKeys(aboutMediaSlotKeys),
    getPublishedWebsiteTeamMembers(),
    getWebsiteContentSettings(),
  ]);
  const structuredData = JSON.stringify([
    aboutPageSchema,
    breadcrumbSchema,
  ]).replace(/</g, "\\u003c");

  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: structuredData,
        }}
      />

      <main className="overflow-hidden">
        <AboutHero
          imageUrl={media["about.hero.main"]?.imageUrl ?? undefined}
          imageAlt={media["about.hero.main"]?.altText || undefined}
          heading={contentSettings.aboutHeroHeading}
          headingHighlight={contentSettings.aboutHeroHighlight}
          introduction={contentSettings.aboutHeroIntro}
          primaryCtaLabel={contentSettings.primaryCtaLabel}
          secondaryCtaLabel={contentSettings.secondaryCtaLabel}
        />

        <AboutKidzee />

        <div data-nosnippet="true">
          <Team members={teamMembers} />
        </div>

        <AboutEnvironment
          mainImageUrl={
            media["about.environment.main"]?.imageUrl ?? undefined
          }
          mainImageAlt={
            media["about.environment.main"]?.altText || undefined
          }
          playImageUrl={
            media["about.environment.play"]?.imageUrl ?? undefined
          }
          playImageAlt={
            media["about.environment.play"]?.altText || undefined
          }
          activityImageUrl={
            media["about.environment.activity"]?.imageUrl ?? undefined
          }
          activityImageAlt={
            media["about.environment.activity"]?.altText || undefined
          }
        />

        <AboutSafety
          imageUrl={media["about.safety.main"]?.imageUrl ?? undefined}
          imageAlt={media["about.safety.main"]?.altText || undefined}
        />
      </main>
    </PageShell>
  );
}
