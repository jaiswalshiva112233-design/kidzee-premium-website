import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import { CTA } from "@/components/HomeSections";
import { programmes } from "@/lib/site";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  MessageCircle,
  Music2,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Speech,
  Users,
} from "lucide-react";

type ProgrammePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ProgrammeDetail = {
  heroIntro: string;
  overview: string[];
  developmentAreas: {
    icon: typeof Brain;
    title: string;
    description: string;
  }[];
  routine: {
    title: string;
    description: string;
  }[];
  parentExpectations: string[];
  faqs: {
    question: string;
    answer: string;
  }[];
};

const programmeDetails: Record<string, ProgrammeDetail> = {
  playgroup: {
    heroIntro:
      "A gentle introduction to preschool life where children learn to feel comfortable, communicate, explore and participate in a warm classroom environment.",
    overview: [
      "The Playgroup programme is designed for children between 2 and 3 years of age who are beginning their first structured learning experience outside home.",
      "At this stage, the focus is not on formal academics. Children learn through movement, conversation, stories, songs, sensory exploration, play and simple classroom routines.",
      "Teachers support children as they become more comfortable with separation, learn to follow short instructions, communicate their needs and participate alongside other children.",
    ],
    developmentAreas: [
      {
        icon: Speech,
        title: "Language and expression",
        description:
          "Songs, stories, naming activities and daily conversation help children begin expressing themselves more clearly.",
      },
      {
        icon: Users,
        title: "Social confidence",
        description:
          "Children gradually learn to sit together, take turns, share materials and participate in group experiences.",
      },
      {
        icon: Palette,
        title: "Sensory exploration",
        description:
          "Colours, textures, shapes, sounds and hands-on materials encourage curiosity and early understanding.",
      },
      {
        icon: Sparkles,
        title: "Independence",
        description:
          "Simple routines help children become more comfortable with belongings, meals, transitions and personal tasks.",
      },
    ],
    routine: [
      {
        title: "Warm welcome and settling",
        description:
          "Children are greeted gently and given time to settle into the classroom environment.",
      },
      {
        title: "Circle time and conversation",
        description:
          "Short songs, greetings, rhymes and familiar discussions help children participate together.",
      },
      {
        title: "Hands-on learning",
        description:
          "Children explore colours, shapes, sounds, objects, matching and simple concepts through play.",
      },
      {
        title: "Movement and free play",
        description:
          "Active play supports balance, coordination, confidence and healthy physical development.",
      },
      {
        title: "Story and creative time",
        description:
          "Stories, music, drawing and simple art experiences encourage imagination and expression.",
      },
    ],
    parentExpectations: [
      "A gradual settling process",
      "Improved comfort away from home",
      "Better communication of everyday needs",
      "Growing participation in group routines",
      "Early friendship and sharing skills",
      "More confidence in classroom transitions",
    ],
    faqs: [
      {
        question: "What is the age group for Playgroup?",
        answer:
          "The Playgroup programme is designed for children between 2 and 3 years of age.",
      },
      {
        question: "What if my child has never attended preschool before?",
        answer:
          "That is completely normal. The programme is designed as a gentle introduction to preschool life, and teachers support children through the settling process.",
      },
      {
        question: "Is formal writing taught in Playgroup?",
        answer:
          "The programme focuses mainly on readiness, language, movement, sensory learning and early classroom habits rather than formal written work.",
      },
      {
        question: "Is a trial available?",
        answer:
          "Yes. A three-day trial is available so parents and children can experience the classroom environment before regular admission.",
      },
    ],
  },

  nursery: {
    heroIntro:
      "A lively and structured programme that builds early literacy, numeracy, communication, independence and curiosity through purposeful play.",
    overview: [
      "The Nursery programme is designed for children between 3 and 4 years of age who are ready for more structured classroom participation.",
      "Children begin developing early literacy and numeracy foundations while continuing to learn through stories, games, movement, conversation and hands-on activities.",
      "The programme also supports independence, confidence, attention, social skills and the ability to express ideas in a group.",
    ],
    developmentAreas: [
      {
        icon: BookOpen,
        title: "Early literacy",
        description:
          "Children develop listening, vocabulary, sound awareness, picture reading and early pre-writing readiness.",
      },
      {
        icon: Brain,
        title: "Early numeracy",
        description:
          "Counting, sorting, matching, patterns, comparisons and number readiness are introduced through practical activities.",
      },
      {
        icon: Speech,
        title: "Communication",
        description:
          "Conversation, storytelling, recitation and show-and-tell help children speak with greater confidence.",
      },
      {
        icon: HeartHandshake,
        title: "Social development",
        description:
          "Children learn cooperation, turn-taking, classroom responsibility and respectful interaction.",
      },
    ],
    routine: [
      {
        title: "Welcome and conversation",
        description:
          "Children begin with greetings, conversation and an introduction to the day’s learning.",
      },
      {
        title: "Concept learning",
        description:
          "Language, numbers, general awareness and early concepts are introduced through engaging activities.",
      },
      {
        title: "Creative expression",
        description:
          "Art, craft, music and role play give children opportunities to express ideas in different ways.",
      },
      {
        title: "Movement and outdoor play",
        description:
          "Physical activity supports coordination, confidence, balance and healthy energy release.",
      },
      {
        title: "Storytelling and reflection",
        description:
          "Stories and classroom discussion help children build imagination, listening and understanding.",
      },
    ],
    parentExpectations: [
      "Stronger vocabulary and communication",
      "Improved classroom participation",
      "Better pencil and fine-motor readiness",
      "Early counting and concept understanding",
      "Growing independence",
      "More confident social interaction",
    ],
    faqs: [
      {
        question: "What is the age group for Nursery?",
        answer:
          "The Nursery programme is designed for children between 3 and 4 years of age.",
      },
      {
        question: "Does Nursery include reading and writing?",
        answer:
          "Nursery introduces early literacy, sound awareness, picture reading, vocabulary and pre-writing readiness in an age-appropriate way.",
      },
      {
        question: "How are numbers taught?",
        answer:
          "Children learn counting, matching, sorting, patterns, comparison and number readiness through practical activities and classroom games.",
      },
      {
        question: "Is a three-day trial available?",
        answer:
          "Yes. Parents may book a three-day trial to help the child experience the teachers, classroom and routine.",
      },
    ],
  },

  "junior-kg": {
    heroIntro:
      "A strong school-readiness programme that develops literacy, numeracy, communication, thinking skills and independent classroom habits.",
    overview: [
      "The Junior KG programme is designed for children between 4 and 5 years of age.",
      "At this stage, children move towards stronger academic readiness while continuing to learn through meaningful activities, conversation, stories, projects and play.",
      "The programme supports phonics, early reading, writing readiness, number concepts, general awareness, problem-solving, communication and confidence.",
    ],
    developmentAreas: [
      {
        icon: BookOpen,
        title: "Reading readiness",
        description:
          "Phonics, sound recognition, vocabulary and early word-building support the beginning stages of reading.",
      },
      {
        icon: Palette,
        title: "Writing readiness",
        description:
          "Fine-motor work, patterns, tracing and guided writing help children develop control and confidence.",
      },
      {
        icon: Brain,
        title: "Numeracy and reasoning",
        description:
          "Children work with numbers, quantities, patterns, comparisons, sequencing and simple problem-solving.",
      },
      {
        icon: Speech,
        title: "Expression and confidence",
        description:
          "Presentations, storytelling and classroom discussion encourage children to organise and express ideas.",
      },
    ],
    routine: [
      {
        title: "Morning conversation",
        description:
          "Children discuss the day, share ideas and build confidence speaking in a group.",
      },
      {
        title: "Literacy development",
        description:
          "Phonics, vocabulary, picture reading, word-building and writing readiness form part of the routine.",
      },
      {
        title: "Numeracy and concepts",
        description:
          "Numbers, patterns, sequencing, comparisons and reasoning are explored through practical tasks.",
      },
      {
        title: "Projects and creativity",
        description:
          "Art, craft, themes and simple projects help children connect ideas across subjects.",
      },
      {
        title: "Movement and enrichment",
        description:
          "Dance, yoga, taekwondo and active play support physical confidence and overall development.",
      },
    ],
    parentExpectations: [
      "Improved phonics and sound recognition",
      "Better pencil control and writing readiness",
      "Stronger number understanding",
      "More independent classroom work",
      "Greater confidence in speaking",
      "Improved attention and task completion",
    ],
    faqs: [
      {
        question: "What is the age group for Junior KG?",
        answer:
          "The Junior KG programme is designed for children between 4 and 5 years of age.",
      },
      {
        question: "Does Junior KG prepare children for formal school?",
        answer:
          "Yes. The programme develops literacy, numeracy, communication, independence and classroom habits needed for the next stage of schooling.",
      },
      {
        question: "Are phonics included?",
        answer:
          "Yes. Children are introduced to phonics, sound recognition, vocabulary and early word-building in an age-appropriate sequence.",
      },
      {
        question: "What is the teacher-child ratio?",
        answer:
          "The Junior KG programme follows a teacher-child ratio of approximately 1:10.",
      },
    ],
  },

  "senior-kg": {
    heroIntro:
      "A comprehensive school-readiness programme that strengthens reading, writing, numeracy, reasoning, communication and independent learning.",
    overview: [
      "The Senior KG programme is designed for children between 5 and 6 years of age.",
      "Children build on the foundations developed in earlier years and prepare for a smooth transition into formal school.",
      "The programme focuses on reading, writing, number fluency, concept understanding, reasoning, communication, general awareness and responsible classroom behaviour.",
    ],
    developmentAreas: [
      {
        icon: BookOpen,
        title: "Reading and comprehension",
        description:
          "Children strengthen phonics, word reading, sentence understanding and early comprehension skills.",
      },
      {
        icon: Speech,
        title: "Writing and expression",
        description:
          "Guided writing, sentence formation and oral expression help children communicate ideas clearly.",
      },
      {
        icon: Brain,
        title: "Mathematical thinking",
        description:
          "Number operations, patterns, sequencing, comparison and practical problem-solving build confidence.",
      },
      {
        icon: ShieldCheck,
        title: "School readiness",
        description:
          "Independent work habits, attention, responsibility and classroom discipline prepare children for formal school.",
      },
    ],
    routine: [
      {
        title: "Language and reading",
        description:
          "Children practise phonics, word reading, sentence work, comprehension and vocabulary development.",
      },
      {
        title: "Writing and communication",
        description:
          "Structured writing and speaking activities help children express ideas with greater clarity.",
      },
      {
        title: "Numeracy and reasoning",
        description:
          "Children strengthen number concepts, operations, patterns and problem-solving.",
      },
      {
        title: "General awareness",
        description:
          "Themes, discussions and projects help children understand the world around them.",
      },
      {
        title: "Confidence and independence",
        description:
          "Children are encouraged to complete tasks, manage materials and participate responsibly.",
      },
    ],
    parentExpectations: [
      "Stronger reading confidence",
      "Improved sentence formation",
      "Better number fluency",
      "Greater independence in class",
      "Improved attention and responsibility",
      "A smoother transition to formal school",
    ],
    faqs: [
      {
        question: "What is the age group for Senior KG?",
        answer:
          "The Senior KG programme is designed for children between 5 and 6 years of age.",
      },
      {
        question: "How does Senior KG prepare children for Grade 1?",
        answer:
          "Children strengthen reading, writing, mathematics, general awareness, communication and independent classroom habits.",
      },
      {
        question: "Does the programme include homework?",
        answer:
          "Children may receive age-appropriate revision or practice work to reinforce classroom learning and build responsibility.",
      },
      {
        question: "What is the teacher-child ratio?",
        answer:
          "The Senior KG programme follows a teacher-child ratio of approximately 1:10.",
      },
    ],
  },
};

