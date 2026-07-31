import type { Metadata } from "next";

import PageShell from "@/components/PageShell";
import ProgrammesHero from "@/components/ProgrammesHero";
import ProgrammeOverview from "@/components/ProgrammeOverview";
import ProgrammeCards from "@/components/ProgrammeCards";
import ProgrammeApproach from "@/components/ProgrammeApproach";
import ProgrammeComparison from "@/components/ProgrammeComparison";
import ProgrammeFAQ from "@/components/ProgrammeFAQ";
import ProgrammeCTA from "@/components/ProgrammeCTA";

import { programmes } from "@/lib/site";

export const metadata: Metadata = {
  title: "Preschool Programmes in Sector 12 Dwarka",
description:
  "Explore Playgroup, Nursery, Junior KG and Senior KG programmes at Kidzee Sector 12, Dwarka. Learn about age groups, curriculum, learning approach and school readiness for children aged 2 to 6 years.",  keywords: [
    "preschool programmes in Dwarka",
    "Playgroup in Sector 12 Dwarka",
    "Nursery in Sector 12 Dwarka",
    "Junior KG in Dwarka",
    "Senior KG in Dwarka",
    "Kidzee Sector 12 programmes",
    "preschool curriculum Dwarka",
    "preschool with meals Dwarka",
    "preschool near Sector 12 Dwarka",
    "best preschool in Dwarka",
  ],
  alternates: {
    canonical: "/programmes",
  },
  openGraph: {
    title: "Preschool Programmes | Kidzee Sector 12, Dwarka",
    description:
      "Explore age-appropriate preschool programmes for children from 2 to 6 years at Kidzee Sector 12, Dwarka.",
    url: "/programmes",
    type: "website",
    images: [
      {
        url: "/images/programmes/programmes-main.jpg",
        width: 1200,
        height: 630,
        alt: "Preschool programmes at Kidzee Sector 12 Dwarka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Preschool Programmes | Kidzee Sector 12, Dwarka",
    description:
      "Playgroup, Nursery, Junior KG and Senior KG programmes for children aged 2 to 6 years.",
    images: ["/images/programmes/programmes-main.jpg"],
  },
};

export default function ProgrammesPage() {
  const programmeListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Preschool Programmes at Kidzee Sector 12 Dwarka",
    description:
      "Age-appropriate preschool programmes for children between 2 and 6 years at Kidzee Sector 12, Dwarka.",
    numberOfItems: programmes.length,
    itemListElement: programmes.map((programme, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: programme.title,
      url: `https://kidzeepreschooldwarka.com/programmes/${programme.slug}`,
    })),
  };

  const programmesPageSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Preschool Programmes in Sector 12 Dwarka",
    description:
      "Playgroup, Nursery, Junior KG and Senior KG programmes at Kidzee Sector 12, Dwarka.",
    url: "https://kidzeepreschooldwarka.com/programmes",
    isPartOf: {
      "@type": "WebSite",
      name: "Kidzee Sector 12, Dwarka",
      url: "https://kidzeepreschooldwarka.com",
    },
    about: {
      "@type": "Preschool",
      name: "Kidzee Sector 12, Dwarka",
      telephone: "+91-96670-38673",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Building No. 19, Block B, Sector 12B",
        addressLocality: "Dwarka",
        addressRegion: "Delhi",
        postalCode: "110075",
        addressCountry: "IN",
      },
    },
  };

  return (
    <PageShell>
      <main className="overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(programmeListSchema),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(programmesPageSchema),
          }}
        />

        <ProgrammesHero />
        <ProgrammeOverview />
        <ProgrammeCards />
        <ProgrammeApproach />
        <ProgrammeComparison />
        <ProgrammeFAQ />
        <ProgrammeCTA />
      </main>
    </PageShell>
  );
}