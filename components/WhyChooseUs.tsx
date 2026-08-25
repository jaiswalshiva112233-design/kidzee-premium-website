import {
  BookOpen,
  Brain,
  Leaf,
  Mic,
  Music,
  Palette,
  Puzzle,
  Sparkles,
  UserRound,
} from "lucide-react";

import Container from "@/components/ui/Container";
import { pentemindOfferings } from "@/lib/site";

const offeringIcons = [
  Palette,
  Brain,
  Mic,
  BookOpen,
  Music,
  UserRound,
  Puzzle,
  Leaf,
] as const;

const offeringColours = [
  "bg-[#FDEAF1] text-[#A52E62]",
  "bg-[#EDE7F7] text-[#5B2A86]",
  "bg-[#FFF0DB] text-[#A45A00]",
  "bg-[#E5F3FC] text-[#176B98]",
  "bg-[#F1E9FC] text-[#6E3FA0]",
  "bg-[#FFF4CC] text-[#7C5B00]",
  "bg-[#E7F5EF] text-[#19704A]",
  "bg-[#E9F5DF] text-[#397223]",
] as const;

export default function WhyChooseUs() {
  return (
    <section
      aria-labelledby="learning-experiences-heading"
      className="relative overflow-hidden bg-white py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-24 h-80 w-80 rounded-full bg-[#F6C84B]/14 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-44 bottom-10 h-96 w-96 rounded-full bg-[#EADDF1]/70 blur-3xl"
      />

      <Container className="relative">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-[#F8F4FC] px-4 py-2 text-[13px] font-black text-[#5B2A86]">
            <Sparkles aria-hidden="true" size={16} />
            Eight integrated learning experiences
          </div>

          <h2
            id="learning-experiences-heading"
            className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
          >
            Learning is richer when children can create, move, think
            and express.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
            Péntemind brings eight connected experiences into
            age-appropriate learning. Each one develops a different part
            of the child while keeping the day active, balanced and
            enjoyable.
          </p>
        </div>

        <div className="mt-10 grid grid-flow-col auto-cols-[78%] gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:mt-12 lg:grid-cols-4">
          {pentemindOfferings.map((offering, index) => {
            const Icon = offeringIcons[index];

            return (
              <article
                key={offering.name}
                className="group snap-start rounded-[26px] border border-[#E8DEEC] bg-white p-5 shadow-[0_12px_38px_rgba(40,16,52,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[#D2BDDD] hover:shadow-[0_20px_52px_rgba(40,16,52,0.1)] sm:p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <span
                    className={
                      "flex h-12 w-12 items-center justify-center rounded-2xl " +
                      offeringColours[index]
                    }
                  >
                    <Icon
                      aria-hidden="true"
                      size={22}
                      strokeWidth={2.15}
                    />
                  </span>

                  <span className="text-xs font-black tracking-[0.14em] text-[#5B2A86]/25">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black leading-tight tracking-[-0.025em] text-[#281034]">
                  {offering.name}
                </h3>

                <p className="mt-2.5 text-sm leading-6 text-[#6F6474]">
                  {offering.description}
                </p>
              </article>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-7 text-[#756A79]">
          These experiences are woven into classroom plans according to
          each programme and age group; they are not separate add-on
          classes.
        </p>
      </Container>
    </section>
  );
}