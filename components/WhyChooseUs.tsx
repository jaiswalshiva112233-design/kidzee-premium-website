import {
  Blocks,
  Brain,
  GraduationCap,
  HandHeart,
  MessageCircleMore,
  ShieldCheck,
  Users,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const reasons = [
  {
    icon: Brain,
    title: "Learning suited to young children",
    description:
      "Classroom experiences are planned around how children naturally learn through play, conversation, movement and exploration.",
  },
  {
    icon: Users,
    title: "Smaller classroom groups",
    description:
      "Our planned teacher-child ratios support closer observation, guidance and participation during the school day.",
  },
  {
    icon: HandHeart,
    title: "Supportive settling-in process",
    description:
      "Teachers help children become comfortable with the classroom, daily routine and separation from parents at their own pace.",
  },
  {
    icon: MessageCircleMore,
    title: "Regular parent communication",
    description:
      "Parents receive practical updates about classroom participation, routines and areas where their child may need support.",
  },
  {
    icon: Blocks,
    title: "Space for active and creative play",
    description:
      "Children have opportunities for indoor play, movement, art, stories and hands-on classroom activities.",
  },
  {
    icon: ShieldCheck,
    title: "Supervised school environment",
    description:
      "Entry, classrooms, play spaces and child handover follow centre procedures designed around everyday safety.",
  },
] as const;

export default function WhyChooseUs() {
  return (
    <section
      aria-labelledby="why-choose-us-heading"
      className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 bottom-10 h-80 w-80 rounded-full bg-[#F6C84B]/15 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 top-12 h-80 w-80 rounded-full bg-[#EADDF1]/70 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7A459C]">
              Why families choose us
            </p>

            <h2
              id="why-choose-us-heading"
              className="mt-4 max-w-xl text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-5xl"
            >
              Practical care and learning for the early school years.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Parents need more than impressive promises. They need a school
              where their child is noticed, supported and gradually becomes
              confident in everyday routines.
            </p>

            <div className="mt-7 rounded-[26px] border border-[#5B2A86]/10 bg-[#FAF7FC] p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-[0_10px_30px_rgba(52,20,68,0.07)]">
                  <GraduationCap aria-hidden="true" size={24} />
                </div>

                <div>
                  <h3 className="text-xl font-black text-[#2D1736]">
                    Visit before deciding
                  </h3>

                  <p className="mt-2 text-[15px] leading-7 text-[#6F6474]">
                    Meet the team, see the classrooms and understand the daily
                    routine before choosing a programme.
                  </p>
                </div>
              </div>
            </div>

            <Button
              href={site.whatsappVisit}
              external
              variant="primary"
              size="lg"
              className="mt-7"
            >
              Book a School Visit
            </Button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {reasons.map((reason, index) => {
              const Icon = reason.icon;

              return (
                <article
                  key={reason.title}
                  className="group rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_14px_42px_rgba(52,20,68,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_58px_rgba(52,20,68,0.10)] sm:p-7"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86] transition-colors duration-300 group-hover:bg-[#5B2A86] group-hover:text-white">
                      <Icon aria-hidden="true" size={22} />
                    </div>

                    <span
                      aria-hidden="true"
                      className="text-sm font-black text-[#5B2A86]/25"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <h3 className="mt-5 text-xl font-black tracking-[-0.02em] text-[#2D1736]">
                    {reason.title}
                  </h3>

                  <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                    {reason.description}
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