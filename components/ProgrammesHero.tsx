"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  BookOpenCheck,
  CalendarCheck2,
  CheckCircle2,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const programmeHighlights = [
  {
    icon: Baby,
    title: "Playgroup",
    age: "2–3 years",
  },
  {
    icon: BookOpenCheck,
    title: "Nursery",
    age: "3–4 years",
  },
  {
    icon: GraduationCap,
    title: "Junior KG",
    age: "4–5 years",
  },
  {
    icon: GraduationCap,
    title: "Senior KG",
    age: "5–6 years",
  },
];

const programmeBenefits = [
  "Age-appropriate learning goals",
  "Play-based and activity-led teaching",
  "Language, numeracy and school-readiness skills",
  "Confidence, independence and social development",
];

export default function ProgrammesHero() {
  const visitMessage = encodeURIComponent(
    "Hello, I would like to know which preschool programme is suitable for my child at Kidzee Sector 12, Dwarka."
  );

  return (
    <section
      className="relative overflow-hidden bg-[linear-gradient(135deg,#f7f1ff_0%,#ffffff_50%,#fff6cf_100%)] pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-28 lg:pt-20"
      aria-labelledby="programmes-hero-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-36 top-20 h-96 w-96 rounded-full bg-purple-200/45 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-yellow-200/55 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute left-[46%] top-12 h-48 w-48 rounded-full bg-pink-100/50 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[1.04fr_0.96fr] lg:gap-18 xl:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <nav
              aria-label="Breadcrumb"
              className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"
            >
              <Link
                href="/"
                className="transition hover:text-[#702a96]"
              >
                Home
              </Link>

              <span aria-hidden="true">/</span>

              <span className="text-[#702a96]">Programmes</span>
            </nav>

            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/85 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm backdrop-blur">
              <Sparkles size={16} aria-hidden="true" />
              Preschool programmes in Dwarka
            </div>

            <h1
              id="programmes-hero-heading"
              className="mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-tight tracking-[-0.045em] text-[#281036] sm:text-5xl lg:text-[62px]"
            >
              The right learning experience for{" "}
              <span className="text-[#702a96]">
                every stage of early childhood
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              From a child’s first preschool experience to confident school
              readiness, our programmes support development through guided
              play, meaningful activities, conversation, movement and
              age-appropriate classroom learning.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {programmeBenefits.map((benefit) => (
                <div
                  key={benefit}
                  className="flex items-start gap-3 rounded-[20px] border border-purple-100 bg-white/80 p-4 shadow-sm backdrop-blur"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                    <CheckCircle2
                      size={16}
                      strokeWidth={2.7}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {benefit}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={`https://wa.me/919667038673?text=${visitMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#64278f] px-7 text-base font-extrabold text-white shadow-[0_16px_36px_rgba(100,39,143,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#522071]"
              >
                <CalendarCheck2 size={19} aria-hidden="true" />
                Find the Right Programme
              </a>

              <Link
                href="/contact"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 text-base font-extrabold text-[#64278f] transition duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50"
              >
                Book a School Visit
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.08, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[680px]"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-5 rotate-2 rounded-[46px] bg-purple-100/80"
            />

            <div
              aria-hidden="true"
              className="absolute -right-5 -top-5 h-28 w-28 rounded-[34px] bg-yellow-300/75"
            />

            <div className="relative overflow-hidden rounded-[42px] border-[8px] border-white bg-white shadow-[0_32px_85px_rgba(64,27,78,0.18)]">
              <div className="relative min-h-[580px] sm:min-h-[680px]">
                <Image
                  src="/images/programmes/programmes-hero.jpg"
                  alt="Children participating in preschool learning activities at Kidzee Sector 12 Dwarka"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#281036]/72 via-transparent to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="rounded-[28px] border border-white/20 bg-white/92 p-5 shadow-xl backdrop-blur-md sm:p-6">
                  <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#702a96]">
                    Learning that grows with your child
                  </p>

                  <p className="mt-2 text-xl font-extrabold leading-snug text-[#281036] sm:text-2xl">
                    Each programme builds on the skills, confidence and
                    independence developed in the previous stage.
                  </p>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -left-4 top-12 hidden rounded-[22px] border border-purple-100 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(57,26,68,0.15)] sm:block"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#702a96]">
                Ages 2–6 years
              </p>

              <p className="mt-1 text-lg font-extrabold text-[#281036]">
                Four learning stages
              </p>
            </motion.div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.18, ease: "easeOut" }}
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {programmeHighlights.map((programme, index) => {
            const Icon = programme.icon;

            return (
              <Link
                key={programme.title}
                href={
                  index === 0
                    ? "/programmes/playgroup"
                    : index === 1
                      ? "/programmes/nursery"
                      : index === 2
                        ? "/programmes/junior-kg"
                        : "/programmes/senior-kg"
                }
                className="group rounded-[28px] border border-purple-100 bg-white/90 p-5 shadow-[0_14px_38px_rgba(62,25,83,0.07)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-purple-200 hover:shadow-[0_22px_48px_rgba(62,25,83,0.12)]"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-[18px] bg-purple-100 text-[#702a96] transition duration-300 group-hover:bg-[#702a96] group-hover:text-white">
                    <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
                  </div>

                  <div>
                    <p className="text-lg font-extrabold text-[#281036]">
                      {programme.title}
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#702a96]">
                      {programme.age}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}