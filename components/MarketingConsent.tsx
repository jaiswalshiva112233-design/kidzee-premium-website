"use client";

import {
  BarChart3,
  Check,
  ChevronRight,
  Cookie,
  Megaphone,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type MarketingSettings = {
  googleTagManagerId: string;
  googleAnalyticsId: string;
  googleAdsId: string;
  googleAdsConversionLabel: string;
  metaPixelId: string;
  analyticsEnabled: boolean;
  advertisingEnabled: boolean;
  metaPixelEnabled: boolean;
};

type MarketingConsentProps = {
  settings: MarketingSettings;
};

type ConsentChoice = {
  analytics: boolean;
  marketing: boolean;
  decidedAt: string;
  version: 1;
};

type MetaPixelFunction = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue: unknown[][];
  loaded: boolean;
  version: string;
  push: MetaPixelFunction;
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: MetaPixelFunction;
    _fbq?: MetaPixelFunction;
  }
}

const consentStorageKey = "kidzee-cookie-consent-v1";
const consentVersion = 1 as const;

function readStoredConsent(): ConsentChoice | null {
  try {
    const parsed = JSON.parse(
      window.localStorage.getItem(consentStorageKey) ?? "null",
    ) as Partial<ConsentChoice> | null;

    if (
      !parsed ||
      parsed.version !== consentVersion ||
      typeof parsed.analytics !== "boolean" ||
      typeof parsed.marketing !== "boolean"
    ) {
      return null;
    }

    return {
      analytics: parsed.analytics,
      marketing: parsed.marketing,
      decidedAt:
        typeof parsed.decidedAt === "string"
          ? parsed.decidedAt
          : new Date().toISOString(),
      version: consentVersion,
    };
  } catch {
    return null;
  }
}

function saveStoredConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(
      consentStorageKey,
      JSON.stringify(choice),
    );
  } catch {
    // The visitor's current choice still applies for this page session.
  }
}

function ensureGtag() {
  window.dataLayer ??= [];

  window.gtag ??= (...args: unknown[]) => {
    window.dataLayer?.push(args);
  };

  return window.gtag;
}

function addExternalScript(id: string, source: string) {
  if (document.getElementById(id)) {
    return;
  }

  const script = document.createElement("script");
  script.id = id;
  script.async = true;
  script.src = source;
  document.head.appendChild(script);
}

function loadGoogleTagManager(containerId: string) {
  if (document.getElementById("kidzee-google-tag-manager")) {
    return;
  }

  window.dataLayer ??= [];
  window.dataLayer.push({
    "gtm.start": Date.now(),
    event: "gtm.js",
  });

  addExternalScript(
    "kidzee-google-tag-manager",
    `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(
      containerId,
    )}`,
  );
}

function loadGoogleTag(
  scriptId: string,
  loadingId: string,
) {
  const gtag = ensureGtag();

  addExternalScript(
    scriptId,
    `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
      loadingId,
    )}`,
  );

  if (!document.documentElement.dataset.kidzeeGoogleTagStarted) {
    document.documentElement.dataset.kidzeeGoogleTagStarted = "true";
    gtag("js", new Date());
  }

  return gtag;
}

function loadMetaPixel(pixelId: string) {
  if (!window.fbq) {
    const fbq = ((...args: unknown[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue.push(args);
      }
    }) as MetaPixelFunction;

    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.push = fbq;

    window.fbq = fbq;
    window._fbq = fbq;
  }

  addExternalScript(
    "kidzee-meta-pixel",
    "https://connect.facebook.net/en_US/fbevents.js",
  );

  if (
    document.documentElement.dataset.kidzeeMetaPixelId !== pixelId
  ) {
    window.fbq("init", pixelId);
    document.documentElement.dataset.kidzeeMetaPixelId = pixelId;
  }

  window.fbq("consent", "grant");

  return window.fbq;
}

function updateGoogleConsent(choice: ConsentChoice) {
  if (!window.gtag && !window.dataLayer) {
    return;
  }

  const gtag = ensureGtag();

  gtag("consent", "update", {
    analytics_storage: choice.analytics ? "granted" : "denied",
    ad_storage: choice.marketing ? "granted" : "denied",
    ad_user_data: choice.marketing ? "granted" : "denied",
    ad_personalization: choice.marketing ? "granted" : "denied",
  });
}

