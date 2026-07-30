"use client";

import { motion } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  Puzzle,
  Sparkles,
  UsersRound,
} from "lucide-react";

const learningMinds = [
  {
    icon: Brain,
    title: "Critical Thinking",
    description:
      "Children are encouraged to observe, ask questions, make connections and solve simple problems through guided experiences.",
  },
  {
    icon: Lightbulb,
    title: "Creative Thinking",
    description:
      "Art, stories, pretend play and open-ended activities give children space to imagine, express and create.",
  },
  {
    icon: HeartHandshake,
    title: "Social Thinking",
    description:
      "Group activities help children practise listening, sharing, turn-taking, cooperation and respectful communication.",
  },
  {
    icon: GraduationCap,
    title: "Communication Skills",
    description:
      "Conversations, rhymes, storytelling and classroom participation gradually strengthen language and confidence.",
  },
  {
    icon: Puzzle,
    title: "Independent Thinking",
    description:
      "Children are supported in making age-appropriate choices, completing routines and taking responsibility for simple tasks.",
  },
];

const approachPoints = [
  "Learning experiences suited to each age group",
  "Play, stories, movement and hands-on exploration",
  "Balanced attention to academic and life skills",
  "Opportunities to communicate, create and participate",
  "Gradual preparation for formal schooling",
];

export default function AboutKidzee() {
  return (
    <section
      className="relative overflow-hidden bg-[#2d1636] py-20 text-white sm:py-24 lg:py-28"
      aria-labelledby="about-kidzee-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-36 top-20 h-96 w-96 rounded-full bg-purple-500/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-yellow-300/10 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-px w-[85%] -translate-x-1/2 bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:gap-18 xl:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="lg:sticky lg:top-28"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-yellow-300 backdrop-blur">
              <Sparkles size={16} aria-hidden="true" />
              The Kidzee learning approach
            </div>

            <h2
              id="about-kidzee-heading"
              className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-[58px]"
            >
              Early learning designed to develop{" "}
              <span className="text-yellow-300">
                more than academic readiness
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
              At Kidzee Sector 12, Dwarka, children learn through experiences
              that involve thinking, movement, communication, creativity and
              interaction. The goal is not simply to complete worksheets, but to
              help children understand, participate and apply what they learn.
            </p>

            <p className="mt-4 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
              Our classroom approach supports the development of important
              early-years abilities while allowing children to learn at a pace
              that remains comfortable and appropriate for their age.
            </p>

            <div className="mt-8 rounded-[30px] border border-white/10 bg-white/[0.07] p-6 backdrop-blur sm:p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-yellow-300 text-[#281036]">
                  <UsersRound size={23} aria-hidden="true" />
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-yellow-300">
                    Child-centred learning
                  </p>

                  <h3 className="mt-1 text-xl font-extrabold text-white">
                    Every activity has a developmental purpose
                  </h3>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {approachPoints.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                      <CheckCircle2
                        size={15}
                        strokeWidth={2.7}
                        aria-hidden="true"
                      />
                    </div>

                    <p className="font-semibold leading-7 text-purple-50">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="rounded-[36px] border border-white/10 bg-white/[0.06] p-7 backdrop-blur sm:p-9 lg:p-10"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300">
                Five areas of growing minds
              </p>

              <h3 className="mt-3 max-w-3xl text-3xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                Helping children think, communicate, create and participate
              </h3>

              <p className="mt-4 max-w-3xl leading-8 text-purple-100">
                Children develop through many connected abilities. Our learning
                experiences are planned to encourage these areas together rather
                than treating them as separate classroom subjects.
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2">
                {learningMinds.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.article
                      key={item.title}
                      initial={{ opacity: 0, y: 22 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.06,
                        ease: "easeOut",
                      }}
                      whileHover={{ y: -6 }}
                      className={`group rounded-[28px] border border-white/10 bg-white/[0.07] p-6 transition duration-300 hover:border-yellow-300/35 hover:bg-white/[0.1] ${
                        index === learningMinds.length - 1
                          ? "sm:col-span-2"
                          : ""
                      }`}
                    >
                      <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-yellow-300 text-[#281036] transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
                        <Icon size={24} strokeWidth={2.1} aria-hidden="true" />
                      </div>

                      <h4 className="mt-5 text-xl font-extrabold text-white">
                        {item.title}
                      </h4>

                      <p className="mt-3 text-sm leading-7 text-purple-100 sm:text-base">
                        {item.description}
                      </p>
                    </motion.article>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
              className="mt-6 rounded-[32px] bg-yellow-300 p-7 text-[#281036] shadow-[0_24px_60px_rgba(253,224,71,0.16)] sm:p-8"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#64278f]">
                Our purpose
              </p>

              <p className="mt-3 text-2xl font-extrabold leading-snug tracking-[-0.025em] sm:text-3xl">
                To help every child leave preschool more confident, expressive,
                independent and ready for the next stage of learning.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}