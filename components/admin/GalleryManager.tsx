"use client";

import Image from "next/image";
import {
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  CircleAlert,
  Eye,
  EyeOff,
  Film,
  FolderPlus,
  ImagePlus,
  Images,
  LoaderCircle,
  Save,
  ShieldCheck,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const CATEGORIES = [
  ["CELEBRATION", "Celebration"],
  ["FESTIVAL", "Festival & Special Day"],
  ["CLASSROOM", "Classroom Moments"],
  ["CREATIVE_LEARNING", "Creative Learning"],
  ["SPORTS_AND_MOVEMENT", "Sports & Movement"],
  ["TRIP_AND_EVENT", "Trip & Event"],
  ["CENTRE_FACILITIES", "Centre Facilities"],
  ["PARENT_STORIES", "Parent Stories"],
  ["OTHER", "Other"],
] as const;

const PROGRAMMES = [
  ["PLAYGROUP", "Playgroup"],
  ["NURSERY", "Nursery"],
  ["JUNIOR_KG", "Junior KG"],
  ["SENIOR_KG", "Senior KG"],
  ["DAYCARE", "Daycare"],
] as const;

type MediaType = "PHOTO" | "VIDEO";

type GalleryMedia = {
  _id: string;
  albumId: string;
  mediaType: MediaType;
  caption: string;
  altText: string;
  published: boolean;
  sortOrder: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  imageUrl: string | null;
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

type GalleryAlbum = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  programmes: string[];
  eventDate: string | null;
  published: boolean;
  featured: boolean;
  coverMediaId: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  media: GalleryMedia[];
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  albums?: GalleryAlbum[];
  albumId?: string;
  mediaId?: string;
  limits?: {
    imageMegabytes: number;
    videoMegabytes: number;
  };
};

const fieldClass =
  "min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A49BA7] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

const labelClass = "text-sm font-black text-[#35243E]";

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getCategoryLabel(value: string) {
  return (
    CATEGORIES.find(([category]) => category === value)?.[1] ??
    "Other"
  );
}

function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) {
    return items;
  }

  const next = [...items];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

function StatusBadge({ published }: { published: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em]",
        published
          ? "border-green-200 bg-green-50 text-green-700"
          : "border-[#DDD4E1] bg-[#F8F5FA] text-[#756A79]",
      ].join(" ")}
    >
      {published ? (
        <Eye aria-hidden="true" size={12} />
      ) : (
        <EyeOff aria-hidden="true" size={12} />
      )}
      {published ? "Live" : "Draft"}
    </span>
  );
}

