"use client";

import Link from "next/link";
import { CalendarCheck2, ChevronDown, HelpCircle } from "lucide-react";


type ProgrammeFAQProps = {
  youngGroupChildrenPerTeacher?: number;
  kindergartenChildrenPerTeacher?: number;
};

export default function ProgrammeFAQ({
  youngGroupChildrenPerTeacher = 8,
  kindergartenChildrenPerTeacher = 10,
}: ProgrammeFAQProps) {
  const faqs = [
    {
      question: "Which programme is suitable for my child?",
      answer:
        "Age is the starting point: Playgroup is for 2-3 years, Nursery for 3-4 years, Junior KG for 4-5 years and Senior KG for 5-6 years. We also consider previous preschool experience, comfort and readiness before guiding you.",
    },
    {
      question: "What is the teacher-child ratio?",
      answer: `The teacher-child ratio is 1:${youngGroupChildrenPerTeacher} for Playgroup and Nursery, and 1:${kindergartenChildrenPerTeacher} for Junior KG and Senior KG. Smaller groups help teachers observe children closely and provide age-appropriate support.`,
    },
    {
      question: "Does the programme include only academic learning?",
      answer:
        "No. Children also take part in stories, music, movement, art, role play, group interaction and motor-development activities. Early academic skills are built through these connected experiences.",
    },
    {
      question: "How does learning change in the next programme?",
      answer:
        "Learning becomes gradually more structured. Younger children focus on settling, communication and routines; older children develop stronger phonics, reading, writing, numeracy, problem-solving and school readiness.",
    },
    {
      question: "Are meals included in the preschool fee?",
      answer:
        "Yes. A fresh vegetarian preschool meal is included in the monthly preschool fee. The menu uses seasonal vegetables and changes with the season.",
    },
    {
      question: "Can my child continue into daycare after preschool?",
      answer:
        "Yes. Preschool children can continue into daycare after school hours. Daycare is available until 7:00 PM, with plans based on the schedule your family needs.",
    },
    {
      question: "Can we try the preschool before admission?",
      answer:
        "A three-day trial programme is available. It helps your child experience the teachers, classroom and routine while you see how comfortably they settle.",
    },
    {
      question: "How will I know about my child's progress?",
      answer:
        "Parents receive classroom updates, parent-teacher meetings and progress discussions, with direct communication whenever a child needs extra support or encouragement.",
    },
  ];

  return (
    <section
      aria-labelledby="programme-faq-heading"
      className="relative overflow-hidden bg-[#FAF8FD] py-16 sm:py-20 lg:py-24"
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E3D5EA] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86] shadow-sm">
            <HelpCircle aria-hidden="true" size={16} />
            Parent questions
          </div>

          <h2
            id="programme-faq-heading"
            className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#281034] sm:text-4xl lg:text-[48px]"
          >
            Helpful answers before you choose a programme
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-[#675E6B] sm:text-lg">
            The practical details parents usually want to know before planning
            a visit or starting admission.
          </p>
        </div>

        <div className="mx-auto mt-10 space-y-3">
          {faqs.map((faq, index) => (
            <details
              key={faq.question}
              className="group overflow-hidden rounded-[22px] border border-[#E9DFED] bg-white shadow-[0_10px_28px_rgba(40,16,52,0.05)] open:shadow-[0_16px_38px_rgba(40,16,52,0.09)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex items-start gap-3 sm:gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F0E5F6] text-xs font-black text-[#5B2A86]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h3 className="pt-1 text-left text-base font-black leading-6 text-[#281034] sm:text-lg sm:leading-7">
                    {faq.question}
                  </h3>
                </div>

                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F8F2FB] text-[#5B2A86] transition group-open:rotate-180 group-open:bg-[#5B2A86] group-open:text-white">
                  <ChevronDown aria-hidden="true" size={18} />
                </span>
              </summary>

              <div className="border-t border-[#EEE6F1] px-5 pb-5 pt-4 sm:px-6">
                <p className="text-sm font-semibold leading-7 text-[#675E6B] sm:pl-[52px] sm:text-base sm:leading-8">
                  {faq.answer}
                </p>
              </div>
            </details>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-5 rounded-[28px] bg-[#2D1636] p-6 text-white shadow-[0_20px_54px_rgba(45,22,54,0.16)] sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#F6D75A]">
              Need personal guidance?
            </p>
            <h3 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">
              Tell us your child&apos;s age and current routine.
            </h3>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#E9DFF0] sm:text-base">
              Our centre team will help you shortlist the right programme and
              plan a school visit.
            </p>
          </div>

          <Link
            href="/admissions?enquiry=ADMISSION#admission-enquiry"
            className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-[#F6D75A] px-7 text-base font-black text-[#281034] transition hover:bg-[#FFE984]"
          >
            <CalendarCheck2 aria-hidden="true" size={19} />
            Send Enquiry
          </Link>
        </div>
      </div>
    </section>
  );
}
