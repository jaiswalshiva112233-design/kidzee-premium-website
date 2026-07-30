"use client";

import Link from "next/link";
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

const visitBenefits = [
  "See the classrooms and learning spaces",
  "Meet the centre team and teachers",
  "Understand the programme for your child’s age",
  "Discuss preschool and daycare requirements",
];

export default function ProgrammeCTA() {
  const whatsappMessage = encodeURIComponent(
    "Hello, I would like to know more about the preschool programmes and book a visit to Kidzee Sector 12, Dwarka."
  );

  return (
    <section
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
      aria-labelledby="programme-cta-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-40 top-0 h-96 w-96 rounded-full bg-purple-100/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-yellow-100/80 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="overflow-hidden rounded-[38px] border border-purple-100 bg-[linear-gradient(135deg,#ffffff_0%,#faf6ff_52%,#fff8dc_100%)] shadow-[0_28px_80px_rgba(62,25,83,0.12)]"
        >
          <div className="grid lg:grid-cols-[1.08fr_0.92fr]">
            <div className="p-7 sm:p-10 lg:p-12 xl:p-14">
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm">
                <Sparkles size={16} aria-hidden="true" />
                Admissions and programme guidance
              </div>

              <h2
                id="programme-cta-heading"
                className="mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
              >
                Find the right beginning for{" "}
                <span className="text-[#702a96]">your child</span>
              </h2>

              <p className="mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
                Visit Kidzee Sector 12, Dwarka to understand the programme,
                classroom environment and daily routine before making your
                admission decision.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {visitBenefits.map((benefit) => (
                  <div
                    key={benefit}
                    className="flex items-start gap-3 rounded-[20px] border border-purple-100 bg-white p-4 shadow-sm"
                  >
                    <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                      <CheckCircle2
                        size={16}
                        strokeWidth={2.7}
                        aria-hidden="true"
                      />
                    </div>

                    <p className="text-sm font-semibold leading-6 text-slate-700">
                      {benefit}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/contact"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#64278f] px-7 text-base font-extrabold text-white shadow-[0_14px_32px_rgba(100,39,143,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#522071]"
                >
                  <CalendarCheck2 size={19} aria-hidden="true" />
                  Book a School Visit
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>

                <a
                  href={`https://wa.me/919667038673?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-14 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 text-base font-extrabold text-[#64278f] transition duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50"
                >
                  <MessageCircleMore size={19} aria-hidden="true" />
                  Ask on WhatsApp
                </a>
              </div>
            </div>

            <div className="relative border-t border-purple-100 bg-[#f7f1fb] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-12">
              <div
                aria-hidden="true"
                className="absolute right-8 top-8 h-32 w-32 rounded-full bg-yellow-200/65 blur-2xl"
              />

              <div className="relative">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                  Visit information
                </p>

                <h3 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036] sm:text-4xl">
                  Plan a comfortable visit to the centre
                </h3>

                <p className="mt-4 leading-8 text-slate-600">
                  A school visit gives parents a clearer understanding of the
                  environment, teachers, programme options and facilities.
                </p>

                <div className="mt-8 space-y-4">
                  <div className="flex items-start gap-4 rounded-[24px] bg-white p-5 shadow-[0_12px_32px_rgba(62,25,83,0.07)]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-purple-100 text-[#702a96]">
                      <MapPin size={22} aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-sm font-extrabold text-[#281036]">
                        Kidzee Sector 12, Dwarka
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Building No. 19, Block B, Sector 12B, Dwarka, Delhi
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-[24px] bg-white p-5 shadow-[0_12px_32px_rgba(62,25,83,0.07)]">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-yellow-200 text-[#281036]">
                      <Clock3 size={22} aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-sm font-extrabold text-[#281036]">
                        Preschool and daycare
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        Preschool timings are approximately 8:30 AM to 1:00 PM.
                        Daycare is available until 7:00 PM.
                      </p>
                    </div>
                  </div>

                  <a
                    href="tel:+919667038673"
                    className="flex items-start gap-4 rounded-[24px] bg-white p-5 shadow-[0_12px_32px_rgba(62,25,83,0.07)] transition duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-purple-100 text-[#702a96]">
                      <Phone size={22} aria-hidden="true" />
                    </div>

                    <div>
                      <p className="text-sm font-extrabold text-[#281036]">
                        Call the admission team
                      </p>

                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        +91 96670 38673
                      </p>
                    </div>
                  </a>
                </div>

                <div className="mt-8 rounded-[26px] border border-yellow-200 bg-yellow-50 p-5">
                  <p className="text-sm font-extrabold text-[#281036]">
                    Three-day trial classes are available
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-600">
                    Parents can enquire about the trial programme before
                    admission so the child can experience the classroom,
                    teachers and daily routine.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}