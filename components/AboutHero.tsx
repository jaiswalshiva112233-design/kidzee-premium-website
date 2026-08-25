"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  ChevronRight,
  Phone,
  Sparkles,
} from "lucide-react";

import { useSiteContact } from "@/components/SiteContactProvider";

const highlights = [
  "Play-based learning for every age group",
  "Caring teachers and familiar routines",
  "Preschool and daycare in one centre",
];

type AboutHeroProps = {
  imageUrl?: string;
  imageAlt?: string;
  heading?: string;
  headingHighlight?: string;
  introduction?: string;
  primaryCtaLabel?: string;
  secondaryCtaLabel?: string;
};

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

export default function AboutHero({
  imageUrl = "/images/hero/about-main.jpg",
  imageAlt = "Children participating in preschool learning activities at Kidzee Sector 12 Dwarka",
  heading = "A preschool where children feel known and",
  headingHighlight = "ready to grow.",
  introduction = "At our Sector 12B, Dwarka centre, purposeful play, patient teachers and familiar routines help children build confidence, communication and independence at their own pace.",
  primaryCtaLabel = "Book a School Visit",
  secondaryCtaLabel = "Call Admissions",
}: AboutHeroProps) {
  const site = useSiteContact();
  const heroImage = optimiseSanityImageUrl(imageUrl);

  return (
    <section
      aria-labelledby="about-hero-heading"
      className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#FFF9F1_0%,#FFFFFF_52%,#F7F0FB_100%)] pb-14 pt-[104px] sm:pb-16 sm:pt-28 lg:pb-20 lg:pt-32"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-36 top-24 h-80 w-80 rounded-full bg-[#F6C84B]/16 blur-3xl" />
        <div className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-[#5B2A86]/12 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <nav
          aria-label="Breadcrumb"
          className="mb-7 flex flex-wrap items-center gap-2 text-sm font-semibold text-[#746A79]"
        >
          <Link
            href="/"
            className="transition-colors hover:text-[#5B2A86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5B2A86] focus-visible:ring-offset-4"
          >
            Home
          </Link>
          <ChevronRight aria-hidden="true" size={15} />
          <span className="text-[#5B2A86]" aria-current="page">
            About Us
          </span>
        </nav>

        <div className="grid items-center gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14 xl:gap-18">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86] shadow-sm">
              <Sparkles aria-hidden="true" size={16} />
              About Kidzee Sector 12, Dwarka
            </div>

            <h1
              id="about-hero-heading"
              className="mt-5 max-w-[700px] text-balance text-[2.5rem] font-black leading-[1.04] tracking-[-0.05em] text-[#281034] sm:mt-6 sm:text-5xl lg:text-[3.6rem] xl:text-[3.9rem]"
            >
              {heading}{" "}
              <span className="text-[#5B2A86]">{headingHighlight}</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#675E6B] sm:text-lg">
              {introduction}
            </p>

            <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-2xl border border-[#E8DEEC] bg-white/85 px-4 py-3 text-sm font-bold leading-6 text-[#493E4E]"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    size={18}
                    className="mt-0.5 shrink-0 text-[#5B2A86]"
                  />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                href="/admissions?enquiry=SCHOOL_VISIT#admission-enquiry"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-7 text-base font-black text-white shadow-[0_14px_32px_rgba(91,42,134,0.24)] transition hover:-translate-y-0.5 hover:bg-[#47206A]"
                aria-label="Book a school visit at Kidzee Sector 12 Dwarka"
              >
                <CalendarCheck2 aria-hidden="true" size={18} />
                {primaryCtaLabel}
                <ArrowRight aria-hidden="true" size={18} />
              </Link>

              <a
                href={`tel:${site.phone}`}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-[#DCCFE3] bg-white px-7 text-base font-black text-[#5B2A86] shadow-sm transition hover:-translate-y-0.5 hover:border-[#5B2A86] hover:bg-[#F8F4FC]"
                aria-label={`Call Kidzee Sector 12 Dwarka at ${site.phoneDisplay}`}
              >
                <Phone aria-hidden="true" size={18} />
                {secondaryCtaLabel}
              </a>
            </div>
          </div>

          <figure className="relative mx-auto w-full max-w-[730px]">
            <div
              aria-hidden="true"
              className="absolute -inset-4 rotate-2 rounded-[42px] bg-[#EADDF1]/80"
            />
            <div className="relative overflow-hidden rounded-[32px] border-[7px] border-white bg-[#EEE7F1] shadow-[0_30px_82px_rgba(40,16,52,0.18)] sm:rounded-[38px] sm:border-[9px]">
              <div className="relative aspect-[5/4] w-full sm:aspect-[16/10] lg:aspect-[4/3]">
                <Image
                  src={heroImage}
                  alt={imageAlt}
                  fill
                  preload
                  unoptimized={
                    heroImage.startsWith("http") &&
                    !heroImage.includes("cdn.sanity.io")
                  }
                  sizes="(max-width: 640px) 92vw, (max-width: 1024px) 88vw, 52vw"
                  className="object-cover object-center"
                />
              </div>
            </div>

            <figcaption className="relative mx-auto mt-4 w-fit rounded-full border border-[#E5DAEA] bg-white/95 px-4 py-2 text-center text-xs font-black text-[#5B2A86] shadow-sm sm:text-sm">
              A real moment from our Sector 12B centre
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
