import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

export default function About() {
  return (
    <section
      id="about"
      aria-labelledby="about-heading"
      className="relative isolate overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 -z-10 h-80 w-80 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 -z-10 h-96 w-96 rounded-full bg-[#FFF3C8] blur-3xl"
      />

      <Container>
        <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 xl:gap-20">
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
              <figure className="relative mt-9 overflow-hidden rounded-[28px] bg-[#F8F3FC] shadow-[0_24px_70px_rgba(52,20,68,0.16)] sm:rounded-[38px]">
                <div className="relative aspect-[0.84/1]">
                  <Image
                    src="/images/about-main.jpg"
                    alt="Preschool classroom activity at Kidzee Sector 12 Dwarka"
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
                <figure className="relative overflow-hidden rounded-[24px] bg-[#FFF9E8] shadow-[0_18px_50px_rgba(52,20,68,0.12)] sm:rounded-[32px]">
                  <div className="relative aspect-square">
                    <Image
                      src="/images/about-small-1.jpg"
                      alt="Creative preschool activity at Kidzee Sector 12 Dwarka"
                      fill
                      sizes="(max-width: 640px) 38vw, (max-width: 1024px) 40vw, 22vw"
                      className="object-cover"
                    />
                  </div>
                </figure>

                <figure className="relative overflow-hidden rounded-[24px] bg-[#F8F3FC] shadow-[0_18px_50px_rgba(52,20,68,0.12)] sm:rounded-[32px]">
                  <div className="relative aspect-[1/1.08]">
                    <Image
                      src="/images/about-small-2.jpg"
                      alt="Children learning together in a preschool classroom"
                      fill
                      sizes="(max-width: 640px) 38vw, (max-width: 1024px) 40vw, 22vw"
                      className="object-cover"
                    />
                  </div>
                </figure>
              </div>
            </div>

            <div className="absolute bottom-3 left-3 right-3 rounded-[22px] border border-white/80 bg-white/95 px-4 py-4 shadow-[0_20px_50px_rgba(52,20,68,0.18)] backdrop-blur-md sm:bottom-5 sm:left-8 sm:right-auto sm:max-w-[330px] sm:px-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2E8F8] text-[#5B2A86]">
                  <MapPin aria-hidden="true" size={18} />
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-[#5B2A86] sm:text-xs">
                    Sector 12B, Dwarka
                  </p>

                  <p className="mt-1 text-sm font-semibold leading-6 text-[#4F4B57]">
                    Preschool and daycare located within the neighbourhood.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-2xl lg:mx-0">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
              About our centre
            </p>

            <h2
              id="about-heading"
              className="mt-5 text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-5xl"
            >
              A local Kidzee centre for children in their early school years.
            </h2>

            <p className="mt-6 text-base leading-8 text-[#6F6474] sm:text-lg">
              Kidzee Sector 12, Dwarka offers preschool programmes from
              Playgroup to Senior KG, along with daycare support for families
              who need a longer supervised day.
            </p>

            <p className="mt-4 text-base leading-8 text-[#6F6474] sm:text-lg">
              Children take part in classroom activities, stories, conversation,
              movement, creative work and play as part of a regular school
              routine. Parents can visit the centre and speak with the team
              before deciding which programme is suitable for their child.
            </p>

            <div className="mt-8 rounded-[28px] border border-[#5B2A86]/10 bg-[#FAF7FC] p-6 sm:p-7">
              <p className="text-lg font-black text-[#2D1736]">
                Preschool and daycare in one centre
              </p>

              <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                Families can enquire about preschool-only admission, daycare
                or a combined preschool and daycare routine based on their
                requirements.
              </p>
            </div>

            <div className="mt-8">
              <Button
                href="/about"
                variant="secondary"
                rightIcon={<ArrowRight size={18} />}
              >
                About Kidzee Sector 12
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}