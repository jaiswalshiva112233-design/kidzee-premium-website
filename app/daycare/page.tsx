import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { CTA } from "@/components/HomeSections";
import {
  ArrowRight,
  BookOpenCheck,
  BusFront,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Home,
  MessageCircle,
  MoonStar,
  Music2,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Daycare in Sector 12 Dwarka",
  description:
    "Explore caring daycare in Sector 12B, Dwarka from 12:30 PM to 7:00 PM, with rest, indoor play, guided activities, homework support, meal options and transport.",
  keywords: [
    "daycare in Sector 12 Dwarka",
    "daycare in Dwarka",
    "daycare Sector 12B Dwarka",
    "after school daycare Dwarka",
    "preschool daycare Dwarka",
    "daycare till 7 PM Dwarka",
    "Kidzee daycare Dwarka",
    "homework support daycare Dwarka",
  ],
  alternates: {
    canonical: "/daycare",
  },
  openGraph: {
    title: "Daycare in Sector 12 Dwarka",
    description:
      "A comfortable and engaging daycare routine at Kidzee Sector 12, Dwarka, with care available until 7:00 PM.",
    url: "/daycare",
    type: "website",
    images: [
      {
        url: "/images/daycare/daycare-main.jpg",
        width: 1200,
        height: 630,
        alt: "Daycare at Kidzee Sector 12 Dwarka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daycare in Sector 12 Dwarka",
    description:
      "Daycare care, rest, play and guided activities until 7:00 PM at Kidzee Sector 12, Dwarka.",
    images: ["/images/daycare/daycare-main.jpg"],
  },
};

const daycareHighlights = [
  {
    icon: Clock3,
    title: "Care until 7:00 PM",
    description:
      "A dependable afternoon and evening routine for working families.",
  },
  {
    icon: HeartHandshake,
    title: "Personal attention",
    description:
      "Children are supported through meals, rest, activities and transitions.",
  },
  {
    icon: Sparkles,
    title: "Engaging activities",
    description:
      "Age-appropriate play and guided experiences help children stay active.",
  },
  {
    icon: ShieldCheck,
    title: "Supervised environment",
    description:
      "Children remain in a familiar, child-friendly and closely monitored space.",
  },
];

const dailyRoutine = [
  {
    time: "12:30 PM",
    title: "Arrival and settling",
    description:
      "Children transition into daycare, keep their belongings and settle into the afternoon routine.",
    icon: Home,
  },
  {
    time: "Early afternoon",
    title: "Lunch and refreshment",
    description:
      "Children receive time to eat comfortably, wash up and prepare for the next part of the day.",
    icon: Utensils,
  },
  {
    time: "After lunch",
    title: "Rest and quiet time",
    description:
      "A calm period allows younger children to rest and others to recharge through quiet activities.",
    icon: MoonStar,
  },
  {
    time: "Later afternoon",
    title: "Play and enrichment",
    description:
      "Children participate in indoor play, storytelling, creative work, movement and guided activities.",
    icon: Palette,
  },
  {
    time: "Before dispersal",
    title: "Homework and evening routine",
    description:
      "School-going children may receive age-appropriate homework support before pickup or transport.",
    icon: BookOpenCheck,
  },
];

const careFeatures = [
  {
    icon: Clock3,
    title: "Flexible care plans",
    description:
      "Families may enquire about hourly daycare as well as the six-hour daycare plan.",
  },
  {
    icon: Utensils,
    title: "Meal options",
    description:
      "Lunch and evening snack options can be added according to the child’s daycare plan.",
  },
  {
    icon: MoonStar,
    title: "Calm rest routine",
    description:
      "Children receive time to relax in a supervised environment after preschool or school.",
  },
  {
    icon: Palette,
    title: "Creative experiences",
    description:
      "Art, craft, storytelling and hands-on activities keep children meaningfully engaged.",
  },
  {
    icon: Music2,
    title: "Movement and enrichment",
    description:
      "Activities may include dance, taekwondo and personality-development sessions.",
  },
  {
    icon: BookOpenCheck,
    title: "Homework support",
    description:
      "School-going children can receive assistance with age-appropriate homework and revision.",
  },
  {
    icon: BusFront,
    title: "Transport support",
    description:
      "Pickup and drop transport is available on selected routes, subject to confirmation.",
  },
  {
    icon: ShieldCheck,
    title: "Safe transitions",
    description:
      "Arrival, meals, rest, play and dispersal are handled through a structured daily routine.",
  },
];

const plans = [
  {
    name: "Hourly Daycare",
    price: "₹1,000",
    suffix: "per hour, per month",
    description:
      "Suitable for families who need a shorter, fixed daycare duration during the month.",
    features: [
      "Choose the required number of hours",
      "Supervised care and play",
      "Suitable for regular short-duration care",
      "Meal options available separately",
    ],
  },
  {
    name: "Six-Hour Daycare",
    price: "₹6,000",
    suffix: "per month",
    description:
      "Designed for families who need extended care during the afternoon and evening.",
    featured: true,
    features: [
      "Daycare from 12:30 PM to 7:00 PM",
      "Rest, play and guided activities",
      "Homework support where applicable",
      "Meal options available separately",
    ],
  },
];

const mealOptions = [
  {
    title: "Lunch",
    price: "₹1,200 per month",
  },
  {
    title: "Evening snack",
    price: "₹1,000 per month",
  },
  {
    title: "Lunch and evening snack",
    price: "₹2,000 per month",
  },
];

const faqs = [
  {
    question: "What are the daycare timings?",
    answer:
      "Daycare is available from 12:30 PM until 7:00 PM. Parents can discuss their required duration with the centre team.",
  },
  {
    question: "Can parents choose daycare for only a few hours?",
    answer:
      "Yes. An hourly daycare plan is available for families who need a shorter fixed duration. The applicable monthly fee depends on the number of hours selected.",
  },
  {
    question: "Is a full daycare plan available?",
    answer:
      "Yes. The six-hour daycare plan covers care from 12:30 PM until 7:00 PM.",
  },
  {
    question: "Are meals included in the daycare fee?",
    answer:
      "Daycare meals are optional and charged separately. Families may choose lunch, an evening snack or both.",
  },
  {
    question: "What activities are included in daycare?",
    answer:
      "The routine may include indoor play, art and craft, storytelling, dance, taekwondo, personality development and other age-appropriate guided activities.",
  },
  {
    question: "Is homework support available?",
    answer:
      "Yes. Age-appropriate homework support is available for school-going children as part of the daycare routine.",
  },
  {
    question: "Is daycare available for children attending another school?",
    answer:
      "Families with school-going children may enquire about after-school daycare, subject to the child’s age, routine and current availability.",
  },
  {
    question: "Is transport available for daycare children?",
    answer:
      "Pickup and drop transport is available on selected routes. Final availability depends on the child’s location and the current transport route.",
  },
];

export default function DaycarePage() {
  return (
    <PageShell>
      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_52%,#fff7d7_100%)] pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />

          <div className="container relative">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div>
                <span className="eyebrow">Daycare from 12:30 PM to 7:00 PM</span>

                <h1 className="title mt-5 max-w-4xl">
                  Daycare that keeps children comfortable, active and cared
                  for.
                </h1>

                <p className="lead mt-6 max-w-2xl">
                  A dependable daycare routine for working families, with time
                  for food, rest, indoor play, guided activities, homework
                  support and personal attention.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20enquire%20about%20daycare%20for%20my%20child."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-purple-700/20 transition hover:-translate-y-0.5 hover:bg-purple-800"
                  >
                    <MessageCircle size={18} />
                    Enquire About Daycare
                  </a>

                  <a
                    href="tel:+919667038673"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    <Phone size={18} />
                    Call +91 96670 38673
                  </a>
                </div>

                <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
                  {[
                    "Hourly and six-hour plans",
                    "Daycare available until 7 PM",
                    "Meal options available",
                    "Transport on selected routes",
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
                    src="/images/daycare/daycare-main.jpg"
                    alt="Children enjoying daycare at Kidzee Sector 12 Dwarka"
                    width={900}
                    height={760}
                    priority
                    className="h-[460px] w-full object-cover sm:h-[560px]"
                  />

                  <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/50 bg-white/90 p-5 shadow-xl backdrop-blur">
                    <p className="text-sm font-black text-purple-800">
                      A familiar routine after school
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Children receive time to eat, rest, play, learn and settle
                      comfortably before going home.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Highlights */}
        <section className="relative z-10 -mt-3 bg-white pb-8 sm:-mt-5">
          <div className="container">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {daycareHighlights.map((item) => {
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

        {/* Daycare Approach */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
              <div>
                <span className="eyebrow">More than after-school supervision</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  A balanced routine that respects each child’s energy and
                  comfort.
                </h2>

                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                  After preschool or formal school, children need more than a
                  place to wait. They need time to eat without rushing, relax,
                  move, play and reconnect with a predictable routine.
                </p>

                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                  Our daycare schedule is planned to balance active and quiet
                  periods. Younger children can rest, while older children can
                  participate in guided activities and receive homework support
                  where required.
                </p>

                <div className="mt-8 rounded-[28px] border border-yellow-200 bg-[#fff9e7] p-6">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-purple-800">
                    Designed for working families
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
                    Parents can discuss the child’s school timing, pickup
                    requirement, meal preferences and required number of daycare
                    hours with the centre team.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <Image
                  src="/images/daycare/daycare-rest.jpg"
                  alt="Calm rest area for daycare children at Kidzee Dwarka"
                  width={700}
                  height={760}
                  className="h-[350px] w-full rounded-[32px] object-cover sm:h-[470px]"
                />

                <div className="grid gap-5">
                  <Image
                    src="/images/daycare/daycare-activity.jpg"
                    alt="Children participating in a daycare activity"
                    width={700}
                    height={500}
                    className="h-[225px] w-full rounded-[32px] object-cover"
                  />

                  <Image
                    src="/images/daycare/daycare-play.jpg"
                    alt="Indoor play during daycare at Kidzee Sector 12 Dwarka"
                    width={700}
                    height={500}
                    className="h-[225px] w-full rounded-[32px] object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Daily Routine */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">A balanced daily rhythm</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                A predictable flow from arrival to dispersal.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                The exact routine may vary by age and school timing, but each
                child moves through a familiar sequence of care, rest and
                engagement.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-5xl">
              {dailyRoutine.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.title}
                    className="relative grid gap-5 pb-10 last:pb-0 sm:grid-cols-[120px_56px_1fr]"
                  >
                    {index !== dailyRoutine.length - 1 && (
                      <span className="absolute left-[147px] top-14 hidden h-[calc(100%-2rem)] w-px bg-purple-200 sm:block" />
                    )}

                    <div className="pt-3 text-sm font-black text-purple-700 sm:text-right">
                      {item.time}
                    </div>

                    <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-700 text-white shadow-lg shadow-purple-700/15">
                      <Icon size={24} />
                    </span>

                    <article className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
                      <h3 className="text-xl font-black text-slate-950">
                        {item.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                        {item.description}
                      </p>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Care Features */}
        <section className="section bg-white">
          <div className="container">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="eyebrow">What families can expect</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Care that supports the whole afternoon.
                </h2>

                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                  Each part of the daycare experience is planned to make
                  children feel secure while keeping the routine useful and
                  enjoyable.
                </p>
              </div>

              <a
                href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20please%20share%20the%20daycare%20plans%20and%20availability."
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 text-sm font-black text-purple-700 transition hover:text-purple-900"
              >
                Ask about availability
                <ArrowRight size={17} />
              </a>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {careFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="group rounded-[30px] border border-purple-100 bg-[#fcfbff] p-7 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-purple-950/5"
                  >
                    <span className="flex h-13 w-13 items-center justify-center rounded-2xl bg-purple-100 p-3 text-purple-700 transition group-hover:bg-purple-700 group-hover:text-white">
                      <Icon size={25} strokeWidth={1.8} />
                    </span>

                    <h3 className="mt-6 text-xl font-black text-slate-950">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Plans and Pricing */}
        <section className="section bg-purple-950 text-white">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                Daycare plans
              </span>

              <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                Choose a plan according to your family’s routine.
              </h2>

              <p className="mt-5 text-base leading-8 text-purple-100 sm:text-lg">
                Speak with the centre team to confirm availability, suitable
                timings and any additional meal or transport requirements.
              </p>
            </div>

            <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2">
              {plans.map((plan) => (
                <article
                  key={plan.name}
                  className={`relative rounded-[34px] border p-7 sm:p-9 ${
                    plan.featured
                      ? "border-yellow-300 bg-white text-slate-950"
                      : "border-white/15 bg-white/10 text-white"
                  }`}
                >
                  {plan.featured && (
                    <span className="absolute -top-4 left-7 rounded-full bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-purple-950">
                      Extended care
                    </span>
                  )}

                  <h3
                    className={`text-2xl font-black ${
                      plan.featured ? "text-slate-950" : "text-white"
                    }`}
                  >
                    {plan.name}
                  </h3>

                  <div className="mt-6">
                    <span
                      className={`text-4xl font-black ${
                        plan.featured ? "text-purple-800" : "text-yellow-300"
                      }`}
                    >
                      {plan.price}
                    </span>

                    <span
                      className={`ml-2 text-sm ${
                        plan.featured
                          ? "text-slate-500"
                          : "text-purple-200"
                      }`}
                    >
                      {plan.suffix}
                    </span>
                  </div>

                  <p
                    className={`mt-5 text-sm leading-7 sm:text-base ${
                      plan.featured ? "text-slate-600" : "text-purple-100"
                    }`}
                  >
                    {plan.description}
                  </p>

                  <ul className="mt-7 grid gap-4">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className={`flex items-start gap-3 text-sm leading-7 ${
                          plan.featured ? "text-slate-700" : "text-purple-100"
                        }`}
                      >
                        <CheckCircle2
                          size={19}
                          className={`mt-1 shrink-0 ${
                            plan.featured
                              ? "text-purple-700"
                              : "text-yellow-300"
                          }`}
                        />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={`https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20enquire%20about%20the%20${encodeURIComponent(
                      plan.name,
                    )}.`}
                    target="_blank"
                    rel="noreferrer"
                    className={`mt-8 inline-flex min-h-12 w-full items-center justify-center rounded-full px-6 py-3.5 text-sm font-black transition ${
                      plan.featured
                        ? "bg-purple-700 text-white hover:bg-purple-800"
                        : "bg-yellow-300 text-purple-950 hover:bg-yellow-200"
                    }`}
                  >
                    Enquire About This Plan
                  </a>
                </article>
              ))}
            </div>

            <div className="mx-auto mt-10 max-w-5xl rounded-[32px] border border-white/15 bg-white/10 p-7 sm:p-9">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-yellow-300">
                    Optional daycare meals
                  </span>

                  <h3 className="mt-4 text-2xl font-black text-white">
                    Add meals according to your child’s schedule.
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-purple-100">
                    Meal plans are charged separately from the daycare fee.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  {mealOptions.map((meal) => (
                    <div
                      key={meal.title}
                      className="rounded-[24px] border border-white/10 bg-white/10 p-5"
                    >
                      <Utensils size={22} className="text-yellow-300" />

                      <p className="mt-4 text-sm font-black text-white">
                        {meal.title}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-purple-200">
                        {meal.price}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mx-auto mt-7 max-w-3xl text-center text-xs leading-6 text-purple-200">
              Fees and plan availability should be confirmed directly with the
              centre before enrolment. Transport charges may vary according to
              the route.
            </p>
          </div>
        </section>

        {/* Safety and Parent Communication */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div className="rounded-[36px] bg-[#fff9e7] p-7 sm:p-9">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-purple-950">
                  <ShieldCheck size={28} />
                </span>

                <h2 className="mt-6 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                  A routine built around care and clear supervision.
                </h2>

                <p className="mt-5 text-base leading-8 text-slate-600">
                  Daycare children move through several transitions during the
                  afternoon. Arrival, meals, rest, activities and dispersal are
                  handled through a consistent routine.
                </p>

                <ul className="mt-7 grid gap-4">
                  {[
                    "Supervised indoor environment",
                    "Structured arrival and dispersal routine",
                    "Age-appropriate care and activities",
                    "Support during meals and rest",
                    "Clear communication with parents",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm"
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
              </div>

              <div>
                <span className="eyebrow">Parent partnership</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Daycare works best when families and caregivers stay
                  connected.
                </h2>

                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                  Parents can share information about the child’s routine,
                  meals, allergies, school schedule, homework needs, authorised
                  pickup and any specific care instructions.
                </p>

                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                  This helps the daycare team provide a more consistent
                  experience and respond appropriately to the child’s daily
                  needs.
                </p>

                <div className="mt-8 rounded-[28px] border border-purple-100 bg-[#faf8ff] p-6">
                  <p className="font-black text-slate-950">
                    Planning preschool with daycare?
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Families combining preschool and daycare can discuss a
                    routine that allows the child to move smoothly from the
                    morning programme into afternoon care.
                  </p>

                  <Link
                    href="/admissions"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-black text-purple-700 transition hover:text-purple-900"
                  >
                    View admission process
                    <ArrowRight size={17} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Daycare questions</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Useful information for parents considering daycare.
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

        {/* Final Daycare CTA */}
        <section className="section bg-white">
          <div className="container">
            <div className="overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#5b2a86_0%,#3b145f_100%)] px-7 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    Daycare admissions
                  </span>

                  <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                    Discuss the right daycare routine for your child.
                  </h2>

                  <p className="mt-4 max-w-2xl text-base leading-8 text-purple-100">
                    Share your child’s age, school timing, required daycare
                    hours, meal preference and transport location with our team.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <a
                    href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20check%20daycare%20availability%20for%20my%20child."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yellow-300 px-7 py-3.5 text-sm font-black text-purple-950 transition hover:bg-yellow-200"
                  >
                    Check Daycare Availability
                    <ArrowRight size={17} />
                  </a>

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