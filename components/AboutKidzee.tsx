"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  BrainCircuit,
  CheckCircle2,
  Compass,
  HeartHandshake,
  Lightbulb,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

const learningMinds = [
  {
    icon: HeartHandshake,
    title: "Empathetic Mind",
    eyebrow: "Emotional balance",
    description:
      "Children learn to recognise their own feelings, understand how others may feel and respond with kindness during everyday classroom moments.",
  },
  {
    icon: Compass,
    title: "Conscientious Mind",
    eyebrow: "Thoughtful choices",
    description:
      "Simple responsibilities, routines and guided decisions help children become more aware, careful and responsible in the way they act.",
  },
  {
    icon: Target,
    title: "Focused Mind",
    eyebrow: "Attention and persistence",
    description:
      "Age-appropriate tasks encourage children to listen, stay involved and keep trying—without turning the classroom into a high-pressure environment.",
  },
  {
    icon: BrainCircuit,
    title: "Analytical Mind",
    eyebrow: "Observation and reasoning",
    description:
      "Sorting, comparing, questioning and problem-solving activities help children make connections and understand how things work.",
  },
  {
    icon: Lightbulb,
    title: "Inventive Mind",
    eyebrow: "Imagination and ideas",
    description:
      "Stories, art, role play and open-ended activities give children the freedom to explore possibilities and express original ideas.",
  },
];

const approachPoints = [
  "Learning planned around a child’s age and developmental stage",
  "Concepts introduced through play, stories, movement and exploration",
  "A healthy balance of school readiness and everyday life skills",
  "Regular opportunities to speak, create, question and participate",
  "Steady preparation for the transition to formal schooling",
];

const transition = {
  duration: 0.65,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function AboutKidzee() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="relative isolate overflow-hidden bg-[#2d1636] py-20 text-white sm:py-24 lg:py-28"
      aria-labelledby="about-kidzee-heading"
    >
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="absolute -left-40 top-16 -z-10 h-[30rem] w-[30rem] rounded-full bg-[#8b3fc0]/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-36 bottom-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-yellow-300/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16 xl:gap-24">
          {/* Left column */}
          <motion.div
            initial={
              shouldReduceMotion ? false : { opacity: 0, x: -28 }
            }
            whileInView={
              shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
            }
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
            className="lg:sticky lg:top-28"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-yellow-300 backdrop-blur-sm">
              <Sparkles size={16} aria-hidden="true" />
              Kidzee Péntemind pedagogy
            </div>

            <h2
              id="about-kidzee-heading"
              className="mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-white sm:text-5xl lg:text-[58px]"
            >
              Learning that shapes the{" "}
              <span className="text-yellow-300">way a child thinks</span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
              At Kidzee Sector 12, Dwarka, learning is not limited to
              recognising letters, numbers or completing worksheets. Children
              are encouraged to observe, speak, imagine, make choices and learn
              how to work with others.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
              Kidzee’s Péntemind approach brings these abilities together
              through experiences that feel natural to young children—play,
              conversation, movement, stories and hands-on discovery.
            </p>

            <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.07] p-6 shadow-[0_22px_70px_rgba(10,0,20,0.18)] backdrop-blur-sm sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-yellow-300 text-[#281036]">
                  <UsersRound size={23} aria-hidden="true" />
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-yellow-300">
                    How learning happens
                  </p>

                  <h3 className="mt-1 text-xl font-extrabold leading-snug text-white">
                    Purposeful activities, without unnecessary pressure
                  </h3>
                </div>
              </div>

              <ul className="mt-6 space-y-4">
                {approachPoints.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                      <CheckCircle2
                        size={15}
                        strokeWidth={2.7}
                        aria-hidden="true"
                      />
                    </span>

                    <span className="font-semibold leading-7 text-purple-50">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* Right column */}
          <div>
            <motion.div
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 24 }
              }
              whileInView={
                shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
              }
              viewport={{ once: true, amount: 0.15 }}
              transition={transition}
              className="rounded-[36px] border border-white/10 bg-white/[0.06] p-6 shadow-[0_30px_90px_rgba(12,0,20,0.2)] backdrop-blur-sm sm:p-8 lg:p-10"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300">
                The five learning minds
              </p>

              <h3 className="mt-3 max-w-3xl text-balance text-3xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                Five connected abilities children carry beyond the classroom
              </h3>

              <p className="mt-4 max-w-3xl text-base leading-8 text-purple-100">
                Each mind supports a different part of a child’s development,
                but children experience them together—while playing, solving a
                problem, sharing with a friend or trying something for the
                first time.
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {learningMinds.map((item, index) => {
                  const Icon = item.icon;
                  const isLastItem = index === learningMinds.length - 1;

                  return (
                    <motion.article
                      key={item.title}
                      initial={
                        shouldReduceMotion
                          ? false
                          : { opacity: 0, y: 22 }
                      }
                      whileInView={
                        shouldReduceMotion
                          ? undefined
                          : { opacity: 1, y: 0 }
                      }
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{
                        ...transition,
                        delay: shouldReduceMotion ? 0 : index * 0.06,
                      }}
                      whileHover={
                        shouldReduceMotion ? undefined : { y: -5 }
                      }
                      className={`group rounded-[28px] border border-white/10 bg-white/[0.07] p-6 transition-[background-color,border-color,box-shadow] duration-300 hover:border-yellow-300/35 hover:bg-white/[0.1] hover:shadow-[0_18px_48px_rgba(10,0,20,0.2)] ${
                        isLastItem ? "sm:col-span-2" : ""
                      }`}
                    >
                      <div
                        className={`flex gap-4 ${
                          isLastItem
                            ? "items-start sm:items-center"
                            : "flex-col items-start"
                        }`}
                      >
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[19px] bg-yellow-300 text-[#281036] transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                          <Icon
                            size={24}
                            strokeWidth={2.1}
                            aria-hidden="true"
                          />
                        </div>

                        <div>
                          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-yellow-300">
                            {item.eyebrow}
                          </p>

                          <h4 className="mt-2 text-xl font-extrabold text-white">
                            {item.title}
                          </h4>

                          <p className="mt-3 text-sm leading-7 text-purple-100 sm:text-base">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </motion.div>

            <motion.aside
              initial={
                shouldReduceMotion ? false : { opacity: 0, y: 22 }
              }
              whileInView={
                shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
              }
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                ...transition,
                delay: shouldReduceMotion ? 0 : 0.1,
              }}
              className="mt-6 overflow-hidden rounded-[32px] bg-yellow-300 p-7 text-[#281036] shadow-[0_24px_65px_rgba(253,224,71,0.16)] sm:p-8"
              aria-label="Our learning purpose"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#64278f]">
                What this means for your child
              </p>

              <p className="mt-3 max-w-4xl text-balance text-2xl font-extrabold leading-snug tracking-[-0.025em] sm:text-3xl">
                A child who is not only ready for the next classroom, but more
                confident about speaking, thinking, participating and trying
                independently.
              </p>
            </motion.aside>
          </div>
        </div>
      </div>
    </section>
  );
}