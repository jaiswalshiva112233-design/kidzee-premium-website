import {
  BookOpenCheck,
  Building2,
  CheckCircle2,
  MessageCircleMore,
  ShieldCheck,
  Star,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const trustItems = [
  {
    icon: Building2,
    title: "Established Kidzee framework",
    text: "Our Sector 12B centre follows Kidzee’s early-childhood learning approach while providing personalised support to local families.",
  },
  {
    icon: BookOpenCheck,
    title: "Learning planned by age",
    text: "Classroom routines and activities are designed separately for Playgroup, Nursery, Junior KG and Senior KG.",
  },
  {
    icon: ShieldCheck,
    title: "Supervised daily routine",
    text: "Children remain under staff supervision during learning, play, meals, daycare and authorised handover.",
  },
  {
    icon: MessageCircleMore,
    title: "Parents stay informed",
    text: "Families receive practical updates and can speak directly with the centre team about their child’s routine and progress.",
  },
] as const;

const visitChecks = [
  "Meet the centre team",
  "See classrooms and play spaces",
  "Understand the daily routine",
] as const;

export default function TrustBar() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="relative overflow-hidden bg-[#FAF7FC] py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-0 h-80 w-80 rounded-full bg-[#EADDF1]/80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-72 w-72 rounded-full bg-[#F6C84B]/15 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-12 xl:gap-16">
          <div className="lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white px-4 py-2 text-[13px] font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(52,20,68,0.05)]">
              <Star
                aria-hidden="true"
                size={15}
                className="fill-[#F6C84B] text-[#D5A400]"
              />
              Built around parent confidence
            </div>

            <h2
              id="trust-heading"
              className="mt-5 max-w-xl text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[44px]"
            >
              Choose your child&apos;s preschool after seeing it for yourself.
            </h2>

            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#6F6474] sm:text-base sm:leading-8">
              We encourage parents to visit our Kidzee centre in Sector 12B,
              Dwarka, meet the team and understand how their child&apos;s day
              will be planned before taking an admission decision.
            </p>

            <div className="mt-6 space-y-3">
              {visitChecks.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 text-sm font-bold text-[#493B4F]"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3EAF8] text-[#5B2A86]">
                    <CheckCircle2 aria-hidden="true" size={16} />
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                href={site.whatsappVisit}
                external
                variant="primary"
                size="md"
                aria-label="Book a visit to Kidzee Sector 12 Dwarka through WhatsApp"
              >
                Book a Centre Visit
              </Button>

              <Button
                href={site.googleReviews}
                external
                variant="secondary"
                size="md"
                aria-label="Read Google reviews for Kidzee Sector 12 Dwarka"
              >
                Read Google Reviews
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item, index) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className={`group relative overflow-hidden rounded-[26px] border bg-white p-6 shadow-[0_14px_40px_rgba(52,20,68,0.055)] transition-all duration-300 hover:-translate-y-1 hover:border-[#5B2A86]/20 hover:shadow-[0_22px_54px_rgba(52,20,68,0.09)] sm:p-7 ${
                    index === 0
                      ? "border-[#5B2A86]/15"
                      : "border-[#5B2A86]/10"
                  }`}
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-12 -top-12 h-28 w-28 rounded-full bg-[#F3EAF8]/80 blur-2xl transition-transform duration-500 group-hover:scale-125"
                  />

                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#5B2A86]/10 bg-[#F3EAF8] text-[#5B2A86] transition-all duration-300 group-hover:border-[#5B2A86] group-hover:bg-[#5B2A86] group-hover:text-white">
                      <Icon aria-hidden="true" size={22} strokeWidth={2.1} />
                    </div>

                    <h3 className="mt-5 text-[19px] font-black leading-snug tracking-[-0.025em] text-[#2D1736]">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-[14px] leading-7 text-[#6F6474] sm:text-[15px]">
                      {item.text}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}