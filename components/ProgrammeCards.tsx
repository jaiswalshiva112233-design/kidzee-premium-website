"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const programmes = [
  {
    title: "Playgroup",
    age: "2–3 years",
    href: "/programmes/playgroup",
    image: "/images/programmes/playgroup.jpg",
    icon: Baby,
    label: "First preschool experience",
    description:
      "A warm and reassuring beginning where children build comfort, communication, social confidence and familiarity with simple classroom routines.",
    focusAreas: [
      "Settling and emotional comfort",
      "Language through songs and stories",
      "Sensory and movement activities",
      "Sharing and group participation",
    ],
  },
  {
    title: "Nursery",
    age: "3–4 years",
    href: "/programmes/nursery",
    image: "/images/programmes/nursery.jpg",
    icon: BookOpenCheck,
    label: "Building learning foundations",
    description:
      "An active programme that introduces early language, numeracy, creativity and independence through play-based and hands-on learning.",
    focusAreas: [
      "Vocabulary and phonics readiness",
      "Early number concepts",
      "Fine and gross motor development",
      "Confidence in classroom participation",
    ],
  },
  {
    title: "Junior KG",
    age: "4–5 years",
    href: "/programmes/junior-kg",
    image: "/images/programmes/junior-kg.jpg",
    icon: GraduationCap,
    label: "Growing skills and confidence",
    description:
      "A balanced programme that strengthens early reading, writing, numeracy, communication and independent classroom habits.",
    focusAreas: [
      "Phonics and early reading",
      "Writing readiness",
      "Number sense and patterns",
      "Problem-solving and expression",
    ],
  },
  {
    title: "Senior KG",
    age: "5–6 years",
    href: "/programmes/senior-kg",
    image: "/images/programmes/senior-kg.jpg",
    icon: GraduationCap,
    label: "Preparing for formal school",
    description:
      "A structured school-readiness programme that helps children become more confident, independent and prepared for primary school.",
    focusAreas: [
      "Reading and sentence formation",
      "Writing and comprehension",
      "Numeracy and logical thinking",
      "School routines and independence",
    ],
  },
];

export default function ProgrammeCards() {
  return (
    <section
      className="relative overflow-hidden bg-[#faf8ff] py-20 sm:py-24 lg:py-28"
      aria-labelledby="programme-cards-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-32 h-80 w-80 rounded-full bg-purple-200/35 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-36 bottom-10 h-96 w-96 rounded-full bg-yellow-200/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm">
            <Sparkles size={16} aria-hidden="true" />
            Explore our preschool programmes
          </div>

          <h2
            id="programme-cards-heading"
            className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
          >
            Four age-specific programmes,{" "}
            <span className="text-[#702a96]">
              one connected learning journey
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Each programme responds to the developmental needs of its age group
            while preparing children naturally and confidently for the next
            stage.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-7 lg:grid-cols-2">
          {programmes.map((programme, index) => {
            const Icon = programme.icon;

            return (
              <motion.article
                key={programme.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{
                  duration: 0.58,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
                className="group overflow-hidden rounded-[36px] border border-purple-100 bg-white shadow-[0_18px_50px_rgba(62,25,83,0.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_68px_rgba(62,25,83,0.14)]"
              >
                <div className="grid h-full md:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative min-h-[320px] overflow-hidden md:min-h-full">
                    <Image
                      src={programme.image}
                      alt={`${programme.title} children learning at Kidzee Sector 12 Dwarka`}
                      fill
                      sizes="(max-width: 768px) 100vw, 40vw"
                      className="object-cover transition duration-700 group-hover:scale-[1.04]"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-[#281036]/65 via-transparent to-transparent" />

                    <div className="absolute left-5 top-5">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/90 px-4 py-2 text-xs font-extrabold text-[#702a96] shadow-lg backdrop-blur">
                        <CalendarDays size={15} aria-hidden="true" />
                        {programme.age}
                      </div>
                    </div>

                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="inline-flex h-13 w-13 items-center justify-center rounded-[18px] bg-yellow-300 text-[#281036] shadow-lg">
                        <Icon size={24} strokeWidth={2.1} aria-hidden="true" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col p-6 sm:p-7 lg:p-8">
                    <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
                      {programme.label}
                    </p>

                    <h3 className="mt-3 text-3xl font-extrabold tracking-[-0.03em] text-[#281036] sm:text-4xl">
                      {programme.title}
                    </h3>

                    <p className="mt-4 text-sm leading-7 text-slate-600 sm:text-base">
                      {programme.description}
                    </p>

                    <div className="mt-6 space-y-3">
                      {programme.focusAreas.map((area) => (
                        <div key={area} className="flex items-start gap-3">
                          <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />

                          <p className="text-sm font-semibold leading-6 text-slate-700">
                            {area}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-auto pt-7">
                      <Link
                        href={programme.href}
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#64278f] px-6 text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(100,39,143,0.2)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#522071]"
                      >
                        View {programme.title}
                        <ArrowRight size={17} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-14 rounded-[34px] border border-purple-100 bg-white p-7 shadow-[0_16px_46px_rgba(62,25,83,0.07)] sm:p-9"
        >
          <div className="grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#702a96]">
                Choosing the correct programme
              </p>

              <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036] sm:text-4xl">
                Age provides the starting point, and your child’s readiness
                helps complete the decision
              </h3>

              <p className="mt-4 max-w-3xl leading-8 text-slate-600">
                Our team can help parents understand the most suitable
                programme based on age, previous preschool experience,
                communication, comfort and current learning needs.
              </p>
            </div>

            <Link
              href="/contact"
              className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-7 text-base font-extrabold text-[#64278f] transition duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-100"
            >
              Get Programme Guidance
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}