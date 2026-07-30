"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  MessageCircle,
  School,
  Sparkles,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const steps = [
  {
    number: "01",
    icon: MessageCircle,
    title: "Share your child’s details",
    description:
      "Tell us your child’s age, the programme you are considering and whether you also require daycare.",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Visit the preschool",
    description:
      "Meet our school team, understand the daily routine and discuss the programme most suitable for your child.",
  },
  {
    number: "03",
    icon: Baby,
    title: "Attend a 3-day trial",
    description:
      "Your child can experience the preschool environment for three days, for up to two hours each day, before admission.",
  },
  {
    number: "04",
    icon: ClipboardList,
    title: "Complete the admission",
    description:
      "Submit the required documents, complete the formalities and confirm your child’s place in the selected programme.",
  },
];

const documents = [
  "Child’s birth certificate",
  "Recent passport-size photographs of the child",
  "Parent or guardian identity proof",
  "Residential address proof",
  "Relevant medical information, if applicable",
];

const trialHighlights = [
  {
    value: "3 Days",
    label: "Trial classes",
  },
  {
    value: "2 Hours",
    label: "Per day",
  },
  {
    value: "No Pressure",
    label: "Comfortable settling",
  },
];

function createWhatsAppLink(message: string) {
  const phoneNumber = site.phone.replace(/\D/g, "");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export default function AdmissionProcess() {
  const visitLink = createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to book a school visit and understand the admission process."
  );

  const trialLink = createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to know more about the 3-day trial classes."
  );

  const enquiryLink = createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like guidance on the right programme for my child."
  );

  return (
    <section
      id="admission-process"
      aria-labelledby="admission-process-heading"
      className="relative overflow-hidden bg-[#FFF9F1] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-[#FFF0B8] blur-3xl"
      />

      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D6EE] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#5B2A86] shadow-sm">
            <Sparkles aria-hidden="true" size={16} />

            Admission process
          </div>

          <h2
            id="admission-process-heading"
            className="mt-6 text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-[#2C1735] sm:text-5xl lg:text-[56px]"
          >
            A simple admission process for{" "}
            <span className="text-[#5B2A86]">
              parents in Dwarka
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-[#5F5F6D] sm:text-lg">
            From your first enquiry to your child’s first day, our team explains
            each step clearly and helps you choose the programme most suitable
            for your child.
          </p>
        </motion.div>

        {/* Admission steps */}
        <div className="relative mt-14">
          <div
            aria-hidden="true"
            className="absolute left-[12.5%] right-[12.5%] top-16 hidden h-px bg-[#DDCDE6] xl:block"
          />

          <div className="relative grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => {
              const Icon = step.icon;

              return (
                <motion.article
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.06,
                    ease: "easeOut",
                  }}
                  className="group relative rounded-[30px] border border-[#EADFF0] bg-white p-6 shadow-[0_16px_42px_rgba(52,20,68,0.07)] transition-all duration-300 hover:-translate-y-1 hover:border-[#D8C4E3] hover:shadow-[0_24px_55px_rgba(52,20,68,0.11)] sm:p-7"
                >
                  <div
                    aria-hidden="true"
                    className="absolute right-5 top-4 text-5xl font-black text-[#F1E8F5]"
                  >
                    {step.number}
                  </div>

                  <div className="relative">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#5B2A86] text-white shadow-[0_12px_28px_rgba(91,42,134,0.24)] transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-[1.03]">
                      <Icon aria-hidden="true" size={25} strokeWidth={2.1} />
                    </div>

                    <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#5B2A86]">
                      Step {step.number}
                    </p>

                    <h3 className="mt-2 text-xl font-black leading-7 text-[#2C1735]">
                      {step.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#5F5F6D]">
                      {step.description}
                    </p>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>

        {/* Trial and documents */}
        <div className="mt-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[34px] bg-[#2C1735] p-7 text-white shadow-[0_26px_70px_rgba(44,23,53,0.2)] sm:p-9 lg:p-10"
          >
            <div
              aria-hidden="true"
              className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-[#7A3AA5]/25 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-24 left-10 h-56 w-56 rounded-full bg-[#F6C84B]/10 blur-3xl"
            />

            <div className="relative">
              <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#F6C84B] text-[#2C1735]">
                <School aria-hidden="true" size={25} />
              </div>

              <p className="mt-6 text-xs font-black uppercase tracking-[0.18em] text-[#F6D86F]">
                Experience before admission
              </p>

              <h3 className="mt-3 max-w-2xl text-3xl font-black leading-tight tracking-[-0.03em] sm:text-4xl">
                Give your child time to become familiar with the school
              </h3>

              <p className="mt-5 max-w-2xl leading-7 text-[#E8DDF1]">
                Our 3-day trial gives children an opportunity to meet the
                teachers, experience the classroom routine and feel more
                comfortable before joining regularly.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                {trialHighlights.map((item) => (
                  <div
                    key={item.label}
                    className="rounded-[22px] border border-white/10 bg-white/[0.07] px-5 py-4 backdrop-blur"
                  >
                    <p className="text-xl font-black text-white">
                      {item.value}
                    </p>

                    <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#D8C4E3]">
                      {item.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={trialLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-[#5B2A86] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F6C84B] hover:text-[#2C1735] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2C1735]"
                >
                  Ask About the 3-Day Trial
                  <ArrowRight aria-hidden="true" size={17} />
                </a>

                <a
                  href={visitLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-white/20 bg-white/[0.08] px-6 text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2C1735]"
                >
                  Book a School Visit
                </a>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="rounded-[34px] border border-[#EADFF0] bg-white p-7 shadow-[0_18px_50px_rgba(52,20,68,0.08)] sm:p-9 lg:p-10"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#F2E8F8] text-[#5B2A86]">
                <ClipboardList aria-hidden="true" size={24} />
              </div>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                  Admission documents
                </p>

                <h3 className="mt-1 text-2xl font-black text-[#2C1735]">
                  Keep these documents ready
                </h3>
              </div>
            </div>

            <div className="mt-7 space-y-4">
              {documents.map((document) => (
                <div key={document} className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F2E8F8] text-[#5B2A86]">
                    <CheckCircle2
                      aria-hidden="true"
                      size={15}
                      strokeWidth={2.6}
                    />
                  </div>

                  <p className="leading-7 text-[#5F5F6D]">
                    {document}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-7 rounded-[22px] border border-[#EADFF0] bg-[#F8F3FC] p-5">
              <p className="text-sm leading-7 text-[#5F5F6D]">
                Our school team will confirm the final document requirements,
                current seat availability and admission formalities during your
                discussion.
              </p>
            </div>
          </motion.div>
        </div>

        {/* Final enquiry CTA */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55 }}
          className="mt-10 flex flex-col items-center justify-between gap-6 rounded-[30px] border border-[#F0D778] bg-[#FFF1B8] px-6 py-7 text-center sm:px-9 lg:flex-row lg:text-left"
        >
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#765A00]">
              Not sure which programme is right?
            </p>

            <h3 className="mt-2 text-2xl font-black text-[#2C1735] sm:text-3xl">
              Speak with our admissions team and we will guide you
            </h3>

            <p className="mt-2 leading-7 text-[#5F5429]">
              Share your child’s age and requirements, and we will help you
              understand the most suitable preschool or daycare option.
            </p>
          </div>

          <Button
            href={enquiryLink}
            external
            className="shrink-0"
            ariaLabel="Start an admission enquiry with Kidzee Sector 12 Dwarka on WhatsApp"
          >
            Start Admission Enquiry
            <ArrowRight aria-hidden="true" size={17} />
          </Button>
        </motion.div>
      </Container>
    </section>
  );
}