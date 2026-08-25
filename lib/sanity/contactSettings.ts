import "server-only";

import { cache } from "react";

import {
  defaultSiteContactSettings,
  type SiteContactSettings,
} from "@/lib/siteContact";
import { sanityServerClient } from "@/lib/sanity/serverClient";

type StoredContactSettings = Partial<SiteContactSettings>;

function cleanText(
  value: unknown,
  maximumLength: number,
  fallback: string,
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

function cleanPhone(value: unknown) {
  if (typeof value !== "string") {
    return defaultSiteContactSettings.phone;
  }

  const digits = value.replace(/\D/g, "");

  return digits.length >= 10 && digits.length <= 15
    ? `+${digits}`
    : defaultSiteContactSettings.phone;
}

function cleanEmail(value: unknown) {
  const cleaned =
    typeof value === "string"
      ? value.trim().toLowerCase().slice(0, 180)
      : "";

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleaned)
    ? cleaned
    : defaultSiteContactSettings.email;
}

function cleanHttpsUrl(
  value: unknown,
  fallback: string,
) {
  if (typeof value !== "string") {
    return fallback;
  }

  try {
    const url = new URL(value.trim());

    return url.protocol === "https:"
      ? url.toString()
      : fallback;
  } catch {
    return fallback;
  }
}

function cleanOptionalHttpsUrl(value: unknown) {
  if (typeof value !== "string" || !value.trim()) {
    return "";
  }

  return cleanHttpsUrl(value, "");
}

function cleanTime(value: unknown, fallback: string) {
  const cleaned =
    typeof value === "string" ? value.trim() : "";

  return /^([01]\d|2[0-3]):[0-5]\d$/.test(cleaned)
    ? cleaned
    : fallback;
}

function prepareContactSettings(
  stored: StoredContactSettings | null,
): SiteContactSettings {
  const fallback = defaultSiteContactSettings;

  if (!stored) {
    return { ...fallback };
  }

  return {
    phone: cleanPhone(stored.phone),
    phoneDisplay: cleanText(
      stored.phoneDisplay,
      40,
      fallback.phoneDisplay,
    ),
    email: cleanEmail(stored.email),
    address: cleanText(
      stored.address,
      260,
      fallback.address,
    ),
    addressShort: cleanText(
      stored.addressShort,
      180,
      fallback.addressShort,
    ),
    map: cleanHttpsUrl(stored.map, fallback.map),
    mapEmbed: cleanHttpsUrl(
      stored.mapEmbed,
      fallback.mapEmbed,
    ),
    googleReviews: cleanHttpsUrl(
      stored.googleReviews,
      fallback.googleReviews,
    ),
    instagram: cleanOptionalHttpsUrl(stored.instagram),
    facebook: cleanOptionalHttpsUrl(stored.facebook),
    youtube: cleanOptionalHttpsUrl(stored.youtube),
    preschoolDays: cleanText(
      stored.preschoolDays,
      80,
      fallback.preschoolDays,
    ),
    preschoolOpens: cleanTime(
      stored.preschoolOpens,
      fallback.preschoolOpens,
    ),
    preschoolCloses: cleanTime(
      stored.preschoolCloses,
      fallback.preschoolCloses,
    ),
    daycareDays: cleanText(
      stored.daycareDays,
      80,
      fallback.daycareDays,
    ),
    daycareOpens: cleanTime(
      stored.daycareOpens,
      fallback.daycareOpens,
    ),
    daycareCloses: cleanTime(
      stored.daycareCloses,
      fallback.daycareCloses,
    ),
  };
}

async function loadWebsiteContactSettings(): Promise<SiteContactSettings> {
  try {
    const settings =
      await sanityServerClient.fetch<StoredContactSettings | null>(
        `*[
          _id == "website-contact-settings" &&
          _type == "websiteContactSettings"
        ][0] {
          phone,
          phoneDisplay,
          email,
          address,
          addressShort,
          map,
          mapEmbed,
          googleReviews,
          instagram,
          facebook,
          youtube,
          preschoolDays,
          preschoolOpens,
          preschoolCloses,
          daycareDays,
          daycareOpens,
          daycareCloses
        }`,
        {},
        {
          cache: "no-store",
        },
      );

    return prepareContactSettings(settings);
  } catch {
    console.error("Unable to load public website contact settings.");

    return { ...defaultSiteContactSettings };
  }
}



export const getWebsiteContactSettings = cache(
  loadWebsiteContactSettings,
);
