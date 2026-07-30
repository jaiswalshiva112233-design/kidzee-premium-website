import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import ContactForm from "@/components/ContactForm";
import { CTA } from "@/components/HomeSections";

export const metadata: Metadata = {
  title: "Preschool Admissions in Sector 12 Dwarka",
  description:
    "Enquire about preschool and daycare admissions at Kidzee Sector 12, Dwarka. Book a school visit, explore programmes and register for a 3-day trial class.",
  keywords: [
    "preschool admissions in Dwarka",
    "Kidzee admission Dwarka",
    "preschool admission Sector 12 Dwarka",
    "daycare admission Dwarka",
    "nursery admission Dwarka",
    "playgroup admission Dwarka",
    "3 day preschool trial Dwarka",
  ],
  alternates: {
    canonical: "/admissions",
  },
  openGraph: {
    title: "Admissions at Kidzee Sector 12, Dwarka",
    description:
      "Book a school visit, discuss the right programme and enquire about preschool or daycare admission at Kidzee Sector 12, Dwarka.",
    url: "/admissions",
    type: "website",
    images: [
      {
        url: "/images/admissions-main.jpg",
        width: 1200,
        height: 630,
        alt: "Preschool admissions at Kidzee Sector 12 Dwarka",
      },
    ],
  },
};

const admissionSteps = [
  {
    number: "01",
    title: "Share your child’s details",
    description:
      "Call, WhatsApp or complete the enquiry form with your child’s age, preferred programme and contact information.",
  },
  {
    number: "02",
    title: "Visit the centre",
    description:
      "Meet our team, explore the classrooms and activity areas, and understand the daily routine before making a decision.",
  },
  {
    number: "03",
    title: "Choose the right programme",
    description:
      "We will guide you according to your child’s age, school-readiness needs, daycare requirement and preferred schedule.",
  },
  {
    number: "04",
    title: "Experience a trial",
    description:
      "Parents may choose the three-day trial programme to help their child become familiar with the teachers and classroom environment.",
  },
  {
    number: "05",
    title: "Complete enrolment",
    description:
      "Submit the admission form, required documents and applicable fee to confirm the child’s seat.",
  },
];

const programmes = [
  {
    title: "Playgroup",
    age: "2–3 years",
    description:
      "A gentle introduction to school routines, language, movement, play and social interaction.",
    href: "/programmes/playgroup",
  },
  {
    title: "Nursery",
    age: "3–4 years",
    description:
      "Early language, numeracy, creativity, confidence and classroom independence through meaningful activities.",
    href: "/programmes/nursery",
  },
  {
    title: "Junior KG",
    age: "4–5 years",
    description:
      "Structured school-readiness experiences that strengthen communication, phonics, numeracy and participation.",
    href: "/programmes/junior-kg",
  },
  {
    title: "Senior KG",
    age: "5–6 years",
    description:
      "A stronger academic and developmental foundation for a confident transition to formal school.",
    href: "/programmes/senior-kg",
  },
];

const documents = [
  "Child’s birth certificate",
  "Child’s Aadhaar card",
  "Parent or guardian Aadhaar cards",
  "Recent passport-size photographs",
  "Vaccination or immunisation record",
  "Current residential address proof",
];

const parentChecklist = [
  {
    title: "Your child’s age",
    description:
      "Programme recommendations are based on the approved age range for each class.",
  },
  {
    title: "Preferred schedule",
    description:
      "Tell us whether you need preschool only, daycare only or both services together.",
  },
  {
    title: "Transport requirement",
    description:
      "Share your location so the centre can confirm whether cab service is available for your route.",
  },
  {
    title: "Any support needs",
    description:
      "Let us know about allergies, food preferences, medical considerations or settling concerns.",
  },
];

const faqs = [
  {
    question: "Which age groups can apply for admission?",
    answer:
      "Admissions are available for Playgroup for children aged 2–3 years, Nursery for 3–4 years, Junior KG for 4–5 years and Senior KG for 5–6 years.",
  },
  {
    question: "Is a school visit required before admission?",
    answer:
      "A school visit is strongly recommended. It allows parents to see the learning environment, meet the centre team and discuss the child’s routine, programme and care requirements.",
  },
  {
    question: "Is a trial class available?",
    answer:
      "Yes. A three-day trial programme is available to help children experience the classroom, teachers and routine before regular admission.",
  },
  {
    question: "Does Kidzee Sector 12 provide daycare?",
    answer:
      "Yes. Daycare is available until 7:00 PM. Families may enquire about hourly daycare and the six-hour daycare plan.",
  },
  {
    question: "Are meals included?",
    answer:
      "Meals are included in the preschool monthly fee. Daycare meal options can be discussed separately with the centre team.",
  },
  {
    question: "Is transport available?",
    answer:
      "Cab transport is available on selected routes. Availability depends on the child’s pickup location and the current transport route.",
  },
  {
    question: "How can parents confirm a seat?",
    answer:
      "A seat is confirmed after completion of the admission form, submission of the required documents and payment of the applicable admission fee.",
  },
];

