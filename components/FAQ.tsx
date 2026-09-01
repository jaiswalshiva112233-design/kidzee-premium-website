import {
  ArrowRight,
  ChevronDown,
  HelpCircle,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";


const faqs = [
  {
    question:
      "What age groups do you accept at Kidzee Sector 12 Dwarka?",
    answer:
      "Our preschool programmes are designed for children aged 2 to 6 years: Playgroup for 2 to 3 years, Nursery for 3 to 4 years, Junior KG for 4 to 5 years and Senior KG for 5 to 6 years.",
  },
  {
    question: "What are the preschool and daycare timings?",
    answer:
      "Preschool runs Monday to Friday: Playgroup and Nursery from 9:30 AM to 12:30 PM, and Junior KG and Senior KG from 9:30 AM to 1:00 PM. Daycare is available Monday to Saturday from 12:30 PM to 7:00 PM.",
  },
  {
    question: "Can my child try preschool before admission?",
    answer:
      "A three-day preschool trial of up to two hours per day may be available. Please contact the centre in advance because trial timing and availability must be confirmed.",
  },
  {
    question: "Is food included during preschool?",
    answer:
      "Yes. A freshly cooked vegetarian breakfast is included during preschool. The menu uses seasonal vegetables, is prepared without refined oil and may change according to the season and ingredient availability.",
  },
  {
    question: "Are daycare meals included?",
    answer:
      "No. Daycare begins after preschool, and its meals are separate chargeable choices. Families may select lunch, the evening snack or both according to the child's daycare schedule.",
  },
  {
    question: "Can we use daycare only on selected days?",
    answer:
      "Families can ask about regular, selected-day or occasional daycare. Availability depends on the required day, timing, the child's age and the centre's current capacity.",
  },
  {
    question:
      "Can parents visit the preschool before deciding?",
    answer:
      "Yes. Parents are encouraged to book a school visit, meet the centre team, see the classrooms and indoor play areas, and discuss their child's programme, routine and settling-in needs.",
  },
  {
    question:
      "How can I get current fees and seat availability?",
    answer:
      "Contact the admissions team for the current programme fee, daycare options and seat availability. Sharing your child's age helps the team guide you to the appropriate programme.",
  },
] as const;

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FAQ() {
  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative overflow-hidden bg-[#FFF9EE] py-14 sm:py-16 lg:py-20"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqStructuredData).replace(
            /</g,
            "\\u003c",
          ),
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-16 h-80 w-80 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/18 blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <div className="lg:sticky lg:top-28">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E8D9CD] bg-white px-4 py-2 text-[13px] font-black text-[#5B2A86]">
              <HelpCircle aria-hidden="true" size={16} />
              Quick answers for parents
            </div>

            <h2
              id="faq-heading"
              className="mt-5 text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              The practical questions families ask first.
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#6F6474] sm:text-lg">
              Clear information about ages, timings, meals, daycare,
              trial days and visiting the centre before admission.
            </p>

            <div className="mt-8">
              <Button
                href="/admissions?enquiry=FEES#admission-enquiry"
                variant="primary"
                size="md"
                rightIcon={<ArrowRight size={18} />}
                ariaLabel="Ask Kidzee Sector 12 Dwarka about current fees and availability"
              >
                Get Fees & Availability
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <details
                key={faq.question}
                open={index === 0}
                className="group overflow-hidden rounded-[22px] border border-[#E8DDD4] bg-white shadow-[0_10px_32px_rgba(52,20,68,0.045)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 px-5 py-5 text-left text-base font-black leading-7 text-[#2D1736] marker:hidden focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#F6C84B]/45 sm:px-6 sm:text-lg">
                  <span>{faq.question}</span>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F2E8F8] text-[#5B2A86] transition-transform duration-200 group-open:rotate-180 group-open:bg-[#5B2A86] group-open:text-white">
                    <ChevronDown
                      aria-hidden="true"
                      size={18}
                    />
                  </span>
                </summary>

                <p className="border-t border-[#F0E8E1] px-5 pb-6 pt-4 leading-7 text-[#6F6474] sm:px-6">
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
