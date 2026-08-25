import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CalendarCheck2,
  Camera,
  CheckCircle2,
  Film,
  FolderOpen,
  Heart,
  Images,
  Play,
  ShieldCheck,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import GalleryAlbumViewer from "@/components/Gallery/GalleryAlbumViewer";
import Container from "@/components/ui/Container";
import {
  formatGalleryDate,
  getGalleryCategoryLabel,
  getGalleryProgrammeLabel,
  getPublishedGalleryAlbumBySlug,
  getPublishedGalleryAlbums,
} from "@/lib/sanity/gallery";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type GalleryAlbumPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function cleanDescription(value: string) {
  const description = value.replace(/\s+/g, " ").trim();

  if (!description) {
    return "See approved photographs and short videos from learning, play and centre life at Kidzee Preschool & Daycare, Sector 12 Dwarka.";
  }

  return description.slice(0, 155);
}

export async function generateMetadata({
  params,
}: GalleryAlbumPageProps): Promise<Metadata> {
  const { slug } = await params;
  const album = await getPublishedGalleryAlbumBySlug(slug);

  if (!album) {
    return {
      title: "Gallery Album Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description = cleanDescription(album.description);
  const socialImage =
    album.cover?.imageUrl ?? "/images/gallery/gallery-featured.jpg";

  return {
    title: album.title,
    description,
    alternates: {
      canonical: `/gallery/${album.slug}`,
    },
    openGraph: {
      title: album.title,
      description,
      url: `/gallery/${album.slug}`,
      type: "website",
      images: [
        {
          url: socialImage,
          alt: `${album.title} at Kidzee Sector 12 Dwarka`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: album.title,
      description,
      images: [socialImage],
    },
  };
}

export default async function GalleryAlbumPage({
  params,
}: GalleryAlbumPageProps) {
  const { slug } = await params;
  const [album, allAlbums] = await Promise.all([
    getPublishedGalleryAlbumBySlug(slug),
    getPublishedGalleryAlbums(),
  ]);

  if (!album) {
    notFound();
  }

  const formattedDate = formatGalleryDate(album.eventDate);
  const isParentStory = album.category === "PARENT_STORIES";
  const currentIndex = allAlbums.findIndex(
    (item) => item._id === album._id,
  );
  const previousAlbum =
    currentIndex > 0 ? allAlbums[currentIndex - 1] : null;
  const nextAlbum =
    currentIndex >= 0 && currentIndex < allAlbums.length - 1
      ? allAlbums[currentIndex + 1]
      : null;

  const photoUrls = album.media
    .filter(
      (item) => item.mediaType === "PHOTO" && Boolean(item.imageUrl),
    )
    .map((item) => item.imageUrl)
    .filter((value): value is string => Boolean(value));

  const albumSchema = {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    name: album.title,
    description: cleanDescription(album.description),
    url: `${site.url}/gallery/${album.slug}`,
    image: photoUrls,
    associatedMedia: album.media
      .filter(
        (item) => item.mediaType === "VIDEO" && Boolean(item.videoUrl),
      )
      .map((item) => ({
        "@type": "VideoObject",
        name: item.caption || album.title,
        description:
          item.altText || item.caption || `A short video from ${album.title}`,
        contentUrl: item.videoUrl,
        uploadDate: item.createdAt,
      })),
    isPartOf: {
      "@type": "CollectionPage",
      name: "Life at Kidzee Sector 12 Dwarka",
      url: `${site.url}/gallery`,
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: site.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Gallery",
        item: `${site.url}/gallery`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: album.title,
        item: `${site.url}/gallery/${album.slug}`,
      },
    ],
  };

  return (
    <PageShell>
      <main className="overflow-hidden bg-white">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(albumSchema).replace(/</g, "\\u003c"),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(breadcrumbSchema).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />

        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#F7F0FA_0%,#FFFFFF_58%,#FFF6D4_100%)] pb-14 pt-[104px] sm:pb-18 sm:pt-28 lg:pb-20 lg:pt-32">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-28 top-20 h-80 w-80 rounded-full bg-[#DCC6E8]/40 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/25 blur-3xl"
          />

          <Container className="relative">
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-xs font-bold text-[#776B7B]"
            >
              <Link href="/" className="transition hover:text-[#5B2A86]">
                Home
              </Link>
              <ArrowRight aria-hidden="true" size={13} />
              <Link
                href="/gallery"
                className="transition hover:text-[#5B2A86]"
              >
                Gallery
              </Link>
              <ArrowRight aria-hidden="true" size={13} />
              <span className="text-[#3E3144]">{album.title}</span>
            </nav>

            <div
              className={
                isParentStory
                  ? "mt-7 max-w-4xl"
                  : "mt-7 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12"
              }
            >
              <div>
                <Link
                  href="/gallery"
                  className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#DED1E4] bg-white px-4 text-sm font-black text-[#5B2A86] shadow-sm transition hover:border-[#BFA7CB]"
                >
                  <ArrowLeft aria-hidden="true" size={17} />
                  All Albums
                </Link>

                <div className="mt-6 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#5B2A86] px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.1em] text-white">
                    {isParentStory ? (
                      <Heart aria-hidden="true" size={14} fill="currentColor" />
                    ) : (
                      <FolderOpen aria-hidden="true" size={14} />
                    )}
                    {getGalleryCategoryLabel(album.category)}
                  </span>

                  {album.featured ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#F6C84B] px-4 py-2 text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#2D1736]">
                      <CheckCircle2 aria-hidden="true" size={14} />
                      Featured
                    </span>
                  ) : null}
                </div>

                <h1 className="mt-6 text-balance text-4xl font-black leading-[1.04] tracking-[-0.045em] text-[#281034] sm:text-5xl lg:text-[60px]">
                  {album.title}
                </h1>

                <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#6F6474] sm:text-lg">
                  {album.description ||
                    (isParentStory
                      ? "A family shares their experience with our centre, teachers and everyday care."
                      : "Approved moments from learning, play and centre life at Kidzee Sector 12 Dwarka.")}
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {formattedDate ? (
                    <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#E2D7E6] bg-white px-4 text-sm font-black text-[#544859] shadow-sm">
                      <CalendarDays
                        aria-hidden="true"
                        size={17}
                        className="text-[#5B2A86]"
                      />
                      {formattedDate}
                    </span>
                  ) : null}

                  {album.photoCount > 0 ? (
                    <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#E2D7E6] bg-white px-4 text-sm font-black text-[#544859] shadow-sm">
                      <Images
                        aria-hidden="true"
                        size={17}
                        className="text-[#5B2A86]"
                      />
                      {album.photoCount} {album.photoCount === 1 ? "photo" : "photos"}
                    </span>
                  ) : null}

                  {album.videoCount > 0 ? (
                    <span className="inline-flex min-h-11 items-center gap-2 rounded-2xl border border-[#E2D7E6] bg-white px-4 text-sm font-black text-[#544859] shadow-sm">
                      <Film
                        aria-hidden="true"
                        size={17}
                        className="text-[#5B2A86]"
                      />
                      {album.videoCount} {album.videoCount === 1 ? "video" : "videos"}
                    </span>
                  ) : null}
                </div>

                {album.programmes.length > 0 ? (
                  <div className="mt-6">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#817485]">
                      Programmes
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {album.programmes.map((programme) => (
                        <span
                          key={programme}
                          className="rounded-full border border-[#E3D7E8] bg-white/80 px-3 py-2 text-xs font-black text-[#5B2A86]"
                        >
                          {getGalleryProgrammeLabel(programme)}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className={isParentStory ? "hidden" : "relative"}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[34px] border-[6px] border-white bg-[#EEE8F1] shadow-[0_28px_80px_rgba(40,16,52,0.17)]">
                  {album.cover?.imageUrl ? (
                    <Image
                      src={album.cover.imageUrl}
                      alt={
                        album.cover.altText ||
                        album.cover.caption ||
                        `${album.title} at Kidzee Sector 12 Dwarka`
                      }
                      fill
                      priority
                      sizes="(max-width: 1024px) 100vw, 55vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center bg-[linear-gradient(135deg,#4C205E_0%,#281034_100%)] px-8 text-center text-white">
                      {isParentStory ? (
                        <Play
                          aria-hidden="true"
                          size={44}
                          fill="currentColor"
                          className="text-[#F6C84B]"
                        />
                      ) : (
                        <Camera
                          aria-hidden="true"
                          size={44}
                          className="text-[#F6C84B]"
                        />
                      )}
                      <p className="mt-4 text-2xl font-black">{album.title}</p>
                      <p className="mt-2 text-sm font-semibold text-white/70">
                        {isParentStory
                          ? "Choose a video below to hear this parent story."
                          : "Explore the approved moments below."}
                      </p>
                    </div>
                  )}

                  {album.cover?.imageUrl ? (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#281034]/72 via-transparent to-transparent"
                    />
                  ) : null}

                  {album.cover?.imageUrl ? (
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                      <p className="text-[0.68rem] font-black uppercase tracking-[0.12em] text-[#F6C84B]">
                        {isParentStory ? "Parent Stories" : "Album cover"}
                      </p>
                      <p className="mt-2 text-xl font-black text-white sm:text-2xl">
                        {album.cover.caption || album.title}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-[#FBF9FC] py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div className="max-w-3xl">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                  {isParentStory ? "Watch and listen" : "Inside this album"}
                </p>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-[#281034] sm:text-4xl lg:text-5xl">
                  {isParentStory
                    ? "A real family experience, shared in their own words."
                    : "Real moments, carefully selected."}
                </h2>
                <p className="mt-4 text-base font-semibold leading-8 text-[#6F6474]">
                  {isParentStory
                    ? "Videos remain quiet until you choose to play them."
                    : "Select any photograph to view it larger. Videos play only after you press play."}
                </p>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-2xl border border-[#E0D3E6] bg-white px-4 py-3 text-sm font-black text-[#5B2A86] lg:self-auto">
                <ShieldCheck aria-hidden="true" size={18} />
                {isParentStory
                  ? "Shared with permission"
                  : "Reviewed before publishing"}
              </div>
            </div>

            <div className="mt-10">
              <GalleryAlbumViewer
                albumTitle={album.title}
                media={album.media}
                parentStories={isParentStory}
              />
            </div>
          </Container>
        </section>

        {previousAlbum || nextAlbum ? (
          <section className="border-t border-[#EEE7F1] bg-white py-12 sm:py-14">
            <Container>
              <div className="grid gap-4 sm:grid-cols-2">
                {previousAlbum ? (
                  <Link
                    href={`/gallery/${previousAlbum.slug}`}
                    className="group rounded-[24px] border border-[#E4D9E8] bg-[#FCFAFD] p-5 transition hover:border-[#CDB9D6] hover:bg-[#F7F1FA]"
                  >
                    <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                      <ArrowLeft aria-hidden="true" size={14} />
                      Previous album
                    </p>
                    <p className="mt-2 text-lg font-black text-[#281034]">
                      {previousAlbum.title}
                    </p>
                  </Link>
                ) : (
                  <div />
                )}

                {nextAlbum ? (
                  <Link
                    href={`/gallery/${nextAlbum.slug}`}
                    className="group rounded-[24px] border border-[#E4D9E8] bg-[#FCFAFD] p-5 text-left transition hover:border-[#CDB9D6] hover:bg-[#F7F1FA] sm:text-right"
                  >
                    <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                      Next album
                      <ArrowRight aria-hidden="true" size={14} />
                    </p>
                    <p className="mt-2 text-lg font-black text-[#281034]">
                      {nextAlbum.title}
                    </p>
                  </Link>
                ) : null}
              </div>

              <div className="mt-6 text-center">
                <Link
                  href="/gallery"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#4B206F]"
                >
                  <FolderOpen aria-hidden="true" size={17} />
                  Browse All Albums
                </Link>
              </div>
            </Container>
          </section>
        ) : null}

        <section className="bg-white pb-16 sm:pb-20">
          <Container>
            <div className="flex flex-col gap-6 rounded-[30px] bg-[#281034] px-6 py-8 text-white shadow-[0_24px_70px_rgba(40,16,52,0.18)] sm:px-9 sm:py-10 lg:flex-row lg:items-center lg:justify-between lg:px-12">
              <div className="max-w-2xl">
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#F6C84B]">
                  Visit our centre
                </p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.035em] sm:text-3xl">
                  See the classrooms and meet the team in person.
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/72 sm:text-base">
                  Send one short enquiry and choose a convenient school-visit
                  date.
                </p>
              </div>

              <Link
                href="/admissions?enquiry=SCHOOL_VISIT#admission-enquiry"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#F6C84B] px-6 py-3 text-sm font-black text-[#281034] transition hover:bg-[#FFE07A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:w-auto lg:shrink-0"
              >
                <CalendarCheck2 aria-hidden="true" size={17} />
                Book a School Visit
              </Link>
            </div>
          </Container>
        </section>
      </main>
    </PageShell>
  );
}
