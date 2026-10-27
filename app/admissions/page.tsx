import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  CirclePercent,
  FileCheck2,
  HeartHandshake,
  MessageCircle,
  Phone,
  Sparkles,
  Sun,
} from "lucide-react";

import AdmissionForm from "@/components/AdmissionForm";
import PageShell from "@/components/PageShell";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildWebsitePageMetadata } from "@/lib/sanity/seo";
import { site as staticSite } from "@/lib/site";
import { buildSiteContact } from "@/lib/siteContact";

export async function generateMetadata(): Promise<Metadata> {
  return buildWebsitePageMetadata({
    pageKey: "admissions",
    path: "/admissions",
    title: "Admissions 2027–28 | Kidzee Sector 12 Dwarka",
    description:
      "Admissions 2027–28 at Kidzee Sector 12 Dwarka. Book a school visit and ask about 30% off annual charges, the January settling-in period and included summer camp.",
    keywords: [
      "preschool admission 2027-28 Dwarka",
      "Kidzee admission Sector 12 Dwarka",
      "nursery admission Dwarka",
      "playgroup admission Dwarka",
      "preschool offer Dwarka",
      "school visit Kidzee Dwarka",
    ],
    socialImage: "/images/landing/kidzee-creative-learning.jpg",
    socialImageAlt:
      "Children learning at Kidzee Sector 12 Dwarka",
  });
}

const formProgrammes = new Set([
  "PLAYGROUP",
  "NURSERY",
  "JUNIOR_KG",
  "SENIOR_KG",
  "DAYCARE",
]);

const formEnquiryTypes = new Set([
  "ADMISSION",
  "SCHOOL_VISIT",
  "TRIAL",
  "DAYCARE",
  "FEES",
  "CALLBACK",
]);

type AdmissionsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const offerHighlights = [
  {
    icon: CirclePercent,
    title: "30% off annual charges",
    description:
      "The concession applies to the annual charges for eligible 2027–28 preschool admissions.",
  },
  {
    icon: HeartHandshake,
    title: "A January settling-in start",
    description:
      "Children joining in January attend through January and February, while monthly tuition begins from March.",
  },
  {
    icon: Sun,
    title: "Summer camp included",
    description:
      "Children enrolled in our 2027–28 preschool programme do not pay an additional summer camp fee.",
  },
] as const;

const admissionSteps = [
  {
    number: "01",
    icon: MessageCircle,
    title: "Tell us about your child",
    description:
      "Share your child's age and the programme you are considering. If you are unsure, our centre team will guide you.",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Visit the preschool",
    description:
      "Meet the team, see the classrooms and discuss the daily routine, settling support, fees and current availability.",
  },
  {
    number: "03",
    icon: FileCheck2,
    title: "Receive the written fee details",
    description:
      "Before admission, we will confirm the programme, joining date, offer eligibility and complete fee breakup.",
  },
] as const;

const testimonials = [
  {
    quote:
      "I am fully satisfied with the school in every manner—learning, communication and safety. All the teachers treat children very nicely, and my daughter is growing here.",
    name: "Shailja Singh",
    source: "Google reviewer",
  },
  {
    quote:
      "The preschool is trustworthy. The teachers share weekly feedback and regularly update parents about activities.",
    name: "Komal Gahlot",
    source: "Google reviewer",
  },
] as const;

const offerTerms = [
  "The 30% concession applies only to annual charges for eligible 2027–28 preschool admissions. Admission, kit and any other applicable charges remain payable as explained in the written fee breakup.",
  "For a child whose admission is completed for a January 2027 start, January and February are the settling-in attendance period. The child attends the preschool routine during this period, and monthly tuition is charged from March 2027.",
  "The no-additional-fee summer camp inclusion applies to children enrolled in the centre's 2027–28 preschool programme. Optional services outside the preschool programme are separate.",
  "Programme placement, joining date, seat availability and the final fee schedule are confirmed by the centre team before payment.",
] as const;

