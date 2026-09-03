import "server-only";

import { cache } from "react";

import { sanityServerClient } from "@/lib/sanity/serverClient";

export type PublicWebsiteTrackingSettings = {
  googleTagManagerId: string;
  googleAnalyticsId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  metaPixelId: string;
  googleSearchConsoleVerification: string;
  bingWebmasterVerification: string;
  analyticsEnabled: boolean;
  advertisingEnabled: boolean;
  metaPixelEnabled: boolean;
};

type StoredWebsiteTrackingSettings = Partial<
  PublicWebsiteTrackingSettings
>;

export const emptyWebsiteTrackingSettings: PublicWebsiteTrackingSettings = {
  googleTagManagerId: "",
  googleAnalyticsId: "",
  googleAdsId: "",
  googleAdsConversionLabel: "",
  metaPixelId: "",
  googleSearchConsoleVerification: "",
  bingWebmasterVerification: "",
  analyticsEnabled: false,
  advertisingEnabled: false,
  metaPixelEnabled: false,
};

function validatedValue(
  value: unknown,
  pattern: RegExp,
  maximumLength: number,
) {
  if (typeof value !== "string") {
    return "";
  }

  const cleaned = value.trim().slice(0, maximumLength);

  return pattern.test(cleaned) ? cleaned : "";
}

function prepareSettings(
  stored: StoredWebsiteTrackingSettings | null,
): PublicWebsiteTrackingSettings {
  const source = stored ?? {};
  const enabled = (storedValue: unknown, environmentName: string) =>
    typeof storedValue === "boolean"
      ? storedValue
      : process.env[environmentName]?.trim().toLowerCase() === "true";

  const googleTagManagerId = validatedValue(
    source.googleTagManagerId || process.env.NEXT_PUBLIC_GTM_ID,
    /^GTM-[A-Z0-9]{4,20}$/,
    30,
  );
  const googleAnalyticsId = validatedValue(
    source.googleAnalyticsId || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
    /^G-[A-Z0-9]{4,20}$/,
    30,
  );
  const googleAdsId = validatedValue(
    source.googleAdsId || process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "AW-17974378144",
    /^AW-\d{5,20}$/,
    30,
  );
  const googleAdsConversionLabel = validatedValue(
    source.googleAdsConversionLabel || process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL,
    /^[A-Za-z0-9_-]{1,100}$/,
    100,
  );
  const metaPixelId = validatedValue(
    source.metaPixelId || process.env.NEXT_PUBLIC_META_PIXEL_ID,
    /^\d{5,30}$/,
    30,
  );
  const googleSearchConsoleVerification = validatedValue(
    source.googleSearchConsoleVerification || process.env.GOOGLE_SITE_VERIFICATION,
    /^[A-Za-z0-9._:+/=-]{5,220}$/,
    220,
  );
  const bingWebmasterVerification = validatedValue(
    source.bingWebmasterVerification || process.env.BING_SITE_VERIFICATION,
    /^[A-Za-z0-9._:+/=-]{5,220}$/,
    220,
  );

  return {
    googleTagManagerId,
    googleAnalyticsId,
    googleAdsId,
    googleAdsConversionLabel,
    metaPixelId,
    googleSearchConsoleVerification,
    bingWebmasterVerification,
    analyticsEnabled:
      enabled(source.analyticsEnabled, "WEBSITE_ANALYTICS_ENABLED") &&
      Boolean(googleTagManagerId || googleAnalyticsId),
    advertisingEnabled:
      enabled(source.advertisingEnabled, "WEBSITE_ADVERTISING_ENABLED") && Boolean(googleAdsId),
    metaPixelEnabled:
      enabled(source.metaPixelEnabled, "WEBSITE_META_PIXEL_ENABLED") && Boolean(metaPixelId),
  };
}

async function loadWebsiteTrackingSettings(): Promise<PublicWebsiteTrackingSettings> {
  try {
    const settings =
      await sanityServerClient.fetch<StoredWebsiteTrackingSettings | null>(
        `*[
          _id == "website-tracking-settings" &&
          _type == "websiteTrackingSettings"
        ][0] {
          googleTagManagerId,
          googleAnalyticsId,
          googleAdsId,
          googleAdsConversionLabel,
          metaPixelId,
          googleSearchConsoleVerification,
          bingWebmasterVerification,
          analyticsEnabled,
          advertisingEnabled,
          metaPixelEnabled
        }`,
      );

    return prepareSettings(settings);
  } catch {
    console.error("Unable to load the public website tracking settings.");

    return { ...emptyWebsiteTrackingSettings };
  }
}

export const getWebsiteTrackingSettings = cache(
  loadWebsiteTrackingSettings,
);
