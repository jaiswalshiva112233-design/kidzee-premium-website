import { ArrowRight, ChevronDown } from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Which preschool programmes are available?",
    answer:
      "We offer Playgroup for children aged 2–3 years, Nursery for 3–4 years, Junior KG for 4–5 years and Senior KG for 5–6 years.",
  },
  {
    question: "Can my child attend a trial before admission?",
    answer:
      "Parents can enquire about a 3-day trial of up to two hours per day. Availability and timings must be confirmed with the centre in advance.",
  },
  {
    question: "What are the preschool and daycare timings?",
    answer:
      "Preschool generally runs from 8:30 AM to 1:00 PM, Monday to Friday. Daycare is available from 12:30 PM to 7:00 PM. Programme-specific timings should be confirmed with the centre.",
  },
  {
    question: "Are meals provided at the centre?",
    answer:
      "Breakfast is included for preschool children. Daycare meal options include lunch, an evening snack or both, depending on the plan selected.",
  },
  {
    question: "Is transport available?",
    answer:
      "Pick-up and drop transport may be available for nearby areas. Routes depend on distance, feasibility and current seat availability.",
  },
  {
    question: "What teacher-child ratios are followed?",
    answer:
      "The planned teacher-child ratio is 1:8 for Playgroup and Nursery, and 1:10 for Junior KG and Senior KG.",
  },
  {
    question: "Can parents visit before taking admission?",
    answer:
      "Yes. Parents can schedule a visit to see the classrooms and play areas, meet the school team and discuss their child’s requirements.",
  },
];

export default function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative overflow-hidden bg-[#FFF9F1] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-16 h-80 w-80 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-start gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
              Frequently asked questions
            </p>

            <h2
              id="faq-heading"
              className="mt-5 text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-5xl"
            >
              Helpful information for parents considering the centre.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Find quick answers about programmes, timings, meals, transport,
              trial classes and school visits.
            </p>

            <div className="mt-8">
              <Button
                href="/admissions"
                variant="secondary"
                rightIcon={<ArrowRight size={18} />}
              >
                View Admission Information
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                open={index === 0}
                className="group overflow-hidden rounded-[24px] border border-[#5B2A86]/10 bg-white shadow-[0_12px_35px_rgba(52,20,68,0.05)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 text-left text-base font-black leading-7 text-[#2D1736] marker:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#F6C84B]/40 sm:px-6 sm:py-6 sm:text-lg">
                  <span>{faq.question}</span>

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F2E8F8] text-[#5B2A86] transition-transform duration-200 group-open:rotate-180 group-open:bg-[#5B2A86] group-open:text-white">
                    <ChevronDown aria-hidden="true" size={19} />
                  </span>
                </summary>

                <p className="border-t border-[#F0E8F4] px-5 pb-6 pt-5 leading-7 text-[#6F6474] sm:px-6">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}