const admissionFaqs = [
  {
    question: "What exactly is reduced by 30%?",
    answer:
      "The concession is on annual charges for eligible 2027–28 preschool admissions. It does not reduce admission, kit or other applicable charges. The centre team will give you a written fee breakup before you complete admission.",
  },
  {
    question: "Will my child attend during January and February?",
    answer:
      "Yes. A child admitted for a January 2027 start attends during January and February as a settling-in period and takes part in the preschool routine. Monthly tuition begins from March 2027.",
  },
  {
    question: "Is summer camp included?",
    answer:
      "Yes. Children enrolled in our 2027–28 preschool programme will not be charged an additional summer camp fee. Any optional services outside the preschool programme are discussed separately.",
  },
  {
    question: "Can we visit before deciding?",
    answer:
      "Yes. We encourage you to visit, see the classrooms, meet the centre team and understand the routine before making a decision.",
  },
  {
    question: "Which programmes are open for admission?",
    answer:
      "You can enquire for Playgroup, Nursery, Junior KG and Senior KG. Programme guidance is based on your child's age, readiness and previous preschool experience.",
  },
  {
    question: "How do I get the complete fee details?",
    answer:
      "Book a school visit or send the enquiry form. We will explain the offer, applicable charges, monthly tuition and current seat availability in a clear written breakup.",
  },
] as const;

const structuredData = [
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: staticSite.url,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Admissions 2027–28",
        item: staticSite.url + "/admissions",
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: admissionFaqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  },
] as const;

