"use client";

import {
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  FilePenLine,
  LoaderCircle,
  Save,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

type WebsiteContentSettings = {
  academicYear: string;
  admissionsOpen: boolean;
  homeHeroAutoRotate: boolean;
  homeHeroRotationSeconds: number;
  homeHeroHeading: string;
  homeHeroHighlight: string;
  homeHeroLead: string;
  homeHeroSupport: string;
  aboutHeroHeading: string;
  aboutHeroHighlight: string;
  aboutHeroIntro: string;
  programmesHeroHeading: string;
  programmesHeroHighlight: string;
  programmesHeroIntro: string;
  daycareHeroHeading: string;
  daycareHeroHighlight: string;
  daycareHeroIntro: string;
  admissionsHeroHeading: string;
  admissionsHeroIntro: string;
  primaryCtaLabel: string;
  secondaryCtaLabel: string;
  updatedAt: string | null;
};

type SettingsResponse = {
  success?: boolean;
  message?: string;
  settings?: WebsiteContentSettings;
  errors?: string[];
};

const emptySettings: WebsiteContentSettings = {
  academicYear: "",
  admissionsOpen: true,
  homeHeroAutoRotate: true,
  homeHeroRotationSeconds: 5,
  homeHeroHeading: "",
  homeHeroHighlight: "",
  homeHeroLead: "",
  homeHeroSupport: "",
  aboutHeroHeading: "",
  aboutHeroHighlight: "",
  aboutHeroIntro: "",
  programmesHeroHeading: "",
  programmesHeroHighlight: "",
  programmesHeroIntro: "",
  daycareHeroHeading: "",
  daycareHeroHighlight: "",
  daycareHeroIntro: "",
  admissionsHeroHeading: "",
  admissionsHeroIntro: "",
  primaryCtaLabel: "",
  secondaryCtaLabel: "",
  updatedAt: null,
};

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none transition placeholder:text-[#AAA0AE] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10";

const textareaClassName = `${inputClassName} min-h-28 resize-y py-3 leading-6`;

type TextField = Exclude<
  keyof WebsiteContentSettings,
  | "admissionsOpen"
  | "homeHeroAutoRotate"
  | "homeHeroRotationSeconds"
  | "updatedAt"
>;

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Using the approved website wording";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Published";
  }

  return `Last published ${new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date)}`;
}

