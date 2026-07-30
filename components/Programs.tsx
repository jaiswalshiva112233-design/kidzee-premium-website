"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Check,
  MessageCircle,
  Palette,
  Puzzle,
  School,
  Sparkles,
} from "lucide-react";

import { site } from "@/lib/site";

const programmes = [
  {
    name: "Playgroup",
    age: "2–3 years",
    slug: "/programmes/playgroup",
    image: "/images/programmes/playgroup.jpg",
    icon: Puzzle,
    label: "A comfortable beginning",
    title: "First steps into preschool, made gentle and reassuring.",
    description:
      "Our Playgroup programme helps young children settle into a regular routine, connect with teachers and begin exploring the world beyond home at their own pace.",
    highlights: [
      "Sensory and movement-based experiences",
      "Early vocabulary and communication",
      "Music, stories and group participation",
    ],
    outcome:
      "Children gradually feel secure in the classroom, express their needs more clearly and begin participating with confidence.",
  },
  {
    name: "Nursery",
    age: "3–4 years",
    slug: "/programmes/nursery",
    image: "/images/programmes/nursery.jpg",
    icon: Palette,
    label: "Curiosity takes shape",
    title: "Everyday discoveries become meaningful learning.",
    description:
      "Nursery introduces children to early language, numbers, patterns and classroom habits through conversation, guided play and practical activities.",
    highlights: [
      "Phonics and pre-reading readiness",
      "Numbers, shapes and simple patterns",
      "Creative expression and independence",
    ],
    outcome:
      "Children become more expressive, follow familiar routines independently and show growing interest in early concepts.",
  },
  {
    name: "Junior KG",
    age: "4–5 years",
    slug: "/programmes/junior-kg",
    image: "/images/programmes/junior-kg.jpg",
    icon: BookOpen,
    label: "Stronger foundations",
    title: "Clear concepts, confident communication and active thinking.",
    description:
      "Junior KG combines structured learning with exploration so children can strengthen literacy, numeracy and communication without losing the joy of discovery.",
    highlights: [
      "Phonics, vocabulary and early writing",
      "Number sense and logical thinking",
      "General awareness and confident expression",
    ],
    outcome:
      "Children begin handling classroom tasks with greater focus, explain their ideas more confidently and develop stronger academic foundations.",
  },
  {
    name: "Senior KG",
    age: "5–6 years",
    slug: "/programmes/senior-kg",
    image: "/images/programmes/senior-kg.jpg",
    icon: School,
    label: "Ready for the next step",
    title: "Thoughtful preparation for a smooth move to formal school.",
    description:
      "Senior KG supports school readiness through purposeful practice, independent work habits and age-appropriate challenges in literacy and numeracy.",
    highlights: [
      "Reading, writing and comprehension",
      "Mathematics and reasoning",
      "Responsibility and independent working",
    ],
    outcome:
      "Children approach primary school with better concentration, stronger communication and the confidence to manage a more structured classroom.",
  },
];

