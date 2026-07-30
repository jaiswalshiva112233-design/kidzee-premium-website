import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  HeartHandshake,
  MessageCircle,
  Palette,
  ShieldCheck,
  Sparkles,
  Utensils,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const daycareFeatures = [
  {
    icon: HeartHandshake,
    title: "Comfortable daily routine",
    description:
      "Children have time for meals, rest, quiet play and age-appropriate activities.",
  },
  {
    icon: BookOpenCheck,
    title: "Homework support",
    description:
      "School-going children can receive guidance with reading, revision and everyday assignments.",
  },
  {
    icon: Sparkles,
    title: "Enrichment activities",
    description:
      "Scheduled sessions may include dance, taekwondo, storytelling and personality development.",
  },
  {
    icon: Palette,
    title: "Creative and active play",
    description:
      "Art, craft, movement and supervised play help children stay engaged through the afternoon.",
  },
] as const;

const routineItems = [
  {
    icon: Utensils,
    label: "Meals",
  },
  {
    icon: HeartHandshake,
    label: "Rest time",
  },
  {
    icon: BookOpenCheck,
    label: "Homework",
  },
  {
    icon: Sparkles,
    label: "Activities",
  },
] as const;

export default function Daycare() {
  return (
    <section
      id="daycare"
      aria-labelledby="daycare-heading"
      className="relative overflow-hidden bg-[#FAF7FC] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-14 h-80 w-80 rounded-full bg-[#EADDF1] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 bottom-10 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white px-4 py-2 text-sm font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(52,20,68,0.06)]">
              <Clock3 aria-hidden="true" size={16} />
              Daycare until 7:00 PM
            </div>

            <h2
              id="daycare-heading"
              className="mt-6 max-w-xl text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-5xl"
            >
              A familiar place for children after preschool or school.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Our daycare in Sector 12B, Dwarka provides supervised care with
              meals, rest, homework support, activities and flexible pick-up
              for working families.
            </p>

            <div className="mt-7 rounded-[26px] border border-[#5B2A86]/10 bg-white p-5 shadow-[0_16px_45px_rgba(52,20,68,0.06)] sm:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                  <Clock3 aria-hidden="true" size={23} />
                </div>

                <div>
                  <p className="text-sm font-bold text-[#766A7A]">
                    Daycare timing
                  </p>

                  <p className="mt-1 text-xl font-black text-[#2D1736]">
                    {site.daycareHours.display}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-[#6F6474]">
                    Contact the centre to discuss the care duration and routine
                    that suits your child.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                href={site.whatsappDaycare}
                external
                variant="primary"
                size="lg"
                leftIcon={<MessageCircle size={18} />}
                rightIcon={<ArrowRight size={18} />}
              >
                Ask About Daycare
              </Button>

              <Button
                href="/daycare"
                variant="secondary"
                size="lg"
              >
                View Daycare Details
              </Button>
            </div>
          </div>

          <div>
            <div className="grid gap-4 sm:grid-cols-2">
              {daycareFeatures.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-[26px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_14px_42px_rgba(52,20,68,0.06)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_55px_rgba(52,20,68,0.10)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                      <Icon aria-hidden="true" size={22} />
                    </div>

                    <h3 className="mt-5 text-xl font-black tracking-[-0.02em] text-[#2D1736]">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>

            <div className="mt-5 rounded-[28px] bg-[#281034] p-6 text-white shadow-[0_20px_55px_rgba(40,16,52,0.20)] sm:p-7">
              <div className="flex items-center gap-3">
                <ShieldCheck
                  aria-hidden="true"
                  size={24}
                  className="shrink-0 text-[#F6C84B]"
                />

                <h3 className="text-xl font-black text-white">
                  A balanced afternoon routine
                </h3>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {routineItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-white/10 bg-white/10 px-3 py-4 text-center"
                    >
                      <Icon
                        aria-hidden="true"
                        size={20}
                        className="mx-auto text-[#F6C84B]"
                      />

                      <p className="mt-2 text-sm font-black text-white">
                        {item.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}