export default function GalleryManager() {
  const [albums, setAlbums] = useState<GalleryAlbum[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [limits, setLimits] = useState({
    imageMegabytes: 12,
    videoMegabytes: 80,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const [thumbnailTargetMediaId, setThumbnailTargetMediaId] = useState("");

  const selectedAlbum = useMemo(
    () => albums.find((album) => album._id === selectedAlbumId) ?? null,
    [albums, selectedAlbumId],
  );

  const totals = useMemo(() => {
    const allMedia = albums.flatMap((album) => album.media);

    return {
      albums: albums.length,
      liveAlbums: albums.filter((album) => album.published).length,
      photos: allMedia.filter((item) => item.mediaType === "PHOTO").length,
      videos: allMedia.filter((item) => item.mediaType === "VIDEO").length,
    };
  }, [albums]);

  function showResult(message: string, isError = false) {
    if (isError) {
      setError(message);
      setNotice("");
      return;
    }

    setNotice(message);
    setError("");
  }

  async function readResponse(response: Response) {
    const result = (await response.json()) as ApiResponse;

    if (!response.ok || !result.success) {
      throw new Error(result.message ?? "The gallery could not be updated.");
    }

    return result;
  }

  async function loadGallery(preferredAlbumId = "") {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "GET",
        cache: "no-store",
      });
      const result = await readResponse(response);
      const nextAlbums = result.albums ?? [];

      setAlbums(nextAlbums);
      setLimits(
        result.limits ?? {
          imageMegabytes: 12,
          videoMegabytes: 80,
        },
      );
      setSelectedAlbumId((current) => {
        const requested = preferredAlbumId || current;

        if (nextAlbums.some((album) => album._id === requested)) {
          return requested;
        }

        return nextAlbums[0]?._id ?? "";
      });
      setError("");
    } catch (loadError) {
      showResult(
        loadError instanceof Error
          ? loadError.message
          : "The gallery could not be loaded.",
        true,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadGallery();
    }, 0);

    return () => window.clearTimeout(timeoutId);
    // Loading is intentionally limited to the initial manager mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function updateAlbum(updates: Partial<GalleryAlbum>) {
    if (!selectedAlbumId) {
      return;
    }

    setAlbums((current) =>
      current.map((album) =>
        album._id === selectedAlbumId
          ? { ...album, ...updates }
          : album,
      ),
    );
    setError("");
    setNotice("");
  }

  function updateMedia(mediaId: string, updates: Partial<GalleryMedia>) {
    if (!selectedAlbumId) {
      return;
    }

    setAlbums((current) =>
      current.map((album) =>
        album._id === selectedAlbumId
          ? {
              ...album,
              media: album.media.map((item) =>
                item._id === mediaId ? { ...item, ...updates } : item,
              ),
            }
          : album,
      ),
    );
    setError("");
    setNotice("");
  }

  function chooseAlbumCover(mediaId: string) {
    updateAlbum({ coverMediaId: mediaId });
    showResult("Cover selected. Save Album to keep this choice.");
  }

  async function createAlbum(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setBusyKey("create");
    setError("");
    setNotice("");

    try {
      const formData = new FormData(form);

      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createAlbum",
          title: formData.get("title"),
          description: formData.get("description"),
          category: formData.get("category"),
          programmes: formData.getAll("programmes"),
          eventDate: formData.get("eventDate"),
        }),
      });
      const result = await readResponse(response);

      form.reset();
      setShowCreate(false);
      await loadGallery(result.albumId);
      showResult(result.message ?? "The album has been created.");
    } catch (createError) {
      showResult(
        createError instanceof Error
          ? createError.message
          : "The album could not be created.",
        true,
      );
    } finally {
      setBusyKey("");
    }
  }

  async function saveAlbum() {
    if (!selectedAlbum) {
      return;
    }

    setBusyKey("album");
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateAlbum",
          albumId: selectedAlbum._id,
          title: selectedAlbum.title,
          description: selectedAlbum.description,
          category: selectedAlbum.category,
          programmes: selectedAlbum.programmes,
          eventDate: selectedAlbum.eventDate,
          published: selectedAlbum.published,
          featured: selectedAlbum.featured,
          coverMediaId: selectedAlbum.coverMediaId,
        }),
      });
      const result = await readResponse(response);

      await loadGallery(selectedAlbum._id);
      showResult(result.message ?? "The album has been saved.");
    } catch (saveError) {
      showResult(
        saveError instanceof Error
          ? saveError.message
          : "The album could not be saved.",
        true,
      );
    } finally {
      setBusyKey("");
    }
  }

  async function saveMedia(item: GalleryMedia) {
    setBusyKey(`media-${item._id}`);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateMedia",
          mediaId: item._id,
          caption: item.caption,
          altText: item.altText,
          published: item.published,
        }),
      });
      const result = await readResponse(response);

      await loadGallery(item.albumId);
      showResult(result.message ?? "The gallery item has been saved.");
    } catch (saveError) {
      showResult(
        saveError instanceof Error
          ? saveError.message
          : "The gallery item could not be saved.",
        true,
      );
    } finally {
      setBusyKey("");
    }
  }

  async function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const files = Array.from(event.target.files ?? []);
    const allowedImageTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ]);
    const allowedVideoTypes = new Set(["video/mp4", "video/webm"]);

    if (files.length > 20) {
      event.target.value = "";
      setSelectedFiles([]);
      showResult("Select no more than 20 files in one upload.", true);
      return;
    }

    const invalidFile = files.find((file) => {
      if (allowedImageTypes.has(file.type)) {
        return file.size > limits.imageMegabytes * 1024 * 1024;
      }

      if (allowedVideoTypes.has(file.type)) {
        return file.size > limits.videoMegabytes * 1024 * 1024;
      }

      return true;
    });

    if (invalidFile) {
      input.value = "";
      setSelectedFiles([]);
      showResult(
        `${invalidFile.name} is not an accepted file or is larger than the permitted size.`,
        true,
      );
      return;
    }

    setSelectedFiles(files);
    setUploadProgress("");
    setError("");
    setNotice("");
  }

  function chooseVideoThumbnail(mediaId: string) {
    if (busyKey) {
      return;
    }

    setThumbnailTargetMediaId(mediaId);

    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = "";
      thumbnailInputRef.current.click();
    }
  }

  async function selectVideoThumbnail(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];
    const mediaId = thumbnailTargetMediaId;
    const allowedImageTypes = new Set([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ]);

    input.value = "";
    setThumbnailTargetMediaId("");

    if (!file || !mediaId || !selectedAlbum) {
      return;
    }

    if (
      !allowedImageTypes.has(file.type) ||
      file.size > limits.imageMegabytes * 1024 * 1024
    ) {
      showResult(
        `Choose a JPG, PNG, WebP or AVIF image up to ${limits.imageMegabytes} MB for the video thumbnail.`,
        true,
      );
      return;
    }

    setBusyKey(`thumbnail-${mediaId}`);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: {
          "Content-Type": file.type,
          "X-Gallery-Action": "uploadVideoThumbnail",
          "X-Gallery-Album-Id": selectedAlbum._id,
          "X-Gallery-Media-Id": mediaId,
          "X-Gallery-Filename": encodeURIComponent(file.name),
        },
        body: file,
      });
      const result = await readResponse(response);

      await loadGallery(selectedAlbum._id);
      showResult(
        result.message ??
          "The video thumbnail has been saved. You can now set this review video as the album cover.",
      );
    } catch (thumbnailError) {
      showResult(
        thumbnailError instanceof Error
          ? thumbnailError.message
          : "The video thumbnail could not be saved.",
        true,
      );
    } finally {
      setBusyKey("");
    }
  }

  async function uploadFiles() {
    if (!selectedAlbum || selectedFiles.length === 0) {
      showResult("Choose at least one photograph or video.", true);
      return;
    }

    if (!consentConfirmed) {
      showResult(
        "Please confirm that the centre has permission to use this media.",
        true,
      );
      return;
    }

    setBusyKey("upload");
    setError("");
    setNotice("");
    let uploadedCount = 0;

    try {
      for (const [index, file] of selectedFiles.entries()) {
        setUploadProgress(
          `Uploading ${index + 1} of ${selectedFiles.length}: ${file.name}`,
        );

        const response = await fetch("/api/admin/gallery", {
          method: "POST",
          headers: {
            "Content-Type": file.type || "application/octet-stream",
            "X-Gallery-Action": "uploadMedia",
            "X-Gallery-Album-Id": selectedAlbum._id,
            "X-Gallery-Consent": "true",
            "X-Gallery-Filename": encodeURIComponent(file.name),
          },
          body: file,
        });

        await readResponse(response);
        uploadedCount += 1;
      }

      setSelectedFiles([]);
      setConsentConfirmed(false);
      setUploadProgress("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await loadGallery(selectedAlbum._id);
      showResult(
        `${uploadedCount} ${uploadedCount === 1 ? "item has" : "items have"} been uploaded as drafts. Review and publish them below.`,
      );
    } catch (uploadError) {
      await loadGallery(selectedAlbum._id);
      showResult(
        `${uploadedCount > 0 ? `${uploadedCount} item${uploadedCount === 1 ? "" : "s"} uploaded. ` : ""}${
          uploadError instanceof Error
            ? uploadError.message
            : "The remaining files could not be uploaded."
        }`,
        true,
      );
    } finally {
      setBusyKey("");
      setUploadProgress("");
    }
  }

  async function reorderAlbums(from: number, to: number) {
    const reordered = moveItem(albums, from, to);

    if (reordered === albums) {
      return;
    }

    setAlbums(reordered);
    setBusyKey("reorder-albums");

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorderAlbums",
          orderedIds: reordered.map((album) => album._id),
        }),
      });
      await readResponse(response);
      showResult("The album order has been updated.");
    } catch (reorderError) {
      await loadGallery(selectedAlbumId);
      showResult(
        reorderError instanceof Error
          ? reorderError.message
          : "The album order could not be changed.",
        true,
      );
    } finally {
      setBusyKey("");
    }
  }

  async function reorderMedia(from: number, to: number) {
    if (!selectedAlbum) {
      return;
    }

    const reordered = moveItem(selectedAlbum.media, from, to);

    if (reordered === selectedAlbum.media) {
      return;
    }

    updateAlbum({ media: reordered });
    setBusyKey("reorder-media");

    try {
      const response = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reorderMedia",
          albumId: selectedAlbum._id,
          orderedIds: reordered.map((item) => item._id),
        }),
      });
      await readResponse(response);
      showResult("The media order has been updated.");
    } catch (reorderError) {
      await loadGallery(selectedAlbum._id);
      showResult(
        reorderError instanceof Error
          ? reorderError.message
          : "The media order could not be changed.",
        true,
      );
    } finally {
      setBusyKey("");
    }
  }

  async function removeItem(target: "album" | "media", id: string) {
    const confirmed = window.confirm(
      target === "album"
        ? "Remove this album and all of its gallery items? This cannot be undone."
        : "Remove this gallery item? This cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setBusyKey(`delete-${id}`);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/admin/gallery?target=${target}&id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const result = await readResponse(response);
      const preferredAlbumId = target === "media" ? selectedAlbumId : "";

      await loadGallery(preferredAlbumId);
      showResult(result.message ?? "The gallery item has been removed.");
    } catch (removeError) {
      showResult(
        removeError instanceof Error
          ? removeError.message
          : "The gallery item could not be removed.",
        true,
      );
    } finally {
      setBusyKey("");
    }
  }

  return (
    <div className="space-y-7">
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Albums", value: totals.albums, icon: Images },
          { label: "Live albums", value: totals.liveAlbums, icon: Eye },
          { label: "Photos", value: totals.photos, icon: ImagePlus },
          { label: "Videos", value: totals.videos, icon: Film },
        ].map(({ label, value, icon: Icon }) => (
          <article
            key={String(label)}
            className="rounded-[22px] border border-[#E9E2ED] bg-white p-4 shadow-[0_12px_32px_rgba(45,23,54,0.045)] sm:p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <Icon aria-hidden="true" size={19} />
              </span>
              <div>
                <p className="text-2xl font-black text-[#2D1736]">{value}</p>
                <p className="text-xs font-bold text-[#817684]">{label}</p>
              </div>
            </div>
          </article>
        ))}
      </section>

      {error ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
        >
          <CircleAlert aria-hidden="true" size={19} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
        >
          <CheckCircle2 aria-hidden="true" size={19} className="mt-0.5 shrink-0" />
          {notice}
        </div>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="self-start rounded-[28px] border border-[#E9E2ED] bg-white p-4 shadow-[0_16px_45px_rgba(45,23,54,0.055)] sm:p-5 xl:sticky xl:top-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                Albums
              </p>
              <h2 className="mt-1 text-xl font-black text-[#2D1736]">
                Gallery folders
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setShowCreate((current) => !current)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#5B2A86] text-white transition hover:bg-[#4B206F]"
              aria-label={showCreate ? "Close new album form" : "Create an album"}
            >
              {showCreate ? <X aria-hidden="true" size={19} /> : <FolderPlus aria-hidden="true" size={19} />}
            </button>
          </div>

          {showCreate ? (
            <form
              onSubmit={createAlbum}
              className="mt-5 space-y-4 rounded-[22px] border border-[#E4D5EA] bg-[#FAF7FC] p-4"
            >
              <div>
                <label htmlFor="new-album-title" className={labelClass}>
                  Album title
                </label>
                <input
                  id="new-album-title"
                  name="title"
                  required
                  minLength={2}
                  maxLength={100}
                  placeholder="Example: Independence Day 2026"
                  className={`${fieldClass} mt-2`}
                />
              </div>

              <div>
                <label htmlFor="new-album-category" className={labelClass}>
                  Album type
                </label>
                <select
                  id="new-album-category"
                  name="category"
                  defaultValue="CELEBRATION"
                  className={`${fieldClass} mt-2`}
                >
                  {CATEGORIES.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="new-album-date" className={labelClass}>
                  Event date <span className="font-semibold text-[#8A808D]">(optional)</span>
                </label>
                <input
                  id="new-album-date"
                  name="eventDate"
                  type="date"
                  className={`${fieldClass} mt-2`}
                />
              </div>

              <button
                type="submit"
                disabled={busyKey === "create"}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white transition hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:opacity-55"
              >
                {busyKey === "create" ? (
                  <LoaderCircle aria-hidden="true" size={18} className="animate-spin" />
                ) : (
                  <FolderPlus aria-hidden="true" size={18} />
                )}
                Create Draft Album
              </button>
            </form>
          ) : null}

          <div className="mt-5 space-y-3">
            {loading ? (
              <div className="flex min-h-32 items-center justify-center text-[#6A328F]">
                <LoaderCircle aria-hidden="true" size={25} className="animate-spin" />
              </div>
            ) : albums.length === 0 ? (
              <div className="rounded-[22px] bg-[#FAF7FC] px-4 py-8 text-center">
                <Images aria-hidden="true" size={28} className="mx-auto text-[#A68AAF]" />
                <p className="mt-3 text-sm font-black text-[#514557]">No albums yet</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#897E8C]">
                  Create your first event or Parent Stories album.
                </p>
              </div>
            ) : (
              albums.map((album, index) => (
                <div
                  key={album._id}
                  className={[
                    "rounded-[22px] border p-3 transition",
                    album._id === selectedAlbumId
                      ? "border-[#6A328F] bg-[#F5EEF8]"
                      : "border-[#ECE5EF] bg-white hover:border-[#D9C9E1]",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedAlbumId(album._id);
                      setSelectedFiles([]);
                      setConsentConfirmed(false);
                    }}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#2D1736]">
                          {album.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#837787]">
                          {getCategoryLabel(album.category)} · {album.media.length} items
                        </p>
                      </div>
                      <StatusBadge published={album.published} />
                    </div>
                  </button>

                  <div className="mt-3 flex items-center gap-2 border-t border-[#E7DDEB] pt-3">
                    <button
                      type="button"
                      disabled={index === 0 || Boolean(busyKey)}
                      onClick={() => void reorderAlbums(index, index - 1)}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-white text-[#5B2A86] transition hover:bg-[#EEE3F3] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={`Move ${album.title} up`}
                    >
                      <ArrowUp aria-hidden="true" size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={index === albums.length - 1 || Boolean(busyKey)}
                      onClick={() => void reorderAlbums(index, index + 1)}
                      className="inline-flex h-9 flex-1 items-center justify-center rounded-xl bg-white text-[#5B2A86] transition hover:bg-[#EEE3F3] disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label={`Move ${album.title} down`}
                    >
                      <ArrowDown aria-hidden="true" size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          {!loading && !selectedAlbum ? (
            <section className="rounded-[28px] border border-dashed border-[#D8C8DF] bg-white px-6 py-16 text-center">
              <FolderPlus aria-hidden="true" size={34} className="mx-auto text-[#8C6C9A]" />
              <h2 className="mt-4 text-2xl font-black text-[#2D1736]">
                Create an album to begin
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-[#7C7180]">
                Use one album for each event, festival, activity, facility collection or group of parent review videos.
              </p>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white"
              >
                <FolderPlus aria-hidden="true" size={18} />
                Create First Album
              </button>
            </section>
          ) : null}

          {selectedAlbum ? (
            <>
              <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.055)] sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                      Album details
                    </p>
                    <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                      Edit and publish this album
                    </h2>
                  </div>
                  <StatusBadge published={selectedAlbum.published} />
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <div>
                    <label htmlFor="album-title" className={labelClass}>Album title</label>
                    <input
                      id="album-title"
                      value={selectedAlbum.title}
                      maxLength={100}
                      onChange={(event) => updateAlbum({ title: event.target.value })}
                      className={`${fieldClass} mt-2`}
                    />
                  </div>

                  <div>
                    <label htmlFor="album-category" className={labelClass}>Album type</label>
                    <select
                      id="album-category"
                      value={selectedAlbum.category}
                      onChange={(event) => updateAlbum({ category: event.target.value })}
                      className={`${fieldClass} mt-2`}
                    >
                      {CATEGORIES.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label htmlFor="album-description" className={labelClass}>Short description</label>
                    <textarea
                      id="album-description"
                      value={selectedAlbum.description}
                      maxLength={700}
                      rows={3}
                      placeholder="Write a short, natural description for parents and search engines."
                      onChange={(event) => updateAlbum({ description: event.target.value })}
                      className={`${fieldClass} mt-2 py-3`}
                    />
                  </div>

                  <div>
                    <label htmlFor="album-date" className={labelClass}>Event date</label>
                    <input
                      id="album-date"
                      type="date"
                      value={selectedAlbum.eventDate ?? ""}
                      onChange={(event) => updateAlbum({ eventDate: event.target.value || null })}
                      className={`${fieldClass} mt-2`}
                    />
                  </div>

                  <div>
                    <p className={labelClass}>Display options</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => updateAlbum({ published: !selectedAlbum.published })}
                        className={[
                          "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black transition",
                          selectedAlbum.published
                            ? "border-green-200 bg-green-50 text-green-700"
                            : "border-[#DDD3E2] bg-[#FAF7FC] text-[#726677]",
                        ].join(" ")}
                      >
                        {selectedAlbum.published ? <Eye aria-hidden="true" size={16} /> : <EyeOff aria-hidden="true" size={16} />}
                        {selectedAlbum.published ? "Published" : "Draft"}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateAlbum({ featured: !selectedAlbum.featured })}
                        className={[
                          "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-3 text-xs font-black transition",
                          selectedAlbum.featured
                            ? "border-[#F1D678] bg-[#FFF7D8] text-[#755400]"
                            : "border-[#DDD3E2] bg-[#FAF7FC] text-[#726677]",
                        ].join(" ")}
                      >
                        <Star aria-hidden="true" size={16} fill={selectedAlbum.featured ? "currentColor" : "none"} />
                        Homepage
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <p className={labelClass}>Programmes shown in this album</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {PROGRAMMES.map(([value, label]) => {
                        const selected = selectedAlbum.programmes.includes(value);
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() =>
                              updateAlbum({
                                programmes: selected
                                  ? selectedAlbum.programmes.filter((item) => item !== value)
                                  : [...selectedAlbum.programmes, value],
                              })
                            }
                            className={[
                              "inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 text-xs font-black transition",
                              selected
                                ? "border-[#6A328F] bg-[#F2E8F7] text-[#5B2A86]"
                                : "border-[#E2D9E6] bg-white text-[#746979]",
                            ].join(" ")}
                          >
                            {selected ? <Check aria-hidden="true" size={14} /> : null}
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-xs font-semibold text-[#8A808D]">
                      Leave all unselected when the album applies to the whole centre.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 border-t border-[#EEE7F1] pt-5 sm:flex-row sm:justify-between">
                  <button
                    type="button"
                    disabled={Boolean(busyKey)}
                    onClick={() => void removeItem("album", selectedAlbum._id)}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <Trash2 aria-hidden="true" size={17} />
                    Remove Album
                  </button>
                  <button
                    type="button"
                    disabled={Boolean(busyKey)}
                    onClick={() => void saveAlbum()}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(91,42,134,0.18)] transition hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busyKey === "album" ? <LoaderCircle aria-hidden="true" size={18} className="animate-spin" /> : <Save aria-hidden="true" size={18} />}
                    Save Album
                  </button>
                </div>
              </section>

              <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.055)] sm:p-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                    <Upload aria-hidden="true" size={21} />
                  </span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">Add media</p>
                    <h2 className="mt-1 text-xl font-black text-[#2D1736]">Upload photos or videos</h2>
                    <p className="mt-1 text-sm font-semibold leading-6 text-[#7C7180]">
                      Choose up to 20 files together. Photos can be up to {limits.imageMegabytes} MB and videos up to {limits.videoMegabytes} MB each.
                    </p>
                    {selectedAlbum.category === "PARENT_STORIES" ? (
                      <p className="mt-2 rounded-xl bg-[#FFF6D9] px-3 py-2 text-xs font-black leading-5 text-[#755600]">
                        Parent Stories can use any video duration and either portrait or landscape orientation.
                      </p>
                    ) : null}
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
                  disabled={busyKey === "upload"}
                  onChange={selectFiles}
                  className="mt-5 block w-full cursor-pointer rounded-2xl border border-[#DCCFE4] bg-white text-sm font-semibold text-[#5F5663] file:mr-4 file:cursor-pointer file:border-0 file:bg-[#F3EAF8] file:px-4 file:py-3 file:text-sm file:font-black file:text-[#5B2A86] hover:file:bg-[#EADDF1] disabled:cursor-not-allowed disabled:opacity-60"
                />

                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={(event) => void selectVideoThumbnail(event)}
                  className="sr-only"
                  tabIndex={-1}
                />

                {selectedFiles.length > 0 ? (
                  <div className="mt-4 rounded-2xl bg-[#FAF7FC] px-4 py-3">
                    <p className="text-sm font-black text-[#433748]">
                      {selectedFiles.length} {selectedFiles.length === 1 ? "file" : "files"} selected
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-[#837887]">
                      {selectedFiles.map((file) => file.name).join(", ")}
                    </p>
                  </div>
                ) : null}

                <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E1D6E6] bg-[#FBF9FC] p-4">
                  <input
                    type="checkbox"
                    checked={consentConfirmed}
                    onChange={(event) => setConsentConfirmed(event.target.checked)}
                    className="mt-1 h-5 w-5 rounded border-[#CDBBD5] accent-[#5B2A86]"
                  />
                  <span>
                    <span className="flex items-center gap-2 text-sm font-black text-[#3E3144]">
                      <ShieldCheck aria-hidden="true" size={17} className="text-[#5B2A86]" />
                      Media permission confirmed
                    </span>
                    <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
                      I confirm that the centre has the required parent or guardian permission to publish the children visible in these files.
                    </span>
                  </span>
                </label>

                {uploadProgress ? (
                  <p className="mt-4 rounded-2xl bg-[#F3EAF8] px-4 py-3 text-sm font-bold text-[#5B2A86]">
                    {uploadProgress}
                  </p>
                ) : null}

                <button
                  type="button"
                  disabled={busyKey === "upload" || selectedFiles.length === 0 || !consentConfirmed}
                  onClick={() => void uploadFiles()}
                  className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {busyKey === "upload" ? <LoaderCircle aria-hidden="true" size={18} className="animate-spin" /> : <Upload aria-hidden="true" size={18} />}
                  {busyKey === "upload" ? "Uploading…" : `Upload ${selectedFiles.length || "Selected"} ${selectedFiles.length === 1 ? "Item" : "Items"}`}
                </button>
              </section>

              <section>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">Album media</p>
                    <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                      Review before publishing
                    </h2>
                  </div>
                  <p className="text-sm font-bold text-[#7D7281]">{selectedAlbum.media.length} items</p>
                </div>

                {selectedAlbum.media.length === 0 ? (
                  <div className="mt-5 rounded-[28px] border border-dashed border-[#D8C8DF] bg-white px-6 py-14 text-center">
                    <ImagePlus aria-hidden="true" size={32} className="mx-auto text-[#987BA5]" />
                    <p className="mt-3 text-lg font-black text-[#2D1736]">This album is empty</p>
                    <p className="mt-1 text-sm font-semibold text-[#817684]">Upload approved photos or a video above.</p>
                  </div>
                ) : (
                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    {selectedAlbum.media.map((item, index) => {
                      const isCover = selectedAlbum.coverMediaId === item._id;
                      const isBusy =
                        busyKey === `media-${item._id}` ||
                        busyKey === `delete-${item._id}` ||
                        busyKey === `thumbnail-${item._id}`;

                      return (
                        <article key={item._id} className="overflow-hidden rounded-[26px] border border-[#E9E2ED] bg-white shadow-[0_14px_38px_rgba(45,23,54,0.055)]">
                          <div className="relative aspect-[4/3] overflow-hidden bg-[#EEE8F1]">
                            {item.mediaType === "PHOTO" && item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt={item.altText || item.caption || "Gallery photograph"}
                                fill
                                unoptimized
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover"
                              />
                            ) : item.videoUrl ? (
                              <video
                                src={item.videoUrl}
                                poster={item.imageUrl ?? undefined}
                                controls
                                preload="metadata"
                                playsInline
                                className="h-full w-full object-cover"
                              >
                                Your browser does not support this video.
                              </video>
                            ) : (
                              <div className="flex h-full items-center justify-center text-[#8B7D91]">
                                {item.mediaType === "PHOTO" ? <Images aria-hidden="true" size={30} /> : <Film aria-hidden="true" size={30} />}
                              </div>
                            )}

                            <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                              <span className="rounded-full bg-[#2D1736]/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-white backdrop-blur-sm">
                                {item.mediaType === "PHOTO" ? "Photo" : "Video"}
                              </span>
                              {isCover ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#F6C84B] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#2D1736]">
                                  <Star aria-hidden="true" size={11} fill="currentColor" /> Cover
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <div className="p-4 sm:p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-xs font-bold text-[#837887]">{item.fileName}</p>
                                <p className="mt-1 text-xs font-semibold text-[#A096A3]">{formatFileSize(item.fileSize)}</p>
                              </div>
                              <StatusBadge published={item.published} />
                            </div>

                            <div className="mt-4">
                              <label htmlFor={`caption-${item._id}`} className={labelClass}>Caption</label>
                              <textarea
                                id={`caption-${item._id}`}
                                value={item.caption}
                                rows={2}
                                maxLength={300}
                                placeholder={item.mediaType === "VIDEO" ? "What does this parent share?" : "What is happening in this moment?"}
                                onChange={(event) => updateMedia(item._id, { caption: event.target.value })}
                                className={`${fieldClass} mt-2 py-3`}
                              />
                            </div>

                            <div className="mt-4">
                              <label htmlFor={`alt-${item._id}`} className={labelClass}>Accessible description</label>
                              <input
                                id={`alt-${item._id}`}
                                value={item.altText}
                                maxLength={180}
                                placeholder="Describe what can be seen"
                                onChange={(event) => updateMedia(item._id, { altText: event.target.value })}
                                className={`${fieldClass} mt-2`}
                              />
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => updateMedia(item._id, { published: !item.published })}
                                className={[
                                  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition",
                                  item.published
                                    ? "border-green-200 bg-green-50 text-green-700"
                                    : "border-[#DED4E3] bg-[#FAF7FC] text-[#716576]",
                                ].join(" ")}
                              >
                                {item.published ? <Eye aria-hidden="true" size={15} /> : <EyeOff aria-hidden="true" size={15} />}
                                {item.published ? "Published" : "Hidden"}
                              </button>

                              {item.mediaType === "PHOTO" ? (
                                <button
                                  type="button"
                                  onClick={() => chooseAlbumCover(item._id)}
                                  className={[
                                    "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition",
                                    isCover
                                      ? "border-[#F1D678] bg-[#FFF7D8] text-[#755400]"
                                      : "border-[#DED4E3] bg-white text-[#716576]",
                                  ].join(" ")}
                                >
                                  <Star aria-hidden="true" size={15} fill={isCover ? "currentColor" : "none"} />
                                  {isCover ? "Album Cover" : "Set Cover"}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={Boolean(busyKey)}
                                  onClick={() => chooseVideoThumbnail(item._id)}
                                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DED4E3] bg-white px-3 text-xs font-black text-[#5B2A86] transition hover:bg-[#F4EDF7] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isBusy && busyKey.startsWith("thumbnail-") ? <LoaderCircle aria-hidden="true" size={15} className="animate-spin" /> : <ImagePlus aria-hidden="true" size={15} />}
                                  {item.imageUrl ? "Replace Thumbnail" : "Add Thumbnail"}
                                </button>
                              )}
                            </div>

                            {item.mediaType === "VIDEO" ? (
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                {item.imageUrl ? (
                                  <button
                                    type="button"
                                    onClick={() => chooseAlbumCover(item._id)}
                                    className={[
                                      "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition",
                                      isCover
                                        ? "border-[#F1D678] bg-[#FFF7D8] text-[#755400]"
                                        : "border-[#DED4E3] bg-white text-[#716576]",
                                    ].join(" ")}
                                  >
                                    <Star aria-hidden="true" size={15} fill={isCover ? "currentColor" : "none"} />
                                    {isCover ? "Album Cover" : "Set Cover"}
                                  </button>
                                ) : (
                                  <div className="flex min-h-11 items-center justify-center rounded-xl bg-[#F7F4F8] px-3 text-center text-[10px] font-bold text-[#8B808F]">
                                    Add a thumbnail to use this video as the album cover.
                                  </div>
                                )}
                                <div className="flex min-h-11 items-center justify-center rounded-xl bg-[#F7F4F8] px-3 text-center text-[10px] font-bold text-[#8B808F]">
                                  Videos never autoplay
                                </div>
                              </div>
                            ) : null}

                            <div className="mt-4 flex items-center gap-2 border-t border-[#EEE7F1] pt-4">
                              <button
                                type="button"
                                disabled={index === 0 || Boolean(busyKey)}
                                onClick={() => void reorderMedia(index, index - 1)}
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4EDF7] text-[#5B2A86] disabled:opacity-35"
                                aria-label="Move earlier"
                              >
                                <ArrowUp aria-hidden="true" size={17} />
                              </button>
                              <button
                                type="button"
                                disabled={index === selectedAlbum.media.length - 1 || Boolean(busyKey)}
                                onClick={() => void reorderMedia(index, index + 1)}
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4EDF7] text-[#5B2A86] disabled:opacity-35"
                                aria-label="Move later"
                              >
                                <ArrowDown aria-hidden="true" size={17} />
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(busyKey)}
                                onClick={() => void saveMedia(item)}
                                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#5B2A86] px-3 text-xs font-black text-white disabled:opacity-50"
                              >
                                {isBusy && busyKey.startsWith("media-") ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin" /> : <Save aria-hidden="true" size={16} />}
                                Save Item
                              </button>
                              <button
                                type="button"
                                disabled={Boolean(busyKey)}
                                onClick={() => void removeItem("media", item._id)}
                                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-700 disabled:opacity-50"
                                aria-label="Remove item"
                              >
                                {isBusy && busyKey.startsWith("delete-") ? <LoaderCircle aria-hidden="true" size={16} className="animate-spin" /> : <Trash2 aria-hidden="true" size={16} />}
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </section>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
