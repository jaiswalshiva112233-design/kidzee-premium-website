"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Blocks,
  Palette,
  Baby,
  CookingPot,
  Sun,
} from "lucide-react";

const campusShowcase = [
  {
    title: "Bright & Inspiring Classrooms",
    subtitle: "Where curiosity begins every morning",
    description:
      "Every classroom is thoughtfully arranged to encourage confidence, conversation, creativity and joyful participation through age-appropriate learning experiences.",
    image: "/images/about/facilities-classroom.jpg",
    icon: Sun,
    badge: "Learning Spaces",
  },

  {
    title: "Indoor Play Zone",
    subtitle: "Movement that builds confidence",
    description:
      "Children enjoy supervised physical play that strengthens balance, coordination, teamwork and social interaction in a safe environment.",
    image: "/images/about/facilities-indoor-play.jpg",
    icon: Blocks,
    badge: "Active Play",
  },

  {
    title: "Creative Exploration",
    subtitle: "Imagination comes alive",
    description:
      "Art, storytelling, music, pretend play and hands-on activities encourage children to express themselves naturally every day.",
    image: "/images/about/facilities-activity.jpg",
    icon: Palette,
    badge: "Creative Corner",
  },

  {
    title: "Comfortable Daycare",
    subtitle: "A caring extension of home",
    description:
      "Our daycare spaces support meals, supervised routines, quiet rest, guided homework and meaningful play throughout the day.",
    image: "/images/about/facilities-daycare.jpg",
    icon: Baby,
    badge: "Daycare",
  },
];

const highlights = [
  {
    icon: ShieldCheck,
    title: "Secure Environment",
    text:
      "Thoughtfully supervised spaces help children explore confidently throughout the day.",
  },

  {
    icon: Camera,
    title: "CCTV Coverage",
    text:
      "Campus-wide surveillance strengthens everyday supervision and parent confidence.",
  },

  {
    icon: CookingPot,
    title: "Healthy Daily Routine",
    text:
      "Meal times, hygiene practices and organised classroom routines are part of every child's day.",
  },

  {
    icon: CheckCircle2,
    title: "Purposeful Spaces",
    text:
      "Learning, creativity, active play and relaxation each have dedicated environments.",
  },
];

const priorities = [
  "Age-appropriate classrooms",
  "Indoor & outdoor play opportunities",
  "Dedicated daycare environment",
  "Creative learning experiences",
  "Healthy routines & hygiene",
  "Comfortable daily transitions",
];

