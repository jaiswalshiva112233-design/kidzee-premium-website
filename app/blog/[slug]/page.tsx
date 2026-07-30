import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import { CTA } from "@/components/HomeSections";
import { posts } from "@/lib/site";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

type ArticleSection = {
  heading: string;
  paragraphs: string[];
  tips?: string[];
};

type ArticleContent = {
  category: string;
  intro: string[];
  sections: ArticleSection[];
  conclusion: string;
};

export function generateStaticParams() {
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((item) => item.slug === slug);

  if (!post) {
    return {
      title: "Article Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      url: `/blog/${post.slug}`,
      siteName: "Kidzee Sector 12, Dwarka",
      images: [
        {
          url: "/images/blog-parent-guide.jpg",
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ["/images/blog-parent-guide.jpg"],
    },
  };
}

const content: Record<string, ArticleContent> = {
  "prepare-your-child-for-preschool": {
    category: "Starting Preschool",
    intro: [
      "Starting preschool is a major change in a young child’s life. It introduces new people, a new place, unfamiliar routines and time away from parents.",
      "Preparation does not mean turning the weeks before school into a training programme. The goal is simply to help the child understand what will happen and make the new routine feel predictable, positive and emotionally safe.",
    ],
    sections: [
      {
        heading: "Talk about preschool in simple, positive language",
        paragraphs: [
          "Explain preschool using words your child can understand. Talk about teachers, stories, toys, activities, meals and other children. Keep the explanation realistic and reassuring.",
          "Avoid repeatedly asking whether the child is excited or ready. Too much discussion can unintentionally make preschool feel like a test or a major performance.",
        ],
        tips: [
          "Say: “You will play, listen to stories and meet your teacher.”",
          "Avoid promising that the child will never feel sad or miss home.",
          "Read picture books about starting school.",
        ],
      },
      {
        heading: "Practise short and predictable separations",
        paragraphs: [
          "Children often settle more easily when they already have experience staying with another trusted adult for a short period. This may be a grandparent, relative or familiar caregiver.",
          "Tell the child clearly when you are leaving and when you will return. Quietly disappearing can make separation anxiety stronger because the child begins to worry that a parent may leave without warning.",
        ],
        tips: [
          "Start with short separations.",
          "Return at the time you promised.",
          "Use the same calm goodbye phrase each time.",
        ],
      },
      {
        heading: "Build a steady morning routine",
        paragraphs: [
          "A rushed morning can make the first school weeks more stressful. A simple routine helps children know what comes next and gives the family enough time to leave home calmly.",
          "A few days before school begins, gradually adjust waking, breakfast and getting-ready times to match the school schedule.",
        ],
        tips: [
          "Prepare clothes and the school bag the previous evening.",
          "Keep breakfast familiar and easy to eat.",
          "Allow extra time during the first few weeks.",
        ],
      },
      {
        heading: "Encourage everyday independence",
        paragraphs: [
          "Children do not need to manage everything alone before starting preschool. However, small independent habits can help them feel more confident in the classroom.",
          "Allow your child to practise simple tasks without immediately stepping in. The focus should be participation and confidence, not perfect performance.",
        ],
        tips: [
          "Carry and recognise their own bag.",
          "Open a lunch box or water bottle.",
          "Wash and dry their hands.",
          "Put toys back after playing.",
          "Ask an adult for help.",
        ],
      },
      {
        heading: "Make the school environment familiar",
        paragraphs: [
          "Whenever possible, visit the preschool with your child before the regular session begins. Seeing the entrance, classrooms, play areas and teachers can reduce the feeling of entering a completely unknown place.",
          "A trial class can be especially useful because the child experiences the environment gradually instead of beginning with a full regular routine.",
        ],
        tips: [
          "Show the child where you will drop off and pick up.",
          "Let them explore without forcing interaction.",
          "Talk positively about the visit afterwards.",
        ],
      },
      {
        heading: "Keep the goodbye warm and brief",
        paragraphs: [
          "Some children walk into preschool happily, while others cry or hold on to a parent. Both reactions are normal.",
          "A long, emotional goodbye can make separation harder. A clear and confident goodbye helps the child understand that the parent trusts the teacher and will return.",
        ],
        tips: [
          "Give one hug and a clear goodbye.",
          "Tell the child when you will return.",
          "Avoid returning repeatedly after leaving.",
          "Allow the teacher time to comfort and engage the child.",
        ],
      },
    ],
    conclusion:
      "The first few days may include excitement, hesitation, tears or all three. What matters most is consistency, calm reassurance and trust between the family and the preschool team. Most children settle gradually once the routine becomes familiar.",
  },

  "signs-child-is-ready-for-preschool": {
    category: "Preschool Readiness",
    intro: [
      "Preschool readiness is not a test that children either pass or fail. Children develop at different speeds, and no child needs to be completely independent before beginning school.",
      "Readiness usually appears through a combination of curiosity, communication, growing independence and the ability to manage short periods away from parents.",
    ],
    sections: [
      {
        heading: "Your child shows interest in other children",
        paragraphs: [
          "A preschool-ready child does not need to share perfectly or join every group activity. Simply watching, copying or showing curiosity about other children can be an encouraging sign.",
          "Preschool gives children regular opportunities to practise waiting, joining a group, taking turns and communicating with peers.",
        ],
      },
      {
        heading: "Your child can communicate basic needs",
        paragraphs: [
          "Children may communicate through words, gestures, facial expressions or a combination of these. What matters is that familiar adults can usually understand when the child needs help.",
        ],
        tips: [
          "Expressing hunger or thirst.",
          "Indicating discomfort.",
          "Asking for the toilet.",
          "Showing that something is upsetting.",
          "Requesting help from an adult.",
        ],
      },
      {
        heading: "Your child can follow simple instructions",
        paragraphs: [
          "Preschool routines often involve short directions such as sitting on the mat, putting away a toy, washing hands or standing in a line.",
          "A child does not need to follow every instruction immediately. Being able to understand and respond to simple one-step directions with support is a useful foundation.",
        ],
      },
      {
        heading: "Your child can participate briefly in an activity",
        paragraphs: [
          "Young children naturally move between activities quickly. Readiness does not mean sitting for long periods.",
          "A child who can look at a book, complete a simple puzzle, listen to part of a story or participate briefly in a song is already developing useful classroom habits.",
        ],
      },
      {
        heading: "Your child tolerates short separation",
        paragraphs: [
          "Some crying during separation is normal, especially in the first weeks. Readiness means the child can gradually begin accepting comfort from another trusted adult.",
          "Children who have never been away from a parent may simply need a slower and more supportive settling process.",
        ],
      },
      {
        heading: "Your child is curious about the world",
        paragraphs: [
          "Curiosity is one of the strongest foundations for early learning. Children show curiosity when they ask questions, explore objects, imitate adults, enjoy songs or become absorbed in pretend play.",
        ],
        tips: [
          "Interest in picture books.",
          "Enjoyment of songs and movement.",
          "Pretending during play.",
          "Sorting or arranging objects.",
          "Asking what, why or how.",
        ],
      },
      {
        heading: "Your child is developing simple self-help skills",
        paragraphs: [
          "Children do not need to dress, eat or use the toilet completely independently before preschool. Small attempts at independence are enough to show that these skills are beginning to develop.",
        ],
        tips: [
          "Trying to eat independently.",
          "Helping to put toys away.",
          "Washing hands with support.",
          "Carrying personal belongings.",
          "Attempting to wear shoes or clothing.",
        ],
      },
    ],
    conclusion:
      "A child does not need to show every sign before beginning preschool. A caring preschool should meet children at their current stage and help them develop confidence, communication and independence gradually.",
  },

  "play-based-learning": {
    category: "Early Learning",
    intro: [
      "Play-based learning is sometimes misunderstood as unstructured free time. In a thoughtfully planned preschool, play is one of the main ways children build language, mathematical thinking, creativity, coordination and social understanding.",
      "Young children learn most effectively when they can touch, move, explore, repeat and connect new ideas with real experiences.",
    ],
    sections: [
      {
        heading: "Language develops through interaction",
        paragraphs: [
          "Children need meaningful reasons to speak and listen. Role play, storytelling, puppet activities and group conversations encourage them to use language naturally.",
          "During play, children describe what they are doing, ask questions, explain ideas and learn new words from teachers and classmates.",
        ],
      },
      {
        heading: "Early mathematics becomes visible and concrete",
        paragraphs: [
          "Before children understand written numbers and abstract symbols, they need real experiences with quantity, shape, size, position and pattern.",
          "Building blocks, puzzles, sorting games and everyday classroom materials allow children to experience these ideas directly.",
        ],
        tips: [
          "Counting objects during play.",
          "Comparing bigger and smaller items.",
          "Sorting by colour, size or shape.",
          "Creating and continuing patterns.",
          "Understanding positions such as inside, under and beside.",
        ],
      },
      {
        heading: "Play strengthens emotional regulation",
        paragraphs: [
          "Play creates natural situations in which children need to wait, take turns, manage disappointment and adjust when another child changes the plan.",
          "Teachers support these moments by naming emotions, modelling helpful language and guiding children towards solutions.",
        ],
      },
      {
        heading: "Movement supports learning",
        paragraphs: [
          "Physical movement is closely connected with attention, coordination and body awareness. Running, climbing, balancing, dancing and fine-motor activities all contribute to school readiness.",
          "Activities such as threading, drawing, moulding clay and using child-safe tools also strengthen the hand control required for later writing.",
        ],
      },
      {
        heading: "Pretend play builds imagination and social understanding",
        paragraphs: [
          "When children pretend to run a shop, care for a doll or work in a kitchen, they are practising much more than imagination.",
          "They are learning how people communicate, how routines work and how different roles connect with one another.",
        ],
      },
      {
        heading: "Teachers make play purposeful",
        paragraphs: [
          "Effective play-based learning is supported by careful planning. Teachers arrange materials, observe children, ask questions and introduce new challenges without taking control of every moment.",
          "The teacher’s role is to extend the child’s thinking while preserving curiosity and enjoyment.",
        ],
        tips: [
          "Introducing new vocabulary.",
          "Asking open-ended questions.",
          "Adding materials that deepen the activity.",
          "Helping children work through disagreements.",
          "Connecting play with a learning concept.",
        ],
      },
    ],
    conclusion:
      "Play and learning are not separate parts of a preschool day. For young children, purposeful play is learning. It helps them understand ideas deeply while building confidence, communication and a positive relationship with school.",
  },

  "choosing-preschool-in-dwarka": {
    category: "Choosing a Preschool",
    intro: [
      "Choosing a preschool in Dwarka can feel difficult because many centres appear attractive during a short visit. Colourful classrooms, displays and activity lists are useful, but they do not reveal the complete everyday experience.",
      "A good preschool should suit your child’s temperament, support your family’s routine and demonstrate consistent care rather than relying only on presentation.",
    ],
    sections: [
      {
        heading: "Observe how adults communicate with children",
        paragraphs: [
          "The way teachers speak to children is one of the most important signs of classroom quality. Look for patience, warmth, clear instructions and respectful language.",
          "Notice whether teachers come down to the child’s level, listen carefully and guide behaviour without unnecessary fear or humiliation.",
        ],
      },
      {
        heading: "Ask about the daily routine",
        paragraphs: [
          "A balanced preschool day should include more than worksheets or one type of activity. Children need a combination of conversation, guided learning, creative work, movement, play, meals and rest.",
        ],
        tips: [
          "How much time is spent on guided learning?",
          "How often do children move and play?",
          "How are meals and toilet routines managed?",
          "How does the school handle transitions between activities?",
        ],
      },
      {
        heading: "Understand the teacher-child ratio",
        paragraphs: [
          "The number of children assigned to each teacher affects supervision, communication and the attention children receive.",
          "Ask for the practical classroom ratio rather than only the total number of staff working at the centre.",
        ],
      },
      {
        heading: "Ask how the school supports settling",
        paragraphs: [
          "Children react differently during the first weeks of preschool. A good centre should have a clear and compassionate approach for children who cry, hesitate or need extra time.",
          "Trial classes and gradual settling options can help parents and children become comfortable before regular attendance begins.",
        ],
      },
      {
        heading: "Review safety and authorised pickup procedures",
        paragraphs: [
          "Ask how the centre manages classroom supervision, visitor entry, dispersal and emergency contact information.",
          "Parents should understand who is authorised to collect the child and how the school verifies changes in pickup arrangements.",
        ],
      },
      {
        heading: "Understand parent communication",
        paragraphs: [
          "Preschool communication should go beyond sending activity photographs. Parents also need meaningful information about routines, progress, behaviour, comfort and areas requiring support.",
        ],
        tips: [
          "How often are updates shared?",
          "Are parent-teacher meetings conducted?",
          "How are concerns discussed?",
          "Who should parents contact during the day?",
        ],
      },
      {
        heading: "Consider practical convenience",
        paragraphs: [
          "A preschool may be excellent, but a difficult daily journey or unsuitable timing can create stress for the child and family.",
          "Compare travel time, preschool hours, daycare availability, transport options, meals and holiday schedules before deciding.",
        ],
      },
      {
        heading: "Notice your child’s response during the visit",
        paragraphs: [
          "Some children are naturally quiet in a new environment, so immediate excitement is not necessary.",
          "Look for small signs of comfort or curiosity, such as observing an activity, touching a toy, responding to a teacher or exploring the room.",
        ],
      },
    ],
    conclusion:
      "The right preschool is one where your child is treated with care, the daily routine is developmentally appropriate and communication with parents feels open and dependable. A personal school visit remains the best way to evaluate these details.",
  },

  "building-social-skills": {
    category: "Child Development",
    intro: [
      "Social skills do not develop through lectures or repeated instructions alone. Young children need regular opportunities to interact, make mistakes, experience emotions and practise better ways of responding.",
      "Parents and teachers can support this development by modelling useful language and guiding children through real social situations.",
    ],
    sections: [
      {
        heading: "Teach simple phrases children can use",
        paragraphs: [
          "Children may hit, grab or shout when they do not yet have the words to manage a situation. Teaching a few clear phrases gives them a practical alternative.",
        ],
        tips: [
          "“Can I have a turn?”",
          "“Please stop.”",
          "“Can we do it together?”",
          "“I am still using this.”",
          "“Can you help me?”",
        ],
      },
      {
        heading: "Use play to practise cooperation",
        paragraphs: [
          "Shared building activities, pretend play, puzzles and simple games create natural opportunities for children to listen, wait, contribute and negotiate.",
          "Adults can guide the interaction without solving every problem immediately.",
        ],
      },
      {
        heading: "Help children identify emotions",
        paragraphs: [
          "Children manage feelings more effectively when they can recognise and name them. Use specific words such as disappointed, worried, excited, frustrated or proud.",
          "Naming an emotion does not excuse unkind behaviour. It helps the child understand what is happening before learning a better response.",
        ],
      },
      {
        heading: "Do not expect immediate sharing",
        paragraphs: [
          "Sharing is difficult for young children because they are still developing patience, impulse control and an understanding of time.",
          "Instead of forcing a child to hand over an object immediately, use clear turns and predictable transitions.",
        ],
        tips: [
          "Use a short timer.",
          "Say who will have the next turn.",
          "Offer another activity while waiting.",
          "Praise the child when the turn is completed calmly.",
        ],
      },
      {
        heading: "Model calm conflict resolution",
        paragraphs: [
          "Children learn from how adults respond to frustration and disagreement. Speak calmly, describe the problem and show how both sides can communicate.",
          "Avoid labelling one child as good and another as naughty. Focus on the behaviour and what can be done differently.",
        ],
      },
      {
        heading: "Praise specific social behaviour",
        paragraphs: [
          "General praise such as “good child” does not always help children understand what they did well. Specific feedback connects the action with its positive effect.",
        ],
        tips: [
          "“You waited for your turn.”",
          "“You noticed your friend was upset.”",
          "“You asked before taking the toy.”",
          "“You helped put everything away.”",
        ],
      },
      {
        heading: "Give children time to observe",
        paragraphs: [
          "Not every child joins a group immediately. Some children prefer to watch before participating, especially in a new environment.",
          "Observation can be part of the child’s learning process. Gentle invitations usually work better than forcing immediate participation.",
        ],
      },
    ],
    conclusion:
      "Social confidence develops slowly through repeated experience. With patient guidance at home and preschool, children gradually learn how to communicate, cooperate, manage frustration and build positive relationships.",
  },
};

function estimateReadingTime(article: ArticleContent) {
  const text = [
    ...article.intro,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.tips ?? []),
    ]),
    article.conclusion,
  ].join(" ");

  const words = text.trim().split(/\s+/).length;

  return Math.max(3, Math.ceil(words / 200));
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;

  const post = posts.find((item) => item.slug === slug);
  const article = content[slug];

  if (!post || !article) {
    notFound();
  }

  const readingTime = estimateReadingTime(article);

  const relatedPosts = posts
    .filter((item) => item.slug !== slug)
    .slice(0, 3);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/blog/${post.slug}`,
    },
    author: {
      "@type": "Organization",
      name: "Kidzee Sector 12, Dwarka",
    },
    publisher: {
      "@type": "Organization",
      name: "Kidzee Sector 12, Dwarka",
    },
    image: "/images/blog-parent-guide.jpg",
  };

  return (
    <PageShell>
      <main className="overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(articleSchema).replace(/</g, "\\u003c"),
          }}
        />

        {/* Article Hero */}
        <section className="relative overflow-hidden bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_55%,#fff8dc_100%)] pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />

          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-black text-purple-700 transition hover:text-purple-900"
              >
                <span aria-hidden="true">←</span>
                Parent Resources
              </Link>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <span className="rounded-full bg-purple-100 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-purple-800">
                  {article.category}
                </span>

                <span className="rounded-full border border-purple-100 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm">
                  {readingTime} minute read
                </span>
              </div>

              <h1 className="title mt-7">{post.title}</h1>

              <p className="lead mx-auto mt-6 max-w-3xl">
                {post.excerpt}
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-slate-600">
                <span className="font-bold">Kidzee Sector 12, Dwarka</span>
                <span
                  className="hidden h-1.5 w-1.5 rounded-full bg-purple-300 sm:block"
                  aria-hidden="true"
                />
                <span>Practical guidance for parents</span>
              </div>
            </div>
          </div>
        </section>

        {/* Article Content */}
        <section className="section bg-white">
          <div className="container">
            <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
              <article className="min-w-0">
                <div className="rounded-[30px] border border-purple-100 bg-[#fbf9ff] p-6 sm:p-8">
                  {article.intro.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="text-base leading-8 text-slate-700 first:mt-0 sm:text-lg"
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>

                <div className="mt-12 space-y-12">
                  {article.sections.map((section, index) => (
                    <section
                      key={section.heading}
                      id={`section-${index + 1}`}
                      className="scroll-mt-28"
                    >
                      <div className="flex items-start gap-4">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-700 text-sm font-black text-white">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        <h2 className="pt-1 text-2xl font-black leading-tight text-slate-950 sm:text-3xl">
                          {section.heading}
                        </h2>
                      </div>

                      <div className="mt-5 space-y-4">
                        {section.paragraphs.map((paragraph) => (
                          <p
                            key={paragraph}
                            className="text-base leading-8 text-slate-600 sm:text-lg"
                          >
                            {paragraph}
                          </p>
                        ))}
                      </div>

                      {section.tips && section.tips.length > 0 && (
                        <div className="mt-6 rounded-[26px] border border-yellow-200 bg-[#fffaf0] p-6">
                          <p className="text-sm font-black uppercase tracking-[0.14em] text-purple-800">
                            Practical points
                          </p>

                          <ul className="mt-4 grid gap-3">
                            {section.tips.map((tip) => (
                              <li
                                key={tip}
                                className="flex items-start gap-3 text-sm leading-7 text-slate-700 sm:text-base"
                              >
                                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow-300 text-[10px] font-black text-purple-950">
                                  ✓
                                </span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </section>
                  ))}
                </div>

                <section className="mt-12 rounded-[32px] bg-purple-950 p-7 text-white sm:p-9">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    Final thought
                  </span>

                  <p className="mt-4 text-base leading-8 text-purple-50 sm:text-lg">
                    {article.conclusion}
                  </p>
                </section>

                <div className="mt-10 rounded-[30px] border border-purple-100 bg-[#faf8ff] p-7 sm:p-8">
                  <h2 className="text-2xl font-black text-slate-950">
                    Considering preschool for your child?
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
                    Visit Kidzee Sector 12, Dwarka to explore the classrooms,
                    meet the centre team and understand which programme is
                    suitable for your child.
                  </p>

                  <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                    <Link
                      href="/admissions"
                      className="inline-flex min-h-12 items-center justify-center rounded-full bg-purple-700 px-6 py-3 text-sm font-black text-white transition hover:bg-purple-800"
                    >
                      Explore Admissions
                    </Link>

                    <a
                      href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20book%20a%20school%20visit."
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-12 items-center justify-center rounded-full border border-purple-200 bg-white px-6 py-3 text-sm font-black text-purple-800 transition hover:bg-purple-50"
                    >
                      Book a School Visit
                    </a>
                  </div>
                </div>
              </article>

              {/* Sidebar */}
              <aside className="hidden lg:block">
                <div className="sticky top-28 space-y-6">
                  <div className="rounded-[28px] border border-purple-100 bg-[#fbf9ff] p-6">
                    <p className="text-sm font-black uppercase tracking-[0.14em] text-purple-800">
                      In this guide
                    </p>

                    <nav className="mt-5">
                      <ol className="space-y-3">
                        {article.sections.map((section, index) => (
                          <li key={section.heading}>
                            <a
                              href={`#section-${index + 1}`}
                              className="flex gap-3 text-sm font-semibold leading-6 text-slate-600 transition hover:text-purple-800"
                            >
                              <span className="font-black text-purple-500">
                                {String(index + 1).padStart(2, "0")}
                              </span>
                              <span>{section.heading}</span>
                            </a>
                          </li>
                        ))}
                      </ol>
                    </nav>
                  </div>

                  <div className="rounded-[28px] bg-purple-950 p-6 text-white">
                    <p className="text-sm font-black text-yellow-300">
                      Admissions open
                    </p>

                    <h2 className="mt-3 text-xl font-black">
                      Book a three-day preschool trial.
                    </h2>

                    <p className="mt-3 text-sm leading-7 text-purple-100">
                      Help your child experience the classroom, teachers and
                      daily routine before regular admission.
                    </p>

                    <a
                      href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20book%20a%203-day%20trial%20class."
                      target="_blank"
                      rel="noreferrer"
                      className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-yellow-300 px-5 py-3 text-sm font-black text-purple-950 transition hover:bg-yellow-200"
                    >
                      Enquire on WhatsApp
                    </a>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </section>

        {/* Related Articles */}
        {relatedPosts.length > 0 && (
          <section className="section bg-[#faf8ff]">
            <div className="container">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="eyebrow">More parent resources</span>

                  <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                    Continue reading
                  </h2>
                </div>

                <Link
                  href="/blog"
                  className="inline-flex items-center text-sm font-black text-purple-700 transition hover:text-purple-900"
                >
                  View all articles
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </Link>
              </div>

              <div className="mt-10 grid gap-5 md:grid-cols-3">
                {relatedPosts.map((relatedPost) => (
                  <article
                    key={relatedPost.slug}
                    className="flex h-full flex-col rounded-[30px] border border-purple-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/5"
                  >
                    <span className="text-xs font-black uppercase tracking-[0.14em] text-purple-700">
                      Parent guide
                    </span>

                    <h3 className="mt-4 text-xl font-black leading-snug text-slate-950">
                      {relatedPost.title}
                    </h3>

                    <p className="mt-4 flex-1 text-sm leading-7 text-slate-600">
                      {relatedPost.excerpt}
                    </p>

                    <Link
                      href={`/blog/${relatedPost.slug}`}
                      className="mt-6 inline-flex items-center text-sm font-black text-purple-700 transition hover:text-purple-900"
                    >
                      Read article
                      <span className="ml-2" aria-hidden="true">
                        →
                      </span>
                    </Link>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        <CTA />
      </main>
    </PageShell>
  );
}