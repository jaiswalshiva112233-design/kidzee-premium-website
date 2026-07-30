"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Camera } from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

interface GalleryItem {
  src: string;
  alt: string;
  label: string;
  className: string;
  sizes: string;
}

const galleryItems: GalleryItem[] = [
  {
    src: "/images/gallery/gallery-1.jpg",
    alt: "Parent-teacher interaction at Kidzee Sector 12B Dwarka",
    label: "Parent-Teacher Interaction",
    className: "sm:col-span-2 lg:col-span-2 lg:row-span-2",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw",
  },
  {
    src: "/images/gallery/gallery-2.jpg",
    alt: "Child speaking confidently on stage at Kidzee Sector 12B Dwarka",
    label: "Confidence on Stage",
    className: "lg:col-span-1",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  },
  {
    src: "/images/gallery/gallery-3.jpg",
    alt: "Children enjoying supervised group play at Kidzee Sector 12B Dwarka",
    label: "Group Play",
    className: "lg:col-span-1",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  },
  {
    src: "/images/gallery/gallery-4.jpg",
    alt: "Child taking part in a physical activity at Kidzee Sector 12B Dwarka",
    label: "Active Learning",
    className: "lg:col-span-1 lg:row-span-2",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  },
  {
    src: "/images/gallery/gallery-5.jpg",
    alt: "Children enjoying the ball pool at Kidzee Sector 12B Dwarka",
    label: "Ball Pool Fun",
    className: "sm:col-span-2 lg:col-span-2",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw",
  },
  {
    src: "/images/gallery/gallery-6.jpg",
    alt: "Children playing in the ground-floor play area at Kidzee Sector 12B Dwarka",
    label: "Ground-Floor Play Area",
    className: "lg:col-span-1",
    sizes:
      "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw",
  },
];

function createWhatsAppLink(message: string) {
  const phoneNumber = site.phone.replace(/\D/g, "");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export default function Gallery() {
  const schoolVisitLink = createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to book a school visit and learn more about the preschool environment."
  );

  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="relative overflow-hidden bg-[#FAF7FC] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-24 top-20 h-72 w-72 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#FFF0B8] blur-3xl"
      />

      <Container className="relative max-w-[1480px]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D6EE] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#5B2A86] shadow-sm">
            <Camera aria-hidden="true" size={17} />
            Life at Kidzee
          </div>

          <h2
            id="gallery-heading"
            className="mt-6 text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-[#2C1735] sm:text-5xl lg:text-[58px]"
          >
            Real moments from our{" "}
            <span className="text-[#5B2A86]">school community</span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#5F5F6D] sm:text-lg">
            A glimpse of children learning, playing, expressing themselves and
            building confidence at Kidzee Sector 12B, Dwarka.
          </p>
        </motion.div>

        <div className="mt-14 grid auto-rows-[220px] grid-cols-1 gap-5 sm:grid-cols-2 sm:auto-rows-[240px] lg:grid-cols-4 lg:auto-rows-[230px]">
          {galleryItems.map((item, index) => (
            <motion.figure
              key={item.src}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.5,
                delay: index * 0.05,
                ease: "easeOut",
              }}
              className={`group relative overflow-hidden rounded-[30px] bg-[#F2E8F8] shadow-[0_18px_50px_rgba(52,20,68,0.1)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(52,20,68,0.14)] ${item.className}`}
            >
              <Image
                src={item.src}
                alt={item.alt}
                fill
                sizes={item.sizes}
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#24112D]/80 via-transparent to-transparent"
              />

              <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6D86F]">
                  Kidzee Sector 12, Dwarka
                </p>

                <h3 className="mt-2 text-xl font-black text-white sm:text-2xl">
                  {item.label}
                </h3>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative mt-10 overflow-hidden rounded-[32px] bg-[#2C1735] px-7 py-8 text-center text-white shadow-[0_24px_60px_rgba(44,23,53,0.2)] sm:px-9 lg:flex lg:items-center lg:justify-between lg:gap-8 lg:text-left"
        >
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-[#7A3AA5]/25 blur-3xl"
          />

          <div className="relative">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F6D86F]">
              Visit the preschool
            </p>

            <h3 className="mt-2 text-2xl font-black sm:text-3xl">
              Experience the environment beyond the photographs
            </h3>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#E8DDF1]">
              Meet the school team and understand the classroom routine,
              programmes, play spaces and daily experience before making your
              decision.
            </p>
          </div>

          <Button
  href={schoolVisitLink}
  external
  className="shrink-0"
  ariaLabel="Book a school visit"
>
  Book a School Visit
  <ArrowRight aria-hidden="true" size={17} />
</Button>
        </motion.div>
      </Container>
    </section>
  );
}