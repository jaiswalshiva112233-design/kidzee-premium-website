import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  BookOpenCheck,
  CalendarCheck2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock3,
  HeartHandshake,
  MoonStar,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import Container from "@/components/ui/Container";
import { getWebsiteContentSettings } from "@/lib/sanity/contentSettings";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { getWebsiteMediaBySlotKeys } from "@/lib/sanity/media";
import { buildWebsitePageMetadata } from "@/lib/sanity/seo";
import { site } from "@/lib/site";
import { buildSiteContact } from "@/lib/siteContact";

export async function generateMetadata(): Promise<Metadata> {
  return buildWebsitePageMetadata({
    pageKey: "daycare",
    path: "/daycare",
    title: "Daycare in Dwarka",
    description:
      "Daycare at Kidzee Sector 12B, Dwarka from 12:30 PM to 7:00 PM. Explore occasional, selected-day and regular care with rest, play, homework support and optional meals.",
    keywords: [
      "daycare in Sector 12 Dwarka",
      "daycare in Dwarka",
      "daycare Sector 12B Dwarka",
      "after school daycare Dwarka",
      "daycare till 7 PM Dwarka",
      "occasional daycare Dwarka",
      "homework support daycare Dwarka",
    ],
    socialImage: "/images/daycare/daycare-main.jpg",
    socialImageAlt: "Daycare at Kidzee Sector 12 Dwarka",
  });
}

const heroHighlights = [
  "Available from 12:30 PM to 7:00 PM",
  "Sleep or quiet time after lunch",
  "Homework support for school-going children",
];

const careOptions = [
  {
    icon: HeartHandshake,
    title: "After-preschool care",
    description:
      "Preschool children can continue into daycare after classes without a rushed change of place or routine.",
  },
  {
    icon: CalendarDays,
    title: "Selected-day or occasional care",
    description:
      "Ask about a few hours, one day or chosen weekdays when your family does not need daycare every day.",
  },
  {
    icon: Clock3,
    title: "A full afternoon until 7:00 PM",
    description:
      "Longer stays can include lunch, rest, activities, homework support and a calmer end before pickup.",
  },
];

const routine = [
  {
    time: "12:30 PM onwards",
    title: "Arrive and settle",
    description:
      "Children wash their hands, put away belongings and move into the afternoon at an easy pace.",
    icon: HeartHandshake,
  },
  {
    time: "Early afternoon",
    title: "Lunch together",
    description:
      "Children have time to eat comfortably before the quieter part of the day.",
    icon: Utensils,
  },
  {
    time: "After lunch",
    title: "Sleep or quiet time",
    description:
      "Children may sleep, read, draw or choose another calm activity according to their routine.",
    icon: BedDouble,
  },
  {
    time: "Later afternoon",
    title: "Play and activities",
    description:
      "Stories, art, music, blocks, puzzles and supervised play keep the afternoon interesting.",
    icon: Palette,
  },
  {
    time: "Before pickup",
    title: "Homework and wind-down",
    description:
      "School-going children can complete homework while younger children move into lighter activities.",
    icon: BookOpenCheck,
  },
];

const faqs = [
  {
    question: "What are the daycare timings?",
    answer:
      "Daycare is available from 12:30 PM to 7:00 PM, Monday to Saturday. Tell us the hours you usually need so we can check the most suitable routine and current availability.",
  },
  {
    question: "Can I choose only some days or book occasional daycare?",
    answer:
      "Yes, subject to availability. Families can ask about hourly care, one-day care, selected weekdays or a regular plan. The centre confirms the current option and charge before booking.",
  },
  {
    question: "Are daycare meals included?",
    answer:
      "Daycare begins after preschool, so there is no daycare breakfast. Lunch and evening snacks are optional, chargeable plans. The preschool meal included during school hours is separate from daycare meal charges.",
  },
  {
    question: "Can my child join after attending another school?",
    answer:
      "Yes, subject to age, school timing and availability. We first understand the expected arrival time so the transition into lunch, rest or activities does not feel rushed.",
  },
  {
    question: "What happens if my child does not sleep?",
    answer:
      "Sleep is not compulsory. Children who do not nap can look at books, draw or join another quiet activity while others rest.",
  },
  {
    question: "Is homework support available?",
    answer:
      "Yes. School-going children can work on age-appropriate homework during daycare. Parents can also tell the teacher when something specific needs attention.",
  },
  {
    question: "How are daycare and meal charges explained?",
    answer:
      "The centre confirms the current hourly, selected-day, full-day and meal charges before care is booked. Quoted billing amounts are inclusive of applicable GST, so the receipt shows the complete amount clearly.",
  },
  {
    question: "Who can collect my child?",
    answer:
      "Children are handed over only to adults approved by the parent. Please inform the centre beforehand if someone different will collect your child.",
  },
];

