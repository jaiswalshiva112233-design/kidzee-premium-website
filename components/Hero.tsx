import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Star,
  Utensils,
  UsersRound,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { design, joinClasses } from "@/lib/design";
import { site } from "@/lib/site";

const trustPoints = [
  {
    icon: CheckCircle2,
    title: "3-Day Trial",
    description: "A gentle introduction before your child joins regularly.",
  },
  {
    icon: UsersRound,
    title: "Thoughtful Ratios",
    description: "1:8 for Playgroup and Nursery.",
  },
  {
    icon: Utensils,
    title: "Meals Included",
    description: "Fresh meals served during preschool hours.",
  },
  {
    icon: Clock3,
    title: "Daycare Till 7 PM",
    description: "Dependable support for working families.",
  },
] as const;

const supportingImages = [
  {
    src: "/images/hero/hero-classroom.jpg",
    alt: "Bright and colourful classroom at Kidzee Preschool Sector 12 Dwarka",
    label: "Thoughtfully designed classrooms",
    className: "left-0 top-0",
  },
  {
    src: "/images/hero/hero-teacher-class.jpg",
    alt: "Teacher conducting an engaging classroom activity with children at Kidzee Sector 12 Dwarka",
    label: "Caring, involved teachers",
    className: "right-0 top-0",
  },
  {
    src: "/images/hero/hero-building.jpg",
    alt: "Entrance of Kidzee Preschool and Daycare in Sector 12B Dwarka",
    label: "Sector 12B, Dwarka",
    className: "bottom-0 left-1/2 -translate-x-1/2",
  },
] as const;

