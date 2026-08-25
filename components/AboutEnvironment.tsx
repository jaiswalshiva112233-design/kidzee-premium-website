"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  Blocks,
  BookOpenCheck,
  CheckCircle2,
  Palette,
  ShieldCheck,
  Sparkles,
  Sun,
  ToyBrick,
} from "lucide-react";

const environmentFeatures = [
  {
    icon: Sun,
    title: "Bright, welcoming classrooms",
    description:
      "Classrooms are arranged to feel cheerful, comfortable and easy for young children to understand and explore.",
  },
  {
    icon: Blocks,
    title: "Purposeful learning zones",
    description:
      "Different spaces support storytelling, early literacy, creative work, guided play and small-group activities.",
  },
  {
    icon: ToyBrick,
    title: "Indoor play opportunities",
    description:
      "Movement and play are included throughout the routine so children can develop coordination, confidence and social skills.",
  },
  {
    icon: Palette,
    title: "Creative activity spaces",
    description:
      "Art, craft, music, pretend play and sensory activities give children opportunities to express their ideas in different ways.",
  },
];

const environmentPriorities = [
  "Child-friendly furniture and organised activity areas",
  "Comfortable spaces for learning, play and rest",
  "Age-appropriate materials within children’s reach",
  "Clear routines that help children move confidently",
  "Regular attention to hygiene and classroom organisation",
  "Supervised spaces designed around young children",
];

type AboutEnvironmentProps = {
  mainImageUrl?: string;
  mainImageAlt?: string;
  playImageUrl?: string;
  playImageAlt?: string;
  activityImageUrl?: string;
  activityImageAlt?: string;
};

