import type { Metadata } from "next";

import About from "@/components/About";
import AdmissionProcess from "@/components/AdmissionProcess";
import CTA from "@/components/CTA";
import Daycare from "@/components/Daycare";
import FAQ from "@/components/FAQ";
import Facilities from "@/components/Facilities";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import PageShell from "@/components/PageShell";
import Programs from "@/components/Programs";
import Reviews from "@/components/Reviews";
import WhyChooseUs from "@/components/WhyChooseUs";

import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Preschool & Daycare in Sector 12 Dwarka",
  description:
    "Kidzee Preschool & Daycare in Sector 12B, Dwarka offers Playgroup, Nursery, Junior KG and Senior KG programmes, meals, transport, daycare until 7 PM and a 3-day trial.",

  keywords: [
    "preschool in Dwarka",
    "preschool in Sector 12 Dwarka",
    "preschool in Sector 12B Dwarka",
    "Kidzee Sector 12 Dwarka",
    "Kidzee Sector 12B Dwarka",
    "daycare in Dwarka",
    "daycare in Sector 12 Dwarka",
    "play school in Dwarka",
    "nursery school in Dwarka",
    "Playgroup in Dwarka",
    "Nursery in Dwarka",
    "Junior KG in Dwarka",
    "Senior KG in Dwarka",
    "preschool near Sector 12 Dwarka",
  ],

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Kidzee Preschool & Daycare in Sector 12 Dwarka",
    description:
      "A warm and activity-rich preschool and daycare in Sector 12B, Dwarka for children aged 2 to 6 years.",
    url: "/",
    siteName: site.shortName,
    type: "website",
    locale: "en_IN",

    images: [
      {
        url: "/images/hero-main.jpg",
        width: 1200,
        height: 630,
        alt: "Kidzee Preschool and Daycare in Sector 12B Dwarka",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kidzee Preschool & Daycare in Sector 12 Dwarka",
    description:
      "Playgroup to Senior KG, meals, transport, daycare until 7 PM and a 3-day preschool trial.",
    images: ["/images/hero-main.jpg"],
  },
};

const preschoolSchema = {
  "@context": "https://schema.org",
  "@type": ["Preschool", "ChildCare"],
  "@id": `${site.url}/#preschool`,
  name: site.shortName,
  legalName: site.name,
  url: site.url,
  telephone: site.phone,
  email: site.email,
  image: `${site.url}/images/hero-main.jpg`,
  logo: `${site.url}/images/kidzee-logo.png`,
  description:
    "Kidzee Preschool and Daycare in Sector 12B, Dwarka offering Playgroup, Nursery, Junior KG, Senior KG and daycare for children aged 2 to 6 years.",
  priceRange: "₹₹",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Building No. 19, Block B, Sector 12B",
    addressLocality: "Dwarka",
    addressRegion: "Delhi",
    postalCode: "110075",
    addressCountry: "IN",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: site.phone,
    contactType: "admissions",
    areaServed: "Dwarka, New Delhi",
    availableLanguage: ["English", "Hindi"],
  },
  sameAs: [site.instagram, site.facebook],
  hasOfferCatalog: {
    "@type": "OfferCatalog",
    name: "Preschool and Daycare Programmes",
    itemListElement: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Course",
          name: "Playgroup Programme",
          description:
            "Preschool programme for children aged 2 to 3 years.",
          provider: {
            "@id": `${site.url}/#preschool`,
          },
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Course",
          name: "Nursery Programme",
          description:
            "Preschool programme for children aged 3 to 4 years.",
          provider: {
            "@id": `${site.url}/#preschool`,
          },
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Course",
          name: "Junior KG Programme",
          description:
            "Kindergarten programme for children aged 4 to 5 years.",
          provider: {
            "@id": `${site.url}/#preschool`,
          },
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Course",
          name: "Senior KG Programme",
          description:
            "School-readiness programme for children aged 5 to 6 years.",
          provider: {
            "@id": `${site.url}/#preschool`,
          },
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: "Daycare Programme",
          description:
            "Supervised daycare in Sector 12B, Dwarka from 12:30 PM to 7:00 PM.",
          provider: {
            "@id": `${site.url}/#preschool`,
          },
        },
      },
    ],
  },
};

const webPageSchema = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "@id": `${site.url}/#webpage`,
  url: site.url,
  name: "Preschool & Daycare in Sector 12 Dwarka",
  description:
    "Kidzee Preschool and Daycare in Sector 12B, Dwarka for children aged 2 to 6 years.",
  isPartOf: {
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: site.shortName,
    url: site.url,
  },
  about: {
    "@id": `${site.url}/#preschool`,
  },
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: `${site.url}/images/hero-main.jpg`,
  },
};

export default function HomePage() {
  return (
    <PageShell>
      <main className="overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([preschoolSchema, webPageSchema]),
          }}
        />

        <Hero />

        <About />

        <Programs />

        <Daycare />

        <WhyChooseUs />

        <Facilities />

        <Gallery />

        <Reviews />

        <AdmissionProcess />

        <FAQ />

        <CTA />
      </main>
    </PageShell>
  );
}