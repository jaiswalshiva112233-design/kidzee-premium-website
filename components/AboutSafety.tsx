"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UtensilsCrossed,
} from "lucide-react";

const safetyCards = [
  {
    icon: Camera,
    title: "Supervision throughout the day",
    description:
      "Teachers and support staff remain attentive during classroom time, play, meals and movement between different areas of the preschool.",
  },
  {
    icon: ShieldCheck,
    title: "Managed entry and exit",
    description:
      "Visitor entry and child handover follow organised procedures so arrivals and departures remain controlled and easy to track.",
  },
  {
    icon: UtensilsCrossed,
    title: "Clean everyday routines",
    description:
      "Classrooms, washrooms, meal areas and frequently used surfaces are kept organised as part of the school’s regular routine.",
  },
  {
    icon: UserCheck,
    title: "A coordinated care team",
    description:
      "Teachers, caregivers and support staff work together so children receive consistent attention, reassurance and guidance.",
  },
];

const safetyPoints = [
  "CCTV cameras installed across key areas of the campus",
  "Visitor entry and child handover procedures",
  "Teacher supervision during classes, activities and play",
  "Child-friendly classrooms, furniture and washrooms",
  "Regular cleaning and organised hygiene routines",
  "Parent communication when attention or follow-up is needed",
];

const transition = {
  duration: 0.65,
  ease: [0.22, 1, 0.36, 1] as const,
};

type AboutSafetyProps = {
  imageUrl?: string;
  imageAlt?: string;
};

export default function AboutSafety({
  imageUrl = "/images/gallery/gallery-teacher-children.jpg",
  imageAlt = "Teacher supporting children at Kidzee Preschool Sector 12 Dwarka",
}: AboutSafetyProps) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <section
      className="relative isolate overflow-hidden bg-white py-14 sm:py-16 lg:py-20"
      aria-labelledby="about-safety-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-36 top-24 -z-10 h-80 w-80 rounded-full bg-purple-100/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-0 -z-10 h-96 w-96 rounded-full bg-yellow-100/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-18 xl:gap-24">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -24 }}
            whileInView={
              shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
            }
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
              <Sparkles size={16} aria-hidden="true" />
              Safety and everyday care
            </div>

            <h2
              id="about-safety-heading"
              className="mt-6 text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#281036] sm:text-4xl lg:text-[48px]"
            >
              Everyday care that helps children feel{" "}
              <span className="text-[#702a96]">safe and supported</span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Safety at preschool is built through many small, consistent
              actions. It includes attentive supervision, controlled entry,
              clear handover routines, clean surroundings and a team that knows
              how to respond when a child needs comfort or help.
            </p>


            <ul className="mt-8 space-y-4">
              {safetyPoints.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#4b245c]">
                    <CheckCircle2
                      size={15}
                      strokeWidth={2.6}
                      aria-hidden="true"
                    />
                  </span>

                  <span className="font-semibold leading-7 text-slate-700">
                    {item}
                  </span>
                </li>
              ))}
            </ul>

            <Link
              href="/admissions?enquiry=SCHOOL_VISIT#admission-enquiry"
              aria-label="Book a school visit at Kidzee Sector 12 Dwarka"
              className="mt-10 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#64278f] px-7 text-base font-bold text-white shadow-[0_14px_32px_rgba(100,39,143,0.24)] transition-[transform,background-color,box-shadow] duration-300 hover:-translate-y-0.5 hover:bg-[#532173] hover:shadow-[0_18px_38px_rgba(100,39,143,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-200"
            >
              Book a School Visit
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 24 }}
            whileInView={
              shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
            }
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
            className="relative mx-auto w-full max-w-[760px]"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-5 rotate-2 rounded-[44px] bg-purple-100/70"
            />

            <div className="relative overflow-hidden rounded-[40px] border-[8px] border-white bg-white shadow-[0_30px_80px_rgba(55,22,70,0.18)]">
              <div className="relative aspect-[4/3] min-h-0 sm:aspect-auto sm:min-h-[600px]">
                <Image
                  src={imageUrl}
                  alt={imageAlt}
                  unoptimized={imageUrl.startsWith("http")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#281036]/75 via-[#281036]/5 to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <div className="rounded-[24px] border border-white/40 bg-white/95 p-5 shadow-lg backdrop-blur-md sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-purple-100 text-[#702a96]">
                      <HeartHandshake size={22} aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#702a96]">
                        Care children can feel
                      </p>

                      <p className="mt-2 text-lg font-extrabold leading-snug text-[#281036] sm:text-xl">
                        A familiar adult, a calm response and consistent
                        routines can make a big difference to a young child’s
                        day.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-12 grid grid-flow-col auto-cols-[84%] gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-4">
          {safetyCards.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.title}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 24 }}
                whileInView={
                  shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
                }
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  ...transition,
                  duration: 0.5,
                  delay: shouldReduceMotion ? 0 : index * 0.05,
                }}
                whileHover={shouldReduceMotion ? undefined : { y: -6 }}
                className="group snap-start rounded-[30px] border border-purple-100 bg-[#fffdf9] p-6 shadow-[0_14px_38px_rgba(62,25,83,0.07)] transition-[border-color,box-shadow] duration-300 hover:border-purple-200 hover:shadow-[0_24px_55px_rgba(62,25,83,0.13)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#702a96] text-white transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105">
                  <Icon size={23} aria-hidden="true" />
                </div>

                <h3 className="mt-5 text-xl font-extrabold leading-snug text-[#281036]">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </motion.article>
            );
          })}
        </div>

        <motion.aside
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          whileInView={
            shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
          }
          viewport={{ once: true, amount: 0.25 }}
          transition={transition}
          className="mt-8 rounded-[30px] bg-[#2d1636] p-7 text-center text-white shadow-[0_20px_55px_rgba(45,22,54,0.18)] sm:p-9"
          aria-label="Parent communication and child wellbeing"
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-yellow-300">
            Parents stay informed
          </p>

          <p className="mx-auto mt-3 max-w-4xl text-balance text-xl font-extrabold leading-8 text-purple-50 sm:text-2xl">
            When something needs attention, parents should hear it clearly and
            promptly—not discover it later.
          </p>
        </motion.aside>
      </div>
    </section>
  );
}



