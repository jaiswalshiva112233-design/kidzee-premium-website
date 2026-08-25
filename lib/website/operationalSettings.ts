import "server-only";

import { cache } from "react";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const WEBSITE_OPERATIONS_KEY = "website-operations-v2";

export type WebsiteOperationalSettings = {
  admissionsYear: string;
  defaultCampaignName: string;
  defaultUtmSource: string;
  defaultUtmMedium: string;
  defaultUtmCampaign: string;
  monthlyGoogleAdsSpend: number;
  monthlyMetaAdsSpend: number;
  centreWording: string;
  miraKnowledge: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  noticeEnabled: boolean;
  noticeText: string;
  noticeLink: string;
};

export const DEFAULT_WEBSITE_OPERATIONS: WebsiteOperationalSettings = {
  admissionsYear: "2026-27",
  defaultCampaignName: "Admissions",
  defaultUtmSource: "",
  defaultUtmMedium: "",
  defaultUtmCampaign: "",
  monthlyGoogleAdsSpend: 0,
  monthlyMetaAdsSpend: 0,
  centreWording: "Kidzee Preschool & Daycare, Sector 12B, Dwarka",
  miraKnowledge: "",
  defaultSeoTitle: "Kidzee Preschool & Daycare in Sector 12B, Dwarka",
  defaultSeoDescription: "Kidzee preschool and daycare in Sector 12B, Dwarka for Playgroup, Nursery, Junior KG and Senior KG admissions.",
  noticeEnabled: false,
  noticeText: "",
  noticeLink: "",
};

function string(value: unknown, fallback: string, maximum: number) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : fallback;
}

function money(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0
    ? Math.round((parsed + Number.EPSILON) * 100) / 100
    : 0;
}

export function normaliseWebsiteOperations(value: unknown): WebsiteOperationalSettings {
  const source = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
  return {
    admissionsYear: string(source.admissionsYear, DEFAULT_WEBSITE_OPERATIONS.admissionsYear, 30),
    defaultCampaignName: string(source.defaultCampaignName, DEFAULT_WEBSITE_OPERATIONS.defaultCampaignName, 100),
    defaultUtmSource: string(source.defaultUtmSource, "", 100),
    defaultUtmMedium: string(source.defaultUtmMedium, "", 100),
    defaultUtmCampaign: string(source.defaultUtmCampaign, "", 160),
    monthlyGoogleAdsSpend: money(source.monthlyGoogleAdsSpend),
    monthlyMetaAdsSpend: money(source.monthlyMetaAdsSpend),
    centreWording: string(source.centreWording, DEFAULT_WEBSITE_OPERATIONS.centreWording, 240),
    miraKnowledge: string(source.miraKnowledge, "", 3_000),
    defaultSeoTitle: string(source.defaultSeoTitle, DEFAULT_WEBSITE_OPERATIONS.defaultSeoTitle, 90),
    defaultSeoDescription: string(source.defaultSeoDescription, DEFAULT_WEBSITE_OPERATIONS.defaultSeoDescription, 220),
    noticeEnabled: source.noticeEnabled === true,
    noticeText: string(source.noticeText, "", 240),
    noticeLink: string(source.noticeLink, "", 500),
  };
}

export const getWebsiteOperationalSettings = cache(async () => {
  const setting = await prisma.centreSetting.findUnique({
    where: { key: WEBSITE_OPERATIONS_KEY },
    select: { value: true },
  });
  return normaliseWebsiteOperations(setting?.value);
});

export function websiteOperationsJson(value: WebsiteOperationalSettings) {
  return value as unknown as Prisma.InputJsonValue;
}
