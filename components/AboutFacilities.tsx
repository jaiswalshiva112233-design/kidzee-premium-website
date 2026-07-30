"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  Blocks,
  Camera,
  CheckCircle2,
  CookingPot,
  DoorOpen,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
} from "lucide-react";

const facilities = [
  {
    title: "Bright Classrooms",
    description:
      "Comfortable, organised classrooms support focused learning, discussion, storytelling and age-appropriate activities.",
    image: "/images/about/facilities-classroom.jpg",
    icon: Sun,
    className: "sm:col-span-2 lg:col-span-2",
    imageHeight: "min-h-[390px] sm:min-h-[450px]",
  },
  {
    title: "Indoor Play Area",
    description:
      "A supervised space for movement, active play, coordination and joyful interaction with friends.",
    image: "/images/about/facilities-indoor-play.jpg",
    icon: Blocks,
    className: "",
    imageHeight: "min-h-[360px] sm:min-h-[420px]",
  },
  {
    title: "Creative Activities",
    description:
      "Children explore art, craft, stories, music, pretend play and hands-on experiences.",
    image: "/images/about/facilities-activity.jpg",
    icon: Palette,
    className: "",
    imageHeight: "min-h-[360px] sm:min-h-[420px]",
  },
  {
    title: "Daycare Spaces",
    description:
      "Comfortable areas support meals, rest, play, homework guidance and supervised care after preschool.",
    image: "/images/about/facilities-daycare.jpg",
    icon: Baby,
    className: "sm:col-span-2 lg:col-span-2",
    imageHeight: "min-h-[390px] sm:min-h-[450px]",
  },
];

const supportFacilities = [
  {
    icon: ShieldCheck,
    title: "Child-focused safety",
    description:
      "Supervised routines, secure entry practices and organised spaces support a reassuring school experience.",
  },
  {
    icon: Camera,
    title: "CCTV-covered campus",
    description:
      "CCTV surveillance across the premises strengthens supervision and day-to-day campus monitoring.",
  },
  {
    icon: CookingPot,
    title: "Meals and hygiene",
    description:
      "Meal routines, classroom cleanliness and hygiene practices are managed as part of everyday care.",
  },
  {
    icon: DoorOpen,
    title: "Comfortable facilities",
    description:
      "Child-friendly washrooms, learning areas and activity spaces are arranged for convenient daily use.",
  },
];

const facilityPriorities = [
  "Age-appropriate furniture and learning materials",
  "Separate spaces for learning, play and rest",
  "Supervised indoor and ground-floor play areas",
  "Child-friendly classroom and washroom arrangements",
  "Daily cleaning and organised hygiene routines",
  "Preschool and daycare support under one roof",
];

export default function AboutFacilities() {
  return (
    <section
      className="relative overflow-hidden bg-[#fffaf2] py-20 sm:py-24 lg:py-28"
      aria-labelledby="about-facilities-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-36 top-24 h-80 w-80 rounded-full bg-purple-100/65 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-yellow-100/75 blur-3xl"
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
            Our facilities
          </div>

          <h2
            id="about-facilities-heading"
            className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
          >
            Practical, child-friendly spaces for{" "}
            <span className="text-[#702a96]">
              learning, play and everyday care
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Our preschool and daycare environment brings together classrooms,
            play areas, activity spaces and daily-care facilities so children
            can move comfortably through each part of their routine.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((facility, index) => {
            const Icon = facility.icon;

            return (
              <motion.article
                key={facility.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.55,
                  delay: index * 0.06,
                  ease: "easeOut",
                }}
                whileHover={{ y: -6 }}
                className={`group relative overflow-hidden rounded-[34px] border-[7px] border-white bg-purple-50 shadow-[0_22px_60px_rgba(54,21,74,0.14)] ${facility.className}`}
              >
                <div className={`relative ${facility.imageHeight}`}>
                  <Image
                    src={facility.image}
                    alt={`${facility.title} at Kidzee Preschool and Daycare, Sector 12 Dwarka`}
                    fill
                    sizes={
                      facility.className
                        ? "(max-width: 1024px) 100vw, 50vw"
                        : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    }
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#25112e]/85 via-[#25112e]/10 to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-yellow-300 text-[#281036] shadow-lg">
                      <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
                    </div>

                    <div>
                      <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                        {facility.title}
                      </h3>

                      <p className="mt-2 max-w-xl text-sm leading-6 text-purple-50 sm:text-base">
                        {facility.description}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {supportFacilities.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.18 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                whileHover={{ y: -5 }}
                className="group rounded-[30px] border border-purple-100 bg-white p-6 shadow-[0_14px_38px_rgba(62,25,83,0.07)] transition duration-300 hover:border-purple-200 hover:shadow-[0_24px_55px_rgba(62,25,83,0.12)] sm:p-7"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-purple-100 text-[#702a96] transition duration-300 group-hover:-rotate-3 group-hover:bg-[#702a96] group-hover:text-white">
                  <Icon size={23} strokeWidth={2.1} aria-hidden="true" />
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

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-16 overflow-hidden rounded-[38px] bg-[#2d1636] p-7 text-white shadow-[0_28px_75px_rgba(45,22,54,0.22)] sm:p-9 lg:p-10"
        >
          <div className="grid gap-9 lg:grid-cols-[0.76fr_1.24fr] lg:items-center">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-yellow-300 text-[#281036]">
                <Blocks size={24} aria-hidden="true" />
              </div>

              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300">
                Designed around the daily routine
              </p>

              <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
                Facilities that support how young children actually learn
              </h3>

              <p className="mt-4 max-w-xl leading-8 text-purple-100">
                Children need opportunities to sit, move, create, communicate,
                play and rest. Our facilities support these different needs
                without separating care from learning.
              </p>

              <Link
                href="/gallery"
                className="mt-8 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-extrabold text-[#64278f] transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-300 hover:text-[#281036]"
              >
                Explore Our Gallery
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {facilityPriorities.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.04,
                  }}
                  className="flex items-start gap-3 rounded-[22px] border border-white/10 bg-white/[0.07] p-4 backdrop-blur"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                    <CheckCircle2
                      size={16}
                      strokeWidth={2.7}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-sm font-semibold leading-6 text-purple-50">
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