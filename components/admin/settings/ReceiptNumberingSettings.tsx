"use client";

import {
  CheckCircle2,
  Hash,
  LoaderCircle,
  ReceiptText,
  Save,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useState,
} from "react";

type ReceiptNumberingSettingsData = {
  currentValue: number;
  prefix: string;
  minimumWidth: number;
  resetPolicy: string;
  nextValue: number;
  preview: string;
};

type SettingsResponse = {
  success?: boolean;
  message?: string;
  settings?: ReceiptNumberingSettingsData;
};

type FormData = {
  currentValue: string;
  prefix: string;
  minimumWidth: string;
};

const initialFormData: FormData = {
  currentValue: "0",
  prefix: "KZ-RCP",
  minimumWidth: "2",
};

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

function buildLocalPreview(formData: FormData) {
  const currentValue = Number(
    formData.currentValue,
  );

  const minimumWidth = Math.max(
    Number(formData.minimumWidth) || 2,
    1,
  );

  const nextValue =
    Number.isFinite(currentValue) &&
    currentValue >= 0
      ? Math.floor(currentValue) + 1
      : 1;

  const serialText = String(nextValue).padStart(
    minimumWidth,
    "0",
  );

  const prefix = formData.prefix.trim();

  return prefix
    ? `${prefix}-${serialText}`
    : serialText;
}

