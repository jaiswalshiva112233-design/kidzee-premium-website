"use client";

import { useSiteContact } from "@/components/SiteContactProvider";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  CalendarCheck2,
  CheckCircle2,
  GraduationCap,
  Phone,
  Sparkles,
} from "lucide-react";

const guidancePoints = [
  "Your child’s current age and date of birth",
  "Previous preschool or classroom experience",
  "Communication, confidence and independence",
  "The most suitable entry level for the coming session",
];

const programmeGroups = [
  {
    icon: Baby,
    label: "Early preschool years",
    programmes: "Playgroup and Nursery",
    ageRange: "2 to 4 years",
    description:
      "A gentle beginning centred around communication, routines, exploration and learning through play.",
    iconClassName: "bg-[#F7E5FF] text-[#702A96]",
  },
  {
    icon: GraduationCap,
    label: "Kindergarten years",
    programmes: "Junior KG and Senior KG",
    ageRange: "4 to 6 years",
    description:
      "A more structured learning stage that builds school readiness while keeping children actively involved.",
    iconClassName: "bg-[#FFF0B8] text-[#4A3210]",
  },
];

export default function ProgrammeCTA() {
  const site = useSiteContact();

  return (
    <section
      className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
      aria-labelledby="programme-cta-heading"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-[#EADDF1]/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-[#F6C84B]/20 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="overflow-hidden rounded-[36px] border border-[#5B2A86]/10 bg-[linear-gradient(135deg,#ffffff_0%,#faf7fc_55%,#fffaf0_100%)] shadow-[0_26px_75px_rgba(45,23,54,0.11)]"
        >
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="p-7 sm:p-10 lg:p-12 xl:p-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.15em] text-[#702A96] shadow-sm">
                <Sparkles size={16} aria-hidden="true" />
                Programme selection support
              </div>

              <h2
                id="programme-cta-heading"
                className="mt-6 max-w-3xl text-balance text-4xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[56px]"
              >
                Not sure which programme{" "}
                <span className="text-[#702A96]">fits your child?</span>
              </h2>

              <p className="mt-6 max-w-3xl text-base leading-8 text-[#6F6474] sm:text-lg">
                Age is the starting point, but the right classroom also depends
                on your child’s previous experience, comfort level and stage of
                development. Our team can help you make a clear choice.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {guidancePoints.map((point) => (
                  <div
                    key={point}
                    className="flex items-start gap-3 rounded-[20px] border border-[#5B2A86]/10 bg-white p-4 shadow-[0_8px_24px_rgba(45,23,54,0.05)]"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F6C84B] text-[#281036]">
                      <CheckCircle2
                        size={16}
                        strokeWidth={2.6}
                        aria-hidden="true"
                      />
                    </div>

                    <p className="text-sm font-semibold leading-6 text-[#574E5B]">
                      {point}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/admissions?enquiry=ADMISSION#admission-enquiry"
                  className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#64278F] px-7 py-3.5 text-base font-extrabold text-white shadow-[0_14px_32px_rgba(100,39,143,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#522071] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#702A96]/25"
                >
                  <CalendarCheck2 size={19} aria-hidden="true" />
                  Get Programme Guidance
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>

              </div>

              <a
                href={`tel:${site.phone}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#6F6474] transition-colors hover:text-[#702A96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#702A96]/30"
              >
                <Phone size={17} aria-hidden="true" />
                Speak with the admission team: {site.phoneDisplay}
              </a>
            </div>

            <div className="border-t border-[#5B2A86]/10 bg-[#2D1736] p-7 text-white sm:p-10 lg:border-l lg:border-t-0 lg:p-12 xl:p-14">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#F6C84B]">
                A simple starting point
              </p>

              <h3 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.03em] text-white sm:text-4xl">
                Begin with your child’s age group
              </h3>

              <p className="mt-4 max-w-xl leading-8 text-white/70">
                These broad stages will help you identify the most relevant
                programmes before speaking with our team.
              </p>

              <div className="mt-8 space-y-4">
                {programmeGroups.map((group) => {
                  const Icon = group.icon;

                  return (
                    <div
                      key={group.programmes}
                      className="rounded-[26px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6"
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] ${group.iconClassName}`}
                        >
                          <Icon size={23} aria-hidden="true" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <p className="text-xs font-extrabold uppercase tracking-[0.13em] text-[#F6C84B]">
                              {group.label}
                            </p>

                            <p className="text-sm font-bold text-white/70">
                              {group.ageRange}
                            </p>
                          </div>

                          <h4 className="mt-2 text-xl font-extrabold text-white">
                            {group.programmes}
                          </h4>

                          <p className="mt-3 text-sm leading-7 text-white/70">
                            {group.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 rounded-[24px] border border-[#F6C84B]/25 bg-[#F6C84B]/10 p-5">
                <p className="text-sm font-extrabold text-[#F9DA78]">
                  Final placement is discussed individually
                </p>

                <p className="mt-2 text-sm leading-7 text-white/70">
                  We do not recommend selecting a class only from a website
                  description. A short conversation helps us guide parents more
                  accurately.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
