import {
  BookOpenCheck,
  Building2,
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
    title: "Part of the Kidzee network",
    text: "Our centre follows the established Kidzee preschool framework while serving families in Sector 12B, Dwarka.",
  },
  {
    icon: BookOpenCheck,
    title: "Focused on early-years learning",
    text: "Classroom routines, activities and expectations are planned specifically for children between 2 and 6 years.",
  },
  {
    icon: MessageCircleMore,
    title: "Clear parent communication",
    text: "Parents receive practical updates and can speak directly with the centre team about their child’s routine and progress.",
  },
  {
    icon: ShieldCheck,
    title: "Everyday supervision",
    text: "Children remain under staff supervision through classroom time, play, meals, daycare and authorised handover.",
  },
] as const;

export default function TrustBar() {
  return (
    <section
      aria-labelledby="trust-heading"
      className="relative overflow-hidden bg-[#FAF7FC] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-10 h-80 w-80 rounded-full bg-[#EADDF1] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 bottom-6 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white px-4 py-2 text-sm font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(52,20,68,0.06)]">
              <Star
                aria-hidden="true"
                size={16}
                className="fill-[#F6C84B] text-[#D5A400]"
              />
              A centre parents can evaluate clearly
            </div>

            <h2
              id="trust-heading"
              className="mt-6 max-w-xl text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-5xl"
            >
              Trust is built through what parents can see and verify.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#6F6474] sm:text-lg">
              We encourage families to visit the centre, meet the team, review
              the daily routine and ask direct questions before making an
              admission decision.
            </p>

            <div className="mt-7 rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_16px_46px_rgba(52,20,68,0.06)] sm:p-7">
              <p className="text-lg font-black text-[#2D1736]">
                See genuine parent feedback
              </p>

              <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                Read public Google reviews from families who have interacted
                with our centre.
              </p>

              <Button
                href={site.googleReviews}
                external
                variant="secondary"
                size="sm"
                className="mt-5"
              >
                Read Google Reviews
              </Button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {trustItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="group rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_14px_42px_rgba(52,20,68,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_58px_rgba(52,20,68,0.10)] sm:p-7"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86] transition-colors duration-300 group-hover:bg-[#5B2A86] group-hover:text-white">
                    <Icon aria-hidden="true" size={22} />
                  </div>

                  <h3 className="mt-5 text-xl font-black tracking-[-0.02em] text-[#2D1736]">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                    {item.text}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}