export type MarketingSettings = {
  googleTagManagerId: string;
  googleAnalyticsId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  googleAdsPhoneConversionLabel: string;
  googleAdsPhoneConversionNumber: string;
  googleAdsWhatsAppConversionLabel?: string;
  googleAdsAdvancedConsentMode?: boolean;
  metaPixelId: string;
  analyticsEnabled: boolean;
  advertisingEnabled: boolean;
  metaPixelEnabled: boolean;
};

export type ConsentChoice = {
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  version: 1;
};

export type ConsentModeState = {
  analytics_storage: "granted" | "denied";
  ad_storage: "granted" | "denied";
  ad_user_data: "granted" | "denied";
  ad_personalization: "granted" | "denied";
};

export type EvaluatedConsentState = {
  isExcluded: boolean;
  isAdminOrApi: boolean;
  staffExcluded: boolean;
  hasGtm: boolean;
  loadedGtm: boolean;
  loadedDirectGa4: boolean;
  configuredGa4Direct: boolean;
  loadedGoogleAds: boolean;
  configuredAdsDirect: boolean;
  loadedMetaPixel: boolean;
  consentMode: ConsentModeState;
  canEmitGa4Event: boolean;
  canEmitGoogleAdsConversion: boolean;
  canEmitMetaLead: boolean;
  canEmitDirectPageView: boolean;
};

export function evaluateConsentState({
  settings,
  consent,
  pathname,
  staffExcluded = false,
}: {
  settings: Partial<MarketingSettings>;
  consent: Partial<ConsentChoice> | null;
  pathname?: string | null;
  staffExcluded?: boolean;
}): EvaluatedConsentState {
  const isAdminOrApi = Boolean(
    pathname?.startsWith("/admin") || pathname?.startsWith("/api"),
  );

  const isExcluded = Boolean(isAdminOrApi || staffExcluded);

  const advancedAds = Boolean(settings.googleAdsAdvancedConsentMode && settings.advertisingEnabled && settings.googleAdsId && !settings.googleTagManagerId);
  if (isExcluded || (!consent && !advancedAds)) {
    return {
      isExcluded,
      isAdminOrApi,
      staffExcluded,
      hasGtm: Boolean(settings.googleTagManagerId),
      loadedGtm: false,
      loadedDirectGa4: false,
      configuredGa4Direct: false,
      loadedGoogleAds: false,
      configuredAdsDirect: false,
      loadedMetaPixel: false,
      consentMode: {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      },
      canEmitGa4Event: false,
      canEmitGoogleAdsConversion: false,
      canEmitMetaLead: false,
      canEmitDirectPageView: false,
    };
  }

  const hasGtm = Boolean(settings.googleTagManagerId);
  const analyticsAvailable = Boolean(
    settings.analyticsEnabled &&
      (settings.googleTagManagerId || settings.googleAnalyticsId),
  );
  const googleAdsAvailable = Boolean(
    settings.advertisingEnabled && settings.googleAdsId,
  );
  const metaAvailable = Boolean(
    settings.metaPixelEnabled && settings.metaPixelId,
  );

  const hasAnyGoogleConsent = Boolean(consent?.analytics || consent?.marketing);

  const consentMode: ConsentModeState = {
    analytics_storage: consent?.analytics ? "granted" : "denied",
    ad_storage: consent?.marketing ? "granted" : "denied",
    ad_user_data: consent?.marketing ? "granted" : "denied",
    ad_personalization: consent?.marketing ? "granted" : "denied",
  };

  const loadedGtm = Boolean(hasAnyGoogleConsent && hasGtm);
  const loadedDirectGa4 = Boolean(
    consent?.analytics &&
      analyticsAvailable &&
      settings.googleAnalyticsId &&
      !hasGtm,
  );
  const configuredGa4Direct = loadedDirectGa4;
  const loadedGoogleAds = Boolean(
    (consent?.marketing || advancedAds) && googleAdsAvailable && !hasGtm,
  );
  const configuredAdsDirect = loadedGoogleAds;
  const loadedMetaPixel = Boolean(consent?.marketing && metaAvailable);

  const canEmitGa4Event = Boolean(
    consent?.analytics && (loadedGtm || loadedDirectGa4),
  );
  const canEmitGoogleAdsConversion = Boolean(
    (consent?.marketing || advancedAds) &&
      (loadedGtm || loadedGoogleAds) &&
      settings.googleAdsConversionLabel,
  );
  const canEmitMetaLead = Boolean(consent?.marketing && metaAvailable);
  const canEmitDirectPageView = loadedDirectGa4;

  return {
    isExcluded,
    isAdminOrApi,
    staffExcluded,
    hasGtm,
    loadedGtm,
    loadedDirectGa4,
    configuredGa4Direct,
    loadedGoogleAds,
    configuredAdsDirect,
    loadedMetaPixel,
    consentMode,
    canEmitGa4Event,
    canEmitGoogleAdsConversion,
    canEmitMetaLead,
    canEmitDirectPageView,
  };
}

function redactedPageUrl(value: string) {
  try { const url = new URL(value); return url.protocol === "https:" || url.protocol === "http:" ? url.origin + url.pathname : ""; }
  catch { return ""; }
}
export function googleAdsPageConfig(consent: Partial<ConsentChoice> | null, pageUrl: string, referrer: string) {
  return {
    send_page_view: false,
    allow_ad_personalization_signals: consent?.marketing === true,
    page_location: consent?.marketing ? pageUrl : redactedPageUrl(pageUrl),
    page_referrer: consent?.marketing ? referrer : redactedPageUrl(referrer),
  };
}
export function googleAdsLeadPayload({settings, consent, enquiryNumber, pageUrl, referrer}: {
  settings: Partial<MarketingSettings>; consent: Partial<ConsentChoice> | null;
  enquiryNumber: string; pageUrl: string; referrer: string;
}) {
  const pathname = (() => { try { return new URL(pageUrl).pathname; } catch { return "/admin"; } })();
  const state = evaluateConsentState({settings, consent, pathname});
  if (!state.canEmitGoogleAdsConversion || !enquiryNumber.trim()) return null;
  const page = googleAdsPageConfig(consent, pageUrl, referrer);
  return { send_to: settings.googleAdsId + "/" + settings.googleAdsConversionLabel,
    value: 1, currency: "INR", page_location: page.page_location, page_referrer: page.page_referrer,
    ...(consent?.marketing ? { transaction_id: enquiryNumber } : {}) };
}

export function configureGoogleConsentMode(tag: (...args: unknown[]) => void, consent: Partial<ConsentChoice> | null, initialized = false) {
  if (!initialized) tag("consent", "default", {
    analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", wait_for_update: 500,
  });
  tag("set", "ads_data_redaction", true);
  tag("set", "url_passthrough", false);
  tag("consent", "update", {
    analytics_storage: consent?.analytics ? "granted" : "denied",
    ad_storage: consent?.marketing ? "granted" : "denied",
    ad_user_data: consent?.marketing ? "granted" : "denied",
    ad_personalization: consent?.marketing ? "granted" : "denied",
  });
}
