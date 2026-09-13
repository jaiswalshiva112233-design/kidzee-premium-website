export type MarketingSettings = {
  googleTagManagerId: string;
  googleAnalyticsId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  googleAdsPhoneConversionLabel: string;
  googleAdsPhoneConversionNumber: string;
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

  if (isExcluded || !consent) {
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

  const hasAnyGoogleConsent = Boolean(consent.analytics || consent.marketing);

  const consentMode: ConsentModeState = {
    analytics_storage: consent.analytics ? "granted" : "denied",
    ad_storage: consent.marketing ? "granted" : "denied",
    ad_user_data: consent.marketing ? "granted" : "denied",
    ad_personalization: consent.marketing ? "granted" : "denied",
  };

  const loadedGtm = Boolean(hasAnyGoogleConsent && hasGtm);
  const loadedDirectGa4 = Boolean(
    consent.analytics &&
      analyticsAvailable &&
      settings.googleAnalyticsId &&
      !hasGtm,
  );
  const configuredGa4Direct = loadedDirectGa4;
  const loadedGoogleAds = Boolean(
    consent.marketing && googleAdsAvailable && !hasGtm,
  );
  const configuredAdsDirect = loadedGoogleAds;
  const loadedMetaPixel = Boolean(consent.marketing && metaAvailable);

  const canEmitGa4Event = Boolean(
    consent.analytics && (loadedGtm || loadedDirectGa4),
  );
  const canEmitGoogleAdsConversion = Boolean(
    consent.marketing &&
      (loadedGtm || loadedGoogleAds) &&
      settings.googleAdsConversionLabel,
  );
  const canEmitMetaLead = Boolean(consent.marketing && metaAvailable);
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