function getProgrammeDetail(slug: string, title: string): ProgrammeDetail {
  return (
    programmeDetails[slug] ?? {
      heroIntro: `An age-appropriate early learning programme designed to support children’s confidence, communication, curiosity and school readiness.`,
      overview: [
        `The ${title} programme combines guided learning with play, movement, conversation and creative experiences.`,
        "Children learn through a balanced routine that supports academic foundations, communication, independence and social development.",
        "Teachers provide age-appropriate guidance while allowing children to explore ideas and participate actively.",
      ],
      developmentAreas: [
        {
          icon: BookOpen,
          title: "Learning foundations",
          description:
            "Language, literacy, numeracy and concept development are introduced through engaging classroom experiences.",
        },
        {
          icon: Speech,
          title: "Communication",
          description:
            "Stories, conversation and group participation help children express ideas with confidence.",
        },
        {
          icon: Palette,
          title: "Creativity",
          description:
            "Art, music, movement and hands-on activities encourage imagination and self-expression.",
        },
        {
          icon: Users,
          title: "Social development",
          description:
            "Children learn to cooperate, participate, share and build positive relationships.",
        },
      ],
      routine: [
        {
          title: "Welcome and circle time",
          description:
            "Children begin with conversation, songs and an introduction to the day.",
        },
        {
          title: "Guided learning",
          description:
            "Age-appropriate concepts are explored through stories, games and practical activities.",
        },
        {
          title: "Creative activities",
          description:
            "Art, music, movement and role play help children express themselves.",
        },
        {
          title: "Play and exploration",
          description:
            "Active and free play support physical, social and emotional development.",
        },
      ],
      parentExpectations: [
        "Age-appropriate learning",
        "Better communication",
        "Improved confidence",
        "Growing independence",
        "Positive classroom habits",
        "Social interaction",
      ],
      faqs: [
        {
          question: `Who is the ${title} programme for?`,
          answer:
            "The programme is designed for children within the age range shown on this page.",
        },
        {
          question: "Is a trial available?",
          answer:
            "Yes. A three-day trial is available, subject to current seat and classroom availability.",
        },
      ],
    }
  );
}

