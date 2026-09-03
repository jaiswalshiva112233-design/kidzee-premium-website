"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Baby,
  BookOpenCheck,
  CheckCircle2,
  HeartHandshake,
  MessageCircleHeart,
  Sparkles,
} from "lucide-react";

const commitments = [
  {
    icon: Baby,
    title: "Children settle at their own pace",
    description:
      "We understand that starting preschool is a big transition. Children are welcomed gently and given the time, reassurance and familiarity they need.",
  },
  {
    icon: BookOpenCheck,
    title: "Learning remains meaningful",
    description:
      "Activities are planned around stories, movement, conversation, play and exploration so that children remain involved and interested.",
  },
  {
    icon: HeartHandshake,
    title: "Care is part of every routine",
    description:
      "Learning, meals, hygiene, transitions and play are handled with patience, consistency and attention to each child’s comfort.",
  },
  {
    icon: MessageCircleHeart,
    title: "Parents remain connected",
    description:
      "Relevant updates and regular communication help families understand how their child is settling, participating and progressing.",
  },
];

const everydayPriorities = [
  "Helping children feel secure and welcomed",
  "Encouraging communication and self-expression",
  "Building independence through simple routines",
  "Supporting social interaction and cooperation",
  "Preparing children gradually for formal schooling",
];

type AboutWelcomeProps = {
  imageUrl?: string;
  imageAlt?: string;
};

export default function AboutWelcome({
  imageUrl = "/images/landing/kidzee-creative-learning.jpg",
  imageAlt = "Children engaged in hands-on learning at Kidzee Sector 12, Dwarka",
}: AboutWelcomeProps) {
  return (
    <section
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
      aria-labelledby="about-welcome-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-36 top-24 h-80 w-80 rounded-full bg-purple-100/55 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-yellow-100/65 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.94fr_1.06fr] lg:gap-18 xl:gap-22">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[700px]"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-5 -rotate-2 rounded-[48px] bg-[#f2e7f7]"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-6 -right-5 h-36 w-36 rounded-[34px] bg-yellow-300/75"
            />

            <div className="relative overflow-hidden rounded-[38px] border-[8px] border-white bg-purple-50 shadow-[0_30px_85px_rgba(54,21,74,0.2)] sm:rounded-[46px]">
              <div className="relative min-h-[500px] sm:min-h-[640px]">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  unoptimized={imageUrl.startsWith("http")}
                  fill
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#25112e]/70 via-transparent to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="rounded-[28px] border border-white/20 bg-white/92 p-5 shadow-xl backdrop-blur-md sm:p-6">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                    A reassuring first school experience
                  </p>

                  <p className="mt-2 text-xl font-extrabold leading-snug text-[#281036] sm:text-2xl">
                    Children learn more confidently when they feel recognised,
                    comfortable and cared for.
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
              className="absolute -left-3 top-10 hidden rounded-[22px] border border-purple-100 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(57,26,68,0.15)] sm:block"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
                Every Child Matters
              </p>

              <p className="mt-1 text-lg font-extrabold text-[#281036]">
                Care before pressure
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
              <Sparkles size={16} aria-hidden="true" />
              Welcome to our preschool
            </div>

            <h2
              id="about-welcome-heading"
              className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
            >
              A place where the first years of learning feel{" "}
              <span className="text-[#702a96]">
                natural, joyful and reassuring
              </span>
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              At Kidzee Sector 12, Dwarka, we believe preschool should not feel
              rushed or overly formal. It should be a place where children are
              gradually introduced to routines, friendships, communication and
              learning in a way that feels comfortable and age-appropriate.
            </p>

            <p className="mt-4 text-base leading-8 text-slate-600 sm:text-lg">
              Our teachers take time to understand how each child responds,
              communicates and participates. This helps us support children
              more thoughtfully while encouraging curiosity, confidence and
              independence throughout the day.
            </p>

            <div className="mt-8 rounded-[30px] border border-purple-100 bg-[#fffaf2] p-6 shadow-[0_16px_42px_rgba(62,25,83,0.06)] sm:p-7">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                What we focus on every day
              </p>

              <div className="mt-5 space-y-4">
                {everydayPriorities.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#4b245c]">
                      <CheckCircle2
                        size={15}
                        strokeWidth={2.7}
                        aria-hidden="true"
                      />
                    </div>

                    <p className="font-semibold leading-7 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {commitments.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-[30px] border border-purple-100 bg-[#fffdf9] p-6 shadow-[0_16px_42px_rgba(62,25,83,0.07)] transition-shadow duration-300 hover:border-purple-200 hover:shadow-[0_24px_55px_rgba(62,25,83,0.13)] sm:p-7"
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-50 transition-transform duration-500 group-hover:scale-150"
                />

                <div className="relative">
                  <div className="flex h-13 w-13 items-center justify-center rounded-[18px] bg-[#702a96] text-white shadow-[0_10px_24px_rgba(112,42,150,0.22)] transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
                    <Icon size={23} strokeWidth={2.1} aria-hidden="true" />
                  </div>

                  <h3 className="mt-5 text-xl font-extrabold leading-7 text-[#281036]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}



