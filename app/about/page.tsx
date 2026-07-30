import type { Metadata } from "next";

import AboutCTA from "@/components/AboutCTA";
import AboutEnvironment from "@/components/AboutEnvironment";
import AboutFacilities from "@/components/AboutFacilities";
import AboutHero from "@/components/AboutHero";
import AboutKidzee from "@/components/AboutKidzee";
import AboutSafety from "@/components/AboutSafety";
import AboutWelcome from "@/components/AboutWelcome";
import PageShell from "@/components/PageShell";

export const metadata: Metadata = {
  title: "About Kidzee Preschool in Sector 12 Dwarka",
  description:
    "Learn about Kidzee Preschool & Daycare in Sector 12B, Dwarka, our learning approach, classroom environment, facilities, safety practices and partnership with parents.",
  keywords: [
    "Kidzee Sector 12 Dwarka",
    "Kidzee Sector 12B Dwarka",
    "preschool in Dwarka",
    "preschool in Sector 12 Dwarka",
    "best preschool in Dwarka",
    "daycare in Dwarka",
    "daycare in Sector 12 Dwarka",
    "play school in Dwarka",
    "nursery school in Dwarka",
    "early childhood education Dwarka",
    "preschool admission Dwarka",
  ],
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: "About Kidzee Preschool & Daycare, Sector 12 Dwarka",
    description:
      "Discover the child-friendly learning environment, facilities, safety practices and early-learning approach at Kidzee Sector 12, Dwarka.",
    url: "/about",
    siteName: "Kidzee Preschool & Daycare Sector 12 Dwarka",
    type: "website",
    locale: "en_IN",
    images: [
      {
        url: "/images/about/about-hero.jpg",
        width: 1200,
        height: 630,
        alt: "Kidzee Preschool and Daycare Sector 12 Dwarka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "About Kidzee Preschool & Daycare, Sector 12 Dwarka",
    description:
      "Explore our learning approach, classrooms, facilities, safety practices and daycare environment in Sector 12B, Dwarka.",
    images: ["/images/about/about-hero.jpg"],
  },
};

const aboutPageSchema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About Kidzee Preschool & Daycare Sector 12 Dwarka",
  description:
    "Information about Kidzee Preschool & Daycare in Sector 12B, Dwarka, including its learning approach, classrooms, facilities, safety practices, preschool programmes and daycare services.",
  url: "https://kidzeepreschooldwarka.com/about",
  primaryImageOfPage: {
    "@type": "ImageObject",
    url: "https://kidzeepreschooldwarka.com/images/about/about-hero.jpg",
  },
  isPartOf: {
    "@type": "WebSite",
    name: "Kidzee Preschool & Daycare Sector 12 Dwarka",
    url: "https://kidzeepreschooldwarka.com",
  },
  about: {
    "@type": ["Preschool", "EducationalOrganization"],
    name: "Kidzee Preschool & Daycare Sector 12 Dwarka",
    url: "https://kidzeepreschooldwarka.com",
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

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: "https://kidzeepreschooldwarka.com",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "About Us",
      item: "https://kidzeepreschooldwarka.com/about",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Where is Kidzee Sector 12, Dwarka located?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Kidzee Preschool and Daycare is located at Building No. 19, Block B, Sector 12B, Dwarka, Delhi 110075.",
      },
    },
    {
      "@type": "Question",
      name: "Which preschool programmes are available?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The centre offers Playgroup for children aged 2 to 3 years, Nursery for 3 to 4 years, Junior KG for 4 to 5 years and Senior KG for 5 to 6 years.",
      },
    },
    {
      "@type": "Question",
      name: "What is the teacher-child ratio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The teacher-child ratio is 1:8 for Playgroup and Nursery, and 1:10 for Junior KG and Senior KG.",
      },
    },
    {
      "@type": "Question",
      name: "Does Kidzee Sector 12 Dwarka provide daycare?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Daycare is available after preschool hours and continues until 7:00 PM.",
      },
    },
    {
      "@type": "Question",
      name: "Are meals included in the preschool fee?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Preschool meals are included in the monthly preschool fee.",
      },
    },
    {
      "@type": "Question",
      name: "Are trial classes available before admission?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. A three-day trial programme is available so children can experience the classroom, teachers and daily routine before regular admission.",
      },
    },
  ],
};

export default function AboutPage() {
  return (
    <PageShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(aboutPageSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqSchema),
        }}
      />

      <main className="overflow-hidden">
        <AboutHero />
        <AboutWelcome />
        <AboutKidzee />
        <AboutEnvironment />
        <AboutSafety />
        <AboutFacilities />
        <AboutCTA />
      </main>
    </PageShell>
  );
}