import type { Metadata } from "next";
import Image from "next/image";
import {
  ArrowRight,
  BedDouble,
  BookOpenCheck,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MessageCircle,
  MoonStar,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Daycare in Sector 12 Dwarka",
  description:
    "Daycare at Kidzee Sector 12B, Dwarka from 12:30 PM to 7:00 PM, with time for lunch, rest, play, creative activities and homework support.",
  keywords: [
    "daycare in Sector 12 Dwarka",
    "daycare in Dwarka",
    "daycare Sector 12B Dwarka",
    "after school daycare Dwarka",
    "daycare till 7 PM Dwarka",
    "Kidzee daycare Dwarka",
    "homework support daycare Dwarka",
  ],
  alternates: {
    canonical: "/daycare",
  },
  openGraph: {
    title: "Daycare in Sector 12 Dwarka | Kidzee",
    description:
      "A comfortable afternoon routine with rest, play, activities and homework support at Kidzee Sector 12B, Dwarka.",
    url: "/daycare",
    siteName: site.shortName,
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/images/daycare/daycare-main.jpg",
        width: 1200,
        height: 630,
        alt: "Daycare at Kidzee Sector 12 Dwarka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Daycare in Sector 12 Dwarka | Kidzee",
    description:
      "Daycare until 7:00 PM with rest, activities, play and homework support.",
    images: ["/images/daycare/daycare-main.jpg"],
  },
};

const quickFacts = [
  {
    icon: Clock3,
    title: "Open until 7:00 PM",
    description:
      "Families can discuss the hours they need according to their child's school and home routine.",
  },
  {
    icon: MoonStar,
    title: "A quieter time after lunch",
    description:
      "Younger children can sleep, while those who stay awake are given something calm to do.",
  },
  {
    icon: Sparkles,
    title: "Something different each afternoon",
    description:
      "Stories, art, music, games and free play keep the day interesting without making it tiring.",
  },
  {
    icon: UserRoundCheck,
    title: "Homework support",
    description:
      "School-going children can complete age-appropriate homework before they go home.",
  },
] as const;

const routine = [
  {
    time: "12:30 PM onwards",
    title: "Arrival and settling in",
    description:
      "Children put away their belongings, wash their hands and settle into the afternoon without being rushed.",
    icon: HeartHandshake,
  },
  {
    time: "Early afternoon",
    title: "Lunch together",
    description:
      "Children have enough time to eat comfortably and talk to their friends before moving on to the quieter part of the day.",
    icon: MoonStar,
  },
  {
    time: "After lunch",
    title: "Sleep or quiet time",
    description:
      "Younger children may sleep. Children who do not nap can look at books, draw or sit with another quiet activity.",
    icon: BedDouble,
  },
  {
    time: "Later afternoon",
    title: "Play and activities",
    description:
      "Depending on the day, children may paint, listen to stories, dance, build with blocks, solve puzzles or spend time in supervised play.",
    icon: Palette,
  },
  {
    time: "Before going home",
    title: "Homework and winding down",
    description:
      "School-going children can work on their homework while younger children move into lighter activities before pickup.",
    icon: BookOpenCheck,
  },
] as const;

const parentQuestions = [
  {
    question: "Will my child spend the whole afternoon in one room?",
    answer:
      "No. The pace changes through the day. There is time for lunch, rest, creative activities, stories, games and play instead of one long classroom session.",
  },
  {
    question: "What happens if my child does not sleep?",
    answer:
      "A child does not have to sleep. Those who stay awake can look at books, draw or join a quiet activity while the younger children rest.",
  },
  {
    question: "Can you help with homework?",
    answer:
      "Yes. School-going children can work on age-appropriate homework during the afternoon. Parents can also tell the teacher if something specific needs attention.",
  },
  {
    question: "Can my child come after attending another school?",
    answer:
      "Yes, subject to the child's age, school timing and current availability. We first understand the daily schedule so the transition does not feel rushed.",
  },
] as const;

const faqs = [
  {
    question: "What are the daycare timings?",
    answer:
      "Daycare is available from 12:30 PM to 7:00 PM, Monday to Friday. Please speak with the centre team about the hours your family needs.",
  },
  {
    question: "Can my child join daycare after another school?",
    answer:
      "Yes. We will need to know the child's age, school timing and expected arrival time before confirming the routine.",
  },
  {
    question: "Is homework support available?",
    answer:
      "Yes. School-going children can receive help with age-appropriate homework during their daycare hours.",
  },
  {
    question: "Can my child sleep during daycare?",
    answer:
      "Yes. Younger children can sleep after lunch. Children who do not nap are given a quiet alternative.",
  },
  {
    question: "What should my child bring?",
    answer:
      "This depends on the child's age and length of stay. The centre team will tell you whether to send an extra set of clothes, a water bottle or any other personal item.",
  },
  {
    question: "How can I check availability?",
    answer:
      "Call or WhatsApp the centre with your child's age, school timing and expected daycare hours. The team will check the current availability.",
  },
] as const;

