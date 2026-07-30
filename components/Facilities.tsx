import {
  AirVent,
  Blocks,
  Camera,
  DoorOpen,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

import Container from "@/components/ui/Container";

const facilities = [
  {
    icon: DoorOpen,
    title: "Purpose-built classrooms",
    description:
      "Classrooms are arranged for group learning, table activities, stories and everyday preschool routines.",
  },
  {
    icon: Blocks,
    title: "Indoor play spaces",
    description:
      "Children have supervised spaces for movement, pretend play and age-appropriate indoor equipment.",
  },
  {
    icon: AirVent,
    title: "Air-conditioned rooms",
    description:
      "Classrooms are air-conditioned to help children remain comfortable during Delhi’s warmer months.",
  },
  {
    icon: Camera,
    title: "CCTV-covered premises",
    description:
      "CCTV cameras cover key areas of the centre as part of the school’s supervision and security arrangements.",
  },
  {
    icon: UtensilsCrossed,
    title: "Meals at the centre",
    description:
      "Preschool children receive meals as part of their regular school-day routine.",
  },
  {
    icon: ShieldCheck,
    title: "Controlled entry and handover",
    description:
      "Entry and child collection follow centre procedures, with staff supervision and authorised handover.",
  },
] as const;

export default function Facilities() {
  return (
    <section
      aria-labelledby="facilities-heading"
      className="relative overflow-hidden bg-[#FAF7FC] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-12 h-80 w-80 rounded-full bg-[#EADDF1] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 bottom-10 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-16">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#7A459C]">
              Inside our centre
            </p>

            <h2
              id="facilities-heading"
              className="mt-4 max-w-xl text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-5xl"
            >
              Spaces planned around the preschool day.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Our Sector 12B centre includes classrooms, play areas and
              everyday facilities needed for learning, meals, rest and
              supervised care.
            </p>

            <div className="mt-8 rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_16px_46px_rgba(52,20,68,0.06)] sm:p-7">
              <p className="text-lg font-black text-[#2D1736]">
                See the centre in person
              </p>

              <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                Photographs provide an introduction, but a school visit is the
                best way to understand the classrooms, play spaces and daily
                environment.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {facilities.map((facility) => {
              const Icon = facility.icon;

              return (
                <article
                  key={facility.title}
                  className="group rounded-[26px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_12px_38px_rgba(52,20,68,0.05)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_52px_rgba(52,20,68,0.09)]"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86] transition-colors duration-300 group-hover:bg-[#5B2A86] group-hover:text-white">
                    <Icon aria-hidden="true" size={22} />
                  </div>

                  <h3 className="mt-5 text-xl font-black tracking-[-0.02em] text-[#2D1736]">
                    {facility.title}
                  </h3>

                  <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                    {facility.description}
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