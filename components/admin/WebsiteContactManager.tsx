"use client";

import {
  CheckCircle2,
  Clock3,
  LoaderCircle,
  MapPin,
  Phone,
  RefreshCw,
  Save,
  Share2,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

import {
  defaultSiteContactSettings,
  type SiteContactSettings,
} from "@/lib/siteContact";

type ApiResponse = {
  success?: boolean;
  message?: string;
  errors?: string[];
  settings?: SiteContactSettings;
};

type FieldDefinition = {
  key: keyof SiteContactSettings;
  label: string;
  description?: string;
  type?: "text" | "email" | "url" | "time";
  multiline?: boolean;
  placeholder?: string;
};

const contactFields: FieldDefinition[] = [
  {
    key: "phone",
    label: "Calling and WhatsApp number",
    description: "Include the country code, for example +919667038673.",
    placeholder: "+919667038673",
  },
  {
    key: "phoneDisplay",
    label: "Phone number shown to parents",
    placeholder: "+91 96670 38673",
  },
  {
    key: "email",
    label: "Centre email",
    type: "email",
  },
];

const locationFields: FieldDefinition[] = [
  {
    key: "address",
    label: "Full postal address",
    multiline: true,
  },
  {
    key: "addressShort",
    label: "Short address",
    multiline: true,
  },
  {
    key: "map",
    label: "Google Maps directions link",
    type: "url",
  },
  {
    key: "mapEmbed",
    label: "Google Maps embed link",
    description:
      "In Google Maps choose Share, Embed a map, then copy only the URL inside src.",
    type: "url",
  },
  {
    key: "googleReviews",
    label: "Google Reviews link",
    type: "url",
  },
];

const socialFields: FieldDefinition[] = [
  {
    key: "instagram",
    label: "Instagram link",
    type: "url",
  },
  {
    key: "facebook",
    label: "Facebook link",
    type: "url",
  },
  {
    key: "youtube",
    label: "YouTube link",
    type: "url",
  },
];

function SettingsFields({
  fields,
  settings,
  disabled,
  onChange,
}: {
  fields: FieldDefinition[];
  settings: SiteContactSettings;
  disabled: boolean;
  onChange: (
    key: keyof SiteContactSettings,
    value: string,
  ) => void;
}) {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {fields.map((field) => (
        <label
          key={field.key}
          className={
            field.multiline ? "md:col-span-2" : ""
          }
        >
          <span className="text-sm font-black text-[#35243E]">
            {field.label}
          </span>

          {field.description ? (
            <span className="mt-1 block text-xs font-semibold leading-5 text-[#837887]">
              {field.description}
            </span>
          ) : null}

          {field.multiline ? (
            <textarea
              value={settings[field.key]}
              disabled={disabled}
              rows={3}
              placeholder={field.placeholder}
              onChange={(event) =>
                onChange(field.key, event.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:opacity-60"
            />
          ) : (
            <input
              type={field.type ?? "text"}
              value={settings[field.key]}
              disabled={disabled}
              placeholder={field.placeholder}
              onChange={(event) =>
                onChange(field.key, event.target.value)
              }
              className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:opacity-60"
            />
          )}
        </label>
      ))}
    </div>
  );
}

export default function WebsiteContactManager() {
  const [settings, setSettings] =
    useState<SiteContactSettings>({
      ...defaultSiteContactSettings,
    });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadSettings() {
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/website-contact",
        {
          cache: "no-store",
        },
      );
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.settings) {
        throw new Error(
          result.message ??
            "Unable to load website contact settings.",
        );
      }

      setSettings(result.settings);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load website contact settings.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadSettings();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  function updateSetting(
    key: keyof SiteContactSettings,
    value: string,
  ) {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
    setError("");
    setMessage("");
  }

  async function saveSettings(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        "/api/admin/website-contact",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settings),
        },
      );
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.errors?.[0] ??
            result.message ??
            "Unable to save website contact settings.",
        );
      }

      if (result.settings) {
        setSettings(result.settings);
      }

      setMessage(
        result.message ??
          "Website contact settings have been saved.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save website contact settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-[#E6DCEB] bg-white">
        <div className="text-center">
          <LoaderCircle
            aria-hidden="true"
            size={30}
            className="mx-auto animate-spin text-[#5B2A86]"
          />
          <p className="mt-3 text-sm font-bold text-[#6F6474]">
            Loading contact settings…
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void saveSettings(event)}
      className="space-y-6"
    >
      <section className="rounded-[28px] border border-[#E6DCEB] bg-white p-5 shadow-[0_14px_42px_rgba(45,23,54,0.06)] sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
            <Phone aria-hidden="true" size={21} />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#2D1736]">
              Phone, WhatsApp and email
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#746878]">
              The WhatsApp buttons are generated automatically from this phone
              number.
            </p>
          </div>
        </div>
        <SettingsFields
          fields={contactFields}
          settings={settings}
          disabled={saving}
          onChange={updateSetting}
        />
      </section>

      <section className="rounded-[28px] border border-[#E6DCEB] bg-white p-5 shadow-[0_14px_42px_rgba(45,23,54,0.06)] sm:p-7">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4FF] text-[#1769AA]">
            <MapPin aria-hidden="true" size={21} />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#2D1736]">
              Address, map and reviews
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-[#746878]">
              Use HTTPS links copied directly from your Google business and
              Maps pages.
            </p>
          </div>
        </div>
        <SettingsFields
          fields={locationFields}
          settings={settings}
          disabled={saving}
          onChange={updateSetting}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[28px] border border-[#E6DCEB] bg-white p-5 shadow-[0_14px_42px_rgba(45,23,54,0.06)] sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <Share2
              aria-hidden="true"
              size={22}
              className="text-[#5B2A86]"
            />
            <div>
              <h2 className="text-xl font-black text-[#2D1736]">
                Social links
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#746878]">
                Leave a network blank if it is not currently used.
              </p>
            </div>
          </div>
          <SettingsFields
            fields={socialFields}
            settings={settings}
            disabled={saving}
            onChange={updateSetting}
          />
        </div>

        <div className="rounded-[28px] border border-[#E6DCEB] bg-white p-5 shadow-[0_14px_42px_rgba(45,23,54,0.06)] sm:p-7">
          <div className="mb-6 flex items-start gap-3">
            <Clock3
              aria-hidden="true"
              size={22}
              className="text-[#5B2A86]"
            />
            <div>
              <h2 className="text-xl font-black text-[#2D1736]">
                Centre timings
              </h2>
              <p className="mt-1 text-sm font-semibold text-[#746878]">
                Times use the 24-hour format.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            {(["preschool", "daycare"] as const).map(
              (section) => {
                const label =
                  section === "preschool"
                    ? "Preschool"
                    : "Daycare";
                const daysKey =
                  `${section}Days` as keyof SiteContactSettings;
                const opensKey =
                  `${section}Opens` as keyof SiteContactSettings;
                const closesKey =
                  `${section}Closes` as keyof SiteContactSettings;

                return (
                  <fieldset
                    key={section}
                    className="rounded-2xl bg-[#FAF8FC] p-4"
                  >
                    <legend className="px-2 text-sm font-black text-[#2D1736]">
                      {label}
                    </legend>

                    <label className="mt-2 block">
                      <span className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
                        Days
                      </span>
                      <input
                        value={settings[daysKey]}
                        disabled={saving}
                        onChange={(event) =>
                          updateSetting(
                            daysKey,
                            event.target.value,
                          )
                        }
                        className="mt-2 min-h-11 w-full rounded-xl border border-[#DCCFE4] bg-white px-3 text-sm font-semibold text-[#2D1736]"
                      />
                    </label>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <label>
                        <span className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
                          Opens
                        </span>
                        <input
                          type="time"
                          value={settings[opensKey]}
                          disabled={saving}
                          onChange={(event) =>
                            updateSetting(
                              opensKey,
                              event.target.value,
                            )
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-[#DCCFE4] bg-white px-3 text-sm font-semibold text-[#2D1736]"
                        />
                      </label>

                      <label>
                        <span className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
                          Closes
                        </span>
                        <input
                          type="time"
                          value={settings[closesKey]}
                          disabled={saving}
                          onChange={(event) =>
                            updateSetting(
                              closesKey,
                              event.target.value,
                            )
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-[#DCCFE4] bg-white px-3 text-sm font-semibold text-[#2D1736]"
                        />
                      </label>
                    </div>
                  </fieldset>
                );
              },
            )}
          </div>
        </div>
      </section>

      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700"
        >
          {error}
        </div>
      ) : null}

      {message ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700"
        >
          <CheckCircle2
            aria-hidden="true"
            size={18}
            className="mt-0.5 shrink-0"
          />
          {message}
        </div>
      ) : null}

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[24px] border border-[#E6DCEB] bg-white/95 p-4 shadow-[0_18px_55px_rgba(45,23,54,0.16)] backdrop-blur sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => void loadSettings()}
          disabled={saving}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-white px-5 text-sm font-black text-[#5B2A86] disabled:opacity-50"
        >
          <RefreshCw aria-hidden="true" size={17} />
          Reload Saved Details
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)] transition hover:bg-[#4B206F] disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle
              aria-hidden="true"
              size={18}
              className="animate-spin"
            />
          ) : (
            <Save aria-hidden="true" size={18} />
          )}
          {saving ? "Saving…" : "Save Website Contact Details"}
        </button>
      </div>
    </form>
  );
}
