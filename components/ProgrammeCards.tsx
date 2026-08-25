import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  BookOpenCheck,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const programmes = [
  {
    key: "playgroup" as const,
    title: "Playgroup",
    age: "2-3 years",
    href: "/programmes/playgroup",
    image: "/images/programmes/playgroup.jpg",
    icon: Baby,
    label: "A gentle first step",
    description:
      "A warm beginning that helps children settle, communicate and enjoy simple routines with confidence.",
    focus: "Stories, sensory play, movement and social comfort",
  },
  {
    key: "nursery" as const,
    title: "Nursery",
    age: "3-4 years",
    href: "/programmes/nursery",
    image: "/images/programmes/nursery.jpg",
    icon: BookOpenCheck,
    label: "Strong early foundations",
    description:
      "Hands-on learning introduces early language, number concepts, creativity and everyday independence.",
    focus: "Vocabulary, phonics readiness, early maths and motor skills",
  },
  {
    key: "junior-kg" as const,
    title: "Junior KG",
    age: "4-5 years",
    href: "/programmes/junior-kg",
    image: "/images/programmes/junior-kg.jpg",
    icon: GraduationCap,
    label: "Skills with growing confidence",
    description:
      "A balanced stage that strengthens reading, writing, numeracy and independent classroom habits.",
    focus: "Phonics, writing readiness, number sense and expression",
  },
  {
    key: "senior-kg" as const,
    title: "Senior KG",
    age: "5-6 years",
    href: "/programmes/senior-kg",
    image: "/images/programmes/senior-kg.jpg",
    icon: GraduationCap,
    label: "Ready for the next classroom",
    description:
      "A structured school-readiness programme for confident learning, communication and independence.",
    focus: "Reading, writing, comprehension, numeracy and school routines",
  },
];

type ProgrammeCardKey =
  | "playgroup"
  | "nursery"
  | "junior-kg"
  | "senior-kg";

type ProgrammeCardMedia = {
  imageUrl?: string;
  imageAlt?: string;
};

type ProgrammeCardsProps = {
  images?: Partial<Record<ProgrammeCardKey, ProgrammeCardMedia>>;
};

function optimiseSanityImageUrl(source: string) {
  try {
    const url = new URL(source);

    if (url.hostname !== "cdn.sanity.io") {
      return source;
    }

    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    url.searchParams.set("w", "1200");
    url.searchParams.set("q", "80");
    return url.toString();
  } catch {
    return source;
  }
}

export default function ProgrammeCards({ images }: ProgrammeCardsProps) {
  return (
    <section
      id="programme-options"
      aria-labelledby="programme-cards-heading"
      className="relative scroll-mt-24 overflow-hidden bg-[#FAF8FD] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86] shadow-sm">
            <Sparkles aria-hidden="true" size={16} />
            Choose your child&apos;s stage
          </div>

          <h2
            id="programme-cards-heading"
            className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#281034] sm:text-4xl lg:text-[48px]"
          >
            Four programmes, each designed for a different age
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-[#675E6B] sm:text-lg">
            Start with your child&apos;s age, then open the programme to see its
            daily focus, learning goals and admission details.
          </p>
        </div>

        <div className="mt-10 grid grid-flow-col auto-cols-[86%] gap-5 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:auto-cols-[72%] lg:grid-flow-row lg:auto-cols-auto lg:grid-cols-2 lg:overflow-visible lg:pb-0">
          {programmes.map((programme) => {
            const Icon = programme.icon;
            const suppliedImage = images?.[programme.key]?.imageUrl;
            const cardImage = optimiseSanityImageUrl(
              suppliedImage ?? programme.image,
            );

            return (
              <article
                key={programme.title}
                className="group snap-start overflow-hidden rounded-[30px] border border-[#E9DFED] bg-white shadow-[0_16px_44px_rgba(40,16,52,0.08)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_58px_rgba(40,16,52,0.13)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#EEE7F1]">
                  <Image
                    src={cardImage}
                    alt={
                      images?.[programme.key]?.imageAlt ||
                      programme.title +
                        " children learning at Kidzee Sector 12 Dwarka"
                    }
                    fill
                    unoptimized={
                      cardImage.startsWith("http") &&
                      !cardImage.includes("cdn.sanity.io")
                    }
                    sizes="(max-width: 640px) 86vw, (max-width: 1024px) 72vw, 46vw"
                    className="object-cover transition duration-700 group-hover:scale-[1.03]"
                  />
                </div>

                <div className="p-5 sm:p-6 lg:p-7">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F0E5F6] text-[#5B2A86]">
                        <Icon aria-hidden="true" size={21} />
                      </span>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A568E]">
                          {programme.label}
                        </p>
                        <h3 className="mt-1 text-2xl font-black tracking-[-0.03em] text-[#281034] sm:text-3xl">
                          {programme.title}
                        </h3>
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full bg-[#FFF5C8] px-3 py-1.5 text-xs font-black text-[#5D4300]">
                      {programme.age}
                    </span>
                  </div>

                  <p className="mt-4 text-sm font-semibold leading-7 text-[#675E6B] sm:text-base">
                    {programme.description}
                  </p>

                  <p className="mt-4 rounded-2xl bg-[#FAF7FC] px-4 py-3 text-sm font-bold leading-6 text-[#4D4053]">
                    <span className="text-[#5B2A86]">Focus:</span>{" "}
                    {programme.focus}
                  </p>

                  <Link
                    href={programme.href}
                    className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-6 text-sm font-black text-white transition hover:bg-[#47206A]"
                  >
                    View {programme.title}
                    <ArrowRight aria-hidden="true" size={17} />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-5 text-center text-sm font-semibold text-[#746A79] lg:hidden">
          Swipe to compare all four programmes
        </p>
      </div>
    </section>
  );
}
