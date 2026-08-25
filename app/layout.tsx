import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import "./globals.css";
import { getWebsiteContentSettings } from "@/lib/sanity/contentSettings";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { getWebsiteTrackingSettings } from "@/lib/sanity/websiteSettings";
import { programmes, site } from "@/lib/site";
import { buildSiteContact } from "@/lib/siteContact";
import MiraLauncher from "@/components/mira/MiraLauncher";
import SiteContactProvider from "@/components/SiteContactProvider";
import { getWebsiteOperationalSettings } from "@/lib/website/operationalSettings";

const defaultTitle = "Kidzee Preschool & Daycare in Sector 12 Dwarka";

function createDefaultDescription(academicYear: string) {
  return `Kidzee Preschool and daycare in Sector 12B, Dwarka for children aged ${site.ageRange.display}. Explore Playgroup to Senior KG, daycare until 7 PM and admissions for ${academicYear}.`;
}

const socialImage = "/images/hero/hero-main.jpg";

function createMetadata(titleValue: string, defaultDescription: string): Metadata {
  return {
  metadataBase: new URL(site.url),

  title: {
    default: titleValue,
    template: "%s | Kidzee Sector 12 Dwarka",
  },

  description: defaultDescription,

  applicationName: site.shortName,
  category: "education",
  creator: site.shortName,
  publisher: site.shortName,

  keywords: [
    "preschool in Dwarka",
    "preschool in Sector 12 Dwarka",
    "play school in Dwarka",
    "Kidzee Sector 12 Dwarka",
    "nursery school in Dwarka",
    "kindergarten in Dwarka",
    "daycare in Dwarka",
    "daycare in Sector 12 Dwarka",
    "Playgroup in Dwarka",
    "Nursery in Dwarka",
    "Junior KG in Dwarka",
    "Senior KG in Dwarka",
  ],

  alternates: {
    canonical: "/",
  },

  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon.ico",
  },

  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },

  openGraph: {
    type: "website",
    locale: "en_IN",
    url: site.url,
    siteName: site.shortName,
    title: titleValue,
    description: defaultDescription,
    images: [
      {
        url: socialImage,
        width: 1200,
        height: 630,
        alt: "Kidzee Preschool and Daycare in Sector 12B, Dwarka",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [socialImage],
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const [contentSettings, operationalSettings] = await Promise.all([
    getWebsiteContentSettings(),
    getWebsiteOperationalSettings(),
  ]);
  return createMetadata(
    operationalSettings.defaultSeoTitle || defaultTitle,
    operationalSettings.defaultSeoDescription || createDefaultDescription(contentSettings.academicYear),
  );
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#5B2A86",
  colorScheme: "light",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

const weekdays = [
  "https://schema.org/Monday",
  "https://schema.org/Tuesday",
  "https://schema.org/Wednesday",
  "https://schema.org/Thursday",
  "https://schema.org/Friday",
];

export default async function RootLayout({
  children,
}: RootLayoutProps) {
  const [trackingSettings, contentSettings, contactSettings] = await Promise.all([
    getWebsiteTrackingSettings(),
    getWebsiteContentSettings(),
    getWebsiteContactSettings(),
  ]);
  const contact = buildSiteContact(contactSettings);
  const defaultDescription = createDefaultDescription(
    contentSettings.academicYear,
  );

  const socialProfiles = [
    contact.instagram,
    contact.facebook,
    contact.youtube,
  ].filter((profile): profile is string => Boolean(profile));

  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${site.url}/#website`,
        url: site.url,
        name: site.shortName,
        alternateName: site.name,
        description: defaultDescription,
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
        logo: {
          "@type": "ImageObject",
          url: `${site.url}/images/kidzee-logo.png`,
        },
        image: [
          `${site.url}/images/hero/hero-main.jpg`,
          `${site.url}/images/hero/hero-building.jpg`,
          `${site.url}/images/hero/hero-classroom.jpg`,
        ],
        telephone: contact.phone,
        email: contact.email,
        description:
          `Kidzee preschool and daycare in Sector 12B, Dwarka offering Playgroup, Nursery, Junior KG and Senior KG programmes for children aged ${site.ageRange.display}.`,
        address: {
          "@type": "PostalAddress",
          streetAddress: contact.address,
          addressLocality: site.locality,
          addressRegion: site.region,
          postalCode: site.postalCode,
          addressCountry: site.country,
        },
        areaServed: [
          {
            "@type": "Place",
            name: "Sector 12, Dwarka",
          },
          {
            "@type": "Place",
            name: "Dwarka, New Delhi",
          },
        ],
        hasMap: contact.map,
        openingHoursSpecification: [
          {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: weekdays,
            opens: contact.preschoolHours.opens,
            closes: contact.daycareHours.closes,
          },
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "admissions",
          telephone: contact.phone,
          email: contact.email,
          areaServed: "IN",
        },
        hasOfferCatalog: {
          "@type": "OfferCatalog",
          name: "Preschool and daycare programmes",
          itemListElement: [
            ...programmes.map((programme) => ({
              "@type": "Offer",
              itemOffered: {
                "@type": "EducationalOccupationalProgram",
                name: programme.title,
                description: programme.intro,
                url: `${site.url}/programmes/${programme.slug}`,
              },
            })),
            {
              "@type": "Offer",
              itemOffered: {
                "@type": "Service",
                name: "Daycare",
                description:
                  "Weekday daycare in Sector 12B, Dwarka with flexible care options until 7 PM.",
                url: `${site.url}/daycare`,
              },
            },
          ],
        },
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
    "\\u003c",
  );

  return (
    <html lang="en-IN">
      <head>
        {trackingSettings.googleSearchConsoleVerification ? (
          <meta
            name="google-site-verification"
            content={trackingSettings.googleSearchConsoleVerification}
          />
        ) : null}

        {trackingSettings.bingWebmasterVerification ? (
          <meta
            name="msvalidate.01"
            content={trackingSettings.bingWebmasterVerification}
          />
        ) : null}
      </head>

      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeStructuredData }}
        />

        <SiteContactProvider settings={contactSettings}>
          {children}
          <MiraLauncher />
        </SiteContactProvider>
      </body>
    </html>
  );
}
