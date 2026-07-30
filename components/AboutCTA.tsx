"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  MapPin,
  MessageCircleMore,
  Phone,
  Sparkles,
} from "lucide-react";

import { site } from "@/lib/site";

const visitBenefits = [
  "See the classrooms and activity spaces",
  "Understand the preschool and daycare routine",
  "Meet the team and discuss your child’s needs",
  "Ask about programmes, timings and admissions",
];

export default function AboutCTA() {
  const visitMessage = encodeURIComponent(
    "Hello, I would like to book a school visit at Kidzee Sector 12, Dwarka."
  );

  const visitLink = `https://wa.me/919667038673?text=${visitMessage}`;

  return (
    <section
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
      aria-labelledby="about-cta-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-16 h-80 w-80 rounded-full bg-purple-100/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-yellow-100/75 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[38px] bg-[#2d1636] px-6 py-10 text-white shadow-[0_32px_90px_rgba(45,22,54,0.24)] sm:px-9 sm:py-12 lg:px-12 lg:py-14 xl:px-16"
        >
          <div
            aria-hidden="true"
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-purple-500/25 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-yellow-300/12 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute right-[28%] top-10 h-40 w-40 rounded-full bg-pink-300/10 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-yellow-300 backdrop-blur">
                <Sparkles size={16} aria-hidden="true" />
                Visit our preschool
              </div>

              <h2
                id="about-cta-heading"
                className="mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-[58px]"
              >
                The best way to understand our preschool is to{" "}
                <span className="text-yellow-300">
                  experience it in person
                </span>
              </h2>

              <p className="mt-6 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
                Visit Kidzee Sector 12, Dwarka to explore the learning
                environment, meet our team and discuss the right programme for
                your child. We will guide you through the daily routine,
                facilities, admissions process and daycare options.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={visitLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-yellow-300 px-7 text-base font-extrabold text-[#281036] shadow-[0_16px_36px_rgba(253,224,71,0.18)] transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-200"
                >
                  <CalendarCheck2 size={19} aria-hidden="true" />
                  Book a School Visit
                </a>

                <a
                  href={`tel:${site.phone}`}
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-7 text-base font-extrabold text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:text-[#64278f]"
                >
                  <Phone size={18} aria-hidden="true" />
                  Call {site.phoneDisplay}
                </a>
              </div>

              <div className="mt-8 flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur sm:max-w-2xl">
                <MapPin
                  size={22}
                  className="mt-0.5 shrink-0 text-yellow-300"
                  aria-hidden="true"
                />

                <div>
                  <p className="font-extrabold text-white">
                    Kidzee Preschool & Daycare, Sector 12B, Dwarka
                  </p>

                  <p className="mt-1 text-sm leading-6 text-purple-100">
                    {site.address}
                  </p>

                  <a
                    href={site.map}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-2 text-sm font-extrabold text-yellow-300 transition hover:text-yellow-200"
                  >
                    Get Directions
                    <ArrowRight size={15} aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
              className="rounded-[34px] border border-white/12 bg-white/[0.08] p-6 backdrop-blur sm:p-8"
            >
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[19px] bg-yellow-300 text-[#281036]">
                  <MessageCircleMore size={25} aria-hidden="true" />
                </div>

                <div>
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300">
                    During your visit
                  </p>

                  <h3 className="mt-2 text-2xl font-extrabold leading-snug text-white sm:text-3xl">
                    Take your time, look around and ask every question
                  </h3>
                </div>
              </div>

              <div className="mt-7 space-y-4">
                {visitBenefits.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/[0.06] p-4"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                      <CheckCircle2
                        size={16}
                        strokeWidth={2.7}
                        aria-hidden="true"
                      />
                    </div>

                    <p className="text-sm font-semibold leading-6 text-purple-50 sm:text-base">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-7 rounded-[24px] bg-white p-5 text-[#281036]">
                <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#702a96]">
                  Explore programmes before visiting
                </p>

                <p className="mt-2 leading-7 text-slate-600">
                  Learn more about our age-specific preschool programmes and
                  find the most suitable starting point for your child.
                </p>

                <Link
                  href="/programmes"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-extrabold text-[#64278f] transition hover:text-[#4f1f70]"
                >
                  View All Programmes
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}