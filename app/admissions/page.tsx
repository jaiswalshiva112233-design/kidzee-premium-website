import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileCheck2,
  MessageCircle,
  Phone,
} from "lucide-react";

import AdmissionForm from "@/components/AdmissionForm";
import PageShell from "@/components/PageShell";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getWebsiteContentSettings } from "@/lib/sanity/contentSettings";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildWebsitePageMetadata } from "@/lib/sanity/seo";
import { site as staticSite } from "@/lib/site";
import { buildSiteContact } from "@/lib/siteContact";

export async function generateMetadata(): Promise<Metadata> {
  return buildWebsitePageMetadata({
    pageKey: "admissions",
    path: "/admissions",
    title: "Preschool Admissions",
    description:
      "Enquire about Playgroup, Nursery, Junior KG, Senior KG and daycare admissions at Kidzee Sector 12, Dwarka. Book a centre visit or ask about the three-day trial.",
    keywords: [
      "preschool admission Sector 12 Dwarka",
      "Kidzee admission Dwarka",
      "nursery admission Dwarka",
      "playgroup admission Dwarka",
      "Junior KG admission Dwarka",
      "Senior KG admission Dwarka",
      "preschool trial Dwarka",
    ],
    socialImage: "/images/hero/hero-classroom.jpg",
    socialImageAlt:
      "Preschool admissions at Kidzee Sector 12 Dwarka",
  });
}

const quickFacts = [
  "Playgroup to Senior KG",
  "Three-day trial available",
  "Daycare until 7:00 PM",
] as const;

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
  searchParams: Promise<
    Record<string, string | string[] | undefined>
  >;
};

function firstQueryValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

const admissionSteps = [
  {
    number: "01",
    icon: MessageCircle,
    title: "Tell us what you need",
    description:
      "Share your child's age, the programme you are considering and whether you would like a school visit, trial or callback.",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Visit and meet the team",
    description:
      "See the classrooms, understand the routine and ask about settling, meals, daycare, transport and current availability.",
  },
  {
    number: "03",
    icon: ClipboardCheck,
    title: "Complete admission",
    description:
      "Once you are comfortable, confirm the programme and joining date, then submit the admission form and documents.",
  },
] as const;

const documents = [
  "Child's birth certificate",
  "Recent passport-size photographs",
  "Parent or guardian identity proof",
  "Residential address proof",
  "Relevant medical information, when applicable",
] as const;

