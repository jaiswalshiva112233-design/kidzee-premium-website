import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import ProgrammeApproach from "@/components/ProgrammeApproach";
import ProgrammeCards from "@/components/ProgrammeCards";
import ProgrammeFAQ from "@/components/ProgrammeFAQ";
import ProgrammesHero from "@/components/ProgrammesHero";
import { getWebsiteContentSettings } from "@/lib/sanity/contentSettings";
import { getWebsiteMediaBySlotKeys } from "@/lib/sanity/media";
import { getProgrammeRatioSettings } from "@/lib/sanity/programmeSettings";
import { buildWebsitePageMetadata } from "@/lib/sanity/seo";
import { programmes, site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  return buildWebsitePageMetadata({
    pageKey: "programmes",
    path: "/programmes",
    title: "Preschool Programmes",
    description:
      "Explore Playgroup, Nursery, Junior KG and Senior KG programmes at Kidzee Sector 12, Dwarka. Compare age groups, learning goals, meals and school readiness for children aged 2 to 6 years.",
    keywords: [
      "preschool programmes in Dwarka",
      "Playgroup in Sector 12 Dwarka",
      "Nursery in Sector 12 Dwarka",
      "Junior KG in Dwarka",
      "Senior KG in Dwarka",
      "Kidzee Sector 12 programmes",
      "preschool curriculum Dwarka",
      "preschool with meals Dwarka",
    ],
    socialImage: "/images/programmes/playgroup.jpg",
    socialImageAlt: "Preschool programmes at Kidzee Sector 12 Dwarka",
  });
}

const programmeMediaSlotKeys = [
  "programmes.hero.main",
  "programmes.cards.playgroup",
  "programmes.cards.nursery",
  "programmes.cards.junior-kg",
  "programmes.cards.senior-kg",
  "programmes.approach.main",
];

export default async function ProgrammesPage() {
  const [media, ratioSettings, contentSettings] = await Promise.all([
    getWebsiteMediaBySlotKeys(programmeMediaSlotKeys),
    getProgrammeRatioSettings(),
    getWebsiteContentSettings(),
  ]);

  const programmeListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": site.url + "/programmes#programme-list",
    name: "Preschool Programmes at Kidzee Sector 12 Dwarka",
    description:
      "Age-appropriate preschool programmes for children between 2 and 6 years at Kidzee Sector 12, Dwarka.",
    numberOfItems: programmes.length,
    itemListElement: programmes.map((programme, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: programme.title,
      url: site.url + "/programmes/" + programme.slug,
    })),
  };

  const programmesPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": site.url + "/programmes#webpage",
    name: "Preschool Programmes in Sector 12 Dwarka",
    description:
      "Playgroup, Nursery, Junior KG and Senior KG programmes at Kidzee Sector 12, Dwarka.",
    url: site.url + "/programmes",
    isPartOf: { "@id": site.url + "/#website" },
    about: { "@id": site.url + "/#preschool" },
    mainEntity: { "@id": site.url + "/programmes#programme-list" },
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
        name: "Programmes",
        item: site.url + "/programmes",
      },
    ],
  };

  const structuredData = JSON.stringify([
    programmeListSchema,
    programmesPageSchema,
    breadcrumbSchema,
  ]).replace(/</g, "\\u003c");

  return (
    <PageShell>
      <main className="overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />

        <ProgrammesHero
          imageUrl={media["programmes.hero.main"]?.imageUrl ?? undefined}
          imageAlt={media["programmes.hero.main"]?.altText || undefined}
          heading={contentSettings.programmesHeroHeading}
          headingHighlight={contentSettings.programmesHeroHighlight}
          introduction={contentSettings.programmesHeroIntro}
        />

        <ProgrammeCards
          images={{
            playgroup: {
              imageUrl:
                media["programmes.cards.playgroup"]?.imageUrl ?? undefined,
              imageAlt:
                media["programmes.cards.playgroup"]?.altText || undefined,
            },
            nursery: {
              imageUrl:
                media["programmes.cards.nursery"]?.imageUrl ?? undefined,
              imageAlt:
                media["programmes.cards.nursery"]?.altText || undefined,
            },
            "junior-kg": {
              imageUrl:
                media["programmes.cards.junior-kg"]?.imageUrl ?? undefined,
              imageAlt:
                media["programmes.cards.junior-kg"]?.altText || undefined,
            },
            "senior-kg": {
              imageUrl:
                media["programmes.cards.senior-kg"]?.imageUrl ?? undefined,
              imageAlt:
                media["programmes.cards.senior-kg"]?.altText || undefined,
            },
          }}
        />

        <ProgrammeApproach
          imageUrl={media["programmes.approach.main"]?.imageUrl ?? undefined}
          imageAlt={media["programmes.approach.main"]?.altText || undefined}
        />

        <ProgrammeFAQ
          youngGroupChildrenPerTeacher={
            ratioSettings.youngGroupChildrenPerTeacher
          }
          kindergartenChildrenPerTeacher={
            ratioSettings.kindergartenChildrenPerTeacher
          }
        />
      </main>
    </PageShell>
  );
}
