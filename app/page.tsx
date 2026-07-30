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
import TrustBar from "@/components/TrustBar";
import WhyChooseUs from "@/components/WhyChooseUs";

import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Preschool & Daycare in Sector 12 Dwarka",
  description:
    "Kidzee Preschool & Daycare in Sector 12B, Dwarka offers Playgroup, Nursery, Junior KG, Senior KG and daycare until 7 PM for children aged 2 to 6 years.",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Kidzee Preschool & Daycare in Sector 12 Dwarka",
    description:
      "Explore preschool programmes, daycare, facilities and admission support at Kidzee Sector 12B, Dwarka.",
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
      "Preschool programmes and daycare for children aged 2 to 6 years in Sector 12B, Dwarka.",
    images: ["/images/hero-main.jpg"],
  },
};

export default function HomePage() {
  return (
    <PageShell>
      <main className="overflow-hidden">
        <Hero />

        <TrustBar />

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