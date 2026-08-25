"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BadgeCheck,
  Brain,
  ClipboardCheck,
  Eye,
  Focus,
  HeartHandshake,
  Lightbulb,
  Sparkles,
} from "lucide-react";

const fiveMinds = [
  {
    number: "01",
    icon: Focus,
    title: "Focused Mind",
    description:
      "Children gradually learn to listen, stay involved and complete age-appropriate activities with greater attention.",
    outcome: "Knowledge retention",
    accent: "bg-[#f1e7f7]",
    iconColor: "text-[#702a96]",
  },
  {
    number: "02",
    icon: Eye,
    title: "Analytical Mind",
    description:
      "Observation, comparison and simple problem-solving help children understand ideas instead of only memorising them.",
    outcome: "Knowledge application",
    accent: "bg-[#fff3c9]",
    iconColor: "text-[#8a5a00]",
  },
  {
    number: "03",
    icon: ClipboardCheck,
    title: "Conscientious Mind",
    description:
      "Daily responsibilities and classroom routines encourage children to become more organised, dependable and independent.",
    outcome: "Knowledge acquisition",
    accent: "bg-[#e7f6ef]",
    iconColor: "text-[#21785a]",
  },
  {
    number: "04",
    icon: Lightbulb,
    title: "Inventive Mind",
    description:
      "Creative activities invite children to experiment, imagine possibilities and express their own ideas with confidence.",
    outcome: "Knowledge development",
    accent: "bg-[#ffe9df]",
    iconColor: "text-[#b34f2f]",
  },
  {
    number: "05",
    icon: HeartHandshake,
    title: "Empathetic Mind",
    description:
      "Group experiences help children recognise emotions, consider others and build respectful relationships with classmates.",
    outcome: "Emotional balance",
    accent: "bg-[#e8efff]",
    iconColor: "text-[#365ca8]",
  },
];