export default function Programs() {
  const programmeMessage = encodeURIComponent(
    "Hello Kidzee Sector 12 Dwarka, I would like help choosing the right preschool programme for my child."
  );

  const programmeWhatsApp = `https://wa.me/919667038673?text=${programmeMessage}`;

  return (
    <section
      id="programmes"
      aria-labelledby="programmes-heading"
      className="relative overflow-hidden bg-[#fffaf3] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-40 top-16 h-96 w-96 rounded-full bg-[#eadcf3]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-40 bottom-20 h-96 w-96 rounded-full bg-[#fff0b8]/70 blur-3xl"
      />

      <div className="container relative">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-4xl text-center"
        >
          <span className="eyebrow">
            <Sparkles size={15} aria-hidden="true" />
            Preschool programmes
          </span>

          <h2 id="programmes-heading" className="title mx-auto max-w-4xl">
            The right learning experience for every stage of early childhood.
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-[#6f6474] sm:text-lg">
            At Kidzee Sector 12, Dwarka, children move through each programme
            with familiar routines, age-appropriate challenges and the support
            they need to grow with confidence.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, delay: 0.08 }}
          className="relative mt-12 rounded-[30px] border border-[#eadff1] bg-white p-5 shadow-[0_18px_55px_rgba(71,35,91,0.07)] sm:p-7 lg:p-9"
        >
          <div
            aria-hidden="true"
            className="absolute left-[13%] right-[13%] top-[50px] hidden h-px bg-[#decbe9] lg:block"
          />

          <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {programmes.map((programme, index) => (
              <div
                key={programme.name}
                className="rounded-[22px] border border-[#eee4f3] bg-[#fffdf9] px-4 py-5 text-center"
              >
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[#5b2a86] text-sm font-extrabold text-white">
                  {index + 1}
                </span>

                <p className="mt-4 text-xs font-extrabold uppercase tracking-[0.14em] text-[#7a459c]">
                  {programme.age}
                </p>

                <h3 className="mt-2 text-xl font-extrabold text-[#311048]">
                  {programme.name}
                </h3>
              </div>
            ))}
          </div>
        </motion.div>

        <div className="mt-12 space-y-7 lg:mt-14">
          {programmes.map((programme, index) => {
            const Icon = programme.icon;
            const imageOnRight = index % 2 !== 0;

            return (
              <motion.article
                key={programme.name}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.12 }}
                transition={{ duration: 0.65 }}
                className="overflow-hidden rounded-[32px] border border-[#eadff1] bg-white shadow-[0_22px_60px_rgba(71,35,91,0.08)]"
              >
                <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
                  <div
                    className={`relative min-h-[330px] overflow-hidden sm:min-h-[400px] lg:min-h-[520px] ${
                      imageOnRight ? "lg:order-2" : ""
                    }`}
                  >
                    <Image
                      src={programme.image}
                      alt={`${programme.name} children learning at Kidzee Sector 12 Dwarka`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 46vw"
                      className="object-cover transition-transform duration-700 hover:scale-[1.03]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#25112f]/80 via-transparent to-transparent" />

                    <div className="absolute left-5 top-5 sm:left-7 sm:top-7">
                      <span className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-extrabold text-[#5b2a86] shadow-lg">
                        {programme.age}
                      </span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                      <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#f6c84b]">
                        {programme.label}
                      </p>

                      <p className="mt-2 max-w-xl text-2xl font-extrabold leading-snug text-white sm:text-3xl">
                        {programme.title}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`flex flex-col justify-center p-6 sm:p-9 lg:p-11 ${
                      imageOnRight ? "lg:order-1" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-5">
                      <div>
                        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#7a459c]">
                          Programme {index + 1}
                        </p>

                        <h3 className="mt-2 text-4xl font-extrabold tracking-[-0.035em] text-[#311048] sm:text-5xl">
                          {programme.name}
                        </h3>
                      </div>

                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#f3eaf9] text-[#5b2a86]">
                        <Icon size={26} aria-hidden="true" />
                      </div>
                    </div>

                    <p className="mt-6 text-base leading-8 text-[#6f6474]">
                      {programme.description}
                    </p>

                    <div className="mt-7 border-t border-[#eee5f2] pt-6">
                      <p className="text-sm font-extrabold text-[#311048]">
                        What children explore
                      </p>

                      <ul className="mt-4 space-y-3">
                        {programme.highlights.map((highlight) => (
                          <li
                            key={highlight}
                            className="flex items-start gap-3 text-sm font-semibold leading-6 text-[#55495a] sm:text-base"
                          >
                            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#f6c84b] text-[#311048]">
                              <Check
                                size={15}
                                strokeWidth={3}
                                aria-hidden="true"
                              />
                            </span>

                            {highlight}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-7 rounded-[22px] bg-[#fff8e8] p-5">
                      <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#7a459c]">
                        Progress parents can notice
                      </p>

                      <p className="mt-3 text-sm leading-7 text-[#5f5364] sm:text-base">
                        {programme.outcome}
                      </p>
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                      <Link href={programme.slug} className="btn btn-primary">
                        Explore {programme.name}
                        <ArrowRight size={18} aria-hidden="true" />
                      </Link>

                      <a
                        href={programmeWhatsApp}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                      >
                        <MessageCircle size={18} aria-hidden="true" />
                        Ask about this programme
                      </a>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6 }}
          className="mt-10 overflow-hidden rounded-[32px] bg-[#311048] px-6 py-10 text-white shadow-[0_22px_60px_rgba(49,16,72,0.2)] sm:px-9 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#f6c84b]">
              Choosing a programme
            </p>

            <h3 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] sm:text-4xl">
              Unsure which programme is suitable for your child?
            </h3>

            <p className="mt-4 max-w-2xl leading-7 text-white/75">
              Share your child’s age with our team or plan a visit to understand
              the classroom routine before beginning admission.
            </p>
          </div>

          <div className="mt-7 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0 lg:flex-col">
            <a
              href={programmeWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="btn bg-[#f6c84b] text-[#311048] hover:bg-[#ffda69]"
            >
              Get programme guidance
              <ArrowRight size={18} aria-hidden="true" />
            </a>

            <a
              href={`tel:${site.phone}`}
              className="text-center text-sm font-extrabold text-white underline decoration-white/40 underline-offset-4 transition hover:decoration-white"
            >
              Call {site.phoneDisplay}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}