export default function ReceiptNumberingSettings() {
  const [formData, setFormData] =
    useState<FormData>(initialFormData);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [savedSettings, setSavedSettings] =
    useState<ReceiptNumberingSettingsData | null>(
      null,
    );

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/admin/settings/receipt-numbering",
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const result =
          (await response.json()) as SettingsResponse;

        if (
          !response.ok ||
          !result.success ||
          !result.settings
        ) {
          throw new Error(
            result.message ??
              "Unable to load receipt numbering settings.",
          );
        }

        setSavedSettings(result.settings);

        setFormData({
          currentValue: String(
            result.settings.currentValue,
          ),

          prefix:
            result.settings.prefix ?? "",

          minimumWidth: String(
            result.settings.minimumWidth,
          ),
        });
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load receipt numbering settings.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadSettings();
  }, []);

  function updateField(
    field: keyof FormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function validateForm() {
    const currentValue = Number(
      formData.currentValue,
    );

    const minimumWidth = Number(
      formData.minimumWidth,
    );

    if (
      !Number.isInteger(currentValue) ||
      currentValue < 0
    ) {
      return "Current receipt number must be zero or greater.";
    }

    if (
      !Number.isInteger(minimumWidth) ||
      minimumWidth < 1 ||
      minimumWidth > 10
    ) {
      return "Minimum width must be between 1 and 10.";
    }

    if (
      formData.prefix.trim().length > 30
    ) {
      return "Receipt prefix cannot exceed 30 characters.";
    }

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        "/api/admin/settings/receipt-numbering",
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            currentValue: Number(
              formData.currentValue,
            ),

            prefix:
              formData.prefix.trim(),

            minimumWidth: Number(
              formData.minimumWidth,
            ),
          }),
        },
      );

      const result =
        (await response.json()) as SettingsResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.settings
      ) {
        throw new Error(
          result.message ??
            "Unable to save receipt numbering settings.",
        );
      }

      setSavedSettings(result.settings);

      setFormData({
        currentValue: String(
          result.settings.currentValue,
        ),

        prefix:
          result.settings.prefix ?? "",

        minimumWidth: String(
          result.settings.minimumWidth,
        ),
      });

      setSuccessMessage(
        result.message ??
          "Receipt numbering settings saved successfully.",
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save receipt numbering settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  const preview = buildLocalPreview(
    formData,
  );

  if (loading) {
    return (
      <div className="flex min-h-[260px] items-center justify-center rounded-[28px] border border-[#E9E2ED] bg-white">
        <LoaderCircle
          aria-hidden="true"
          size={28}
          className="animate-spin text-[#5B2A86]"
        />
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]"
    >
      <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
            <ReceiptText
              aria-hidden="true"
              size={22}
            />
          </span>

          <div>
            <h2 className="text-xl font-black text-[#2D1736] sm:text-2xl">
              Receipt Numbering
            </h2>

            <p className="mt-1 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">
              Enter the last receipt serial already used manually.
              CentreOS will generate the next serial automatically
              without resetting it in January or April.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-7 p-5 sm:p-6">
        <section className="grid gap-5 md:grid-cols-3">
          <label className="block">
            <span className="text-sm font-black text-[#35243E]">
              Last issued receipt number *
            </span>

            <input
              type="number"
              min="0"
              step="1"
              value={formData.currentValue}
              disabled={saving}
              placeholder="Example: 47"
              onChange={(event) =>
                updateField(
                  "currentValue",
                  event.target.value,
                )
              }
              className={inputClassName}
            />

            <span className="mt-2 block text-xs font-semibold leading-5 text-[#817684]">
              If your last manual receipt is 47, enter 47.
              The next CentreOS receipt will use serial 48.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-black text-[#35243E]">
              Receipt prefix
            </span>

            <input
              type="text"
              value={formData.prefix}
              disabled={saving}
              placeholder="KZ-RCP"
              onChange={(event) =>
                updateField(
                  "prefix",
                  event.target.value,
                )
              }
              className={inputClassName}
            />

            <span className="mt-2 block text-xs font-semibold leading-5 text-[#817684]">
              The prefix may change later without restarting the
              serial number.
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-black text-[#35243E]">
              Minimum serial digits *
            </span>

            <input
              type="number"
              min="1"
              max="10"
              step="1"
              value={formData.minimumWidth}
              disabled={saving}
              placeholder="2"
              onChange={(event) =>
                updateField(
                  "minimumWidth",
                  event.target.value,
                )
              }
              className={inputClassName}
            />

            <span className="mt-2 block text-xs font-semibold leading-5 text-[#817684]">
              Two digits displays 01–99. The serial automatically
              expands to 100 and above.
            </span>
          </label>
        </section>

        <section className="rounded-[24px] border border-[#DCCFE4] bg-[#F7F0FA] p-5 sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-sm">
                <Hash
                  aria-hidden="true"
                  size={20}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.11em] text-[#7A459C]">
                  Next receipt preview
                </p>

                <p className="mt-2 break-all text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                  {preview}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#625768] shadow-sm">
              Serial does not reset
            </div>
          </div>
        </section>

        {savedSettings ? (
          <section className="grid gap-3 sm:grid-cols-3">
            <SettingValue
              label="Saved current serial"
              value={String(
                savedSettings.currentValue,
              )}
            />

            <SettingValue
              label="Next serial"
              value={String(
                savedSettings.nextValue,
              )}
            />

            <SettingValue
              label="Reset policy"
              value="Never"
            />
          </section>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
          >
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
          >
            <CheckCircle2
              aria-hidden="true"
              size={19}
              className="mt-0.5 shrink-0"
            />

            {successMessage}
          </div>
        ) : null}
      </div>

      <div className="flex justify-end border-t border-[#EEE8F1] bg-white px-5 py-4 sm:px-6">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.2)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
        >
          {saving ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                size={18}
                className="animate-spin"
              />
              Saving Settings…
            </>
          ) : (
            <>
              <Save
                aria-hidden="true"
                size={18}
              />
              Save Receipt Numbering
            </>
          )}
        </button>
      </div>
    </form>
  );
}

type SettingValueProps = {
  label: string;
  value: string;
};

function SettingValue({
  label,
  value,
}: SettingValueProps) {
  return (
    <article className="rounded-[20px] bg-[#FAF8FC] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-[#2D1736]">
        {value}
      </p>
    </article>
  );
}