const transition = {
  duration: 0.65,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function AboutKidzee() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="relative isolate overflow-hidden bg-white py-14 sm:py-16 lg:py-20"
      aria-labelledby="about-kidzee-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-44 top-24 -z-10 h-[28rem] w-[28rem] rounded-full bg-purple-100/65 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-44 bottom-10 -z-10 h-[30rem] w-[30rem] rounded-full bg-yellow-100/75 blur-3xl"
      />

      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-16">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -28 }}
            whileInView={
              shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
            }
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
            className="lg:sticky lg:top-28"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-[#fffaf2] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm">
              <Sparkles size={16} aria-hidden="true" />
              The P&eacute;ntemind approach
            </div>

            <h2
              id="about-kidzee-heading"
              className="mt-6 text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#281036] sm:text-4xl lg:text-[48px]"
            >
              How P&eacute;ntemind develops{" "}
              <span className="text-[#702a96]">
                five connected learning minds
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Kidzee&apos;s P&eacute;ntemind pedagogy nurtures five learning minds
              together: Focused, Analytical, Conscientious, Inventive and
              Empathetic. Children practise these abilities through guided
              discovery, conversation, play and everyday classroom routines.
            </p>

            <p className="mt-5 max-w-2xl leading-7 text-slate-600">
              At Kidzee Sector 12, Dwarka, these abilities are encouraged
              through everyday classroom experiences, conversations, guided
              activities and routines suited to each age group.
            </p>

            <div className="mt-8 overflow-hidden rounded-[32px] bg-[#2d1636] p-7 text-white shadow-[0_24px_65px_rgba(45,22,54,0.22)] sm:p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-yellow-300 text-[#281036]">
                <Brain size={26} strokeWidth={2.2} aria-hidden="true" />
              </div>

              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.17em] text-yellow-300">
                One connected approach
              </p>

              <h3 className="mt-3 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                Development is stronger when these abilities grow together.
              </h3>

              <p className="mt-4 leading-7 text-purple-100">
                A child may be concentrating during a story, reasoning during a
                sorting activity, sharing materials with a friend and finding a
                new way to complete a task—all within the same morning.
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-[22px] border border-white/15 bg-white/10 p-4">
                <BadgeCheck
                  className="mt-0.5 shrink-0 text-yellow-300"
                  size={21}
                  aria-hidden="true"
                />

                <p className="text-sm font-semibold leading-6 text-purple-50">
                  The aim is balanced development, not pressure to perform
                  beyond a child&apos;s age or readiness.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="min-w-0">
            <motion.div
              initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
              whileInView={
                shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
              }
              viewport={{ once: true, amount: 0.2 }}
              transition={transition}
              className="mb-7"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                The P&eacute;ntemind framework
              </p>

              <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036] sm:text-4xl">
                Five minds, each supporting a different part of development
              </h3>
            </motion.div>

            <div className="grid grid-flow-col auto-cols-[86%] gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:auto-cols-[72%] lg:grid-flow-row lg:auto-cols-auto lg:overflow-visible lg:pb-0">
              {fiveMinds.map((mind, index) => {
                const Icon = mind.icon;

                return (
                  <motion.article
                    key={mind.title}
                    initial={
                      shouldReduceMotion ? false : { opacity: 0, y: 22 }
                    }
                    whileInView={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: 1, y: 0 }
                    }
                    viewport={{ once: true, amount: 0.18 }}
                    transition={{
                      ...transition,
                      duration: 0.55,
                      delay: shouldReduceMotion ? 0 : index * 0.05,
                    }}
                    whileHover={
                      shouldReduceMotion
                        ? undefined
                        : {
                            y: -5,
                          }
                    }
                    className="group snap-start overflow-hidden rounded-[30px] border border-purple-100 bg-white p-5 shadow-[0_14px_40px_rgba(62,25,83,0.07)] transition-[border-color,box-shadow] duration-300 hover:border-purple-200 hover:shadow-[0_24px_60px_rgba(62,25,83,0.13)] sm:p-6"
                  >
                    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-start">
                      <div
                        className={`flex h-16 w-16 items-center justify-center rounded-[22px] ${mind.accent} ${mind.iconColor}`}
                      >
                        <Icon
                          size={28}
                          strokeWidth={2}
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#8d6b97]">
                              Mind {mind.number}
                            </p>

                            <h4 className="mt-1 text-2xl font-extrabold tracking-[-0.025em] text-[#281036]">
                              {mind.title}
                            </h4>
                          </div>

                          <span className="rounded-full border border-purple-100 bg-[#fffaf2] px-4 py-2 text-xs font-bold text-[#5b4063]">
                            {mind.outcome}
                          </span>
                        </div>

                        <p className="mt-4 max-w-3xl leading-7 text-slate-600">
                          {mind.description}
                        </p>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          </div>
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={
            shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
          }
          viewport={{ once: true, amount: 0.2 }}
          transition={transition}
          className="mt-16 overflow-hidden rounded-[36px] border border-purple-100 bg-[#fffaf2] p-7 shadow-[0_18px_50px_rgba(62,25,83,0.08)] sm:p-9 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                What this means for parents
              </p>

              <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036]">
                Progress can appear in many small, meaningful ways
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "Listening for longer during a group activity",
                "Trying another method when the first one does not work",
                "Taking care of personal and classroom belongings",
                "Expressing an original idea through words, art or play",
                "Recognising when a classmate needs patience or support",
                "Participating more independently in the daily routine",
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={
                    shouldReduceMotion ? false : { opacity: 0, y: 14 }
                  }
                  whileInView={
                    shouldReduceMotion
                      ? undefined
                      : { opacity: 1, y: 0 }
                  }
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : index * 0.04,
                  }}
                  className="flex items-start gap-3 rounded-[22px] border border-purple-100 bg-white p-4"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                    <BadgeCheck
                      size={16}
                      strokeWidth={2.7}
                      aria-hidden="true"
                    />
                  </span>

                  <p className="text-sm font-semibold leading-6 text-[#3d2a43]">
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