const admissionFaqs = [
  {
    question: "How do I begin the admission process?",
    answer:
      "Send the short enquiry form on this page. Your details are saved with our centre team, who can then discuss your child's age, the suitable programme, availability and a convenient visit time.",
  },
  {
    question: "Which programme is suitable for my child?",
    answer:
      "Programme guidance begins with age and also considers readiness and any previous preschool experience. If you are unsure, select 'Please guide me' in the enquiry form.",
  },
  {
    question: "Can we visit the centre before deciding?",
    answer:
      "Yes. A visit lets you see the classrooms, meet the centre team and understand the daily routine before you make a decision.",
  },
  {
    question: "Is a trial available before admission?",
    answer:
      "A three-day preschool trial is available with prior scheduling and subject to current classroom availability. The centre team will confirm the suitable dates and timings.",
  },
  {
    question: "Can I discuss fees before visiting?",
    answer:
      "Yes. Choose 'Fees and availability' in the form and the centre team will explain the current programme fee structure and any optional services relevant to your child.",
  },
  {
    question: "Can I enquire about daycare with preschool?",
    answer:
      "Yes. Tell us whether you need preschool only, occasional daycare or regular daycare so we can explain the routine, meal options, timings and current charges.",
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
        name: "Admissions",
        item: `${staticSite.url}/admissions`,
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to enquire about preschool admission at Kidzee Sector 12 Dwarka",
    description:
      "A parent-friendly path from first enquiry to preschool admission.",
    step: admissionSteps.map((step) => ({
      "@type": "HowToStep",
      position: Number(step.number),
      name: step.title,
      text: step.description,
    })),
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
  const [contentSettings, contactSettings] = await Promise.all([
    getWebsiteContentSettings(),
    getWebsiteContactSettings(),
  ]);
  const site = buildSiteContact(contactSettings);

  return (
    <PageShell>
      <main className="overflow-hidden pt-[82px]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(
              /</g,
              "\\u003c",
            ),
          }}
        />

        <section className="relative isolate overflow-hidden bg-[linear-gradient(135deg,#FAF7FC_0%,#FFFFFF_52%,#FFF7D8_100%)] py-10 sm:py-14 lg:py-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10"
          >
            <div className="absolute -left-36 top-8 h-80 w-80 rounded-full bg-[#EADDF1]/80 blur-3xl" />
            <div className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/25 blur-3xl" />
          </div>

          <Container>
            <nav
              aria-label="Breadcrumb"
              className="mb-8 flex items-center gap-2 text-sm text-[#746A78]"
            >
              <Link
                href="/"
                className="transition hover:text-[#5B2A86]"
              >
                Home
              </Link>
              <ChevronRight aria-hidden="true" size={15} />
              <span aria-current="page" className="font-bold text-[#5B2A86]">
                Admissions
              </span>
            </nav>

            <div className="grid items-start gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 xl:gap-16">
              <div className="lg:sticky lg:top-28 lg:pt-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white/90 px-4 py-2 text-sm font-black text-[#5B2A86] shadow-sm">
                  <CheckCircle2 aria-hidden="true" size={16} />
                  {contentSettings.admissionsOpen
                    ? `Admissions ${contentSettings.academicYear}`
                    : `Admission enquiries ${contentSettings.academicYear}`}{" "}
                  · Sector 12B, Dwarka
                </div>

                <h1 className="mt-6 text-balance text-4xl font-black leading-[1.04] tracking-[-0.045em] text-[#2D1736] sm:text-5xl lg:text-[58px]">
                  {contentSettings.admissionsHeroHeading}
                </h1>

                <p className="mt-6 max-w-xl text-lg leading-8 text-[#6F6474] sm:text-xl sm:leading-9">
                  {contentSettings.admissionsHeroIntro}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    href="#admission-enquiry"
                    variant="primary"
                    size="lg"
                    rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                    className="w-full sm:w-auto"
                  >
                    Send Enquiry
                  </Button>

                  <Button
                    href={`tel:${site.phone}`}
                    variant="secondary"
                    size="lg"
                    leftIcon={<Phone aria-hidden="true" size={18} />}
                    className="w-full sm:w-auto"
                  >
                    {contentSettings.secondaryCtaLabel}
                  </Button>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                  {quickFacts.map((fact) => (
                    <div
                      key={fact}
                      className="flex items-start gap-2.5 rounded-2xl border border-[#5B2A86]/10 bg-white/80 px-4 py-3"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        size={17}
                        className="mt-0.5 shrink-0 text-[#5B2A86]"
                      />
                      <span className="text-sm font-bold leading-5 text-[#514656]">
                        {fact}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <AdmissionForm
                initialProgramme={initialProgramme}
                initialEnquiryType={initialEnquiryType}
              />
            </div>
          </Container>
        </section>

        <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                A clear path to admission
              </p>
              <h2 className="mt-4 text-balance text-3xl font-black leading-tight tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-5xl">
                From your first question to your child&apos;s first day.
              </h2>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
                You can understand the programme, people and routine before
                completing any admission formalities.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-12">
              {admissionSteps.map(({ number, icon: Icon, title, description }) => (
                <article
                  key={number}
                  className="relative rounded-[28px] border border-[#5B2A86]/10 bg-[#FCFAFD] p-6 sm:p-7"
                >
                  <span
                    aria-hidden="true"
                    className="absolute right-6 top-5 text-4xl font-black text-[#EEE4F3]"
                  >
                    {number}
                  </span>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B2A86] text-white">
                    <Icon aria-hidden="true" size={21} />
                  </span>
                  <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                    Step {number}
                  </p>
                  <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-[#2D1736]">
                    {title}
                  </h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                    {description}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-7 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <article className="rounded-[30px] bg-[#2D1736] p-7 text-white shadow-[0_24px_65px_rgba(45,23,54,0.18)] sm:p-9">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F6D86F]">
                  Before regular attendance
                </p>
                <h3 className="mt-4 text-3xl font-black leading-tight tracking-[-0.03em]">
                  Ask about the three-day trial.
                </h3>
                <p className="mt-4 max-w-xl leading-8 text-white/75">
                  A scheduled trial can help your child experience the
                  teachers and classroom before regular preschool begins.
                  Availability and suitable timings are confirmed by the
                  centre team.
                </p>
                <div className="mt-7">
                  <Button
                    href="/admissions?enquiry=TRIAL#admission-enquiry"
                    variant="yellow"
                    size="md"
                    rightIcon={<ArrowRight aria-hidden="true" size={17} />}
                  >
                    Ask About the Trial
                  </Button>
                </div>
              </article>

              <article className="rounded-[30px] border border-[#5B2A86]/10 bg-white p-7 shadow-[0_16px_46px_rgba(52,20,68,0.07)] sm:p-9">
                <div className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFF1B8] text-[#5B2A86]">
                    <FileCheck2 aria-hidden="true" size={23} />
                  </span>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-[#5B2A86]">
                      Keep these ready
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-[#2D1736]">
                      Common admission documents
                    </h3>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {documents.map((document) => (
                    <div key={document} className="flex items-start gap-3">
                      <CheckCircle2
                        aria-hidden="true"
                        size={18}
                        className="mt-1 shrink-0 text-[#5B2A86]"
                      />
                      <p className="leading-7 text-[#6F6474]">{document}</p>
                    </div>
                  ))}
                </div>

                <p className="mt-6 rounded-2xl bg-[#FAF7FC] p-4 text-sm leading-6 text-[#6F6474]">
                  The centre team will confirm the final list for your child
                  before admission.
                </p>
              </article>
            </div>
          </Container>
        </section>

        <section className="bg-[#FAF7FC] py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                Parent questions
              </p>
              <h2 className="mt-4 text-balance text-3xl font-black tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-5xl">
                Helpful answers before you visit.
              </h2>
            </div>

            <div className="mx-auto mt-10 max-w-4xl space-y-3">
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

            <div className="mx-auto mt-10 flex max-w-5xl flex-col items-center justify-between gap-7 rounded-[32px] bg-[#2D1736] px-6 py-9 text-center text-white shadow-[0_24px_65px_rgba(45,23,54,0.2)] sm:px-9 lg:flex-row lg:text-left">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                  Ready to take the first simple step?
                </h2>
                <p className="mt-3 leading-7 text-white/75">
                  Send your details once. They will be saved securely with
                  our centre team so we can guide you personally.
                </p>
              </div>
              <Button
                href="#admission-enquiry"
                variant="yellow"
                size="lg"
                rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                className="w-full shrink-0 sm:w-auto"
              >
                Send an Enquiry
              </Button>
            </div>
          </Container>
        </section>
      </main>
    </PageShell>
  );
}
