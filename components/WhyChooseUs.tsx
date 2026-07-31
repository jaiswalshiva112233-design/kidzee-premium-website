import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  GraduationCap,
  HeartHandshake,
  MapPin,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
  Users,
  Utensils,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const reasons = [
  {
    icon: Users,
    title: "More attention in the classroom",
    description:
      "Our teacher-child ratio is 1:8 for Playgroup and Nursery, and 1:10 for Junior KG and Senior KG, helping teachers notice how each child is settling, participating and progressing.",
  },
  {
    icon: HeartHandshake,
    title: "A gentle settling-in approach",
    description:
      "Young children are given time and reassurance as they adjust to separation, classroom routines, new faces and participating with a group.",
  },
  {
    icon: BookOpenCheck,
    title: "Learning planned for each age",
    description:
      "Playgroup, Nursery, Junior KG and Senior KG follow age-appropriate learning experiences designed around children’s readiness and early developmental needs.",
  },
  {
    icon: MessageCircleMore,
    title: "Parents stay informed",
    description:
      "Families can speak directly with the centre team about classroom participation, daily routines, settling-in concerns and their child’s progress.",
  },
  {
    icon: Utensils,
    title: "A comfortable morning routine",
    description:
      "Breakfast is included in the preschool monthly fee, helping children follow a familiar and consistent routine during school hours.",
  },
  {
    icon: Clock3,
    title: "Support beyond preschool hours",
    description:
      "Daycare is available until 7:00 PM, allowing families to choose preschool, daycare or a routine that combines both.",
  },
] as const;

const centreFacts = [
  {
    icon: ShieldCheck,
    title: "3-day trial available",
    text: "A gentle introduction before regular attendance.",
  },
  {
    icon: GraduationCap,
    title: "For children aged 2–6 years",
    text: "From Playgroup through Senior KG.",
  },
  {
    icon: MapPin,
    title: "Sector 12B, Dwarka",
    text: "Conveniently located for nearby Dwarka families.",
  },
] as const;

export default function WhyChooseUs() {
  return (
    <section
      aria-labelledby="why-choose-us-heading"
      className="relative isolate overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-40 bottom-8 h-96 w-96 rounded-full bg-[#F6C84B]/14 blur-3xl" />

        <div className="absolute -right-44 top-10 h-[420px] w-[420px] rounded-full bg-[#EADDF1]/70 blur-3xl" />

        <div className="absolute left-[43%] top-[38%] h-56 w-56 rounded-full bg-[#5B2A86]/[0.04] blur-3xl" />
      </div>

      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.76fr_1.24fr] lg:gap-14 xl:gap-18">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-[#FAF7FC] px-4 py-2 text-[13px] font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(52,20,68,0.04)]">
              <Sparkles
                aria-hidden="true"
                size={15}
                className="text-[#D5A400]"
              />

              Why families choose our centre
            </div>

            <h2
              id="why-choose-us-heading"
              className="mt-5 max-w-xl text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              The everyday details that help children feel comfortable and
              parents feel confident.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#6F6474] sm:text-lg">
              A preschool should work well for the child and the family. That
              means thoughtful classroom attention, dependable routines, clear
              communication and support that fits into everyday life.
            </p>

            <div className="mt-8 rounded-[30px] border border-[#5B2A86]/10 bg-gradient-to-br from-[#FBF8FD] to-white p-6 shadow-[0_18px_52px_rgba(52,20,68,0.06)] sm:p-7">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5B2A86] text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)]">
                  <GraduationCap aria-hidden="true" size={23} />
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#2D1736]">
                    Helpful details before your visit
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[#6F6474]">
                    A quick overview of the centre and the support available.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {centreFacts.map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="group flex items-start gap-3.5 rounded-[20px] border border-[#5B2A86]/[0.08] bg-white px-4 py-4 transition duration-300 hover:-translate-y-0.5 hover:border-[#5B2A86]/15 hover:shadow-[0_12px_28px_rgba(52,20,68,0.06)]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3EAF8] text-[#5B2A86] transition-colors duration-300 group-hover:bg-[#5B2A86] group-hover:text-white">
                      <Icon aria-hidden="true" size={17} />
                    </span>

                    <div>
                      <p className="text-sm font-black leading-5 text-[#35223D]">
                        {title}
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#756A79]">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
              <Button
                href={site.whatsappTrial}
                external
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                className="w-full sm:w-auto lg:w-full xl:w-auto"
                aria-label="Ask Kidzee Sector 12 Dwarka about the 3-day preschool trial"
              >
                Ask About the 3-Day Trial
              </Button>

              <Button
                href={site.whatsappVisit}
                external
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto lg:w-full xl:w-auto"
                aria-label="Book a visit to Kidzee Sector 12 Dwarka"
              >
                Book a Centre Visit
              </Button>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {reasons.map((reason, index) => {
              const Icon = reason.icon;

              return (
                <article
                  key={reason.title}
                  className="group relative min-h-[260px] overflow-hidden rounded-[30px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_14px_42px_rgba(52,20,68,0.055)] transition duration-300 hover:-translate-y-1.5 hover:border-[#5B2A86]/20 hover:shadow-[0_24px_60px_rgba(52,20,68,0.10)] sm:p-7"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-14 -top-14 h-36 w-36 rounded-full bg-[#F3EAF8]/80 blur-2xl transition-transform duration-500 group-hover:scale-125"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-[#5B2A86] to-[#F6C84B] transition-transform duration-500 group-hover:scale-x-100"
                  />

                  <div className="relative flex h-full flex-col">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86] transition-all duration-300 group-hover:rotate-[-3deg] group-hover:bg-[#5B2A86] group-hover:text-white">
                        <Icon aria-hidden="true" size={22} />
                      </div>

                      <span
                        aria-hidden="true"
                        className="text-sm font-black tracking-[0.12em] text-[#5B2A86]/25"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>

                    <h3 className="mt-6 text-xl font-black tracking-[-0.025em] text-[#2D1736]">
                      {reason.title}
                    </h3>

                    <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                      {reason.description}
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