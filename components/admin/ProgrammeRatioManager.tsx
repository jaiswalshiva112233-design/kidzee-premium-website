"use client";

import {
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  Save,
  UsersRound,
} from "lucide-react";
import { type FormEvent, useEffect, useState } from "react";

type RatioSettings = {
  youngGroupChildrenPerTeacher: number;
  kindergartenChildrenPerTeacher: number;
};

type SettingsResponse = {
  success?: boolean;
  message?: string;
  settings?: RatioSettings;
};

const defaultSettings: RatioSettings = {
  youngGroupChildrenPerTeacher: 8,
  kindergartenChildrenPerTeacher: 10,
};

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-base font-black text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:bg-[#F7F4F8]";

export default function ProgrammeRatioManager() {
  const [settings, setSettings] = useState(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSettings() {
      try {
        const response = await fetch(
          "/api/admin/website-programme-settings",
          { cache: "no-store" },
        );
        const result = (await response.json()) as SettingsResponse;

        if (!response.ok || !result.success || !result.settings) {
          throw new Error(
            result.message ?? "Programme settings could not be loaded.",
          );
        }

        if (active) {
          setSettings(result.settings);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Programme settings could not be loaded.",
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

  function updateRatio(field: keyof RatioSettings, value: string) {
    setSettings((current) => ({
      ...current,
      [field]: Number(value.replace(/\D/g, "")),
    }));
    setError("");
    setSuccess("");
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const values = [
      settings.youngGroupChildrenPerTeacher,
      settings.kindergartenChildrenPerTeacher,
    ];

    if (
      values.some(
        (value) => !Number.isInteger(value) || value < 2 || value > 30,
      )
    ) {
      setError("Enter a whole number between 2 and 30 for both ratios.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/admin/website-programme-settings",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(settings),
        },
      );
      const result = (await response.json()) as SettingsResponse;

      if (!response.ok || !result.success || !result.settings) {
        throw new Error(
          result.message ?? "Teacher-child ratios could not be saved.",
        );
      }

      setSettings(result.settings);
      setSuccess(
        result.message ?? "Teacher-child ratios have been updated.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Teacher-child ratios could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={saveSettings}
      className="rounded-[28px] border border-[#E5D9EA] bg-white p-5 shadow-[0_16px_46px_rgba(45,23,54,0.06)] sm:p-6 lg:p-7"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
            <UsersRound aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Homepage USP
            </p>
            <h2 className="mt-1 text-xl font-black text-[#2D1736]">
              Teacher-child ratios
            </h2>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-[#7B7080]">
              These figures appear once on the homepage, once in the main
              Programmes FAQ and once on the relevant programme page.
            </p>
          </div>
        </div>

        <span className="rounded-full border border-[#E2D6E7] bg-[#FAF7FC] px-3 py-2 text-xs font-black text-[#5B2A86]">
          One teacher : children
        </span>
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-5 flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
        >
          <CircleAlert aria-hidden="true" size={18} className="shrink-0" />
          {error}
        </p>
      ) : null}

      {success ? (
        <p
          role="status"
          className="mt-5 flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700"
        >
          <CheckCircle2 aria-hidden="true" size={18} className="shrink-0" />
          {success}
        </p>
      ) : null}

      <fieldset disabled={loading || saving} className="mt-6">
        <legend className="sr-only">Teacher-child ratio settings</legend>
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-black text-[#4B3F50]">
            Playgroup and Nursery
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-base font-black text-[#5B2A86]">
                1 :
              </span>
              <input
                type="number"
                min={2}
                max={30}
                step={1}
                value={settings.youngGroupChildrenPerTeacher}
                onChange={(event) =>
                  updateRatio(
                    "youngGroupChildrenPerTeacher",
                    event.target.value,
                  )
                }
                className={`${inputClassName} pl-12`}
              />
            </div>
            <span className="mt-2 block text-xs font-semibold leading-5 text-[#887D8B]">
              Used for the 2–4 year age groups.
            </span>
          </label>

          <label className="block text-sm font-black text-[#4B3F50]">
            Junior KG and Senior KG
            <div className="relative">
              <span className="pointer-events-none absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-base font-black text-[#5B2A86]">
                1 :
              </span>
              <input
                type="number"
                min={2}
                max={30}
                step={1}
                value={settings.kindergartenChildrenPerTeacher}
                onChange={(event) =>
                  updateRatio(
                    "kindergartenChildrenPerTeacher",
                    event.target.value,
                  )
                }
                className={`${inputClassName} pl-12`}
              />
            </div>
            <span className="mt-2 block text-xs font-semibold leading-5 text-[#887D8B]">
              Used for the 4–6 year age groups.
            </span>
          </label>
        </div>
      </fieldset>

      <div className="mt-6 flex flex-col gap-4 rounded-[22px] bg-[#F8F4FA] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold leading-6 text-[#6F6474]">
          Current website wording: <strong>1:{settings.youngGroupChildrenPerTeacher}</strong>
          {" "}for Playgroup and Nursery; <strong>1:{settings.kindergartenChildrenPerTeacher}</strong>
          {" "}for Junior KG and Senior KG.
        </p>
        <button
          type="submit"
          disabled={loading || saving}
          className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white transition hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:opacity-55"
        >
          {loading || saving ? (
            <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
          ) : (
            <Save aria-hidden="true" size={18} />
          )}
          {loading ? "Loading…" : saving ? "Saving…" : "Save Ratios"}
        </button>
      </div>
    </form>
  );
}
