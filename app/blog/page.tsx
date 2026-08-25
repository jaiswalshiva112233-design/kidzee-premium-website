import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  HeartHandshake,
  Lightbulb,
  MessageCircle,
  Sparkles,
} from "lucide-react";

import PageShell from "@/components/PageShell";
import type { BlogArticle } from "@/lib/blog";
import { getPublishedBlogArticles } from "@/lib/sanity/blog";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildWebsitePageMetadata } from "@/lib/sanity/seo";
import { posts } from "@/lib/site";
import { buildSiteContact } from "@/lib/siteContact";

export async function generateMetadata(): Promise<Metadata> {
  return buildWebsitePageMetadata({
    pageKey: "blog",
    path: "/blog",
    title: "Parent Resources",
    description:
      "Practical early-years guidance from Kidzee Sector 12, Dwarka on preschool readiness, routines, play-based learning, social skills and child development.",
    keywords: [
      "preschool parenting tips",
      "preschool readiness guide",
      "early childhood development tips",
      "parent resources Dwarka",
      "choosing preschool in Dwarka",
      "play based learning",
      "Kidzee Sector 12 Dwarka blog",
    ],
    socialImage: "/images/hero/hero-classroom.jpg",
    socialImageAlt: "Parent resources from Kidzee Sector 12 Dwarka",
  });
}

const articleMeta: Record<
  string,
  {
    category: string;
    readTime: string;
    icon: typeof BookOpen;
    featured?: boolean;
  }
> = {
  "prepare-your-child-for-preschool": {
    category: "Starting Preschool",
    readTime: "6 min read",
    icon: HeartHandshake,
    featured: true,
  },
  "signs-child-is-ready-for-preschool": {
    category: "Preschool Readiness",
    readTime: "6 min read",
    icon: CheckCircle2,
  },
  "play-based-learning": {
    category: "Early Learning",
    readTime: "5 min read",
    icon: Sparkles,
  },
  "choosing-preschool-in-dwarka": {
    category: "Choosing a Preschool",
    readTime: "7 min read",
    icon: Lightbulb,
  },
  "building-social-skills": {
    category: "Child Development",
    readTime: "5 min read",
    icon: MessageCircle,
  },
};

type DisplayPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  featured: boolean;
  coverImageUrl: string | null;
  coverImageAlt: string;
  icon: typeof BookOpen;
};

function readingTime(article: BlogArticle) {
  const words = [
    ...article.intro,
    ...article.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...section.bullets,
    ]),
    article.conclusion,
  ]
    .join(" ")
    .trim()
    .split(/\s+/).length;

  return `${Math.max(3, Math.ceil(words / 200))} min read`;
}

function combineArticles(managed: BlogArticle[]): DisplayPost[] {
  const managedSlugs = new Set(managed.map((article) => article.slug));
  const managedPosts = managed.map<DisplayPost>((article) => ({
    slug: article.slug,
    title: article.title,
    excerpt: article.excerpt,
    date: article.publishedAt,
    category: article.category,
    readTime: readingTime(article),
    featured: article.featured,
    coverImageUrl: article.coverImageUrl,
    coverImageAlt: article.coverImageAlt,
    icon: BookOpen,
  }));

  const protectedPosts = posts
    .filter((post) => !managedSlugs.has(post.slug))
    .map<DisplayPost>((post) => ({
      ...post,
      category: articleMeta[post.slug]?.category ?? "Parent Guide",
      readTime: articleMeta[post.slug]?.readTime ?? "5 min read",
      featured: articleMeta[post.slug]?.featured === true,
      coverImageUrl: null,
      coverImageAlt: post.title,
      icon: articleMeta[post.slug]?.icon ?? BookOpen,
    }));

  return [...managedPosts, ...protectedPosts];
}

const topics = [
  "Starting preschool",
  "Preschool readiness",
  "Play-based learning",
  "Social and emotional development",
  "Choosing the right preschool",
  "Building everyday routines",
];

