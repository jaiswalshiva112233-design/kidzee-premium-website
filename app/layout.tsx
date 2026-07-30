import type { Metadata, Viewport } from "next";
import { Nunito_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

const sans = Nunito_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-display", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Kidzee Preschool & Daycare in Sector 12 Dwarka", template: "%s | Kidzee Sector 12 Dwarka" },
  description: "A warm, safe and activity-rich preschool and daycare in Sector 12B, Dwarka. Playgroup to Senior KG, meals, transport and daycare till 7 PM.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "en_IN", url: site.url, siteName: site.shortName, title: "Kidzee Preschool & Daycare in Sector 12 Dwarka", description: "Playgroup to Senior KG, daycare till 7 PM, meals, transport and a 3-day trial.", images: [{ url: "/images/hero-main.jpg", width: 1200, height: 630, alt: site.shortName }] },
  twitter: { card: "summary_large_image", title: "Kidzee Sector 12 Dwarka", description: "Preschool and daycare in Sector 12B, Dwarka.", images: ["/images/hero-main.jpg"] },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#5b2a86" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const schema = {
    "@context": "https://schema.org", "@type": "Preschool", name: site.shortName, url: site.url,
    telephone: site.phone, email: site.email, image: `${site.url}/images/hero-main.jpg`,
    address: { "@type": "PostalAddress", streetAddress: "Building No. 19, Block B, Sector 12B", addressLocality: "Dwarka", addressRegion: "Delhi", postalCode: "110075", addressCountry: "IN" },
    openingHoursSpecification: [
      { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday"], opens: "09:30", closes: "19:00" },
      { "@type": "OpeningHoursSpecification", dayOfWeek: "Saturday", opens: "12:30", closes: "19:00" }
    ], sameAs: [site.instagram, site.facebook]
  };
  return <html lang="en" className={`${sans.variable} ${display.variable}`}><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />{children}</body></html>;
}
