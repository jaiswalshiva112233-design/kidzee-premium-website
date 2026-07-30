import type { Metadata, Viewport } from "next";
import { Nunito_Sans } from "next/font/google";
import type { ReactNode } from "react";

import "./globals.css";
import { site } from "@/lib/site";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),

  title: {
    default: "Kidzee Preschool & Daycare in Sector 12 Dwarka",
    template: "%s | Kidzee Sector 12 Dwarka",
  },

  description:
    "Kidzee Preschool & Daycare in Sector 12B, Dwarka for children aged 2–6 years. Playgroup to Senior KG, daycare until 7 PM and a 3-day trial.",

  applicationName: site.shortName,
  category: "education",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: site.url,
    siteName: site.shortName,
    title: "Kidzee Preschool & Daycare in Sector 12 Dwarka",
    description:
      "Playgroup to Senior KG for children aged 2–6 years, with daycare until 7 PM in Sector 12B, Dwarka.",
    images: [
      {
        url: "/images/hero-main.jpg",
        width: 1200,
        height: 630,
        alt: "Kidzee Preschool and Daycare in Sector 12B, Dwarka",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "Kidzee Preschool & Daycare in Sector 12 Dwarka",
    description:
      "Preschool programmes for children aged 2–6 years and daycare until 7 PM in Sector 12B, Dwarka.",
    images: ["/images/hero-main.jpg"],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5B2A86",
  colorScheme: "light",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  const socialProfiles = [
    site.instagram,
    site.facebook,
    site.youtube,
  ].filter((profile): profile is string => Boolean(profile));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.shortName,
        inLanguage: "en-IN",
        publisher: {
          "@id": `${site.url}/#preschool`,
        },
      },
      {
        "@type": ["Preschool", "ChildCare"],
        "@id": `${site.url}/#preschool`,
        name: site.shortName,
        alternateName: site.name,
        url: site.url,
        image: `${site.url}/images/hero-main.jpg`,
        telephone: site.phone,
        email: site.email,
        description:
          "Preschool and daycare in Sector 12B, Dwarka offering Playgroup, Nursery, Junior KG and Senior KG programmes for children aged 2–6 years.",
        address: {
          "@type": "PostalAddress",
          streetAddress: "Building No. 19, Block B, Sector 12B",
          addressLocality: site.locality,
          addressRegion: site.region,
          postalCode: site.postalCode,
          addressCountry: site.country,
        },
        areaServed: {
          "@type": "Place",
          name: "Dwarka, New Delhi",
        },
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "https://schema.org/Monday",
              "https://schema.org/Tuesday",
              "https://schema.org/Wednesday",
              "https://schema.org/Thursday",
              "https://schema.org/Friday",
            ],
            opens: site.preschoolHours.opens,
            closes: site.daycareHours.closes,
          },
        ],
        sameAs: socialProfiles,
        parentOrganization: {
          "@type": "Organization",
          name: "Kidzee",
          url: "https://www.kidzee.com",
        },
      },
    ],
  };

  const safeStructuredData = JSON.stringify(structuredData).replace(
    /</g,
    "\\u003c"
  );

  return (
    <html lang="en">
      <body className={`${nunitoSans.variable} antialiased`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeStructuredData }}
        />

        {children}
      </body>
    </html>
  );
}