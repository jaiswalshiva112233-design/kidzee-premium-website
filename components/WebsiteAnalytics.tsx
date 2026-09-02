"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { useCallback, useEffect } from "react";
import { collectPersistentAttribution } from "@/lib/marketing/clientAttribution";

type WebsiteEventType =
  | "PAGE_VIEW"
  | "CTA_CLICK"
  | "PHONE_CLICK"
  | "WHATSAPP_CLICK"
  | "MAP_CLICK"
  | "FORM_STARTED"
  | "FORM_SUBMITTED"
  | "GALLERY_OPEN"
  | "VIDEO_PLAY"
  | "WEB_VITAL"
  | "LANDING_VARIANT_VIEW"
  | "SCROLL_DEPTH"
  | "SESSION_ENGAGEMENT"
  | "BROKEN_IMAGE";

type EventDetails = {
  eventName?: string;
  targetUrl?: string;
  targetText?: string;
  enquiryNumber?: string;
  metricValue?: number;
  metricDelta?: number;
  metricRating?: string;
  landingPageId?: string;
  landingVariantId?: string;
  growthExperimentId?: string;
};

type WebsiteAnalyticsCustomEventDetail =
  EventDetails & {
    eventType?: WebsiteEventType;
  };

const visitorStorageKey =
  "kidzee-website-visitor-id";

const sessionStorageKey =
  "kidzee-website-session-id";

const lastPageViewStorageKey =
  "kidzee-last-page-view";

