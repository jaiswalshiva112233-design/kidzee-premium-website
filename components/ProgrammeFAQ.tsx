"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck2,
  ChevronDown,
  HelpCircle,
  MessageCircleMore,
  Sparkles,
} from "lucide-react";

const faqs = [
  {
    question: "Which programme is suitable for my child?",
    answer:
      "The programme is primarily selected according to age. Playgroup is for 2–3 years, Nursery for 3–4 years, Junior KG for 4–5 years and Senior KG for 5–6 years. The centre team can also consider your child’s previous preschool experience, comfort level and current readiness.",
  },
  {
    question: "What is the teacher-child ratio in each programme?",
    answer:
      "The teacher-child ratio is 1:8 for Playgroup and Nursery, and 1:10 for Junior KG and Senior KG. Smaller groups help teachers observe children more closely and provide age-appropriate guidance.",
  },
  {
    question: "Does the programme include only academic learning?",
    answer:
      "No. Academic foundations are only one part of the programme. Children also participate in stories, music, movement, art, role play, group interaction, motor-development activities and age-appropriate routines that support confidence and independence.",
  },
  {
    question: "How does learning change as children move to the next programme?",
    answer:
      "The learning gradually becomes more structured. Younger children focus on settling, communication, play and simple routines. Older children work on stronger phonics, reading, writing, numeracy, problem-solving and formal-school readiness.",
  },
  {
    question: "Are meals included in the preschool programme?",
    answer:
      "Yes. Preschool meals are included in the monthly preschool fee, helping children follow a regular and comfortable meal routine during the school day.",
  },
  {
    question: "Can my child attend daycare after preschool?",
    answer:
      "Yes. Preschool children can continue into daycare after school hours. Daycare is available until 7:00 PM, and parents can enquire about the plan that best matches their daily schedule.",
  },
  {
    question: "Are trial classes available before admission?",
    answer:
      "Yes. A three-day trial programme is available. It allows children to experience the teachers, classroom and daily routine while helping parents understand how comfortably the child settles at the centre.",
  },
  {
    question: "How are parents informed about their child’s progress?",
    answer:
      "Parents receive regular communication through classroom updates, parent-teacher meetings, progress discussions and direct conversations whenever a child needs additional support or encouragement.",
  },
];

export default function ProgrammeFAQ() {
  const programmeMessage = encodeURIComponent(
    "Hello, I would like guidance about the right preschool programme for my child at Kidzee Sector 12, Dwarka."
  );

  return (
    <section
      className="relative overflow-hidden bg-[#faf8ff] py-20 sm:py-24 lg:py-28"
      aria-labelledby="programme-faq-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-purple-200/35 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-36 bottom-0 h-96 w-96 rounded-full bg-yellow-200/45 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm">
            <HelpCircle size={16} aria-hidden="true" />
            Parent questions
          </div>

          <h2
            id="programme-faq-heading"
            className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
          >
            Helpful answers before you{" "}
            <span className="text-[#702a96]">choose a programme</span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            These are some of the most common questions parents ask while
            comparing preschool stages and planning admission.
          </p>
        </motion.div>

        <div className="mx-auto mt-14 max-w-5xl space-y-4">
          {faqs.map((faq, index) => (
            <motion.details
              key={faq.question}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{
                duration: 0.45,
                delay: index * 0.04,
                ease: "easeOut",
              }}
              className="group overflow-hidden rounded-[26px] border border-purple-100 bg-white shadow-[0_12px_34px_rgba(62,25,83,0.06)] open:shadow-[0_18px_46px_rgba(62,25,83,0.1)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-purple-100 text-sm font-extrabold text-[#702a96]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <h3 className="pt-1 text-left text-base font-extrabold leading-7 text-[#281036] sm:text-lg">
                    {faq.question}
                  </h3>
                </div>

                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-50 text-[#702a96] transition duration-300 group-open:rotate-180 group-open:bg-[#702a96] group-open:text-white">
                  <ChevronDown
                    size={19}
                    strokeWidth={2.4}
                    aria-hidden="true"
                  />
                </span>
              </summary>

              <div className="border-t border-purple-100 px-5 pb-6 pt-5 sm:px-7">
                <p className="pl-0 text-sm leading-7 text-slate-600 sm:pl-14 sm:text-base sm:leading-8">
                  {faq.answer}
                </p>
              </div>
            </motion.details>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-16 overflow-hidden rounded-[38px] bg-[#2d1636] p-7 text-white shadow-[0_28px_75px_rgba(45,22,54,0.18)] sm:p-9 lg:p-10"
        >
          <div className="grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.17em] text-yellow-300">
                <Sparkles size={15} aria-hidden="true" />
                Personal programme guidance
              </div>

              <h3 className="mt-5 max-w-4xl text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
                Still unsure which programme matches your child’s age and
                readiness?
              </h3>

              <p className="mt-5 max-w-3xl text-sm leading-7 text-purple-100 sm:text-base sm:leading-8">
                Speak with our centre team or schedule a school visit. We can
                understand your child’s age, previous learning experience and
                current comfort level before suggesting the most suitable
                programme.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <a
                href={`https://wa.me/919667038673?text=${programmeMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-yellow-300 px-7 text-base font-extrabold text-[#281036] transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-200"
              >
                <MessageCircleMore size={19} aria-hidden="true" />
                Ask on WhatsApp
              </a>

              <Link
                href="/contact"
                className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 text-base font-extrabold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/15"
              >
                <CalendarCheck2 size={19} aria-hidden="true" />
                Book a School Visit
              </Link>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl text-sm leading-7 text-purple-100">
              You can also explore each programme separately for detailed
              learning goals, classroom activities and expected development.
            </p>

            <Link
              href="/contact"
              className="inline-flex shrink-0 items-center gap-2 text-sm font-extrabold text-yellow-300 transition hover:text-yellow-200"
            >
              Speak with our admission team
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}