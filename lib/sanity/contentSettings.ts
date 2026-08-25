import "server-only";

import { cache } from "react";

import { sanityServerClient } from "@/lib/sanity/serverClient";

export type WebsiteContentSettings = {
  academicYear: string;
  admissionsOpen: boolean;
  homeHeroAutoRotate: boolean;
  homeHeroRotationSeconds: number;
  homeHeroHeading: string;
  homeHeroHighlight: string;
  homeHeroLead: string;
  homeHeroSupport: string;
  aboutHeroHeading: string;
  aboutHeroHighlight: string;
  aboutHeroIntro: string;
  programmesHeroHeading: string;
  programmesHeroHighlight: string;
  programmesHeroIntro: string;
  daycareHeroHeading: string;
  daycareHeroHighlight: string;
  daycareHeroIntro: string;
  admissionsHeroHeading: string;
  admissionsHeroIntro: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  updatedAt: string | null;
};

export const defaultWebsiteContentSettings: WebsiteContentSettings = {
  academicYear: "2026–27",
  admissionsOpen: true,
  homeHeroAutoRotate: true,
  homeHeroRotationSeconds: 5,
  homeHeroHeading: "Kidzee Preschool & Daycare in",
  homeHeroHighlight: "Sector 12, Dwarka.",
  homeHeroLead:
    "Playgroup to Senior KG for children aged 2–6 years, with trusted daycare support until 7:00 PM.",
  homeHeroSupport:
    "Children learn through stories, conversation, movement, art and play, supported by teachers who help them settle at their own pace.",
  aboutHeroHeading: "A preschool where children feel known and",
  aboutHeroHighlight: "ready to grow.",
  aboutHeroIntro:
    "At our Sector 12B, Dwarka centre, purposeful play, patient teachers and familiar routines help children build confidence, communication and independence at their own pace.",
  programmesHeroHeading: "Preschool programmes that",
  programmesHeroHighlight: "grow with your child",
  programmesHeroIntro:
    "From Playgroup to Senior KG, every stage combines guided play, conversation, movement and hands-on learning—helping children build skills without losing the joy of childhood.",
  daycareHeroHeading: "Daycare that works around",
  daycareHeroHighlight: "real family routines.",
  daycareHeroIntro:
    "Choose occasional, selected-day or regular daycare with a calm afternoon routine, supervised play, rest and homework support until 7:00 PM.",
  admissionsHeroHeading:
    "Preschool admissions, made simpler for your family.",
  admissionsHeroIntro:
    "Tell us what you are looking for, visit the centre and meet the team before you decide. We will help you understand the right programme and the next steps without rushing you.",
  primaryCtaLabel: "Book a School Visit",
  secondaryCtaLabel: "Call Admissions",
  updatedAt: null,
};

type StoredWebsiteContentSettings = Partial<WebsiteContentSettings>;

function cleanStoredText(
  value: unknown,
  fallback: string,
  maximumLength: number,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  const cleaned = value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);

  return cleaned || fallback;
}