export default function AboutFacilities() {
  return (
    <section
      className="relative overflow-hidden bg-gradient-to-b from-[#fffdf8] via-[#fff8ef] to-[#fffaf6] py-24 lg:py-32"
      aria-labelledby="facilities-heading"
    >
      {/* Decorative Background */}

      <div
        aria-hidden
        className="absolute -left-48 top-24 h-[420px] w-[420px] rounded-full bg-purple-100/60 blur-[130px]"
      />

      <div
        aria-hidden
        className="absolute right-[-120px] top-1/3 h-[360px] w-[360px] rounded-full bg-yellow-100 blur-[120px]"
      />

      <div className="relative mx-auto max-w-[1500px] px-5 sm:px-8 xl:px-10">

        {/* Heading */}

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: .7 }}
          className="mx-auto max-w-4xl text-center"
        >

          <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white px-5 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#702a96] shadow-sm">

            <Sparkles size={15} />

            Discover Our Campus

          </div>

          <h2
            id="facilities-heading"
            className="mt-7 text-4xl font-extrabold leading-tight tracking-[-0.04em] text-[#281036] sm:text-5xl lg:text-[62px]"
          >
            Spaces thoughtfully created for
            <span className="block text-[#702a96]">
              learning, play and growing together
            </span>
          </h2>

          <p className="mx-auto mt-7 max-w-3xl text-lg leading-8 text-slate-600">
            Every part of our preschool has been designed around how young
            children naturally learn, explore and interact. From bright
            classrooms to engaging play spaces and caring daycare
            environments, each area supports a safe, joyful and meaningful
            day at Kidzee Sector 12, Dwarka.
          </p>

        </motion.div>

        {/* =======================================================
            Editorial Hero Image
        ======================================================= */}

        <motion.div
          initial={{ opacity:0, y:30 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }}
          transition={{ duration:.75 }}
          className="relative mt-20"
        >

          <div className="overflow-hidden rounded-[42px] border-[10px] border-white shadow-[0_35px_90px_rgba(42,18,56,.16)]">

            <div className="relative aspect-[16/8]">

              <Image
                src={campusShowcase[0].image}
                alt="Bright classrooms at Kidzee Preschool and Daycare Sector 12 Dwarka"
                fill
                priority
                className="object-cover transition duration-700 hover:scale-[1.03]"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#23112d]/85 via-[#23112d]/15 to-transparent" />

            </div>

          </div>

          {/* Floating Story Card */}

          <motion.div
            initial={{ opacity:0, y:20 }}
            whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }}
            transition={{ delay:.25 }}
            className="relative mx-auto -mt-16 max-w-xl rounded-[34px] border border-white/60 bg-white/90 p-8 shadow-[0_25px_60px_rgba(35,18,46,.15)] backdrop-blur-xl"
          >

            <div className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#702a96]">

              <Sun size={15}/>

              Bright Learning Spaces

            </div>

            <h3 className="mt-5 text-3xl font-extrabold text-[#281036]">
              A place where children feel excited to learn every day.
            </h3>

            <p className="mt-4 leading-8 text-slate-600">
              Spacious classrooms, engaging learning materials and a welcoming
              atmosphere encourage children to explore with confidence while
              enjoying every moment of their preschool journey.
            </p>

          </motion.div>
                  {/* =======================================================
            Editorial Campus Layout
        ======================================================= */}

        <div className="mt-24 grid gap-8 lg:grid-cols-12">

          {/* Indoor Play */}

          <motion.article
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: .6 }}
            whileHover={{ y: -6 }}
            className="group lg:col-span-7"
          >

            <div className="overflow-hidden rounded-[36px] border-[8px] border-white bg-white shadow-[0_30px_80px_rgba(45,22,54,.12)]">

              <div className="relative aspect-[16/10] overflow-hidden">

                <Image
                  src={campusShowcase[1].image}
                  alt={campusShowcase[1].title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#24112d]/80 via-transparent to-transparent"/>

                <div className="absolute left-7 top-7 rounded-full bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#702a96] backdrop-blur">

                  {campusShowcase[1].badge}

                </div>

              </div>

              <div className="p-8">

                <div className="flex items-center gap-4">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-[#702a96]">

                    <Blocks size={24}/>

                  </div>

                  <div>

                    <h3 className="text-3xl font-extrabold text-[#281036]">

                      {campusShowcase[1].title}

                    </h3>

                    <p className="mt-1 text-[#702a96] font-semibold">

                      {campusShowcase[1].subtitle}

                    </p>

                  </div>

                </div>

                <p className="mt-6 leading-8 text-slate-600">

                  {campusShowcase[1].description}

                </p>

              </div>

            </div>

          </motion.article>

          {/* Creative Learning */}

          <motion.article
            initial={{ opacity:0, y:25 }}
            whileInView={{ opacity:1, y:0 }}
            viewport={{ once:true }}
            transition={{ delay:.1 }}
            whileHover={{ y:-6 }}
            className="group lg:col-span-5"
          >

            <div className="overflow-hidden rounded-[36px] border-[8px] border-white bg-white shadow-[0_28px_70px_rgba(45,22,54,.11)]">

              <div className="relative aspect-[4/5]">

                <Image
                  src={campusShowcase[2].image}
                  alt={campusShowcase[2].title}
                  fill
                  className="object-cover transition duration-700 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-[#24112d]/80 via-transparent to-transparent"/>

              </div>

              <div className="p-8">

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-200 text-[#281036]">

                  <Palette size={24}/>

                </div>

                <h3 className="mt-6 text-3xl font-extrabold text-[#281036]">

                  {campusShowcase[2].title}

                </h3>

                <p className="mt-2 font-semibold text-[#702a96]">

                  {campusShowcase[2].subtitle}

                </p>

                <p className="mt-6 leading-8 text-slate-600">

                  {campusShowcase[2].description}

                </p>

              </div>

            </div>

          </motion.article>

        </div>

        {/* =======================================================
            Full Width Daycare Story
        ======================================================= */}

        <motion.div
          initial={{ opacity:0, y:30 }}
          whileInView={{ opacity:1, y:0 }}
          viewport={{ once:true }}
          transition={{ duration:.7 }}
          className="mt-10"
        >

          <div className="grid overflow-hidden rounded-[42px] border-[8px] border-white bg-white shadow-[0_35px_90px_rgba(45,22,54,.14)] lg:grid-cols-2">

            <div className="relative min-h-[420px]">

              <Image
                src={campusShowcase[3].image}
                alt={campusShowcase[3].title}
                fill
                className="object-cover"
              />

            </div>

            <div className="flex flex-col justify-center p-10 lg:p-14">

              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#702a96]">

                <Baby size={15}/>

                Caring Beyond Preschool

              </div>

              <h3 className="mt-6 text-4xl font-extrabold leading-tight text-[#281036]">

                Comfortable spaces where children continue to feel safe, happy and cared for.

              </h3>

              <p className="mt-6 leading-8 text-slate-600">

                Our daycare environment has been planned to support children's routines through supervised play, meals, quiet time and meaningful engagement in a calm, caring atmosphere.

              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">

                {priorities.map((item) => (

                  <div
                    key={item}
                    className="flex items-start gap-3"
                  >

                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-yellow-300 text-[#281036]">

                      <CheckCircle2 size={15}/>

                    </div>

                    <span className="font-medium leading-7 text-slate-700">

                      {item}

                    </span>

                  </div>

                ))}

              </div>

            </div>

          </div>

        </motion.div>
                </motion.div>

        {/* =======================================================
            Why Parents Appreciate Our Campus
        ======================================================= */}

        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="relative mt-24 overflow-hidden rounded-[42px] bg-[#f1e8f8] px-6 py-12 sm:px-9 sm:py-14 lg:px-12 lg:py-16"
        >
          <div
            aria-hidden="true"
            className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-white/70 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -bottom-28 right-0 h-80 w-80 rounded-full bg-yellow-100/80 blur-3xl"
          />

          <div className="relative grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-xs font-extrabold uppercase tracking-[0.17em] text-[#702a96] shadow-sm backdrop-blur">
                <ShieldCheck size={16} aria-hidden="true" />
                Everyday reassurance
              </div>

              <h3 className="mt-6 text-3xl font-extrabold leading-tight tracking-[-0.035em] text-[#281036] sm:text-4xl lg:text-[46px]">
                Details that help children feel comfortable—and parents feel
                reassured
              </h3>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                A preschool environment is about more than attractive rooms.
                Parents notice how thoughtfully each space supports
                supervision, cleanliness, movement, learning and everyday
                comfort.
              </p>

              <div className="mt-8 flex items-center gap-4">
                <div className="flex -space-x-3">
                  {[Sun, Blocks, Palette, Baby].map((Icon, index) => (
                    <div
                      key={index}
                      className="flex h-11 w-11 items-center justify-center rounded-full border-4 border-[#f1e8f8] bg-white text-[#702a96] shadow-sm"
                    >
                      <Icon size={17} strokeWidth={2.2} aria-hidden="true" />
                    </div>
                  ))}
                </div>

                <p className="max-w-[230px] text-sm font-semibold leading-6 text-[#4d315b]">
                  Learning, movement, creativity and care thoughtfully brought
                  together.
                </p>
              </div>
            </div>

            <div className="relative">
              <div
                aria-hidden="true"
                className="absolute left-7 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-purple-300 via-purple-200 to-transparent sm:block"
              />

              <div className="space-y-4">
                {highlights.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <motion.article
                      key={item.title}
                      initial={{ opacity: 0, x: 18 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.25 }}
                      transition={{
                        duration: 0.5,
                        delay: index * 0.07,
                        ease: "easeOut",
                      }}
                      className={`group relative flex gap-5 rounded-[28px] border border-white/80 bg-white/75 p-5 shadow-[0_16px_45px_rgba(63,27,82,0.08)] backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_55px_rgba(63,27,82,0.13)] sm:p-6 ${
                        index % 2 === 1 ? "sm:ml-10" : ""
                      }`}
                    >
                      <div className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-[5px] border-[#f1e8f8] bg-[#702a96] text-white shadow-md transition duration-300 group-hover:scale-105 group-hover:bg-[#281036]">
                        <Icon
                          size={21}
                          strokeWidth={2.1}
                          aria-hidden="true"
                        />
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-extrabold tracking-[0.18em] text-purple-400">
                            0{index + 1}
                          </span>

                          <div className="h-px flex-1 bg-purple-100" />
                        </div>

                        <h4 className="mt-2 text-xl font-extrabold text-[#281036] sm:text-2xl">
                          {item.title}
                        </h4>

                        <p className="mt-2 text-sm leading-7 text-slate-600 sm:text-base">
                          {item.text}
                        </p>
                      </div>
                    </motion.article>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* =======================================================
            Campus Experience Statement
        ======================================================= */}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="mt-20 grid gap-8 border-y border-purple-100 py-12 sm:py-14 lg:grid-cols-[1fr_auto_1fr] lg:items-center"
        >
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.19em] text-[#702a96]">
              A thoughtful preschool environment
            </p>

            <h3 className="mt-4 max-w-xl text-3xl font-extrabold leading-tight tracking-[-0.035em] text-[#281036] sm:text-4xl">
              Each space has a clear purpose in your child&apos;s day.
            </h3>
          </div>

          <div
            aria-hidden="true"
            className="hidden h-28 w-px bg-gradient-to-b from-transparent via-purple-200 to-transparent lg:block"
          />

          <div className="lg:max-w-xl">
            <p className="text-base leading-8 text-slate-600 sm:text-lg">
              Children transition naturally between focused learning, active
              play, creative exploration, meals and rest. Our campus supports
              these moments in a way that feels organised without making the
              day feel rigid.
            </p>

            <Link
              href="/gallery"
              className="mt-6 inline-flex items-center gap-2 text-base font-extrabold text-[#702a96] transition duration-300 hover:gap-3 hover:text-[#281036]"
            >
              View real moments from our centre
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
                {/* =======================================================
            Premium Gallery CTA
        ======================================================= */}

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="mt-24 overflow-hidden rounded-[42px] bg-[#281036] shadow-[0_35px_90px_rgba(40,16,54,0.28)]"
        >
          <div className="relative px-8 py-14 sm:px-12 sm:py-16 lg:px-16 lg:py-20">

            <div
              aria-hidden="true"
              className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-purple-500/20 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="absolute right-0 bottom-0 h-80 w-80 rounded-full bg-yellow-300/10 blur-3xl"
            />

            <div className="relative mx-auto max-w-5xl text-center">

              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-2 text-xs font-extrabold uppercase tracking-[0.18em] text-yellow-300 backdrop-blur">

                <Camera size={16} />

                Explore Our Preschool

              </div>

              <h3 className="mt-7 text-4xl font-extrabold leading-tight tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl">

                See our learning spaces through
                <span className="block text-yellow-300">
                  real moments from everyday school life.
                </span>

              </h3>

              <p className="mx-auto mt-7 max-w-3xl text-lg leading-9 text-purple-100">

                Every classroom, play area and activity space has been created
                to help children feel secure, inspired and excited to learn.
                Browse our gallery to experience the environment that families
                see when they visit Kidzee Sector 12, Dwarka.

              </p>

              <div className="mt-10 flex flex-col justify-center gap-5 sm:flex-row">

                <Link
                  href="/gallery"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full bg-yellow-300 px-8 text-base font-bold text-[#281036] shadow-lg transition duration-300 hover:-translate-y-1 hover:bg-white"
                >
                  Explore Our Gallery
                  <ArrowRight size={19} />
                </Link>

                <Link
                  href="/contact"
                  className="inline-flex h-14 items-center justify-center gap-3 rounded-full border border-white/20 bg-white/10 px-8 text-base font-bold text-white backdrop-blur transition duration-300 hover:bg-white hover:text-[#281036]"
                >
                  Book a School Visit
                </Link>

              </div>

            </div>

          </div>

        </motion.div>

      </div>
    </section>
  );
}