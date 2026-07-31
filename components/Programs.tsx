import Image from "next/image";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { programmes, site } from "@/lib/site";

const programmeTimings: Record<string, string> = {
  playgroup: "9:30 AM–12:30 PM",
  nursery: "9:30 AM–12:30 PM",
  "junior-kg": "9:30 AM–1:00 PM",
  "senior-kg": "9:30 AM–1:00 PM",
};

export default function Programs() {
  return (
    <section
      id="programmes"
      aria-labelledby="programmes-heading"
      className="relative overflow-hidden bg-white py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-[#EADDF1]/65 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-20 h-80 w-80 rounded-full bg-[#F6C84B]/15 blur-3xl"
      />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-[#FAF7FC] px-4 py-2 text-[13px] font-black text-[#5B2A86]">
            <Sparkles
              aria-hidden="true"
              size={15}
              className="text-[#D5A400]"
            />
            Preschool programmes
          </div>

          <h2
            id="programmes-heading"
            className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
          >
            Learning that grows with your child at every stage.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
            From a gentle first introduction to school through preparation for
            primary classes, each programme is planned around the needs of its
            age group.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {programmes.map((programme) => (
            <article
              key={programme.slug}
              className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#5B2A86]/10 bg-white shadow-[0_16px_48px_rgba(52,20,68,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#5B2A86]/20 hover:shadow-[0_24px_65px_rgba(52,20,68,0.12)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-[#F3EAF8]">
                <Image
                  src={programme.image}
                  alt={`${programme.title} classroom activities at Kidzee Sector 12 Dwarka`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#281034]/40 via-transparent to-transparent"
                />

                <span className="absolute bottom-4 left-4 rounded-full border border-white/70 bg-white/95 px-3.5 py-2 text-xs font-black text-[#5B2A86] shadow-lg backdrop-blur-sm">
                  {programme.age}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-2xl font-black tracking-[-0.025em] text-[#2D1736]">
                  {programme.title}
                </h3>

                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-[#746779]">
                  <Clock3
                    aria-hidden="true"
                    size={16}
                    className="shrink-0 text-[#5B2A86]"
                  />

                  {programmeTimings[programme.slug] ?? programme.time}
                </div>

                <p className="mt-4 text-[15px] leading-7 text-[#6F6474]">
                  {programme.intro}
                </p>

                <div className="mt-5 space-y-3 border-t border-[#5B2A86]/8 pt-5">
                  {programme.highlights.map((highlight) => (
                    <div
                      key={highlight}
                      className="flex items-start gap-2.5"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        size={17}
                        className="mt-1 shrink-0 text-[#5B2A86]"
                      />

                      <span className="text-[13px] font-semibold leading-6 text-[#554A59]">
                        {highlight}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-auto pt-5">
                  <Button
                    href={`/programmes/${programme.slug}`}
                    variant="ghost"
                    size="sm"
                    className="w-fit !px-0 hover:!bg-transparent"
                    rightIcon={<ArrowRight size={17} />}
                    aria-label={`Explore the ${programme.title} programme`}
                  >
                    Explore programme
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-6 rounded-[30px] border border-[#5B2A86]/8 bg-[#F7F0FA] px-6 py-8 text-center sm:px-8 lg:mt-12 lg:flex-row lg:px-10 lg:py-9 lg:text-left">
          <div className="max-w-2xl">
            <h3 className="text-2xl font-black tracking-[-0.025em] text-[#2D1736] sm:text-3xl">
              Not sure which programme is right for your child?
            </h3>

            <p className="mt-3 leading-7 text-[#6F6474]">
              Tell us your child&apos;s age and previous school experience. Our
              team will explain the suitable programme, classroom routine and
              current availability.
            </p>
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <Button
              href={site.whatsappProgrammes}
              external
              variant="primary"
              size="md"
              leftIcon={<MessageCircle size={18} />}
            >
              Ask on WhatsApp
            </Button>

            <Button
              href="/programmes"
              variant="secondary"
              size="md"
              rightIcon={<ArrowRight size={18} />}
            >
              View All Programmes
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}