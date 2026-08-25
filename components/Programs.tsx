import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  CalendarCheck2,
  Clock3,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getWebsiteMedia } from "@/lib/sanity/media";
import { programmes } from "@/lib/site";

const stageLabels: Record<string, string> = {
  playgroup: "A gentle first step",
  nursery: "Building everyday foundations",
  "junior-kg": "Growing skills and independence",
  "senior-kg": "Preparing confidently for primary school",
};

export default async function Programs() {
  const [
    playgroupMedia,
    nurseryMedia,
    juniorKgMedia,
    seniorKgMedia,
  ] = await Promise.all([
    getWebsiteMedia("home.programmes.playgroup"),
    getWebsiteMedia("home.programmes.nursery"),
    getWebsiteMedia("home.programmes.juniorKg"),
    getWebsiteMedia("home.programmes.seniorKg"),
  ]);

  const programmeMedia = {
    playgroup: playgroupMedia,
    nursery: nurseryMedia,
    "junior-kg": juniorKgMedia,
    "senior-kg": seniorKgMedia,
  };

  return (
    <section
      id="programmes"
      aria-labelledby="programmes-heading"
      className="relative overflow-hidden bg-[#F8F4FC] py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-80 w-80 rounded-full bg-[#EADDF1]/80 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-16 h-80 w-80 rounded-full bg-[#F6C84B]/18 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-6 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#DDD0E4] bg-white px-4 py-2 text-[13px] font-black text-[#5B2A86]">
              <BookOpen aria-hidden="true" size={16} />
              Preschool programmes
            </div>

            <h2
              id="programmes-heading"
              className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              The right classroom for each stage.
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg lg:justify-self-end">
            Children do not all need the same school day. Our programmes
            progress from a gentle introduction to stronger
            communication, early concepts, independence and
            primary-school readiness.
          </p>
        </div>

        <div className="mt-10 grid grid-flow-col auto-cols-[84%] gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0 xl:grid-cols-4">
          {programmes.map((programme) => {
            const media =
              programmeMedia[
                programme.slug as keyof typeof programmeMedia
              ];

            const imageSource =
              media?.imageUrl ?? programme.image;

            const imageAlt =
              media?.altText ||
              programme.title +
                " learning activities at Kidzee Sector 12 Dwarka";

            return (
              <article
                key={programme.slug}
                className="group flex h-full snap-start flex-col overflow-hidden rounded-[28px] border border-[#E4D8EA] bg-white shadow-[0_16px_48px_rgba(52,20,68,0.07)] transition duration-300 hover:-translate-y-1 hover:border-[#CCB6D8] hover:shadow-[0_24px_65px_rgba(52,20,68,0.12)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-[#EDE3F3]">
                  <Image
                    src={imageSource}
                    alt={imageAlt}
                    fill
                    unoptimized={imageSource.startsWith("http")}
                    sizes="(max-width: 640px) 100vw, (max-width: 1279px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.035]"
                  />

                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-gradient-to-t from-[#281034]/58 via-transparent to-transparent"
                  />

                  <span className="absolute bottom-4 left-4 rounded-full border border-white/70 bg-white/95 px-3.5 py-2 text-xs font-black text-[#5B2A86] shadow-lg backdrop-blur-sm">
                    {programme.age}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8B7196]">
                    {stageLabels[programme.slug]}
                  </p>

                  <h3 className="mt-2 text-2xl font-black tracking-[-0.025em] text-[#2D1736]">
                    {programme.title}
                  </h3>

                  <div className="mt-3 flex items-center gap-2 text-sm font-bold text-[#66586C]">
                    <Clock3
                      aria-hidden="true"
                      size={16}
                      className="shrink-0 text-[#5B2A86]"
                    />

                    {programme.time}
                  </div>

                  <p className="mt-4 text-[15px] leading-7 text-[#6F6474]">
                    {programme.intro}
                  </p>

                  <div className="mt-auto pt-5">
                    <Button
                      href={"/programmes/" + programme.slug}
                      variant="ghost"
                      size="sm"
                      className="w-fit !px-0 hover:!bg-transparent"
                      rightIcon={<ArrowRight size={17} />}
                      ariaLabel={
                        "Read about the " +
                        programme.title +
                        " programme"
                      }
                    >
                      Programme details
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-5 rounded-[26px] border border-[#DED0E5] bg-white px-5 py-6 shadow-[0_12px_36px_rgba(40,16,52,0.05)] sm:flex-row sm:items-center sm:px-7">
          <div>
            <h3 className="text-xl font-black text-[#281034]">
              Unsure which programme fits your child?
            </h3>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-[#6F6474]">
              Share your child&apos;s age and we will explain the
              suitable class, routine and current availability.
            </p>
          </div>

          <Button
            href="/admissions?enquiry=ADMISSION#admission-enquiry"
            variant="primary"
            size="md"
            leftIcon={<CalendarCheck2 size={18} />}
            className="w-full sm:w-auto"
            ariaLabel="Ask Kidzee Sector 12 Dwarka which preschool programme is right for your child"
          >
            Find the Right Programme
          </Button>
        </div>
      </Container>
    </section>
  );
}
