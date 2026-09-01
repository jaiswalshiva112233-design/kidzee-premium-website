import Image from "next/image";
import {
  ArrowRight,
  BedDouble,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Gamepad2,
  Utensils,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getWebsiteMedia } from "@/lib/sanity/media";
import { preschoolMealPlan } from "@/lib/site";

const daycareFeatures = [
  {
    icon: CalendarDays,
    title: "Flexible attendance",
    text: "Ask about regular, selected-day or occasional daycare according to your family's requirement.",
  },
  {
    icon: BookOpenCheck,
    title: "Homework support",
    text: "School-going children can receive age-appropriate reading and homework guidance.",
  },
  {
    icon: BedDouble,
    title: "Rest when needed",
    text: "Longer stays include a calm period for rest according to the child's routine.",
  },
  {
    icon: Gamepad2,
    title: "Activities and play",
    text: "Creative activities, movement and supervised free play make the afternoon meaningful.",
  },
] as const;

export default async function Daycare() {
  const daycareMedia = await getWebsiteMedia(
    "home.daycare.main",
  );

  const daycareImage =
    daycareMedia?.imageUrl ??
    "/images/daycare/daycare-main.jpg";

  return (
    <section
      id="daycare"
      aria-labelledby="daycare-heading"
      className="relative overflow-hidden bg-white py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#EADDF1]/80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-8 h-96 w-96 rounded-full bg-[#F6C84B]/18 blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-center gap-10 lg:grid-cols-[0.96fr_1.04fr] lg:gap-14 xl:gap-20">
          <div className="relative mx-auto w-full max-w-[650px]">
            <figure className="group relative aspect-[4/3] min-h-0 overflow-hidden rounded-[34px] border-[6px] border-white bg-[#F3EAF8] shadow-[0_26px_72px_rgba(40,16,52,0.16)] sm:aspect-auto sm:min-h-[610px]">
              <Image
                src={daycareImage}
                alt={
                  daycareMedia?.altText ||
                  "Child receiving supervised learning support during daycare at Kidzee Sector 12 Dwarka"
                }
                fill
                unoptimized={daycareImage.startsWith("http")}
                sizes="(max-width: 1024px) 94vw, 47vw"
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
              />

              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-[#281034]/84 via-[#281034]/8 to-transparent"
              />

              <figcaption className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-sm font-black uppercase tracking-[0.13em] text-[#F6C84B]">
                  A dependable afternoon routine
                </p>

                <p className="mt-2 max-w-lg text-2xl font-black leading-tight text-white sm:text-3xl">
                  Care, rest, learning and play—planned around the
                  length of your child&apos;s stay.
                </p>
              </figcaption>
            </figure>

            <div className="absolute right-4 top-4 rounded-full border border-white/80 bg-white/95 px-4 py-2 text-xs font-black text-[#5B2A86] shadow-lg backdrop-blur sm:right-6 sm:top-6">
              Monday-Saturday · until 7:00 PM
            </div>
          </div>

          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-[#F8F4FC] px-4 py-2 text-[13px] font-black text-[#5B2A86]">
              <Clock3 aria-hidden="true" size={16} />
              Daycare begins after preschool
            </div>

            <h2
              id="daycare-heading"
              className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              Flexible daycare for the afternoons you need it.
            </h2>

            <p className="mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Families can ask about daycare for a few hours, selected
              days or a regular schedule. The routine is adapted to the
              child&apos;s age, arrival time and length of stay.
            </p>

            <div className="mt-7 grid grid-flow-col auto-cols-[82%] gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-3 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0">
              {daycareFeatures.map(
                ({ icon: Icon, title, text }) => (
                  <article
                    key={title}
                    className="snap-start rounded-[22px] border border-[#E8DEEC] bg-white p-4 shadow-[0_10px_30px_rgba(40,16,52,0.05)]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                      <Icon aria-hidden="true" size={19} />
                    </span>

                    <h3 className="mt-3.5 font-black leading-6 text-[#281034]">
                      {title}
                    </h3>

                    <p className="mt-1.5 text-sm leading-6 text-[#6F6474]">
                      {text}
                    </p>
                  </article>
                ),
              )}
            </div>

            <div className="mt-7 rounded-[24px] border border-[#F0D97E] bg-[#FFF8DD] p-5">
              <div className="flex items-start gap-3">
                <Utensils
                  aria-hidden="true"
                  size={21}
                  className="mt-0.5 shrink-0 text-[#7B5900]"
                />

                <div>
                  <h3 className="font-black text-[#3D2E07]">
                    Daycare meals are optional
                  </h3>

                  <p className="mt-1.5 text-sm leading-6 text-[#655522]">
                    Daycare starts after preschool. Lunch and evening
                    snacks are separate, chargeable choices; parents may
                    select lunch, the evening snack or both.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                href="/admissions?programme=DAYCARE&enquiry=DAYCARE#admission-enquiry"
                variant="primary"
                size="lg"
                leftIcon={<CalendarDays size={18} />}
                rightIcon={<ArrowRight size={18} />}
                className="w-full sm:w-auto"
                ariaLabel="Check daycare timing and availability at Kidzee Sector 12 Dwarka"
              >
                Check Daycare Availability
              </Button>

              <Button
                href="/daycare"
                variant="secondary"
                size="lg"
                rightIcon={<ArrowRight size={18} />}
                className="w-full sm:w-auto"
              >
                Daycare Details
              </Button>
            </div>
          </div>
        </div>

        <details className="group mt-12 overflow-hidden rounded-[32px] border border-[#E6D9EC] bg-[#F8F4FC] shadow-[0_18px_56px_rgba(40,16,52,0.07)] lg:mt-16">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 bg-white px-5 py-5 marker:hidden sm:px-7">
            <span>
              <span className="block text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86]">
                Preschool breakfast
              </span>
              <span className="mt-1 block text-lg font-black text-[#281034]">
                View the freshly cooked weekly meal plan
              </span>
            </span>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EAF8] text-2xl font-bold text-[#5B2A86] transition group-open:rotate-45">
              +
            </span>
          </summary>
          <div className="grid border-t border-[#E6D9EC] lg:grid-cols-[0.7fr_1.3fr]">
            <div className="bg-[#281034] p-6 text-white sm:p-8 lg:p-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#F6C84B]">
                <Utensils aria-hidden="true" size={22} />
              </div>

              <p className="mt-6 text-sm font-black uppercase tracking-[0.14em] text-[#F6C84B]">
                Included during preschool
              </p>

              <h3 className="mt-2 text-3xl font-black leading-tight text-white">
                Freshly cooked vegetarian breakfast
              </h3>

              <p className="mt-4 text-sm leading-7 text-white/75 sm:text-base">
                Preschool meals are prepared without refined oil and
                use seasonal vegetables. The menu may change with the
                season and ingredient availability.
              </p>

              <ul className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
                {preschoolMealPlan.highlights.map((highlight) => (
                  <li
                    key={highlight}
                    className="flex items-center gap-2.5 text-sm font-bold text-white/85"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      size={17}
                      className="shrink-0 text-[#F6C84B]"
                    />

                    {highlight}
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 sm:p-7 lg:p-9">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[#5B2A86]">
                    Sample weekly preschool menu
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-[#281034]">
                    Monday to Saturday
                  </h3>
                </div>

                <p className="text-sm font-bold text-[#706675]">
                  Breakfast is included in preschool
                </p>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {preschoolMealPlan.days.map((item) => (
                  <article
                    key={item.day}
                    className="rounded-[20px] border border-[#E5D8EB] bg-white p-4"
                  >
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-[#5B2A86]">
                      {item.day}
                    </p>

                    <p className="mt-2 text-sm font-bold leading-6 text-[#403248]">
                      {item.menu}
                    </p>
                  </article>
                ))}
              </div>

              <p className="mt-5 text-xs leading-6 text-[#786D7C]">
                {preschoolMealPlan.note}
              </p>
            </div>
          </div>
        </details>
      </Container>
    </section>
  );
}
