"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Brain,
  CheckCircle2,
  HeartHandshake,
  Puzzle,
  Sparkles,
  UsersRound,
} from "lucide-react";

const developmentAreas = [
  {
    icon: Brain,
    title: "Thinking skills",
    description:
      "Children observe, compare, sort, question and solve age-appropriate problems through guided classroom experiences.",
  },
  {
    icon: BookOpenCheck,
    title: "Language and literacy",
    description:
      "Stories, rhymes, conversations, phonics and picture-based activities strengthen listening, vocabulary and early reading readiness.",
  },
  {
    icon: Puzzle,
    title: "Numeracy foundations",
    description:
      "Children begin understanding numbers, patterns, shapes, quantities and simple mathematical relationships through practical activities.",
  },
  {
    icon: UsersRound,
    title: "Social development",
    description:
      "Group learning helps children practise sharing, cooperation, turn-taking, listening and respectful participation.",
  },
  {
    icon: HeartHandshake,
    title: "Confidence and independence",
    description:
      "Daily routines encourage children to express themselves, make simple choices and complete age-appropriate tasks independently.",
  },
];

const learningPrinciples = [
  "Activities matched to the child’s age and developmental stage",
  "A balance of guided learning and child-led exploration",
  "Regular opportunities for movement, creativity and conversation",
  "Progression from familiar experiences to new concepts",
  "Observation-based support from teachers",
  "Preparation for the next stage without unnecessary pressure",
];

export default function ProgrammeOverview() {
  return (
    <section
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
      aria-labelledby="programme-overview-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-purple-100/65 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-yellow-100/70 blur-3xl"
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
            Programme overview
          </div>

          <h2
            id="programme-overview-heading"
            className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
          >
            A connected learning journey from{" "}
            <span className="text-[#702a96]">
              first steps to school readiness
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Every programme is planned around the needs of its age group, while
            continuing to strengthen the core abilities children need for
            communication, learning, relationships and increasing independence.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="rounded-[36px] bg-[#2d1636] p-7 text-white shadow-[0_28px_75px_rgba(45,22,54,0.2)] sm:p-9 lg:sticky lg:top-28"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300">
              How the programmes progress
            </p>

            <h3 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
              Each stage builds on what children already know and can do
            </h3>

            <p className="mt-5 leading-8 text-purple-100">
              Younger children begin with comfort, communication, sensory
              exploration and simple routines. As they progress, learning
              becomes more structured and includes stronger language, numeracy,
              writing readiness, problem-solving and school-preparation skills.
            </p>

            <div className="mt-8 space-y-4">
              {learningPrinciples.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/[0.07] p-4"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                    <CheckCircle2
                      size={16}
                      strokeWidth={2.7}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-sm font-semibold leading-6 text-purple-50">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-yellow-300 px-6 text-sm font-extrabold text-[#281036] transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-200"
            >
              Discuss Your Child’s Programme
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2">
            {developmentAreas.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 22 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.18 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.05,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -5 }}
                  className={`group rounded-[30px] border border-purple-100 bg-[#fffdf9] p-6 shadow-[0_14px_38px_rgba(62,25,83,0.07)] transition duration-300 hover:border-purple-200 hover:shadow-[0_24px_55px_rgba(62,25,83,0.12)] sm:p-7 ${
                    index === developmentAreas.length - 1
                      ? "sm:col-span-2"
                      : ""
                  }`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-purple-100 text-[#702a96] transition duration-300 group-hover:-rotate-3 group-hover:bg-[#702a96] group-hover:text-white">
                    <Icon size={23} strokeWidth={2.1} aria-hidden="true" />
                  </div>

                  <h3 className="mt-5 text-xl font-extrabold leading-7 text-[#281036]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                    {item.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-16 rounded-[34px] border border-purple-100 bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_55%,#fff7d8_100%)] p-7 shadow-[0_18px_50px_rgba(62,25,83,0.08)] sm:p-9 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                Not sure where your child should begin?
              </p>

              <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036] sm:text-4xl">
                We can help you choose the programme that matches your child’s
                age and readiness
              </h3>

              <p className="mt-4 max-w-3xl leading-8 text-slate-600">
                Age is the starting point, but a conversation with the centre
                team can also help parents understand the child’s comfort,
                previous school exposure and current developmental needs.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#64278f] px-7 text-base font-extrabold text-white shadow-[0_14px_32px_rgba(100,39,143,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#522071]"
            >
              Speak With Our Team
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}