export default async function BlogPage() {
  const [managedArticles, contactSettings] = await Promise.all([
    getPublishedBlogArticles(),
    getWebsiteContactSettings(),
  ]);
  const contact = buildSiteContact(contactSettings);
  const allPosts = combineArticles(managedArticles);
  const featuredPost =
    allPosts.find((post) => post.featured) ?? allPosts[0];
  const remainingPosts = allPosts.filter(
    (post) => post.slug !== featuredPost?.slug,
  );

  return (
    <PageShell>
      <main className="overflow-hidden">
        <section className="relative bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_55%,#fff7d7_100%)] pb-16 pt-[104px] sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
          <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />
          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              <span className="eyebrow">Parent resources</span>
              <h1 className="title mt-5">Practical guidance for the early years.</h1>
              <p className="lead mx-auto mt-6 max-w-3xl">
                Clear, realistic ideas to help parents understand preschool
                readiness, daily routines, play, confidence, communication and
                early childhood development.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                {["Practical advice", "Early-years guidance", "Parent-friendly reading"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/90 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-300 text-[10px] font-black text-purple-950">✓</span>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {featuredPost ? (
          <section className="section bg-white">
            <div className="container">
              <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="eyebrow">Featured parent guide</span>
                  <h2 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">A helpful place to begin</h2>
                </div>
                <Link href={`/blog/${featuredPost.slug}`} className="inline-flex items-center gap-2 text-sm font-black text-purple-700 transition hover:text-purple-900">
                  Read featured article <ArrowRight size={17} />
                </Link>
              </div>

              <article className="group overflow-hidden rounded-[36px] border border-purple-100 bg-[linear-gradient(135deg,#5b2a86_0%,#3f1766_100%)] text-white shadow-xl shadow-purple-950/10">
                <div className="grid min-h-[420px] lg:grid-cols-[0.9fr_1.1fr]">
                  <div className="relative flex min-h-72 items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_top_left,#7c3fb0_0%,#5b2a86_45%,#3d155f_100%)]">
                    {featuredPost.coverImageUrl ? (
                      <Image src={featuredPost.coverImageUrl} alt={featuredPost.coverImageAlt} fill sizes="(min-width: 1024px) 42vw, 100vw" className="object-cover" />
                    ) : (
                      <featuredPost.icon size={92} strokeWidth={1.5} className="text-yellow-300" />
                    )}
                  </div>
                  <div className="flex flex-col justify-center p-8 sm:p-10 lg:p-14">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="rounded-full bg-yellow-300 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-purple-950">{featuredPost.category}</span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-purple-100"><Clock3 size={14} />{featuredPost.readTime}</span>
                    </div>
                    <h3 className="mt-6 text-3xl font-black leading-tight sm:text-4xl">{featuredPost.title}</h3>
                    <p className="mt-5 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">{featuredPost.excerpt}</p>
                    <Link href={`/blog/${featuredPost.slug}`} className="mt-8 inline-flex min-h-12 w-fit items-center justify-center gap-2 rounded-full bg-yellow-300 px-7 py-3.5 text-sm font-black text-purple-950 transition hover:-translate-y-0.5 hover:bg-yellow-200">
                      Read the full guide <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </article>
            </div>
          </section>
        ) : null}

        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <span className="eyebrow">Explore all resources</span>
              <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">Helpful reading for everyday parenting questions.</h2>
              <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">Each guide focuses on practical situations parents commonly experience during the preschool years.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              {remainingPosts.map((post, index) => {
                const Icon = post.icon;
                return (
                  <article key={post.slug} className="group flex h-full flex-col overflow-hidden rounded-[32px] border border-purple-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-950/5">
                    {post.coverImageUrl ? (
                      <div className="relative aspect-[1.91/1] overflow-hidden bg-purple-50">
                        <Image src={post.coverImageUrl} alt={post.coverImageAlt} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.03]" />
                      </div>
                    ) : null}
                    <div className="flex flex-1 flex-col p-7 sm:p-8">
                      <div className="flex items-start justify-between gap-4">
                        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 transition group-hover:bg-purple-700 group-hover:text-white"><Icon size={26} strokeWidth={1.8} /></span>
                        <span className="text-sm font-black text-purple-200">{String(index + 1).padStart(2, "0")}</span>
                      </div>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span className="rounded-full bg-purple-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.13em] text-purple-800">{post.category}</span>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500"><Clock3 size={13} />{post.readTime}</span>
                      </div>
                      <h3 className="mt-5 text-2xl font-black leading-snug text-slate-950 sm:text-[26px]">{post.title}</h3>
                      <p className="mt-4 flex-1 text-sm leading-7 text-slate-600 sm:text-base">{post.excerpt}</p>
                      <Link href={`/blog/${post.slug}`} className="mt-7 inline-flex w-fit items-center gap-2 text-sm font-black text-purple-700 transition group-hover:text-purple-900">Read article <ArrowRight size={17} className="transition group-hover:translate-x-1" /></Link>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="hidden">
          <div className="container">
            <div className="grid items-center gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
              <div>
                <span className="eyebrow">What we write about</span>
                <h2 className="mt-5 text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">Guidance based on real questions parents often ask.</h2>
                <p className="mt-6 text-base leading-8 text-slate-600 sm:text-lg">Our resources explain early-years topics clearly without making parenting feel complicated or overly technical.</p>
                <p className="mt-5 text-base leading-8 text-slate-600 sm:text-lg">They help families make informed decisions, support their child’s development and approach preschool transitions with confidence.</p>
              </div>
              <div className="rounded-[36px] bg-[#fff9e7] p-7 sm:p-9">
                <div className="grid gap-4 sm:grid-cols-2">
                  {topics.map((topic, index) => (
                    <div key={topic} className="flex items-start gap-4 rounded-[24px] bg-white p-5 shadow-sm">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-yellow-300 text-sm font-black text-purple-950">{String(index + 1).padStart(2, "0")}</span>
                      <p className="pt-2 text-sm font-black leading-6 text-slate-800">{topic}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section bg-purple-950 text-white">
          <div className="container">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
              <div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-300">Need personal guidance?</span>
                <h2 className="mt-6 text-3xl font-black leading-tight sm:text-4xl lg:text-5xl">Visit the centre and discuss your child’s preschool journey.</h2>
                <p className="mt-6 max-w-2xl text-base leading-8 text-purple-100 sm:text-lg">A personal school visit helps parents understand the classroom, programme, routine and settling process more clearly.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link href="/admissions" className="inline-flex min-h-12 items-center justify-center rounded-full bg-yellow-300 px-7 py-3.5 text-sm font-black text-purple-950 transition hover:-translate-y-0.5 hover:bg-yellow-200">Explore Admissions</Link>
                  <Link href="/admissions?enquiry=SCHOOL_VISIT#admission-enquiry" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-black text-white transition hover:bg-white/15">Book a School Visit</Link>
                </div>
              </div>
              <div className="rounded-[34px] border border-white/15 bg-white/10 p-7 backdrop-blur sm:p-9">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-yellow-300 text-purple-950"><BookOpen size={28} /></div>
                <h3 className="mt-6 text-2xl font-black">Kidzee Sector 12, Dwarka</h3>
                <p className="mt-4 text-sm leading-7 text-purple-100">{contact.addressShort}</p>
                <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
                  <div className="flex items-center justify-between gap-4"><span className="text-sm text-purple-200">Programmes</span><span className="text-right text-sm font-bold text-white">Playgroup to Senior KG</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-sm text-purple-200">Daycare</span><span className="text-right text-sm font-bold text-white">{contact.daycareHours.display}</span></div>
                  <div className="flex items-center justify-between gap-4"><span className="text-sm text-purple-200">Trial</span><span className="text-right text-sm font-bold text-white">3-day trial available</span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
    </PageShell>
  );
}
