"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  HeartHandshake,
  MessageCircle,
  Music2,
  Palette,
  ShieldCheck,
  Sparkles,
  Star,
  Theater,
  Trophy,
  Utensils,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const daycareRoutine = [
  {
    time: "12:30 PM",
    title: "Lunch and settling time",
    description:
      "Children transition into daycare comfortably and have lunch according to the meal plan selected by the family.",
    icon: Utensils,
  },
  {
    time: "Early afternoon",
    title: "Rest and quiet time",
    description:
      "A calm period for rest, reading or quiet play, planned according to each child’s age and regular routine.",
    icon: HeartHandshake,
  },
  {
    time: "Afternoon",
    title: "Homework support",
    description:
      "School-going children receive guidance with homework, reading, revision and age-appropriate learning tasks.",
    icon: BookOpenCheck,
  },
  {
    time: "Activity time",
    title: "Enrichment sessions",
    description:
      "Children participate in scheduled activities such as dance, taekwondo, storytelling, art and personality development.",
    icon: Sparkles,
  },
  {
    time: "Evening",
    title: "Snack and supervised play",
    description:
      "Children can have an evening snack as per their meal plan, followed by creative activities and supervised play.",
    icon: HeartHandshake,
  },
  {
    time: "Till 7:00 PM",
    title: "Flexible pick-up",
    description:
      "A dependable extended-care routine designed to support working parents and their daily schedules.",
    icon: Clock3,
  },
];

const enrichmentActivities = [
  {
    icon: Trophy,
    title: "Taekwondo",
    description:
      "Age-appropriate movement sessions that support balance, discipline, confidence and physical coordination.",
  },
  {
    icon: Music2,
    title: "Dance",
    description:
      "Fun rhythm and movement sessions that encourage expression, confidence and active participation.",
  },
  {
    icon: Theater,
    title: "Storytelling and puppets",
    description:
      "Interactive stories and puppet sessions that encourage imagination, listening and language development.",
  },
  {
    icon: Palette,
    title: "Art and craft",
    description:
      "Creative activities that help children explore colours, materials, ideas and fine-motor skills.",
  },
  {
    icon: BookOpenCheck,
    title: "Homework support",
    description:
      "Guidance with assignments, reading, revision and everyday schoolwork for school-going children.",
  },
  {
    icon: Star,
    title: "Personality development",
    description:
      "Activities focused on communication, confidence, manners and positive social interaction.",
  },
];

const daycareHighlights = [
  {
    icon: Clock3,
    value: "Till 7 PM",
    description: "Extended care designed for working families.",
  },
  {
    icon: Sparkles,
    value: "Enrichment",
    description: "Scheduled activities that make afternoons purposeful.",
  },
  {
    icon: ShieldCheck,
    value: "Supervised Care",
    description: "A familiar, structured and child-friendly environment.",
  },
];

