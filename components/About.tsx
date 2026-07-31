import Image from "next/image";
import { ArrowRight, Heart, MapPin, Sparkles } from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

const centreHighlights = [
  "A warm start to school life",
  "Learning through play and conversation",
  "Care that respects every child’s pace",
] as const;

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative isolate overflow-hidden bg-white py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-44 top-16 -z-10 h-80 w-80 rounded-full bg-[#F2E8F8]/90 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 bottom-0 -z-10 h-96 w-96 rounded-full bg-[#FFF3C8]/80 blur-3xl"
      />

      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-14 xl:gap-20">
          <div className="relative mx-auto w-full max-w-[650px]">
            <div
              aria-hidden="true"
              className="absolute -left-4 top-10 h-24 w-24 rounded-[26px] bg-[#F6C84B]/75 sm:-left-7 sm:h-28 sm:w-28"
            />

            <div
              aria-hidden="true"
              className="absolute -right-4 bottom-20 h-28 w-28 rounded-full bg-[#E5D6EE] sm:-right-7 sm:h-36 sm:w-36"
            />

            <div className="relative grid grid-cols-[1.08fr_0.92fr] gap-3 sm:gap-5">
              <figure className="relative mt-9 overflow-hidden rounded-[28px] bg-[#F8F3FC] shadow-[0_24px_64px_rgba(52,20,68,0.14)] sm:rounded-[36px]">
                <div className="relative aspect-[0.84/1]">
                  <Image
                    src="/images/about-main.jpg"
                    alt="Children taking part in a classroom activity at Kidzee Sector 12 Dwarka"
                    fill
                    sizes="(max-width: 640px) 56vw, (max-width: 1024px) 52vw, 30vw"
                    className="object-cover"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"
                  />
                </div>
              </figure>

              <div className="space-y-3 sm:space-y-5">
                <figure className="relative overflow-hidden rounded-[24px] bg-[#FFF9E8] shadow-[0_18px_46px_rgba(52,20,68,0.1)] sm:rounded-[30px]">
                  <div className="relative aspect-square">
                    <Image
                      src="/images/about-small-1.jpg"
                      alt="Creative activity for preschool children at Kidzee Sector 12 Dwarka"
                      fill
                      sizes="(max-width: 640px) 38vw, (max-width: 1024px) 40vw, 22vw"
                      className="object-cover"
                    />
                  </div>
                </figure>

                <figure className="relative overflow-hidden rounded-[24px] bg-[#F8F3FC] shadow-[0_18px_46px_rgba(52,20,68,0.1)] sm:rounded-[30px]">
                  <div className="relative aspect-[1/1.08]">
                    <Image
                      src="/images/about-small-2.jpg"
                      alt="Preschool children learning and playing together"
                      fill
                      sizes="(max-width: 640px) 38vw, (max-width: 1024px) 40vw, 22vw"
                      className="object-cover"
                    />
                  </div>
                </figure>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 rounded-[22px] border border-white/80 bg-white/95 px-4 py-4 shadow-[0_18px_46px_rgba(52,20,68,0.16)] backdrop-blur-md sm:bottom-5 sm:left-8 sm:right-auto sm:max-w-[335px] sm:px-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2E8F8] text-[#5B2A86]">
                  <MapPin aria-hidden="true" size={18} />
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#5B2A86] sm:text-xs">
                    Sector 12B, Dwarka
                  </p>

                  <p className="mt-1 text-sm font-semibold leading-6 text-[#4F4B57]">
                    A neighbourhood preschool and daycare for local families.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-2xl lg:mx-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-[#FAF7FC] px-4 py-2 text-[13px] font-black text-[#5B2A86]">
              <Heart
                aria-hidden="true"
                size={15}
                className="fill-[#F6C84B] text-[#D5A400]"
              />
              About our centre
            </div>

            <h2
              id="about-heading"
              className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              A place where children feel comfortable being curious.
            </h2>

            <p className="mt-5 text-base leading-8 text-[#6F6474] sm:text-lg">
              Starting preschool is a big step for a young child. At Kidzee
              Sector 12, Dwarka, we aim to make that transition feel warm,
              familiar and encouraging from the beginning.
            </p>

            <p className="mt-4 text-base leading-8 text-[#6F6474] sm:text-lg">
              Through stories, conversation, movement, creative activities and
              purposeful play, children gradually learn to express themselves,
              follow routines and participate confidently with others.
            </p>

            <div className="mt-7 space-y-3">
              {centreHighlights.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-2xl border border-[#5B2A86]/8 bg-[#FAF7FC] px-4 py-3.5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-[#5B2A86] shadow-[0_6px_18px_rgba(52,20,68,0.07)]">
                    <Sparkles aria-hidden="true" size={16} />
                  </span>

                  <span className="text-sm font-bold leading-6 text-[#493B4F] sm:text-[15px]">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Button
                href="/about"
                variant="secondary"
                rightIcon={<ArrowRight size={18} />}
              >
                Discover Our Centre
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}