function prepareSettings(
  stored: StoredWebsiteContentSettings | null,
): WebsiteContentSettings {
  if (!stored) {
    return { ...defaultWebsiteContentSettings };
  }

  return {
    academicYear: cleanStoredText(
      stored.academicYear,
      defaultWebsiteContentSettings.academicYear,
      20,
    ),
    admissionsOpen: stored.admissionsOpen !== false,
    homeHeroAutoRotate: stored.homeHeroAutoRotate !== false,
    homeHeroRotationSeconds:
      typeof stored.homeHeroRotationSeconds === "number" &&
      Number.isInteger(stored.homeHeroRotationSeconds) &&
      stored.homeHeroRotationSeconds >= 3 &&
      stored.homeHeroRotationSeconds <= 60
        ? stored.homeHeroRotationSeconds
        : defaultWebsiteContentSettings.homeHeroRotationSeconds,
    homeHeroHeading: cleanStoredText(
      stored.homeHeroHeading,
      defaultWebsiteContentSettings.homeHeroHeading,
      100,
    ),
    homeHeroHighlight: cleanStoredText(
      stored.homeHeroHighlight,
      defaultWebsiteContentSettings.homeHeroHighlight,
      70,
    ),
    homeHeroLead: cleanStoredText(
      stored.homeHeroLead,
      defaultWebsiteContentSettings.homeHeroLead,
      220,
    ),
    homeHeroSupport: cleanStoredText(
      stored.homeHeroSupport,
      defaultWebsiteContentSettings.homeHeroSupport,
      260,
    ),
    aboutHeroHeading: cleanStoredText(
      stored.aboutHeroHeading,
      defaultWebsiteContentSettings.aboutHeroHeading,
      110,
    ),
    aboutHeroHighlight: cleanStoredText(
      stored.aboutHeroHighlight,
      defaultWebsiteContentSettings.aboutHeroHighlight,
      70,
    ),
    aboutHeroIntro: cleanStoredText(
      stored.aboutHeroIntro,
      defaultWebsiteContentSettings.aboutHeroIntro,
      280,
    ),
    programmesHeroHeading: cleanStoredText(
      stored.programmesHeroHeading,
      defaultWebsiteContentSettings.programmesHeroHeading,
      110,
    ),
    programmesHeroHighlight: cleanStoredText(
      stored.programmesHeroHighlight,
      defaultWebsiteContentSettings.programmesHeroHighlight,
      70,
    ),
    programmesHeroIntro: cleanStoredText(
      stored.programmesHeroIntro,
      defaultWebsiteContentSettings.programmesHeroIntro,
      280,
    ),
    daycareHeroHeading: cleanStoredText(
      stored.daycareHeroHeading,
      defaultWebsiteContentSettings.daycareHeroHeading,
      110,
    ),
    daycareHeroHighlight: cleanStoredText(
      stored.daycareHeroHighlight,
      defaultWebsiteContentSettings.daycareHeroHighlight,
      70,
    ),
    daycareHeroIntro: cleanStoredText(
      stored.daycareHeroIntro,
      defaultWebsiteContentSettings.daycareHeroIntro,
      280,
    ),
    admissionsHeroHeading: cleanStoredText(
      stored.admissionsHeroHeading,
      defaultWebsiteContentSettings.admissionsHeroHeading,
      130,
    ),
    admissionsHeroIntro: cleanStoredText(
      stored.admissionsHeroIntro,
      defaultWebsiteContentSettings.admissionsHeroIntro,
      280,
    ),
    primaryCtaLabel: cleanStoredText(
      stored.primaryCtaLabel,
      defaultWebsiteContentSettings.primaryCtaLabel,
      40,
    ),
    secondaryCtaLabel: cleanStoredText(
      stored.secondaryCtaLabel,
      defaultWebsiteContentSettings.secondaryCtaLabel,
      40,
    ),
    updatedAt:
      typeof stored.updatedAt === "string" ? stored.updatedAt : null,
  };
}

async function loadWebsiteContentSettings(): Promise<WebsiteContentSettings> {
  try {
    const settings =
      await sanityServerClient.fetch<StoredWebsiteContentSettings | null>(
        `*[
          _id == "website-content-settings" &&
          _type == "websiteContentSettings"
        ][0] {
          academicYear,
          admissionsOpen,
          homeHeroAutoRotate,
          homeHeroRotationSeconds,
          homeHeroHeading,
          homeHeroHighlight,
          homeHeroLead,
          homeHeroSupport,
          aboutHeroHeading,
          aboutHeroHighlight,
          aboutHeroIntro,
          programmesHeroHeading,
          programmesHeroHighlight,
          programmesHeroIntro,
          daycareHeroHeading,
          daycareHeroHighlight,
          daycareHeroIntro,
          admissionsHeroHeading,
          admissionsHeroIntro,
          primaryCtaLabel,
          secondaryCtaLabel,
          updatedAt
        }`,
      );

    return prepareSettings(settings);
  } catch {
    console.error("Unable to load website content settings.");
    return { ...defaultWebsiteContentSettings };
  }
}

export const getWebsiteContentSettings = cache(
  loadWebsiteContentSettings,
);
