"use client";

export type AttributionTouch = {
  pageUrl: string;
  landingPage: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  adGroup: string;
  adSet: string;
  adId: string;
  device: string;
  gclid: string;
  gbraid: string;
  wbraid: string;
  fbclid: string;
  fbc: string;
  fbp: string;
  campaignTrackingKey: string;
  capturedAt: string;
};

export type PersistentAttribution = {
  version: 2;
  firstTouch: AttributionTouch;
  lastTouch: AttributionTouch;
};

const STORAGE_KEY = "kidzee-persistent-attribution-v2";
const LEGACY_KEY = "kidzee-first-touch-attribution";

function readCookie(name: string) {
  const prefix = `${name}=`;
  const value = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));
  return value ? decodeURIComponent(value.slice(prefix.length)).slice(0, 250) : "";
}

function clean(value: unknown, max = 500) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max)
    : "";
}

function validTouch(value: unknown): value is AttributionTouch {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AttributionTouch>;
  return typeof candidate.landingPage === "string" && typeof candidate.capturedAt === "string";
}

function readStored() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null") as Partial<PersistentAttribution> | null;
    if (parsed?.version === 2 && validTouch(parsed.firstTouch) && validTouch(parsed.lastTouch)) {
      return parsed as PersistentAttribution;
    }
  } catch {
    // A fresh record is created when storage is unavailable or corrupt.
  }
  return null;
}

function legacyFirstTouch(): Partial<AttributionTouch> {
  for (const storage of [window.localStorage, window.sessionStorage]) {
    try {
      const value = JSON.parse(storage.getItem(LEGACY_KEY) || "null") as Partial<AttributionTouch> | null;
      if (value && typeof value === "object") return value;
    } catch {
      // Continue to the other storage source.
    }
  }
  return {};
}

function currentTouch(): AttributionTouch {
  const url = new URL(window.location.href);
  const now = new Date().toISOString();
  return {
    pageUrl: clean(window.location.href),
    landingPage: clean(window.location.href),
    referrer: clean(document.referrer),
    utmSource: clean(url.searchParams.get("utm_source"), 100),
    utmMedium: clean(url.searchParams.get("utm_medium"), 100),
    utmCampaign: clean(url.searchParams.get("utm_campaign"), 150),
    utmContent: clean(url.searchParams.get("utm_content"), 150),
    utmTerm: clean(url.searchParams.get("utm_term"), 150),
    adGroup: clean(url.searchParams.get("utm_adgroup") || url.searchParams.get("adgroup"), 150),
    adSet: clean(url.searchParams.get("utm_adset") || url.searchParams.get("adset"), 150),
    adId: clean(url.searchParams.get("utm_ad") || url.searchParams.get("ad_id") || url.searchParams.get("ad"), 150),
    device: clean(url.searchParams.get("utm_device") || url.searchParams.get("device"), 80),
    gclid: clean(url.searchParams.get("gclid"), 200),
    gbraid: clean(url.searchParams.get("gbraid"), 200),
    wbraid: clean(url.searchParams.get("wbraid"), 200),
    fbclid: clean(url.searchParams.get("fbclid"), 200),
    fbc: readCookie("_fbc"),
    fbp: readCookie("_fbp"),
    campaignTrackingKey: clean(url.searchParams.get("centreos_campaign"), 100),
    capturedAt: now,
  };
}

function isMeaningfulAcquisition(touch: AttributionTouch) {
  return Boolean(
    touch.utmSource || touch.utmMedium || touch.utmCampaign || touch.gclid ||
      touch.gbraid || touch.wbraid || touch.fbclid || touch.fbc ||
      touch.campaignTrackingKey || touch.referrer,
  );
}

function mergeLegacy(current: AttributionTouch, legacy: Partial<AttributionTouch>): AttributionTouch {
  return {
    ...current,
    landingPage: clean(legacy.landingPage) || current.landingPage,
    referrer: clean(legacy.referrer) || current.referrer,
    utmSource: clean(legacy.utmSource, 100) || current.utmSource,
    utmMedium: clean(legacy.utmMedium, 100) || current.utmMedium,
    utmCampaign: clean(legacy.utmCampaign, 150) || current.utmCampaign,
    utmContent: clean(legacy.utmContent, 150) || current.utmContent,
    utmTerm: clean(legacy.utmTerm, 150) || current.utmTerm,
    adGroup: clean(legacy.adGroup, 150) || current.adGroup,
    adSet: clean(legacy.adSet, 150) || current.adSet,
    adId: clean(legacy.adId, 150) || current.adId,
    device: clean(legacy.device, 80) || current.device,
    gclid: clean(legacy.gclid, 200) || current.gclid,
    gbraid: clean(legacy.gbraid, 200) || current.gbraid,
    wbraid: clean(legacy.wbraid, 200) || current.wbraid,
    fbclid: clean(legacy.fbclid, 200) || current.fbclid,
    campaignTrackingKey: clean(legacy.campaignTrackingKey, 100) || current.campaignTrackingKey,
  };
}

export function collectPersistentAttribution() {
  const current = currentTouch();
  const stored = readStored();
  const firstTouch = stored?.firstTouch ?? mergeLegacy(current, legacyFirstTouch());
  const lastTouch = !stored || isMeaningfulAcquisition(current) ? current : stored.lastTouch;
  const record: PersistentAttribution = { version: 2, firstTouch, lastTouch };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
  } catch {
    // Forms and analytics continue without persistent browser storage.
  }

  const effective = lastTouch;
  return {
    pageUrl: clean(window.location.href),
    landingPage: effective.landingPage,
    referrer: effective.referrer,
    utmSource: effective.utmSource || firstTouch.utmSource,
    utmMedium: effective.utmMedium || firstTouch.utmMedium,
    utmCampaign: effective.utmCampaign || firstTouch.utmCampaign,
    utmContent: effective.utmContent || firstTouch.utmContent,
    utmTerm: effective.utmTerm || firstTouch.utmTerm,
    adGroup: effective.adGroup || firstTouch.adGroup,
    adSet: effective.adSet || firstTouch.adSet,
    adId: effective.adId || firstTouch.adId,
    device: effective.device || firstTouch.device,
    gclid: effective.gclid || firstTouch.gclid,
    gbraid: effective.gbraid || firstTouch.gbraid,
    wbraid: effective.wbraid || firstTouch.wbraid,
    fbclid: effective.fbclid || firstTouch.fbclid,
    fbc: effective.fbc || firstTouch.fbc,
    fbp: effective.fbp || firstTouch.fbp,
    campaignTrackingKey: effective.campaignTrackingKey || firstTouch.campaignTrackingKey,
    firstTouch,
    lastTouch,
  };
}