export function generateStaticParams() {
  return programmes.map((programme) => ({
    slug: programme.slug,
  }));
}

export async function generateMetadata({
  params,
}: ProgrammePageProps): Promise<Metadata> {
  const { slug } = await params;
  const programme = programmes.find((item) => item.slug === slug);

  if (!programme) {
    return {};
  }

  return {
    title: `${programme.title} Programme in Sector 12 Dwarka`,
    description: `${programme.intro} Learn about the ${programme.title} programme at Kidzee Sector 12, Dwarka, including learning goals, routine, age group and trial availability.`,
    keywords: [
      `${programme.title} in Dwarka`,
      `${programme.title} Sector 12 Dwarka`,
      `${programme.title} Kidzee Dwarka`,
      `preschool programme Dwarka`,
      `Kidzee Sector 12 programme`,
      `${programme.age} preschool Dwarka`,
    ],
    alternates: {
      canonical: `/programmes/${programme.slug}`,
    },
    openGraph: {
      title: `${programme.title} at Kidzee Sector 12, Dwarka`,
      description: programme.intro,
      url: `/programmes/${programme.slug}`,
      type: "website",
      images: [
        {
          url: programme.image,
          width: 1200,
          height: 630,
          alt: `${programme.title} classroom activity at Kidzee Sector 12 Dwarka`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${programme.title} at Kidzee Sector 12, Dwarka`,
      description: programme.intro,
      images: [programme.image],
    },
  };
}

export default async function ProgrammePage({
  params,
}: ProgrammePageProps) {
  const { slug } = await params;
  const programme = programmes.find((item) => item.slug === slug);

  if (!programme) {
    notFound();
  }

  const detail = getProgrammeDetail(programme.slug, programme.title);
  const programmeIndex = programmes.findIndex(
    (item) => item.slug === programme.slug,
  );

  const relatedProgrammes = programmes.filter(
    (item) => item.slug !== programme.slug,
  );

  const ratio =
    programme.slug === "playgroup" || programme.slug === "nursery"
      ? "1:8 teacher-child ratio"
      : "1:10 teacher-child ratio";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${programme.title} Programme`,
    description: programme.intro,
    provider: {
      "@type": "Preschool",
      name: "Kidzee Preschool & Daycare, Sector 12 Dwarka",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Building No. 19, Block B, Sector 12B",
        addressLocality: "Dwarka",
        addressRegion: "Delhi",
        addressCountry: "IN",
      },
      telephone: "+91 96670 38673",
    },
  };

  return (
    <PageShell>
      <main className="overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />

        {/* Hero */}
        <section className="relative bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_54%,#fff7d7_100%)] pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />

          <div className="container relative">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div>
                <span className="eyebrow">{programme.age}</span>

                <h1 className="title mt-5">
                  {programme.title} at Kidzee Sector 12, Dwarka
                </h1>

                <p className="lead mt-6 max-w-2xl">
                  {detail.heroIntro}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={`https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20enquire%20about%20the%20${encodeURIComponent(
                      programme.title,
                    )}%20programme.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-purple-700/20 transition hover:-translate-y-0.5 hover:bg-purple-800"
                  >
                    <MessageCircle size={18} />
                    Enquire About {programme.title}
                  </a>

                  <a
                    href="tel:+919667038673"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:border-purple-300 hover:bg-purple-50"
                  >
                    <Phone size={18} />
                    Call the Centre
                  </a>
                </div>

                <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
                  {[
                    `Age group: ${programme.age}`,
                    `Timing: ${programme.time}`,
                    ratio,
                    "3-day trial available",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-white/90 px-4 py-3 shadow-sm"
                    >
                      <CheckCircle2
                        size={18}
                        className="shrink-0 text-purple-700"
                      />

                      <span className="text-sm font-bold text-slate-700">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 -top-6 h-24 w-24 rounded-[30px] bg-yellow-300/60" />
                <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-purple-300/30" />

                <div className="relative overflow-hidden rounded-[38px] border-8 border-white bg-white shadow-2xl shadow-purple-950/10">
                  <Image
                    src={programme.image}
                    alt={`${programme.title} classroom activity at Kidzee Sector 12 Dwarka`}
                    width={900}
                    height={760}
                    priority
                    className="h-[470px] w-full object-cover sm:h-[570px]"
                  />

                  <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/60 bg-white/90 p-5 shadow-xl backdrop-blur">
                    <p className="text-sm font-black text-purple-800">
                      Learning planned for {programme.age}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Age-appropriate activities, classroom routines and
                      personal guidance for each stage of development.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Information */}
        <section className="relative z-10 -mt-3 bg-white pb-8 sm:-mt-5">
          <div className="container">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: Clock3,
                  title: programme.time,
                  description: "Regular programme timing",
                },
                {
                  icon: Users,
                  title: ratio,
                  description: "Focused classroom attention",
                },
                {
                  icon: ShieldCheck,
                  title: "Safe environment",
                  description: "Child-friendly supervised spaces",
                },
                {
                  icon: Sparkles,
                  title: "3-day trial",
                  description: "Experience the classroom first",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-lg shadow-purple-950/5"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                      <Icon size={23} />
                    </span>

                    <h2 className="mt-5 text-lg font-black text-slate-950">
                      {item.title}
                    </h2>

                    <p className="mt-2 text-sm leading-7 text-slate-600">
                      {item.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Programme Overview */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <span className="eyebrow">Programme overview</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Learning designed for this important stage.
                </h2>

                <div className="mt-6 space-y-5">
                  {detail.overview.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base leading-8 text-slate-600 sm:text-lg"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="mt-8 rounded-[28px] border border-yellow-200 bg-[#fff9e7] p-6">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-purple-800">
                    Meals included
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
                    Preschool meals are included in the monthly fee, helping
                    children follow a comfortable and consistent morning
                    routine.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                {detail.developmentAreas.map((area) => {
                  const Icon = area.icon;

                  return (
                    <article
                      key={area.title}
                      className="rounded-[30px] border border-purple-100 bg-[#faf8ff] p-7 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl hover:shadow-purple-950/5"
                    >
                      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                        <Icon size={26} strokeWidth={1.8} />
                      </span>

                      <h3 className="mt-6 text-xl font-black text-slate-950">
                        {area.title}
                      </h3>

                      <p className="mt-3 text-sm leading-7 text-slate-600">
                        {area.description}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Daily Routine */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">A balanced classroom day</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                A predictable routine with room to explore.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                The exact sequence may change according to the day’s theme, but
                children experience a balanced mix of conversation, guided
                learning, creativity, movement and play.
              </p>
            </div>

            <div className="mx-auto mt-12 max-w-5xl">
              {detail.routine.map((item, index) => (
                <div
                  key={item.title}
                  className="relative grid gap-5 pb-8 last:pb-0 sm:grid-cols-[64px_1fr]"
                >
                  {index !== detail.routine.length - 1 && (
                    <span className="absolute left-7 top-14 hidden h-[calc(100%-1rem)] w-px bg-purple-200 sm:block" />
                  )}

                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-700 text-lg font-black text-white shadow-lg shadow-purple-700/15">
                    {index + 1}
                  </span>

                  <article className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-sm">
                    <h3 className="text-xl font-black text-slate-950">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                      {item.description}
                    </p>
                  </article>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Parent Expectations */}
        <section className="section bg-purple-950 text-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
              <div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                  What parents may notice
                </span>

                <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  Progress that develops gradually through everyday practice.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
                  Every child develops at a different pace. Teachers focus on
                  consistent participation, growing confidence and steady
                  improvement rather than comparing one child with another.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {detail.parentExpectations.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4"
                    >
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-yellow-300"
                      />

                      <span className="text-sm font-bold text-white">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[36px] border border-white/15 bg-white/10 p-7 backdrop-blur sm:p-9">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-purple-950">
                  <HeartHandshake size={28} />
                </span>

                <h3 className="mt-6 text-2xl font-black">
                  Parents and teachers working together
                </h3>

                <p className="mt-4 text-sm leading-7 text-purple-100 sm:text-base">
                  Parents can share information about the child’s routine,
                  interests, comfort needs and previous school experience. This
                  helps teachers understand the child more personally.
                </p>

                <div className="mt-7 rounded-[24px] border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-black text-yellow-300">
                    Parent-teacher communication
                  </p>

                  <p className="mt-2 text-sm leading-7 text-purple-100">
                    Regular interaction helps families understand classroom
                    progress and support learning at home without unnecessary
                    pressure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trial Section */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="relative overflow-hidden rounded-[36px]">
                <Image
                  src="/images/programmes/programme-trial.jpg"
                  alt={`Three-day trial for the ${programme.title} programme at Kidzee Dwarka`}
                  width={900}
                  height={700}
                  className="h-[430px] w-full object-cover sm:h-[520px]"
                />

                <div className="absolute inset-x-5 bottom-5 rounded-[24px] bg-white/90 p-5 shadow-xl backdrop-blur">
                  <p className="text-sm font-black text-purple-800">
                    Three-day preschool trial
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Let your child experience the classroom routine, teachers
                    and environment before regular admission.
                  </p>
                </div>
              </div>

              <div>
                <span className="eyebrow">Experience the programme first</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  A trial can make the admission decision easier.
                </h2>

                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                  A school brochure can explain the programme, but a trial lets
                  you observe how your child responds to the teachers,
                  classroom routine and environment.
                </p>

                <ul className="mt-7 grid gap-4">
                  {[
                    "Three trial days",
                    "Approximately two hours per day",
                    "Experience the regular classroom environment",
                    "Meet the teachers",
                    "Observe your child’s comfort and participation",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-[#faf8ff] px-5 py-4"
                    >
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-purple-700"
                      />
                      <span className="text-sm font-bold text-slate-700">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href={`https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20book%20a%203-day%20trial%20for%20the%20${encodeURIComponent(
                    programme.title,
                  )}%20programme.`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white transition hover:bg-purple-800"
                >
                  Book a 3-Day Trial
                  <ArrowRight size={17} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Related Programmes */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Explore all programmes</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Find the programme that matches your child’s age.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {relatedProgrammes.map((item) => (
                <article
                  key={item.slug}
                  className="group overflow-hidden rounded-[30px] border border-purple-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/5"
                >
                  <div className="overflow-hidden">
                    <Image
                      src={item.image}
                      alt={`${item.title} programme at Kidzee Dwarka`}
                      width={700}
                      height={500}
                      className="h-56 w-full object-cover transition duration-700 group-hover:scale-[1.04]"
                    />
                  </div>

                  <div className="p-6">
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-purple-700">
                      {item.age}
                    </span>

                    <h3 className="mt-3 text-2xl font-black text-slate-950">
                      {item.title}
                    </h3>

                    <p className="mt-3 line-clamp-3 text-sm leading-7 text-slate-600">
                      {item.intro}
                    </p>

                    <Link
                      href={`/programmes/${item.slug}`}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-black text-purple-700 transition hover:text-purple-900"
                    >
                      Explore {item.title}
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/programmes"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:bg-purple-50"
              >
                View All Programmes
                <ArrowRight size={17} />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section bg-white">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">{programme.title} questions</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Helpful information for parents.
              </h2>
            </div>

            <div className="mx-auto mt-12 max-w-4xl space-y-4">
              {detail.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-[24px] border border-purple-100 bg-[#faf8ff] p-6 shadow-sm open:bg-white open:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5">
                    <h3 className="text-left text-base font-black text-slate-950 sm:text-lg">
                      {faq.question}
                    </h3>

                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xl font-black text-purple-800 transition group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-4 border-t border-purple-100 pt-4 text-sm leading-7 text-slate-600 sm:text-base">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final Programme CTA */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#5b2a86_0%,#3b145f_100%)] px-7 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    {programme.title} admissions
                  </span>

                  <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                    Visit the centre and understand the programme personally.
                  </h2>

                  <p className="mt-4 max-w-2xl text-base leading-8 text-purple-100">
                    Meet the teachers, explore the classroom and discuss your
                    child’s age, readiness and current seat availability.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yellow-300 px-7 py-3.5 text-sm font-black text-purple-950 transition hover:bg-yellow-200"
                  >
                    Book a School Visit
                    <ArrowRight size={17} />
                  </Link>

                  <a
                    href={`https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20please%20share%20the%20admission%20details%20for%20the%20${encodeURIComponent(
                      programme.title,
                    )}%20programme.`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    <MessageCircle size={17} />
                    Ask on WhatsApp
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <CTA />
      </main>
    </PageShell>
  );
}