export default function Hero() {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className={joinClasses(
        "relative isolate overflow-hidden pt-[82px]",
        design.backgrounds.gradient,
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-36 top-28 h-80 w-80 rounded-full border border-[#5B2A86]/[0.06]" />

        <div className="absolute left-[7%] top-[23%] h-24 w-24 rounded-full border border-[#5B2A86]/10" />

        <div className="absolute right-[4%] top-[7%] h-64 w-64 rounded-full bg-[#F6C84B]/20 blur-3xl" />

        <div className="absolute bottom-[6%] left-[40%] h-64 w-64 rounded-full bg-[#5B2A86]/10 blur-3xl" />

        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white/55 to-transparent" />
      </div>

      <Container className="grid min-h-[760px] items-center gap-14 pb-20 pt-12 lg:grid-cols-[0.93fr_1.07fr] lg:gap-16 lg:pb-28 lg:pt-16 xl:gap-20">
        <div className="relative z-10 mx-auto w-full max-w-[700px] lg:mx-0">
          <div className={design.badges.light}>
            <MapPin aria-hidden="true" size={16} strokeWidth={2.4} />
            <span>Admissions Open · Sector 12B, Dwarka</span>
          </div>

          <h1
            id="home-hero-heading"
            className={joinClasses(
              design.typography.heroTitle,
              "mt-6 max-w-[730px] text-pretty",
            )}
          >
            A warm beginning for{" "}
            <span className="text-[#5B2A86]">
              confident, curious children.
            </span>
          </h1>

          <p className="mt-6 max-w-[640px] text-pretty text-xl font-extrabold leading-8 text-[#5B2A86] sm:text-[1.35rem] sm:leading-9">
            Premium preschool and daycare for children aged 2–6 years in
            Sector 12, Dwarka.
          </p>

          <p
            className={joinClasses(
              design.typography.body,
              "mt-4 max-w-[645px] text-pretty",
            )}
          >
            Caring teachers, thoughtfully planned learning, nutritious meals
            and a welcoming environment where children can settle comfortably,
            make friends and enjoy coming to school.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              href={site.whatsappVisit}
              external
              variant="primary"
              size="lg"
              leftIcon={<MessageCircle aria-hidden="true" size={18} />}
              rightIcon={<ArrowRight aria-hidden="true" size={18} />}
              className="w-full sm:w-auto sm:min-w-[225px]"
              aria-label="Book a school visit at Kidzee Sector 12 Dwarka through WhatsApp"
            >
              Book a School Visit
            </Button>

            <Button
              href="/programmes"
              variant="secondary"
              size="lg"
              rightIcon={<ArrowRight aria-hidden="true" size={17} />}
              className="w-full sm:w-auto sm:min-w-[205px]"
            >
              Explore Programmes
            </Button>
          </div>

          <p className="mt-3 text-sm font-semibold leading-6 text-[#706675]">
            Visit the centre, meet our team and understand the right programme
            for your child.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {trustPoints.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-[22px] border border-[#E8DEEC] bg-white/85 p-4 shadow-[0_10px_30px_rgba(40,16,52,0.05)] backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:border-[#D8C5E1] hover:bg-white hover:shadow-[0_18px_42px_rgba(40,16,52,0.09)]"
              >
                <div className="flex items-start gap-3.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F8F3FB] text-[#5B2A86] transition-colors duration-300 group-hover:bg-[#F1E8F7]">
                    <Icon
                      aria-hidden="true"
                      size={18}
                      strokeWidth={2.25}
                    />
                  </span>

                  <div className="min-w-0">
                    <p className="text-[0.95rem] font-black leading-5 text-[#281034]">
                      {title}
                    </p>

                    <p className="mt-1 text-[0.82rem] leading-5 text-[#706875]">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-start gap-3.5 border-t border-[#5B2A86]/10 pt-6">
  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F8F3FB] text-[#5B2A86]">
    <Clock3 aria-hidden="true" size={19} strokeWidth={2.2} />
  </div>

  <div className="space-y-1">
    <p className="text-sm font-black text-[#281034]">
      Playgroup & Nursery:{" "}
      <span className="font-semibold text-[#675B6B]">
        9:30 AM – 12:30 PM
      </span>
    </p>

    <p className="text-sm font-black text-[#281034]">
      Junior KG & Senior KG:{" "}
      <span className="font-semibold text-[#675B6B]">
        9:30 AM – 1:00 PM
      </span>
    </p>

    <p className="text-sm font-black text-[#281034]">
      Daycare:{" "}
      <span className="font-semibold text-[#675B6B]">
        12:30 PM – 7:00 PM
      </span>
    </p>

    <p className="text-sm font-black text-[#281034]">
      Office Hours:{" "}
      <span className="font-semibold text-[#675B6B]">
        8:30 AM – 5:00 PM
      </span>
    </p>
  </div>
</div>
        </div>

        <div className="relative mx-auto w-full max-w-[760px] lg:pl-3">
          <div
            aria-hidden="true"
            className="absolute -left-12 top-16 h-56 w-56 rounded-full bg-[#F6C84B]/25 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -right-12 bottom-20 h-72 w-72 rounded-full bg-[#5B2A86]/15 blur-3xl"
          />

          <div className="relative pb-[210px] sm:pb-[185px] lg:pb-[205px]">
            <div className="group relative overflow-hidden rounded-[38px] border border-white/80 bg-white p-2.5 shadow-[0_30px_90px_rgba(40,16,52,0.18)] sm:p-3">
              <div className="relative overflow-hidden rounded-[30px]">
                <Image
                  src="/images/hero/hero-play-area.jpg"
                  alt="Children enjoying the indoor play and activity area at Kidzee Preschool Sector 12 Dwarka"
                  width={1200}
                  height={900}
                  priority
                  fetchPriority="high"
                  sizes="(max-width: 640px) 94vw, (max-width: 1024px) 88vw, 54vw"
                  className="h-[410px] w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025] sm:h-[520px] lg:h-[585px]"
                />

                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#281034]/45 via-transparent to-white/[0.04]"
                />

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                  <div className="max-w-[420px]">
                    <p className="text-sm font-black uppercase tracking-[0.12em] text-[#F6C84B]">
                      Everyday life at Kidzee
                    </p>

                    <p className="mt-2 text-xl font-black leading-7 text-white sm:text-2xl">
                      A real preschool environment filled with play, movement
                      and joyful learning.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute right-4 top-4 rounded-full border border-white/80 bg-white/95 px-3.5 py-2 text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#5B2A86] shadow-[0_12px_30px_rgba(40,16,52,0.12)] backdrop-blur sm:right-6 sm:top-6 sm:px-4 sm:text-xs">
              Playgroup to Senior KG
            </div>

            <div className="absolute -bottom-1 left-0 right-0 grid grid-cols-3 gap-2.5 px-1 sm:gap-4 sm:px-3">
              {supportingImages.map((image, index) => (
                <div
                  key={image.src}
                  className={joinClasses(
                    "group/card relative overflow-hidden rounded-[20px] border-[3px] border-white bg-white shadow-[0_18px_45px_rgba(40,16,52,0.15)] sm:rounded-[24px]",
                    index === 1 ? "translate-y-5" : "",
                  )}
                >
                  <div className="relative h-[125px] sm:h-[160px] lg:h-[175px]">
                    <Image
                      src={image.src}
                      alt={image.alt}
                      fill
                      sizes="(max-width: 640px) 30vw, (max-width: 1024px) 28vw, 17vw"
                      className="object-cover transition-transform duration-500 group-hover/card:scale-[1.04]"
                    />

                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-t from-[#281034]/70 via-transparent to-transparent"
                    />

                    <p className="absolute inset-x-0 bottom-0 p-2.5 text-[0.66rem] font-black leading-4 text-white sm:p-3.5 sm:text-xs sm:leading-5">
                      {image.label}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="absolute -left-2 bottom-[152px] hidden max-w-[255px] rounded-[22px] border border-white/90 bg-white/95 p-4 shadow-[0_20px_55px_rgba(40,16,52,0.16)] backdrop-blur sm:block lg:-left-7 lg:bottom-[177px]">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF4CC]">
                  <Star
                    aria-hidden="true"
                    size={22}
                    className="fill-[#F6C84B] text-[#D7A500]"
                  />
                </div>

                <div>
                  <p className="text-sm font-black leading-5 text-[#281034]">
                    Trusted by local families
                  </p>

                  <p className="mt-1 text-xs leading-5 text-[#6F6474]">
                    Genuine parent experiences available on our Google profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -right-2 bottom-[142px] hidden max-w-[235px] rounded-[22px] border border-white/10 bg-[#281034]/95 p-4 text-white shadow-[0_20px_55px_rgba(40,16,52,0.24)] backdrop-blur md:block lg:-right-7 lg:bottom-[168px]">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  aria-hidden="true"
                  size={22}
                  className="mt-0.5 shrink-0 text-[#F6C84B]"
                />

                <div>
                  <p className="text-sm font-black leading-5">
                    Safe, caring environment
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/75">
                    Planned around the comfort and wellbeing of young children.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}