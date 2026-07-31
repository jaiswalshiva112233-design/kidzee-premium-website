import Image from "next/image";
import {
  ArrowRight,
  BedDouble,
  BookOpenCheck,
  Clock3,
  Gamepad2,
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

const daycareBenefits = [
  {
    icon: HeartHandshake,
    title: "Flexible daycare hours",
    description:
      "Parents can choose daycare according to the number of hours they require, subject to availability and the child’s routine.",
  },
  {
    icon: BookOpenCheck,
    title: "Homework support",
    description:
      "School-going children can receive guidance with reading, revision and regular homework during their daycare hours.",
  },
  {
    icon: BedDouble,
    title: "Rest and sleep time",
    description:
      "Children staying for longer hours are given a comfortable period for rest or sleep during the afternoon.",
  },
  {
    icon: Palette,
    title: "Activities and free play",
    description:
      "Creative activities, movement and supervised free play help keep children happily and meaningfully engaged.",
  },
] as const;

const fullDayRoutine = [
  {
    time: "12:30 PM",
    title: "Daycare begins",
    description:
      "Preschool children transition into daycare and settle into their afternoon routine.",
    icon: HeartHandshake,
  },
  {
    time: "1:30 PM",
    title: "Lunch time",
    description:
      "Children who have opted for meals are served lunch in a comfortable setting.",
    icon: Utensils,
  },
  {
    time: "2:00–3:00 PM",
    title: "Homework support",
    description:
      "Homework, reading or quiet learning support is provided according to the child’s needs.",
    icon: BookOpenCheck,
  },
  {
    time: "3:00–4:00 PM",
    title: "Rest or sleep",
    description:
      "A calm rest period helps children relax and feel refreshed during a longer daycare day.",
    icon: BedDouble,
  },
  {
    time: "4:00–5:00 PM",
    title: "Activity time",
    description:
      "Children take part in an age-appropriate creative, learning or movement-based activity.",
    icon: Palette,
  },
  {
    time: "5:00 PM",
    title: "Evening snack",
    description:
      "Children who have opted for the snack plan are served their evening snack.",
    icon: Utensils,
  },
  {
    time: "5:00–6:00 PM",
    title: "Supervised free play",
    description:
      "Children enjoy indoor play, toys and relaxed interaction with their friends.",
    icon: Gamepad2,
  },
  {
    time: "6:00–7:00 PM",
    title: "Activities and pickup",
    description:
      "Light activities continue as children are picked up by their families.",
    icon: Sparkles,
  },
] as const;

export default function Daycare() {
  return (
    <section
      id="daycare"
      aria-labelledby="daycare-heading"
      className="relative isolate overflow-hidden bg-[#FAF7FC] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#EADDF1]/90 blur-3xl" />

        <div className="absolute -right-40 bottom-8 h-96 w-96 rounded-full bg-[#F6C84B]/20 blur-3xl" />

        <div className="absolute left-[44%] top-[38%] h-64 w-64 rounded-full bg-[#5B2A86]/[0.05] blur-3xl" />
      </div>

      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white px-4 py-2 text-[13px] font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(52,20,68,0.05)]">
            <Clock3 aria-hidden="true" size={15} />
            Flexible daycare available until 7:00 PM
          </div>

          <h2
            id="daycare-heading"
            className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[48px]"
          >
            A caring and engaging afternoon for every child.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
            Our daycare in Sector 12B, Dwarka supports families who need care
            for a few hours or through the evening, with supervised learning,
            rest, play, activities and optional meals.
          </p>
        </div>

        <div className="mt-12 grid items-stretch gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8">
          <div className="group relative min-h-[560px] overflow-hidden rounded-[34px] border-[8px] border-white bg-white shadow-[0_26px_70px_rgba(52,20,68,0.14)] sm:min-h-[640px]">
            <Image
              src="/images/daycare/daycare-main.jpg"
              alt="Child receiving supervised learning and homework support during daycare at Kidzee Sector 12 Dwarka"
              fill
              sizes="(max-width: 1024px) 94vw, 43vw"
              className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.025]"
            />

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-t from-[#281034]/85 via-[#281034]/5 to-transparent"
            />

            <div className="absolute left-5 top-5 rounded-full border border-white/80 bg-white/95 px-4 py-2 text-xs font-black uppercase tracking-[0.1em] text-[#5B2A86] shadow-lg backdrop-blur">
              Care designed around your hours
            </div>

            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="max-w-lg">
                <p className="text-sm font-black uppercase tracking-[0.12em] text-[#F6C84B]">
                  More than supervision
                </p>

                <h3 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
                  Children remain comfortable, supported and meaningfully
                  engaged throughout their stay.
                </h3>

                <p className="mt-3 text-sm leading-6 text-white/80 sm:text-base">
                  The exact routine depends on the child&apos;s arrival time,
                  duration of stay, age and individual requirements.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[34px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_22px_60px_rgba(52,20,68,0.075)] sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5B2A86] text-white shadow-[0_12px_28px_rgba(91,42,134,0.2)]">
                <Clock3 aria-hidden="true" size={23} />
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-[0.1em] text-[#5B2A86]">
                  Example full-day routine
                </p>

                <h3 className="mt-1 text-2xl font-black text-[#2D1736]">
                  12:30 PM to 7:00 PM
                </h3>

                <p className="mt-2 text-sm leading-6 text-[#6F6474]">
                  This is an example for children staying for the full daycare
                  schedule. Shorter stays follow only the relevant parts of the
                  routine.
                </p>
              </div>
            </div>

            <div className="relative mt-7 space-y-1">
              <div
                aria-hidden="true"
                className="absolute bottom-5 left-[19px] top-5 w-px bg-[#5B2A86]/12"
              />

              {fullDayRoutine.map(
                ({ time, title, description, icon: Icon }) => (
                  <div
                    key={`${time}-${title}`}
                    className="group/item relative flex gap-4 rounded-[22px] p-3 transition duration-300 hover:bg-[#FAF7FC]"
                  >
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#F3EAF8] text-[#5B2A86] shadow-[0_6px_18px_rgba(52,20,68,0.08)] transition-colors duration-300 group-hover/item:bg-[#5B2A86] group-hover/item:text-white">
                      <Icon aria-hidden="true" size={16} />
                    </div>

                    <div className="min-w-0 pb-2">
                      <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                        <p className="text-sm font-black text-[#5B2A86]">
                          {time}
                        </p>

                        <h4 className="text-base font-black text-[#2D1736]">
                          {title}
                        </h4>
                      </div>

                      <p className="mt-1 text-sm leading-6 text-[#746978]">
                        {description}
                      </p>
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {daycareBenefits.map(({ icon: Icon, title, description }) => (
            <article
              key={title}
              className="group rounded-[26px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_14px_40px_rgba(52,20,68,0.055)] transition duration-300 hover:-translate-y-1 hover:border-[#5B2A86]/20 hover:shadow-[0_22px_52px_rgba(52,20,68,0.09)]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86] transition-all duration-300 group-hover:-rotate-3 group-hover:bg-[#5B2A86] group-hover:text-white">
                <Icon aria-hidden="true" size={22} />
              </div>

              <h3 className="mt-5 text-lg font-black tracking-[-0.02em] text-[#2D1736]">
                {title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[#6F6474]">
                {description}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-[30px] border border-[#5B2A86]/10 bg-[#2D1736] p-6 text-white shadow-[0_22px_60px_rgba(45,23,54,0.18)] sm:p-8">
  <div className="grid items-center gap-7 xl:grid-cols-[minmax(0,1fr)_auto]">
    <div className="flex max-w-2xl items-start gap-4">
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#F6C84B]">
        <ShieldCheck aria-hidden="true" size={23} />
      </div>

      <div>
        <h3 className="text-xl font-black sm:text-2xl">
          Need daycare for a few hours or the full afternoon?
        </h3>

        <p className="mt-2 text-sm leading-6 text-white/75 sm:text-base">
          Tell us your preferred timing and your child&apos;s age. Our centre
          team will help you understand the suitable daycare routine,
          availability and meal options.
        </p>
      </div>
    </div>

    <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap xl:w-auto xl:flex-nowrap">
      <Button
        href={site.whatsappDaycare}
        external
        variant="primary"
        size="md"
        leftIcon={<MessageCircle aria-hidden="true" size={18} />}
        rightIcon={<ArrowRight aria-hidden="true" size={18} />}
        className="w-full whitespace-nowrap sm:w-auto"
        aria-label="Ask Kidzee Sector 12 Dwarka about flexible daycare timings"
      >
        Ask About Daycare
      </Button>

      <Button
        href="/daycare"
        variant="primary"
        size="md"
        rightIcon={<ArrowRight aria-hidden="true" size={18} />}
        className="w-full whitespace-nowrap !bg-[#F6C84B] !text-[#2D1736] hover:!bg-[#FFD965] sm:w-auto"
      >
        View Daycare Details
      </Button>
    </div>
  </div>
</div>
      </Container>
    </section>
  );
}