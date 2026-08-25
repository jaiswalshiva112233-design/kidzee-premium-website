"use client";

import Image from "next/image";
import {
  CheckCircle2,
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  RotateCcw,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { type MediaSlot } from "@/lib/admin/mediaSlots";

type SavedMedia = {
  _id: string;
  slotKey: string;
  label: string;
  altText: string;
  imageUrl: string | null;
  updatedAt: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  media?: SavedMedia[] | SavedMedia;
};

type UploadState = {
  file: File | null;
  previewUrl: string | null;
  altText: string;
  uploading: boolean;
  restoring: boolean;
  message: string;
  error: string;
};

const emptyUploadState: UploadState = {
  file: null,
  previewUrl: null,
  altText: "",
  uploading: false,
  restoring: false,
  message: "",
  error: "",
};

function createInitialUploadStates(slots: MediaSlot[]) {
  return Object.fromEntries(
    slots.map((slot) => [
      slot.key,
      {
        ...emptyUploadState,
        altText: slot.label,
      },
    ]),
  ) as Record<string, UploadState>;
}

type WebsiteMediaManagerProps = {
  slots: MediaSlot[];
  pageLabel: string;
  introduction: string;
};

export default function WebsiteMediaManager({
  slots,
  pageLabel,
  introduction,
}: WebsiteMediaManagerProps) {
  const [savedMedia, setSavedMedia] = useState<SavedMedia[]>([]);
  const [uploadStates, setUploadStates] = useState<
    Record<string, UploadState>
  >(() => createInitialUploadStates(slots));

  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const previewUrlsRef = useRef<Set<string>>(new Set());

  const savedMediaBySlot = useMemo(() => {
    return new Map(
      savedMedia.map((item) => [item.slotKey, item]),
    );
  }, [savedMedia]);

  const sections = useMemo(() => {
    const sectionMap = new Map<string, MediaSlot[]>();

    slots.forEach((slot) => {
      const currentSlots =
        sectionMap.get(slot.section) ?? [];

      currentSlots.push(slot);
      sectionMap.set(slot.section, currentSlots);
    });

    return Array.from(sectionMap.entries());
  }, [slots]);

  function revokePreviewUrl(previewUrl: string | null) {
    if (!previewUrl) {
      return;
    }

    URL.revokeObjectURL(previewUrl);
    previewUrlsRef.current.delete(previewUrl);
  }

  async function loadMedia() {
    setLoading(true);
    setPageError("");

    try {
      const response = await fetch("/api/admin/media", {
        method: "GET",
        cache: "no-store",
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "Unable to load photos.",
        );
      }

      const mediaItems: SavedMedia[] = Array.isArray(
        result.media,
      )
        ? result.media
        : result.media
          ? [result.media]
          : [];

      setSavedMedia(mediaItems);

      setUploadStates((currentStates) => {
        const nextStates = { ...currentStates };

        mediaItems.forEach((item: SavedMedia) => {
          const existingState =
            nextStates[item.slotKey];

          if (!existingState) {
            return;
          }

          nextStates[item.slotKey] = {
            ...existingState,
            altText:
              item.altText ||
              existingState.altText,
          };
        });

        return nextStates;
      });
    } catch (error) {
      setPageError(
        error instanceof Error
          ? error.message
          : "Unable to load website photos.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMedia();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    const previewUrls = previewUrlsRef.current;

    return () => {
      previewUrls.forEach((previewUrl) => {
        URL.revokeObjectURL(previewUrl);
      });

      previewUrls.clear();
    };
  }, []);

  function updateSlotState(
    slotKey: string,
    updates: Partial<UploadState>,
  ) {
    setUploadStates((currentStates) => ({
      ...currentStates,
      [slotKey]: {
        ...currentStates[slotKey],
        ...updates,
      },
    }));
  }

  function handleFileChange(
    slotKey: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ?? null;

    const currentPreview =
      uploadStates[slotKey]?.previewUrl ?? null;

    revokePreviewUrl(currentPreview);

    if (!file) {
      updateSlotState(slotKey, {
        file: null,
        previewUrl: null,
        error: "",
        message: "",
      });

      return;
    }

    const previewUrl =
      URL.createObjectURL(file);

    previewUrlsRef.current.add(previewUrl);

    updateSlotState(slotKey, {
      file,
      previewUrl,
      error: "",
      message: "",
    });
  }

  async function handleUpload(
    event: FormEvent<HTMLFormElement>,
    slot: MediaSlot,
  ) {
    event.preventDefault();

    const state = uploadStates[slot.key];

    if (!state?.file) {
      updateSlotState(slot.key, {
        error:
          "Please choose a photograph first.",
        message: "",
      });

      return;
    }

    updateSlotState(slot.key, {
      uploading: true,
      error: "",
      message: "",
    });

    try {
      const formData = new FormData();

      formData.set("slotKey", slot.key);
      formData.set(
        "altText",
        state.altText.trim() || slot.label,
      );
      formData.set("file", state.file);

      const response = await fetch(
        "/api/admin/media",
        {
          method: "POST",
          body: formData,
        },
      );

      const result =
        (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "The photograph could not be uploaded.",
        );
      }

      const uploadedMedia =
        Array.isArray(result.media)
          ? result.media[0]
          : result.media;

      if (uploadedMedia) {
        setSavedMedia((currentMedia) => [
          uploadedMedia,
          ...currentMedia.filter(
            (item) =>
              item.slotKey !==
              uploadedMedia.slotKey,
          ),
        ]);
      }

      revokePreviewUrl(state.previewUrl);

      updateSlotState(slot.key, {
        file: null,
        previewUrl: null,
        uploading: false,
        message:
          result.message ??
          `${slot.label} has been updated.`,
        error: "",
      });
    } catch (error) {
      updateSlotState(slot.key, {
        uploading: false,
        message: "",
        error:
          error instanceof Error
            ? error.message
            : "The photograph could not be uploaded.",
      });
    }
  }

  async function handleRestore(slot: MediaSlot) {
    const confirmed = window.confirm(
      `Restore the original photo for "${slot.label}"?`,
    );

    if (!confirmed) {
      return;
    }

    const state = uploadStates[slot.key];

    updateSlotState(slot.key, {
      restoring: true,
      error: "",
      message: "",
    });

    try {
      const response = await fetch("/api/admin/media", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotKey: slot.key,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "The original photograph could not be restored.",
        );
      }

      setSavedMedia((currentMedia) =>
        currentMedia.filter(
          (item) => item.slotKey !== slot.key,
        ),
      );

      revokePreviewUrl(state?.previewUrl ?? null);

      updateSlotState(slot.key, {
        file: null,
        previewUrl: null,
        restoring: false,
        message:
          result.message ??
          `${slot.label} has been restored.`,
        error: "",
      });
    } catch (error) {
      updateSlotState(slot.key, {
        restoring: false,
        message: "",
        error:
          error instanceof Error
            ? error.message
            : "The original photograph could not be restored.",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-[#5B2A86]/10 bg-white">
        <div className="text-center">
          <LoaderCircle
            aria-hidden="true"
            size={30}
            className="mx-auto animate-spin text-[#5B2A86]"
          />

          <p className="mt-3 text-sm font-bold text-[#6F6474]">
            Loading website photos…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-4 rounded-[28px] border border-[#5B2A86]/10 bg-white p-5 shadow-[0_14px_42px_rgba(45,23,54,0.06)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <p className="text-sm font-black text-[#2D1736]">
            {pageLabel} photographs
          </p>

          <p className="mt-1 text-sm leading-6 text-[#6F6474]">
            {introduction}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadMedia()}
          disabled={loading}
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-[#5B2A86]/15 bg-[#FAF7FC] px-5 text-sm font-black text-[#5B2A86] transition hover:bg-[#F3EAF8] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw
            aria-hidden="true"
            size={17}
          />
          Refresh
        </button>
      </div>

      {pageError ? (
        <div
          role="alert"
          className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700"
        >
          {pageError}
        </div>
      ) : null}

      <div className="mt-8 space-y-10">
        {sections.map(
          ([sectionName, slots]) => (
            <section key={sectionName}>
              <div>
                <p className="text-sm font-black uppercase tracking-[0.14em] text-[#7A459C]">
                  {pageLabel}
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-[-0.025em] text-[#2D1736]">
                  {sectionName}
                </h2>
              </div>

              <div className="mt-5 grid gap-6 lg:grid-cols-2">
                {slots.map((slot) => {
                  const currentMedia =
                    savedMediaBySlot.get(
                      slot.key,
                    );

                  const state =
                    uploadStates[slot.key] ??
                    emptyUploadState;

                  const displayedImage =
                    state.previewUrl ??
                    currentMedia?.imageUrl ??
                    slot.fallbackPath;

                  const displayedAltText =
                    state.altText ||
                    currentMedia?.altText ||
                    slot.label;

                  return (
                    <form
                      key={slot.key}
                      onSubmit={(event) =>
                        void handleUpload(
                          event,
                          slot,
                        )
                      }
                      className="overflow-hidden rounded-[30px] border border-[#5B2A86]/10 bg-white shadow-[0_16px_48px_rgba(45,23,54,0.07)]"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-[#EFE8F3]">
                        <Image
                          src={displayedImage}
                          alt={displayedAltText}
                          fill
                          unoptimized={displayedImage.startsWith(
                            "http",
                          )}
                          sizes="(max-width: 1024px) 100vw, 50vw"
                          className="object-cover"
                        />

                        <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-2 text-xs font-black text-[#5B2A86] shadow-lg backdrop-blur">
                          {currentMedia?.imageUrl
                            ? "CMS photo"
                            : "Current website photo"}
                        </div>

                        {state.previewUrl ? (
                          <div className="absolute right-4 top-4 rounded-full bg-[#F6C84B] px-3 py-2 text-xs font-black text-[#2D1736] shadow-lg">
                            New preview
                          </div>
                        ) : null}
                      </div>

                      <div className="p-5 sm:p-6">
                        <div className="flex items-start gap-3">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                            <ImagePlus
                              aria-hidden="true"
                              size={20}
                            />
                          </span>

                          <div>
                            <h3 className="text-lg font-black text-[#2D1736]">
                              {slot.label}
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-[#6F6474]">
                              {slot.description}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 rounded-2xl bg-[#FAF7FC] px-4 py-3">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                            Recommended
                          </p>

                          <p className="mt-1 text-sm font-semibold text-[#554A59]">
                            {slot.recommendedSize}
                          </p>
                        </div>

                        <div className="mt-5">
                          <label
                            htmlFor={`${slot.key}-file`}
                            className="text-sm font-black text-[#35243E]"
                          >
                            Choose a new photograph
                          </label>

                          <input
                            id={`${slot.key}-file`}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/avif"
                            disabled={state.uploading || state.restoring}
                            onChange={(event) =>
                              handleFileChange(
                                slot.key,
                                event,
                              )
                            }
                            className="mt-2 block w-full cursor-pointer rounded-2xl border border-[#DCCFE4] bg-white text-sm font-semibold text-[#5F5663] file:mr-4 file:cursor-pointer file:border-0 file:bg-[#F3EAF8] file:px-4 file:py-3 file:text-sm file:font-black file:text-[#5B2A86] hover:file:bg-[#EADDF1] disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </div>

                        <div className="mt-5">
                          <label
                            htmlFor={`${slot.key}-alt`}
                            className="text-sm font-black text-[#35243E]"
                          >
                            Photo description
                          </label>

                          <p className="mt-1 text-xs leading-5 text-[#837887]">
                            Describe the photograph
                            clearly for accessibility
                            and search engines.
                          </p>

                          <input
                            id={`${slot.key}-alt`}
                            type="text"
                            value={state.altText}
                            disabled={state.uploading || state.restoring}
                            onChange={(event) =>
                              updateSlotState(
                                slot.key,
                                {
                                  altText:
                                    event.target
                                      .value,
                                  error: "",
                                  message: "",
                                },
                              )
                            }
                            className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
                          />
                        </div>

                        {state.error ? (
                          <div
                            role="alert"
                            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
                          >
                            {state.error}
                          </div>
                        ) : null}

                        {state.message ? (
                          <div
                            role="status"
                            className="mt-4 flex items-start gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
                          >
                            <CheckCircle2
                              aria-hidden="true"
                              size={18}
                              className="mt-0.5 shrink-0"
                            />

                            {state.message}
                          </div>
                        ) : null}

                        <button
                          type="submit"
                          disabled={
                            state.uploading ||
                            state.restoring ||
                            !state.file
                          }
                          className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.20)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-50"
                        >
                          {state.uploading ? (
                            <>
                              <LoaderCircle
                                aria-hidden="true"
                                size={18}
                                className="animate-spin"
                              />
                              Uploading…
                            </>
                          ) : (
                            <>
                              <Upload
                                aria-hidden="true"
                                size={18}
                              />
                              Publish This Photo
                            </>
                          )}
                        </button>

                        {currentMedia?.imageUrl ? (
                          <button
                            type="button"
                            onClick={() => void handleRestore(slot)}
                            disabled={state.uploading || state.restoring}
                            className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-white px-5 text-sm font-black text-[#5B2A86] transition hover:border-[#5B2A86]/35 hover:bg-[#F8F3FA] disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {state.restoring ? (
                              <>
                                <LoaderCircle
                                  aria-hidden="true"
                                  size={17}
                                  className="animate-spin"
                                />
                                Restoring…
                              </>
                            ) : (
                              <>
                                <RotateCcw
                                  aria-hidden="true"
                                  size={17}
                                />
                                Restore Original Photo
                              </>
                            )}
                          </button>
                        ) : null}
                      </div>
                    </form>
                  );
                })}
              </div>
            </section>
          ),
        )}
      </div>
    </div>
  );
}


