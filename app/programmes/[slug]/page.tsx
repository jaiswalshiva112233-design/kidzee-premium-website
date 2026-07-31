import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CheckCircle2,
  HeartHandshake,
  MessageCircle,
  Palette,
  Phone,
  ShieldCheck,
  Sparkles,
  Speech,
  Users,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import {
  createWhatsAppLink,
  programmes,
  site,
} from "@/lib/site";

type ProgrammePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ProgrammeDetail = {
  heroIntro: string;
  learningStyle: string;
  classroomExperience: string;
  readinessFocus: string;
  overview: string[];
  learningNote: {
    title: string;
    description: string;
  };
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
  suitabilityIntro: string;
  suitabilityPoints: string[];
  suitabilityNote: string;
  ctaEyebrow: string;
  ctaTitle: string;
  ctaDescription: string;
  faqs: {
    question: string;
    answer: string;
  }[];
};

const programmeDetails: Record<string, ProgrammeDetail> = {
  playgroup: {
    heroIntro:
      "A gentle introduction to preschool life where children learn to feel comfortable, communicate, explore and participate in a warm classroom environment.",

    learningStyle: "Play, movement and sensory exploration",

    classroomExperience: "Gentle routines with close teacher support",

    readinessFocus: "Comfort, communication and independence",

    overview: [
      "The Playgroup programme is designed for children between 2 and 3 years of age who are beginning their first structured learning experience outside home.",
      "At this stage, the focus is not on formal academics. Children learn through movement, conversation, stories, songs, sensory exploration, play and simple classroom routines.",
      "Teachers support children as they become more comfortable with separation, learn to follow short instructions, communicate their needs and participate alongside other children.",
    ],

    learningNote: {
      title: "Learning begins through everyday experiences",
      description:
        "Playgroup children learn through touching, moving, listening, observing, repeating and interacting. Activities are kept short, engaging and suitable for their developing attention span.",
    },

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
          "Simple routines help children become more comfortable with belongings, transitions and age-appropriate personal tasks.",
      },
    ],

    routine: [
      {
        title: "Warm welcome and settling",
        description:
          "Children are greeted gently and given time to become comfortable in the classroom.",
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
      "More confidence during classroom transitions",
    ],

    suitabilityIntro:
      "Playgroup may be a suitable starting point when your child is ready to experience a gentle routine outside home without the pressure of formal academics.",

    suitabilityPoints: [
      "This will be your child’s first preschool experience",
      "Your child is learning to spend short periods away from parents",
      "Your child communicates needs through words, gestures or expressions",
      "Your child enjoys music, movement, stories and sensory play",
      "Your child is beginning to notice and interact with other children",
      "You want a gradual introduction to classroom routines",
    ],

    suitabilityNote:
      "A child does not need to be fully independent before joining Playgroup. Settling, communication and classroom comfort develop gradually with patient support.",

    ctaEyebrow: "Beginning preschool",

    ctaTitle:
      "Help your child begin preschool with comfort and confidence.",

    ctaDescription:
      "Speak with our team about your child’s age, current routine and previous experience so we can guide you honestly about the Playgroup programme.",

    faqs: [
      {
        question: "What is the age group for Playgroup?",
        answer:
          "The Playgroup programme is designed for children between 2 and 3 years of age.",
      },
      {
        question: "What if my child has never attended preschool before?",
        answer:
          "That is completely normal. Playgroup is designed as a gentle introduction to preschool life, and teachers support children through the settling process.",
      },
      {
        question: "Is formal writing taught in Playgroup?",
        answer:
          "The programme focuses mainly on language, movement, sensory learning, coordination and early classroom habits rather than formal written work.",
      },
      {
        question: "What if my child takes time to settle?",
        answer:
          "Children settle at different speeds. Teachers use familiar routines, play, reassurance and gradual participation to help each child become comfortable.",
      },
    ],
  },

  nursery: {
    heroIntro:
      "A lively and structured programme that builds early literacy, numeracy, communication, independence and curiosity through purposeful play.",

    learningStyle: "Purposeful play with guided concept learning",

    classroomExperience: "Active participation and growing independence",

    readinessFocus: "Early literacy, numeracy and communication",

    overview: [
      "The Nursery programme is designed for children between 3 and 4 years of age who are ready for more structured classroom participation.",
      "Children begin developing early literacy and numeracy foundations while continuing to learn through stories, games, movement, conversation and hands-on activities.",
      "The programme also supports independence, confidence, attention, social skills and the ability to express ideas in a group.",
    ],

    learningNote: {
      title: "Concepts are introduced through activity and conversation",
      description:
        "Nursery children begin working with sounds, numbers, patterns, vocabulary and pre-writing skills through practical experiences rather than long periods of desk-based work.",
    },

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
        title: "Movement and active play",
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

    suitabilityIntro:
      "Nursery may be the right stage when your child is ready to participate in longer activities and begin exploring early language and number concepts.",

    suitabilityPoints: [
      "Your child is becoming comfortable in a group environment",
      "Your child enjoys stories, rhymes and conversations",
      "Your child can follow simple one-step or two-step instructions",
      "Your child is curious about colours, shapes, numbers and letters",
      "Your child is developing pencil grip and hand control",
      "Your child is ready for more consistent classroom routines",
    ],

    suitabilityNote:
      "Children entering Nursery do not need to know how to read or write. The programme builds the foundations needed for later learning in an age-appropriate way.",

    ctaEyebrow: "The next learning step",

    ctaTitle:
      "Give your child a strong and joyful Nursery foundation.",

    ctaDescription:
      "Discuss your child’s previous classroom experience, communication and readiness so we can help you understand whether Nursery is the appropriate entry level.",

    faqs: [
      {
        question: "What is the age group for Nursery?",
        answer:
          "The Nursery programme is designed for children between 3 and 4 years of age.",
      },
      {
        question: "Does Nursery include reading and writing?",
        answer:
          "Nursery introduces sound awareness, picture reading, vocabulary, fine-motor work and pre-writing readiness in an age-appropriate way.",
      },
      {
        question: "How are numbers taught?",
        answer:
          "Children explore counting, matching, sorting, patterns, comparison and number readiness through practical activities and classroom games.",
      },
      {
        question: "Does my child need to know letters before joining?",
        answer:
          "No. Prior knowledge is not required. Teachers introduce early literacy concepts gradually through stories, sounds, pictures and activities.",
      },
    ],
  },

  "junior-kg": {
    heroIntro:
      "A strong school-readiness programme that develops literacy, numeracy, communication, thinking skills and independent classroom habits.",

    learningStyle: "Structured learning with meaningful activities",

    classroomExperience: "Guided work with independent participation",

    readinessFocus: "Reading, writing and mathematical foundations",

    overview: [
      "The Junior KG programme is designed for children between 4 and 5 years of age.",
      "At this stage, children move towards stronger academic readiness while continuing to learn through meaningful activities, conversation, stories, projects and play.",
      "The programme supports phonics, early reading, writing readiness, number concepts, general awareness, problem-solving, communication and confidence.",
    ],

    learningNote: {
      title: "Children begin connecting ideas across subjects",
      description:
        "Junior KG activities help children apply phonics, vocabulary, number understanding and reasoning in practical tasks rather than learning concepts only through repetition.",
    },

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
          "Art, craft, themes and simple projects help children connect ideas across learning areas.",
      },
      {
        title: "Movement and enrichment",
        description:
          "Movement, dance and active experiences support physical confidence and overall development.",
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

    suitabilityIntro:
      "Junior KG may be suitable when your child is ready to work with early academic concepts while continuing to learn through activity, discussion and exploration.",

    suitabilityPoints: [
      "Your child shows interest in letters, sounds and words",
      "Your child can participate in an activity for a longer period",
      "Your child is beginning to draw, trace or attempt writing",
      "Your child can count familiar objects and recognise basic quantities",
      "Your child can communicate ideas in short conversations",
      "Your child is developing independent classroom habits",
    ],

    suitabilityNote:
      "Junior KG is not only about written work. Communication, reasoning, creativity, confidence and independent participation remain equally important.",

    ctaEyebrow: "Building school readiness",

    ctaTitle:
      "Prepare your child for confident and independent learning.",

    ctaDescription:
      "Speak with our team about your child’s current literacy, numeracy, communication and classroom habits before selecting Junior KG.",

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

    learningStyle: "Structured preparation with active participation",

    classroomExperience: "Independent work supported by teacher guidance",

    readinessFocus: "Confident transition to primary school",

    overview: [
      "The Senior KG programme is designed for children between 5 and 6 years of age.",
      "Children build on the foundations developed in earlier years and prepare for a smooth transition into formal school.",
      "The programme focuses on reading, writing, number fluency, concept understanding, reasoning, communication, general awareness and responsible classroom behaviour.",
    ],

    learningNote: {
      title: "Knowledge is strengthened through understanding and application",
      description:
        "Senior KG children practise academic skills while also learning to explain ideas, solve simple problems, complete tasks responsibly and work with growing independence.",
    },

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

    suitabilityIntro:
      "Senior KG may be suitable when your child is ready to strengthen academic foundations and practise the independence expected in primary school.",

    suitabilityPoints: [
      "Your child recognises familiar letters, sounds or simple words",
      "Your child is beginning to write with greater control",
      "Your child understands basic number concepts and sequences",
      "Your child can listen, respond and complete guided tasks",
      "Your child can communicate ideas with growing clarity",
      "Your child is preparing to enter Grade 1 or primary school",
    ],

    suitabilityNote:
      "The purpose of Senior KG is not to create unnecessary pressure. It helps children become academically prepared, emotionally confident and comfortable with formal-school routines.",

    ctaEyebrow: "Preparing for primary school",

    ctaTitle:
      "Support a smooth and confident transition to Grade 1.",

    ctaDescription:
      "Discuss your child’s current reading, writing, number understanding and independence so we can guide you about Senior KG readiness.",

    faqs: [
      {
        question: "What is the age group for Senior KG?",
        answer:
          "The Senior KG programme is designed for children between 5 and 6 years of age.",
      },
      {
        question: "How does Senior KG prepare children for Grade 1?",
        answer:
          "Children strengthen reading, writing, mathematics, communication, general awareness and independent classroom habits.",
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

function getProgrammeDetail(
  slug: string,
  title: string,
): ProgrammeDetail {
  return (
    programmeDetails[slug] ?? {
      heroIntro:
        "An age-appropriate early-learning programme designed to support confidence, communication, curiosity and school readiness.",

      learningStyle: "Activity-led and age-appropriate learning",

      classroomExperience: "Guided participation and exploration",

      readinessFocus: "Balanced development and confidence",

      overview: [
        `The ${title} programme combines guided learning with play, movement, conversation and creative experiences.`,
        "Children learn through a balanced routine that supports academic foundations, communication, independence and social development.",
        "Teachers provide age-appropriate guidance while allowing children to explore ideas and participate actively.",
      ],

      learningNote: {
        title: "Learning is adapted to the child’s developmental stage",
        description:
          "Activities combine conversation, movement, creativity, practical experiences and guided learning so children remain actively involved.",
      },

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

      suitabilityIntro:
        "A discussion with the admission team can help parents understand whether this programme matches the child’s age and current stage.",

      suitabilityPoints: [
        "The child falls within the recommended age group",
        "The child is ready for an age-appropriate classroom routine",
        "The child can participate in guided and independent activities",
        "The child is developing communication and social confidence",
        "The family wants balanced academic and overall development",
        "The programme matches the child’s next learning stage",
      ],

      suitabilityNote:
        "Age is an important starting point, but previous experience and individual development should also be considered.",

      ctaEyebrow: `${title} guidance`,

      ctaTitle: `Understand whether ${title} is the right next step.`,

      ctaDescription:
        "Speak with our team about your child’s age, previous experience and present learning stage before making a decision.",

      faqs: [
        {
          question: `Who is the ${title} programme for?`,
          answer:
            "The programme is designed for children within the age range shown on this page.",
        },
        {
          question: "How is the correct programme selected?",
          answer:
            "The child’s age, previous classroom experience, communication, independence and current learning stage are considered.",
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

  const programme = programmes.find(
    (item) => item.slug === slug,
  );

  if (!programme) {
    return {};
  }

  return {
    title: `${programme.title} Programme in Sector 12 Dwarka`,

    description: `${programme.intro} Learn about the ${programme.title} age group, learning goals, classroom routine and school-readiness focus at Kidzee Sector 12, Dwarka.`,

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

  const programme = programmes.find(
    (item) => item.slug === slug,
  );

  if (!programme) {
    notFound();
  }

  const detail = getProgrammeDetail(
    programme.slug,
    programme.title,
  );

  const relatedProgrammes = programmes.filter(
    (item) => item.slug !== programme.slug,
  );

  const ratio =
    programme.slug === "playgroup" ||
    programme.slug === "nursery"
      ? "1:8 teacher-child ratio"
      : "1:10 teacher-child ratio";

  const programmeWhatsApp = createWhatsAppLink(
    `Hello Kidzee Sector 12, Dwarka. I would like to enquire about the ${programme.title} programme for my child.`,
  );

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: `${programme.title} Programme`,
    description: programme.intro,
    url: `${site.url}/programmes/${programme.slug}`,

    provider: {
      "@type": "Preschool",
      name: site.name,
      url: site.url,
      telephone: site.phone,

      address: {
        "@type": "PostalAddress",
        streetAddress:
          "Building No. 19, Block B, Sector 12B",
        addressLocality: site.locality,
        addressRegion: site.region,
        postalCode: site.postalCode,
        addressCountry: site.country,
      },
    },
  };

  const quickInformation = [
    {
      icon: Users,
      title: programme.age,
      description: "Recommended age group",
    },
    {
      icon: Sparkles,
      title: detail.learningStyle,
      description: "How children learn",
    },
    {
      icon: HeartHandshake,
      title: detail.classroomExperience,
      description: "Classroom experience",
    },
    {
      icon: ShieldCheck,
      title: detail.readinessFocus,
      description: "Development priority",
    },
  ];

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
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_54%,#fff7d7_100%)] pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl"
          />

          <div className="container relative">
            <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
              <div>
                <span className="eyebrow">
                  {programme.age}
                </span>

                <h1 className="title mt-5">
                  {programme.title} at Kidzee Sector 12,
                  Dwarka
                </h1>

                <p className="lead mt-6 max-w-2xl">
                  {detail.heroIntro}
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  <a
                    href={programmeWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-purple-700/20 transition duration-300 hover:-translate-y-0.5 hover:bg-purple-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-700/25"
                  >
                    <MessageCircle
                      size={18}
                      aria-hidden="true"
                    />

                    Enquire About {programme.title}
                  </a>

                  <a
                    href={`tel:${site.phone}`}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition duration-300 hover:-translate-y-0.5 hover:border-purple-300 hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-700/20"
                  >
                    <Phone size={18} aria-hidden="true" />
                    Call the Centre
                  </a>
                </div>

                <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-2">
                  {[
                    `Age group: ${programme.age}`,
                    `Timing: ${programme.time}`,
                    ratio,
                    detail.readinessFocus,
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-purple-100 bg-white/90 px-4 py-3 shadow-sm"
                    >
                      <CheckCircle2
                        size={18}
                        aria-hidden="true"
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
                <div
                  aria-hidden="true"
                  className="absolute -left-6 -top-6 h-24 w-24 rounded-[30px] bg-yellow-300/60"
                />

                <div
                  aria-hidden="true"
                  className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-purple-300/30"
                />

                <div className="relative overflow-hidden rounded-[38px] border-8 border-white bg-white shadow-2xl shadow-purple-950/10">
                  <Image
                    src={programme.image}
                    alt={`${programme.title} classroom activity at Kidzee Sector 12 Dwarka`}
                    width={900}
                    height={760}
                    priority
                    sizes="(max-width: 1024px) 100vw, 48vw"
                    className="h-[470px] w-full object-cover sm:h-[570px]"
                  />

                  <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/60 bg-white/90 p-5 shadow-xl backdrop-blur">
                    <p className="text-sm font-black text-purple-800">
                      Learning planned for {programme.age}
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Activities, expectations and classroom
                      guidance matched to this stage of
                      development.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Programme Information */}
        <section className="relative z-10 -mt-3 bg-white pb-8 sm:-mt-5">
          <div className="container">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickInformation.map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.description}
                    className="rounded-[28px] border border-purple-100 bg-white p-6 shadow-lg shadow-purple-950/5"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                      <Icon size={23} aria-hidden="true" />
                    </span>

                    <h2 className="mt-5 text-lg font-black leading-7 text-slate-950">
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
                <span className="eyebrow">
                  Programme overview
                </span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Learning designed for this important
                  stage.
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
                    {detail.learningNote.title}
                  </p>

                  <p className="mt-3 text-sm leading-7 text-slate-700 sm:text-base">
                    {detail.learningNote.description}
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
                        <Icon
                          size={26}
                          strokeWidth={1.8}
                          aria-hidden="true"
                        />
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
              <span className="eyebrow">
                A balanced classroom day
              </span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                A predictable routine with room to explore.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                The sequence can change according to the
                day’s theme, but children experience a
                balanced mix of conversation, guided
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
                    <span
                      aria-hidden="true"
                      className="absolute left-7 top-14 hidden h-[calc(100%-1rem)] w-px bg-purple-200 sm:block"
                    />
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
                  Progress develops gradually through
                  everyday practice.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
                  Every child develops at a different pace.
                  Teachers focus on participation, confidence
                  and steady improvement rather than
                  comparing one child with another.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {detail.parentExpectations.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-4 py-4"
                    >
                      <CheckCircle2
                        size={19}
                        aria-hidden="true"
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
                  <HeartHandshake
                    size={28}
                    aria-hidden="true"
                  />
                </span>

                <h3 className="mt-6 text-2xl font-black">
                  Parents and teachers working together
                </h3>

                <p className="mt-4 text-sm leading-7 text-purple-100 sm:text-base">
                  Parents can share information about their
                  child’s routine, interests, comfort needs
                  and previous school experience. This helps
                  teachers understand the child more
                  personally.
                </p>

                <div className="mt-7 rounded-[24px] border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-black text-yellow-300">
                    Supporting progress at home
                  </p>

                  <p className="mt-2 text-sm leading-7 text-purple-100">
                    Simple conversation, reading, play and
                    regular routines at home can reinforce
                    classroom learning without placing
                    unnecessary pressure on the child.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Programme Suitability */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="absolute -left-5 -top-5 h-24 w-24 rounded-[28px] bg-yellow-200/70"
                />

                <div
                  aria-hidden="true"
                  className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-purple-200/45"
                />

                <div className="relative overflow-hidden rounded-[36px] border-8 border-white shadow-2xl shadow-purple-950/10">
                  <Image
                    src={programme.image}
                    alt={`Child participating in the ${programme.title} programme at Kidzee Sector 12 Dwarka`}
                    width={900}
                    height={760}
                    sizes="(max-width: 1024px) 100vw, 45vw"
                    className="h-[430px] w-full object-cover sm:h-[540px]"
                  />

                  <div className="absolute inset-x-5 bottom-5 rounded-[24px] border border-white/60 bg-white/90 p-5 shadow-xl backdrop-blur">
                    <p className="text-sm font-black text-purple-800">
                      Every child develops differently
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Age provides a starting point, while
                      readiness and previous experience help
                      complete the picture.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <span className="eyebrow">
                  Choosing the right stage
                </span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Is {programme.title} right for my child?
                </h2>

                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                  {detail.suitabilityIntro}
                </p>

                <div className="mt-7 grid gap-3">
                  {detail.suitabilityPoints.map((item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-[20px] border border-purple-100 bg-[#faf8ff] px-5 py-4"
                    >
                      <CheckCircle2
                        size={19}
                        aria-hidden="true"
                        className="mt-0.5 shrink-0 text-purple-700"
                      />

                      <p className="text-sm font-bold leading-7 text-slate-700 sm:text-base">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] border border-yellow-200 bg-yellow-50 p-5">
                  <p className="text-sm font-black text-purple-950">
                    A useful point for parents
                  </p>

                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    {detail.suitabilityNote}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Related Programmes */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">
                Explore other age groups
              </span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                Compare the next or previous learning stage.
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
                      alt={`${item.title} programme at Kidzee Sector 12 Dwarka`}
                      width={700}
                      height={500}
                      sizes="(max-width: 768px) 100vw, 33vw"
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
                      className="mt-5 inline-flex items-center gap-2 text-sm font-black text-purple-700 transition hover:text-purple-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-700/30"
                    >
                      Explore {item.title}
                      <ArrowRight
                        size={16}
                        aria-hidden="true"
                      />
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/programmes"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-purple-700/20"
              >
                Compare All Programmes
                <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="section bg-white">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">
                {programme.title} questions
              </span>

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

                    <span
                      aria-hidden="true"
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-xl font-black text-purple-800 transition group-open:rotate-45"
                    >
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

        {/* Programme-Specific CTA */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#5b2a86_0%,#3b145f_100%)] px-7 py-10 text-white shadow-[0_28px_80px_rgba(45,23,54,0.18)] sm:px-10 sm:py-12 lg:px-14">
              <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    {detail.ctaEyebrow}
                  </span>

                  <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                    {detail.ctaTitle}
                  </h2>

                  <p className="mt-4 max-w-2xl text-base leading-8 text-purple-100">
                    {detail.ctaDescription}
                  </p>
                </div>

                <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:flex-wrap lg:flex-col lg:flex-nowrap">
                  <a
                    href={programmeWhatsApp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-yellow-300 px-7 py-3.5 text-sm font-black text-purple-950 transition duration-300 hover:-translate-y-0.5 hover:bg-yellow-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-yellow-300/35 sm:w-auto"
                  >
                    <MessageCircle
                      size={17}
                      aria-hidden="true"
                    />

                    Ask About {programme.title}
                  </a>

                  <a
                    href={`tel:${site.phone}`}
                    className="inline-flex min-h-12 w-full items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-black text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/20 sm:w-auto"
                  >
                    <Phone size={17} aria-hidden="true" />
                    Call Admission Team
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}