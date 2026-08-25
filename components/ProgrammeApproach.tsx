import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpenCheck,
  HandHeart,
  Move,
  Sparkles,
} from "lucide-react";

const learningExperiences = [
  {
    icon: Move,
    title: "Play and explore",
    description:
      "Movement, music, sensory activities and guided play help children take part with interest.",
  },
  {
    icon: BookOpenCheck,
    title: "Talk, think and create",
    description:
      "Stories, phonics, early maths, art and conversation build connected understanding.",
  },
  {
    icon: HandHeart,
    title: "Grow in confidence",
    description:
      "Familiar routines, group activities and simple responsibilities support independence.",
  },
];

type ProgrammeApproachProps = {
  imageUrl?: string;
  imageAlt?: string;
};

function optimiseSanityImageUrl(source: string) {
  try {
    const url = new URL(source);

    if (url.hostname !== "cdn.sanity.io") {
      return source;
    }

    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    url.searchParams.set("w", "1400");
    url.searchParams.set("q", "80");
    return url.toString();
  } catch {
    return source;
  }
}

export default function ProgrammeApproach({
  imageUrl = "/images/programmes/nursery.jpg",
  imageAlt = "Children learning through classroom activities at Kidzee Sector 12 Dwarka",
}: ProgrammeApproachProps) {
  const approachImage = optimiseSanityImageUrl(imageUrl);

  return (
    <section
      aria-labelledby="programme-approach-heading"
      className="relative overflow-hidden bg-[#FFF9EF] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-[#E9D9F2]/55 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
          <figure className="relative mx-auto w-full max-w-[650px]">
            <div
              aria-hidden="true"
              className="absolute -inset-3 -rotate-2 rounded-[38px] bg-[#F4D76E]/45"
            />
            <div className="relative overflow-hidden rounded-[30px] border-[7px] border-white bg-white shadow-[0_24px_64px_rgba(40,16,52,0.14)]">
              <div className="relative aspect-[4/3] w-full">
                <Image
                  src={approachImage}
                  alt={imageAlt}
                  fill
                  unoptimized={
                    approachImage.startsWith("http") &&
                    !approachImage.includes("cdn.sanity.io")
                  }
                  sizes="(max-width: 1024px) 92vw, 43vw"
                  className="object-cover"
                />
              </div>
            </div>
            <figcaption className="relative mx-auto mt-4 w-fit rounded-full border border-[#E5DAEA] bg-white px-4 py-2 text-center text-xs font-black text-[#5B2A86] shadow-sm">
              Learning through real classroom experiences
            </figcaption>
          </figure>

          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86] shadow-sm">
              <Sparkles aria-hidden="true" size={16} />
              How children learn
            </div>

            <h2
              id="programme-approach-heading"
              className="mt-5 max-w-3xl text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#281034] sm:text-4xl lg:text-[48px]"
            >
              Meaningful experiences, not worksheet-heavy learning
            </h2>

            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[#675E6B] sm:text-lg">
              Teachers introduce ideas through stories, materials,
              conversation, movement and creative activities. Children see,
              touch, discuss and practise, so new learning feels natural and
              memorable.
            </p>

            <Link
              href="/about"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#DCCFE3] bg-white px-6 text-sm font-black text-[#5B2A86] transition hover:border-[#5B2A86] hover:bg-[#F8F4FC]"
            >
              See our P&eacute;ntemind approach
              <ArrowRight aria-hidden="true" size={17} />
            </Link>
          </div>
        </div>

        <div className="mt-10 grid grid-flow-col auto-cols-[84%] gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:auto-cols-[62%] lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-3 lg:overflow-visible lg:pb-0">
          {learningExperiences.map((item) => {
            const Icon = item.icon;

            return (
              <article
                key={item.title}
                className="snap-start rounded-[28px] border border-[#E9DFED] bg-white p-6 shadow-[0_14px_38px_rgba(40,16,52,0.07)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0E5F6] text-[#5B2A86]">
                  <Icon aria-hidden="true" size={22} />
                </span>
                <h3 className="mt-5 text-xl font-black text-[#281034]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-[#675E6B] sm:text-base">
                  {item.description}
                </p>
              </article>
            );
          })}
        </div>

        <p className="mt-4 text-center text-sm font-semibold text-[#746A79] lg:hidden">
          Swipe to see how learning connects
        </p>
      </div>
    </section>
  );
}
