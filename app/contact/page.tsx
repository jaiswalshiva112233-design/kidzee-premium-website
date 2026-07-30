import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import ContactForm from "@/components/ContactForm";
import { CTA } from "@/components/HomeSections";
import {
  ArrowRight,
  BusFront,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  School,
  ShieldCheck,
} from "lucide-react";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Kidzee Preschool in Sector 12 Dwarka",
  description:
    "Contact Kidzee Preschool & Daycare at Building No. 19, Block B, Sector 12B, Dwarka. Call or WhatsApp +91 96670 38673 to book a school visit or 3-day trial.",
  keywords: [
    "contact Kidzee Sector 12 Dwarka",
    "Kidzee Dwarka phone number",
    "preschool visit Sector 12 Dwarka",
    "preschool enquiry Dwarka",
    "daycare enquiry Dwarka",
    "Kidzee Sector 12B address",
  ],
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Kidzee Sector 12, Dwarka",
    description:
      "Speak with our team about preschool admissions, daycare, transport, school visits and three-day trial classes.",
    url: "/contact",
    type: "website",
    images: [
      {
        url: "/images/contact-main.jpg",
        width: 1200,
        height: 630,
        alt: "Contact Kidzee Preschool and Daycare Sector 12 Dwarka",
      },
    ],
  },
};

const enquiryTopics = [
  {
    icon: School,
    title: "Preschool admissions",
    description:
      "Discuss the right programme for your child based on age and readiness.",
  },
  {
    icon: CalendarDays,
    title: "Three-day trial",
    description:
      "Book a trial so your child can experience the teachers and classroom routine.",
  },
  {
    icon: Clock3,
    title: "Daycare options",
    description:
      "Ask about hourly care, extended daycare and care available until 7:00 PM.",
  },
  {
    icon: BusFront,
    title: "Transport availability",
    description:
      "Share your location so our team can confirm whether cab service is available.",
  },
];

const visitChecklist = [
  "Meet the centre team",
  "Explore the classrooms",
  "See the indoor and outdoor play areas",
  "Understand the daily routine",
  "Discuss fees and seat availability",
  "Ask about daycare and transport",
];

const faqs = [
  {
    question: "How can I book a school visit?",
    answer:
      "You can call, WhatsApp or complete the enquiry form on this page. Our centre team will contact you to arrange a suitable visit time.",
  },
  {
    question: "What should I bring for the first visit?",
    answer:
      "You do not need to bring admission documents for an initial school visit. Sharing your child’s age, preferred programme and daycare requirement is enough for the first discussion.",
  },
  {
    question: "Can I visit without an appointment?",
    answer:
      "Parents may visit the centre, but scheduling in advance is recommended so that a team member is available to guide you properly without disturbing classroom routines.",
  },
  {
    question: "Is a three-day trial available?",
    answer:
      "Yes. A three-day trial is available to help children become familiar with the teachers, classroom environment and daily routine before regular admission.",
  },
  {
    question: "Does the centre provide daycare?",
    answer:
      "Yes. Daycare is available from 12:30 PM until 7:00 PM. Parents can discuss hourly and extended daycare requirements with the centre team.",
  },
  {
    question: "Is transport available?",
    answer:
      "Cab transport is available on selected routes. Availability depends on the pickup location and the centre’s current transport route.",
  },
];

