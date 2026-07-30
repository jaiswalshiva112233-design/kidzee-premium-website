"use client";

import { motion } from "framer-motion";
import {
  Baby,
  Heart,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";

const trustPoints = [
  {
    icon: UsersRound,
    title: "Closer attention",
    description:
      "A small-group approach helps teachers understand each child’s confidence, comfort and learning pace.",
  },
  {
    icon: Heart,
    title: "Warm daily care",
    description:
      "Children receive patient guidance, emotional support and age-appropriate encouragement throughout the day.",
  },
  {
    icon: ShieldCheck,
    title: "Safety-focused routines",
    description:
      "Supervised entry, exit, handover and daily classroom routines help create a secure environment.",
  },
  {
    icon: MessageCircleHeart,
    title: "Parent communication",
    description:
      "Parents receive regular feedback about classroom participation, habits, progress and daily experiences.",
  },
];

const parentPromises = [
  "A welcoming environment for children and parents",
  "Clear communication about routines and progress",
  "Support during settling and transition",
  "Respect for every child’s individual pace",
  "A balance of learning, play and care",
  "Guidance before and after admission",
];

export default function ParentExperience() {
  return (
    <section
      id="parent-experience"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
    >
      <div className="absolute -left-28 top-20 h-80 w-80 rounded-full bg-purple-100/60 blur-3xl" />
      <div className="absolute -right-28 bottom-12 h-80 w-80 rounded-full bg-yellow-100/70 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#6d2785]">
            <Sparkles size={16} />
            Parent Experience
          </div>

          <h2 className="mt-6 text-4xl font-black leading-tight tracking-[-0.04em] text-[#2c1735] sm:text-5xl">
            A preschool experience built on
            <span className="block text-[#6d2785]">
              trust, care and communication
            </span>
          </h2>

          <p className="mt-5 text-lg leading-8 text-slate-600">
            Parents should feel informed, supported and confident about where
            their child spends the day.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="grid gap-5 sm:grid-cols-2"
          >
            {trustPoints.map((point, index) => {
              const Icon = point.icon;

              return (
                <motion.article
                  key={point.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.06,
                  }}
                  className="group rounded-[30px] border border-purple-100 bg-[#fffaf2] p-6 shadow-[0_12px_35px_rgba(67,38,76,0.06)] transition duration-300 hover:-translate-y-2 hover:border-[#6d2785]/25 hover:shadow-[0_22px_50px_rgba(67,38,76,0.12)]"
                >
                  <div className="flex h-13 w-13 items-center justify-center rounded-[18px] bg-white text-[#6d2785] shadow-sm transition duration-300 group-hover:bg-[#6d2785] group-hover:text-white">
                    <Icon size={24} />
                  </div>

                  <h3 className="mt-5 text-xl font-black leading-7 text-[#2c1735]">
                    {point.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {point.description}
                  </p>
                </motion.article>
              );
            })}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65 }}
            className="overflow-hidden rounded-[36px] bg-[#2d1636] p-7 text-white shadow-[0_28px_75px_rgba(45,22,54,0.22)] sm:p-9 lg:p-10"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-yellow-300 text-[#2c1735]">
                <Star size={25} fill="currentColor" />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300">
                  Our promise to parents
                </p>

                <h3 className="mt-2 text-3xl font-black leading-tight tracking-[-0.03em]">
                  Support before, during and after admission
                </h3>
              </div>
            </div>

            <p className="mt-6 leading-8 text-purple-100">
              Choosing a preschool is an important decision. Our team aims to
              make the process clear, comfortable and reassuring for every
              family.
            </p>

            <div className="mt-8 space-y-4">
              {parentPromises.map((promise) => (
                <div
                  key={promise}
                  className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/[0.07] p-4"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#2c1735]">
                    <span className="text-xs font-black">✓</span>
                  </div>

                  <p className="text-sm font-semibold leading-6 text-white">
                    {promise}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-[26px] border border-white/10 bg-white/[0.07] p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#6d2785]">
                  <Baby size={21} />
                </div>

                <div>
                  <p className="font-black text-white">
                    Every child settles differently
                  </p>

                  <p className="mt-2 text-sm leading-6 text-purple-100">
                    Our team works with parents to support the child’s
                    adjustment, comfort and daily routine.
                  </p>
                </div>
              </div>
            </div>

            <a
              href="#book-a-visit"
              className="mt-8 inline-flex items-center justify-center rounded-full bg-white px-6 py-3.5 text-sm font-bold text-[#6d2785] transition hover:-translate-y-0.5 hover:bg-yellow-300 hover:text-[#2c1735]"
            >
              Visit and Meet Our Team
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}