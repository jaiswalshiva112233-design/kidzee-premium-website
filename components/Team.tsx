"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  BookOpenCheck,
  HeartHandshake,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

const teamHighlights = [
  {
    icon: HeartHandshake,
    title: "A patient, reassuring approach",
    description:
      "Teachers give children time to settle, participate and express themselves without unnecessary pressure.",
  },
  {
    icon: Baby,
    title: "Attention to individual needs",
    description:
      "Each child’s comfort, communication style, interests and pace are considered during the school day.",
  },
  {
    icon: BookOpenCheck,
    title: "Thoughtful classroom guidance",
    description:
      "Educators guide activities with clear routines while giving children space to explore and respond independently.",
  },
  {
    icon: MessageCircleHeart,
    title: "Meaningful parent communication",
    description:
      "Parents receive relevant feedback about adjustment, participation, routine and areas that may need support.",
  },
];

const dailySupport = [
  "Welcoming children and helping them settle",
  "Guiding classroom activities and routines",
  "Observing participation and development",
  "Supporting communication and social interaction",
  "Managing meals, hygiene and comfort",
  "Sharing relevant updates with parents",
];

export default function Team() {
  const visitMessage = encodeURIComponent(
    "Hello, I would like to book a school visit and meet the team at Kidzee Sector 12, Dwarka."
  );

  const visitLink = `https://wa.me/919667038673?text=${visitMessage}`;

  return (
    <section
      id="team"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
      aria-labelledby="team-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-purple-100/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-12 h-96 w-96 rounded-full bg-yellow-100/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
            <Sparkles size={16} />
            The people children trust
          </div>

          <h2
            id="team-heading"
            className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
          >
            Caring adults make the{" "}
            <span className="text-[#702a96]">
              biggest difference to a child’s day
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Our teachers and support staff work together to help children feel
            welcomed, understood and comfortable enough to participate,
            communicate and learn.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.div
            initial={{ opacity: 0, x: -26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[36px] bg-[#2d1636] p-7 text-white shadow-[0_28px_75px_rgba(45,22,54,0.22)] sm:p-9 lg:p-10"
          >
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-purple-500/25 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-24 left-8 h-56 w-56 rounded-full bg-yellow-300/10 blur-3xl"
            />

            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-yellow-300 text-[#281036] shadow-[0_12px_30px_rgba(253,224,71,0.18)]">
                <UsersRound size={25} strokeWidth={2.1} />
              </div>

              <p className="mt-6 text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300">
                Our approach to children
              </p>

              <h3 className="mt-3 max-w-2xl text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
                Connection comes before instruction
              </h3>

              <p className="mt-5 max-w-2xl leading-8 text-purple-100">
                Young children participate more naturally when they recognise
                the adults around them, understand the routine and feel secure.
                Our team focuses first on building that familiarity and trust.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                  <Baby size={22} className="text-yellow-300" />

                  <h4 className="mt-4 font-extrabold text-white">
                    Gentle settling support
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-purple-100">
                    Children are given time and reassurance as they become
                    familiar with the school routine.
                  </p>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                  <ShieldCheck size={22} className="text-yellow-300" />

                  <h4 className="mt-4 font-extrabold text-white">
                    Consistent daily care
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-purple-100">
                    Teachers and support staff coordinate classroom, hygiene,
                    meal and transition routines.
                  </p>
                </div>
              </div>

              <a
                href={visitLink}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-extrabold text-[#64278f] transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-300 hover:text-[#281036]"
              >
                Meet the Team During Your Visit
                <ArrowRight size={17} />
              </a>
            </div>
          </motion.div>

          <div className="grid gap-5 sm:grid-cols-2">
            {teamHighlights.map((item, index) => {
              const Icon = item.icon;

              return (
                <motion.article
                  key={item.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.06,
                    ease: "easeOut",
                  }}
                  whileHover={{ y: -6 }}
                  className="group rounded-[30px] border border-purple-100 bg-[#fffaf2] p-6 shadow-[0_14px_38px_rgba(62,25,83,0.06)] transition duration-300 hover:border-purple-200 hover:shadow-[0_24px_55px_rgba(62,25,83,0.12)] sm:p-7"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-purple-100 text-[#702a96] transition duration-300 group-hover:-rotate-3 group-hover:bg-[#702a96] group-hover:text-white">
                    <Icon size={24} strokeWidth={2.1} />
                  </div>

                  <h3 className="mt-5 text-xl font-extrabold leading-7 text-[#281036]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    {item.description}
                  </p>
                </motion.article>
              );
            })}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-8 overflow-hidden rounded-[34px] border border-purple-100 bg-[#faf7fc] p-7 shadow-[0_18px_50px_rgba(67,38,76,0.08)] sm:p-9 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <div className="flex h-13 w-13 items-center justify-center rounded-[18px] bg-[#702a96] text-white">
                <BookOpenCheck size={23} />
              </div>

              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                Working together each day
              </p>

              <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036]">
                Support that continues throughout the routine
              </h3>

              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                The team’s role extends beyond conducting activities. It
                includes observing, reassuring, communicating and helping
                children manage everyday transitions comfortably.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {dailySupport.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.04,
                  }}
                  className="flex items-start gap-3 rounded-[22px] border border-purple-100 bg-white p-4 shadow-[0_8px_24px_rgba(62,25,83,0.04)]"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#702a96] text-xs font-extrabold text-white">
                    ✓
                  </div>

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