function createAnonymousId(prefix: string) {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}_${crypto
      .randomUUID()
      .replace(/-/g, "")}`;
  }

  return `${prefix}_${Date.now().toString(
    36,
  )}${Math.random().toString(36).slice(2)}`;
}

function readStorage(
  storage: Storage,
  key: string,
) {
  try {
    return storage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStorage(
  storage: Storage,
  key: string,
  value: string,
) {
  try {
    storage.setItem(key, value);
  } catch {
    // Analytics remain non-blocking when
    // browser storage is unavailable.
  }
}

function getOrCreateAnonymousId(
  storage: Storage,
  key: string,
  prefix: string,
) {
  const existing = readStorage(
    storage,
    key,
  );

  if (
    /^[A-Za-z0-9_-]{8,100}$/.test(existing)
  ) {
    return existing;
  }

  const created =
    createAnonymousId(prefix);

  writeStorage(storage, key, created);

  return created;
}

function getDeviceType() {
  if (window.innerWidth < 640) {
    return "mobile";
  }

  if (window.innerWidth < 1024) {
    return "tablet";
  }

  return "desktop";
}

function sendWebsiteEvent(
  eventType: WebsiteEventType,
  details: EventDetails = {},
) {
  try {
    const visitorId =
      getOrCreateAnonymousId(
        window.localStorage,
        visitorStorageKey,
        "visitor",
      );

    const sessionId =
      getOrCreateAnonymousId(
        window.sessionStorage,
        sessionStorageKey,
        "session",
      );

    const attribution =
      collectPersistentAttribution();

    const payload = JSON.stringify({
      eventType,
      ...details,
      visitorId,
      sessionId,

      pagePath:
        `${window.location.pathname}` +
        `${window.location.search}`,

      pageTitle: document.title,

      landingPage:
        attribution.landingPage,

      referrer:
        attribution.referrer,

      utmSource:
        attribution.utmSource,

      utmMedium:
        attribution.utmMedium,

      utmCampaign:
        attribution.utmCampaign,

      utmContent:
        attribution.utmContent,

      utmTerm:
        attribution.utmTerm,

      gclid:
        attribution.gclid,

      gbraid:
        attribution.gbraid,

      wbraid:
        attribution.wbraid,

      fbclid:
        attribution.fbclid,

      fbc: attribution.fbc,
      fbp: attribution.fbp,
      campaignTrackingKey: attribution.campaignTrackingKey,
      firstTouch: attribution.firstTouch,
      lastTouch: attribution.lastTouch,

      deviceType: getDeviceType(),

      viewportWidth:
        window.innerWidth,

      language:
        navigator.language,

      timeZone:
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone || "",
    });

    void fetch(
      "/api/website/analytics",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: payload,
        credentials: "same-origin",
        keepalive: true,
      },
    ).catch(() => {
      // Tracking must never interrupt
      // the parent's website journey.
    });
  } catch {
    // Tracking must never interrupt
    // the parent's website journey.
  }
}

function normaliseText(
  element: Element,
) {
  return (element.textContent ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 150);
}

function classifyLink(
  anchor: HTMLAnchorElement,
) {
  const href =
    anchor.getAttribute("href") ?? "";

  const absoluteHref =
    anchor.href.toLowerCase();

  if (
    href.toLowerCase().startsWith("tel:")
  ) {
    return "PHONE_CLICK" as const;
  }

  if (
    absoluteHref.includes("wa.me/") ||
    absoluteHref.includes(
      "whatsapp.com/",
    )
  ) {
    return "WHATSAPP_CLICK" as const;
  }

  if (
    absoluteHref.includes(
      "google.com/maps",
    ) ||
    absoluteHref.includes(
      "maps.app.goo.gl",
    ) ||
    absoluteHref.includes(
      "goo.gl/maps",
    )
  ) {
    return "MAP_CLICK" as const;
  }

  const analyticsEvent =
    anchor.dataset.analyticsEvent;

  if (
    analyticsEvent ===
      "GALLERY_OPEN" ||
    analyticsEvent ===
      "VIDEO_PLAY" ||
    analyticsEvent ===
      "CTA_CLICK"
  ) {
    return analyticsEvent;
  }

  const pathOrHash =
    href.toLowerCase();

  if (
    pathOrHash.includes(
      "#admissions",
    ) ||
    pathOrHash.includes(
      "#admission-enquiry",
    ) ||
    pathOrHash.includes(
      "#contact-enquiry",
    ) ||
    pathOrHash === "/contact" ||
    pathOrHash.startsWith(
      "/contact?",
    ) ||
    pathOrHash === "/admissions" ||
    pathOrHash.startsWith(
      "/admissions?",
    ) ||
    pathOrHash.startsWith(
      "/admissions#",
    )
  ) {
    return "CTA_CLICK" as const;
  }

  return null;
}

function alreadyRecordedPageView(
  pagePath: string,
) {
  let rawValue = "";

  try {
    rawValue = readStorage(
      window.sessionStorage,
      lastPageViewStorageKey,
    );
  } catch {
    return false;
  }

  const separatorIndex =
    rawValue.lastIndexOf("|");

  if (separatorIndex < 0) {
    return false;
  }

  const previousPath =
    rawValue.slice(
      0,
      separatorIndex,
    );

  const previousTime = Number(
    rawValue.slice(
      separatorIndex + 1,
    ),
  );

  return (
    previousPath === pagePath &&
    Number.isFinite(previousTime) &&
    Date.now() - previousTime < 2_000
  );
}

export default function WebsiteAnalytics() {
  const pathname = usePathname();
  const isExcludedRoute = pathname.startsWith("/admin") || pathname.startsWith("/api");

  const reportWebVital = useCallback(
    (metric: { name: string; value: number; delta: number; rating: string }) => {
      if (isExcludedRoute) return;
      sendWebsiteEvent("WEB_VITAL", {
        eventName: metric.name,
        metricValue: metric.value,
        metricDelta: metric.delta,
        metricRating: metric.rating,
      });
    },
    [isExcludedRoute],
  );

  useReportWebVitals(reportWebVital);

  useEffect(() => {
    if (isExcludedRoute) return;
    const pagePath =
      `${window.location.pathname}` +
      `${window.location.search}`;

    if (
      !alreadyRecordedPageView(
        pagePath,
      )
    ) {
      try {
        writeStorage(
          window.sessionStorage,
          lastPageViewStorageKey,
          `${pagePath}|${Date.now()}`,
        );
      } catch {
        // The page view can still be
        // sent without session storage.
      }

      sendWebsiteEvent("PAGE_VIEW", {
        eventName: "page_view",
      });
    }
  }, [pathname, isExcludedRoute]);

  useEffect(() => {
    if (isExcludedRoute) return;
    const startedForms =
      new WeakSet<HTMLFormElement>();

    const playedVideos =
      new WeakSet<HTMLVideoElement>();

    function handleClick(
      event: MouseEvent,
    ) {
      if (
        !(
          event.target instanceof
          Element
        )
      ) {
        return;
      }

      const anchor =
        event.target.closest(
          "a[href]",
        );

      if (
        !(
          anchor instanceof
          HTMLAnchorElement
        )
      ) {
        return;
      }

      const eventType =
        classifyLink(anchor);

      if (!eventType) {
        return;
      }

      sendWebsiteEvent(eventType, {
        eventName:
          anchor.dataset
            .analyticsName ||
          eventType.toLowerCase(),

        targetUrl:
          anchor.getAttribute(
            "href",
          ) || "",

        targetText:
          anchor.dataset
            .analyticsLabel ||
          normaliseText(anchor) ||
          anchor.getAttribute(
            "aria-label",
          ) ||
          "",
      });
    }

    function handleFormFocus(
      event: FocusEvent,
    ) {
      if (
        !(
          event.target instanceof
          Element
        )
      ) {
        return;
      }

      const form =
        event.target.closest("form");

      if (
        !(
          form instanceof
          HTMLFormElement
        )
      ) {
        return;
      }

      if (startedForms.has(form)) {
        return;
      }

      startedForms.add(form);

      sendWebsiteEvent(
        "FORM_STARTED",
        {
          eventName:
            form.dataset
              .analyticsName ||
            "website_enquiry_form",

          targetText:
            form.getAttribute(
              "aria-label",
            ) ||
            "Website enquiry form",
        },
      );
    }

    function handleVideoPlay(
      event: Event,
    ) {
      if (
        !(
          event.target instanceof
          HTMLVideoElement
        )
      ) {
        return;
      }

      if (
        playedVideos.has(event.target)
      ) {
        return;
      }

      playedVideos.add(
        event.target,
      );

      sendWebsiteEvent(
        "VIDEO_PLAY",
        {
          eventName:
            event.target.dataset
              .analyticsName ||
            "gallery_video",

          targetUrl:
            event.target.currentSrc ||
            event.target.getAttribute(
              "src",
            ) ||
            "",

          targetText:
            event.target.getAttribute(
              "aria-label",
            ) ||
            "Website video",
        },
      );
    }

    function handleCustomWebsiteEvent(
      event: Event,
    ) {
      const customEvent =
        event as CustomEvent<WebsiteAnalyticsCustomEventDetail>;

      const eventType =
        customEvent.detail?.eventType;

      if (
        !eventType ||
        ![
          "PAGE_VIEW",
          "CTA_CLICK",
          "PHONE_CLICK",
          "WHATSAPP_CLICK",
          "MAP_CLICK",
          "FORM_STARTED",
          "FORM_SUBMITTED",
          "GALLERY_OPEN",
          "VIDEO_PLAY",
          "WEB_VITAL",
          "LANDING_VARIANT_VIEW",
          "SCROLL_DEPTH",
          "SESSION_ENGAGEMENT",
          "BROKEN_IMAGE",
        ].includes(eventType)
      ) {
        return;
      }

      sendWebsiteEvent(eventType, {
        eventName:
          customEvent.detail
            .eventName,

        targetUrl:
          customEvent.detail
            .targetUrl,

        targetText:
          customEvent.detail
            .targetText,

        enquiryNumber:
          customEvent.detail
            .enquiryNumber,
        landingPageId: customEvent.detail.landingPageId,
        landingVariantId: customEvent.detail.landingVariantId,
        growthExperimentId: customEvent.detail.growthExperimentId,
      });
    }

    document.addEventListener(
      "click",
      handleClick,
      true,
    );

    document.addEventListener(
      "focusin",
      handleFormFocus,
      true,
    );

    document.addEventListener(
      "play",
      handleVideoPlay,
      true,
    );

    window.addEventListener(
      "kidzee:website-event",
      handleCustomWebsiteEvent,
    );

    return () => {
      document.removeEventListener(
        "click",
        handleClick,
        true,
      );

      document.removeEventListener(
        "focusin",
        handleFormFocus,
        true,
      );

      document.removeEventListener(
        "play",
        handleVideoPlay,
        true,
      );

      window.removeEventListener(
        "kidzee:website-event",
        handleCustomWebsiteEvent,
      );
    };
  }, [isExcludedRoute]);

  useEffect(() => {
    if (isExcludedRoute) return;
    const startedAt = Date.now();
    const sentDepths = new Set<number>();
    const handleScroll = () => {
      const available = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const depth = Math.min(100, Math.round((window.scrollY / available) * 100));
      for (const threshold of [25, 50, 75, 100]) {
        if (depth >= threshold && !sentDepths.has(threshold)) {
          sentDepths.add(threshold);
          sendWebsiteEvent("SCROLL_DEPTH", { eventName: `scroll_${threshold}`, metricValue: threshold });
        }
      }
    };
    const handleError = (event: Event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement) {
        sendWebsiteEvent("BROKEN_IMAGE", { eventName: "image_load_failed", targetUrl: target.currentSrc || target.src, targetText: target.alt });
      }
    };
    const sendDuration = () => sendWebsiteEvent("SESSION_ENGAGEMENT", { eventName: "page_engagement", metricValue: Math.max(0, Math.round((Date.now() - startedAt) / 1000)) });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("pagehide", sendDuration);
    document.addEventListener("error", handleError, true);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("pagehide", sendDuration);
      document.removeEventListener("error", handleError, true);
    };
  }, [pathname, isExcludedRoute]);

  return null;
}
