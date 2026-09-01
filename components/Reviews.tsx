import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildSiteContact } from "@/lib/siteContact";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  Film,
  Heart,
  Quote,
  Star,
} from "lucide-react";

import ParentReelPlayer from "@/components/Gallery/ParentReelPlayer";
import ExternalMediaEmbed from "@/components/Gallery/ExternalMediaEmbed";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getPublishedGalleryAlbums } from "@/lib/sanity/gallery";


const parentReviews = [
  {
    text: "I am fully satisfied with the school in every manner—learning, communication and safety. All the teachers treat children very nicely, and my daughter is growing here.",
    parent: "Shailja Singh",
    rating: 5,
    theme: "Learning, safety and caring teachers",
  },
  {
    text: "The preschool is trustworthy. The teachers share weekly feedback and regularly update parents about activities.",
    parent: "Komal Gahlot",
    rating: 5,
    theme: "Trust and regular communication",
  },
  {
    text: "Children learn through the play-way method. The environment is clean, the staff are friendly, and I am very happy to send my child to this school.",
    parent: "Ritu Singh",
    rating: 5,
    theme: "Play-based learning",
  },
] as const;

function RatingStars({ rating }: { rating: number }) {
  return (
    <div
      className="flex items-center gap-1"
      aria-label={`${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <Star
          key={index}
          aria-hidden="true"
          size={17}
          className={
            index < rating
              ? "fill-[#F6C84B] text-[#D3A300]"
              : "fill-[#E7E0E9] text-[#D5CBD9]"
          }
        />
      ))}
    </div>
  );
}

function ReviewCard({
  review,
  featured = false,
  compact = false,
}: {
  review: (typeof parentReviews)[number];
  featured?: boolean;
  compact?: boolean;
}) {
  return (
    <article
      className={[
        "relative snap-start overflow-hidden rounded-[28px]",
        featured
          ? "bg-[#281034] text-white shadow-[0_24px_68px_rgba(40,16,52,0.2)]"
          : "border border-[#E6DAEB] bg-white shadow-[0_16px_48px_rgba(40,16,52,0.07)]",
        compact ? "p-5 sm:p-6" : "p-6 sm:p-8",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-4">
        <RatingStars rating={review.rating} />

        <Quote
          aria-hidden="true"
          size={compact ? 30 : 36}
          className={
            featured
              ? "fill-white/10 text-white/20"
              : "fill-[#F3EAF8] text-[#C9B1D7]"
          }
        />
      </div>

      <blockquote className={compact ? "mt-4" : "mt-6"}>
        <p
          className={
            featured
              ? "text-base font-bold leading-7 text-white sm:text-lg sm:leading-8"
              : compact
                ? "text-sm font-semibold leading-6 text-[#514654]"
                : "text-base leading-8 text-[#514654]"
          }
        >
          “{review.text}”
        </p>
      </blockquote>

      <div
        className={[
          compact ? "mt-4 pt-4" : "mt-7 pt-5",
          featured
            ? "border-t border-white/15"
            : "border-t border-[#E8DEEC]",
        ].join(" ")}
      >
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p
              className={
                featured
                  ? "font-black text-white"
                  : "font-black text-[#281034]"
              }
            >
              {review.parent}
            </p>

            <p
              className={
                featured
                  ? "mt-1 text-xs text-white/60"
                  : "mt-1 text-xs text-[#7B6F80]"
              }
            >
              Google reviewer
            </p>
          </div>

          <p
            className={
              featured
                ? "text-[0.65rem] font-black uppercase tracking-[0.09em] text-[#F6C84B]"
                : "text-[0.65rem] font-black uppercase tracking-[0.09em] text-[#5B2A86]"
            }
          >
            {review.theme}
          </p>
        </div>
      </div>
    </article>
  );
}

export default async function Reviews() {
  const site = buildSiteContact(
    await getWebsiteContactSettings(),
  );
  const albums = await getPublishedGalleryAlbums();
  const parentStoryAlbums = albums.filter(
    (album) => album.category === "PARENT_STORIES",
  );

  const featuredStory = parentStoryAlbums
    .flatMap((album) =>
      album.media
        .filter(
          (item) =>
            item.mediaType === "VIDEO" &&
            Boolean(
              item.videoUrl ||
                (item.embedProvider &&
                  item.embedUrl &&
                  item.embedPlayerUrl),
            ),
        )
        .map((video) => ({ album, video })),
    )
    .at(0);

  return (
    <section
      id="reviews"
      aria-labelledby="reviews-heading"
      className="relative overflow-hidden bg-white py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-44 top-10 h-96 w-96 rounded-full bg-[#EADDF1]/75 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-[#F6C84B]/16 blur-3xl"
      />

      <Container className="relative">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E4D8EA] bg-[#F8F4FC] px-4 py-2 text-[13px] font-black text-[#5B2A86]">
              <Star
                aria-hidden="true"
                size={15}
                className="fill-[#F6C84B] text-[#D3A300]"
              />
              Parent experiences
            </div>

            <h2
              id="reviews-heading"
              className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              What families noticed—and chose to share.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Hear directly from a family or read public Google-review
              excerpts about care, communication and the changes parents
              observe after joining.
            </p>
          </div>

          <Button
            href={site.googleReviews}
            external
            variant="secondary"
            size="lg"
            rightIcon={<ExternalLink size={17} />}
            className="w-full sm:w-auto"
            ariaLabel="Read current Google reviews for Kidzee Sector 12 Dwarka"
          >
            Read Current Google Reviews
          </Button>
        </div>

        {featuredStory ? (
          <div className="mt-10 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <article className="grid overflow-hidden rounded-[30px] bg-[#281034] text-white shadow-[0_26px_76px_rgba(40,16,52,0.22)] sm:grid-cols-[minmax(250px,340px)_1fr]">
              <div className="mx-auto w-full max-w-[340px] p-3 sm:mx-0 sm:p-4">
                {featuredStory.video.embedProvider &&
                featuredStory.video.embedUrl &&
                featuredStory.video.embedPlayerUrl ? (
                  <ExternalMediaEmbed
                    provider={featuredStory.video.embedProvider}
                    embedUrl={featuredStory.video.embedPlayerUrl}
                    publicUrl={featuredStory.video.embedUrl}
                    poster={
                      featuredStory.video.thumbnailUrl ??
                      featuredStory.video.imageUrl ??
                      undefined
                    }
                    title={
                      featuredStory.video.altText ||
                      featuredStory.video.caption ||
                      featuredStory.album.title
                    }
                  />
                ) : featuredStory.video.videoUrl ? (
                  <ParentReelPlayer
                    src={featuredStory.video.videoUrl}
                    poster={
                      featuredStory.video.thumbnailUrl ??
                      featuredStory.video.imageUrl ??
                      featuredStory.album.cover?.imageUrl ??
                      undefined
                    }
                    title={
                      featuredStory.video.altText ||
                      featuredStory.video.caption ||
                      featuredStory.album.title
                    }
                    analyticsName="homepage_parent_story_video"
                    className="max-h-[570px]"
                  />
                ) : null}
              </div>

              <div className="flex flex-col justify-center p-5 pt-2 sm:p-7">
                <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.11em] text-[#F6C84B]">
                  <Heart aria-hidden="true" size={15} fill="currentColor" />
                  Parent Story
                </p>

                <h3 className="mt-3 text-2xl font-black leading-tight">
                  {featuredStory.album.title}
                </h3>

                <p className="mt-3 text-sm font-semibold leading-7 text-white/70">
                  {featuredStory.video.caption ||
                    featuredStory.album.description ||
                    "A parent shares their experience with our centre, teachers and everyday care."}
                </p>

                <Link
                  href={`/gallery/${featuredStory.album.slug}`}
                  data-analytics-event="GALLERY_OPEN"
                  data-analytics-name="parent_stories_open"
                  data-analytics-label={featuredStory.album.title}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F6F1F8]"
                >
                  View Parent Stories
                  <ArrowRight aria-hidden="true" size={16} />
                </Link>
              </div>
            </article>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
              {parentReviews.slice(0, 2).map((review) => (
                <ReviewCard
                  key={review.parent}
                  review={review}
                  compact
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-10 grid grid-flow-col auto-cols-[88%] gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 sm:auto-cols-[70%] lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-3 lg:overflow-visible lg:pb-0">
            {parentReviews.map((review, index) => (
              <ReviewCard
                key={review.parent}
                review={review}
                featured={index === 0}
              />
            ))}
          </div>
        )}

        <div className="mx-auto mt-6 flex max-w-3xl items-start justify-center gap-2 text-center text-xs leading-6 text-[#817586]">
          <Film
            aria-hidden="true"
            size={15}
            className="mt-1 shrink-0 text-[#5B2A86]"
          />
          <p>
            Parent videos play only after selection. Google-review excerpts
            are shortened for readability while retaining their meaning; use
            the link above to see current reviews in their original context.
          </p>
        </div>
      </Container>
    </section>
  );
}
