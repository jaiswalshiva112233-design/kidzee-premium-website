import { ArrowRight, CalendarCheck2, MapPin, Phone } from "lucide-react";

import HeroSlideshow, {
  type HeroSlide,
} from "@/components/HeroSlideshow";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { getWebsiteContentSettings } from "@/lib/sanity/contentSettings";
import { getWebsiteMedia } from "@/lib/sanity/media";
import { buildSiteContact } from "@/lib/siteContact";

const genericAltText = new Set([
  "main hero photo",
  "homepage hero photo",
  "hero classroom photo",
  "hero teacher photo",
  "hero centre building photo",
  "hero photo",
  "hero image",
]);

function optimiseSanityImageUrl(source: string) {
  try {
    const url = new URL(source);

    if (url.hostname !== "cdn.sanity.io") {
      return source;
    }

    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    url.searchParams.set("w", "1600");
    url.searchParams.set("q", "82");

    return url.toString();
  } catch {
    return source;
  }
}

function resolveAltText(
  managedAltText: string | null | undefined,
  fallback: string,
) {
  const cleaned = managedAltText?.trim() ?? "";

  if (
    !cleaned ||
    genericAltText.has(cleaned.toLowerCase())
  ) {
    return fallback;
  }

  return cleaned;
}

export default async function Hero() {
  const [
    contactSettings,
    contentSettings,
    mainMedia,
    classroomMedia,
    teacherMedia,
    centreMedia,
  ] = await Promise.all([
    getWebsiteContactSettings(),
    getWebsiteContentSettings(),
    getWebsiteMedia("home.hero.main"),
    getWebsiteMedia("home.hero.classroom"),
    getWebsiteMedia("home.hero.teacher"),
    getWebsiteMedia("home.hero.building"),
  ]);

  const site = buildSiteContact(contactSettings);

  const candidates = [
    {
      id: "home.hero.main",
      media: mainMedia,
      fallbackPath: "/images/landing/kidzee-creative-learning.jpg",
      fallbackAlt:
        "Children engaged in creative craft learning at Kidzee Sector 12, Dwarka.",
      required: true,
    },
    {
      id: "home.hero.classroom",
      media: classroomMedia,
      fallbackPath: "/images/landing/kidzee-modern-classroom.jpg",
      fallbackAlt:
        "Modern air-conditioned activity classrooms at Kidzee Sector 12, Dwarka.",
      required: false,
    },
    {
      id: "home.hero.play",
      media: teacherMedia,
      fallbackPath: "/images/landing/kidzee-indoor-turf-arena.jpg",
      fallbackAlt:
        "Indoor turf play area with slides and trampoline at Kidzee Sector 12, Dwarka.",
      required: false,
    },
    {
      id: "home.hero.sensory",
      media: centreMedia,
      fallbackPath: "/images/landing/kidzee-sensory-ball-pool.jpg",
      fallbackAlt:
        "Toddlers enjoying the hygienic soft ball pool sensory zone at Kidzee Sector 12, Dwarka.",
      required: false,
    },
  ];

  const rawSlides = candidates.flatMap<HeroSlide>((candidate) => {
    const source =
      candidate.media?.imageUrl ??
      (candidate.required ? candidate.fallbackPath : null);

    if (!source) {
      return [];
    }

    return [
      {
        id: candidate.id,
        src: optimiseSanityImageUrl(source),
        alt: resolveAltText(
          candidate.media?.altText,
          candidate.fallbackAlt,
        ),
      },
    ];
  });

  const slides = rawSlides.filter(
    (slide, index, allSlides) =>
      allSlides.findIndex(
        (candidate) => candidate.src === slide.src,
      ) === index,
  );

  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#FBF8FD_0%,#FFFFFF_52%,#FFF8DB_100%)] pt-[82px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-44 top-32 h-80 w-80 rounded-full bg-[#F6C84B]/14 blur-3xl" />
        <div className="absolute -right-36 top-10 h-96 w-96 rounded-full bg-[#5B2A86]/10 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white/75 to-transparent" />
      </div>

      <Container className="grid items-center gap-9 pb-14 pt-8 sm:gap-11 sm:pb-16 sm:pt-12 lg:min-h-[690px] lg:grid-cols-[0.94fr_1.06fr] lg:gap-14 lg:py-14">
        <div className="relative z-10 mx-auto w-full max-w-[650px] lg:mx-0">
          <div className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#5B2A86]/12 bg-white/90 px-4 py-2 text-xs font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(40,16,52,0.06)] sm:text-sm">
            <MapPin aria-hidden="true" size={16} strokeWidth={2.4} />
            <span>
              {contentSettings.admissionsOpen
                ? "Admissions"
                : "Admission enquiries"}{" "}
              {contentSettings.academicYear} &middot; Sector 12B, Dwarka
            </span>
          </div>

          <h1
            id="home-hero-heading"
            className="mt-5 max-w-[650px] text-pretty text-[2.5rem] font-black leading-[1.04] tracking-[-0.05em] text-[#281034] sm:mt-6 sm:text-5xl lg:text-[3.5rem] xl:text-[3.75rem]"
          >
            {contentSettings.homeHeroHeading}{" "}
            <span className="text-[#5B2A86]">
              {contentSettings.homeHeroHighlight}
            </span>
          </h1>

          <p className="mt-5 max-w-[610px] text-pretty text-lg font-extrabold leading-8 text-[#5B2A86] sm:text-xl sm:leading-9">
            {contentSettings.homeHeroLead}
          </p>

          <p className="mt-3 max-w-[620px] text-pretty text-base font-semibold leading-7 text-[#665A6C] sm:text-lg sm:leading-8">
            {contentSettings.homeHeroSupport}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              href="/admissions?enquiry=SCHOOL_VISIT#admission-enquiry"
              variant="primary"
              size="lg"
              leftIcon={<CalendarCheck2 size={18} />}
              rightIcon={<ArrowRight size={18} />}
              className="w-full sm:w-auto sm:min-w-[220px]"
              ariaLabel="Book a school visit at Kidzee Sector 12 Dwarka"
            >
              {contentSettings.primaryCtaLabel}
            </Button>

            <Button
              href={`tel:${site.phone}`}
              variant="secondary"
              size="lg"
              leftIcon={<Phone size={18} />}
              className="w-full sm:w-auto sm:min-w-[190px]"
              ariaLabel={`Call admissions at ${site.phoneDisplay}`}
            >
              {contentSettings.secondaryCtaLabel}
            </Button>
          </div>
        </div>

        <figure className="relative mx-auto w-full max-w-[720px]">
          <div
            aria-hidden="true"
            className="absolute -left-8 top-12 h-44 w-44 rounded-full bg-[#F6C84B]/28 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -right-8 bottom-10 h-56 w-56 rounded-full bg-[#5B2A86]/16 blur-3xl"
          />

          <HeroSlideshow
            slides={slides}
            autoRotate={contentSettings.homeHeroAutoRotate}
            rotationIntervalSeconds={
              contentSettings.homeHeroRotationSeconds
            }
          />

          <figcaption className="relative mx-auto mt-4 w-fit rounded-full border border-[#E5DAEA] bg-white/95 px-4 py-2 text-center text-xs font-black text-[#5B2A86] shadow-sm sm:text-sm">
            Photographed at our Sector 12B centre
          </figcaption>
        </figure>
      </Container>
    </section>
  );
}
