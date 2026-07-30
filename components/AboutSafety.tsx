"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UtensilsCrossed,
} from "lucide-react";

const safetyCards = [
  {
    icon: Camera,
    title: "Continuous Supervision",
    description:
      "Children remain under the supervision of caring adults throughout the school day, classroom activities and transitions.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Campus",
    description:
      "Entry procedures, organised routines and a child-focused environment help create a safe and reassuring experience for families.",
  },
  {
    icon: UtensilsCrossed,
    title: "Clean Daily Routine",
    description:
      "Meals, hygiene and classroom cleanliness are maintained as an important part of children's everyday wellbeing.",
  },
  {
    icon: UserCheck,
    title: "Responsible Care",
    description:
      "Teachers and support staff work together so children receive consistent guidance, comfort and attention throughout the day.",
  },
];

const safetyPoints = [
  "CCTV surveillance across the campus",
  "Secure visitor entry procedures",
  "Teacher supervision throughout the day",
  "Clean classrooms and child-friendly washrooms",
  "Age-appropriate furniture and learning materials",
  "Regular parent communication",
];

export default function AboutSafety() {
  const whatsappMessage = encodeURIComponent(
    "Hello, I would like to visit Kidzee Sector 12, Dwarka and know more about your preschool."
  );

  return (
    <section
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
      aria-labelledby="about-safety-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-36 top-24 h-80 w-80 rounded-full bg-purple-100/60 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-yellow-100/70 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-16 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .65 }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
              <Sparkles size={16} />
              Safety & Care
            </div>

            <h2
              id="about-safety-heading"
              className="mt-6 text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
            >
              A safe environment helps children{" "}
              <span className="text-[#702a96]">
                learn with confidence
              </span>
            </h2>

            <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
              Parents deserve complete peace of mind while their child is at
              preschool. Our daily routines, caring team and thoughtfully
              organised campus help children feel secure, comfortable and ready
              to participate throughout the day.
            </p>

            <div className="mt-8 space-y-4">
              {safetyPoints.map((item) => (
                <div key={item} className="flex gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-yellow-300 text-[#4b245c]">
                    <CheckCircle2 size={15} strokeWidth={2.6} />
                  </div>

                  <p className="font-semibold leading-7 text-slate-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <a
              href={`https://wa.me/919667038673?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-10 inline-flex min-h-14 items-center gap-2 rounded-full bg-[#64278f] px-7 text-base font-bold text-white shadow-[0_14px_32px_rgba(100,39,143,.24)] transition hover:-translate-y-0.5 hover:bg-[#532173]"
            >
              Book a School Visit
              <ArrowRight size={18} />
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .65 }}
            className="relative"
          >
            <div className="absolute -inset-5 rotate-2 rounded-[44px] bg-purple-100/70" />

            <div className="relative overflow-hidden rounded-[40px] border-[8px] border-white bg-white shadow-[0_30px_80px_rgba(55,22,70,.18)]">
              <div className="relative min-h-[600px]">
                <Image
                  src="/images/about/safety.jpg"
                  alt="Safe learning environment at Kidzee Preschool Sector 12 Dwarka"
                  fill
                  className="object-cover"
                  sizes="(max-width:1024px)100vw,50vw"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#281036]/70 via-transparent to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-6">
                <div className="rounded-[24px] bg-white/90 p-6 backdrop-blur shadow-lg">
                  <div className="flex gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-[#702a96]">
                      <HeartHandshake size={22} />
                    </div>

                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#702a96]">
                        Every child matters
                      </p>

                      <p className="mt-2 text-xl font-extrabold leading-snug text-[#281036]">
                        Children flourish when they feel protected, understood
                        and genuinely cared for every day.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {safetyCards.map((item, index) => {
            const Icon = item.icon;

            return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: .5,
                  delay: index * .05,
                }}
                whileHover={{ y: -6 }}
                className="group rounded-[30px] border border-purple-100 bg-[#fffdf9] p-6 shadow-[0_14px_38px_rgba(62,25,83,.07)] transition hover:border-purple-200 hover:shadow-[0_24px_55px_rgba(62,25,83,.13)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-[#702a96] text-white transition group-hover:-rotate-3">
                  <Icon size={23} />
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-[#281036]">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {item.description}
                </p>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}