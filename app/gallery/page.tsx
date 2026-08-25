import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Camera,
  CheckCircle2,
  Film,
  FolderOpen,
  Heart,
  Images,
  Play,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import Container from "@/components/ui/Container";
import {
  formatGalleryDate,
  getGalleryCategoryLabel,
  getPublishedGalleryAlbums,
  type PublicGalleryAlbum,
} from "@/lib/sanity/gallery";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preschool Gallery",
  description:
    "Explore real classroom activities, celebrations, creative learning, parent stories and play moments from Kidzee Preschool & Daycare, Sector 12 Dwarka.",
  keywords: [
    "Kidzee Sector 12 Dwarka gallery",
    "preschool activities Dwarka",
    "preschool classroom photos Dwarka",
    "Kidzee Dwarka photos",
    "preschool celebrations Dwarka",
    "parent reviews Kidzee Dwarka",
  ],
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Gallery | Kidzee Sector 12, Dwarka",
    description:
      "See real learning, play, celebration and parent-story moments from our preschool and daycare centre.",
    url: "/gallery",
    type: "website",
    images: [
      {
        url: "/images/gallery/gallery-featured.jpg",
        width: 1200,
        height: 630,
        alt: "Learning and play moments at Kidzee Sector 12 Dwarka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gallery | Kidzee Sector 12, Dwarka",
    description:
      "Explore everyday learning, play, celebration and parent-story moments from Kidzee Sector 12 Dwarka.",
    images: ["/images/gallery/gallery-featured.jpg"],
  },
};

const fallbackMoments = [
  {
    src: "/images/gallery/gallery-1.jpg",
    alt: "Children participating in a classroom activity at Kidzee Sector 12 Dwarka",
    label: "Classroom learning",
    title: "Learning through participation",
  },
  {
    src: "/images/gallery/gallery-2.jpg",
    alt: "Creative art and craft activity at Kidzee Preschool Dwarka",
    label: "Creative expression",
    title: "Ideas taking shape",
  },
  {
    src: "/images/gallery/gallery-3.jpg",
    alt: "Children enjoying guided indoor play at Kidzee Sector 12 Dwarka",
    label: "Play & movement",
    title: "Active, joyful play",
  },
  {
    src: "/images/gallery/gallery-4.jpg",
    alt: "Preschool celebration at Kidzee Sector 12 Dwarka",
    label: "Celebrations",
    title: "Special days together",
  },
  {
    src: "/images/gallery/gallery-5.jpg",
    alt: "Teacher guiding children during an early learning activity",
    label: "Teacher interaction",
    title: "Guided with patience",
  },
  {
    src: "/images/gallery/gallery-6.jpg",
    alt: "Daycare children enjoying a guided activity at Kidzee Dwarka",
    label: "Daycare moments",
    title: "Comfortable afternoons",
  },
] as const;

