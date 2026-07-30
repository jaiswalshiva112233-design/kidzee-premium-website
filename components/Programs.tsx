"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  MessageCircle,
  Palette,
  Puzzle,
  School,
  Sparkles,
} from "lucide-react";

import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const programmes = [
  {
    name: "Playgroup",
    age: "2–3 years",
    slug: "/programmes/playgroup",
    image: "/images/programmes/playgroup.jpg",
    icon: Puzzle,
    summary:
      "A gentle introduction to preschool routines, communication, movement and learning with others.",
    highlights: ["Settling-in support", "Language and sensory play"],
  },
  {
    name: "Nursery",
    age: "3–4 years",
    slug: "/programmes/nursery",
    image: "/images/programmes/nursery.jpg",
    icon: Palette,
    summary:
      "Playful early learning that introduces phonics, numbers, creativity and independent classroom habits.",
    highlights: ["Early literacy and numeracy", "Creative expression"],
  },
  {
    name: "Junior KG",
    age: "4–5 years",
    slug: "/programmes/junior-kg",
    image: "/images/programmes/junior-kg.jpg",
    icon: BookOpen,
    summary:
      "Stronger foundations in language, mathematics, awareness and confident classroom participation.",
    highlights: ["Concept-building", "Communication and early writing"],
  },
  {
    name: "Senior KG",
    age: "5–6 years",
    slug: "/programmes/senior-kg",
    image: "/images/programmes/senior-kg.jpg",
    icon: School,
    summary:
      "Thoughtful preparation for primary school through structured learning and greater independence.",
    highlights: ["School readiness", "Reading, writing and reasoning"],
  },
];

const transition = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function Programs() {
  const shouldReduceMotion = useReducedMotion();

  const programmeMessage = encodeURIComponent(
    "Hello Kidzee Sector 12 Dwarka, I would like help choosing the right preschool programme for my child."
  );

  const programmeWhatsApp = `${site.whatsappBase}?text=${programmeMessage}`;

  return (
    <section
      id="programmes"
      aria-labelledby="programmes-heading"
      className="relative isolate overflow-hidden bg-[#fffaf3] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-40 top-16 -z-10 h-96 w-96 rounded-full bg-[#eadcf3]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-40 bottom-20 -z-10 h-96 w-96 rounded-full bg-[#fff0b8]/70 blur-3xl"
      />

      <Container>
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={
            shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
          }
          viewport={{ once: true, amount: 0.2 }}
          transition={transition}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#ddcce8] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-[#5b2a86] shadow-sm">
            <Sparkles size={15} aria-hidden="true" />
            Preschool programmes
          </div>

          <h2
            id="programmes-heading"
            className="mt-6 text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-[#2c1735] sm:text-5xl lg:text-[56px]"
          >
            Learning planned for each stage between{" "}
            <span className="text-[#5b2a86]">two and six years</span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#6f6474] sm:text-lg">
            Each programme builds on what children are ready to understand and
            practise at their age, while keeping stories, conversation,
            movement and hands-on learning part of the school day.
          </p>
        </motion.header>

        <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {programmes.map((programme, index) => {
            const Icon = programme.icon;

            return (
              <motion.article
                key={programme.name}
                initial={
                  shouldReduceMotion ? false : { opacity: 0, y: 24 }
                }
                whileInView={
                  shouldReduceMotion
                    ? undefined
                    : { opacity: 1, y: 0 }
                }
                viewport={{ once: true, amount: 0.16 }}
                transition={{
                  ...transition,
                  duration: 0.5,
                  delay: shouldReduceMotion ? 0 : index * 0.06,
                }}
                whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                className="group flex h-full flex-col overflow-hidden rounded-[30px] border border-[#eadff1] bg-white shadow-[0_16px_46px_rgba(71,35,91,0.08)] transition-[border-color,box-shadow] duration-300 hover:border-[#d8c5e4] hover:shadow-[0_24px_60px_rgba(71,35,91,0.14)]"
              >
                <div className="relative aspect-[1.35/1] overflow-hidden">
                  <Image
                    src={programme.image}
                    alt={`${programme.name} classroom experience at Kidzee Sector 12 Dwarka`}
                    fill
                    sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#281036]/65 via-transparent to-transparent"
                  />

                  <div className="absolute left-5 top-5 rounded-full bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#5b2a86] shadow-md backdrop-blur">
                    {programme.age}
                  </div>

                  <div className="absolute bottom-5 left-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f6c84b] text-[#32153f] shadow-lg">
                    <Icon size={22} aria-hidden="true" />
                  </div>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7a459c]">
                    Programme {index + 1}
                  </p>

                  <h3 className="mt-2 text-2xl font-black tracking-[-0.025em] text-[#311048]">
                    {programme.name}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#665a6b]">
                    {programme.summary}
                  </p>

                  <ul className="mt-5 space-y-3 border-t border-[#eee5f2] pt-5">
                    {programme.highlights.map((highlight) => (
                      <li
                        key={highlight}
                        className="flex items-start gap-2.5 text-sm font-semibold leading-6 text-[#55495a]"
                      >
                        <CheckCircle2
                          size={17}
                          strokeWidth={2.4}
                          aria-hidden="true"
                          className="mt-1 shrink-0 text-[#5b2a86]"
                        />
                        {highlight}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={programme.slug}
                    aria-label={`Learn more about the ${programme.name} programme`}
                    className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#5b2a86] transition-colors hover:text-[#431d60] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f6c84b]/45"
                  >
                    View {programme.name}
                    <ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={
            shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
          }
          viewport={{ once: true, amount: 0.2 }}
          transition={transition}
          className="mt-10 overflow-hidden rounded-[32px] bg-[#311048] px-6 py-8 text-white shadow-[0_22px_60px_rgba(49,16,72,0.2)] sm:px-9 sm:py-9 lg:flex lg:items-center lg:justify-between lg:gap-10 lg:px-12"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#f6c84b]">
              Not sure where to begin?
            </p>

            <h3 className="mt-3 text-balance text-2xl font-black tracking-[-0.03em] sm:text-3xl">
              Tell us your child’s age and we’ll guide you to the right
              programme.
            </h3>

            <p className="mt-3 max-w-2xl leading-7 text-white/75">
              Parents can also visit the centre and understand the classroom
              routine before deciding.
            </p>
          </div>

          <div className="mt-7 flex shrink-0 flex-col gap-3 sm:flex-row lg:mt-0">
            <Link
              href="/programmes"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#f6c84b] px-6 text-sm font-black text-[#311048] transition hover:-translate-y-0.5 hover:bg-[#ffda69] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              Compare all programmes
              <ArrowRight size={17} aria-hidden="true" />
            </Link>

            <a
              href={programmeWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              <MessageCircle size={17} aria-hidden="true" />
              Ask on WhatsApp
            </a>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}