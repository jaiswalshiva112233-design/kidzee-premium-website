"use client";

import { motion } from "framer-motion";
import {
  Blocks,
  Brain,
  GraduationCap,
  HandHeart,
  MessageCircleMore,
} from "lucide-react";

const trustItems = [
  {
    icon: Brain,
    title: "Early-years expertise",
    text: "Learning experiences designed around how young children naturally develop.",
  },
  {
    icon: Blocks,
    title: "Learning through play",
    text: "Stories, movement, exploration and hands-on activities make learning meaningful.",
  },
  {
    icon: GraduationCap,
    title: "School readiness",
    text: "Children gradually build communication, independence and classroom confidence.",
  },
  {
    icon: HandHeart,
    title: "Individual understanding",
    text: "Each child is supported according to their personality, pace and interests.",
  },
  {
    icon: MessageCircleMore,
    title: "Parent partnership",
    text: "Regular communication helps families stay connected with their child’s progress.",
  },
];

export default function TrustBar() {
  return (
    <section
      className="relative overflow-hidden bg-[#fffaf2] py-16 sm:py-20"
      aria-labelledby="trust-heading"
    >
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 h-px w-[85%] -translate-x-1/2 bg-gradient-to-r from-transparent via-purple-200 to-transparent"
      />

      <div
        aria-hidden="true"
        className="absolute -left-28 bottom-0 h-64 w-64 rounded-full bg-purple-100/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-28 top-0 h-64 w-64 rounded-full bg-yellow-100/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm">
            <span
              aria-hidden="true"
              className="h-2 w-2 rounded-full bg-yellow-400"
            />

            The foundation of our approach
          </div>

          <h2
            id="trust-heading"
            className="mt-6 text-balance text-3xl font-extrabold leading-tight tracking-[-0.035em] text-[#281036] sm:text-4xl lg:text-[48px]"
          >
            Thoughtful early learning that supports the{" "}
            <span className="text-[#702a96]">whole child</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            Our daily experiences are planned to help children become curious,
            expressive, independent and comfortable in a learning environment.
          </p>
        </motion.div>

        <div className="mt-11 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {trustItems.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.07,
                  ease: "easeOut",
                }}
                whileHover={{ y: -6 }}
                className="group relative overflow-hidden rounded-[28px] border border-purple-100 bg-white p-6 shadow-[0_14px_38px_rgba(62,25,83,0.07)] transition-shadow duration-300 hover:border-purple-200 hover:shadow-[0_22px_50px_rgba(62,25,83,0.13)]"
              >
                <div
                  aria-hidden="true"
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-purple-50 transition-transform duration-500 group-hover:scale-150"
                />

                <div className="relative">
                  <div className="flex h-13 w-13 items-center justify-center rounded-[18px] bg-[#702a96] text-white shadow-[0_10px_25px_rgba(112,42,150,0.22)] transition duration-300 group-hover:-rotate-3 group-hover:scale-105">
                    <Icon size={23} strokeWidth={2.1} />
                  </div>

                  <h3 className="mt-5 text-lg font-extrabold leading-6 text-[#32153f]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>

                <div
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-1 w-0 rounded-full bg-yellow-300 transition-all duration-500 group-hover:w-full"
                />
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}