"use client";

import {
  BadgeCheck,
  BarChart3,
  CheckCircle2,
  CircleAlert,
  Cookie,
  ExternalLink,
  LoaderCircle,
  Megaphone,
  Save,
  SearchCheck,
  Share2,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

type TrackingSettings = {
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
  updatedAt: string | null;
};

type SettingsResponse = {
  success?: boolean;
  message?: string;
  settings?: TrackingSettings;
  websiteUrl?: string;
  metaConversionsApiReady?: boolean;
  errors?: string[];
};

const emptySettings: TrackingSettings = {
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
  updatedAt: null,
};

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none transition placeholder:font-semibold placeholder:text-[#AAA0AE] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:bg-[#F7F4F8] disabled:text-[#9A909E]";

function cleanUppercaseId(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Not saved yet";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Saved";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function FieldHelp({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 text-xs font-semibold leading-5 text-[#8A7F8D]">
      {children}
    </p>
  );
}

function StatusBadge({ connected }: { connected: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em]",
        connected
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-[#E5DCE9] bg-[#F8F5F9] text-[#807486]",
      ].join(" ")}
    >
      {connected ? (
        <CheckCircle2 aria-hidden="true" size={13} />
      ) : null}
      {connected ? "Connected" : "Not added"}
    </span>
  );
}

type ToggleControlProps = {
  checked: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onChange: (checked: boolean) => void;
};

function ToggleControl({
  checked,
  disabled = false,
  title,
  description,
  onChange,
}: ToggleControlProps) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-2xl border border-[#EAE3ED] bg-[#FAF8FB] p-4">
      <div>
        <p className="text-sm font-black text-[#2D1736]">{title}</p>
        <p className="mt-1 text-xs font-semibold leading-5 text-[#817585]">
          {description}
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 h-8 w-14 shrink-0 rounded-full transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/20 disabled:cursor-not-allowed disabled:opacity-45",
          checked ? "bg-[#5B2A86]" : "bg-[#CDC4D1]",
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

export default function WebsiteTrackingManager() {
  const router = useRouter();
  const [settings, setSettings] =
    useState<TrackingSettings>(emptySettings);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [metaConversionsApiReady, setMetaConversionsApiReady] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/website-settings", {
          method: "GET",
          cache: "no-store",
        });
        const result = (await response.json()) as SettingsResponse;

        if (!response.ok || !result.success || !result.settings) {
          throw new Error(
            result.message ??
              "Website tracking settings could not be loaded.",
          );
        }

        if (!active) {
          return;
        }

        setSettings({ ...emptySettings, ...result.settings });
        setWebsiteUrl(result.websiteUrl ?? "");
        setMetaConversionsApiReady(
          result.metaConversionsApiReady === true,
        );
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Website tracking settings could not be loaded.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      active = false;
    };
  }, []);

  const connectionCount = useMemo(() => {
    return [
      Boolean(
        settings.googleTagManagerId || settings.googleAnalyticsId,
      ),
      Boolean(settings.googleAdsId),
      Boolean(settings.metaPixelId),
      Boolean(settings.googleSearchConsoleVerification),
      Boolean(settings.bingWebmasterVerification),
    ].filter(Boolean).length;
  }, [settings]);

  function updateText(
    field: keyof TrackingSettings,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setSuccessMessage("");
  }

  function updateToggle(
    field:
      | "analyticsEnabled"
      | "advertisingEnabled"
      | "metaPixelEnabled",
    value: boolean,
  ) {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setSuccessMessage("");
  }

  function validateSettings(candidate: TrackingSettings) {
    if (
      candidate.googleTagManagerId &&
      !/^GTM-[A-Z0-9]{4,20}$/.test(candidate.googleTagManagerId)
    ) {
      return "Enter a valid Google Tag Manager ID such as GTM-ABC1234.";
    }

    if (
      candidate.googleAnalyticsId &&
      !/^G-[A-Z0-9]{4,20}$/.test(candidate.googleAnalyticsId)
    ) {
      return "Enter a valid Google Analytics ID such as G-ABC1234567.";
    }

    if (
      candidate.googleAdsId &&
      !/^AW-[0-9]{5,20}$/.test(candidate.googleAdsId)
    ) {
      return "Enter a valid Google Ads ID such as AW-123456789.";
    }

    if (
      candidate.googleAdsConversionLabel &&
      !/^[A-Za-z0-9_-]{1,100}$/.test(
        candidate.googleAdsConversionLabel,
      )
    ) {
      return "The Google Ads conversion label is invalid.";
    }

    if (
      candidate.googleAdsConversionLabel &&
      !candidate.googleAdsId
    ) {
      return "Add the Google Ads ID before its conversion label.";
    }

    if (
      candidate.metaPixelId &&
      !/^[0-9]{5,35}$/.test(candidate.metaPixelId)
    ) {
      return "Enter a valid numeric Meta Pixel ID.";
    }

    if (
      candidate.analyticsEnabled &&
      !candidate.googleTagManagerId &&
      !candidate.googleAnalyticsId
    ) {
      return "Add Google Tag Manager or Google Analytics before enabling analytics.";
    }

    if (candidate.advertisingEnabled && !candidate.googleAdsId) {
      return "Add the Google Ads ID before enabling Google Ads tracking.";
    }

    if (candidate.metaPixelEnabled && !candidate.metaPixelId) {
      return "Add the Meta Pixel ID before enabling Meta tracking.";
    }

    return "";
  }

  async function saveSettings(
    candidate: TrackingSettings,
    successText?: string,
  ) {
    const validationMessage = validateSettings(candidate);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/website-settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(candidate),
      });
      const result = (await response.json()) as SettingsResponse;

      if (!response.ok || !result.success || !result.settings) {
        throw new Error(
          result.errors?.[0] ??
            result.message ??
            "Website tracking settings could not be saved.",
        );
      }

      setSettings({ ...emptySettings, ...result.settings });
      setMetaConversionsApiReady(
        result.metaConversionsApiReady === true,
      );
      setSuccessMessage(
        successText ??
          result.message ??
          "Website tracking settings have been saved.",
      );
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Website tracking settings could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveSettings(settings);
  }

  async function handleSaveAndEnable() {
    const connectedSettings: TrackingSettings = {
      ...settings,
      analyticsEnabled: Boolean(
        settings.googleTagManagerId || settings.googleAnalyticsId,
      ),
      advertisingEnabled: Boolean(
        settings.googleAdsId && settings.googleAdsConversionLabel,
      ),
      metaPixelEnabled: Boolean(settings.metaPixelId),
    };

    if (
      !connectedSettings.analyticsEnabled &&
      !connectedSettings.advertisingEnabled &&
      !connectedSettings.metaPixelEnabled
    ) {
      setError(
        "Add at least one Google Analytics, Google Ads or Meta ID first.",
      );
      return;
    }

    await saveSettings(
      connectedSettings,
      "All complete Google and Meta connections are now enabled. Submitted enquiry forms will be recorded as conversions after visitor consent.",
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
        <div className="text-center">
          <LoaderCircle
            aria-hidden="true"
            className="mx-auto animate-spin text-[#5B2A86]"
            size={34}
          />
          <p className="mt-4 text-sm font-black text-[#615567]">
            Loading website connections…
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
        >
          <CircleAlert aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
          {error}
        </div>
      ) : null}

      {successMessage ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
        >
          <CheckCircle2 aria-hidden="true" className="mt-0.5 shrink-0" size={19} />
          {successMessage}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_12px_34px_rgba(45,23,54,0.05)]">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#807486]">
            Connections added
          </p>
          <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-[#2D1736]">
            {connectionCount}/5
          </p>
          <p className="mt-2 text-xs font-semibold text-[#8B808F]">
            Google, Meta and search tools
          </p>
        </article>

        <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_12px_34px_rgba(45,23,54,0.05)]">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#807486]">
            Visitor privacy
          </p>
          <p className="mt-2 text-lg font-black text-[#2D1736]">
            Consent protected
          </p>
          <p className="mt-2 text-xs font-semibold leading-5 text-[#8B808F]">
            Marketing tools activate only after permission.
          </p>
        </article>

        <article className="rounded-[24px] border border-[#E9E2ED] bg-white p-5 shadow-[0_12px_34px_rgba(45,23,54,0.05)]">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#807486]">
            Last updated
          </p>
          <p className="mt-2 text-sm font-black leading-6 text-[#2D1736]">
            {formatUpdatedAt(settings.updatedAt)}
          </p>
          {websiteUrl ? (
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-black text-[#5B2A86] hover:underline"
            >
              Open website
              <ExternalLink aria-hidden="true" size={13} />
            </a>
          ) : null}
        </article>
      </section>

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
              <BarChart3 aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                Website analytics
              </p>
              <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                Google measurement
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#7D7181]">
                Add Tag Manager if an agency manages several Google tools, or add
                the GA4 measurement ID for direct Google Analytics.
              </p>
            </div>
          </div>
          <StatusBadge
            connected={Boolean(
              settings.googleTagManagerId || settings.googleAnalyticsId,
            )}
          />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-black text-[#4B3F50]">
            Google Tag Manager ID
            <input
              value={settings.googleTagManagerId}
              onChange={(event) =>
                updateText(
                  "googleTagManagerId",
                  cleanUppercaseId(event.target.value),
                )
              }
              maxLength={30}
              placeholder="GTM-ABC1234"
              autoComplete="off"
              spellCheck={false}
              className={inputClassName}
            />
            <FieldHelp>Found inside the Google Tag Manager container.</FieldHelp>
          </label>

          <label className="block text-sm font-black text-[#4B3F50]">
            Google Analytics 4 ID
            <input
              value={settings.googleAnalyticsId}
              onChange={(event) =>
                updateText(
                  "googleAnalyticsId",
                  cleanUppercaseId(event.target.value),
                )
              }
              maxLength={30}
              placeholder="G-ABC1234567"
              autoComplete="off"
              spellCheck={false}
              className={inputClassName}
            />
            <FieldHelp>Use the GA4 web-stream measurement ID beginning with G-.</FieldHelp>
          </label>
        </div>

        <div className="mt-5">
          <ToggleControl
            checked={settings.analyticsEnabled}
            disabled={
              !settings.googleTagManagerId && !settings.googleAnalyticsId
            }
            title="Enable Google analytics after consent"
            description="Keep this off while the account or container is still being prepared."
            onChange={(checked) => updateToggle("analyticsEnabled", checked)}
          />
        </div>

      </section>

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3D5] text-[#8A6100]">
              <Megaphone aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#8A6100]">
                Google Ads
              </p>
              <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                Admission enquiry conversions
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#7D7181]">
                Measure completed website enquiry forms as conversions when you
                begin running Google Ads.
              </p>
            </div>
          </div>
          <StatusBadge connected={Boolean(settings.googleAdsId)} />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-black text-[#4B3F50]">
            Google Ads ID
            <input
              value={settings.googleAdsId}
              onChange={(event) =>
                updateText(
                  "googleAdsId",
                  cleanUppercaseId(event.target.value),
                )
              }
              maxLength={30}
              placeholder="AW-123456789"
              autoComplete="off"
              spellCheck={false}
              className={inputClassName}
            />
            <FieldHelp>Use the conversion ID beginning with AW-.</FieldHelp>
          </label>

          <label className="block text-sm font-black text-[#4B3F50]">
            Enquiry conversion label
            <input
              value={settings.googleAdsConversionLabel}
              onChange={(event) =>
                updateText(
                  "googleAdsConversionLabel",
                  event.target.value.replace(/\s+/g, ""),
                )
              }
              maxLength={100}
              placeholder="AbCdEFgHiJkLmNoP"
              autoComplete="off"
              spellCheck={false}
              className={inputClassName}
            />
            <FieldHelp>Paste only the label, not the complete event snippet.</FieldHelp>
          </label>
        </div>

        <div className="mt-5">
          <ToggleControl
            checked={settings.advertisingEnabled}
            disabled={!settings.googleAdsId}
            title="Enable Google Ads conversion tracking"
            description="A conversion will be sent after a website enquiry is submitted."
            onChange={(checked) => updateToggle("advertisingEnabled", checked)}
          />
        </div>
      </section>

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2765A4]">
              <Share2 aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#2765A4]">
                Meta Ads
              </p>
              <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                Facebook and Instagram Pixel
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#7D7181]">
                Measure website visits and submitted admission enquiries for
                Facebook and Instagram campaigns.
              </p>
            </div>
          </div>
          <StatusBadge connected={Boolean(settings.metaPixelId)} />
        </div>

        <label className="mt-6 block max-w-xl text-sm font-black text-[#4B3F50]">
          Meta Pixel ID
          <input
            value={settings.metaPixelId}
            onChange={(event) =>
              updateText(
                "metaPixelId",
                event.target.value.replace(/\D/g, ""),
              )
            }
            inputMode="numeric"
            maxLength={35}
            placeholder="123456789012345"
            autoComplete="off"
            spellCheck={false}
            className={inputClassName}
          />
          <FieldHelp>Paste only the numeric Dataset or Pixel ID—not script code.</FieldHelp>
        </label>

        <div className="mt-5">
          <ToggleControl
            checked={settings.metaPixelEnabled}
            disabled={!settings.metaPixelId}
            title="Enable Meta Pixel after consent"
            description="Page views and submitted enquiries will be measured after permission."
            onChange={(checked) => updateToggle("metaPixelEnabled", checked)}
          />
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-[#DCE8F5] bg-[#F4F8FD] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-black text-[#254C72]">
              Meta Conversions API
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#5D7185]">
              Sends consented enquiry conversions from the server and deduplicates them with the browser Pixel.
            </p>
          </div>
          <StatusBadge connected={metaConversionsApiReady} />
        </div>
      </section>

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6 lg:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E9F8F2] text-[#28755D]">
              <SearchCheck aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#28755D]">
                Search ownership
              </p>
              <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                Google and Bing verification
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#7D7181]">
                Verify website ownership so search engines can report indexing,
                search visibility and technical issues.
              </p>
            </div>
          </div>
          <StatusBadge
            connected={Boolean(
              settings.googleSearchConsoleVerification &&
                settings.bingWebmasterVerification,
            )}
          />
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-black text-[#4B3F50]">
            Google Search Console verification
            <input
              value={settings.googleSearchConsoleVerification}
              onChange={(event) =>
                updateText(
                  "googleSearchConsoleVerification",
                  event.target.value,
                )
              }
              maxLength={500}
              placeholder="Paste token or complete meta tag"
              autoComplete="off"
              spellCheck={false}
              className={inputClassName}
            />
            <FieldHelp>The panel safely extracts the content token from a meta tag.</FieldHelp>
          </label>

          <label className="block text-sm font-black text-[#4B3F50]">
            Bing Webmaster Tools verification
            <input
              value={settings.bingWebmasterVerification}
              onChange={(event) =>
                updateText(
                  "bingWebmasterVerification",
                  event.target.value,
                )
              }
              maxLength={500}
              placeholder="Paste token or complete meta tag"
              autoComplete="off"
              spellCheck={false}
              className={inputClassName}
            />
            <FieldHelp>Bing also supports discovery across Microsoft services.</FieldHelp>
          </label>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[24px] border border-[#E4D4EA] bg-[#F7F0FA] p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck aria-hidden="true" className="mt-0.5 shrink-0 text-[#5B2A86]" size={21} />
            <div>
              <h2 className="text-sm font-black text-[#2D1736]">
                Safe ID-only setup
              </h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#756979]">
                This panel never accepts pasted JavaScript. It stores only
                validated account IDs, conversion labels and verification tokens.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[24px] border border-[#DCEBE6] bg-[#F1FAF7] p-5">
          <div className="flex items-start gap-3">
            <Cookie aria-hidden="true" className="mt-0.5 shrink-0 text-[#28755D]" size={21} />
            <div>
              <h2 className="text-sm font-black text-[#254F43]">
                Visitor choice is respected
              </h2>
              <p className="mt-2 text-xs font-semibold leading-5 text-[#55736A]">
                Search verification needs no consent. Analytics and advertising
                tools remain off until the visitor accepts them.
              </p>
            </div>
          </div>
        </article>
      </section>

      <div className="sticky bottom-4 z-20 rounded-[24px] border border-[#DCCFE4] bg-white/95 p-3 shadow-[0_18px_55px_rgba(45,23,54,0.18)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4">
        <div className="hidden items-center gap-3 sm:flex">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
            <Tag aria-hidden="true" size={19} />
          </span>
          <div>
            <p className="text-sm font-black text-[#2D1736]">
              Save all website connections together
            </p>
            <p className="text-xs font-semibold text-[#887D8B]">
              Empty fields remain safely disabled.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white transition hover:bg-[#4B206F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {saving ? (
            <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
          ) : (
            <Save aria-hidden="true" size={18} />
          )}
          {saving ? "Saving…" : "Save Tracking Settings"}
        </button>

        <button
          type="button"
          disabled={saving}
          onClick={() => void handleSaveAndEnable()}
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-6 text-sm font-black text-[#2D1736] transition hover:bg-[#FFD65F] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto"
        >
          <BadgeCheck aria-hidden="true" size={18} />
          Save & Enable Connected Tools
        </button>
      </div>

      <p className="flex items-center justify-center gap-2 text-center text-xs font-semibold text-[#8A7E8D]">
        <BadgeCheck aria-hidden="true" size={15} />
        Changes are protected by Website Manager permission.
      </p>
    </form>
  );
}
