import { randomBytes } from "node:crypto";

export const CAMPAIGN_PLATFORMS = ["GOOGLE", "META", "ORGANIC", "OLX", "REFERRAL", "OTHER"] as const;
export const CAMPAIGN_PURPOSES = ["ADMISSION", "RECRUITMENT", "GENERAL"] as const;

export type CampaignPlatform = (typeof CAMPAIGN_PLATFORMS)[number];
export type CampaignPurpose = (typeof CAMPAIGN_PURPOSES)[number];

const sourceDefaults: Record<CampaignPlatform, string> = {
  GOOGLE: "google", META: "meta", ORGANIC: "organic", OLX: "olx", REFERRAL: "referral", OTHER: "other",
};
const mediumDefaults: Record<CampaignPlatform, string> = {
  GOOGLE: "paid_search", META: "paid_social", ORGANIC: "organic", OLX: "listing", REFERRAL: "referral", OTHER: "campaign",
};

export function cleanCampaignValue(value: unknown, max = 150) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max)
    : "";
}

export function isCampaignPlatform(value: string): value is CampaignPlatform {
  return CAMPAIGN_PLATFORMS.includes(value as CampaignPlatform);
}
export function isCampaignPurpose(value: string): value is CampaignPurpose {
  return CAMPAIGN_PURPOSES.includes(value as CampaignPurpose);
}

export function campaignDefaults(platform: CampaignPlatform) {
  return { source: sourceDefaults[platform], medium: mediumDefaults[platform] };
}

export function validateCampaignDestination(purpose: CampaignPurpose, destination: string) {
  const url = new URL(destination);
  const path = url.pathname.toLowerCase();
  const careers = path === "/careers" || path.startsWith("/careers/");
  if (purpose === "RECRUITMENT" && !careers) return "Recruitment campaigns must use a Careers page.";
  if (purpose === "ADMISSION" && careers) return "Admission campaigns cannot use a Careers page.";
  return null;
}

export function buildCampaignUrl(input: {
  destinationUrl: string; trackingKey?: string; utmSource: string; utmMedium: string;
  utmCampaign: string; utmContent?: string; utmTerm?: string; adSetName?: string;
}) {
  const url = new URL(input.destinationUrl);
  const key = input.trackingKey || `cmp_${Date.now().toString(36)}_${randomBytes(4).toString("hex")}`;
  url.searchParams.set("utm_source", input.utmSource);
  url.searchParams.set("utm_medium", input.utmMedium);
  url.searchParams.set("utm_campaign", input.utmCampaign);
  if (input.utmContent) url.searchParams.set("utm_content", input.utmContent);
  if (input.utmTerm) url.searchParams.set("utm_term", input.utmTerm);
  if (input.adSetName) url.searchParams.set("utm_adset", input.adSetName);
  url.searchParams.set("centreos_campaign", key);
  return { finalUrl: url.toString(), trackingKey: key };
}