export default function AboutEnvironment({
  mainImageUrl = "/images/facilities/classroom-1.jpg",
  mainImageAlt = "Bright classroom at Kidzee Preschool Sector 12 Dwarka",
  playImageUrl = "/images/facilities/first-floor-play.jpg",
  playImageAlt = "Indoor play area for young children at Kidzee Sector 12 Dwarka",
  activityImageUrl = "/images/gallery/gallery-creative-activity.jpg",
  activityImageAlt = "Children participating in a creative classroom activity at Kidzee Dwarka",
}: AboutEnvironmentProps) {
  return (
    <section
      className="relative overflow-hidden bg-[#fffaf2] py-14 sm:py-16 lg:py-20"
      aria-labelledby="about-environment-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-purple-100/65 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 top-20 h-96 w-96 rounded-full bg-yellow-100/75 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm">
            <Sparkles size={16} aria-hidden="true" />
            Our learning environment
          </div>

          <h2
            id="about-environment-heading"
            className="mt-6 text-balance text-3xl font-extrabold leading-[1.08] tracking-[-0.04em] text-[#281036] sm:text-4xl lg:text-[48px]"
          >
            Real spaces for{" "}
            <span className="text-[#702a96]">
              learning, movement and play
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            A preschool environment should make it easy for children to
            participate. Our classrooms and activity spaces are organised to
            support movement, exploration, focused learning and everyday
            independence.
          </p>
        </motion.div>

        <div className="mt-14 grid items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, x: -28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[780px]"
          >
            <div className="grid gap-5 sm:grid-cols-[1.15fr_0.85fr]">
              <div className="relative overflow-hidden rounded-[34px] border-[7px] border-white bg-purple-50 shadow-[0_28px_75px_rgba(54,21,74,0.18)]">
                <div className="relative aspect-[4/3] min-h-0 sm:aspect-auto sm:min-h-[650px]">
                  <Image
                    src={mainImageUrl}
                    alt={mainImageAlt}
                    unoptimized={mainImageUrl.startsWith("http")}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 35vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#25112e]/55 via-transparent to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="rounded-[24px] border border-white/20 bg-white/92 p-5 shadow-lg backdrop-blur-md">
                    <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#702a96]">
                      Thoughtfully arranged
                    </p>

                    <p className="mt-2 text-xl font-extrabold leading-snug text-[#281036]">
                      Familiar spaces help children move through the day with
                      greater confidence.
                    </p>
                  </div>
                </div>
              </div>

              <div className="hidden gap-5 sm:grid">
                <div className="relative min-h-[250px] overflow-hidden rounded-[30px] border-[7px] border-white bg-purple-50 shadow-[0_20px_55px_rgba(54,21,74,0.14)] sm:min-h-0">
                  <Image
                    src={playImageUrl}
                    alt={playImageAlt}
                    unoptimized={playImageUrl.startsWith("http")}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 22vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#25112e]/60 via-transparent to-transparent" />

                  <p className="absolute bottom-5 left-5 right-5 text-lg font-extrabold text-white">
                    Indoor play and movement
                  </p>
                </div>

                <div className="relative min-h-[250px] overflow-hidden rounded-[30px] border-[7px] border-white bg-yellow-50 shadow-[0_20px_55px_rgba(54,21,74,0.14)] sm:min-h-0">
                  <Image
                    src={activityImageUrl}
                    alt={activityImageAlt}
                    unoptimized={activityImageUrl.startsWith("http")}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 22vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#25112e]/60 via-transparent to-transparent" />

                  <p className="absolute bottom-5 left-5 right-5 text-lg font-extrabold text-white">
                    Creative and guided activities
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
              className="absolute -left-3 top-10 hidden rounded-[22px] border border-purple-100 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(57,26,68,0.15)] sm:block"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
                Child-Friendly Spaces
              </p>

              <p className="mt-1 text-lg font-extrabold text-[#281036]">
                Designed for young learners
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 28 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="min-w-0"
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
              More than a classroom
            </p>

            <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036] sm:text-4xl">
              Every space supports a part of the child’s day
            </h3>

            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              Children need different kinds of spaces during the day. They need
              room to listen, talk, create, move, play and sometimes pause. Our
              environment is planned to support these changing needs without
              making the routine feel confusing or overwhelming.
            </p>

            <div className="mt-8 grid grid-flow-col auto-cols-[82%] gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:overflow-visible sm:pb-0">
              {environmentFeatures.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      duration: 0.45,
                      delay: index * 0.05,
                      ease: "easeOut",
                    }}
                    className="snap-start rounded-[26px] border border-purple-100 bg-white p-5 shadow-[0_12px_34px_rgba(62,25,83,0.06)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-purple-100 text-[#702a96]">
                      <Icon size={22} strokeWidth={2.1} aria-hidden="true" />
                    </div>

                    <h4 className="mt-4 text-lg font-extrabold leading-6 text-[#281036]">
                      {item.title}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  </motion.article>
                );
              })}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-12 overflow-hidden rounded-[36px] border border-purple-100 bg-white p-6 shadow-[0_20px_55px_rgba(62,25,83,0.08)] sm:p-8 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-[#702a96] text-white">
                <ShieldCheck size={24} aria-hidden="true" />
              </div>

              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                Environment priorities
              </p>

              <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036]">
                Organised for comfort, learning and supervision
              </h3>

              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                The physical environment works together with the daily routine
                to help children understand where they are, what they are doing
                and what comes next.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              {environmentPriorities.map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.4,
                    delay: index * 0.04,
                  }}
                  className="flex items-start gap-2.5 rounded-[20px] border border-purple-100 bg-[#fffaf2] p-3 sm:gap-3 sm:rounded-[22px] sm:p-4"
                >
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#4b245c]">
                    <CheckCircle2
                      size={16}
                      strokeWidth={2.7}
                      aria-hidden="true"
                    />
                  </div>

                  <p className="text-sm font-semibold leading-6 text-[#3d2a43]">
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mt-8 flex items-start gap-4 rounded-[28px] bg-[#2d1636] p-6 text-white shadow-[0_20px_55px_rgba(45,22,54,0.18)] sm:p-7"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[17px] bg-yellow-300 text-[#281036]">
            <BookOpenCheck size={22} aria-hidden="true" />
          </div>

          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-yellow-300">
              A practical learning environment
            </p>

            <p className="mt-2 max-w-4xl text-lg font-bold leading-8 text-purple-50">
              Children are not expected to remain seated throughout the day.
              Learning happens through conversation, movement, guided
              activities, play and participation across different spaces.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}


