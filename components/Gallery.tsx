import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Images } from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

const galleryImages = [
  {
    src: "/images/gallery-1.jpg",
    alt: "Children participating in a classroom activity",
    className: "sm:col-span-2 sm:row-span-2",
  },
  {
    src: "/images/gallery-2.jpg",
    alt: "Preschool classroom at Kidzee Sector 12 Dwarka",
    className: "",
  },
  {
    src: "/images/gallery-3.jpg",
    alt: "Children enjoying supervised indoor play",
    className: "",
  },
  {
    src: "/images/gallery-4.jpg",
    alt: "Creative activity completed by preschool children",
    className: "",
  },
  {
    src: "/images/gallery-5.jpg",
    alt: "Learning and play area inside the preschool",
    className: "",
  },
] as const;

export default function Gallery() {
  return (
    <section
      aria-labelledby="gallery-heading"
      className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-10 h-80 w-80 rounded-full bg-[#F6C84B]/15 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-10 h-80 w-80 rounded-full bg-[#EADDF1]/70 blur-3xl"
      />

      <Container className="relative">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F3EAF8] px-4 py-2 text-sm font-black text-[#5B2A86]">
              <Images aria-hidden="true" size={16} />
              Centre photographs
            </div>

            <h2
              id="gallery-heading"
              className="mt-5 text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-5xl"
            >
              A look inside our preschool.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
              View classrooms, activities and play spaces from our Sector 12B,
              Dwarka centre.
            </p>
          </div>

          <Button
            href="/gallery"
            variant="secondary"
            size="md"
            rightIcon={<ArrowRight size={18} />}
            className="w-fit"
          >
            View Full Gallery
          </Button>
        </div>

        <div className="mt-10 grid auto-rows-[210px] gap-4 sm:grid-cols-2 sm:auto-rows-[230px] lg:mt-12 lg:grid-cols-4 lg:auto-rows-[250px]">
          {galleryImages.map((image, index) => (
            <Link
              key={image.src}
              href="/gallery"
              aria-label="Open the school photo gallery"
              className={[
                "group relative overflow-hidden rounded-[26px] bg-[#F3EAF8] shadow-[0_14px_40px_rgba(52,20,68,0.07)]",
                "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45",
                image.className,
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes={
                  index === 0
                    ? "(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 50vw"
                    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                }
                className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#281034]/30 via-transparent to-transparent opacity-70 transition-opacity duration-300 group-hover:opacity-90"
              />

              <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-[#5B2A86] opacity-0 shadow-lg transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 sm:translate-x-2">
                <ArrowRight aria-hidden="true" size={18} />
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-5 text-center text-sm leading-6 text-[#7B6F80]">
          Photographs are displayed with appropriate parent permission.
        </p>
      </Container>
    </section>
  );
}