const daycareSchema = {
  "@context": "https://schema.org",
  "@type": "ChildCare",
  "@id": site.url + "/daycare#childcare",
  name: site.shortName + " Daycare",
  url: site.url + "/daycare",
  telephone: site.phone,
  image: site.url + "/images/daycare/daycare-main.jpg",
  address: {
    "@type": "PostalAddress",
    streetAddress:
      "Building No. 19, 1st Floor, Block-B, Parmanand Colony, Pocket 8, Block B, Sector 12 Dwarka",
    addressLocality: "Dwarka",
    addressRegion: "Delhi",
    postalCode: site.postalCode,
    addressCountry: site.country,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    opens: site.daycareHours.opens,
    closes: site.daycareHours.closes,
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
      name: "Daycare",
      item: site.url + "/daycare",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
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

export default async function DaycarePage() {
  const [media, contentSettings, contactSettings] = await Promise.all([
    getWebsiteMediaBySlotKeys(["daycare.hero.main"]),
    getWebsiteContentSettings(),
    getWebsiteContactSettings(),
  ]);
  const contact = buildSiteContact(contactSettings);
  const heroImage = optimiseSanityImageUrl(
    media["daycare.hero.main"]?.imageUrl ??
      "/images/daycare/daycare-main.jpg",
  );
  const heroImageAlt =
    media["daycare.hero.main"]?.altText ||
    "Child taking part in a daycare activity at Kidzee Sector 12 Dwarka";

  const structuredData = JSON.stringify([
    {
      ...daycareSchema,
      telephone: contact.phone,
      address: { ...daycareSchema.address, streetAddress: contact.address },
      openingHoursSpecification: {
        ...daycareSchema.openingHoursSpecification,
        opens: contact.daycareHours.opens,
        closes: contact.daycareHours.closes,
      },
    },
    breadcrumbSchema,
    faqSchema,
  ]).replace(/</g, "\\u003c");

  return (
    <PageShell>
      <main className="overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: structuredData }}
        />

        <section
          aria-labelledby="daycare-hero-heading"
          className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#FFF9F1_0%,#FFFFFF_52%,#F7F0FB_100%)] pb-14 pt-[104px] sm:pb-16 sm:pt-28 lg:pb-20 lg:pt-32"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -left-36 top-24 h-80 w-80 rounded-full bg-[#F6C84B]/18 blur-3xl" />
            <div className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-[#5B2A86]/12 blur-3xl" />
          </div>

          <Container>
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
                Daycare
              </span>
            </nav>

            <div className="grid items-center gap-10 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14 xl:gap-18">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86] shadow-sm">
                  <Clock3 aria-hidden="true" size={16} />
                  Daycare from 12:30 PM to 7:00 PM
                </div>

                <h1
                  id="daycare-hero-heading"
                  className="mt-5 max-w-[720px] text-balance text-[2.5rem] font-black leading-[1.04] tracking-[-0.05em] text-[#281034] sm:mt-6 sm:text-5xl lg:text-[3.6rem] xl:text-[3.9rem]"
                >
                  {contentSettings.daycareHeroHeading}{" "}
                  <span className="text-[#5B2A86]">
                    {contentSettings.daycareHeroHighlight}
                  </span>
                </h1>

                <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#675E6B] sm:text-lg">
                  {contentSettings.daycareHeroIntro}
                </p>

                <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
                  {heroHighlights.map((item) => (
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
                    href="/admissions?programme=DAYCARE&enquiry=DAYCARE#admission-enquiry"
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-7 text-base font-black text-white shadow-[0_14px_32px_rgba(91,42,134,0.24)] transition hover:-translate-y-0.5 hover:bg-[#47206A]"
                    aria-label="Ask Kidzee Sector 12 Dwarka about daycare availability"
                  >
                    <CalendarCheck2 aria-hidden="true" size={18} />
                    Check Daycare Availability
                    <ArrowRight aria-hidden="true" size={18} />
                  </Link>

                  <a
                    href={"tel:" + contact.phone}
                    className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-[#DCCFE3] bg-white px-7 text-base font-black text-[#5B2A86] shadow-sm transition hover:-translate-y-0.5 hover:border-[#5B2A86] hover:bg-[#F8F4FC]"
                    aria-label={"Call " + site.shortName}
                  >
                    <Phone aria-hidden="true" size={18} />
                    {contact.phoneDisplay}
                  </a>
                </div>
              </div>

              <figure className="relative mx-auto w-full max-w-[730px]">
                <div
                  aria-hidden="true"
                  className="absolute -inset-4 rotate-2 rounded-[42px] bg-[#F4DE91]/55"
                />
                <div className="relative overflow-hidden rounded-[32px] border-[7px] border-white bg-[#EEE7F1] shadow-[0_30px_82px_rgba(40,16,52,0.18)] sm:rounded-[38px] sm:border-[9px]">
                  <div className="relative aspect-[5/4] w-full sm:aspect-[16/10] lg:aspect-[4/3]">
                    <Image
                      src={heroImage}
                      alt={heroImageAlt}
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
                  A real daycare moment at our Sector 12B centre
                </figcaption>
              </figure>
            </div>
          </Container>
        </section>

        <section
          aria-labelledby="daycare-options-heading"
          className="relative overflow-hidden bg-[#FAF8FD] py-16 sm:py-20 lg:py-24"
        >
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86] shadow-sm">
                <Sparkles aria-hidden="true" size={16} />
                Flexible care
              </div>
              <h2
                id="daycare-options-heading"
                className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#281034] sm:text-4xl lg:text-[48px]"
              >
                Choose daycare around the hours you actually need
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-[#675E6B] sm:text-lg">
                We first understand your child&apos;s age, school timing and
                expected pickup time, then confirm the suitable option and
                availability.
              </p>
            </div>

            <div className="mt-10 grid grid-flow-col auto-cols-[84%] gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:auto-cols-[62%] lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-3 lg:overflow-visible lg:pb-0">
              {careOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <article
                    key={option.title}
                    className="snap-start rounded-[28px] border border-[#E9DFED] bg-white p-6 shadow-[0_14px_38px_rgba(40,16,52,0.07)]"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E5F6] text-[#5B2A86]">
                      <Icon aria-hidden="true" size={22} />
                    </span>
                    <h3 className="mt-5 text-xl font-black text-[#281034]">
                      {option.title}
                    </h3>
                    <p className="mt-3 text-sm font-semibold leading-7 text-[#675E6B] sm:text-base">
                      {option.description}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex items-start gap-4 rounded-[26px] border border-[#E8DDAF] bg-[#FFF9DE] p-5 sm:p-6">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F6D75A] text-[#281034]">
                <Utensils aria-hidden="true" size={21} />
              </span>
              <div>
                <h3 className="text-lg font-black text-[#281034]">
                  Daycare lunch and evening snacks
                </h3>
                <p className="mt-2 text-sm font-semibold leading-7 text-[#675E6B] sm:text-base">
                  Daycare starts after preschool, so there is no daycare
                  breakfast. Lunch and evening snacks are optional, chargeable
                  plans. Ask the centre for the current meal options and
                  amounts.
                </p>
              </div>
            </div>

            <p className="mt-4 text-center text-sm font-semibold text-[#746A79] lg:hidden">
              Swipe to see all daycare options
            </p>
          </Container>
        </section>

        <section
          aria-labelledby="daycare-routine-heading"
          className="relative overflow-hidden bg-[#FFF9EF] py-16 sm:py-20 lg:py-24"
        >
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86] shadow-sm">
                <MoonStar aria-hidden="true" size={16} />
                A flexible afternoon
              </div>
              <h2
                id="daycare-routine-heading"
                className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#281034] sm:text-4xl lg:text-[48px]"
              >
                What a daycare afternoon can include
              </h2>
              <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-[#675E6B] sm:text-lg">
                Children arrive and leave at different times, so the routine
                has a familiar flow without forcing every child into the same
                pace.
              </p>
            </div>

            <div className="mt-10 grid grid-flow-col auto-cols-[84%] gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:auto-cols-[56%] lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-5 lg:overflow-visible lg:pb-0">
              {routine.map((step) => {
                const Icon = step.icon;
                return (
                  <article
                    key={step.time + step.title}
                    className="snap-start rounded-[28px] border border-[#E9DFED] bg-white p-5 shadow-[0_14px_38px_rgba(40,16,52,0.07)]"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F0E5F6] text-[#5B2A86]">
                      <Icon aria-hidden="true" size={20} />
                    </span>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.12em] text-[#7A568E]">
                      {step.time}
                    </p>
                    <h3 className="mt-2 text-lg font-black text-[#281034]">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm font-semibold leading-7 text-[#675E6B]">
                      {step.description}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-8 flex flex-col gap-5 rounded-[28px] bg-[#2D1636] p-6 text-white shadow-[0_20px_54px_rgba(45,22,54,0.16)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#F6D75A]">
                  <ShieldCheck aria-hidden="true" size={23} />
                </span>
                <div>
                  <h3 className="text-xl font-black sm:text-2xl">
                    Safe, informed pickup
                  </h3>
                  <p className="mt-2 max-w-3xl text-sm font-semibold leading-7 text-[#E9DFF0] sm:text-base">
                    Tell us your expected pickup time and the adults approved
                    to collect your child. A quick call or message helps when
                    traffic or work changes the plan.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-sm font-semibold text-[#746A79] lg:hidden">
              Swipe to follow the afternoon routine
            </p>
          </Container>
        </section>

        <section
          aria-labelledby="daycare-faq-heading"
          className="relative overflow-hidden bg-[#FAF8FD] py-16 sm:py-20 lg:py-24"
        >
          <Container size="narrow">
            <div className="mx-auto max-w-4xl text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86] shadow-sm">
                <CheckCircle2 aria-hidden="true" size={16} />
                Parent questions
              </div>
              <h2
                id="daycare-faq-heading"
                className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#281034] sm:text-4xl lg:text-[48px]"
              >
                Practical answers before you plan daycare
              </h2>
            </div>

            <div className="mt-10 space-y-3">
              {faqs.map((faq, index) => (
                <details
                  key={faq.question}
                  className="group overflow-hidden rounded-[22px] border border-[#E9DFED] bg-white shadow-[0_10px_28px_rgba(40,16,52,0.05)] open:shadow-[0_16px_38px_rgba(40,16,52,0.09)]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
                    <div className="flex items-start gap-3 sm:gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0E5F6] text-xs font-black text-[#5B2A86]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="pt-1 text-left text-base font-black leading-6 text-[#281034] sm:text-lg sm:leading-7">
                        {faq.question}
                      </h3>
                    </div>
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8F2FB] text-[#5B2A86] transition group-open:rotate-180 group-open:bg-[#5B2A86] group-open:text-white">
                      <ChevronDown aria-hidden="true" size={18} />
                    </span>
                  </summary>
                  <div className="border-t border-[#EEE6F1] px-5 pb-5 pt-4 sm:px-6">
                    <p className="text-sm font-semibold leading-7 text-[#675E6B] sm:pl-[52px] sm:text-base sm:leading-8">
                      {faq.answer}
                    </p>
                  </div>
                </details>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-5 rounded-[28px] bg-[#5B2A86] p-6 text-white shadow-[0_20px_54px_rgba(91,42,134,0.2)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.15em] text-[#F6D75A]">
                  Check the right daycare option
                </p>
                <h3 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
                  Share your child&apos;s age, school timing and the hours you
                  need.
                </h3>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-white/85 sm:text-base">
                  We will explain the routine, current charges and available
                  places before you decide.
                </p>
              </div>

              <Link
                href="/admissions?programme=DAYCARE&enquiry=DAYCARE#admission-enquiry"
                className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[#F6D75A] px-7 text-base font-black text-[#281034] transition hover:bg-[#FFE984]"
              >
                <CalendarCheck2 aria-hidden="true" size={19} />
                Send Daycare Enquiry
              </Link>
            </div>
          </Container>
        </section>
      </main>
    </PageShell>
  );
}
