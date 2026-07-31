import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  MapPin,
  Sparkles,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

const galleryImages = [
  {
    src: "/images/gallery/gallery-featured.jpg",
    alt: "Children participating in a classroom activity with their teacher at Kidzee Sector 12 Dwarka",
    title: "Learning Through Participation",
    description:
      "Children learn naturally when they are encouraged to explore, ask questions and participate together.",
    category: "Classroom Life",
    className: "lg:col-span-7 lg:row-span-2",
    featured: true,
    position: "object-left",
  },
  {
    src: "/images/gallery/gallery-classroom.jpg",
    alt: "Bright and organised classroom at Kidzee Preschool Sector 12 Dwarka",
    title: "Spaces Made for Young Learners",
    description:
      "Bright classrooms arranged to support comfort, interaction and age-appropriate learning.",
    category: "Our Classrooms",
    className: "lg:col-span-5",
    featured: false,
    position: "object-center",
  },
  {
    src: "/images/gallery/gallery-play-area.jpg",
    alt: "Indoor play area at Kidzee Preschool and Daycare Sector 12 Dwarka",
    title: "Room to Move and Play",
    description:
      "Supervised play gives children time to move, socialise and build confidence.",
    category: "Play",
    className: "lg:col-span-5",
    featured: false,
    position: "object-center",
  },
  {
    src: "/images/gallery/gallery-creative-activity.jpg",
    alt: "Child proudly displaying artwork created at Kidzee Sector 12 Dwarka",
    title: "Creativity Worth Celebrating",
    description:
      "Every activity gives children another opportunity to express their ideas and feel proud of their work.",
    category: "Creative Work",
    className: "lg:col-span-4",
    featured: false,
    position: "object-center",
  },
  {
    src: "/images/gallery/gallery-teacher-children.jpg",
    alt: "Teacher engaging with children at Kidzee Preschool Sector 12 Dwarka",
    title: "Guidance with Warmth",
    description:
      "Our teachers support children with patience, encouragement and close personal attention.",
    category: "Our Teachers",
    className: "lg:col-span-4",
    featured: false,
    position: "object-center",
  },
  {
    src: "/images/gallery/gallery-building.jpg",
    alt: "Exterior of Kidzee Preschool and Daycare in Sector 12B Dwarka",
    title: "Your Neighbourhood Kidzee",
    description:
      "A welcoming preschool and daycare conveniently located in Sector 12B, Dwarka.",
    category: "Our Centre",
    className: "lg:col-span-4",
    featured: false,
    position: "object-center",
  },
] as const;

export default function Gallery() {
  return (
    <section
      id="gallery"
      aria-labelledby="gallery-heading"
      className="relative isolate overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-44 top-24 h-96 w-96 rounded-full bg-[#F6C84B]/15 blur-3xl" />
        <div className="absolute -right-44 bottom-10 h-[430px] w-[430px] rounded-full bg-[#EADDF1]/75 blur-3xl" />
        <div className="absolute left-[42%] top-[45%] h-72 w-72 rounded-full bg-[#5B2A86]/[0.04] blur-3xl" />
      </div>

      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-[#FAF7FC] px-4 py-2 text-sm font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(52,20,68,0.04)]">
            <Camera aria-hidden="true" size={16} />
            Life at our centre
          </div>

          <h2
            id="gallery-heading"
            className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[50px]"
          >
            Real moments from everyday preschool life.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
            Step inside Kidzee Sector 12, Dwarka and see how children learn,
            create, play and grow in a warm, thoughtfully prepared environment.
          </p>
        </div>

        <div className="mt-12 grid auto-rows-[300px] gap-5 lg:grid-cols-12 lg:gap-6">
          {galleryImages.map((image, index) => (
            <Link
              key={image.src}
              href="/gallery"
              aria-label={`View more photographs of ${image.title}`}
              className={[
                "group relative isolate overflow-hidden rounded-[30px] border-[6px] border-white bg-[#F4EFF6]",
                "shadow-[0_20px_60px_rgba(45,23,54,0.09)]",
                "transition-all duration-500",
                "hover:-translate-y-1.5 hover:shadow-[0_30px_80px_rgba(45,23,54,0.15)]",
                image.className,
              ].join(" ")}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority={index === 0}
                sizes={
                  image.featured
                    ? "(max-width: 1024px) 94vw, 57vw"
                    : "(max-width: 1024px) 94vw, 32vw"
                }
                className={`${image.position} object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]`}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#170B20]/95 via-[#170B20]/18 to-transparent" />

              <div className="absolute left-5 top-5 sm:left-6 sm:top-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/92 px-3.5 py-2 shadow-lg backdrop-blur-md">
                  <Sparkles
                    aria-hidden="true"
                    size={14}
                    className="text-[#D6A916]"
                  />

                  <span className="text-[11px] font-black uppercase tracking-[0.13em] text-[#5B2A86]">
                    {image.category}
                  </span>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-7">
                <div className={image.featured ? "max-w-xl" : "max-w-md"}>
                  <h3
                    className={[
                      "font-black leading-tight tracking-[-0.03em] text-white",
                      image.featured
                        ? "text-3xl sm:text-4xl lg:text-[42px]"
                        : "text-2xl",
                    ].join(" ")}
                  >
                    {image.title}
                  </h3>

                  <p
                    className={[
                      "mt-3 text-white/82",
                      image.featured
                        ? "text-base leading-7 sm:text-lg sm:leading-8"
                        : "text-sm leading-6",
                    ].join(" ")}
                  >
                    {image.description}
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-white">
                    View Gallery

                    <ArrowRight
                      aria-hidden="true"
                      size={17}
                      className="transition-transform duration-300 group-hover:translate-x-1.5"
                    />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 overflow-hidden rounded-[32px] border border-[#5B2A86]/10 bg-gradient-to-br from-[#FAF7FC] via-white to-[#FFF9E8] p-6 shadow-[0_20px_60px_rgba(45,23,54,0.07)] sm:p-8 lg:p-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-sm font-black text-[#5B2A86]">
                <MapPin aria-hidden="true" size={17} />
                Visit Kidzee Sector 12B, Dwarka
              </div>

              <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
                Photographs give you a glimpse. A visit helps you feel the
                difference.
              </h3>

              <p className="mt-3 text-base leading-7 text-[#6F6474]">
                Meet our team, walk through the classrooms and understand how
                the preschool and daycare routine can support your child.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                href="/contact"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                className="w-full sm:w-auto"
              >
                Book a School Visit
              </Button>

              <Button
                href="/gallery"
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                className="w-full sm:w-auto"
              >
                View Full Gallery
              </Button>
            </div>
          </div>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-[#817586] sm:text-sm">
          Photographs featuring children are displayed with appropriate
          permission and are used to provide families with an authentic view of
          our learning environment.
        </p>
      </Container>
    </section>
  );
}