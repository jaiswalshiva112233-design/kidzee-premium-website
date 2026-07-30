"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  HandHeart,
  MessageCircleMore,
  Move,
  Palette,
  Sparkles,
  UsersRound,
} from "lucide-react";

const approachAreas = [
  {
    icon: Brain,
    title: "Thinking and understanding",
    description:
      "Children learn to observe, compare, classify, remember, question and solve simple problems through practical classroom experiences.",
  },
  {
    icon: MessageCircleMore,
    title: "Language and communication",
    description:
      "Stories, conversations, rhymes, phonics and group discussions help children express themselves and understand others more confidently.",
  },
  {
    icon: UsersRound,
    title: "Social and emotional growth",
    description:
      "Children practise sharing, cooperation, turn-taking, listening and expressing emotions in a safe and supportive environment.",
  },
  {
    icon: Move,
    title: "Physical development",
    description:
      "Movement, play and coordinated activities support balance, body control, fine-motor strength and gross-motor development.",
  },
  {
    icon: Palette,
    title: "Creativity and imagination",
    description:
      "Art, music, pretend play and open-ended activities allow children to explore ideas and express themselves in different ways.",
  },
  {
    icon: HandHeart,
    title: "Confidence and independence",
    description:
      "Daily routines encourage children to make simple choices, complete age-appropriate tasks and become increasingly responsible.",
  },
];

const classroomMethods = [
  "Stories and picture conversations",
  "Hands-on learning materials",
  "Music, rhythm and movement",
  "Role play and imaginative play",
  "Art and creative expression",
  "Small-group learning experiences",
  "Teacher-guided exploration",
  "Age-appropriate classroom routines",
];

export default function ProgrammeApproach() {
  return (
    <section
      className="relative overflow-hidden bg-[#fffaf1] py-20 sm:py-24 lg:py-28"
      aria-labelledby="programme-approach-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-36 top-16 h-96 w-96 rounded-full bg-yellow-200/45 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-12 h-96 w-96 rounded-full bg-purple-200/40 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16 xl:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
            className="relative"
          >
            <div
              aria-hidden="true"
              className="absolute -left-5 -top-5 h-28 w-28 rounded-[34px] bg-purple-200/65"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-5 -right-5 h-32 w-32 rounded-full bg-yellow-300/65"
            />

            <div className="relative overflow-hidden rounded-[40px] border-[8px] border-white bg-white shadow-[0_28px_75px_rgba(62,25,83,0.14)]">
              <div className="relative min-h-[570px] sm:min-h-[690px]">
                <Image
                  src="/images/programmes/programme-approach.jpg"
                  alt="Children learning through classroom activities at Kidzee Sector 12 Dwarka"
                  fill
                  sizes="(max-width: 1024px) 100vw, 46vw"
                  className="object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#281036]/72 via-transparent to-transparent" />
              </div>

              <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                <div className="rounded-[28px] border border-white/25 bg-white/92 p-5 shadow-xl backdrop-blur-md sm:p-6">
                  <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#702a96]">
                    Active participation
                  </p>

                  <p className="mt-2 text-xl font-extrabold leading-snug text-[#281036] sm:text-2xl">
                    Children learn more deeply when they can see, touch,
                    discuss, move and practise.
                  </p>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [0, -7, 0] }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -right-3 top-12 hidden max-w-[220px] rounded-[24px] border border-purple-100 bg-white p-5 shadow-[0_18px_45px_rgba(57,26,68,0.15)] sm:block"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.15em] text-[#702a96]">
                Child-centred learning
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Teachers guide learning while allowing children to explore and
                participate actively.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 26 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.65, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm">
              <Sparkles size={16} aria-hidden="true" />
              Our teaching approach
            </div>

            <h2
              id="programme-approach-heading"
              className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
            >
              Children learn through{" "}
              <span className="text-[#702a96]">
                experiences that feel meaningful
              </span>
            </h2>

            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Our programmes do not depend only on books and worksheets.
              Teachers introduce concepts through stories, discussion,
              movement, play, creative activities and carefully planned
              classroom experiences.
            </p>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              This allows children to understand ideas in different ways while
              building communication, confidence, curiosity and the ability to
              apply what they have learned.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {classroomMethods.map((method) => (
                <div
                  key={method}
                  className="flex items-start gap-3 rounded-[20px] border border-yellow-200 bg-white p-4 shadow-sm"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">
                    <CheckCircle2
                      size={16}
                      strokeWidth={2.7}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-sm font-semibold leading-6 text-slate-700">
                    {method}
                  </p>
                </div>
              ))}
            </div>

            <Link
              href="/contact"
              className="mt-8 inline-flex min-h-14 items-center justify-center gap-2 rounded-full bg-[#64278f] px-7 text-base font-extrabold text-white shadow-[0_14px_32px_rgba(100,39,143,0.22)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#522071]"
            >
              Experience a Classroom Session
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.18 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-20 max-w-4xl text-center"
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
            Whole-child development
          </p>

          <h3 className="mt-4 text-balance text-3xl font-extrabold leading-tight tracking-[-0.035em] text-[#281036] sm:text-4xl lg:text-5xl">
            Learning supports more than academic readiness
          </h3>

          <p className="mx-auto mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Each programme supports the connected areas of development that
            help children participate confidently in school and everyday life.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {approachAreas.map((area, index) => {
            const Icon = area.icon;

            return (
              <motion.article
                key={area.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.16 }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.05,
                  ease: "easeOut",
                }}
                whileHover={{ y: -5 }}
                className="group rounded-[30px] border border-purple-100 bg-white p-6 shadow-[0_15px_42px_rgba(62,25,83,0.07)] transition duration-300 hover:border-purple-200 hover:shadow-[0_24px_56px_rgba(62,25,83,0.12)] sm:p-7"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-purple-100 text-[#702a96] transition duration-300 group-hover:-rotate-3 group-hover:bg-[#702a96] group-hover:text-white">
                  <Icon size={23} strokeWidth={2.1} aria-hidden="true" />
                </div>

                <h4 className="mt-5 text-xl font-extrabold leading-7 text-[#281036]">
                  {area.title}
                </h4>

                <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                  {area.description}
                </p>
              </motion.article>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-16 overflow-hidden rounded-[36px] bg-[#2d1636] p-7 text-white shadow-[0_28px_75px_rgba(45,22,54,0.18)] sm:p-9 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300">
                Guided by teachers, experienced by children
              </p>

              <h3 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.03em] sm:text-4xl">
                The teacher creates the opportunity, and the child becomes an
                active part of the learning
              </h3>

              <p className="mt-5 max-w-3xl leading-8 text-purple-100">
                Teachers introduce ideas, observe responses, ask questions and
                provide support. Children participate by exploring, discussing,
                trying, repeating and applying the experience in their own way.
              </p>
            </div>

            <Link
              href="/about"
              className="inline-flex min-h-14 shrink-0 items-center justify-center gap-2 rounded-full bg-yellow-300 px-7 text-base font-extrabold text-[#281036] transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-200"
            >
              Learn About Our Centre
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}