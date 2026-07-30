"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  BookOpenCheck,
  Check,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const programmes = [
  {
    title: "Playgroup",
    age: "2–3 years",
    href: "/programmes/playgroup",
    icon: Baby,
    suitableFor: "A child’s first preschool experience",
    learningStyle: "Comfort-led, sensory and play-based",
    languageFocus: "Listening, words, rhymes and expression",
    numeracyFocus: "Sorting, matching, shapes and quantities",
    independence: "Simple routines with close support",
    schoolReadiness: "Settling and classroom familiarity",
  },
  {
    title: "Nursery",
    age: "3–4 years",
    href: "/programmes/nursery",
    icon: BookOpenCheck,
    suitableFor: "Building early learning foundations",
    learningStyle: "Activity-led and exploratory",
    languageFocus: "Vocabulary, phonics readiness and stories",
    numeracyFocus: "Numbers, patterns and basic concepts",
    independence: "Choices, self-help and participation",
    schoolReadiness: "Following routines and group learning",
  },
  {
    title: "Junior KG",
    age: "4–5 years",
    href: "/programmes/junior-kg",
    icon: GraduationCap,
    suitableFor: "Strengthening core academic readiness",
    learningStyle: "Balanced play and structured learning",
    languageFocus: "Phonics, early reading and writing readiness",
    numeracyFocus: "Number sense, sequences and problem-solving",
    independence: "Completing tasks with growing confidence",
    schoolReadiness: "Academic habits and communication",
  },
  {
    title: "Senior KG",
    age: "5–6 years",
    href: "/programmes/senior-kg",
    icon: GraduationCap,
    suitableFor: "Preparing confidently for primary school",
    learningStyle: "Structured, practical and application-based",
    languageFocus: "Reading, writing and comprehension",
    numeracyFocus: "Operations, logic and mathematical thinking",
    independence: "Responsible routines and self-management",
    schoolReadiness: "Formal-school confidence and readiness",
  },
];

const comparisonRows = [
  {
    label: "Best suited for",
    key: "suitableFor",
  },
  {
    label: "Learning style",
    key: "learningStyle",
  },
  {
    label: "Language development",
    key: "languageFocus",
  },
  {
    label: "Early numeracy",
    key: "numeracyFocus",
  },
  {
    label: "Independence",
    key: "independence",
  },
  {
    label: "School readiness",
    key: "schoolReadiness",
  },
] as const;

const commonFeatures = [
  "Age-appropriate classroom planning",
  "Stories, songs and conversation",
  "Creative and movement-based activities",
  "Teacher observation and guidance",
  "Social and emotional development",
  "Regular communication with parents",
];

export default function ProgrammeComparison() {
  return (
    <section
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
      aria-labelledby="programme-comparison-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-yellow-100/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-purple-100/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
            <Sparkles size={16} aria-hidden="true" />
            Compare programmes
          </div>

          <h2
            id="programme-comparison-heading"
            className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
          >
            See how learning develops{" "}
            <span className="text-[#702a96]">from one stage to the next</span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            The programmes follow a natural progression. As children grow,
            classroom experiences become more structured while continuing to
            protect curiosity, confidence and enjoyment in learning.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.12 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="mt-14 hidden overflow-hidden rounded-[36px] border border-purple-100 bg-white shadow-[0_22px_60px_rgba(62,25,83,0.09)] lg:block"
        >
          <div className="grid grid-cols-[220px_repeat(4,minmax(0,1fr))]">
            <div className="border-b border-r border-purple-100 bg-[#faf8ff] p-6">
              <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#702a96]">
                Programme stage
              </p>
            </div>

            {programmes.map((programme) => {
              const Icon = programme.icon;

              return (
                <div
                  key={programme.title}
                  className="border-b border-r border-purple-100 bg-[#faf8ff] p-6 last:border-r-0"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-purple-100 text-[#702a96]">
                    <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
                  </div>

                  <h3 className="mt-4 text-xl font-extrabold text-[#281036]">
                    {programme.title}
                  </h3>

                  <p className="mt-1 text-sm font-bold text-[#702a96]">
                    {programme.age}
                  </p>
                </div>
              );
            })}

            {comparisonRows.map((row, rowIndex) => (
              <div
                key={row.key}
                className="contents"
              >
                <div
                  className={`border-r border-purple-100 p-6 ${
                    rowIndex !== comparisonRows.length - 1
                      ? "border-b"
                      : ""
                  }`}
                >
                  <p className="text-sm font-extrabold leading-6 text-[#281036]">
                    {row.label}
                  </p>
                </div>

                {programmes.map((programme) => (
                  <div
                    key={`${programme.title}-${row.key}`}
                    className={`border-r border-purple-100 p-6 last:border-r-0 ${
                      rowIndex !== comparisonRows.length - 1
                        ? "border-b"
                        : ""
                    }`}
                  >
                    <p className="text-sm leading-7 text-slate-600">
                      {programme[row.key]}
                    </p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-12 grid gap-6 lg:hidden">
          {programmes.map((programme, index) => {
            const Icon = programme.icon;

            return (
              <motion.article
                key={programme.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                className="rounded-[32px] border border-purple-100 bg-white p-6 shadow-[0_16px_44px_rgba(62,25,83,0.08)] sm:p-7"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[19px] bg-purple-100 text-[#702a96]">
                    <Icon size={24} strokeWidth={2.1} aria-hidden="true" />
                  </div>

                  <div>
                    <h3 className="text-2xl font-extrabold text-[#281036]">
                      {programme.title}
                    </h3>

                    <p className="mt-1 text-sm font-bold text-[#702a96]">
                      {programme.age}
                    </p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {comparisonRows.map((row) => (
                    <div
                      key={row.key}
                      className="rounded-[22px] bg-[#faf8ff] p-4"
                    >
                      <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#702a96]">
                        {row.label}
                      </p>

                      <p className="mt-2 text-sm leading-7 text-slate-600">
                        {programme[row.key]}
                      </p>
                    </div>
                  ))}
                </div>

                <Link
                  href={programme.href}
                  className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#64278f] px-6 text-sm font-extrabold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#522071]"
                >
                  View {programme.title}
                  <ArrowRight size={17} aria-hidden="true" />
                </Link>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-16 rounded-[36px] bg-[#2d1636] p-7 text-white shadow-[0_28px_75px_rgba(45,22,54,0.18)] sm:p-9 lg:p-10"
        >
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300">
                Present in every programme
              </p>

              <h3 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
                The learning approach changes with age, but the child-first
                experience remains consistent
              </h3>

              <p className="mt-5 leading-8 text-purple-100">
                Every stage combines meaningful learning, attentive care and
                opportunities for children to communicate, create, move,
                participate and gradually become more independent.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {commonFeatures.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/[0.07] p-4"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                    <Check size={16} strokeWidth={3} aria-hidden="true" />
                  </div>

                  <p className="text-sm font-semibold leading-6 text-purple-50">
                    {feature}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-sm leading-7 text-purple-100">
              Unsure which stage is right for your child? Our team can guide you
              based on age, comfort, previous learning exposure and current
              readiness.
            </p>

            <Link
              href="/contact"
              className="inline-flex min-h-13 shrink-0 items-center justify-center gap-2 rounded-full bg-yellow-300 px-6 text-sm font-extrabold text-[#281036] transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-200"
            >
              Get Programme Guidance
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}