function ToggleChoice({
  checked,
  disabled = false,
  label,
  description,
  icon,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  description: string;
  icon: React.ReactNode;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#E8E0EB] bg-[#FAF8FB] p-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F1E7F6] text-[#5B2A86]">
          {icon}
        </span>
        <div>
          <p className="text-sm font-black text-[#2D1736]">{label}</p>
          <p className="mt-1 text-xs font-semibold leading-5 text-[#756A79]">
            {description}
          </p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-1 h-8 w-14 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/20 disabled:cursor-not-allowed disabled:opacity-60",
          checked ? "bg-[#5B2A86]" : "bg-[#CFC6D3]",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-1 h-6 w-6 rounded-full bg-white shadow-sm transition",
            checked ? "left-7" : "left-1",
          ].join(" ")}
        />
      </button>
    </div>
  );
}

export default function MarketingConsent({
  settings,
}: MarketingConsentProps) {
  const pathname = usePathname();
  const [hydrated, setHydrated] = useState(false);
  const [consent, setConsent] = useState<ConsentChoice | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [draftAnalytics, setDraftAnalytics] = useState(false);
  const [draftMarketing, setDraftMarketing] = useState(false);
  const [staffExcluded, setStaffExcluded] = useState<boolean | null>(null);
  const lastGooglePage = useRef("");
  const lastMetaPage = useRef("");
  const recordedConversions = useRef(new Set<string>());

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
  const marketingAvailable = googleAdsAvailable || metaAvailable;
  const optionalTrackingAvailable =
    analyticsAvailable || marketingAvailable;

  const serviceSummary = useMemo(() => {
    const services: string[] = [];

    if (analyticsAvailable) {
      services.push("website analytics");
    }

    if (googleAdsAvailable) {
      services.push("Google Ads");
    }

    if (metaAvailable) {
      services.push("Meta Pixel");
    }

    return services.join(", ");
  }, [analyticsAvailable, googleAdsAvailable, metaAvailable]);

  useEffect(() => {
    let active = true;
    void fetch("/api/website/internal-status", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((response) => response.json())
      .then((result: { excluded?: boolean }) => {
        if (active) setStaffExcluded(result.excluded === true);
      })
      .catch(() => {
        if (active) setStaffExcluded(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (staffExcluded === null) return;
    const timeoutId = window.setTimeout(() => {
      if (staffExcluded) {
        setHydrated(true);
        setShowBanner(false);
        return;
      }
      if (!optionalTrackingAvailable) {
        setHydrated(true);
        return;
      }

      const storedConsent = readStoredConsent();
      setConsent(storedConsent);
      setDraftAnalytics(storedConsent?.analytics ?? false);
      setDraftMarketing(storedConsent?.marketing ?? false);
      setShowBanner(!storedConsent);
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [optionalTrackingAvailable, staffExcluded]);

  useEffect(() => {
    if (staffExcluded || !consent || !optionalTrackingAvailable) {
      return;
    }

    updateGoogleConsent(consent);

    if (!consent.marketing && window.fbq) {
      window.fbq("consent", "revoke");
    }

    const canLoadTagManager = Boolean(
      consent.analytics &&
        consent.marketing &&
        analyticsAvailable &&
        settings.googleTagManagerId,
    );

    if (canLoadTagManager) {
      const gtag = ensureGtag();
      gtag("consent", "default", {
        analytics_storage: "granted",
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
      });
      loadGoogleTagManager(settings.googleTagManagerId);
    }

    const canLoadDirectAnalytics = Boolean(
      consent.analytics &&
        analyticsAvailable &&
        settings.googleAnalyticsId &&
        !settings.googleTagManagerId,
    );
    const canLoadGoogleAds = Boolean(
      consent.marketing && googleAdsAvailable,
    );

    if (canLoadDirectAnalytics || canLoadGoogleAds) {
      const loadingId = canLoadDirectAnalytics
        ? settings.googleAnalyticsId
        : settings.googleAdsId;
      const gtag = loadGoogleTag(
        "kidzee-google-tag",
        loadingId,
      );

      gtag("consent", "default", {
        analytics_storage: consent.analytics ? "granted" : "denied",
        ad_storage: consent.marketing ? "granted" : "denied",
        ad_user_data: consent.marketing ? "granted" : "denied",
        ad_personalization: consent.marketing ? "granted" : "denied",
      });

      if (
        canLoadDirectAnalytics &&
        document.documentElement.dataset.kidzeeGaConfigured !==
          settings.googleAnalyticsId
      ) {
        gtag("config", settings.googleAnalyticsId, {
          send_page_view: false,
          anonymize_ip: true,
        });
        document.documentElement.dataset.kidzeeGaConfigured =
          settings.googleAnalyticsId;
      }

      if (
        canLoadGoogleAds &&
        document.documentElement.dataset.kidzeeAdsConfigured !==
          settings.googleAdsId
      ) {
        gtag("config", settings.googleAdsId, {
          send_page_view: false,
        });
        document.documentElement.dataset.kidzeeAdsConfigured =
          settings.googleAdsId;
      }
    }

    if (consent.marketing && metaAvailable) {
      loadMetaPixel(settings.metaPixelId);
    }

    const pageLocation = window.location.href;

    if (consent.analytics && analyticsAvailable && window.gtag) {
      if (lastGooglePage.current !== pageLocation) {
        window.gtag("event", "page_view", {
          page_title: document.title,
          page_location: pageLocation,
          page_path: `${window.location.pathname}${window.location.search}`,
        });
        lastGooglePage.current = pageLocation;
      }
    }

    if (consent.marketing && metaAvailable && window.fbq) {
      if (lastMetaPage.current !== pageLocation) {
        window.fbq("track", "PageView");
        lastMetaPage.current = pageLocation;
      }
    }
  }, [
    analyticsAvailable,
    consent,
    googleAdsAvailable,
    metaAvailable,
    optionalTrackingAvailable,
    pathname,
    settings.googleAdsId,
    settings.googleAnalyticsId,
    settings.googleTagManagerId,
    settings.metaPixelId,
    staffExcluded,
  ]);

  useEffect(() => {
    function handleWebsiteEvent(event: Event) {
      if (staffExcluded || !consent?.marketing) {
        return;
      }

      const customEvent = event as CustomEvent<{
        eventType?: string;
        eventName?: string;
        enquiryNumber?: string;
      }>;

      const enquiryNumber = customEvent.detail?.enquiryNumber?.trim() ?? "";
      const eventName = customEvent.detail?.eventName?.trim().toLowerCase() ?? "";
      if (
        customEvent.detail?.eventType !== "FORM_SUBMITTED" ||
        !enquiryNumber ||
        eventName.startsWith("career_")
      ) {
        return;
      }

      const conversionKey = `admission-lead-${enquiryNumber}`;

      if (recordedConversions.current.has(conversionKey)) {
        return;
      }

      recordedConversions.current.add(conversionKey);

      if (
        googleAdsAvailable &&
        settings.googleAdsConversionLabel &&
        window.gtag
      ) {
        window.gtag("event", "conversion", {
          send_to: `${settings.googleAdsId}/${settings.googleAdsConversionLabel}`,
          transaction_id: enquiryNumber,
        });
      }

      if (metaAvailable && window.fbq) {
        window.fbq(
          "track",
          "Lead",
          {
            content_name: "Website admission enquiry",
          },
          {
            eventID: conversionKey,
          },
        );
      }
    }

    window.addEventListener("kidzee:website-event", handleWebsiteEvent);

    return () => {
      window.removeEventListener(
        "kidzee:website-event",
        handleWebsiteEvent,
      );
    };
  }, [
    consent?.marketing,
    googleAdsAvailable,
    metaAvailable,
    settings.googleAdsConversionLabel,
    settings.googleAdsId,
    staffExcluded,
  ]);

  function applyChoice(analytics: boolean, marketing: boolean) {
    const choice: ConsentChoice = {
      analytics: analyticsAvailable ? analytics : false,
      marketing: marketingAvailable ? marketing : false,
      decidedAt: new Date().toISOString(),
      version: consentVersion,
    };

    saveStoredConsent(choice);
    setConsent(choice);
    setDraftAnalytics(choice.analytics);
    setDraftMarketing(choice.marketing);
    setShowBanner(false);
    setShowPreferences(false);

    window.dispatchEvent(
      new CustomEvent("kidzee:consent-change", {
        detail: choice,
      }),
    );
  }

  function openPreferences() {
    setDraftAnalytics(consent?.analytics ?? false);
    setDraftMarketing(consent?.marketing ?? false);
    setShowPreferences(true);
    setShowBanner(false);
  }

  if (!hydrated || !optionalTrackingAvailable) {
    return null;
  }

  return (
    <>
      {showBanner ? (
        <section
          role="dialog"
          aria-labelledby="cookie-banner-title"
          aria-describedby="cookie-banner-description"
          className="fixed inset-x-3 bottom-3 z-[80] mx-auto max-w-5xl overflow-hidden rounded-[26px] border border-[#E3D9E8] bg-white shadow-[0_24px_80px_rgba(35,15,43,0.28)] sm:inset-x-5 sm:bottom-5"
        >
          <div className="grid gap-0 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="flex items-start gap-4 p-5 sm:p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <Cookie aria-hidden="true" size={22} />
              </span>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.13em] text-[#7A459C]">
                  Your privacy, your choice
                </p>
                <h2
                  id="cookie-banner-title"
                  className="mt-1 text-xl font-black tracking-[-0.02em] text-[#2D1736]"
                >
                  Help us understand what parents find useful
                </h2>
                <p
                  id="cookie-banner-description"
                  className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#716576]"
                >
                  We use necessary technology to keep the website working. With
                  your permission, we also use {serviceSummary} to measure visits
                  and admission enquiries. You can change this choice anytime.
                </p>

                <Link
                  href="/privacy-policy"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-black text-[#5B2A86] hover:underline"
                >
                  Read our Privacy Policy
                  <ChevronRight aria-hidden="true" size={14} />
                </Link>
              </div>
            </div>

            <div className="grid gap-2 border-t border-[#EEE7F1] bg-[#FBF9FC] p-4 sm:grid-cols-3 lg:w-[260px] lg:grid-cols-1 lg:border-l lg:border-t-0">
              <button
                type="button"
                onClick={() => applyChoice(true, true)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white transition hover:bg-[#4B206F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/20"
              >
                <Check aria-hidden="true" size={17} />
                Accept all
              </button>

              <button
                type="button"
                onClick={() => applyChoice(false, false)}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-[#D9CEDF] bg-white px-4 text-sm font-black text-[#4D4052] transition hover:border-[#BFAFC7] hover:text-[#5B2A86]"
              >
                Necessary only
              </button>

              <button
                type="button"
                onClick={openPreferences}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F2EAF6]"
              >
                <SlidersHorizontal aria-hidden="true" size={16} />
                Choose
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {showPreferences ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[#211128]/55 p-3 backdrop-blur-[2px] sm:items-center sm:p-5"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && consent) {
              setShowPreferences(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-preferences-title"
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] bg-white shadow-[0_28px_90px_rgba(25,10,31,0.38)]"
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#EDE6F0] bg-white/95 p-5 backdrop-blur sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                  <SlidersHorizontal aria-hidden="true" size={20} />
                </span>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.13em] text-[#7A459C]">
                    Privacy controls
                  </p>
                  <h2
                    id="cookie-preferences-title"
                    className="mt-1 text-xl font-black text-[#2D1736]"
                  >
                    Choose your cookie preferences
                  </h2>
                </div>
              </div>

              {consent ? (
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#E2D9E6] text-[#66596B] transition hover:bg-[#F6F1F8] hover:text-[#2D1736]"
                  aria-label="Close cookie preferences"
                >
                  <X aria-hidden="true" size={19} />
                </button>
              ) : null}
            </div>

            <div className="space-y-3 p-5 sm:p-6">
              <ToggleChoice
                checked
                disabled
                label="Necessary website functions"
                description="Required for security, forms, navigation and remembering your privacy choice. These cannot be switched off."
                icon={<ShieldCheck aria-hidden="true" size={19} />}
                onChange={() => undefined}
              />

              {analyticsAvailable ? (
                <ToggleChoice
                  checked={draftAnalytics}
                  label="Website analytics"
                  description="Helps us understand which pages parents use and improve the admission journey."
                  icon={<BarChart3 aria-hidden="true" size={19} />}
                  onChange={setDraftAnalytics}
                />
              ) : null}

              {marketingAvailable ? (
                <ToggleChoice
                  checked={draftMarketing}
                  label="Advertising measurement"
                  description="Measures whether Google, Facebook or Instagram advertising leads to an enquiry."
                  icon={<Megaphone aria-hidden="true" size={19} />}
                  onChange={setDraftMarketing}
                />
              ) : null}

              <p className="rounded-2xl bg-[#F8F5F9] px-4 py-3 text-xs font-semibold leading-5 text-[#756A79]">
                We do not receive a parent&apos;s phone number merely because they
                click Call or WhatsApp. Contact details reach us only when the
                parent calls, messages or submits a form.
              </p>
            </div>

            <div className="grid gap-2 border-t border-[#EDE6F0] bg-[#FBF9FC] p-4 sm:grid-cols-2 sm:p-5">
              <button
                type="button"
                onClick={() => applyChoice(false, false)}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#D9CEDF] bg-white px-5 text-sm font-black text-[#4D4052] transition hover:border-[#BFAFC7] hover:text-[#5B2A86]"
              >
                Use necessary only
              </button>

              <button
                type="button"
                onClick={() =>
                  applyChoice(draftAnalytics, draftMarketing)
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#4B206F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/20"
              >
                <Check aria-hidden="true" size={17} />
                Save my choices
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
