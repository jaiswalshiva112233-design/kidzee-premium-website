import {
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  MessageCircle,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const steps = [
  {
    number: "01",
    icon: MessageCircle,
    title: "Send an enquiry",
    description:
      "Share your child’s age and whether you are looking for preschool, daycare or both.",
  },
  {
    number: "02",
    icon: CalendarCheck,
    title: "Visit the centre",
    description:
      "Meet the team, see the classrooms and discuss the daily routine before making a decision.",
  },
  {
    number: "03",
    icon: ClipboardCheck,
    title: "Complete the formalities",
    description:
      "Confirm the programme, submit the required documents and complete the admission form.",
  },
] as const;

const documents = [
  "Child’s birth certificate",
  "Recent passport-size photographs",
  "Parent or guardian identity proof",
  "Residential address proof",
  "Relevant medical information, when applicable",
] as const;

export default function AdmissionProcess() {
  return (
    <section
      id="admission-process"
      aria-labelledby="admission-process-heading"
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
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
            Admission process
          </p>

          <h2
            id="admission-process-heading"
            className="mt-5 text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-4xl lg:text-5xl"
          >
            A straightforward process from enquiry to admission.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
            Parents can speak with the centre team, visit the school and review
            the programme before completing the admission formalities.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-3 lg:mt-12">
          {steps.map((step) => {
            const Icon = step.icon;

            return (
              <article
                key={step.number}
                className="relative rounded-[28px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_14px_42px_rgba(52,20,68,0.06)] sm:p-7"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-6 top-5 text-4xl font-black text-[#F1E8F5]"
                >
                  {step.number}
                </span>

                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B2A86] text-white">
                  <Icon aria-hidden="true" size={21} />
                </div>

                <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                  Step {step.number}
                </p>

                <h3 className="mt-2 text-xl font-black tracking-[-0.02em] text-[#2D1736]">
                  {step.title}
                </h3>

                <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-[30px] bg-[#2D1736] p-7 text-white shadow-[0_24px_65px_rgba(45,23,54,0.18)] sm:p-9">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F6D86F]">
              Before admission
            </p>

            <h3 className="mt-4 text-3xl font-black leading-tight tracking-[-0.03em]">
              Ask about the 3-day trial.
            </h3>

            <p className="mt-4 max-w-xl leading-7 text-white/75">
              The trial gives your child an opportunity to spend up to two
              hours at the centre on each of three days before regular
              attendance begins.
            </p>

            <p className="mt-4 max-w-xl text-sm leading-6 text-white/60">
              Trial availability and timings should be confirmed with the
              centre in advance.
            </p>

            <div className="mt-7">
              <Button
                href={site.whatsappTrial}
                external
                variant="yellow"
                size="md"
              >
                Ask About the Trial
              </Button>
            </div>
          </div>

          <div className="rounded-[30px] border border-[#5B2A86]/10 bg-white p-7 shadow-[0_16px_46px_rgba(52,20,68,0.06)] sm:p-9">
            <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
              Admission documents
            </p>

            <h3 className="mt-4 text-2xl font-black tracking-[-0.025em] text-[#2D1736]">
              Documents commonly requested
            </h3>

            <div className="mt-6 space-y-4">
              {documents.map((document) => (
                <div key={document} className="flex items-start gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    size={19}
                    className="mt-1 shrink-0 text-[#5B2A86]"
                  />

                  <p className="leading-7 text-[#6F6474]">{document}</p>
                </div>
              ))}
            </div>

            <p className="mt-6 rounded-2xl bg-[#FAF7FC] p-4 text-sm leading-6 text-[#6F6474]">
              The centre team will confirm the final document list and current
              seat availability before admission.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-5 rounded-[28px] border border-[#E8D36F] bg-[#FFF1B8] px-6 py-7 text-center sm:px-8 lg:flex-row lg:text-left">
          <div>
            <h3 className="text-2xl font-black text-[#2D1736]">
              Start with a simple enquiry.
            </h3>

            <p className="mt-2 leading-7 text-[#64592C]">
              Share your child’s age and requirements with the admissions
              team.
            </p>
          </div>

          <Button
            href={site.whatsappAdmission}
            external
            size="md"
            className="shrink-0"
          >
            Start Admission Enquiry
          </Button>
        </div>
      </Container>
    </section>
  );
}