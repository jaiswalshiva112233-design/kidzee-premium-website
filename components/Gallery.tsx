import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Film,
  FolderOpen,
  Images,
  Play,
  ShieldCheck,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import {
  getGalleryCategoryLabel,
  getPublishedGalleryAlbums,
} from "@/lib/sanity/gallery";
import { getWebsiteMedia } from "@/lib/sanity/media";

const cardLayouts = [
  {
    className: "sm:col-span-2 lg:col-span-7 lg:row-span-2",
    sizes: "(max-width: 1024px) 100vw, 58vw",
  },
  {
    className: "lg:col-span-5",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 42vw",
  },
  {
    className: "lg:col-span-5",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 42vw",
  },
  {
    className: "sm:col-span-2 lg:col-span-12",
    sizes: "(max-width: 1024px) 100vw, 100vw",
  },
] as const;

export default async function Gallery() {
  const [
    publishedAlbums,
    featuredMedia,
    classroomMedia,
    playMedia,
    activityMedia,
  ] = await Promise.all([
    getPublishedGalleryAlbums(),
    getWebsiteMedia("home.gallery.featured"),
    getWebsiteMedia("home.gallery.classroom"),
    getWebsiteMedia("home.gallery.play"),
    getWebsiteMedia("home.gallery.activity"),
  ]);

  const centreAlbums = publishedAlbums.filter(
    (album) => album.category !== "PARENT_STORIES",
  );
  const featuredAlbums = centreAlbums.filter((album) => album.featured);
  const homepageAlbums = (
    featuredAlbums.length > 0 ? featuredAlbums : centreAlbums
  ).slice(0, 4);

  const fallbackItems = [
    {
      src:
        featuredMedia?.imageUrl ??
        "/images/gallery/gallery-featured.jpg",
      alt:
        featuredMedia?.altText ||
        "Children participating in a classroom activity at Kidzee Sector 12 Dwarka",
      title: "Everyday learning",
      label: "Classroom moments",
    },
    {
      src:
        classroomMedia?.imageUrl ??
        "/images/gallery/gallery-classroom.jpg",
      alt:
        classroomMedia?.altText ||
        "Colourful classroom at Kidzee Preschool Sector 12 Dwarka",
      title: "Our classrooms",
      label: "Centre spaces",
    },
    {
      src:
        playMedia?.imageUrl ??
        "/images/gallery/gallery-play-area.jpg",
      alt:
        playMedia?.altText ||
        "Indoor play area at Kidzee Preschool Sector 12 Dwarka",
      title: "Movement and play",
      label: "Playtime",
    },
    {
      src:
        activityMedia?.imageUrl ??
        "/images/gallery/gallery-creative-activity.jpg",
      alt:
        activityMedia?.altText ||
        "Creative activity by a child at Kidzee Sector 12 Dwarka",
      title: "Ideas made visible",
      label: "Creative activities",
    },
  ];

  const galleryItems = cardLayouts.map((layout, index) => {
    const album = homepageAlbums[index];
    const fallback = fallbackItems[index];

    if (album) {
      return {
        ...layout,
        key: album._id,
        href: `/gallery/${album.slug}`,
        src: album.cover?.imageUrl ?? fallback.src,
        alt:
          album.cover?.altText ||
          album.cover?.caption ||
          `${album.title} at Kidzee Sector 12 Dwarka`,
        title: album.title,
        label: getGalleryCategoryLabel(album.category),
        photoCount: album.photoCount,
        videoCount: album.videoCount,
        dynamic: true,
      };
    }

    return {
      ...layout,
      key: fallback.src,
      href: "/gallery",
      src: fallback.src,
      alt: fallback.alt,
      title: fallback.title,
      label: fallback.label,
      photoCount: 0,
      videoCount: 0,
      dynamic: false,
    };
  });

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="relative overflow-hidden bg-[#F8F4FC] py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-44 top-20 h-96 w-96 rounded-full bg-[#F6C84B]/14 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 bottom-10 h-96 w-96 rounded-full bg-[#EADDF1]/80 blur-3xl"
      />

      <Container className="relative">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E2D4E8] bg-white px-4 py-2 text-[13px] font-black text-[#5B2A86]">
              <Camera aria-hidden="true" size={16} />
              Life at our centre
            </div>

            <h2
              id="gallery-heading"
              className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              See learning, play and celebrations inside our centre.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Browse a small selection from classroom life, creative work and
              centre events, then open any album for the complete story.
            </p>
          </div>

          <Button
            href="/gallery"
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight size={18} />}
            className="w-full sm:w-auto"
          >
            Browse Event Albums
          </Button>
        </div>

        <div className="mt-10 grid grid-flow-col auto-cols-[84%] auto-rows-[250px] gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-12 lg:auto-rows-[230px]">
          {galleryItems.map((item, index) => (
            <Link
              key={item.key}
              href={item.href}
              aria-label={`Open gallery: ${item.title}`}
              data-analytics-event="GALLERY_OPEN"
              data-analytics-name={
                item.dynamic
                  ? "homepage_featured_album"
                  : "homepage_gallery_open"
              }
              data-analytics-label={item.title}
              className={`group relative snap-start overflow-hidden rounded-[28px] border-[4px] border-white bg-white shadow-[0_18px_54px_rgba(40,16,52,0.1)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_26px_68px_rgba(40,16,52,0.15)] ${item.className}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes={item.sizes}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.035]"
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#281034]/86 via-transparent to-transparent"
              />

              <div className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/92 px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#5B2A86] shadow-lg backdrop-blur">
                {item.label}
              </div>

              {item.videoCount > 0 ? (
                <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-[#281034]/75 text-white backdrop-blur">
                  <Play aria-hidden="true" size={18} fill="currentColor" />
                </span>
              ) : index === 0 ? (
                <span className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-[#281034]/75 text-white backdrop-blur">
                  <Camera aria-hidden="true" size={19} />
                </span>
              ) : null}

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 sm:p-6">
                <div>
                  <h3 className="text-xl font-black leading-tight text-white sm:text-2xl">
                    {item.title}
                  </h3>

                  {item.dynamic &&
                  (item.photoCount > 0 || item.videoCount > 0) ? (
                    <p className="mt-2 inline-flex items-center gap-3 text-xs font-bold text-white/78">
                      {item.photoCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Images aria-hidden="true" size={13} />
                          {item.photoCount} {item.photoCount === 1 ? "photo" : "photos"}
                        </span>
                      ) : null}

                      {item.videoCount > 0 ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Film aria-hidden="true" size={13} />
                          {item.videoCount} videos
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>

                <ArrowRight
                  aria-hidden="true"
                  size={20}
                  className="shrink-0 text-white transition-transform duration-300 group-hover:translate-x-1"
                />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 hidden gap-4 md:grid md:grid-cols-3">
          <div className="flex items-start gap-3 rounded-[22px] border border-[#E3D6E9] bg-white p-4">
            <FolderOpen
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-[#5B2A86]"
            />

            <div>
              <p className="font-black text-[#281034]">Event albums</p>
              <p className="mt-1 text-sm leading-6 text-[#6F6474]">
                Celebrations stay grouped by event and date.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[22px] border border-[#E3D6E9] bg-white p-4">
            <Play
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-[#5B2A86]"
            />

            <div>
              <p className="font-black text-[#281034]">Quiet by default</p>
              <p className="mt-1 text-sm leading-6 text-[#6F6474]">
                Short videos play only when a visitor chooses them.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-[22px] border border-[#E3D6E9] bg-white p-4">
            <ShieldCheck
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-[#5B2A86]"
            />

            <div>
              <p className="font-black text-[#281034]">Approved media only</p>
              <p className="mt-1 text-sm leading-6 text-[#6F6474]">
                Children&apos;s media is published only with permission.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