export default async function AdmissionsPage({
  searchParams,
}: AdmissionsPageProps) {
  const query = await searchParams;
  const requestedProgramme = firstQueryValue(query.programme).toUpperCase();
  const requestedEnquiryType = firstQueryValue(query.enquiry).toUpperCase();
  const initialProgramme = formProgrammes.has(requestedProgramme)
    ? requestedProgramme
    : "";
  const initialEnquiryType = formEnquiryTypes.has(requestedEnquiryType)
    ? requestedEnquiryType
    : "SCHOOL_VISIT";
  const contactSettings = await getWebsiteContactSettings();
  const site = buildSiteContact(contactSettings);

  return (
    <PageShell>
      <main className="overflow-hidden pt-[82px]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />

        <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#FAF7FC_0%,#FFFFFF_50%,#FFF4C9_100%)] py-8 sm:py-12 lg:py-16">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -left-32 top-4 h-80 w-80 rounded-full bg-[#EADDF1]/80 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#F6C84B]/30 blur-3xl" />
          </div>

          <Container>
            <nav
              aria-label="Breadcrumb"
              className="mb-6 flex items-center gap-2 text-sm text-[#746A78]"
            >
              <Link href="/" className="transition hover:text-[#5B2A86]">
                Home
              </Link>
              <ChevronRight aria-hidden="true" size={15} />
              <span aria-current="page" className="font-bold text-[#5B2A86]">
                Admissions 2027–28
              </span>
            </nav>

            <div className="grid items-start gap-9 lg:grid-cols-[1.02fr_0.98fr] lg:gap-12">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white/90 px-4 py-2 text-sm font-black text-[#5B2A86] shadow-sm">
                  <Sparkles aria-hidden="true" size={16} />
                  Admissions 2027–28 · Sector 12B, Dwarka
                </div>

                <h1 className="mt-5 text-balance text-4xl font-black leading-[1.04] tracking-[-0.045em] text-[#2D1736] sm:text-5xl lg:text-[58px]">
                  Give your child time to settle before the new session begins.
                </h1>

                <p className="mt-5 max-w-2xl text-lg leading-8 text-[#6F6474] sm:text-xl sm:leading-9">
                  Visit our preschool, meet the teachers and see the routine for
                  yourself. Families joining for 2027–28 can ask about our
                  January start plan and annual-charge concession.
                </p>

                <div className="mt-7 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-[#5B2A86] p-4 text-white shadow-[0_16px_38px_rgba(91,42,134,0.2)]">
                    <p className="text-3xl font-black">30%</p>
                    <p className="mt-1 text-sm font-bold text-white/85">
                      off annual charges
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#5B2A86]/10 bg-white/90 p-4">
                    <p className="font-black text-[#2D1736]">January–February</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-[#6F6474]">
                      settling-in attendance
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[#5B2A86]/10 bg-white/90 p-4">
                    <p className="font-black text-[#2D1736]">Summer camp</p>
                    <p className="mt-1 text-sm font-semibold leading-5 text-[#6F6474]">
                      no additional camp fee
                    </p>
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    href="#admission-enquiry"
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                    className="w-full sm:w-auto"
                  >
                    Book a School Visit
                  </Button>
                  <Button
                    href={"tel:" + site.phone}
                    variant="secondary"
                    size="lg"
                    leftIcon={<Phone aria-hidden="true" size={18} />}
                    className="w-full sm:w-auto"
                  >
                    Call Admissions
                  </Button>
                </div>

                <div className="relative mt-8 overflow-hidden rounded-[30px] shadow-[0_24px_65px_rgba(45,23,54,0.16)]">
                  <Image
                    src="/images/landing/kidzee-creative-learning.jpg"
                    alt="Children learning through creative activities at Kidzee Sector 12 Dwarka"
                    width={1200}
                    height={800}
                    priority
                    className="aspect-[16/10] w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#241229]/90 to-transparent px-5 pb-5 pt-16 text-white">
                    <p className="text-sm font-bold">
                      Photographed at our Sector 12B centre
                    </p>
                  </div>
                </div>
              </div>

              <AdmissionForm
                initialProgramme={initialProgramme}
                initialEnquiryType={initialEnquiryType}
                landingPageId="admissions_2027_28"
                landingVariantId="december_ads_offer"
                title="Plan your school visit"
                subtitle="Share your details and our centre team will help you choose a programme, understand the offer and arrange a convenient visit."
                badgeText="2027–28 admission enquiry"
                submitButtonText="Request a School Visit"
              />
            </div>
          </Container>
        </section>

        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                The January start plan
              </p>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-5xl">
                A confident beginning, without rushing the first few weeks.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
                The offer is designed for families who want their child to know
                the teachers, classroom and daily rhythm before the academic
                session begins in March.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-12">
              {offerHighlights.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-[28px] border border-[#5B2A86]/10 bg-[#FCFAFD] p-6 sm:p-7"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B2A86] text-white">
                    <Icon aria-hidden="true" size={22} />
                  </span>
                  <h3 className="mt-5 text-xl font-black text-[#2D1736]">
                    {title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                    {description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-7 rounded-[30px] border border-[#E7D9ED] bg-[#FFF9E3] p-6 sm:p-8">
              <p className="text-sm font-black uppercase tracking-[0.14em] text-[#5B2A86]">
                In simple terms
              </p>
              <p className="mt-3 max-w-4xl text-lg font-bold leading-8 text-[#39243F]">
                If your child's admission is completed for a January 2027
                start, the child attends in January and February as part of the
                settling-in period. Monthly tuition begins from March 2027.
                Annual, admission, kit and other applicable charges are handled
                separately as shown in your written fee breakup.
              </p>
            </div>
          </Container>
        </section>

        <section className="bg-[#FAF7FC] py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                Visit before you decide
              </p>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-5xl">
                See the place where your child will spend their day.
              </h2>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {admissionSteps.map(({ number, icon: Icon, title, description }) => (
                <article
                  key={number}
                  className="relative rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 sm:p-7"
                >
                  <span
                    aria-hidden="true"
                    className="absolute right-6 top-5 text-4xl font-black text-[#EEE4F3]"
                  >
                    {number}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FFF1B8] text-[#5B2A86]">
                    <Icon aria-hidden="true" size={21} />
                  </span>
                  <h3 className="mt-6 text-xl font-black text-[#2D1736]">
                    {title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                    {description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center justify-between gap-7 rounded-[32px] bg-[#2D1736] px-6 py-9 text-center text-white shadow-[0_24px_65px_rgba(45,23,54,0.2)] sm:px-9 lg:flex-row lg:text-left">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                  Come and meet us before you decide.
                </h2>
                <p className="mt-3 leading-7 text-white/75">
                  Bring your child, see the classrooms and ask every practical
                  question. We will explain the programme and complete fee
                  structure clearly.
                </p>
              </div>
              <Button
                href="#admission-enquiry"
                variant="yellow"
                size="lg"
                rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                className="w-full shrink-0 sm:w-auto"
              >
                Book Your Visit
              </Button>
            </div>
          </Container>
        </section>

        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
              <div className="max-w-3xl">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                  Inside our preschool
                </p>
                <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] text-[#2D1736] sm:text-4xl">
                  Real classrooms. Real routines. Real moments.
                </h2>
                <p className="mt-4 leading-8 text-[#6F6474]">
                  These photographs are from our Sector 12B centre. A school
                  visit lets you see the spaces and meet the people behind them.
                </p>
              </div>
              <Button href="#admission-enquiry" variant="secondary" size="md">
                Plan a Visit
              </Button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  src: "/images/programmes/playgroup.jpg",
                  alt: "Playgroup children learning at Kidzee Sector 12 Dwarka",
                },
                {
                  src: "/images/programmes/nursery.jpg",
                  alt: "Nursery children taking part in a classroom activity at Kidzee Sector 12 Dwarka",
                },
                {
                  src: "/images/programmes/junior-kg.jpg",
                  alt: "Junior KG children learning at Kidzee Sector 12 Dwarka",
                },
              ].map((photo) => (
                <div
                  key={photo.src}
                  className="overflow-hidden rounded-[26px] bg-[#F3EAF8]"
                >
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    width={900}
                    height={700}
                    className="aspect-[4/3] h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </Container>
        </section>

        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                Parent experiences
              </p>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-5xl">
                What local parents chose to share.
              </h2>
            </div>

            <div className="mx-auto mt-10 grid max-w-5xl gap-5 md:grid-cols-2">
              {testimonials.map((testimonial) => (
                <figure
                  key={testimonial.name}
                  className="rounded-[28px] border border-[#5B2A86]/10 bg-[#FCFAFD] p-7 sm:p-8"
                >
                  <div className="text-lg tracking-[0.18em] text-[#F2B705]">
                    ★★★★★
                  </div>
                  <blockquote className="mt-4 text-lg font-semibold leading-8 text-[#3D3041]">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-5">
                    <p className="font-black text-[#2D1736]">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-[#746A78]">
                      {testimonial.source}
                    </p>
                  </figcaption>
                </figure>
              ))}
            </div>

            <div className="mt-7 text-center">
              <Button
                href={staticSite.googleReviews}
                variant="secondary"
                size="md"
              >
                Read Current Google Reviews
              </Button>
            </div>
          </Container>
        </section>

        <section className="bg-[#FAF7FC] py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-12">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                  Clear offer terms
                </p>
                <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] text-[#2D1736] sm:text-4xl">
                  No surprises after you visit.
                </h2>
                <p className="mt-5 leading-8 text-[#6F6474]">
                  Our team will confirm eligibility and give you the complete
                  fee schedule in writing before admission.
                </p>

                <div className="mt-7 space-y-4">
                  {offerTerms.map((term) => (
                    <div key={term} className="flex items-start gap-3">
                      <CheckCircle2
                        aria-hidden="true"
                        size={19}
                        className="mt-1 shrink-0 text-[#5B2A86]"
                      />
                      <p className="leading-7 text-[#5F5363]">{term}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                {admissionFaqs.map((faq, index) => (
                  <details
                    key={faq.question}
                    className="group overflow-hidden rounded-[24px] border border-[#5B2A86]/10 bg-white open:shadow-[0_14px_40px_rgba(45,23,54,0.07)]"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 sm:px-6">
                      <span className="text-xs font-black text-[#8A4AB5]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className="flex-1 text-left text-base font-black text-[#2D1736] sm:text-lg">
                        {faq.question}
                      </h3>
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3EAF8] text-xl font-black text-[#5B2A86] transition group-open:rotate-45">
                        +
                      </span>
                    </summary>
                    <p className="border-t border-[#5B2A86]/10 px-5 py-5 leading-7 text-[#6F6474] sm:px-14">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          </Container>
        </section>

        <section className="bg-[#2D1736] py-14 text-white sm:py-16">
          <Container>
            <div className="mx-auto max-w-4xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F6D86F]">
                Admissions 2027–28
              </p>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                The best way to know if it feels right is to visit.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl leading-8 text-white/75">
                Tell us your child's age and choose a preferred date. Our centre
                team will call you to confirm the visit.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  href="#admission-enquiry"
                  variant="yellow"
                  size="lg"
                  rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                >
                  Request a School Visit
                </Button>
                <Button
                  href={"tel:" + site.phone}
                  variant="secondary"
                  size="lg"
                  leftIcon={<Phone aria-hidden="true" size={18} />}
                  className="border-white/25 bg-white text-[#2D1736]"
                >
                  Call {site.phoneDisplay}
                </Button>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </PageShell>
  );
}
