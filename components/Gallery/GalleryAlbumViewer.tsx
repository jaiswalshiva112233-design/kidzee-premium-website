"use client";

import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Expand,
  Film,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import ParentReelPlayer from "@/components/Gallery/ParentReelPlayer";
import type { PublicGalleryMedia } from "@/lib/sanity/gallery";

type GalleryAlbumViewerProps = {
  albumTitle: string;
  media: PublicGalleryMedia[];
  parentStories?: boolean;
};

function recordGalleryOpen(albumTitle: string, caption: string) {
  window.dispatchEvent(
    new CustomEvent("kidzee:website-event", {
      detail: {
        eventType: "GALLERY_OPEN",
        eventName: "gallery_photo_opened",
        targetText: caption || albumTitle,
      },
    }),
  );
}

export default function GalleryAlbumViewer({
  albumTitle,
  media,
  parentStories = false,
}: GalleryAlbumViewerProps) {
  const photos = useMemo(
    () =>
      media.filter(
        (item) =>
          item.mediaType === "PHOTO" && Boolean(item.imageUrl),
      ),
    [media],
  );
  const displayableMediaCount = useMemo(
    () =>
      media.filter(
        (item) =>
          (item.mediaType === "PHOTO" && Boolean(item.imageUrl)) ||
          (item.mediaType === "VIDEO" && Boolean(item.videoUrl)),
      ).length,
    [media],
  );
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(
    null,
  );

  const selectedIndex = selectedPhotoId
    ? photos.findIndex((item) => item._id === selectedPhotoId)
    : -1;
  const selectedPhoto =
    selectedIndex >= 0 ? photos[selectedIndex] : null;

  function openPhoto(item: PublicGalleryMedia) {
    setSelectedPhotoId(item._id);
    recordGalleryOpen(albumTitle, item.caption || item.altText);
  }

  function closeViewer() {
    setSelectedPhotoId(null);
  }

  function showPhoto(index: number) {
    if (photos.length === 0) {
      return;
    }

    const safeIndex = (index + photos.length) % photos.length;
    const nextPhoto = photos[safeIndex];
    setSelectedPhotoId(nextPhoto._id);
    recordGalleryOpen(
      albumTitle,
      nextPhoto.caption || nextPhoto.altText,
    );
  }

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelectedPhotoId(null);
      }

      if (event.key === "ArrowLeft") {
        const previousPhoto =
          photos[(selectedIndex - 1 + photos.length) % photos.length];
        setSelectedPhotoId(previousPhoto._id);
        recordGalleryOpen(
          albumTitle,
          previousPhoto.caption || previousPhoto.altText,
        );
      }

      if (event.key === "ArrowRight") {
        const nextPhoto = photos[(selectedIndex + 1) % photos.length];
        setSelectedPhotoId(nextPhoto._id);
        recordGalleryOpen(
          albumTitle,
          nextPhoto.caption || nextPhoto.altText,
        );
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [albumTitle, photos, selectedIndex, selectedPhoto]);

  if (media.length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={
          parentStories
            ? displayableMediaCount === 1
              ? "mx-auto grid max-w-[360px]"
              : "grid grid-flow-col auto-cols-[82%] gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:auto-cols-[340px]"
            : "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        }
      >
        {media.map((item, index) => {
          const isFeaturedPhoto =
            item.mediaType === "PHOTO" &&
            index === 0 &&
            media.length > 2;

          return item.mediaType === "PHOTO" && item.imageUrl ? (
            <button
              key={item._id}
              type="button"
              onClick={() => openPhoto(item)}
              aria-label={`Open photograph: ${
                item.caption || item.altText || albumTitle
              }`}
              className={[
                "group overflow-hidden rounded-[28px] border-[4px] border-white bg-white text-left shadow-[0_18px_54px_rgba(40,16,52,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_68px_rgba(40,16,52,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/20",
                isFeaturedPhoto ? "sm:col-span-2" : "",
              ].join(" ")}
            >
              <div
                className={[
                  "relative overflow-hidden bg-[#EEE8F1]",
                  isFeaturedPhoto
                    ? "aspect-[16/8] min-h-[280px]"
                    : "aspect-[4/3]",
                ].join(" ")}
              >
                <Image
                  src={item.imageUrl}
                  alt={
                    item.altText ||
                    item.caption ||
                    `${albumTitle} at Kidzee Sector 12 Dwarka`
                  }
                  fill
                  sizes={
                    isFeaturedPhoto
                      ? "(max-width: 1280px) 100vw, 66vw"
                      : "(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                  }
                  className="object-cover transition duration-700 group-hover:scale-[1.035]"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#281034]/78 via-transparent to-transparent"
                />

                <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/50 bg-[#281034]/70 text-white backdrop-blur">
                  <Expand aria-hidden="true" size={18} />
                </span>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#F6C84B]">
                    <Camera aria-hidden="true" size={13} />
                    Photograph {index + 1}
                  </p>

                  {item.caption ? (
                    <p className="mt-2 line-clamp-2 max-w-2xl text-base font-black leading-6 text-white sm:text-lg">
                      {item.caption}
                    </p>
                  ) : null}
                </div>
              </div>
            </button>
          ) : item.mediaType === "VIDEO" && item.videoUrl && parentStories ? (
            <article
              key={item._id}
              className="snap-start"
            >
              <ParentReelPlayer
                src={item.videoUrl}
                poster={item.imageUrl ?? undefined}
                title={item.altText || item.caption || albumTitle}
                analyticsName="gallery_parent_story_reel"
              />
              {item.caption ? (
                <p className="mt-3 text-center text-sm font-bold leading-6 text-[#504456]">
                  {item.caption}
                </p>
              ) : null}
            </article>
          ) : item.mediaType === "VIDEO" && item.videoUrl ? (
            <article
              key={item._id}
              className="overflow-hidden rounded-[28px] border-[4px] border-white bg-white shadow-[0_18px_54px_rgba(40,16,52,0.1)]"
            >
              <div className="relative aspect-video overflow-hidden bg-[#1F1026]">
                <video
                  src={item.videoUrl}
                  controls
                  playsInline
                  preload="metadata"
                  aria-label={item.altText || item.caption || albumTitle}
                  data-analytics-name="gallery_album_video"
                  className="h-full w-full object-contain"
                >
                  Your browser does not support this video.
                </video>
              </div>

              <div className="p-5">
                <p className="inline-flex items-center gap-2 text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#7A459C]">
                  <Film aria-hidden="true" size={14} />
                  Click to play
                </p>

                {item.caption ? (
                  <p className="mt-2 text-sm font-bold leading-6 text-[#504456]">
                    {item.caption}
                  </p>
                ) : (
                  <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                    A short video from {albumTitle}.
                  </p>
                )}
              </div>
            </article>
          ) : null;
        })}
      </div>

      {selectedPhoto?.imageUrl ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photograph viewer for ${albumTitle}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#16091D]/95 p-3 backdrop-blur-md sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeViewer();
            }
          }}
        >
          <button
            type="button"
            onClick={closeViewer}
            autoFocus
            aria-label="Close photograph viewer"
            className="absolute right-4 top-4 z-20 flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white transition hover:bg-white hover:text-[#281034] sm:right-6 sm:top-6"
          >
            <X aria-hidden="true" size={22} />
          </button>

          {photos.length > 1 ? (
            <>
              <button
                type="button"
                onClick={() => showPhoto(selectedIndex - 1)}
                aria-label="Show previous photograph"
                className="absolute left-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white transition hover:bg-white hover:text-[#281034] sm:left-6"
              >
                <ArrowLeft aria-hidden="true" size={21} />
              </button>

              <button
                type="button"
                onClick={() => showPhoto(selectedIndex + 1)}
                aria-label="Show next photograph"
                className="absolute right-2 top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white transition hover:bg-white hover:text-[#281034] sm:right-6"
              >
                <ArrowRight aria-hidden="true" size={21} />
              </button>
            </>
          ) : null}

          <div className="flex h-full w-full max-w-6xl flex-col items-center justify-center">
            <div className="relative min-h-0 w-full flex-1">
              <Image
                src={selectedPhoto.imageUrl}
                alt={
                  selectedPhoto.altText ||
                  selectedPhoto.caption ||
                  `${albumTitle} at Kidzee Sector 12 Dwarka`
                }
                fill
                sizes="100vw"
                priority
                className="object-contain"
              />
            </div>

            <div className="mt-3 w-full max-w-3xl text-center text-white">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-[#F6C84B]">
                {selectedIndex + 1} of {photos.length}
              </p>

              {selectedPhoto.caption ? (
                <p className="mt-2 text-sm font-semibold leading-6 text-white/82 sm:text-base">
                  {selectedPhoto.caption}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
