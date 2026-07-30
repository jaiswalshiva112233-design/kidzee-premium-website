"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronDown,
  HelpCircle,
  MessageCircle,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Which preschool programmes are available?",
    answer:
      "We offer Playgroup for children aged 2–3 years, Nursery for 3–4 years, Junior KG for 4–5 years and Senior KG for 5–6 years. Daycare and enrichment activities are also available.",
  },
  {
    question: "Is a trial class available?",
    answer:
      "Yes. Parents can enquire about a 3-day trial, usually for two hours each day. Trial availability depends on the child’s age, programme and the current classroom schedule.",
  },
  {
    question: "What are the preschool timings?",
    answer:
      "Preschool operates from Monday to Friday, generally between 8:30 AM and 1:00 PM. The exact classroom schedule may vary by programme, so parents should confirm the current timing with the admissions team.",
  },
  {
    question: "How late is daycare available?",
    answer:
      "Daycare is available from 12:30 PM to 7:00 PM. Saturday daycare is also available, subject to the selected plan and current centre schedule.",
  },
  {
    question: "Are meals provided?",
    answer:
      "Breakfast is included in the preschool routine. Daycare families can choose lunch, an evening snack or both according to the meal plan selected for their child.",
  },
  {
    question: "Is transport available?",
    answer:
      "Yes. Pick-up and drop transport is available for nearby areas, subject to route feasibility, seat availability and confirmation from the school team.",
  },
  {
    question: "What is the teacher-child ratio?",
    answer:
      "The planned teacher-child ratio is 1:8 for Playgroup and Nursery, and 1:10 for Junior KG and Senior KG.",
  },
  {
    question: "Can parents visit the school before admission?",
    answer:
      "Yes. Parents are encouraged to schedule a school visit to see the classrooms, play areas and daycare environment, meet the team and discuss the most suitable programme for their child.",
  },
];

function createWhatsAppLink(message: string) {
  const phoneNumber = site.phone.replace(/\D/g, "");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const enquiryLink = createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I have a question about admissions, programmes, daycare or school timings."
  );

  function toggleFAQ(index: number) {
    setOpenIndex((current) => (current === index ? null : index));
  }

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="relative overflow-hidden bg-[#FFF9F1] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-20 h-80 w-80 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#FFF0B8] blur-3xl"
      />

      <Container className="relative">
        <div className="grid items-start gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="lg:sticky lg:top-28"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D6EE] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.17em] text-[#5B2A86] shadow-sm">
              <HelpCircle aria-hidden="true" size={16} />
              Frequently asked
            </div>

            <h2
              id="faq-heading"
              className="mt-6 text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-[#2C1735] sm:text-5xl"
            >
              Clear answers before{" "}
              <span className="text-[#5B2A86]">
                your first school visit
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-8 text-[#5F5F6D] sm:text-lg">
              Find answers about programmes, timings, daycare, meals,
              transport and the admission process at Kidzee Sector 12B,
              Dwarka.
            </p>

            <div className="mt-8 rounded-[28px] border border-[#EADFF0] bg-white p-6 shadow-[0_16px_45px_rgba(52,20,68,0.07)]">
              <p className="text-lg font-black text-[#2C1735]">
                Still have a question?
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F5F6D]">
                Contact our admissions team for current fees, seat
                availability, transport routes and trial-class scheduling.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <Button
                  href={enquiryLink}
                  external
                  ariaLabel="Ask Kidzee Sector 12 Dwarka a question on WhatsApp"
                  className="w-full"
                >
                  <MessageCircle aria-hidden="true" size={17} />
                  Ask on WhatsApp
                </Button>

                <Button
                  href="/admissions"
                  variant="secondary"
                  ariaLabel="View Kidzee Sector 12 Dwarka admission information"
                  className="w-full"
                >
                  Admissions
                  <ArrowRight aria-hidden="true" size={17} />
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{
              duration: 0.5,
              delay: 0.06,
              ease: "easeOut",
            }}
            className="space-y-4"
          >
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const buttonId = `faq-button-${index}`;
              const panelId = `faq-panel-${index}`;

              return (
                <article
                  key={faq.question}
                  className="overflow-hidden rounded-[26px] border border-[#EADFF0] bg-white shadow-[0_12px_35px_rgba(52,20,68,0.05)] transition-colors duration-200 hover:border-[#D8C4E3]"
                >
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleFAQ(index)}
                      className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left text-base font-black leading-6 text-[#2C1735] transition-colors hover:bg-[#FCFAFD] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-[#F6C84B]/45 sm:px-6 sm:py-6 sm:text-lg"
                    >
                      <span>{faq.question}</span>

                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all duration-200 ${
                          isOpen
                            ? "bg-[#5B2A86] text-white"
                            : "bg-[#F2E8F8] text-[#5B2A86]"
                        }`}
                      >
                        <ChevronDown
                          aria-hidden="true"
                          size={20}
                          className={`transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        id={panelId}
                        role="region"
                        aria-labelledby={buttonId}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="overflow-hidden"
                      >
                        <p className="border-t border-[#F0E8F4] px-5 pb-6 pt-5 leading-7 text-[#5F5F6D] sm:px-6">
                          {faq.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </article>
              );
            })}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}