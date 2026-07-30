"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import {
  Blocks,
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
      "Calm colours, natural light and familiar classroom layouts help children settle in and feel comfortable during the day.",
  },
  {
    icon: Blocks,
    title: "Defined learning areas",
    description:
      "Separate spaces for stories, early concepts, group work and hands-on activities make classroom routines easier to understand.",
  },
  {
    icon: ToyBrick,
    title: "Space to move and play",
    description:
      "Indoor play is part of the daily experience, giving children regular opportunities to develop coordination and confidence.",
  },
  {
    icon: Palette,
    title: "Room for creative expression",
    description:
      "Art, pretend play, music and sensory activities allow children to explore ideas in ways that feel natural and enjoyable.",
  },
];

const environmentPriorities = [
  "Child-sized furniture suited to young learners",
  "Learning materials kept within comfortable reach",
  "Clearly organised classroom and activity areas",
  "Comfortable spaces for active and quieter moments",
  "Regular cleaning and classroom organisation",
  "Supervised areas planned around children’s routines",
];

const transition = {
  duration: 0.65,
  ease: [0.22, 1, 0.36, 1] as const,
};

export default function AboutEnvironment() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section
      className="relative isolate overflow-hidden bg-[#fffaf2] py-20 sm:py-24 lg:py-28"
      aria-labelledby="about-environment-heading"
    >
      <div
        aria-hidden="true"
        className="absolute -left-40 bottom-0 -z-10 h-96 w-96 rounded-full bg-purple-100/70 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-40 top-16 -z-10 h-[28rem] w-[28rem] rounded-full bg-yellow-100/80 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <motion.header
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={
            shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
          }
          viewport={{ once: true, amount: 0.25 }}
          transition={transition}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96] shadow-sm">
            <Sparkles size={16} aria-hidden="true" />
            Our learning environment
          </div>

          <h2
            id="about-environment-heading"
            className="mt-6 text-balance text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[58px]"
          >
            A preschool space children can{" "}
            <span className="text-[#702a96]">
              understand, enjoy and grow into
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            Young children feel more secure when their surroundings are
            familiar and easy to navigate. At Kidzee Sector 12, Dwarka, each
            classroom and activity area is arranged to support the natural
            rhythm of a preschool day.
          </p>
        </motion.header>

        <div className="mt-14 grid items-center gap-14 lg:grid-cols-[1.06fr_0.94fr] lg:gap-20">
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: -28 }}
            whileInView={
              shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
            }
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
            className="relative mx-auto w-full max-w-[780px]"
          >
            <div className="grid gap-5 sm:grid-cols-[1.15fr_0.85fr]">
              <div className="relative overflow-hidden rounded-[34px] border-[7px] border-white bg-purple-50 shadow-[0_28px_75px_rgba(54,21,74,0.18)]">
                <div className="relative min-h-[500px] sm:min-h-[650px]">
                  <Image
                    src="/images/about/environment-main.jpg"
                    alt="Classroom at Kidzee Preschool Sector 12 Dwarka"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 35vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#25112e]/60 via-transparent to-transparent" />
                </div>

                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <div className="rounded-[24px] border border-white/30 bg-white/95 p-5 shadow-lg backdrop-blur-md">
                    <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-[#702a96]">
                      Easy to settle into
                    </p>

                    <p className="mt-2 text-xl font-extrabold leading-snug text-[#281036]">
                      A clear and familiar layout helps children become
                      comfortable with their daily routine.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5">
                <figure className="relative min-h-[250px] overflow-hidden rounded-[30px] border-[7px] border-white bg-purple-50 shadow-[0_20px_55px_rgba(54,21,74,0.14)] sm:min-h-0">
                  <Image
                    src="/images/about/environment-play.jpg"
                    alt="Indoor play area at Kidzee Sector 12 Dwarka"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 22vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#25112e]/65 via-transparent to-transparent" />

                  <figcaption className="absolute bottom-5 left-5 right-5 text-lg font-extrabold text-white">
                    Indoor play and movement
                  </figcaption>
                </figure>

                <figure className="relative min-h-[250px] overflow-hidden rounded-[30px] border-[7px] border-white bg-yellow-50 shadow-[0_20px_55px_rgba(54,21,74,0.14)] sm:min-h-0">
                  <Image
                    src="/images/about/environment-activity.jpg"
                    alt="Creative classroom activity at Kidzee Dwarka"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 40vw, 22vw"
                    className="object-cover"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-[#25112e]/65 via-transparent to-transparent" />

                  <figcaption className="absolute bottom-5 left-5 right-5 text-lg font-extrabold text-white">
                    Creative classroom experiences
                  </figcaption>
                </figure>
              </div>
            </div>

            <motion.div
              animate={
                shouldReduceMotion
                  ? undefined
                  : {
                      y: [0, -7, 0],
                    }
              }
              transition={
                shouldReduceMotion
                  ? undefined
                  : {
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
              }
              className="absolute -left-3 top-10 hidden rounded-[22px] border border-purple-100 bg-white px-5 py-4 shadow-[0_18px_45px_rgba(57,26,68,0.15)] sm:block"
              aria-hidden="true"
            >
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#702a96]">
                Made for young children
              </p>

              <p className="mt-1 text-lg font-extrabold text-[#281036]">
                Comfortable from the first day
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, x: 28 }}
            whileInView={
              shouldReduceMotion ? undefined : { opacity: 1, x: 0 }
            }
            viewport={{ once: true, amount: 0.2 }}
            transition={transition}
          >
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
              Planned around the preschool day
            </p>

            <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036] sm:text-4xl">
              Different moments need different kinds of spaces
            </h3>

            <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
              A preschool day moves between conversation, guided learning,
              creative work, energetic play and quieter moments. The environment
              should support each transition without making children feel
              rushed or overwhelmed.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {environmentFeatures.map((item, index) => {
                const Icon = item.icon;

                return (
                  <motion.article
                    key={item.title}
                    initial={
                      shouldReduceMotion ? false : { opacity: 0, y: 18 }
                    }
                    whileInView={
                      shouldReduceMotion
                        ? undefined
                        : { opacity: 1, y: 0 }
                    }
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{
                      ...transition,
                      duration: 0.5,
                      delay: shouldReduceMotion ? 0 : index * 0.05,
                    }}
                    whileHover={
                      shouldReduceMotion ? undefined : { y: -4 }
                    }
                    className="rounded-[26px] border border-purple-100 bg-white p-5 shadow-[0_12px_34px_rgba(62,25,83,0.06)] transition-[border-color,box-shadow] duration-300 hover:border-purple-200 hover:shadow-[0_18px_44px_rgba(62,25,83,0.1)]"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-[17px] bg-purple-100 text-[#702a96]">
                      <Icon
                        size={22}
                        strokeWidth={2.1}
                        aria-hidden="true"
                      />
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
          initial={shouldReduceMotion ? false : { opacity: 0, y: 22 }}
          whileInView={
            shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
          }
          viewport={{ once: true, amount: 0.2 }}
          transition={transition}
          className="mt-16 overflow-hidden rounded-[36px] border border-purple-100 bg-white p-7 shadow-[0_20px_55px_rgba(62,25,83,0.08)] sm:p-9 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-[19px] bg-[#702a96] text-white">
                <ShieldCheck size={24} aria-hidden="true" />
              </div>

              <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96]">
                What we pay attention to
              </p>

              <h3 className="mt-3 text-3xl font-extrabold leading-tight tracking-[-0.03em] text-[#281036]">
                Small details that make the day easier for children
              </h3>

              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                Furniture, materials and classroom routines are organised so
                that children gradually become more familiar, confident and
                independent within the preschool environment.
              </p>
            </div>

            <ul className="grid gap-4 sm:grid-cols-2">
              {environmentPriorities.map((item, index) => (
                <motion.li
                  key={item}
                  initial={
                    shouldReduceMotion ? false : { opacity: 0, y: 14 }
                  }
                  whileInView={
                    shouldReduceMotion
                      ? undefined
                      : { opacity: 1, y: 0 }
                  }
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{
                    duration: 0.45,
                    delay: shouldReduceMotion ? 0 : index * 0.04,
                  }}
                  className="flex items-start gap-3 rounded-[22px] border border-purple-100 bg-[#fffaf2] p-4"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[#4b245c]">
                    <CheckCircle2
                      size={16}
                      strokeWidth={2.7}
                      aria-hidden="true"
                    />
                  </span>

                  <span className="text-sm font-semibold leading-6 text-[#3d2a43]">
                    {item}
                  </span>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>

        <motion.aside
          initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
          whileInView={
            shouldReduceMotion ? undefined : { opacity: 1, y: 0 }
          }
          viewport={{ once: true, amount: 0.25 }}
          transition={transition}
          className="mt-8 rounded-[30px] bg-[#2d1636] p-7 text-center text-white shadow-[0_20px_55px_rgba(45,22,54,0.18)] sm:p-9"
          aria-label="How children use the learning environment"
        >
          <p className="text-xs font-extrabold uppercase tracking-[0.17em] text-yellow-300">
            Learning is active here
          </p>

          <p className="mx-auto mt-3 max-w-4xl text-balance text-xl font-extrabold leading-8 text-purple-50 sm:text-2xl">
            Children may be listening to a story in one moment, building
            something in the next and then moving into music, conversation or
            guided play.
          </p>
        </motion.aside>
      </div>
    </section>
  );
}