"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

const reasons = [
  {
    icon: UsersRound,
    title: "Smaller Groups, More Individual Attention",
    description:
      "Smaller class groups allow teachers to understand every child’s learning style, encourage participation and provide personalised guidance throughout the day.",
  },
  {
    icon: UserRoundCheck,
    title: "Caring Teachers Throughout the Day",
    description:
      "Our experienced educators create a warm, supportive atmosphere where children feel comfortable asking questions, exploring new ideas and building confidence.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Secure Campus",
    description:
      "A thoughtfully managed campus, secure entry procedures and a child-focused environment help families feel confident every school day.",
  },
  {
    icon: BellRing,
    title: "Structured Learning Routine",
    description:
      "A balanced daily routine combines learning, play, creative exploration and rest, helping children develop confidence, independence and positive habits.",
  },
  {
    icon: HeartHandshake,
    title: "Open Parent Communication",
    description:
      "Regular conversations and timely updates ensure parents stay connected with their child’s progress, milestones and everyday experiences.",
  },
  {
    icon: CheckCircle2,
    title: "Clean & Child-Friendly Spaces",
    description:
      "Bright classrooms, organised learning areas and high standards of cleanliness create a comfortable environment where children can learn and play with confidence.",
  },
];

const highlights = [
  "Gentle settling-in support for every child",
  "Caring teachers who know every child personally",
  "Safe, organised and nurturing learning environment",
];

export default function WhyChooseUs() {
  const whatsappMessage = encodeURIComponent(
    "Hello, I would like to schedule a school visit at Kidzee Sector 12, Dwarka."
  );

  const whatsappLink = `https://wa.me/919667038673?text=${whatsappMessage}`;

  return (
    <section
      id="why-choose-us"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
      aria-labelledby="why-choose-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-36 top-20 h-80 w-80 rounded-full bg-purple-100/55 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-yellow-100/65 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
              <Sparkles size={16} aria-hidden="true" />
              Why Choose Us
            </div>

            <h2
              id="why-choose-heading"
              className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
            >
              More Than a Preschool.{" "}
              <span className="text-[#702a96]">
                A Place Where Children Feel Safe, Happy & Confident.
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Every parent wants a place where their child feels welcomed,
              encouraged and cared for every single day. At Kidzee Sector 12,
              Dwarka, we create a nurturing environment where children learn
              through meaningful experiences, build confidence at their own pace
              and enjoy coming to school. Our caring educators and thoughtfully
              planned routines help children feel secure, while parents enjoy
              the reassurance of knowing their little one is in safe and capable
              hands.
            </p>

            <div className="mt-8 space-y-4">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#4b245c]">
                    <CheckCircle2
                      size={15}
                      strokeWidth={2.6}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-base font-semibold leading-7 text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-9 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#64278f] px-7 text-base font-bold text-white shadow-[0_14px_30px_rgba(100,39,143,0.24)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#512071] hover:shadow-[0_18px_38px_rgba(100,39,143,0.3)]"
              aria-label="Schedule your school visit on WhatsApp"
            >
              Schedule Your School Visit
              <ArrowRight size={18} aria-hidden="true" />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[760px]"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-5 -rotate-2 rounded-[46px] bg-purple-100/75"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-7 -right-5 h-36 w-36 rounded-[34px] bg-yellow-300/75"
            />

            <div className="relative overflow-hidden rounded-[36px] border-[8px] border-white bg-purple-50 shadow-[0_30px_85px_rgba(54,21,74,0.2)] sm:rounded-[46px]">
              <div className="relative min-h-[520px] sm:min-h-[620px]">
                <Image
                  src="/images/why-choose-us/classroom.jpg"
                  alt="Teacher supporting children in a classroom at Kidzee Sector 12, Dwarka"
                  fill
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#24112d]/70 via-transparent to-transparent" />
              </div>

              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                <div className="rounded-[26px] border border-white/20 bg-white/92 p-5 shadow-xl backdrop-blur-md sm:p-6">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                    Trusted by Dwarka Families
                  </p>

                  <p className="mt-2 text-xl font-extrabold leading-snug text-[#281036] sm:text-2xl">
                    A warm and nurturing environment where every child feels
                    valued, encouraged and excited to learn every day.
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
              className="absolute -left-4 top-10 hidden rounded-[22px] border border-purple-100 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(57,26,68,0.15)] sm:block"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
                Personal Attention
              </p>

              <p className="mt-1 text-lg font-extrabold text-[#281036]">
                Smaller Groups
              </p>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, index) => {
            const Icon = reason.icon;

            return (
              <motion.article
                key={reason.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
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

                  <h3 className="mt-5 text-xl font-extrabold text-[#281036]">
                    {reason.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                    {reason.description}
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