function AlbumCard({
  album,
  index,
}: {
  album: PublicGalleryAlbum;
  index: number;
}) {
  const formattedDate = formatGalleryDate(album.eventDate);
  const fallbackImage = fallbackMoments[index % fallbackMoments.length];
  const isParentStory = album.category === "PARENT_STORIES";

  return (
    <Link
      href={`/gallery/${album.slug}`}
      className="group w-[84vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[30px] border border-[#E5DAEA] bg-white shadow-[0_18px_54px_rgba(40,16,52,0.08)] transition duration-300 hover:-translate-y-1.5 hover:border-[#D5C4DE] hover:shadow-[0_28px_72px_rgba(40,16,52,0.14)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/15 md:w-auto md:max-w-none"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#EEE7F1]">
        {album.cover?.imageUrl ? (
          <Image
            src={album.cover.imageUrl}
            alt={
              album.cover.altText ||
              album.cover.caption ||
              `${album.title} at Kidzee Sector 12 Dwarka`
            }
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <Image
            src={fallbackImage.src}
            alt={fallbackImage.alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
            className="object-cover opacity-75 transition duration-700 group-hover:scale-[1.04]"
          />
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#281034]/88 via-[#281034]/10 to-transparent"
        />

        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/60 bg-white/92 px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.1em] text-[#5B2A86] shadow-lg backdrop-blur">
            {getGalleryCategoryLabel(album.category)}
          </span>

          {album.featured ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F6C84B] px-3 py-2 text-[0.65rem] font-black uppercase tracking-[0.08em] text-[#2D1736] shadow-lg">
              <Sparkles aria-hidden="true" size={12} /> Featured
            </span>
          ) : null}
        </div>

        {isParentStory || album.videoCount > 0 ? (
          <span className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/50 bg-[#281034]/78 text-white shadow-lg backdrop-blur">
            <Play aria-hidden="true" size={20} fill="currentColor" />
          </span>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <h3 className="text-2xl font-black leading-tight text-white">
            {album.title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-bold text-white/82">
            {formattedDate ? (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays aria-hidden="true" size={14} />
                {formattedDate}
              </span>
            ) : null}

            {album.photoCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Images aria-hidden="true" size={14} />
                {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
              </span>
            ) : null}

            {album.videoCount > 0 ? (
              <span className="inline-flex items-center gap-1.5">
                <Film aria-hidden="true" size={14} />
                {album.videoCount} {album.videoCount === 1 ? "video" : "videos"}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <p className="line-clamp-2 min-h-12 text-sm font-semibold leading-6 text-[#6F6474]">
          {album.description ||
            (isParentStory
              ? "A family shares their experience with our centre, teachers and everyday care."
              : "A collection of real moments from learning, play and centre life.")}
        </p>

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#EEE7F1] pt-4">
          <span className="text-sm font-black text-[#5B2A86]">
            {isParentStory ? "Watch parent stories" : "Open this album"}
          </span>

          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2E8F7] text-[#5B2A86] transition group-hover:bg-[#5B2A86] group-hover:text-white">
            <ArrowRight aria-hidden="true" size={17} />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function GalleryPage() {
  const albums = await getPublishedGalleryAlbums();
  const parentStories = albums.filter(
    (album) => album.category === "PARENT_STORIES",
  );
  const centreAlbums = albums.filter(
    (album) => album.category !== "PARENT_STORIES",
  );
  const totalPhotos = albums.reduce(
    (total, album) => total + album.photoCount,
    0,
  );
  const totalVideos = albums.reduce(
    (total, album) => total + album.videoCount,
    0,
  );
  const galleryStats = [
    { label: "Albums", value: albums.length },
    ...(totalPhotos > 0
      ? [{ label: "Photos", value: totalPhotos }]
      : []),
    ...(totalVideos > 0
      ? [{ label: "Short videos", value: totalVideos }]
      : []),
    ...(parentStories.length > 0
      ? [{ label: "Parent stories", value: parentStories.length }]
      : []),
  ];

  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Life at Kidzee Sector 12 Dwarka",
    description:
      "Published preschool and daycare event albums, learning moments and parent stories from Kidzee Sector 12 Dwarka.",
    url: `${site.url}/gallery`,
    isPartOf: {
      "@type": "WebSite",
      name: site.name,
      url: site.url,
    },
    hasPart: albums.map((album) => ({
      "@type": "ImageGallery",
      name: album.title,
      url: `${site.url}/gallery/${album.slug}`,
      description: album.description || undefined,
      image: album.cover?.imageUrl || undefined,
    })),
  };

  return (
    <PageShell>
      <main className="overflow-hidden bg-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(collectionSchema).replace(/</g, "\\u003c"),
          }}
        />

        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#F8F2FC_0%,#FFFFFF_52%,#FFF7D8_100%)] pb-16 pt-[104px] sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-[#DCC6E8]/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/25 blur-3xl"
          />

          <Container className="relative">
            <div className="mx-auto max-w-4xl text-center">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#E1D3E7] bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.11em] text-[#5B2A86] shadow-sm">
                <Camera aria-hidden="true" size={15} />
                Life at our centre
              </span>

              <h1 className="mt-6 text-balance text-4xl font-black leading-[1.05] tracking-[-0.045em] text-[#281034] sm:text-5xl lg:text-[64px]">
                A closer look at everyday life at our centre.
              </h1>

              <p className="mx-auto mt-6 max-w-3xl text-base font-semibold leading-8 text-[#6F6474] sm:text-lg">
                Browse classroom moments, celebrations, creative work and
                parent stories from our Sector 12B centre.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  "Real centre moments",
                  "Organised event albums",
                  "Videos play when selected",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-[#E6DCEB] bg-white px-4 py-2.5 text-xs font-black text-[#55495A] shadow-sm"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      size={15}
                      className="text-[#5B2A86]"
                    />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {albums.length > 0 ? (
              <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
                {galleryStats.map(({ label, value }) => (
                  <div
                    key={label}
                    className="min-w-[135px] flex-1 rounded-[20px] border border-white/70 bg-white/80 px-3 py-4 text-center shadow-[0_12px_32px_rgba(40,16,52,0.07)] backdrop-blur sm:max-w-[180px]"
                  >
                    <p className="text-2xl font-black text-[#281034]">
                      {value}
                    </p>
                    <p className="mt-1 text-[0.68rem] font-black uppercase tracking-[0.08em] text-[#7D7281]">
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </Container>
        </section>

        {centreAlbums.length > 0 ? (
          <section className="bg-[#FBF9FC] py-16 sm:py-20 lg:py-24">
            <Container>
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div className="max-w-3xl">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                    Event albums
                  </p>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#281034] sm:text-4xl lg:text-5xl">
                    Open the moments that matter to you.
                  </h2>
                  <p className="mt-4 text-base font-semibold leading-8 text-[#6F6474]">
                    Each celebration or activity has its own album, instead of
                    placing every photograph on one endless page.
                  </p>
                </div>

                <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-[#E0D3E6] bg-white px-4 py-3 text-sm font-black text-[#5B2A86] lg:self-auto">
                  <FolderOpen aria-hidden="true" size={18} />
                  {centreAlbums.length} organised {centreAlbums.length === 1 ? "album" : "albums"}
                </div>
              </div>

              <div className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
                {centreAlbums.map((album, index) => (
                  <AlbumCard key={album._id} album={album} index={index} />
                ))}
              </div>
            </Container>
          </section>
        ) : null}

        {parentStories.length > 0 ? (
          <section className="relative overflow-hidden bg-[#281034] py-16 text-white sm:py-20 lg:py-24">
            <div
              aria-hidden="true"
              className="absolute -left-32 top-0 h-80 w-80 rounded-full bg-[#8A4AA8]/35 blur-3xl"
            />
            <div
              aria-hidden="true"
              className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/18 blur-3xl"
            />

            <Container className="relative">
              <div className="max-w-3xl">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#F6C84B]">
                  <Heart aria-hidden="true" size={15} fill="currentColor" />
                  Parent Stories
                </span>

                <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                  Hear from families who know our centre.
                </h2>

                <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-white/70">
                  Watch genuine experiences shared by our families. Every video
                  stays paused until you choose to play it.
                </p>
              </div>

              <div className="-mx-5 mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3">
                {parentStories.map((album, index) => (
                  <AlbumCard
                    key={album._id}
                    album={album}
                    index={index + centreAlbums.length}
                  />
                ))}
              </div>
            </Container>
          </section>
        ) : null}

        {albums.length === 0 ? (
          <section className="bg-[#FBF9FC] py-16 sm:py-20 lg:py-24">
            <Container>
              <div className="mx-auto max-w-3xl text-center">
                <span className="inline-flex items-center gap-2 rounded-full border border-[#E2D4E8] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#5B2A86]">
                  <Images aria-hidden="true" size={15} />
                  A glimpse inside
                </span>

                <h2 className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#281034] sm:text-4xl lg:text-5xl">
                  Everyday learning, play and belonging.
                </h2>

                <p className="mt-4 text-base font-semibold leading-8 text-[#6F6474]">
                  New event albums and parent stories will appear here after
                  they are reviewed and published by the centre.
                </p>
              </div>

              <div className="-mx-5 mt-9 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 lg:grid-cols-3">
                {fallbackMoments.map((item) => (
                  <article
                    key={item.src}
                    className="group relative aspect-[4/3] w-[84vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-[28px] border-[4px] border-white bg-white shadow-[0_18px_52px_rgba(40,16,52,0.09)] md:w-auto md:max-w-none"
                  >
                    <Image
                      src={item.src}
                      alt={item.alt}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.035]"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#281034]/85 via-transparent to-transparent"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-[0.65rem] font-black uppercase tracking-[0.1em] text-[#F6C84B]">
                        {item.label}
                      </p>
                      <h3 className="mt-2 text-xl font-black text-white">
                        {item.title}
                      </h3>
                    </div>
                  </article>
                ))}
              </div>
            </Container>
          </section>
        ) : null}

        <section className="bg-white py-14 sm:py-16">
          <Container>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: FolderOpen,
                  title: "Organised by event",
                  text: "Every celebration and activity stays easy to find.",
                },
                {
                  icon: Play,
                  title: "Quiet by default",
                  text: "Short videos play only after a visitor chooses them.",
                },
                {
                  icon: ShieldCheck,
                  title: "Permission first",
                  text: "Only centre-approved children’s media is published.",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-[22px] border border-[#E5DBE9] bg-[#FCFAFD] p-4"
                  >
                    <Icon
                      aria-hidden="true"
                      size={20}
                      className="mt-0.5 shrink-0 text-[#5B2A86]"
                    />
                    <div>
                      <p className="font-black text-[#281034]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#6F6474]">
                        {item.text}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Container>
        </section>

        <section className="bg-[#FBF9FC] pb-14 sm:pb-18">
          <Container>
            <div className="overflow-hidden rounded-[30px] bg-[#281034] px-6 py-8 text-white shadow-[0_24px_70px_rgba(40,16,52,0.18)] sm:px-9 sm:py-10 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#F6C84B]">
                  Come and see for yourself
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
                  The best way to understand our centre is to visit it.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/72 sm:text-base">
                  See the classrooms, meet the team and understand your
                  child&apos;s possible daily routine in person.
                </p>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row lg:mt-0 lg:shrink-0">
                <Link href="/admissions#admission-enquiry" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#F6C84B] px-6 py-3 text-sm font-black text-[#281034] transition hover:bg-[#FFE07A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30">
                  Book a centre visit
                  <ArrowRight aria-hidden="true" size={17} />
                </Link>
                <Link href="/contact" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/25 bg-white/10 px-6 py-3 text-sm font-black text-white transition hover:bg-white/16 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20">
                  Contact the centre
                </Link>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </PageShell>
  );
}
