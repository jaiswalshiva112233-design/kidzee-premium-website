import { getWebsiteContentSettings } from "@/lib/sanity/contentSettings";
import {
  CalendarCheck2,
  CheckCircle2,
  MessagesSquare,
  Sparkles,
} from "lucide-react";

import EnquiryForm from "@/components/EnquiryForm";
import Container from "@/components/ui/Container";


const visitBenefits = [
  {
    icon: CalendarCheck2,
    title: "Plan a school visit",
    description:
      "Choose a convenient date and see the classrooms, play areas and daily environment in person.",
  },
  {
    icon: MessagesSquare,
    title: "Get programme guidance",
    description:
      "Tell us your child's age and routine so our team can guide you towards the right programme or daycare option.",
  },
  {
    icon: CheckCircle2,
    title: "Continue one clear conversation",
    description:
      "Your details reach our admissions team together, helping them respond without asking you to repeat everything.",
  },
] as const;

export default async function CTA() {
  const contentSettings = await getWebsiteContentSettings();
  return (
    <section
      id="admissions"
      aria-labelledby="admissions-heading"
      className="relative isolate overflow-hidden bg-[#FFF9F1] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#E8D8F1]/75 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#F6C84B]/25 blur-3xl" />
      </div>

      <Container>
        <div className="overflow-hidden rounded-[34px] bg-[#2D1736] shadow-[0_30px_90px_rgba(45,23,54,0.22)] lg:rounded-[42px]">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <div className="relative isolate overflow-hidden px-6 py-9 text-white sm:px-9 sm:py-11 lg:px-12 lg:py-14">
              <div
                aria-hidden="true"
                className="absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#75438E]/55 blur-3xl"
              />

              <div
                aria-hidden="true"
                className="absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full bg-[#F6C84B]/15 blur-3xl"
              />

              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-[#F8D76B]">
                <Sparkles aria-hidden="true" size={15} />
                {contentSettings.admissionsOpen ? "Admissions" : "Admission enquiries"}{" "}
                {contentSettings.academicYear}
              </div>

              <h2
                id="admissions-heading"
                className="mt-6 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-white sm:text-4xl lg:text-[46px]"
              >
                Let&apos;s find the right next step for your child.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-8 text-white/75 sm:text-lg">
                Share what you need and our Sector 12, Dwarka team can help
                with programme fit, availability, daycare or planning a centre
                visit.
              </p>

              <div className="mt-8 space-y-3">
                {visitBenefits.map((benefit) => {
                  const Icon = benefit.icon;

                  return (
                    <div
                      key={benefit.title}
                      className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.07] p-4"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#33203C]">
                        <Icon aria-hidden="true" size={19} />
                      </span>

                      <span>
                        <span className="block text-sm font-black text-white">
                          {benefit.title}
                        </span>

                        <span className="mt-1 block text-sm leading-6 text-white/70">
                          {benefit.description}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>

              <p className="mt-7 text-sm leading-6 text-white/60">
                Only the parent&apos;s name and mobile number are required. No
                payment is collected through this form.
              </p>
            </div>

            <div className="bg-white px-6 py-9 sm:px-9 sm:py-11 lg:px-12 lg:py-14">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-[#7A459C]">
                Enquire with the centre
              </p>

              <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] text-[#2D1736] sm:text-3xl">
                Tell us how we can help.
              </h3>

              <p className="mb-7 mt-3 max-w-2xl text-[15px] leading-7 text-[#6F6474]">
                Submit once and your enquiry will be saved for our admissions
                team. You can continue on WhatsApp after it is safely recorded.
              </p>

              <EnquiryForm />
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