export default function AdmissionsPage() {
  return (
    <PageShell>
      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative bg-[linear-gradient(135deg,#fbf8ff_0%,#ffffff_52%,#fff7d7_100%)] pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />

          <div className="container relative">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div>
                <span className="eyebrow">Admissions open</span>

                <h1 className="title mt-5 max-w-4xl">
                  Begin with a relaxed conversation and a personal school visit.
                </h1>

                <p className="lead mt-6 max-w-2xl">
                  Tell us your child’s age and the support your family needs.
                  Our team will guide you through the suitable programme,
                  timings, daycare, transport, fees and the three-day trial
                  process.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20enquire%20about%20admission%20for%20my%20child."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-purple-700/20 transition hover:-translate-y-0.5 hover:bg-purple-800"
                  >
                    Enquire on WhatsApp
                  </a>

                  <a
                    href="tel:+919667038673"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    Call +91 96670 38673
                  </a>
                </div>

                <div className="mt-9 flex flex-wrap gap-3">
                  {[
                    "3-day trial available",
                    "Meals included",
                    "Daycare till 7 PM",
                    "Transport available",
                  ].map((item) => (
                    <span
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/85 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm"
                    >
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-300 text-[10px] font-black text-purple-950">
                        ✓
                      </span>
                      {item}
                    </span>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 -top-6 h-24 w-24 rounded-[30px] bg-yellow-300/60" />
                <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-purple-300/30" />

                <div className="relative overflow-hidden rounded-[38px] border-8 border-white bg-white shadow-2xl shadow-purple-950/10">
                  <Image
                    src="/images/admissions-main.jpg"
                    alt="Parents visiting Kidzee Preschool Sector 12 Dwarka for admission"
                    width={900}
                    height={760}
                    priority
                    className="h-[430px] w-full object-cover sm:h-[540px]"
                  />

                  <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/50 bg-white/90 p-5 shadow-xl backdrop-blur">
                    <p className="text-sm font-black text-purple-800">
                      Visit before you decide
                    </p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Explore the centre, meet the teachers and understand the
                      routine before completing admission.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form and Journey */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <div>
                <span className="eyebrow">Simple admission process</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  A clear, parent-friendly admission journey.
                </h2>

                <p className="mt-5 max-w-xl text-base leading-8 text-slate-600">
                  Our team takes time to understand the child and answer the
                  family’s questions before recommending a programme.
                </p>

                <ol className="mt-9 grid gap-5">
                  {admissionSteps.map((step) => (
                    <li
                      key={step.number}
                      className="rounded-[26px] border border-purple-100 bg-[#fbf9ff] p-5"
                    >
                      <div className="flex gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-700 text-sm font-black text-white">
                          {step.number}
                        </span>

                        <div>
                          <h3 className="text-lg font-black text-slate-950">
                            {step.title}
                          </h3>
                          <p className="mt-2 text-sm leading-7 text-slate-600">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-[36px] border border-purple-100 bg-[linear-gradient(145deg,#ffffff_0%,#faf7ff_100%)] p-5 shadow-xl shadow-purple-950/5 sm:p-8">
                <div className="mb-7">
                  <span className="eyebrow">Admission enquiry</span>
                  <h2 className="mt-4 text-3xl font-black text-slate-950">
                    Tell us about your child.
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    Complete the form and our centre team will contact you to
                    discuss the programme, visit and next steps.
                  </p>
                </div>

                <ContactForm />
              </div>
            </div>
          </div>
        </section>

        {/* Programmes */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Choose by age group</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Preschool programmes for every stage of early learning.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                Each programme is planned around the child’s age, developmental
                needs and readiness for the next stage of schooling.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {programmes.map((programme, index) => (
                <article
                  key={programme.title}
                  className="flex h-full flex-col rounded-[30px] border border-purple-100 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-yellow-300 text-sm font-black text-purple-950">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span className="rounded-full bg-purple-100 px-3 py-1.5 text-xs font-black text-purple-800">
                      {programme.age}
                    </span>
                  </div>

                  <h3 className="mt-6 text-2xl font-black text-slate-950">
                    {programme.title}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                    {programme.description}
                  </p>

                  <Link
                    href={programme.href}
                    className="mt-6 inline-flex items-center text-sm font-black text-purple-700 transition hover:text-purple-900"
                  >
                    Explore {programme.title}
                    <span className="ml-2" aria-hidden="true">
                      →
                    </span>
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Trial */}
        <section className="section bg-purple-950 text-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              <div className="relative">
                <Image
                  src="/images/admissions-trial.jpg"
                  alt="Child attending a trial class at Kidzee Dwarka"
                  width={850}
                  height={760}
                  className="h-[480px] w-full rounded-[38px] object-cover"
                />

                <div className="absolute -bottom-6 left-5 right-5 rounded-[26px] bg-yellow-300 p-6 text-purple-950 shadow-xl sm:left-8 sm:right-8">
                  <p className="text-3xl font-black">3-day trial</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-purple-950/75">
                    A comfortable way to experience the centre before regular
                    enrolment.
                  </p>
                </div>
              </div>

              <div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                  Trial classes
                </span>

                <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  Give your child time to become familiar with the new
                  environment.
                </h2>

                <p className="mt-6 text-base leading-8 text-purple-100 sm:text-lg">
                  Some children settle immediately, while others need a little
                  more time. Our three-day trial allows children to experience
                  the classroom routine, interact with teachers and participate
                  in age-appropriate activities.
                </p>

                <p className="mt-5 text-base leading-8 text-purple-100 sm:text-lg">
                  The trial also helps parents observe whether the child feels
                  comfortable and whether the programme matches the family’s
                  expectations.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    "Meet the teachers",
                    "Experience classroom activities",
                    "Understand the daily routine",
                    "Observe the settling process",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-xs font-black text-purple-950">
                        ✓
                      </span>
                      <p className="text-sm font-bold text-white">{item}</p>
                    </div>
                  ))}
                </div>

                <a
                  href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20book%20a%203-day%20trial%20class%20for%20my%20child."
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full bg-yellow-300 px-7 py-3.5 text-sm font-black text-purple-950 transition hover:-translate-y-0.5 hover:bg-yellow-200"
                >
                  Book a 3-Day Trial
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Parent Checklist */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <span className="eyebrow">Before your school visit</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  A few details help us guide you more accurately.
                </h2>

                <p className="mt-5 text-base leading-8 text-slate-600">
                  You do not need to prepare anything complicated. Sharing a few
                  practical details helps the team understand which programme
                  and schedule may work best for your family.
                </p>

                <div className="mt-8 grid gap-4">
                  {parentChecklist.map((item, index) => (
                    <div
                      key={item.title}
                      className="flex gap-4 rounded-[24px] border border-slate-100 bg-slate-50 p-5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-700 text-sm font-black text-white">
                        {index + 1}
                      </span>

                      <div>
                        <h3 className="font-black text-slate-950">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-slate-600">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[34px] bg-[#fff9e7] p-7 sm:p-9">
                <span className="eyebrow">Documents usually required</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950">
                  Keep these documents ready for enrolment.
                </h2>

                <p className="mt-4 text-sm leading-7 text-slate-600">
                  The centre team will confirm the final document list during
                  the admission discussion. Clear photocopies may be requested.
                </p>

                <ul className="mt-8 grid gap-4">
                  {documents.map((document) => (
                    <li
                      key={document}
                      className="flex items-center gap-4 rounded-2xl bg-white px-5 py-4 shadow-sm"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-sm font-black text-purple-950">
                        ✓
                      </span>

                      <span className="text-sm font-bold text-slate-700">
                        {document}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 rounded-[24px] bg-purple-950 p-5 text-white">
                  <p className="font-black">Please note</p>
                  <p className="mt-2 text-sm leading-7 text-purple-100">
                    Seat availability can vary by programme. Admission is
                    confirmed only after the enrolment process and applicable
                    payment are completed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Centre Information */}
        <section className="section bg-[#f8f4ff]">
          <div className="container">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div>
                <span className="eyebrow">Visit Kidzee Sector 12, Dwarka</span>

                <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  See the classrooms, meet the team and ask every question that
                  matters to you.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                  A personal visit is the best way to understand the learning
                  environment and decide whether the centre feels right for your
                  child.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white transition hover:bg-purple-800"
                  >
                    Book a School Visit
                  </Link>

                  <a
                    href="tel:+919667038673"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:bg-purple-50"
                  >
                    Speak to the Centre Team
                  </a>
                </div>
              </div>

              <div className="rounded-[34px] bg-purple-950 p-7 text-white shadow-xl sm:p-9">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                  Centre details
                </p>

                <div className="mt-7 space-y-6">
                  <div>
                    <p className="text-sm font-bold text-purple-200">Address</p>
                    <p className="mt-2 leading-7">
                      Building No. 19, Block B, Sector 12B, Dwarka, Delhi
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <p className="text-sm font-bold text-purple-200">
                      Preschool programmes
                    </p>
                    <p className="mt-2 leading-7">
                      Playgroup, Nursery, Junior KG and Senior KG
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <p className="text-sm font-bold text-purple-200">
                      Daycare timing
                    </p>
                    <p className="mt-2 leading-7">Available until 7:00 PM</p>
                  </div>

                  <div className="border-t border-white/10 pt-6">
                    <p className="text-sm font-bold text-purple-200">
                      Contact
                    </p>
                    <a
                      href="tel:+919667038673"
                      className="mt-2 inline-block font-black text-white hover:text-yellow-300"
                    >
                      +91 96670 38673
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section bg-white">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Admission questions</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Information parents commonly ask before enrolling.
              </h2>
            </div>

            <div className="mx-auto mt-12 max-w-4xl space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-[24px] border border-purple-100 bg-[#fcfbff] p-6 shadow-sm open:bg-white open:shadow-md"
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