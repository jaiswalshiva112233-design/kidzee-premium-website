"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircleMore,
  Phone,
  Sparkles,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const highlights = [
  "Explore our classrooms and play areas",
  "Meet the teachers and centre team",
  "Discuss the right programme for your child",
  "Ask about the 3-day preschool trial",
] as const;

export default function CTA() {
  return (
    <section
      id="admissions"
      aria-labelledby="admissions-cta-heading"
      className="relative isolate overflow-hidden bg-[#FFF9F1] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
      >
        <div className="absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#E7D7F1]/80 blur-3xl" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#F6C84B]/25 blur-3xl" />
      </div>

      <Container>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="relative isolate overflow-hidden rounded-[34px] bg-[#2D1736] px-6 py-8 text-white shadow-[0_28px_80px_rgba(45,23,54,0.22)] sm:px-9 sm:py-10 lg:rounded-[42px] lg:px-12 lg:py-12 xl:px-14"
        >
          <div
            aria-hidden="true"
            className="absolute -right-20 -top-24 -z-10 h-80 w-80 rounded-full bg-[#7D4C98]/45 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-32 -left-20 -z-10 h-80 w-80 rounded-full bg-[#F6C84B]/15 blur-3xl"
          />

          <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:gap-14">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-[#F8D76B]">
                <Sparkles size={15} aria-hidden="true" />
                Admissions open
              </div>

              <h2
                id="admissions-cta-heading"
                className="mt-6 max-w-3xl text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] sm:text-4xl lg:text-[50px]"
              >
                Visit Kidzee Sector 12, Dwarka before choosing your child&apos;s
                preschool.
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-8 text-white/75 sm:text-lg">
                See the learning environment for yourself, meet our team and
                understand how your child would spend each day before making an
                admission decision.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {highlights.map((highlight) => (
                  <div
                    key={highlight}
                    className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-4"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      size={19}
                      className="mt-0.5 shrink-0 text-[#F6C84B]"
                    />

                    <p className="text-sm font-bold leading-6 text-white/85">
                      {highlight}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  href={site.whatsappVisit}
                  external
                  variant="primary"
                  size="lg"
                  leftIcon={
                    <MessageCircleMore aria-hidden="true" size={19} />
                  }
                  rightIcon={<ArrowRight aria-hidden="true" size={18} />}
                  aria-label="Book a visit to Kidzee Sector 12 Dwarka on WhatsApp"
                  className="sm:min-w-[220px]"
                >
                  Book a School Visit
                </Button>

                <Button
                  href={site.whatsappTrial}
                  external
                  variant="secondary"
                  size="lg"
                  leftIcon={<CalendarCheck2 aria-hidden="true" size={18} />}
                  aria-label="Ask about the 3-day preschool trial"
                  className="border-white/20 bg-white/10 text-white hover:bg-white/15"
                >
                  Ask About Trial
                </Button>
              </div>
            </div>

            <div className="rounded-[30px] border border-white/15 bg-white p-6 text-[#2D1736] shadow-[0_24px_60px_rgba(13,5,18,0.2)] sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-[#7A459C]">
                Plan your visit
              </p>

              <h3 className="mt-3 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
                Speak directly with our admissions team.
              </h3>

              <p className="mt-3 text-[15px] leading-7 text-[#6F6474]">
                Call or WhatsApp us to check programme availability and choose
                a convenient time to visit the centre.
              </p>

              <div className="mt-7 space-y-4">
                <a
                  href={`tel:${site.phone}`}
                  className="group flex items-center gap-4 rounded-2xl border border-[#5B2A86]/10 bg-[#FAF7FC] p-4 transition hover:border-[#5B2A86]/20 hover:bg-[#F5EDF9]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EADDF1] text-[#5B2A86]">
                    <Phone aria-hidden="true" size={20} />
                  </span>

                  <span>
                    <span className="block text-xs font-black uppercase tracking-[0.1em] text-[#817586]">
                      Call admissions
                    </span>

                    <span className="mt-1 block text-base font-black text-[#2D1736]">
                      {site.phoneDisplay}
                    </span>
                  </span>
                </a>

                <div className="flex items-center gap-4 rounded-2xl border border-[#5B2A86]/10 bg-[#FAF7FC] p-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF2C6] text-[#8A6812]">
                    <Clock3 aria-hidden="true" size={20} />
                  </span>

                  <span>
                    <span className="block text-xs font-black uppercase tracking-[0.1em] text-[#817586]">
                      Preschool hours
                    </span>

                    <span className="mt-1 block text-sm font-black text-[#2D1736]">
                      {site.preschoolHours.days},{" "}
                      {site.preschoolHours.display}
                    </span>
                  </span>
                </div>

                <a
                  href={site.map}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4 rounded-2xl border border-[#5B2A86]/10 bg-[#FAF7FC] p-4 transition hover:border-[#5B2A86]/20 hover:bg-[#F5EDF9]"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E3F2E9] text-[#34714D]">
                    <MapPin aria-hidden="true" size={20} />
                  </span>

                  <span>
                    <span className="block text-xs font-black uppercase tracking-[0.1em] text-[#817586]">
                      Visit the centre
                    </span>

                    <span className="mt-1 block text-sm font-bold leading-6 text-[#2D1736]">
                      {site.addressShort}
                    </span>
                  </span>
                </a>
              </div>

              <Button
                href={site.whatsappAdmission}
                external
                variant="primary"
                size="lg"
                leftIcon={
                  <MessageCircleMore aria-hidden="true" size={18} />
                }
                rightIcon={<ArrowRight aria-hidden="true" size={17} />}
                className="mt-6 w-full"
                aria-label="Enquire about admission on WhatsApp"
              >
                WhatsApp Admissions
              </Button>

              <p className="mt-4 text-center text-xs leading-5 text-[#817586]">
                Programme and trial availability should be confirmed with the
                centre before visiting.
              </p>
            </div>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}