export default function ContactPage() {
  return (
    <PageShell>
      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_52%,#fff7d7_100%)] pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />

          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              <span className="eyebrow">Contact Kidzee Sector 12, Dwarka</span>

              <h1 className="title mt-5">
                Plan a school visit and speak directly with our centre team.
              </h1>

              <p className="lead mx-auto mt-6 max-w-3xl">
                Ask us about preschool admissions, daycare, trial classes,
                transport, programme timings and current seat availability.
              </p>

              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a
                  href={`https://wa.me/91${site.phone.replace(/\D/g, "").slice(-10)}?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20book%20a%20school%20visit.`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-purple-700/20 transition hover:-translate-y-0.5 hover:bg-purple-800"
                >
                  <MessageCircle size={18} />
                  Enquire on WhatsApp
                </a>

                <a
                  href={`tel:${site.phone}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:border-purple-300 hover:bg-purple-50"
                >
                  <Phone size={18} />
                  Call {site.phoneDisplay}
                </a>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {[
                  "School visits available",
                  "3-day trial",
                  "Daycare till 7 PM",
                  "Transport on selected routes",
                ].map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/90 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm"
                  >
                    <CheckCircle2
                      size={15}
                      className="text-purple-700"
                    />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact Details and Form */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <span className="eyebrow">Centre information</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  Everything you need before visiting us.
                </h2>

                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                  Contact our team before your visit so we can understand your
                  child’s age and arrange time to explain the programmes
                  properly.
                </p>

                <div className="mt-8 grid gap-5">
                  <div className="rounded-[28px] border border-purple-100 bg-[#fbf9ff] p-6">
                    <div className="flex gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                        <MapPin size={23} />
                      </span>

                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.12em] text-purple-700">
                          Address
                        </p>
                        <p className="mt-2 text-base leading-7 text-slate-700">
                          {site.address}
                        </p>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`tel:${site.phone}`}
                    className="group rounded-[28px] border border-purple-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-950/5"
                  >
                    <div className="flex gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-700 group-hover:text-white">
                        <Phone size={22} />
                      </span>

                      <div>
                        <p className="text-sm font-black uppercase tracking-[0.12em] text-purple-700">
                          Phone and WhatsApp
                        </p>
                        <p className="mt-2 text-lg font-black text-slate-950">
                          {site.phoneDisplay}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Call for admissions, daycare and school visits
                        </p>
                      </div>
                    </div>
                  </a>

                  <a
                    href={`mailto:${site.email}`}
                    className="group rounded-[28px] border border-purple-100 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-purple-950/5"
                  >
                    <div className="flex gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-700 group-hover:text-white">
                        <Mail size={22} />
                      </span>

                      <div className="min-w-0">
                        <p className="text-sm font-black uppercase tracking-[0.12em] text-purple-700">
                          Email
                        </p>
                        <p className="mt-2 break-all text-base font-black text-slate-950">
                          {site.email}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Send us your enquiry at any time
                        </p>
                      </div>
                    </div>
                  </a>

                  <div className="rounded-[28px] border border-yellow-200 bg-[#fff9e7] p-6">
                    <div className="flex gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-purple-950">
                        <Clock3 size={22} />
                      </span>

                      <div className="w-full">
                        <p className="text-sm font-black uppercase tracking-[0.12em] text-purple-800">
                          Centre timings
                        </p>

                        <div className="mt-4 space-y-3 text-sm">
                          <div className="flex items-start justify-between gap-4 border-b border-yellow-200 pb-3">
                            <span className="text-slate-600">Preschool</span>
                            <span className="text-right font-black text-slate-950">
                              8:30 AM–1:00 PM
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4 border-b border-yellow-200 pb-3">
                            <span className="text-slate-600">Daycare</span>
                            <span className="text-right font-black text-slate-950">
                              12:30 PM–7:00 PM
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-4">
                            <span className="text-slate-600">
                              School visits
                            </span>
                            <span className="text-right font-black text-slate-950">
                              By appointment
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <a
                  href={site.map}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:border-purple-300 hover:bg-purple-50 sm:w-auto"
                >
                  <MapPin size={18} />
                  Open in Google Maps
                </a>
              </div>

              <div className="rounded-[36px] border border-purple-100 bg-[linear-gradient(145deg,#ffffff_0%,#faf7ff_100%)] p-5 shadow-xl shadow-purple-950/5 sm:p-8">
                <div className="mb-7">
                  <span className="eyebrow">Send an enquiry</span>

                  <h2 className="mt-4 text-3xl font-black text-slate-950">
                    Tell us how we can help.
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Share your child’s age and requirement. Our centre team will
                    contact you to discuss the suitable programme and next
                    steps.
                  </p>
                </div>

                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* Enquiry Topics */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">How we can help</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Speak with us about the support your family needs.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                Our team can help you compare programmes and understand the
                practical details before you make an admission decision.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {enquiryTopics.map((topic) => {
                const Icon = topic.icon;

                return (
                  <article
                    key={topic.title}
                    className="rounded-[30px] border border-purple-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/5"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                      <Icon size={26} strokeWidth={1.8} />
                    </span>

                    <h3 className="mt-6 text-xl font-black text-slate-950">
                      {topic.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {topic.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Visit Section */}
        <section className="section bg-purple-950 text-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.95fr] lg:gap-16">
              <div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                  Your school visit
                </span>

                <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  See the centre personally before deciding.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
                  A school visit gives you a clearer understanding of the
                  classrooms, routines, teachers, play spaces and everyday care
                  your child will experience.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {visitChecklist.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4"
                    >
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-yellow-300"
                      />
                      <span className="text-sm font-bold text-white">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={`https://wa.me/91${site.phone.replace(/\D/g, "").slice(-10)}?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20schedule%20a%20school%20visit.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yellow-300 px-7 py-3.5 text-sm font-black text-purple-950 transition hover:-translate-y-0.5 hover:bg-yellow-200"
                  >
                    Schedule on WhatsApp
                    <ArrowRight size={17} />
                  </a>

                  <Link
                    href="/admissions"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    View Admission Process
                  </Link>
                </div>
              </div>

              <div className="rounded-[36px] border border-white/15 bg-white/10 p-7 backdrop-blur sm:p-9">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-purple-950">
                  <ShieldCheck size={28} />
                </div>

                <h3 className="mt-6 text-2xl font-black">
                  A relaxed, no-pressure visit
                </h3>

                <p className="mt-4 text-sm leading-7 text-purple-100 sm:text-base">
                  The purpose of the visit is to help you understand the centre
                  clearly. You can ask about classroom routines, safety,
                  teacher-child ratios, meals, daycare, transport and the
                  settling process.
                </p>

                <div className="mt-7 rounded-[24px] border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-black text-yellow-300">
                    Three-day trial available
                  </p>

                  <p className="mt-2 text-sm leading-7 text-purple-100">
                    After your visit, you may book a three-day trial so your
                    child can experience the classroom and teachers before
                    regular enrolment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Map */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
              <div>
                <span className="eyebrow">Find us in Dwarka</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  Conveniently located in Sector 12B, Dwarka.
                </h2>

                <p className="mt-5 text-base leading-8 text-slate-600">
                  Our preschool and daycare centre is located at Building No.
                  19, Block B, Sector 12B, Dwarka, Delhi.
                </p>

                <p className="mt-4 text-base leading-8 text-slate-600">
                  Use the map for directions or contact the centre if you need
                  help finding the exact building.
                </p>

                <a
                  href={site.map}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white transition hover:bg-purple-800"
                >
                  Get Directions
                  <ArrowRight size={17} />
                </a>
              </div>

              <div className="overflow-hidden rounded-[36px] border-8 border-white bg-slate-100 shadow-xl shadow-purple-950/10">
                <iframe
                  title="Kidzee Sector 12 Dwarka location"
                  src={site.mapEmbed}
                  width="100%"
                  height="480"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="block w-full border-0"
                />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Contact questions</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Useful information before contacting or visiting us.
              </h2>
            </div>

            <div className="mx-auto mt-12 max-w-4xl space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-[24px] border border-purple-100 bg-white p-6 shadow-sm open:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5">
                    <h3 className="text-left text-base font-black text-slate-950 sm:text-lg">
                      {faq.question}
                    </h3>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xl font-black text-purple-800 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-4 border-t border-purple-100 pt-4 text-sm leading-7 text-slate-600 sm:text-base">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <CTA />
      </main>
    </PageShell>
  );
}