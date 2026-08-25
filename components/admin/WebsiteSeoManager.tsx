"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  FileImage,
  Globe2,
  ImagePlus,
  LoaderCircle,
  RotateCcw,
  Save,
  Search,
  Share2,
  Sparkles,
  Tags,
  Trash2,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type SeoPage = {
  pageKey: string;
  label: string;
  path: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string[];
  socialImageUrl: string;
  socialImageAlt: string;
  hasCustomSocialImage: boolean;
};

type SeoResponse = {
  success?: boolean;
  message?: string;
  pages?: SeoPage[];
  updatedAt?: string | null;
  websiteUrl?: string;
  revisions?: SeoRevision[];
};

type SeoRevisionPage = {
  pageKey?: string;
  seoTitle?: string;
  metaDescription?: string;
};

type SeoRevision = {
  id: string;
  pageKey: string;
  status: "APPLIED" | "UNDONE" | string;
  currentData: SeoRevisionPage;
  proposedData: SeoRevisionPage;
  appliedAt: string;
  undoneAt: string | null;
  createdAt: string;
};

type SeoDraft = {
  seoTitle: string;
  metaDescription: string;
  keywords: string;
  socialImageAlt: string;
};

const emptyDraft: SeoDraft = {
  seoTitle: "",
  metaDescription: "",
  keywords: "",
  socialImageAlt: "",
};

const inputClassName =
  "mt-2 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none transition placeholder:font-semibold placeholder:text-[#AAA0AE] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:bg-[#F7F4F8] disabled:text-[#9A909E]";

function draftFromPage(page: SeoPage): SeoDraft {
  return {
    seoTitle: page.seoTitle,
    metaDescription: page.metaDescription,
    keywords: page.keywords.join(", "),
    socialImageAlt: page.socialImageAlt,
  };
}

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Using launch-ready defaults";
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

function getTitleStatus(length: number) {
  if (length < 20) {
    return {
      label: "Too short",
      style: "text-red-600",
    };
  }

  if (length <= 60) {
    return {
      label: "Good length",
      style: "text-green-700",
    };
  }

  return {
    label: "May be shortened in search",
    style: "text-amber-700",
  };
}

function getDescriptionStatus(length: number) {
  if (length < 70) {
    return {
      label: "Too short",
      style: "text-red-600",
    };
  }

  if (length >= 120 && length <= 160) {
    return {
      label: "Good length",
      style: "text-green-700",
    };
  }

  if (length > 160) {
    return {
      label: "May be shortened in search",
      style: "text-amber-700",
    };
  }

  return {
    label: "Valid—add detail if useful",
    style: "text-[#6B5F70]",
  };
}

