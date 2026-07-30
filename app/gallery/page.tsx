import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { CTA } from "@/components/HomeSections";
import {
  ArrowRight,
  Camera,
  CheckCircle2,
  Heart,
  ImageIcon,
  MessageCircle,
  Palette,
  PartyPopper,
  School,
  Sparkles,
  Users,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Preschool Gallery in Sector 12 Dwarka",
  description:
    "Explore real classroom activities, celebrations, creative learning and play moments from Kidzee Preschool & Daycare, Sector 12, Dwarka.",
  keywords: [
    "Kidzee Sector 12 Dwarka gallery",
    "preschool activities Dwarka",
    "preschool classroom photos Dwarka",
    "Kidzee Dwarka photos",
    "preschool play area Sector 12 Dwarka",
    "preschool celebrations Dwarka",
  ],
  alternates: {
    canonical: "/gallery",
  },
  openGraph: {
    title: "Gallery | Kidzee Sector 12, Dwarka",
    description:
      "See real learning activities, celebrations, classroom experiences and joyful play moments from our preschool and daycare.",
    url: "/gallery",
    type: "website",
    images: [
      {
        url: "/images/gallery/gallery-main.jpg",
        width: 1200,
        height: 630,
        alt: "Children participating in activities at Kidzee Sector 12 Dwarka",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gallery | Kidzee Sector 12, Dwarka",
    description:
      "Explore everyday learning, play and celebration moments from Kidzee Sector 12, Dwarka.",
    images: ["/images/gallery/gallery-main.jpg"],
  },
};

const galleryImages = [
  {
    src: "/images/gallery/gallery-1.jpg",
    alt: "Children participating in a classroom activity at Kidzee Sector 12 Dwarka",
    category: "Classroom Learning",
    title: "Learning through participation",
    size: "large",
  },
  {
    src: "/images/gallery/gallery-2.jpg",
    alt: "Creative art and craft activity at Kidzee Preschool Dwarka",
    category: "Creative Activities",
    title: "Ideas taking shape",
    size: "standard",
  },
  {
    src: "/images/gallery/gallery-3.jpg",
    alt: "Children enjoying indoor play at Kidzee Sector 12 Dwarka",
    category: "Play and Movement",
    title: "Active, joyful play",
    size: "standard",
  },
  {
    src: "/images/gallery/gallery-4.jpg",
    alt: "Preschool celebration at Kidzee Sector 12 Dwarka",
    category: "Celebrations",
    title: "Special days together",
    size: "tall",
  },
  {
    src: "/images/gallery/gallery-5.jpg",
    alt: "Teacher guiding children during an early learning activity",
    category: "Teacher Interaction",
    title: "Guided with patience",
    size: "standard",
  },
  {
    src: "/images/gallery/gallery-6.jpg",
    alt: "Children enjoying group activity at Kidzee Preschool Dwarka",
    category: "Group Experiences",
    title: "Growing together",
    size: "large",
  },
  {
    src: "/images/gallery/gallery-7.jpg",
    alt: "Storytelling session at Kidzee Sector 12 Dwarka",
    category: "Storytelling",
    title: "Stories that spark imagination",
    size: "standard",
  },
  {
    src: "/images/gallery/gallery-8.jpg",
    alt: "Outdoor play activity at Kidzee Sector 12 Dwarka",
    category: "Outdoor Play",
    title: "Room to move and explore",
    size: "tall",
  },
  {
    src: "/images/gallery/gallery-9.jpg",
    alt: "Children displaying their creative work at Kidzee Dwarka",
    category: "Children’s Work",
    title: "Proud little creators",
    size: "standard",
  },
  {
    src: "/images/gallery/gallery-10.jpg",
    alt: "Dance and movement activity at Kidzee Sector 12 Dwarka",
    category: "Dance and Movement",
    title: "Confidence through movement",
    size: "large",
  },
  {
    src: "/images/gallery/gallery-11.jpg",
    alt: "Parent participation event at Kidzee Preschool Dwarka",
    category: "Parent Partnership",
    title: "Families joining the journey",
    size: "standard",
  },
  {
    src: "/images/gallery/gallery-12.jpg",
    alt: "Daycare children enjoying a guided activity at Kidzee Dwarka",
    category: "Daycare Moments",
    title: "Comfortable afternoons",
    size: "standard",
  },
];

const galleryCategories = [
  {
    icon: School,
    title: "Classroom learning",
    description:
      "Hands-on activities, conversations, stories and guided early-learning experiences.",
  },
  {
    icon: Palette,
    title: "Creative expression",
    description:
      "Art, craft, music and opportunities for children to explore their own ideas.",
  },
  {
    icon: Sparkles,
    title: "Play and movement",
    description:
      "Indoor and outdoor experiences that support confidence, coordination and enjoyment.",
  },
  {
    icon: PartyPopper,
    title: "Celebrations",
    description:
      "Festivals, special days and shared experiences that bring the school community together.",
  },
];

const galleryValues = [
  "Real moments from our centre",
  "Natural classroom interactions",
  "Learning, play and celebrations",
  "Preschool and daycare experiences",
];

function getImageHeight(size: string) {
  if (size === "large") {
    return "h-[360px] sm:h-[420px] lg:h-[500px]";
  }

  if (size === "tall") {
    return "h-[400px] sm:h-[500px] lg:h-[560px]";
  }

  return "h-[300px] sm:h-[350px] lg:h-[390px]";
}

export default function GalleryPage() {
  return (
    <PageShell>
      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_54%,#fff7d7_100%)] pb-16 pt-12 sm:pb-20 sm:pt-16 lg:pb-24 lg:pt-20">
          <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />

          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              <span className="eyebrow">Inside our preschool</span>

              <h1 className="title mt-5">
                Everyday moments that make early childhood memorable.
              </h1>

              <p className="lead mx-auto mt-6 max-w-3xl">
                Explore real learning activities, classroom experiences,
                celebrations, creative work and joyful play from Kidzee Sector
                12, Dwarka.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {galleryValues.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/90 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm"
                  >
                    <CheckCircle2
                      size={15}
                      className="text-purple-700"
                    />
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Gallery Introduction */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div>
                <span className="eyebrow">Life at Kidzee Dwarka</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  A closer look at how children learn, play and grow.
                </h2>

                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                  A preschool is best understood through its everyday
                  atmosphere. Our gallery shows children participating in real
                  classroom activities, interacting with teachers, exploring
                  materials and enjoying time with their friends.
                </p>

                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                  These moments reflect the balance of guided learning,
                  creativity, movement, celebration and care that children
                  experience at our Sector 12B centre.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-purple-800"
                  >
                    Plan a School Visit
                    <ArrowRight size={17} />
                  </Link>

                  <a
                    href="https://wa.me/919667038673?text=Hello%20Kidzee%20Sector%2012%20Dwarka%2C%20I%20would%20like%20to%20visit%20the%20preschool."
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:bg-purple-50"
                  >
                    <MessageCircle size={17} />
                    Enquire on WhatsApp
                  </a>
                </div>
              </div>

              <div className="relative">
                <div className="absolute -left-6 -top-6 h-24 w-24 rounded-[30px] bg-yellow-300/60" />
                <div className="absolute -bottom-6 -right-6 h-32 w-32 rounded-full bg-purple-300/30" />

                <div className="relative overflow-hidden rounded-[38px] border-8 border-white bg-white shadow-2xl shadow-purple-950/10">
                  <Image
                    src="/images/gallery/gallery-main.jpg"
                    alt="Children learning and playing at Kidzee Sector 12 Dwarka"
                    width={1000}
                    height={800}
                    priority
                    className="h-[470px] w-full object-cover sm:h-[570px]"
                  />

                  <div className="absolute bottom-5 left-5 right-5 rounded-[24px] border border-white/60 bg-white/90 p-5 shadow-xl backdrop-blur">
                    <div className="flex items-start gap-4">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-purple-950">
                        <Camera size={21} />
                      </span>

                      <div>
                        <p className="text-sm font-black text-purple-800">
                          Real experiences, not staged moments
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          Photographs from classroom learning, play, events and
                          everyday centre life.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Gallery Categories */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">What you will see</span>

              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Different parts of a child’s day, captured naturally.
              </h2>

              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                Our gallery includes more than special events. It also reflects
                the small everyday experiences through which children build
                confidence and understanding.
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {galleryCategories.map((category) => {
                const Icon = category.icon;

                return (
                  <article
                    key={category.title}
                    className="rounded-[30px] border border-purple-100 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/5"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                      <Icon size={26} strokeWidth={1.8} />
                    </span>

                    <h3 className="mt-6 text-xl font-black text-slate-950">
                      {category.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {category.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Main Gallery Grid */}
        <section className="section bg-white">
          <div className="container">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <span className="eyebrow">Photo gallery</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Learning and happiness in everyday moments.
                </h2>

                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">
                  Browse photographs from classroom activities, creative
                  experiences, play sessions, celebrations and daycare.
                </p>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-purple-50 px-4 py-2 text-sm font-black text-purple-800">
                <ImageIcon size={17} />
                {galleryImages.length} centre moments
              </div>
            </div>

            <div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
              {galleryImages.map((image, index) => (
                <article
                  key={image.src}
                  className="group relative mb-5 break-inside-avoid overflow-hidden rounded-[30px] bg-slate-100"
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    width={900}
                    height={1100}
                    className={`${getImageHeight(
                      image.size,
                    )} w-full object-cover transition duration-700 group-hover:scale-[1.04]`}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/5 to-transparent opacity-90" />

                  <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-5">
                    <span className="rounded-full border border-white/30 bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] text-purple-800 backdrop-blur">
                      {image.category}
                    </span>

                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-slate-950/20 text-xs font-black text-white backdrop-blur">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-xl font-black text-white">
                      {image.title}
                    </h3>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Why Photos Matter */}
        <section className="section bg-purple-950 text-white">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
              <div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                  Beyond photographs
                </span>

                <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">
                  Every picture represents a learning experience.
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
                  Children may appear to be simply painting, building, dancing
                  or playing, but these moments also support communication,
                  coordination, imagination, patience and social confidence.
                </p>

                <p className="mt-5 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">
                  Teachers observe and guide these experiences so children can
                  explore freely while still receiving age-appropriate support.
                </p>

                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                  {[
                    "Language and communication",
                    "Creative thinking",
                    "Physical coordination",
                    "Friendship and cooperation",
                    "Confidence and independence",
                    "Curiosity and exploration",
                  ].map((item) => (
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
                  <Heart size={28} />
                </span>

                <h3 className="mt-6 text-2xl font-black">
                  Respectful use of children’s photographs
                </h3>

                <p className="mt-4 text-sm leading-7 text-purple-100 sm:text-base">
                  Photographs on the website should be selected carefully and
                  used only with appropriate parent consent. Images should
                  reflect children naturally and respectfully.
                </p>

                <div className="mt-7 rounded-[24px] border border-white/10 bg-white/10 p-5">
                  <p className="text-sm font-black text-yellow-300">
                    Use genuine school photographs
                  </p>

                  <p className="mt-2 text-sm leading-7 text-purple-100">
                    Replace every gallery placeholder with real centre
                    photographs. Do not use AI-generated children or altered
                    faces.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Instagram Section */}
        <section className="section bg-white">
          <div className="container">
            <div className="overflow-hidden rounded-[40px] border border-purple-100 bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_50%,#fff9e7_100%)] px-7 py-10 sm:px-10 sm:py-12 lg:px-14">
              <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
                <div>
                  <span className="eyebrow">More centre moments</span>

                  <h2 className="mt-5 max-w-3xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                    Follow our latest activities and celebrations.
                  </h2>

                  <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600">
                    Visit our Instagram page for recent classroom activities,
                    event highlights, parent moments and everyday updates from
                    Kidzee Sector 12, Dwarka.
                  </p>
                </div>

                <a
                  href="https://www.instagram.com/kidz.eedwarka"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white transition hover:-translate-y-0.5 hover:bg-purple-800"
                >
                  View Instagram
                  <ArrowRight size={17} />
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Visit CTA */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
              <div className="order-2 lg:order-1">
                <span className="eyebrow">See the centre personally</span>

                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
                  Photographs are helpful. A school visit shows you much more.
                </h2>

                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">
                  Visit the centre to experience the classroom atmosphere,
                  explore the learning and play spaces, meet the team and
                  understand the daily routine.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/contact"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-purple-700 px-7 py-3.5 text-sm font-black text-white transition hover:bg-purple-800"
                  >
                    Book a School Visit
                    <ArrowRight size={17} />
                  </Link>

                  <Link
                    href="/admissions"
                    className="inline-flex min-h-12 items-center justify-center rounded-full border border-purple-200 bg-white px-7 py-3.5 text-sm font-black text-purple-800 transition hover:bg-purple-50"
                  >
                    Explore Admissions
                  </Link>
                </div>
              </div>

              <div className="order-1 grid grid-cols-2 gap-4 lg:order-2">
                <Image
                  src="/images/gallery/gallery-13.jpg"
                  alt="Preschool classroom at Kidzee Sector 12 Dwarka"
                  width={700}
                  height={900}
                  className="h-[410px] w-full rounded-[30px] object-cover"
                />

                <div className="grid gap-4 pt-10">
                  <Image
                    src="/images/gallery/gallery-14.jpg"
                    alt="Children enjoying a preschool activity in Dwarka"
                    width={700}
                    height={500}
                    className="h-[190px] w-full rounded-[30px] object-cover"
                  />

                  <div className="flex h-[190px] flex-col justify-between rounded-[30px] bg-yellow-300 p-6 text-purple-950">
                    <Users size={29} />

                    <div>
                      <p className="text-3xl font-black">3-Day</p>
                      <p className="mt-1 text-sm font-black">
                        Preschool trial available
                      </p>
                    </div>
                  </div>
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