export default function WebsiteContentManager() {
  const router = useRouter();
  const [settings, setSettings] = useState(emptySettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch(
          "/api/admin/website-content-settings",
          { cache: "no-store" },
        );
        const result = (await response.json()) as SettingsResponse;

        if (!response.ok || !result.success || !result.settings) {
          throw new Error(result.message ?? "Website text could not be loaded.");
        }

        if (active) {
          setSettings(result.settings);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Website text could not be loaded.",
          );
        }
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

  function updateText(field: TextField, value: string) {
    setSettings((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/admin/website-content-settings",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        },
      );
      const result = (await response.json()) as SettingsResponse;

      if (!response.ok || !result.success || !result.settings) {
        throw new Error(
          result.errors?.[0] ??
            result.message ??
            "Website text could not be saved.",
        );
      }

      setSettings(result.settings);
      setSuccess(result.message ?? "Website text has been published.");
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Website text could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-80 items-center justify-center rounded-[28px] border border-[#E9E2ED] bg-white">
        <div className="text-center">
          <LoaderCircle
            aria-hidden="true"
            size={34}
            className="mx-auto animate-spin text-[#5B2A86]"
          />
          <p className="mt-4 text-sm font-black text-[#615567]">
            Loading website text…
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700" role="alert">
          <CircleAlert aria-hidden="true" size={19} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold leading-6 text-green-700" role="status">
          <CheckCircle2 aria-hidden="true" size={19} className="mt-0.5 shrink-0" />
          {success}
        </div>
      ) : null}

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF3D5] text-[#8A6100]">
              <CalendarRange aria-hidden="true" size={22} />
            </span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#8A6100]">
                Yearly admission update
              </p>
              <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                Academic year and admission status
              </h2>
              <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#7D7181]">
                Change this once when the next admission session begins. The new
                year appears on the homepage and admissions page.
              </p>
            </div>
          </div>

          <label className="flex min-h-12 items-center justify-between gap-4 rounded-2xl border border-[#E5DCE9] bg-[#FAF8FB] px-4 py-3 text-sm font-black text-[#2D1736]">
            Admissions open
            <input
              type="checkbox"
              checked={settings.admissionsOpen}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  admissionsOpen: event.target.checked,
                }))
              }
              className="h-5 w-5 accent-[#5B2A86]"
            />
          </label>
        </div>

        <label className="mt-6 block max-w-sm text-sm font-black text-[#4B3F50]">
          Academic year
          <input
            value={settings.academicYear}
            onChange={(event) => updateText("academicYear", event.target.value)}
            maxLength={20}
            placeholder="2027–28"
            className={inputClassName}
          />
        </label>
      </section>

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
            <Sparkles aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">Homepage</p>
            <h2 className="mt-1 text-xl font-black text-[#2D1736]">Main admission message</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#7D7181]">Keep this short, warm and specific to your centre.</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="text-sm font-black text-[#4B3F50]">
            Headline
            <input value={settings.homeHeroHeading} onChange={(event) => updateText("homeHeroHeading", event.target.value)} maxLength={100} className={inputClassName} />
          </label>
          <label className="text-sm font-black text-[#4B3F50]">
            Purple highlighted words
            <input value={settings.homeHeroHighlight} onChange={(event) => updateText("homeHeroHighlight", event.target.value)} maxLength={70} className={inputClassName} />
          </label>
          <label className="text-sm font-black text-[#4B3F50] md:col-span-2">
            Main supporting line
            <textarea value={settings.homeHeroLead} onChange={(event) => updateText("homeHeroLead", event.target.value)} maxLength={220} className={textareaClassName} />
          </label>
          <label className="text-sm font-black text-[#4B3F50] md:col-span-2">
            Short trust message
            <textarea value={settings.homeHeroSupport} onChange={(event) => updateText("homeHeroSupport", event.target.value)} maxLength={260} className={textareaClassName} />
          </label>
          <label className="text-sm font-black text-[#4B3F50]">
            Main button
            <input value={settings.primaryCtaLabel} onChange={(event) => updateText("primaryCtaLabel", event.target.value)} maxLength={40} className={inputClassName} />
          </label>
          <label className="text-sm font-black text-[#4B3F50]">
            Call button
            <input value={settings.secondaryCtaLabel} onChange={(event) => updateText("secondaryCtaLabel", event.target.value)} maxLength={40} className={inputClassName} />
          </label>

          <div className="rounded-[22px] border border-[#E5DCE9] bg-[#FAF8FB] p-4 md:col-span-2">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black text-[#2D1736]">
                  Hero photo rotation
                </p>
                <p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[#7D7181]">
                  Applies to the homepage photo carousel. Other page heroes use
                  one photograph and do not rotate.
                </p>
              </div>

              <label className="flex min-h-11 items-center justify-between gap-4 rounded-2xl border border-[#DED3E3] bg-white px-4 text-sm font-black text-[#2D1736]">
                Auto-rotate
                <input
                  type="checkbox"
                  checked={settings.homeHeroAutoRotate}
                  onChange={(event) => {
                    setSettings((current) => ({
                      ...current,
                      homeHeroAutoRotate: event.target.checked,
                    }));
                    setError("");
                    setSuccess("");
                  }}
                  className="h-5 w-5 accent-[#5B2A86]"
                />
              </label>
            </div>

            <label className="mt-4 block max-w-xs text-sm font-black text-[#4B3F50]">
              Seconds between photos
              <input
                type="number"
                required
                min={3}
                max={60}
                step={1}
                value={settings.homeHeroRotationSeconds}
                disabled={!settings.homeHeroAutoRotate}
                onChange={(event) => {
                  setSettings((current) => ({
                    ...current,
                    homeHeroRotationSeconds: Number(event.target.value),
                  }));
                  setError("");
                  setSuccess("");
                }}
                className={`${inputClassName} disabled:cursor-not-allowed disabled:bg-[#F1EDF3] disabled:text-[#8F8492]`}
              />
              <span className="mt-2 block text-xs font-semibold leading-5 text-[#7D7181]">
                Choose a whole number from 3 to 60 seconds.
              </span>
            </label>
          </div>
        </div>
      </section>

      {[
        {
          title: "About page",
          headingField: "aboutHeroHeading" as const,
          highlightField: "aboutHeroHighlight" as const,
          introField: "aboutHeroIntro" as const,
        },
        {
          title: "Programmes page",
          headingField: "programmesHeroHeading" as const,
          highlightField: "programmesHeroHighlight" as const,
          introField: "programmesHeroIntro" as const,
        },
        {
          title: "Daycare page",
          headingField: "daycareHeroHeading" as const,
          highlightField: "daycareHeroHighlight" as const,
          introField: "daycareHeroIntro" as const,
        },
      ].map((section) => (
        <section key={section.title} className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-7">
          <div className="flex items-center gap-3">
            <FilePenLine aria-hidden="true" size={21} className="text-[#5B2A86]" />
            <h2 className="text-xl font-black text-[#2D1736]">{section.title}</h2>
          </div>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="text-sm font-black text-[#4B3F50]">
              Headline
              <input value={settings[section.headingField]} onChange={(event) => updateText(section.headingField, event.target.value)} maxLength={110} className={inputClassName} />
            </label>
            <label className="text-sm font-black text-[#4B3F50]">
              Purple highlighted words
              <input value={settings[section.highlightField]} onChange={(event) => updateText(section.highlightField, event.target.value)} maxLength={70} className={inputClassName} />
            </label>
            <label className="text-sm font-black text-[#4B3F50] md:col-span-2">
              Introduction
              <textarea value={settings[section.introField]} onChange={(event) => updateText(section.introField, event.target.value)} maxLength={280} className={textareaClassName} />
            </label>
          </div>
        </section>
      ))}

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-7">
        <div className="flex items-center gap-3">
          <FilePenLine aria-hidden="true" size={21} className="text-[#5B2A86]" />
          <h2 className="text-xl font-black text-[#2D1736]">Admissions page</h2>
        </div>
        <div className="mt-5 grid gap-5">
          <label className="text-sm font-black text-[#4B3F50]">
            Headline
            <input value={settings.admissionsHeroHeading} onChange={(event) => updateText("admissionsHeroHeading", event.target.value)} maxLength={130} className={inputClassName} />
          </label>
          <label className="text-sm font-black text-[#4B3F50]">
            Introduction
            <textarea value={settings.admissionsHeroIntro} onChange={(event) => updateText("admissionsHeroIntro", event.target.value)} maxLength={280} className={textareaClassName} />
          </label>
        </div>
      </section>

      <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-[24px] border border-[#DCCFE4] bg-white/95 p-4 shadow-[0_18px_55px_rgba(45,23,54,0.18)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-[#817684]">
          {formatUpdatedAt(settings.updatedAt)}
        </p>
        <button type="submit" disabled={saving} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white transition hover:bg-[#4B206F] disabled:opacity-60">
          {saving ? <LoaderCircle aria-hidden="true" size={18} className="animate-spin" /> : <Save aria-hidden="true" size={18} />}
          {saving ? "Publishing…" : "Publish Website Changes"}
        </button>
      </div>
    </form>
  );
}
