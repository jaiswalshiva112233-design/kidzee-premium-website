import Image from "next/image";
import {
  AirVent,
  ArrowRight,
  Blocks,
  Camera,
  DoorOpen,
  ShieldCheck,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getWebsiteMedia } from "@/lib/sanity/media";

const facilityDetails = [
  {
    icon: DoorOpen,
    title: "Child-friendly classrooms",
    text: "Arranged for stories, table work, group learning and daily routines.",
  },
  {
    icon: Blocks,
    title: "Indoor play areas",
    text: "Dedicated spaces for movement and supervised age-appropriate play.",
  },
  {
    icon: AirVent,
    title: "Air-conditioned rooms",
    text: "Comfortable learning spaces during Delhi's warmer months.",
  },
  {
    icon: Camera,
    title: "CCTV-covered key areas",
    text: "Part of the centre's everyday supervision and security arrangements.",
  },
] as const;

export default async function Facilities() {
  const [
    classroomMedia,
    firstFloorPlayMedia,
    groundFloorPlayMedia,
  ] = await Promise.all([
    getWebsiteMedia("home.facilities.classroom"),
    getWebsiteMedia("home.facilities.firstFloorPlay"),
    getWebsiteMedia("home.facilities.groundFloorPlay"),
  ]);

  const classroomImage =
    classroomMedia?.imageUrl ??
    "/images/facilities/classroom-1.jpg";

  const firstFloorPlayImage =
    firstFloorPlayMedia?.imageUrl ??
    "/images/facilities/first-floor-play.jpg";

  const groundFloorPlayImage =
    groundFloorPlayMedia?.imageUrl ??
    "/images/facilities/ground-floor-play.jpg";

  return (
    <section
      aria-labelledby="facilities-heading"
      className="relative overflow-hidden bg-[#F8F4FC] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-12 h-80 w-80 rounded-full bg-[#EADDF1] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 bottom-10 h-80 w-80 rounded-full bg-[#F6C84B]/18 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-12">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
              Inside our Sector 12B centre
            </p>

            <h2
              id="facilities-heading"
              className="mt-4 max-w-xl text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              Real spaces for learning, movement and play.
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg lg:justify-self-end">
            These photographs show the centre families will visit—not a
            stock-image version of preschool. Come and see how the
            classrooms and indoor play areas fit into your child&apos;s
            day.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-[1.22fr_0.78fr]">
          <figure className="group relative min-h-[410px] overflow-hidden rounded-[30px] border-[3px] border-white bg-white shadow-[0_22px_64px_rgba(40,16,52,0.13)] sm:min-h-[520px]">
            <Image
              src={classroomImage}
              alt={
                classroomMedia?.altText ||
                "Colourful classroom at Kidzee Preschool Sector 12 Dwarka"
              }
              fill
              unoptimized={classroomImage.startsWith("http")}
              sizes="(max-width: 1024px) 100vw, 62vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#281034]/72 via-transparent to-transparent"
            />

            <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
              <p className="text-xl font-black text-white sm:text-2xl">
                Classrooms arranged for young learners
              </p>

              <p className="mt-1.5 max-w-xl text-sm leading-6 text-white/75">
                Child-height furniture, activity materials and space
                for guided group experiences.
              </p>
            </figcaption>
          </figure>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            <figure className="group relative min-h-[250px] overflow-hidden rounded-[28px] border-[3px] border-white bg-white shadow-[0_18px_52px_rgba(40,16,52,0.11)]">
              <Image
                src={groundFloorPlayImage}
                alt={
                  groundFloorPlayMedia?.altText ||
                  "Ground-floor indoor play area at Kidzee Sector 12 Dwarka"
                }
                fill
                unoptimized={groundFloorPlayImage.startsWith("http")}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 38vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#281034]/70 via-transparent to-transparent"
              />

              <figcaption className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-black text-white">
                  Ground-floor play space
                </p>
              </figcaption>
            </figure>

            <figure className="group relative min-h-[250px] overflow-hidden rounded-[28px] border-[3px] border-white bg-white shadow-[0_18px_52px_rgba(40,16,52,0.11)]">
              <Image
                src={firstFloorPlayImage}
                alt={
                  firstFloorPlayMedia?.altText ||
                  "First-floor indoor play area at Kidzee Sector 12 Dwarka"
                }
                fill
                unoptimized={firstFloorPlayImage.startsWith("http")}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 38vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#281034]/70 via-transparent to-transparent"
              />

              <figcaption className="absolute inset-x-0 bottom-0 p-5">
                <p className="font-black text-white">
                  First-floor play space
                </p>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {facilityDetails.map(({ icon: Icon, title, text }) => (
            <article
              key={title}
              className="rounded-[24px] border border-[#E6DAEB] bg-white p-5 shadow-[0_10px_32px_rgba(40,16,52,0.05)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <Icon aria-hidden="true" size={19} />
              </span>

              <h3 className="mt-4 font-black leading-6 text-[#281034]">
                {title}
              </h3>

              <p className="mt-1.5 text-sm leading-6 text-[#6F6474]">
                {text}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-7 flex flex-col items-start justify-between gap-5 rounded-[26px] bg-[#281034] px-6 py-6 text-white sm:flex-row sm:items-center sm:px-8">
          <div className="flex items-start gap-3">
            <ShieldCheck
              aria-hidden="true"
              size={22}
              className="mt-0.5 shrink-0 text-[#F6C84B]"
            />

            <div>
              <h3 className="font-black text-white">
                Supervised entry and authorised handover
              </h3>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-white/70">
                Ask the centre team to explain the daily entry,
                supervision and child-collection process during your
                visit.
              </p>
            </div>
          </div>

          <Button
            href="/gallery"
            variant="yellow"
            size="md"
            rightIcon={<ArrowRight size={17} />}
            className="w-full sm:w-auto"
          >
            View Centre Gallery
          </Button>
        </div>
      </Container>
    </section>
  );
}