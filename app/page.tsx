import type { Metadata } from "next";

import Daycare from "@/components/Daycare";
import FAQ from "@/components/FAQ";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import HomeTeamPreview from "@/components/HomeTeamPreview";
import Location from "@/components/Location";
import PageShell from "@/components/PageShell";
import Programs from "@/components/Programs";
import Reviews from "@/components/Reviews";
import TrustBar from "@/components/TrustBar";
import WhyChooseUs from "@/components/WhyChooseUs";
import { buildWebsitePageMetadata } from "@/lib/sanity/seo";
import {
  getFeaturedWebsiteTeamMembers,
  getWebsiteTeamSettings,
} from "@/lib/sanity/team";

export async function generateMetadata(): Promise<Metadata> {
  return buildWebsitePageMetadata({
    pageKey: "home",
    path: "/",
    title: "Kidzee Preschool & Daycare in Sector 12 Dwarka",
    description:
      "Explore Playgroup, Nursery, Junior KG, Senior KG and daycare until 7 PM at Kidzee Preschool in Sector 12B, Dwarka. Book a school visit.",
    keywords: [
      "preschool in Dwarka",
      "preschool in Sector 12 Dwarka",
      "Kidzee Sector 12 Dwarka",
      "play school in Dwarka",
      "nursery school in Dwarka",
      "daycare in Dwarka",
      "daycare in Sector 12 Dwarka",
      "preschool admissions in Dwarka",
    ],
    socialImage: "/images/landing/kidzee-creative-learning.jpg",
    socialImageAlt:
      "Children learning through creative craft at Kidzee Preschool Sector 12 Dwarka",
  });
}

export default async function HomePage() {
  const [featuredTeamMembers, teamSettings] = await Promise.all([
    getFeaturedWebsiteTeamMembers(9),
    getWebsiteTeamSettings(),
  ]);

  return (
    <PageShell>
      <main className="overflow-hidden">
        <Hero />
        <TrustBar />
        <Programs />
        <WhyChooseUs />
        <HomeTeamPreview
          members={featuredTeamMembers}
          movementSpeed={teamSettings.movementSpeed}
        />
        <Daycare />
        <Gallery />
        <Reviews />
        <FAQ />
        <Location />
      </main>
    </PageShell>
  );
}