function createWhatsAppLink(message: string) {
  const phoneNumber = site.phone.replace(/\D/g, "");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export default function Daycare() {
  const daycareEnquiryLink = createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to know more about your daycare plans, timings, meals and activities."
  );

  return (
    <section
      id="daycare"
      aria-labelledby="daycare-heading"
      className="relative overflow-hidden bg-[#fffaf4] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#f0e5f7] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-[#fff0b8] blur-3xl"
      />

      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#e5d6ee] bg-white px-4 py-2 text-sm font-black text-[#5b2a86] shadow-sm">
            <Sparkles aria-hidden="true" size={17} />
            Beyond daycare
          </div>

          <h2
            id="daycare-heading"
            className="mt-6 text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-[#2c1735] sm:text-5xl lg:text-[56px]"
          >
            More than extended care.{" "}
            <span className="mt-1 block text-[#5b2a86]">
              A purposeful afternoon for every child.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#5f5f6d] sm:text-lg">
            Our daycare in Sector 12B, Dwarka balances rest, learning,
            enrichment and supervised play. Children follow a comfortable
            routine while working parents have dependable care till 7 PM.
          </p>
        </motion.div>

        <div className="mt-16 grid items-start gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[38px] border border-[#e7d9ee] bg-[linear-gradient(145deg,#ffffff_0%,#faf5fd_55%,#fff8e7_100%)] p-7 shadow-[0_28px_70px_rgba(52,20,68,0.11)] sm:p-9"
          >
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#d9c2e8]/55 blur-2xl"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-[#f6c84b]/20 blur-2xl"
            />

            <div className="relative">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#6f328f]">
                A typical afternoon
              </p>

              <h3 className="mt-4 text-3xl font-black leading-tight text-[#2c1735] sm:text-4xl">
                A routine children can settle into comfortably
              </h3>

              <p className="mt-4 max-w-xl leading-7 text-[#615568]">
                The sequence may vary according to the child’s age, school
                schedule, selected daycare plan and the day’s activity
                timetable.
              </p>

              <div className="mt-9 space-y-3">
                {daycareRoutine.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.article
                      key={`${item.time}-${item.title}`}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                        ease: "easeOut",
                      }}
                      className="rounded-[26px] border border-[#eadff0] bg-white p-5 shadow-[0_10px_28px_rgba(52,20,68,0.06)] transition duration-200 hover:-translate-y-0.5 hover:border-[#d7c1e3] hover:shadow-[0_16px_38px_rgba(52,20,68,0.1)]"
                    >
                      <div className="flex gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#f2e8f8] text-[#5b2a86]">
                          <Icon aria-hidden="true" size={22} />
                        </div>

                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-[#7a459c]">
                            {item.time}
                          </p>

                          <h4 className="mt-1 text-xl font-black text-[#2c1735]">
                            {item.title}
                          </h4>

                          <p className="mt-2 text-sm leading-6 text-[#5f5f6d]">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <div className="rounded-[38px] border border-[#eadff0] bg-white p-7 shadow-[0_24px_70px_rgba(52,20,68,0.1)] sm:p-9">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5b2a86]">
                After-school enrichment
              </p>

              <h3 className="mt-4 text-3xl font-black leading-tight tracking-[-0.03em] text-[#2c1735] sm:text-4xl">
                Engaging activities make the extended daycare experience more
                meaningful
              </h3>

              <p className="mt-5 leading-7 text-[#5f5f6d]">
                The activity schedule gives children opportunities to move,
                create, communicate and build confidence. Sessions vary
                according to age, attendance and the centre’s weekly plan.
              </p>

              <div className="mt-9 grid gap-4 sm:grid-cols-2">
                {enrichmentActivities.map((activity, index) => {
                  const Icon = activity.icon;

                  return (
                    <motion.article
                      key={activity.title}
                      initial={{ opacity: 0, y: 16 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.15 }}
                      transition={{
                        duration: 0.4,
                        delay: index * 0.05,
                        ease: "easeOut",
                      }}
                      className="group rounded-[26px] border border-[#eadff0] bg-[#fffdfa] p-5 shadow-[0_12px_35px_rgba(52,20,68,0.05)] transition-all duration-200 hover:-translate-y-1 hover:border-[#d8c4e3] hover:shadow-[0_20px_45px_rgba(52,20,68,0.1)]"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f2e8f8] text-[#5b2a86] transition-colors duration-200 group-hover:bg-[#5b2a86] group-hover:text-white">
                        <Icon aria-hidden="true" size={21} />
                      </div>

                      <h4 className="mt-4 text-lg font-black text-[#2c1735]">
                        {activity.title}
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-[#5f5f6d]">
                        {activity.description}
                      </p>
                    </motion.article>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 rounded-[32px] border border-[#f0d778] bg-[#fff1b8] p-6 sm:p-7">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#765a00]">
                    For working families
                  </p>

                  <h3 className="mt-2 text-2xl font-black text-[#2c1735]">
                    Daycare available till 7 PM
                  </h3>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-[#5f5429]">
                    Speak with our team to understand hourly care, the extended
                    daycare plan, meal choices and the current activity
                    schedule.
                  </p>
                </div>

                <div className="flex shrink-0 flex-col gap-3 sm:items-end">
                  <Button
                    href="/daycare"
                    ariaLabel="Explore daycare at Kidzee Sector 12 Dwarka"
                  >
                    Explore Daycare
                    <ArrowRight aria-hidden="true" size={17} />
                  </Button>

                  <a
                    href={daycareEnquiryLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-black text-[#5b2a86] transition-colors hover:text-[#4a2070] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#f6c84b]/60"
                  >
                    <MessageCircle aria-hidden="true" size={17} />
                    Ask on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-10 grid gap-4 sm:grid-cols-3"
        >
          {daycareHighlights.map((highlight) => {
            const Icon = highlight.icon;

            return (
              <article
                key={highlight.value}
                className="rounded-[28px] border border-[#eadff0] bg-white p-6 text-center shadow-[0_10px_30px_rgba(52,20,68,0.05)]"
              >
                <Icon
                  aria-hidden="true"
                  className="mx-auto text-[#5b2a86]"
                  size={28}
                />

                <p className="mt-3 text-2xl font-black text-[#2c1735]">
                  {highlight.value}
                </p>

                <p className="mt-1 text-sm leading-6 text-[#5f5f6d]">
                  {highlight.description}
                </p>
              </article>
            );
          })}
        </motion.div>
      </Container>
    </section>
  );
}