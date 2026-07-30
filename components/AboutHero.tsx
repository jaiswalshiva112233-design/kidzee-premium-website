"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  HeartHandshake,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { site } from "@/lib/site";

const highlights = [
  "Play-based and age-appropriate learning",
  "Caring teachers and individual attention",
  "Preschool, daycare and enrichment support",
];

export default function AboutHero() {
  const visitMessage = encodeURIComponent(
    "Hello, I would like to book a school visit at Kidzee Sector 12, Dwarka."
  );

  const visitLink = `https://wa.me/919667038673?text=${visitMessage}`;

  return (
    <section
      className="relative overflow-hidden bg-[#fffaf2] pb-20 pt-32 sm:pb-24 sm:pt-36 lg:pb-28 lg:pt-40"
      aria-labelledby="about-hero-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-purple-200/50 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-yellow-200/55 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute left-[45%] top-20 h-56 w-56 rounded-full bg-pink-100/45 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.nav
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          aria-label="Breadcrumb"
          className="mb-8 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500"
        >
          <Link
            href="/"
            className="transition-colors duration-200 hover:text-[#702a96]"
          >
            Home
          </Link>

          <ChevronRight size={15} aria-hidden="true" />

          <span className="text-[#702a96]" aria-current="page">
            About Us
          </span>
        </motion.nav>

        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 xl:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/90 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm backdrop-blur">
              <Sparkles size={16} aria-hidden="true" />
              About Kidzee Sector 12, Dwarka
            </div>

            <h1
              id="about-hero-heading"
              className="mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.045em] text-[#281036] sm:text-5xl lg:text-[62px] xl:text-[68px]"
            >
              A warm preschool where children feel{" "}
              <span className="text-[#702a96]">
                understood, encouraged and excited to learn
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Kidzee Preschool & Daycare in Sector 12B, Dwarka offers a
              nurturing early-learning environment where children build
              confidence, communication, independence and school readiness
              through purposeful play and caring guidance.
            </p>

            <div className="mt-7 space-y-3">
              {highlights.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#472153]">
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

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href={visitLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#64278f] px-7 text-base font-extrabold text-white shadow-[0_14px_32px_rgba(100,39,143,0.25)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#512071] hover:shadow-[0_18px_40px_rgba(100,39,143,0.32)]"
              >
                Book a School Visit
                <ArrowRight size={18} aria-hidden="true" />
              </a>

              <a
                href={`tel:${site.phone}`}
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 text-base font-extrabold text-[#64278f] shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#702a96] hover:bg-purple-50"
              >
                <Phone size={18} aria-hidden="true" />
                Call {site.phoneDisplay}
              </a>
            </div>

            <div className="mt-8 flex items-start gap-3 rounded-[22px] border border-purple-100 bg-white/80 p-4 shadow-[0_10px_30px_rgba(62,25,83,0.06)] backdrop-blur sm:max-w-xl">
              <MapPin
                size={21}
                className="mt-0.5 shrink-0 text-[#702a96]"
                aria-hidden="true"
              />

              <div>
                <p className="text-sm font-extrabold text-[#281036]">
                  Conveniently located in Sector 12B, Dwarka
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600">
                  {site.address}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.75, delay: 0.08, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[720px]"
          >
            <div
              aria-hidden="true"
              className="absolute -inset-5 rotate-2 rounded-[50px] bg-purple-100/80"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-7 -left-5 h-36 w-36 rounded-[34px] bg-yellow-300/80"
            />

            <div className="relative overflow-hidden rounded-[38px] border-[8px] border-white bg-purple-50 shadow-[0_32px_90px_rgba(51,22,68,0.22)] sm:rounded-[48px]">
              <div className="relative min-h-[520px] sm:min-h-[650px]">
                <Image
                  src="/images/about/about-hero.jpg"
                  alt="Children learning and playing at Kidzee Preschool and Daycare, Sector 12 Dwarka"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 48vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#25112e]/70 via-transparent to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="rounded-[28px] border border-white/20 bg-white/92 p-5 shadow-xl backdrop-blur-md sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-purple-100 text-[#702a96]">
                        <HeartHandshake size={21} aria-hidden="true" />
                      </div>

                      <div>
                        <p className="font-extrabold text-[#281036]">
                          Caring Guidance
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Children are supported with patience, warmth and
                          personal attention.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[15px] bg-yellow-200 text-[#4b245c]">
                        <ShieldCheck size={21} aria-hidden="true" />
                      </div>

                      <div>
                        <p className="font-extrabold text-[#281036]">
                          Safe Environment
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Organised routines and child-focused spaces support
                          comfortable learning.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -right-2 top-10 hidden rounded-[22px] border border-purple-100 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(57,26,68,0.16)] sm:block"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
                Preschool & Daycare
              </p>

              <p className="mt-1 text-lg font-extrabold text-[#281036]">
                Learning with care
              </p>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}