import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Heart,
  MapPin,
  Sparkles,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const highlights = [
  {
    icon: Heart,
    title: "Warm, attentive relationships",
    description:
      "Our educators take time to understand each child’s personality, comfort level and individual learning pace.",
  },
  {
    icon: BookOpen,
    title: "Purposeful early learning",
    description:
      "Thoughtfully planned experiences support communication, confidence, curiosity and school readiness.",
  },
  {
    icon: Sparkles,
    title: "A joyful childhood experience",
    description:
      "Play, movement, stories, creativity and friendships remain an important part of every child’s day.",
  },
];

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-40 top-24 h-80 w-80 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#FFF3C8] blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 xl:gap-20">
          {/* Image composition */}
          <div className="relative mx-auto w-full max-w-[650px]">
            <div
              aria-hidden="true"
              className="absolute -left-4 top-10 h-24 w-24 rounded-[28px] bg-[#F6C84B]/80 sm:-left-7 sm:h-28 sm:w-28"
            />

            <div
              aria-hidden="true"
              className="absolute -right-4 bottom-20 h-28 w-28 rounded-full bg-[#E5D6EE] sm:-right-7 sm:h-36 sm:w-36"
            />

            <div className="relative grid grid-cols-[1.08fr_0.92fr] gap-3 sm:gap-5">
              <div className="relative mt-9 overflow-hidden rounded-[28px] bg-[#F8F3FC] shadow-[0_24px_70px_rgba(52,20,68,0.16)] sm:rounded-[38px]">
                <div className="relative aspect-[0.84/1]">
                  <Image
                    src="/images/about-main.jpg"
                    alt="Children taking part in a classroom activity at Kidzee Sector 12, Dwarka"
                    fill
                    priority={false}
                    sizes="(max-width: 640px) 56vw, (max-width: 1024px) 52vw, 30vw"
                    className="object-cover"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
                  />
                </div>
              </div>

              <div className="space-y-3 sm:space-y-5">
                <div className="relative overflow-hidden rounded-[24px] bg-[#FFF9E8] shadow-[0_18px_50px_rgba(52,20,68,0.12)] sm:rounded-[32px]">
                  <div className="relative aspect-square">
                    <Image
                      src="/images/about-small-1.jpg"
                      alt="A creative learning activity at Kidzee Sector 12, Dwarka"
                      fill
                      sizes="(max-width: 640px) 38vw, (max-width: 1024px) 40vw, 22vw"
                      className="object-cover"
                    />
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-[24px] bg-[#F8F3FC] shadow-[0_18px_50px_rgba(52,20,68,0.12)] sm:rounded-[32px]">
                  <div className="relative aspect-[1/1.08]">
                    <Image
                      src="/images/about-small-2.jpg"
                      alt="Children learning together in a caring preschool classroom"
                      fill
                      sizes="(max-width: 640px) 38vw, (max-width: 1024px) 40vw, 22vw"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 rounded-[22px] border border-white/80 bg-white/95 px-4 py-4 shadow-[0_20px_50px_rgba(52,20,68,0.18)] backdrop-blur-md sm:bottom-5 sm:left-8 sm:right-auto sm:max-w-[330px] sm:px-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2E8F8] text-[#5B2A86]">
                  <MapPin aria-hidden="true" size={18} />
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#5B2A86] sm:text-xs">
                    Your neighbourhood preschool
                  </p>

                  <p className="mt-1 text-sm font-semibold leading-6 text-[#4F4B57]">
                    Conveniently located in Sector 12B, Dwarka for nearby
                    families.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="mx-auto max-w-2xl lg:mx-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D6EE] bg-[#F8F3FC] px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-[#5B2A86]">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-[#F6C84B]"
              />

              About Kidzee Sector 12, Dwarka
            </div>

            <h2
              id="about-heading"
              className="mt-6 text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-[#2C1735] sm:text-5xl lg:text-[56px]"
            >
              A preschool where every child feels{" "}
              <span className="text-[#5B2A86]">
                understood, secure and encouraged
              </span>
            </h2>

            <p className="mt-6 text-base leading-8 text-[#5F5F6D] sm:text-lg">
              Kidzee Sector 12, Dwarka offers a warm and thoughtfully designed
              early-years environment where children can settle comfortably,
              participate confidently and enjoy coming to school each day.
            </p>

            <p className="mt-4 text-base leading-8 text-[#5F5F6D] sm:text-lg">
              We bring together Kidzee&apos;s trusted early-childhood learning
              approach and the attentive care of a neighbourhood preschool.
              Children are encouraged to explore, communicate, create and
              become more independent at a pace that feels natural to them.
            </p>

            <div className="mt-9 grid gap-4">
              {highlights.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="group flex gap-4 rounded-[24px] border border-[#EADFF0] bg-[#FFFDF9] p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#D8C4E3] hover:shadow-[0_16px_44px_rgba(52,20,68,0.09)]"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#5B2A86] transition-colors duration-300 group-hover:bg-[#5B2A86] group-hover:text-white">
                      <Icon aria-hidden="true" size={21} />
                    </div>

                    <div>
                      <h3 className="text-lg font-black text-[#32153F]">
                        {item.title}
                      </h3>

                      <p className="mt-1 text-sm leading-6 text-[#5F5F6D] sm:text-base">
                        {item.description}
                      </p>
                    </div>
                  </article>
                );
              })}
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                href={site.whatsapp}
                external
                ariaLabel="Speak with the Kidzee Sector 12 Dwarka admissions team on WhatsApp"
              >
                Speak With Our Team
                <ArrowRight aria-hidden="true" size={18} />
              </Button>

              <Button href="/programmes" variant="secondary">
                Explore Programmes
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}