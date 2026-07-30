"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  AirVent,
  ArrowRight,
  CheckCircle2,
  DoorOpen,
  Gamepad2,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";

import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const facilities = [
  {
    title: "Bright, air-conditioned classrooms",
    description:
      "Comfortable classrooms with child-friendly furniture and organised learning areas for everyday activities.",
    icon: AirVent,
  },
  {
    title: "First-floor play area",
    description:
      "A dedicated indoor play space where children enjoy movement, free play and supervised activities.",
    icon: Gamepad2,
  },
  {
    title: "Ground-floor play area",
    description:
      "An additional supervised play space for physical activity, games and active outdoor movement.",
    icon: Waves,
  },
  {
    title: "Controlled entry and pick-up",
    description:
      "Arrival and departure are managed carefully, with children handed over only to authorised adults.",
    icon: DoorOpen,
  },
];

const photographs = [
  {
    image: "/images/facilities/classroom-1.jpg",
    title: "Bright learning classroom",
    alt: "Bright air-conditioned classroom at Kidzee Sector 12B Dwarka",
    className: "sm:col-span-2 lg:col-span-2 lg:row-span-2",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw",
  },
  {
    image: "/images/facilities/classroom-2.jpg",
    title: "Child-friendly classroom",
    alt: "Child-friendly classroom at Kidzee Sector 12B Dwarka",
    className: "",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  },
  {
    image: "/images/facilities/classroom-3.jpg",
    title: "Organised learning space",
    alt: "Organised preschool learning space at Kidzee Sector 12B Dwarka",
    className: "",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  },
  {
    image: "/images/facilities/first-floor-play.jpg",
    title: "First-floor play area",
    alt: "First-floor indoor play area at Kidzee Sector 12B Dwarka",
    className: "sm:col-span-2",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw",
  },
  {
    image: "/images/facilities/ground-floor-play.jpg",
    title: "Ground-floor play area",
    alt: "Ground-floor supervised play area at Kidzee Sector 12B Dwarka",
    className: "sm:col-span-2 lg:col-span-2",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw",
  },
];

const visitChecklist = [
  "See the classrooms",
  "Explore both play areas",
  "Meet the school team",
];

function createWhatsAppLink(message: string) {
  const phoneNumber = site.phone.replace(/\D/g, "");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export default function Facilities() {
  const schoolVisitLink = createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to book a school visit and explore the classrooms and play areas."
  );

  return (
    <section
      id="facilities"
      aria-labelledby="facilities-heading"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#FFF0B8] blur-3xl"
      />

      <Container className="relative max-w-[1480px]">
        <div className="grid items-end gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D6EE] bg-[#F8F3FC] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#5B2A86]">
              <Sparkles aria-hidden="true" size={16} />
              Explore our campus
            </div>

            <h2
              id="facilities-heading"
              className="mt-6 max-w-4xl text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-[#2C1735] sm:text-5xl lg:text-[58px]"
            >
              Spaces designed around{" "}
              <span className="text-[#5B2A86]">
                how young children learn and move
              </span>
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{
              duration: 0.55,
              delay: 0.06,
              ease: "easeOut",
            }}
            className="max-w-2xl text-base leading-8 text-[#5F5F6D] sm:text-lg"
          >
            Our preschool classrooms and play areas in Sector 12B, Dwarka are
            arranged to give children room to explore, participate, move
            comfortably and follow their daily routine in a well-organised
            environment.
          </motion.p>
        </div>

        <div className="mt-14 grid auto-rows-[240px] gap-4 sm:grid-cols-2 sm:auto-rows-[280px] lg:grid-cols-4 lg:auto-rows-[250px]">
          {photographs.map((photo, index) => (
            <motion.figure
              key={photo.title}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: "easeOut",
              }}
              className={`group relative overflow-hidden rounded-[30px] bg-[#F8F3FC] shadow-[0_18px_50px_rgba(52,20,68,0.1)] ${photo.className}`}
            >
              <Image
                src={photo.image}
                alt={photo.alt}
                fill
                sizes={photo.sizes}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#22102D]/80 via-transparent to-transparent"
              />

              <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6D86F]">
                  Kidzee Sector 12, Dwarka
                </p>

                <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
                  {photo.title}
                </h3>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {facilities.map((facility, index) => {
            const Icon = facility.icon;

            return (
              <motion.article
                key={facility.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{
                  duration: 0.45,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                className="group rounded-[28px] border border-[#EADFF0] bg-[#FFF9F1] p-6 shadow-[0_14px_38px_rgba(52,20,68,0.06)] transition-all duration-200 hover:-translate-y-1 hover:border-[#D8C4E3] hover:shadow-[0_22px_50px_rgba(52,20,68,0.11)]"
              >
                <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[18px] bg-[#5B2A86] text-white shadow-[0_10px_24px_rgba(91,42,134,0.22)] transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105">
                  <Icon
                    aria-hidden="true"
                    size={23}
                    strokeWidth={2.1}
                  />
                </div>

                <h3 className="mt-5 text-xl font-black leading-7 text-[#2C1735]">
                  {facility.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#5F5F6D]">
                  {facility.description}
                </p>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mt-10 overflow-hidden rounded-[34px] bg-[#2C1735] px-6 py-8 text-white shadow-[0_26px_70px_rgba(44,23,53,0.2)] sm:px-9 lg:px-11 lg:py-10"
        >
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7A3AA5]/25 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#F6C84B]/10 blur-3xl"
          />

          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2C1735]">
                  <ShieldCheck aria-hidden="true" size={24} />
                </div>

                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F6D86F]">
                  Visit before you decide
                </p>
              </div>

              <h3 className="mt-5 text-2xl font-black leading-tight sm:text-3xl">
                Walk through the classrooms and play areas yourself
              </h3>

              <p className="mt-3 max-w-3xl leading-7 text-[#E8DDF1]">
                A school visit gives you a clearer understanding of the
                classrooms, play spaces and overall environment your child will
                experience every day.
              </p>

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3">
                {visitChecklist.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-sm font-semibold text-white"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      size={17}
                      className="shrink-0 text-[#F6D86F]"
                    />

                    {item}
                  </div>
                ))}
              </div>
            </div>

            <a
              href={schoolVisitLink}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Book a school visit to explore Kidzee Sector 12 Dwarka facilities"
              className="inline-flex min-h-[54px] shrink-0 items-center justify-center gap-2 rounded-full bg-white px-7 text-sm font-black text-[#5B2A86] shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F6C84B] hover:text-[#2C1735] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            >
              Book a School Visit
              <ArrowRight aria-hidden="true" size={17} />
            </a>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}