function getKeywordList(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,\n]/)
        .map((keyword) => keyword.replace(/\s+/g, " ").trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

export default function WebsiteSeoManager() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pages, setPages] = useState<SeoPage[]>([]);
  const [selectedPageKey, setSelectedPageKey] = useState("");
  const [draft, setDraft] = useState<SeoDraft>(emptyDraft);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [revisions, setRevisions] = useState<SeoRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [removingImage, setRemovingImage] = useState(false);
  const [undoingRevisionId, setUndoingRevisionId] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedPage = useMemo(
    () => pages.find((page) => page.pageKey === selectedPageKey) ?? null,
    [pages, selectedPageKey],
  );

  const keywordList = useMemo(
    () => getKeywordList(draft.keywords),
    [draft.keywords],
  );

  const titleStatus = getTitleStatus(draft.seoTitle.trim().length);
  const descriptionStatus = getDescriptionStatus(
    draft.metaDescription.trim().length,
  );

  useEffect(() => {
    let active = true;

    async function loadSeoSettings() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/admin/website-seo", {
          method: "GET",
          cache: "no-store",
        });
        const result = (await response.json()) as SeoResponse;

        if (!response.ok || !result.success || !result.pages?.length) {
          throw new Error(
            result.message ?? "Website SEO details could not be loaded.",
          );
        }

        if (!active) {
          return;
        }

        const firstPage = result.pages[0];
        setPages(result.pages);
        setSelectedPageKey(firstPage.pageKey);
        setDraft(draftFromPage(firstPage));
        setWebsiteUrl(result.websiteUrl ?? "");
        setUpdatedAt(result.updatedAt ?? null);
        setRevisions(result.revisions ?? []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Website SEO details could not be loaded.",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSeoSettings();

    return () => {
      active = false;
    };
  }, []);

  function selectPage(page: SeoPage) {
    setSelectedPageKey(page.pageKey);
    setDraft(draftFromPage(page));
    setError("");
    setSuccessMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function updateDraft(field: keyof SeoDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
    setError("");
    setSuccessMessage("");
  }

  function applyResponse(result: SeoResponse, pageKey: string) {
    if (!result.pages?.length) {
      return;
    }

    setPages(result.pages);
    setUpdatedAt(result.updatedAt ?? null);
    if (result.revisions) {
      setRevisions(result.revisions);
    }

    const refreshedPage = result.pages.find(
      (page) => page.pageKey === pageKey,
    );

    if (refreshedPage) {
      setDraft(draftFromPage(refreshedPage));
    }
  }

  function validateDraft() {
    const title = draft.seoTitle.replace(/\s+/g, " ").trim();
    const description = draft.metaDescription
      .replace(/\s+/g, " ")
      .trim();

    if (title.length < 20) {
      return "The search title must contain at least 20 characters.";
    }

    if (title.length > 70) {
      return "The search title cannot exceed 70 characters.";
    }

    if (description.length < 70) {
      return "The search description must contain at least 70 characters.";
    }

    if (description.length > 180) {
      return "The search description cannot exceed 180 characters.";
    }

    if (keywordList.length === 0) {
      return "Add at least one relevant search topic.";
    }

    if (draft.socialImageAlt.trim().length > 140) {
      return "The sharing-image description cannot exceed 140 characters.";
    }

    return "";
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedPage) {
      return;
    }

    const validationMessage = validateDraft();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSaving(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/website-seo", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pages: [
            {
              pageKey: selectedPage.pageKey,
              seoTitle: draft.seoTitle,
              metaDescription: draft.metaDescription,
              keywords: keywordList,
              socialImageAlt: draft.socialImageAlt,
            },
          ],
        }),
      });
      const result = (await response.json()) as SeoResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "Website SEO details could not be saved.",
        );
      }

      applyResponse(result, selectedPage.pageKey);
      setSuccessMessage(
        result.message ?? `${selectedPage.label} SEO has been saved.`,
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Website SEO details could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function undoRevision(revision: SeoRevision) {
    const pageLabel =
      pages.find((page) => page.pageKey === revision.pageKey)?.label ??
      revision.pageKey;
    const confirmed = window.confirm(
      `Undo the last saved SEO change for ${pageLabel}?`,
    );

    if (!confirmed) {
      return;
    }

    setUndoingRevisionId(revision.id);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/admin/website-seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revisionId: revision.id }),
      });
      const result = (await response.json()) as SeoResponse;

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "The SEO change could not be undone.");
      }

      applyResponse(result, revision.pageKey);
      setSelectedPageKey(revision.pageKey);
      setSuccessMessage(result.message ?? "The SEO change was undone safely.");
    } catch (undoError) {
      setError(
        undoError instanceof Error
          ? undoError.message
          : "The SEO change could not be undone.",
      );
    } finally {
      setUndoingRevisionId("");
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !selectedPage) {
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Upload a JPG, PNG or WebP image.");
      event.target.value = "";
      return;
    }

    if (file.size === 0 || file.size > 8 * 1024 * 1024) {
      setError("The sharing image must be no more than 8 MB.");
      event.target.value = "";
      return;
    }

    setUploading(true);
    setError("");
    setSuccessMessage("");

    try {
      const formData = new FormData();
      formData.set("pageKey", selectedPage.pageKey);
      formData.set("file", file);
      formData.set("altText", draft.socialImageAlt);

      const response = await fetch("/api/admin/website-seo", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as SeoResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The sharing image could not be uploaded.",
        );
      }

      applyResponse(result, selectedPage.pageKey);
      setSuccessMessage(
        result.message ?? "The sharing image has been updated.",
      );
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "The sharing image could not be uploaded.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function removeCustomImage() {
    if (!selectedPage?.hasCustomSocialImage) {
      return;
    }

    const confirmed = window.confirm(
      `Use the original ${selectedPage.label} sharing image again?`,
    );

    if (!confirmed) {
      return;
    }

    setRemovingImage(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/website-seo?pageKey=${encodeURIComponent(
          selectedPage.pageKey,
        )}`,
        {
          method: "DELETE",
        },
      );
      const result = (await response.json()) as SeoResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The custom sharing image could not be removed.",
        );
      }

      applyResponse(result, selectedPage.pageKey);
      setSuccessMessage(
        result.message ?? "The original sharing image is now in use.",
      );
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "The custom sharing image could not be removed.",
      );
    } finally {
      setRemovingImage(false);
    }
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
            Loading page SEO…
          </p>
        </div>
      </div>
    );
  }

  if (!selectedPage) {
    return (
      <div className="rounded-[28px] border border-red-200 bg-red-50 p-6 text-sm font-bold text-red-700">
        {error || "Website SEO pages could not be loaded."}
      </div>
    );
  }

  const publicPageUrl = `${websiteUrl}${selectedPage.path === "/" ? "" : selectedPage.path}`;

  return (
    <div className="space-y-6">
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

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Page selector
            </p>
            <h2 className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl">
              Choose the page shown in search
            </h2>
            <p className="mt-2 text-sm font-semibold text-[#7A6F7E]">
              Last update: {formatUpdatedAt(updatedAt)}
            </p>
          </div>

          <a
            href={publicPageUrl || selectedPage.path}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#D9CEDF] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F1FA]"
          >
            View selected page
            <ArrowUpRight aria-hidden="true" size={16} />
          </a>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
          {pages.map((page) => {
            const selected = page.pageKey === selectedPage.pageKey;

            return (
              <button
                key={page.pageKey}
                type="button"
                onClick={() => selectPage(page)}
                className={[
                  "min-h-14 rounded-2xl border px-3 py-2.5 text-xs font-black transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/15",
                  selected
                    ? "border-[#5B2A86] bg-[#5B2A86] text-white shadow-[0_8px_22px_rgba(91,42,134,0.22)]"
                    : "border-[#E5DCE9] bg-[#FBF9FC] text-[#665A6B] hover:border-[#CBBBD3] hover:text-[#5B2A86]",
                ].join(" ")}
              >
                {page.label}
              </button>
            );
          })}
        </div>
      </section>

      <form onSubmit={handleSave} className="grid gap-6 xl:grid-cols-[1fr_390px]">
        <div className="space-y-6">
          <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6 lg:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <Search aria-hidden="true" size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                  {selectedPage.label} SEO
                </p>
                <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                  Search title and description
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#7D7181]">
                  Write naturally for parents. Include the page&apos;s main topic and
                  Dwarka only where it reads comfortably.
                </p>
              </div>
            </div>

            <label className="mt-6 block text-sm font-black text-[#4B3F50]">
              Search title
              <input
                value={draft.seoTitle}
                onChange={(event) =>
                  updateDraft("seoTitle", event.target.value)
                }
                minLength={20}
                maxLength={70}
                required
                className={`${inputClassName} min-h-12`}
              />
              <span className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold">
                <span className={titleStatus.style}>{titleStatus.label}</span>
                <span className="text-[#867B89]">
                  {draft.seoTitle.length}/70
                </span>
              </span>
            </label>

            <label className="mt-5 block text-sm font-black text-[#4B3F50]">
              Search description
              <textarea
                value={draft.metaDescription}
                onChange={(event) =>
                  updateDraft("metaDescription", event.target.value)
                }
                minLength={70}
                maxLength={180}
                required
                rows={5}
                className={`${inputClassName} resize-y py-3 leading-6`}
              />
              <span className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold">
                <span className={descriptionStatus.style}>
                  {descriptionStatus.label}
                </span>
                <span className="text-[#867B89]">
                  {draft.metaDescription.length}/180
                </span>
              </span>
            </label>

            <label className="mt-5 block text-sm font-black text-[#4B3F50]">
              Search topics
              <textarea
                value={draft.keywords}
                onChange={(event) =>
                  updateDraft("keywords", event.target.value)
                }
                rows={3}
                maxLength={720}
                placeholder="preschool in Dwarka, nursery in Sector 12 Dwarka"
                className={`${inputClassName} resize-y py-3 leading-6`}
              />
              <span className="mt-2 flex items-center justify-between gap-3 text-xs font-semibold text-[#867B89]">
                <span>Separate phrases with commas. Avoid repeating the same topic.</span>
                <span>{keywordList.length}/12</span>
              </span>
            </label>

            {keywordList.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {keywordList.map((keyword) => (
                  <span
                    key={keyword}
                    className="rounded-full border border-[#E1D7E6] bg-[#FAF7FB] px-3 py-1.5 text-xs font-black text-[#625668]"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            ) : null}
          </section>

          <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6 lg:p-7">
            <div className="flex items-start gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF0F3] text-[#A94159]">
                <Share2 aria-hidden="true" size={22} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#A94159]">
                  WhatsApp and social sharing
                </p>
                <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                  Sharing preview image
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#7D7181]">
                  Use a clear landscape photograph without small text. Recommended
                  size: 1200 × 630 pixels.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-[220px_1fr]">
              <div className="overflow-hidden rounded-[22px] border border-[#E2D9E6] bg-[#F4F0F6]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={selectedPage.socialImageUrl}
                  alt={draft.socialImageAlt || selectedPage.label}
                  className="aspect-[1.91/1] h-full w-full object-cover"
                />
              </div>

              <div>
                <label className="block text-sm font-black text-[#4B3F50]">
                  Image description
                  <input
                    value={draft.socialImageAlt}
                    onChange={(event) =>
                      updateDraft("socialImageAlt", event.target.value)
                    }
                    maxLength={140}
                    className={`${inputClassName} min-h-12`}
                  />
                </label>

                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white transition hover:bg-[#4B206F]">
                    {uploading ? (
                      <LoaderCircle
                        aria-hidden="true"
                        className="animate-spin"
                        size={17}
                      />
                    ) : (
                      <ImagePlus aria-hidden="true" size={17} />
                    )}
                    {uploading ? "Uploading…" : "Upload New Image"}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      disabled={uploading || removingImage}
                      onChange={handleImageUpload}
                      className="sr-only"
                    />
                  </label>

                  {selectedPage.hasCustomSocialImage ? (
                    <button
                      type="button"
                      disabled={uploading || removingImage}
                      onClick={() => void removeCustomImage()}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {removingImage ? (
                        <LoaderCircle
                          aria-hidden="true"
                          className="animate-spin"
                          size={17}
                        />
                      ) : (
                        <Trash2 aria-hidden="true" size={17} />
                      )}
                      Use Original
                    </button>
                  ) : null}
                </div>

                <p className="mt-3 text-xs font-semibold leading-5 text-[#887D8B]">
                  {selectedPage.hasCustomSocialImage
                    ? "This page is using a custom panel image."
                    : "This page is using its launch-ready original image."}
                </p>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <section className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF3FF] text-[#2765A4]">
                <Globe2 aria-hidden="true" size={20} />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#2765A4]">
                  Google preview
                </p>
                <h2 className="text-lg font-black text-[#2D1736]">
                  Search result
                </h2>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#E6E9ED] bg-white p-4 font-sans shadow-sm">
              <p className="truncate text-xs text-[#4D5156]">
                {websiteUrl || "https://kidzeedwarka.com"}
                {selectedPage.path === "/" ? "" : selectedPage.path}
              </p>
              <p className="mt-1 line-clamp-2 text-lg font-medium leading-6 text-[#1A0DAB]">
                {draft.seoTitle || selectedPage.label}
              </p>
              <p className="mt-1 line-clamp-3 text-sm font-normal leading-5 text-[#4D5156]">
                {draft.metaDescription || "Your page description will appear here."}
              </p>
            </div>

            <p className="mt-3 text-xs font-semibold leading-5 text-[#887D8B]">
              Search engines may adjust the final wording according to the
              parent&apos;s search. This preview shows the preferred version.
            </p>
          </section>

          <section className="overflow-hidden rounded-[26px] border border-[#E9E2ED] bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
            <div className="p-5 pb-4 sm:p-6 sm:pb-4">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF0F3] text-[#A94159]">
                  <FileImage aria-hidden="true" size={20} />
                </span>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#A94159]">
                    Sharing preview
                  </p>
                  <h2 className="text-lg font-black text-[#2D1736]">
                    WhatsApp and social
                  </h2>
                </div>
              </div>
            </div>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedPage.socialImageUrl}
              alt={draft.socialImageAlt || selectedPage.label}
              className="aspect-[1.91/1] w-full border-y border-[#E9E2ED] object-cover"
            />

            <div className="p-5 sm:p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.1em] text-[#8A7F8D]">
                kidzeedwarka.com
              </p>
              <p className="mt-2 line-clamp-2 text-base font-black leading-6 text-[#2D1736]">
                {draft.seoTitle || selectedPage.label}
              </p>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#756A79]">
                {draft.metaDescription}
              </p>
            </div>
          </section>

          <section className="rounded-[26px] bg-[#2D1736] p-5 text-white shadow-[0_18px_48px_rgba(45,23,54,0.16)] sm:p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
              <Sparkles aria-hidden="true" size={20} />
            </div>
            <h2 className="mt-4 text-lg font-black">Human-first SEO</h2>
            <p className="mt-2 text-xs font-semibold leading-5 text-white/70">
              Clear, specific language helps both parents and search or AI systems
              understand the page. Avoid keyword stuffing or exaggerated claims.
            </p>
            <div className="mt-4 flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-xs font-black text-white">
              <Tags aria-hidden="true" size={15} />
              {keywordList.length} focused search topics
            </div>
          </section>
        </aside>

        <div className="sticky bottom-4 z-20 rounded-[24px] border border-[#DCCFE4] bg-white/95 p-3 shadow-[0_18px_55px_rgba(45,23,54,0.18)] backdrop-blur sm:flex sm:items-center sm:justify-between sm:gap-4 sm:p-4 xl:col-span-2">
          <div className="hidden items-center gap-3 sm:flex">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
              <Search aria-hidden="true" size={19} />
            </span>
            <div>
              <p className="text-sm font-black text-[#2D1736]">
                Saving updates only {selectedPage.label}
              </p>
              <p className="text-xs font-semibold text-[#887D8B]">
                Other page settings remain unchanged.
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving || uploading || removingImage}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white transition hover:bg-[#4B206F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/20 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          >
            {saving ? (
              <LoaderCircle aria-hidden="true" className="animate-spin" size={18} />
            ) : (
              <Save aria-hidden="true" size={18} />
            )}
            {saving ? "Saving…" : `Save ${selectedPage.label} SEO`}
          </button>
        </div>
      </form>

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEF7F4] text-[#26705C]">
            <RotateCcw aria-hidden="true" size={21} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#26705C]">
              Safe revision history
            </p>
            <h2 className="mt-1 text-xl font-black text-[#2D1736]">
              Recent SEO changes
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#7D7181]">
              Every saved title and description keeps its previous version. Undo is
              blocked if a newer edit would be overwritten.
            </p>
          </div>
        </div>

        {revisions.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-[#DCCFE4] bg-[#FBF9FC] px-4 py-5 text-sm font-semibold text-[#746879]">
            No SEO changes have been saved yet.
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {revisions.map((revision) => {
              const pageLabel =
                pages.find((page) => page.pageKey === revision.pageKey)?.label ??
                revision.pageKey;
              const canUndo = revision.status === "APPLIED";

              return (
                <article
                  key={revision.id}
                  className="rounded-2xl border border-[#E8E0EB] bg-[#FCFAFD] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-black text-[#2D1736]">
                        {pageLabel}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${
                          canUndo
                            ? "bg-green-100 text-green-700"
                            : "bg-[#EEE8F1] text-[#716675]"
                        }`}
                      >
                        {canUndo ? "Applied" : "Undone"}
                      </span>
                    </div>
                    <p className="mt-2 truncate text-xs font-semibold text-[#8A7F8D]">
                      Previous: {revision.currentData.seoTitle || "Untitled"}
                    </p>
                    <p className="mt-1 truncate text-sm font-bold text-[#514457]">
                      Saved: {revision.proposedData.seoTitle || "Untitled"}
                    </p>
                    <p className="mt-2 text-[11px] font-semibold text-[#958B98]">
                      {formatUpdatedAt(revision.appliedAt || revision.createdAt)}
                    </p>
                  </div>

                  {canUndo ? (
                    <button
                      type="button"
                      onClick={() => void undoRevision(revision)}
                      disabled={Boolean(undoingRevisionId)}
                      className="mt-4 inline-flex min-h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-[#D7C8DE] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F6F0F8] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0 sm:w-auto"
                    >
                      {undoingRevisionId === revision.id ? (
                        <LoaderCircle
                          aria-hidden="true"
                          className="animate-spin"
                          size={17}
                        />
                      ) : (
                        <RotateCcw aria-hidden="true" size={17} />
                      )}
                      {undoingRevisionId === revision.id ? "Undoing…" : "Undo"}
                    </button>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