const daycareSchema = {
  "@context": "https://schema.org",
  "@type": "ChildCare",
  name: `${site.shortName} Daycare`,
  url: `${site.url}/daycare`,
  telephone: site.phone,
  image: `${site.url}/images/daycare/daycare-main.jpg`,
  address: {
    "@type": "PostalAddress",
    streetAddress: "Building No. 19, Block B, Sector 12B",
    addressLocality: "Dwarka",
    addressRegion: "Delhi",
    postalCode: site.postalCode,
    addressCountry: site.country,
  },
  openingHoursSpecification: {
    "@type": "OpeningHoursSpecification",
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: site.daycareHours.opens,
    closes: site.daycareHours.closes,
  },
};

export default function DaycarePage() {
  return (
    <PageShell>
      <main className="overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(daycareSchema),
          }}
        />

        {/* HERO */}
        <section className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(91,42,134,0.13),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(246,200,75,0.18),transparent_30%),#FFFFFF] py-14 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#EADDF1]/70 blur-3xl" />
          <div className="pointer-events-none absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl" />

          <Container className="relative">
            <div className="grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-white/90 px-4 py-2 text-sm font-extrabold text-[#5B2A86] shadow-[0_8px_24px_rgba(40,16,52,0.06)]">
                  <Clock3 aria-hidden="true" size={16} />
                  Daycare from 12:30 PM to 7:00 PM
                </span>

                <h1 className="mt-6 max-w-3xl text-[2.65rem] font-black leading-[1.04] tracking-[-0.045em] text-[#281034] sm:text-5xl lg:text-[4rem]">
                  A comfortable afternoon until it is time to go home.
                </h1>

                <p className="mt-6 max-w-2xl text-lg leading-8 text-[#5F5963] sm:text-xl sm:leading-9">
                  After preschool or school, children have time to eat, rest,
                  play, finish homework and enjoy the rest of the day without
                  being hurried from one thing to another.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <Button
                    href={site.whatsappDaycare}
                    external
                    variant="primary"
                    size="lg"
                    leftIcon={<MessageCircle aria-hidden="true" size={19} />}
                    rightIcon={<ArrowRight aria-hidden="true" size={19} />}
                    ariaLabel="Ask Kidzee Sector 12 Dwarka about daycare availability"
                  >
                    Ask About Daycare
                  </Button>

                  <Button
                    href={`tel:${site.phone}`}
                    variant="secondary"
                    size="lg"
                    leftIcon={<Phone aria-hidden="true" size={19} />}
                    ariaLabel={`Call ${site.shortName}`}
                  >
                    {site.phoneDisplay}
                  </Button>
                </div>

                <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
                  {[
                    "Daycare available until 7:00 PM",
                    "Sleep or quiet time after lunch",
                    "Homework help for school-going children",
                    "Activities suited to the child's age",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-[#E9E0ED] bg-white/90 px-4 py-3 shadow-[0_8px_22px_rgba(40,16,52,0.05)]"
                    >
                      <CheckCircle2
                        aria-hidden="true"
                        size={18}
                        className="shrink-0 text-[#5B2A86]"
                      />

                      <span className="text-sm font-bold leading-6 text-[#4F4852]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 -top-6 h-24 w-24 rounded-[30px] bg-[#F6C84B]/55" />
                <div className="absolute -bottom-7 -right-7 h-36 w-36 rounded-full bg-[#DCCBE5]/60" />

                <div className="group relative min-h-[500px] overflow-hidden rounded-[38px] border-[8px] border-white bg-white shadow-[0_28px_80px_rgba(40,16,52,0.15)] sm:min-h-[590px]">
                  <Image
                    src="/images/daycare/daycare-main.jpg"
                    alt="Child taking part in a daycare activity at Kidzee Sector 12 Dwarka"
                    fill
                    priority
                    sizes="(max-width: 1024px) 92vw, 46vw"
                    className="object-cover transition duration-700 ease-out group-hover:scale-[1.025]"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#281034]/82 via-transparent to-transparent" />

                  <div className="absolute inset-x-5 bottom-5 rounded-[26px] border border-white/15 bg-[#281034]/82 p-5 text-white backdrop-blur-md sm:p-6">
                    <p className="text-sm font-black uppercase tracking-[0.13em] text-[#F6C84B]">
                      A routine that does not feel rushed
                    </p>

                    <p className="mt-2 text-base leading-7 text-white/90">
                      Teachers can adjust the pace when a child is tired, wants
                      a little quiet time or needs help settling into the
                      afternoon.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* QUICK FACTS */}
        <section className="bg-white pb-10 sm:pb-14">
          <Container>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickFacts.map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="rounded-[28px] border border-[#E9E0ED] bg-white p-6 shadow-[0_18px_50px_rgba(40,16,52,0.07)]"
                >
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                    <Icon aria-hidden="true" size={22} />
                  </span>

                  <h2 className="mt-5 text-lg font-black tracking-[-0.02em] text-[#281034]">
                    {title}
                  </h2>

                  <p className="mt-2 text-sm leading-7 text-[#6C646F]">
                    {description}
                  </p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        {/* DAILY ROUTINE */}
        <section className="relative overflow-hidden bg-[#F8F4FC] py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="grid items-start gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-16">
              <div className="lg:sticky lg:top-28">
                <span className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#5B2A86]">
                  What the afternoon looks like
                </span>

                <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.035em] text-[#281034] sm:text-4xl lg:text-[2.75rem]">
                  A familiar flow, with room for each child&apos;s own routine.
                </h2>

                <p className="mt-6 text-base leading-8 text-[#5F5963] sm:text-[1.05rem]">
                  Not every child arrives or leaves at the same time. The day is
                  therefore planned in parts, making it easier for children to
                  join in without feeling that they have missed something.
                </p>

                <p className="mt-4 text-base leading-8 text-[#5F5963] sm:text-[1.05rem]">
                  A shorter stay may include lunch, rest and play. Children who
                  remain until evening also have time for activities, homework
                  and a calmer end to the day.
                </p>
              </div>

              <div className="rounded-[34px] border border-[#E3D5EA] bg-white p-5 shadow-[0_22px_65px_rgba(40,16,52,0.08)] sm:p-8">
                <div className="relative space-y-2">
                  <div className="absolute bottom-8 left-[23px] top-8 w-px bg-[#DCCBE5]" />

                  {routine.map(({ time, title, description, icon: Icon }) => (
                    <article
                      key={`${time}-${title}`}
                      className="group relative flex gap-4 rounded-[24px] p-3 transition duration-300 hover:bg-[#FAF7FC] sm:gap-5 sm:p-4"
                    >
                      <span className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#F3EAF8] text-[#5B2A86] shadow-[0_8px_22px_rgba(40,16,52,0.08)] transition duration-300 group-hover:bg-[#5B2A86] group-hover:text-white">
                        <Icon aria-hidden="true" size={19} />
                      </span>

                      <div className="pb-3">
                        <p className="text-sm font-black text-[#5B2A86]">
                          {time}
                        </p>

                        <h3 className="mt-1 text-xl font-black tracking-[-0.02em] text-[#281034]">
                          {title}
                        </h3>

                        <p className="mt-2 text-sm leading-7 text-[#6C646F] sm:text-base">
                          {description}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* PARENT QUESTIONS */}
        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="mx-auto max-w-3xl text-center">
              <span className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#5B2A86]">
                Before your child joins
              </span>

              <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.035em] text-[#281034] sm:text-4xl lg:text-[2.75rem]">
                The things parents usually want to know first.
              </h2>

              <p className="mt-5 text-base leading-8 text-[#5F5963] sm:text-lg">
                A short conversation about your child&apos;s habits, school
                timing and usual afternoon helps us understand what will work
                best.
              </p>
            </div>

            <div className="mt-12 grid gap-5 lg:grid-cols-2">
              {parentQuestions.map((item, index) => (
                <article
                  key={item.question}
                  className="rounded-[30px] border border-[#E9E0ED] bg-white p-6 shadow-[0_18px_50px_rgba(40,16,52,0.06)] sm:p-8"
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FFF4CC] text-sm font-black text-[#281034]">
                      {index + 1}
                    </span>

                    <div>
                      <h3 className="text-xl font-black leading-snug tracking-[-0.02em] text-[#281034]">
                        {item.question}
                      </h3>

                      <p className="mt-3 text-base leading-8 text-[#645D67]">
                        {item.answer}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </Container>
        </section>

        {/* PICKUP SECTION */}
        <section className="relative overflow-hidden bg-[#281034] py-16 sm:py-20 lg:py-24">
          <div className="pointer-events-none absolute -right-20 top-0 h-80 w-80 rounded-full bg-[#F6C84B]/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-28 bottom-0 h-80 w-80 rounded-full bg-[#8A54B2]/20 blur-3xl" />

          <Container className="relative">
            <div className="grid gap-10 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:gap-16">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-extrabold text-[#F6C84B]">
                  <ShieldCheck aria-hidden="true" size={16} />
                  Evening pickup
                </span>

             <h2
  className="mt-6 text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl lg:text-[2.75rem]"
  style={{ color: "#FFFFFF" }}
>
  Let us know when you expect to reach the centre.
</h2>

                <p
  className="mt-6 max-w-2xl text-base leading-8 sm:text-lg"
  style={{ color: "rgba(255, 255, 255, 0.9)" }}
>
  Tell us the time you normally collect your child. When work or
  traffic changes the plan, a quick call or message helps the
  teacher know when to expect you.
</p>

<p
  className="mt-4 max-w-2xl text-base leading-8 sm:text-lg"
  style={{ color: "rgba(255, 255, 255, 0.9)" }}
>
  Your child will be handed over only to the people you have
  approved. Please inform us beforehand when someone else will
  be coming.
</p>
              </div>

              <div className="rounded-[32px] border border-white/20 bg-white/10 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.16)] backdrop-blur-sm sm:p-8">
                <h3 className="text-xl font-black text-white">
                  Please share these details
                </h3>

                <div className="mt-6 space-y-4">
                  {[
                    "Your child's usual arrival time",
                    "The pickup time you normally expect",
                    "Whether your child usually sleeps after lunch",
                    "The names of adults allowed to collect your child",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2
                        aria-hidden="true"
                        size={19}
                        className="mt-0.5 shrink-0 text-[#F6C84B]"
                      />

                      <p className="text-sm leading-7 text-white/85 sm:text-base">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* FAQ */}
        <section className="bg-[#F8F4FC] py-16 sm:py-20 lg:py-24">
          <Container size="narrow">
            <div className="text-center">
              <span className="text-sm font-extrabold uppercase tracking-[0.16em] text-[#5B2A86]">
                Daycare questions
              </span>

              <h2 className="mt-5 text-3xl font-black leading-tight tracking-[-0.035em] text-[#281034] sm:text-4xl">
                A few more details before you call.
              </h2>
            </div>

            <div className="mt-10 space-y-4">
              {faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-[26px] border border-[#E3D5EA] bg-white p-5 shadow-[0_12px_34px_rgba(40,16,52,0.05)] open:shadow-[0_18px_46px_rgba(40,16,52,0.08)] sm:p-6"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-left text-base font-black text-[#281034] marker:hidden sm:text-lg">
                    {faq.question}

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3EAF8] text-xl text-[#5B2A86] transition duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-4 pr-10 text-sm leading-7 text-[#645D67] sm:text-base sm:leading-8">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        {/* FINAL CTA */}
        <section className="bg-white py-16 sm:py-20 lg:py-24">
          <Container>
            <div className="relative overflow-hidden rounded-[36px] bg-[#5B2A86] px-6 py-10 shadow-[0_28px_80px_rgba(91,42,134,0.24)] sm:px-10 sm:py-12 lg:px-14">
              <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-[#F6C84B]/15 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

              <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                <div className="max-w-3xl">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-[#F6C84B]">
                    Tell us about your routine
                  </p>

                  <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl">
                    Share your child&apos;s age and the hours you need.
                  </h2>

                  <p className="mt-4 text-base leading-8 text-white/85 sm:text-lg">
                    We will explain how the afternoon works and check whether a
                    suitable daycare place is currently available.
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col xl:flex-row">
                  <a
                    href={site.whatsappDaycare}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="WhatsApp Kidzee Sector 12 Dwarka about daycare"
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[#F6C84B] px-7 py-3.5 text-base font-black text-[#281034] shadow-[0_16px_35px_rgba(246,200,75,0.25)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFD85E] sm:w-auto"
                  >
                    <MessageCircle aria-hidden="true" size={19} />
                    WhatsApp the Centre
                    <ArrowRight aria-hidden="true" size={19} />
                  </a>

                  <a
                    href={`tel:${site.phone}`}
                    aria-label={`Call ${site.shortName}`}
                    className="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-white bg-white px-7 py-3.5 text-base font-black text-[#281034] shadow-[0_16px_35px_rgba(40,16,52,0.18)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFF8DE] sm:w-auto"
                  >
                    <Phone aria-hidden="true" size={19} />
                    Call the Centre
                  </a>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>
    </PageShell>
  );
}