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
    description: "Help your child settle in comfortably.",
  },
  {
    icon: UsersRound,
    title: "Thoughtful Ratios",
    description: "1:8 for Playgroup and Nursery.",
  },
  {
    icon: Utensils,
    title: "Meals Included",
    description: "Fresh meals during preschool hours.",
  },
  {
    icon: Clock3,
    title: "Daycare Till 7 PM",
    description: "Flexible support for working families.",
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
        <div className="absolute -left-20 top-32 h-64 w-64 rounded-full border border-[#5B2A86]/[0.06]" />

        <div className="absolute left-[7%] top-[24%] h-24 w-24 rounded-full border border-[#5B2A86]/10" />

        <div className="absolute right-[7%] top-[12%] h-40 w-40 rounded-full bg-[#F6C84B]/20 blur-3xl" />

        <div className="absolute bottom-[5%] left-[44%] h-48 w-48 rounded-full bg-[#5B2A86]/10 blur-3xl" />
      </div>

      <Container className="grid min-h-[700px] items-center gap-14 pb-20 pt-10 lg:grid-cols-[0.94fr_1.06fr] lg:gap-16 lg:pb-24 lg:pt-14">
        <div className="relative z-10 max-w-[660px]">
          <div className={design.badges.light}>
            <MapPin aria-hidden="true" size={16} strokeWidth={2.4} />

            <span>Admissions Open · Sector 12B, Dwarka</span>
          </div>

          <h1
            id="home-hero-heading"
            className={joinClasses(
              design.typography.heroTitle,
              "mt-6 max-w-[670px] text-balance",
            )}
          >
            Premium Preschool &amp; Daycare in Sector 12, Dwarka
          </h1>

          <p className="mt-5 max-w-[610px] text-balance text-xl font-bold leading-8 text-[#5B2A86] sm:text-[1.35rem] sm:leading-9">
            A caring start where curiosity grows and confidence blossoms.
          </p>

          <p
            className={joinClasses(
              design.typography.body,
              "mt-4 max-w-[620px]",
            )}
          >
            Kidzee Sector 12, Dwarka offers preschool programmes for
            children aged 2–6 years, along with daycare, meals and
            transport support for nearby families.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button
              href={site.whatsappVisit}
              external
              variant="primary"
              size="lg"
              leftIcon={<MessageCircle aria-hidden="true" size={18} />}
              rightIcon={<ArrowRight aria-hidden="true" size={18} />}
              className="sm:min-w-[215px]"
              aria-label="Book a visit to Kidzee Sector 12 Dwarka through WhatsApp"
            >
              Book a School Visit
            </Button>

            <Button
              href="/programmes"
              variant="secondary"
              size="lg"
              className="sm:min-w-[195px]"
            >
              Explore Programmes
            </Button>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-3">
            {trustPoints.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group rounded-[20px] border border-[#E9E0ED] bg-white/80 p-4 shadow-[0_10px_30px_rgba(40,16,52,0.05)] backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:border-[#DCCBE5] hover:bg-white hover:shadow-[0_16px_38px_rgba(40,16,52,0.08)]"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8F4FC] text-[#5B2A86]">
                    <Icon
                      aria-hidden="true"
                      size={17}
                      strokeWidth={2.25}
                    />
                  </span>

                  <div>
                    <p className="text-sm font-black leading-5 text-[#281034] sm:text-[0.95rem]">
                      {title}
                    </p>

                    <p className="mt-1 hidden text-xs leading-5 text-[#7A737D] sm:block">
                      {description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-7 flex items-start gap-3 border-t border-[#5B2A86]/10 pt-6">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#F8F4FC] text-[#5B2A86]">
              <Clock3 aria-hidden="true" size={19} strokeWidth={2.2} />
            </div>

            <div>
              <p className="text-sm font-black text-[#281034]">
                Preschool: {site.preschoolHours.display}
              </p>

              <p className="mt-1 text-sm leading-6 text-[#675B6B]">
                Daycare: {site.daycareHours.display}
              </p>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[710px] lg:pl-3">
          <div
            aria-hidden="true"
            className="absolute -left-10 top-12 h-48 w-48 rounded-full bg-[#F6C84B]/25 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -right-10 bottom-8 h-60 w-60 rounded-full bg-[#5B2A86]/15 blur-3xl"
          />

          <div className="group relative">
            <div className={design.images.frame}>
              <Image
                src="/images/hero-main.jpg"
                alt="Children learning with their teacher at Kidzee Sector 12 Dwarka"
                width={1100}
                height={950}
                priority
                sizes="(max-width: 1024px) 100vw, 53vw"
                className="h-[430px] w-full object-cover object-center transition duration-700 ease-out group-hover:scale-[1.018] sm:h-[560px] lg:h-[610px]"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#281034]/20 via-transparent to-white/[0.03]"
              />
            </div>

            <div className="absolute right-3 top-3 rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#5B2A86] shadow-[0_12px_30px_rgba(40,16,52,0.10)] backdrop-blur sm:right-5 sm:top-5">
              Playgroup to Senior KG
            </div>

            <div className="absolute -bottom-8 left-3 max-w-[330px] rounded-[24px] border border-white/90 bg-white/95 p-4 shadow-[0_22px_60px_rgba(40,16,52,0.16)] backdrop-blur sm:-left-5 sm:p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#FFF4CC]">
                  <Star
                    aria-hidden="true"
                    size={25}
                    className="fill-[#F6C84B] text-[#D7A500]"
                  />
                </div>

                <div>
                  <p className="text-base font-black text-[#281034] sm:text-lg">
                    Trusted by local families
                  </p>

                  <p className="mt-1 text-sm leading-5 text-[#6F6474]">
                    Read genuine parent experiences on our Google profile.
                  </p>
                </div>
              </div>
            </div>

            <div className="absolute -right-3 bottom-20 hidden max-w-[230px] rounded-[22px] border border-white/90 bg-[#281034]/95 p-4 text-white shadow-[0_20px_55px_rgba(40,16,52,0.24)] backdrop-blur md:block lg:-right-7">
              <div className="flex items-start gap-3">
                <ShieldCheck
                  aria-hidden="true"
                  size={22}
                  className="mt-0.5 shrink-0 text-[#F6C84B]"
                />

                <div>
                  <p className="text-sm font-black">
                    Safe, caring environment
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/70">
                    Designed around the comfort and wellbeing of young
                    children.
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