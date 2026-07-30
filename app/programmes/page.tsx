import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import CTA from "@/components/CTA";
import { programmes } from "@/lib/site";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MessageCircle,
  Music2,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Speech,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Preschool Programmes in Sector 12 Dwarka",
  description:
    "Explore Playgroup, Nursery, Junior KG and Senior KG programmes at Kidzee Sector 12, Dwarka, with age-appropriate learning, meals, small-group attention and a 3-day trial.",
  keywords: [
    "preschool programmes in Dwarka",
    "Playgroup in Sector 12 Dwarka",
    "Nursery in Sector 12 Dwarka",
    "Junior KG in Dwarka",
    "Senior KG in Dwarka",
    "Kidzee Sector 12 programmes",
    "preschool curriculum Dwarka",
    "preschool with meals Dwarka",
  ],
  alternates: {
    canonical: "/programmes",
  },
  openGraph: {
    title: "Preschool Programmes | Kidzee Sector 12, Dwarka",
    description:
      "Explore age-appropriate programmes for children from 2 to 6 years at Kidzee Sector 12, Dwarka.",
    url: "/programmes",
    type: "website",
    images: [
      {
        url: "/images/programmes/programmes-main.jpg",
        width: 1200,
        height: 630,
        alt: "Preschool programmes at Kidzee Sector 12 Dwarka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Preschool Programmes | Kidzee Sector 12, Dwarka",
    description:
      "Playgroup, Nursery, Junior KG and Senior KG programmes for children aged 2 to 6 years.",
    images: ["/images/programmes/programmes-main.jpg"],
  },
};

const programmeDetails: Record<
  string,
  {
    eyebrow: string;
    summary: string;
    highlights: string[];
    icon: typeof Sparkles;
  }
> = {
  playgroup: {
    eyebrow: "A gentle beginning",
    summary:
      "A warm first step into preschool where children learn to settle, communicate, explore and participate through play-based experiences.",
    highlights: [
      "Language and communication",
      "Sensory exploration",
      "Social confidence",
      "Simple classroom routines",
    ],
    icon: Sparkles,
  },
  nursery: {
    eyebrow: "Building strong foundations",
    summary:
      "A lively programme that introduces early literacy, numeracy, creativity and independence through purposeful play and conversation.",
    highlights: [
      "Early literacy readiness",
      "Number and concept awareness",
      "Fine-motor development",
      "Confidence in group participation",
    ],
    icon: Palette,
  },
  "junior-kg": {
    eyebrow: "Growing school readiness",
    summary:
      "A balanced programme that strengthens phonics, early writing, number concepts, reasoning and independent classroom habits.",
    highlights: [
      "Phonics and vocabulary",
      "Writing readiness",
      "Numeracy and reasoning",
      "Communication and confidence",
    ],
    icon: BookOpen,
  },
  "senior-kg": {
    eyebrow: "Preparing for formal school",
    summary:
      "A comprehensive school-readiness programme that develops reading, writing, mathematics, thinking and responsible learning habits.",
    highlights: [
      "Reading and comprehension",
      "Sentence formation",
      "Mathematical fluency",
      "Independent learning habits",
    ],
    icon: Brain,
  },
};

const developmentAreas = [
  {
    icon: Speech,
    title: "Language and communication",
    description:
      "Stories, conversation, songs, phonics and group interaction help children express themselves with growing confidence.",
  },
  {
    icon: Brain,
    title: "Thinking and numeracy",
    description:
      "Sorting, matching, counting, patterns and age-appropriate reasoning build early mathematical understanding.",
  },
  {
    icon: Palette,
    title: "Creativity and imagination",
    description:
      "Art, craft, music, pretend play and open-ended activities give children space to explore their own ideas.",
  },
  {
    icon: Users,
    title: "Social development",
    description:
      "Children learn to participate, share, take turns, listen and form positive relationships with teachers and peers.",
  },
  {
    icon: HeartHandshake,
    title: "Confidence and independence",
    description:
      "Daily routines help children manage simple tasks, communicate needs and become more comfortable in the classroom.",
  },
  {
    icon: Music2,
    title: "Movement and coordination",
    description:
      "Dance, active play, yoga, taekwondo and fine-motor work support physical confidence and coordination.",
  },
];

const programmeBenefits = [
  "Age-appropriate learning for every stage",
  "Meals included in preschool fees",
  "3-day trial available",
  "Teacher-child ratio of 1:8 for Playgroup and Nursery",
  "Teacher-child ratio of 1:10 for Junior KG and Senior KG",
  "Creative, physical and social development",
  "Regular parent-teacher communication",
  "Daycare available until 7:00 PM",
];

const programmeFaqs = [
  {
    question: "Which preschool programmes are available?",
    answer:
      "Kidzee Sector 12, Dwarka offers Playgroup, Nursery, Junior KG and Senior KG programmes for children between 2 and 6 years of age.",
  },
  {
    question: "What are the age groups for each programme?",
    answer:
      "Playgroup is for 2–3 years, Nursery for 3–4 years, Junior KG for 4–5 years and Senior KG for 5–6 years.",
  },
  {
    question: "How do I know which programme is right for my child?",
    answer:
      "The programme is usually selected according to the child’s age, previous school experience and overall readiness. Parents can discuss this with the centre team during a school visit.",
  },
  {
    question: "Is a trial class available?",
    answer:
      "Yes. A three-day trial is available, with approximately two hours of classroom experience each day, subject to current availability.",
  },
  {
    question: "Are meals included?",
    answer:
      "Yes. Preschool meals are included in the monthly preschool fee.",
  },
  {
    question: "What is the teacher-child ratio?",
    answer:
      "Playgroup and Nursery follow a teacher-child ratio of approximately 1:8. Junior KG and Senior KG follow a ratio of approximately 1:10.",
  },
  {
    question: "Does the school offer daycare after preschool?",
    answer:
      "Yes. Daycare is available from 12:30 PM until 7:00 PM, with flexible plans, rest, play, activities and homework support where applicable.",
  },
  {
    question: "Is transport available?",
    answer:
      "Pickup and drop transport is available on selected routes, subject to route confirmation and seat availability.",
  },
];

export default function ProgrammesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Preschool Programmes at Kidzee Sector 12 Dwarka",
    itemListElement: programmes.map((programme, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: programme.title,
      url: `/programmes/${programme.slug}`,
    })),
  };

  return (
    <PageShell>
      <main className="overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        {/* Hero */}
        <section className="relative bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_54%,#fff7d7_100%)] pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />

          <div className="container relative">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div>
                <span className="eyebrow">Playgroup to Senior KG</span>

                <h1 className="title mt-5">
                  Preschool programmes designed around how young children grow.
                </h1>

                <p className="lead mt-6 max-w-2xl">
                  Age-appropriate learning for children from 2 to 6 years, with
                  a thoughtful balance of language, numeracy, creativity,
                  movement, social development and independent thinking.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/admissions"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-purple-700/20 transition hover:-translate-y-0.5 hover:bg-purple-800"
                  >
                    Explore Admissions
                    <ArrowRight size={17} />
                  </Link>

                  <a
                    href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20help%20choosing%20the%20right%20preschool%20programme%20for%20my%20child."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    <MessageCircle size={18} />
                    Ask About Programmes
                  </a>
                </div>

                <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
                  {[
                    "Ages 2 to 6 years",
                    "Meals included",
                    "3-day trial available",
                    "Daycare until 7 PM",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-white/90 px-4 py-3 shadow-sm"
                    >
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-purple-700"
                      />

                      <span className="text-sm font-bold text-slate-700">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 -top-6 h-24 w-24 rounded-[30px] bg-yellow-300/60" />
                <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-purple-300/30" />

                <div className="relative overflow-hidden rounded-[38px] border-8 border-white bg-white shadow-2xl shadow-purple-950/10">
                  <Image
                    src="/images/programmes/programmes-main.jpg"
                    alt="Children participating in a preschool programme at Kidzee Sector 12 Dwarka"
                    width={900}
                    height={760}
                    priority
                    className="h-[470px] w-full object-cover sm:h-[570px]"
                  />

                  <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/60 bg-white/90 p-5 shadow-xl backdrop-blur">
                    <p className="text-sm font-black text-purple-800">
                      One learning journey, four age-appropriate stages
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Each programme builds on the child’s growing confidence,
                      communication, understanding and independence.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Programme Facts */}
        <section className="relative z-10 -mt-3 bg-white pb-8 sm:-mt-5">
          <div className="container">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Clock3,
                  title: "8:30 AM–1:00 PM",
                  description: "Preschool programme timing",
                },
                {
                  icon: Users,
                  title: "Focused ratios",
                  description: "1:8 and 1:10 by age group",
                },
                {
                  icon: ShieldCheck,
                  title: "Supervised environment",
                  description: "Child-friendly learning spaces",
                },
                {
                  icon: Sparkles,
                  title: "3-day trial",
                  description: "Experience the classroom first",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-lg shadow-purple-950/5"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                      <Icon size={23} />
                    </span>

                    <h2 className="mt-5 text-lg font-black text-slate-950">
                      {item.title}
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Programme Cards */}
        <section className="section bg-white">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Our preschool programmes</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                The right level of support at every stage.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                Children do not learn in exactly the same way at every age.
                Each programme is designed around the abilities, interests and
                developmental needs of that stage.
              </p>
            </div>

            <div className="mt-12 grid gap-7 lg:grid-cols-2">
              {programmes.map((programme, index) => {
                const detail = programmeDetails[programme.slug];
                const Icon = detail?.icon ?? Sparkles;

                return (
                  <article
                    key={programme.slug}
                    className="group overflow-hidden rounded-[34px] border border-purple-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-950/8"
                  >
                    <div className="relative overflow-hidden">
                      <Image
                        src={programme.image}
                        alt={`${programme.title} programme at Kidzee Sector 12 Dwarka`}
                        width={900}
                        height={650}
                        className="h-[310px] w-full object-cover transition duration-700 group-hover:scale-[1.04] sm:h-[360px]"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-purple-800 backdrop-blur">
                        <Icon size={15} />
                        {programme.age}
                      </div>

                      <div className="absolute bottom-5 left-5 right-5">
                        <p className="text-xs font-black uppercase tracking-[0.15em] text-yellow-300">
                          {detail?.eyebrow}
                        </p>

                        <h3 className="mt-2 text-3xl font-black text-white">
                          {programme.title}
                        </h3>
                      </div>
                    </div>

                    <div className="p-7 sm:p-8">
                      <p className="text-base leading-8 text-slate-600">
                        {detail?.summary ?? programme.intro}
                      </p>

                      <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {detail?.highlights.map((highlight) => (
                          <div
                            key={highlight}
                            className="flex items-center gap-3 rounded-2xl bg-[#faf8ff] px-4 py-3"
                          >
                            <CheckCircle2
                              size={17}
                              className="shrink-0 text-purple-700"
                            />

                            <span className="text-sm font-bold text-slate-700">
                              {highlight}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-7 flex flex-col gap-3 border-t border-purple-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-purple-700">
                            Programme timing
                          </p>

                          <p className="mt-1 text-sm font-bold text-slate-700">
                            {programme.time}
                          </p>
                        </div>

                        <Link
                          href={`/programmes/${programme.slug}`}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-purple-700 px-6 py-3 text-sm font-black text-white transition hover:bg-purple-800"
                        >
                          Explore {programme.title}
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Learning Approach */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <span className="eyebrow">How children learn</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Learning that feels meaningful, active and enjoyable.
                </h2>

                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                  Young children understand ideas best when they can see,
                  touch, discuss, move, create and participate. Our programmes
                  combine guided teaching with hands-on experiences and
                  purposeful play.
                </p>

                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                  Academic readiness is developed gradually without ignoring
                  communication, confidence, creativity, physical development
                  and emotional comfort.
                </p>

                <div className="mt-8 rounded-[28px] border border-yellow-200 bg-[#fff9e7] p-6">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-purple-800">
                    No one-size-fits-all pressure
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
                    Teachers observe how each child responds and provide
                    guidance according to age, confidence, previous experience
                    and learning readiness.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {developmentAreas.map((area) => {
                  const Icon = area.icon;

                  return (
                    <article
                      key={area.title}
                      className="rounded-[30px] border border-purple-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/5"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                        <Icon size={26} strokeWidth={1.8} />
                      </span>

                      <h3 className="mt-6 text-xl font-black text-slate-950">
                        {area.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {area.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Programme Progression */}
        <section className="section bg-white">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">A connected learning journey</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Each year builds naturally on the previous one.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                The programmes become gradually more structured as children
                grow, while play, creativity and participation remain central
                throughout the preschool years.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-5xl">
              {programmes.map((programme, index) => (
                <div
                  key={programme.slug}
                  className="relative grid gap-5 pb-8 last:pb-0 sm:grid-cols-[72px_1fr]"
                >
                  {index !== programmes.length - 1 && (
                    <span className="absolute left-9 top-16 hidden h-[calc(100%-1rem)] w-px bg-purple-200 sm:block" />
                  )}

                  <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-[22px] bg-purple-700 text-xl font-black text-white shadow-lg shadow-purple-700/15">
                    {index + 1}
                  </span>

                  <article className="rounded-[30px] border border-purple-100 bg-[#faf8ff] p-6 sm:p-7">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <span className="text-xs font-black uppercase tracking-[0.14em] text-purple-700">
                          {programme.age}
                        </span>

                        <h3 className="mt-2 text-2xl font-black text-slate-950">
                          {programme.title}
                        </h3>
                      </div>

                      <Link
                        href={`/programmes/${programme.slug}`}
                        className="inline-flex w-fit items-center gap-2 text-sm font-black text-purple-700 transition hover:text-purple-900"
                      >
                        View programme
                        <ArrowRight size={16} />
                      </Link>
                    </div>

                    <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                      {programme.intro}
                    </p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Programme Benefits */}
        <section className="section bg-purple-950 text-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
              <div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                  What families can expect
                </span>

                <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  More than classroom learning.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
                  Each programme supports the child’s whole development,
                  including confidence, communication, independence, movement
                  and the ability to participate positively with others.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {programmeBenefits.map((benefit) => (
                    <div
                      key={benefit}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4"
                    >
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-yellow-300"
                      />

                      <span className="text-sm font-bold text-white">
                        {benefit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[36px] border border-white/15 bg-white/10 p-7 backdrop-blur sm:p-9">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-purple-950">
                  <HeartHandshake size={28} />
                </span>

                <h3 className="mt-6 text-2xl font-black">
                  Parents remain part of the learning journey.
                </h3>

                <p className="mt-4 text-sm leading-7 text-purple-100 sm:text-base">
                  Teachers and parents can discuss the child’s settling,
                  participation, communication, classroom habits and areas that
                  may need support.
                </p>

                <div className="mt-7 rounded-[24px] border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-black text-yellow-300">
                    Progress without unnecessary comparison
                  </p>

                  <p className="mt-2 text-sm leading-7 text-purple-100">
                    Children develop at different speeds. Progress is understood
                    through consistent observation and individual growth rather
                    than comparison with other children.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trial Section */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="relative overflow-hidden rounded-[36px]">
                <Image
                  src="/images/programmes/programme-trial.jpg"
                  alt="Three-day preschool trial at Kidzee Sector 12 Dwarka"
                  width={900}
                  height={700}
                  className="h-[430px] w-full object-cover sm:h-[520px]"
                />

                <div className="absolute inset-x-5 bottom-5 rounded-[24px] bg-white/90 p-5 shadow-xl backdrop-blur">
                  <p className="text-sm font-black text-purple-800">
                    Three-day preschool trial
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Let your child experience the classroom, teachers and daily
                    routine before regular admission.
                  </p>
                </div>
              </div>

              <div>
                <span className="eyebrow">Experience before deciding</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  See how your child responds to the environment.
                </h2>

                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                  Choosing a preschool is easier when parents can see the
                  classroom atmosphere and observe how the child responds to
                  teachers, routines and other children.
                </p>

                <ul className="mt-7 grid gap-4">
                  {[
                    "Three trial days",
                    "Approximately two hours per day",
                    "Experience the regular classroom",
                    "Meet teachers and understand the routine",
                    "Observe the child’s comfort and participation",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-[#faf8ff] px-5 py-4"
                    >
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-purple-700"
                      />

                      <span className="text-sm font-bold text-slate-700">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20book%20a%203-day%20preschool%20trial%20for%20my%20child."
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white transition hover:bg-purple-800"
                >
                  Book a 3-Day Trial
                  <ArrowRight size={17} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Programme questions</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Helpful information for parents.
              </h2>
            </div>

            <div className="mx-auto mt-12 max-w-4xl space-y-4">
              {programmeFaqs.map((faq) => (
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

        {/* Final CTA */}
        <section className="section bg-white">
          <div className="container">
            <div className="overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#5b2a86_0%,#3b145f_100%)] px-7 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    Programme guidance
                  </span>

                  <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                    Unsure which programme is right for your child?
                  </h2>

                  <p className="mt-4 max-w-2xl text-base leading-8 text-purple-100">
                    Share your child’s age, previous school experience and
                    current learning needs with our centre team.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yellow-300 px-7 py-3.5 text-sm font-black text-purple-950 transition hover:bg-yellow-200"
                  >
                    Book a School Visit
                    <ArrowRight size={17} />
                  </Link>

                  <a
                    href="tel:+919667038673"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    <Phone size={17} />
                    Call the Centre
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CTA />
      </main>
    </PageShell>
  );
}