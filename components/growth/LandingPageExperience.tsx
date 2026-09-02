"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  GraduationCap,
  HelpCircle,
  Medal,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  Trophy,
  Users,
  Utensils,
  Video,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useEffect, useMemo, useState } from "react";

import AdmissionForm from "@/components/AdmissionForm";
import CareerApplicationForm from "@/components/careers/CareerApplicationForm";
import { useSiteContact } from "@/components/SiteContactProvider";

type Content = {
  badge?: string;
  heading?: string;
  highlight?: string;
  description?: string;
  bullets?: string[];
  primaryCta?: string;
  secondaryCta?: string;
  programme?: string;
  enquiryType?: string;
  offerText?: string;
  reviewVideoUrl?: string;
  reviewVideoTitle?: string;
  campusPhotos?: Array<{ src: string; title: string; subtitle?: string; tag?: string }>;
};

type Variant = {
  id: string;
  variantKey: string;
  name: string;
  content: Content;
  allocation: number;
};

type Experiment = {
  id: string;
  variants: Array<{ allocation: number; variant: Variant }>;
} | null;

const nationalStats = [
  {
    icon: Trophy,
    number: "2,000+",
    label: "Centres Across India",
    sub: "750+ Cities Nationwide",
  },
  {
    icon: GraduationCap,
    number: "20+ Lakh",
    label: "Children Nurtured",
    sub: "India's #1 Preschool Network",
  },
  {
    icon: Award,
    number: "20+ Years",
    label: "Of Proven Excellence",
    sub: "Pioneering Early Education",
  },
  {
    icon: BookOpen,
    number: "Péntemind",
    label: "Proprietary Pedagogy",
    sub: "8-Domain Brain Development",
  },
];

const awards = [
  {
    title: "India's Most Trusted Preschool Brand",
    org: "The Brand Trust Report — India Study",
  },
  {
    title: "Best Early Childhood Education Chain",
    org: "National Education Excellence Awards",
  },
  {
    title: "Franchisor of the Year (Preschools)",
    org: "Franchise India & Zee Learn Legacy",
  },
];

const campusPhotos = [
  {
    src: "/images/hero/hero-classroom.jpg",
    title: "Air-Conditioned Activity Classrooms",
    subtitle: "Low 1:8 teacher-student ratio with child-safe soft furniture & sensory learning tools",
    tag: "Activity Classrooms",
  },
  {
    src: "/images/hero/hero-main.jpg",
    title: "Indoor Soft Play & Activity Zone",
    subtitle: "Ball pool, gross motor skill development toys & safe padded activity flooring",
    tag: "Indoor Play Zone",
  },
  {
    src: "/images/about/about-main.jpg",
    title: "Extended Daycare & Rest Zone",
    subtitle: "Clean, hygienic nap spaces & daily freshly cooked warm meals till 7:00 PM",
    tag: "Daycare & Nap Rooms",
  },
  {
    src: "/images/programmes/nursery.jpg",
    title: "Early Literacy & Creative Discovery",
    subtitle: "Interactive storytelling, phonics, color discovery & foundational Péntemind skills",
    tag: "Experiential Learning",
  },
  {
    src: "/images/programmes/daycare.jpg",
    title: "Loving & Attentive Caregivers",
    subtitle: "Dedicated, background-verified teachers and warm support staff for toddlers",
    tag: "Safety & Warmth",
  },
];

const comparisonPillars = [
  {
    feature: "Brand Heritage & Pedagogy",
    kidzee: "India's #1 Network (2,000+ Centres) & Péntemind Curriculum",
    others: "Unrecognized local playschool with no structured syllabus",
  },
  {
    feature: "Teacher-Student Ratio",
    kidzee: "Low 1:8 Ratio (Playgroup/Nursery) — Dedicated Attention",
    others: "Overcrowded 1:20+ ratio with minimal supervision",
  },
  {
    feature: "Admission Fee Offer",
    kidzee: "Flat 30% Off on Annual Fees for Playgroup & Nursery",
    others: "Full rigid fees with non-refundable charges",
  },
  {
    feature: "Safety & Premises",
    kidzee: "24/7 CCTV Monitored Secure Premises + Verified Staff",
    others: "Unmonitored shared residential basements",
  },
  {
    feature: "Extended Daycare & Meals",
    kidzee: "Open till 7:00 PM with fresh, warm, hygienic meals daily",
    others: "Closes early (2-4 PM), packed or cold food",
  },
  {
    feature: "Trial Experience",
    kidzee: "Complimentary 3-Day Preschool Trial & Transition",
    others: "Direct admission with zero transition support",
  },
];

const parentTestimonials = [
  {
    name: "Shailja Singh",
    child: "Verified Google Review ★★★★★",
    rating: 5,
    quote:
      "I am fully satisfied with the school in every manner—learning, communication and safety. All the teachers treat children very nicely, and my daughter is growing here.",
  },
  {
    name: "Komal Gahlot",
    child: "Verified Google Review ★★★★★",
    rating: 5,
    quote:
      "The preschool is trustworthy. The teachers share weekly feedback and regularly update parents about activities.",
  },
  {
    name: "Ritu Singh",
    child: "Verified Google Review ★★★★★",
    rating: 5,
    quote:
      "Children learn through the play-way method. The environment is clean, the staff are friendly, and I am very happy to send my child to this school.",
  },
];

const faqs = [
  {
    q: "Why choose Kidzee Sector 12 Dwarka over local play schools?",
    a: "You get the best of both worlds: The national credibility and research-backed Péntemind curriculum of India's largest preschool network (2,000+ centres), combined with our Sector 12 centre's attentive 1:8 teacher ratio, 24/7 CCTV, and extended daycare till 7 PM.",
  },
  {
    q: "What is the 30% Annual Fee Offer for Playgroup and Nursery?",
    a: "For the academic session 2026–27, we are offering a flat 30% discount on the annual fee for Playgroup and Nursery admissions when you book a campus visit through this page.",
  },
  {
    q: "What is the Teacher-Student ratio at Kidzee Sector 12 Dwarka?",
    a: "We maintain a low 1:8 ratio for Playgroup & Nursery (1 teacher for every 8 children) and 1:10 for Kindergarten, ensuring every child receives attentive, individualized care and guidance.",
  },
  {
    q: "What are the school and daycare timings?",
    a: "Preschool operates from 8:30 AM to 1:00 PM (Monday to Friday). Extended daycare operates from 12:30 PM to 7:00 PM (Monday to Saturday) with freshly cooked warm meals and dedicated rest areas.",
  },
  {
    q: "Is there a trial period available before final admission?",
    a: "Yes! We offer a complimentary 3-day preschool trial experience so your child can settle in comfortably and you can experience our teaching methodology firsthand.",
  },
];

function getInstagramShortcode(url: string) {
  if (!url) return "";
  try {
    const match = url.match(/\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : "";
  } catch {
    return "";
  }
}

function getYouTubeEmbedUrl(url: string) {
  if (!url) return "";
  try {
    if (url.includes("youtube.com/embed/")) return url;
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (url.includes("youtube.com/shorts/")) {
      const id = url.split("youtube.com/shorts/")[1]?.split("?")[0];
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
    if (url.includes("youtube.com/watch")) {
      const urlObj = new URL(url);
      const id = urlObj.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : "";
    }
  } catch {
    return "";
  }
  return "";
}

function anonymousBucket(key: string) {
  let id = "";
  try {
    id = localStorage.getItem("kidzee-website-visitor-id") || "";
  } catch {
    /* fallback */
  }
  const input = `${id || key}|${key}`;
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % 100;
}

export default function LandingPageExperience({
  page,
  variants,
  experiment,
}: {
  page: {
    id: string;
    slug: string;
    name: string;
    pageType: string;
    content: Content;
  };
  variants: Variant[];
  experiment: Experiment;
}) {
  const site = useSiteContact();
  const eligible = useMemo(
    () =>
      experiment?.variants.map((item) => ({
        ...item.variant,
        allocation: item.allocation,
      })) ?? variants.filter((item) => item.allocation > 0),
    [experiment, variants],
  );

  const [selected, setSelected] = useState<Variant>(
    () =>
      eligible[0] ?? {
        id: "",
        variantKey: "A",
        name: "Original",
        content: page.content,
        allocation: 100,
      },
  );

  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPhotoPaused, setIsPhotoPaused] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Fast auto-playing slideshow: transitions every 2.5 seconds
  useEffect(() => {
    if (isPhotoPaused) return;
    const interval = setInterval(() => {
      setActivePhotoIndex((prev) => (prev + 1) % activePhotos.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isPhotoPaused]);

  useEffect(() => {
    const bucket = anonymousBucket(
      `${page.id}:${experiment?.id ?? "default"}`,
    );
    let cumulative = 0;
    const variant =
      eligible.find((item) => {
        cumulative += item.allocation;
        return bucket < cumulative;
      }) ?? eligible[eligible.length - 1];
    if (variant) setSelected(variant);
  }, [eligible, experiment?.id, page.id]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("kidzee:website-event", {
        detail: {
          eventType: "LANDING_VARIANT_VIEW",
          eventName: page.slug,
          targetText: selected.variantKey,
          landingPageId: page.id,
          landingVariantId: selected.id,
          growthExperimentId: experiment?.id ?? "",
        },
      }),
    );
  }, [experiment?.id, page.id, page.slug, selected.id, selected.variantKey]);

  const content = selected.content?.heading ? selected.content : page.content;
  const activePhotos = content.campusPhotos && content.campusPhotos.length > 0 ? content.campusPhotos : campusPhotos;
  const videoUrl = content.reviewVideoUrl ?? "";
  const instagramShortcode = getInstagramShortcode(videoUrl);
  const embedUrl = getYouTubeEmbedUrl(videoUrl);
  const isDirectVideo =
    Boolean(videoUrl) &&
    !instagramShortcode &&
    !embedUrl &&
    (videoUrl.includes(".mp4") ||
      videoUrl.includes(".webm") ||
      videoUrl.includes("firebasestorage") ||
      videoUrl.includes("storage.googleapis.com") ||
      videoUrl.includes("/uploads/") ||
      videoUrl.startsWith("http") ||
      videoUrl.startsWith("/"));

  return (
    <div className="min-h-screen bg-[#FAF7FC] text-[#281034] font-sans antialiased selection:bg-[#5B2A86] selection:text-white">
      {/* Top Special Offer Banner */}
      <div className="bg-gradient-to-r from-[#5B2A86] via-[#7B3FA2] to-[#5B2A86] px-4 py-2 text-center text-xs sm:text-sm font-bold text-white shadow-sm">
        <span className="inline-flex items-center gap-2">
          <span>🎉</span>
          <span>
            {content.offerText ||
              "Limited Time Offer: Flat 30% Off Annual Fee on Playgroup & Nursery Admissions (2026–27) | Complimentary 3-Day Trial"}
          </span>
        </span>
      </div>

      {/* Floating Trust Header */}
      <header className="sticky top-0 z-40 border-b border-purple-100 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/images/kidzee-logo.png"
              alt="Kidzee Sector 12 Dwarka"
              width={125}
              height={42}
              className="h-9 w-auto object-contain"
              priority
            />
            <span className="rounded-full bg-[#FAF4FF] px-2.5 py-1 text-[11px] font-bold text-[#5B2A86] border border-purple-100">
              Sector 12, Dwarka
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span>4.9 / 5 Google Reviews</span>
            </div>

            <a
              href={`tel:${site.phone}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#5B2A86] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[#471E6C]"
            >
              <Phone size={14} />
              <span>{site.phoneDisplay}</span>
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF4FF] via-white to-[#FAF7FC] py-8 sm:py-12">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:items-start">
          {/* Left Column: Value Prop */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D7EB] bg-white px-3.5 py-1.5 text-xs font-black text-[#5B2A86] shadow-xs">
              <Sparkles size={14} className="text-amber-500" />
              <span>{content.badge || "India's #1 Preschool Network — Sector 12 Dwarka"}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight tracking-tight text-[#281034]">
              {content.heading || "Give Your Child The Best Start in"}{" "}
              <span className="text-[#5B2A86] underline decoration-[#F6C84B] decoration-4 underline-offset-4">
                {content.highlight || "Sector 12, Dwarka"}
              </span>
            </h1>

            <p className="text-base sm:text-lg leading-relaxed text-gray-700 font-medium">
              {content.description ||
                "Admissions open for Playgroup, Nursery, Junior KG & Senior KG (2026–27). Low 1:8 teacher-student ratio, air-conditioned activity rooms, and extended daycare till 7:00 PM with fresh warm meals."}
            </p>

            {/* Admissions 2026-27 Trust Highlights */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs font-bold text-[#5B2A86]">
              <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1">✓ Playgroup (2 – 3 Years)</span>
              <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1">✓ Nursery (3 – 4 Years)</span>
              <span className="rounded-full bg-purple-50 border border-purple-200 px-3 py-1">✓ Junior & Senior KG (4 – 6 Years)</span>
            </div>

            {/* 4 Distinct Value Cards */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-purple-100 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-[#5B2A86]">
                  <Users size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Low 1:8 Ratio</h3>
                  <p className="text-[11px] sm:text-xs text-gray-500">Dedicated individual care & milestone tracking</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-purple-100 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">24/7 CCTV Monitored</h3>
                  <p className="text-[11px] sm:text-xs text-gray-500">Secure premises & verified caregivers</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-purple-100 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                  <Clock3 size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">Daycare Till 7 PM</h3>
                  <p className="text-[11px] sm:text-xs text-gray-500">Fresh warm meals & quiet nap rooms</p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white p-3.5 border border-purple-100 shadow-2xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <Utensils size={18} />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-gray-900">AC Activity Rooms</h3>
                  <p className="text-[11px] sm:text-xs text-gray-500">Péntemind sensory play & soft toys</p>
                </div>
              </div>
            </div>

            {/* Direct Action Row with Equal 50/50 Balanced Width */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#1FAF38] py-3.5 px-3 text-xs sm:text-sm font-bold text-white shadow-sm transition duration-150 hover:bg-[#19922F] hover:shadow-md text-center"
              >
                <FaWhatsapp size={18} className="shrink-0" />
                <span className="truncate">Chat on WhatsApp</span>
              </a>

              <a
                href={`tel:${site.phone}`}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 px-3 text-xs sm:text-sm font-bold text-[#5B2A86] border-2 border-purple-200 shadow-2xs transition duration-150 hover:bg-purple-50 hover:border-purple-300 hover:shadow-sm text-center"
              >
                <Phone size={16} className="shrink-0" />
                <span className="truncate">Call Admissions</span>
              </a>
            </div>
          </div>

          {/* Right Column: Admission Lead Form */}
          <div id="ad-enquiry" className="scroll-mt-24">
            {page.pageType === "RECRUITMENT" ? (
              <CareerApplicationForm />
            ) : (
              <AdmissionForm
                title="Book Campus Visit & Claim 30% Off"
                subtitle="Experience classrooms, meet educators, and claim 30% off annual fee."
                badgeText="Admissions Desk 2026–27"
                submitButtonText="Book Campus Visit & Claim 30% Off"
                initialProgramme={
                  content.programme || (page.pageType === "DAYCARE" ? "DAYCARE" : "")
                }
                initialEnquiryType={
                  content.enquiryType ||
                  (page.pageType === "DAYCARE" ? "DAYCARE" : "SCHOOL_VISIT")
                }
                landingPageId={page.id}
                landingVariantId={selected.id}
                growthExperimentId={experiment?.id ?? ""}
              />
            )}
          </div>
        </div>
      </section>

      {/* National Network Credibility & Legacy Ribbon */}
      <section className="border-y border-purple-100 bg-[#5B2A86] py-10 text-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-purple-200 backdrop-blur-sm">
              <Medal size={14} className="text-amber-400" />
              India's #1 & Largest Preschool Network
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-white">
              The Power of Kidzee's National Legacy
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {nationalStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="flex flex-col items-center justify-center rounded-2xl bg-white/10 p-5 text-center backdrop-blur-sm border border-white/10"
                >
                  <Icon size={26} className="text-[#F6C84B] mb-2" />
                  <p className="text-2xl sm:text-3xl font-black text-white">{stat.number}</p>
                  <p className="mt-1 text-xs sm:text-sm font-bold text-purple-100">{stat.label}</p>
                  <p className="text-[11px] text-purple-300">{stat.sub}</p>
                </div>
              );
            })}
          </div>

          {/* National Awards Bar */}
          <div className="mt-8 rounded-2xl bg-white/5 p-4 border border-white/10">
            <div className="grid gap-4 sm:grid-cols-3 text-center">
              {awards.map((award) => (
                <div key={award.title} className="p-2">
                  <div className="flex items-center justify-center gap-1.5 text-[#F6C84B] text-xs font-black">
                    <Trophy size={14} />
                    <span>AWARD WINNER</span>
                  </div>
                  <h4 className="mt-1 text-xs sm:text-sm font-bold text-white">{award.title}</h4>
                  <p className="text-[10px] text-purple-200 mt-0.5">{award.org}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Auto-Playing Dynamic Campus Photo Slideshow */}
      <section className="bg-[#FAF7FC] py-12 sm:py-16 border-b border-purple-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#5B2A86]">
              <Sparkles size={14} className="text-amber-500" />
              Live Campus Walkthrough
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#281034]">
              Safe, Joyous & Inspiring Spaces
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Watch our Sector 12B Dwarka campus facilities designed specifically for early toddler discovery.
            </p>
          </div>

          {/* Main Slideshow Container */}
          <div
            className="relative overflow-hidden rounded-3xl border-2 border-purple-200 bg-[#281034] shadow-2xl transition duration-500"
            onMouseEnter={() => setIsPhotoPaused(true)}
            onMouseLeave={() => setIsPhotoPaused(false)}
          >
            {/* Active Slide Image */}
            <div className="relative aspect-16/10 sm:aspect-16/9 w-full overflow-hidden bg-gray-900">
              {activePhotos.map((photo, idx) => (
                <div
                  key={photo.title}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    idx === activePhotoIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
                  }`}
                >
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    priority={idx === 0}
                    className="object-cover"
                  />
                  {/* Subtle Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#180822]/90 via-[#180822]/25 to-transparent" />
                  
                  {/* Tag Badge */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1 text-xs font-black text-[#5B2A86] shadow-md backdrop-blur-sm">
                      📍 {photo.tag}
                    </span>
                  </div>

                  {/* Caption Box */}
                  <div className="absolute bottom-0 left-0 right-0 z-20 p-5 sm:p-8 text-white">
                    <h3 className="text-lg sm:text-2xl font-black tracking-tight drop-shadow-md">
                      {photo.title}
                    </h3>
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-purple-100 max-w-2xl font-medium drop-shadow-sm">
                      {photo.subtitle}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Prev / Next Arrows */}
            <button
              type="button"
              onClick={() =>
                setActivePhotoIndex(
                  (prev) => (prev - 1 + activePhotos.length) % activePhotos.length,
                )
              }
              className="absolute left-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/80 text-[#5B2A86] shadow-lg backdrop-blur-md transition hover:bg-white hover:scale-110 focus:outline-none"
              aria-label="Previous photograph"
            >
              ❮
            </button>
            <button
              type="button"
              onClick={() =>
                setActivePhotoIndex((prev) => (prev + 1) % activePhotos.length)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 z-30 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/80 text-[#5B2A86] shadow-lg backdrop-blur-md transition hover:bg-white hover:scale-110 focus:outline-none"
              aria-label="Next photograph"
            >
              ❯
            </button>

            {/* Progress Dots */}
            <div className="absolute bottom-3 right-4 sm:bottom-4 sm:right-6 z-30 flex items-center gap-2">
              {activePhotos.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => setActivePhotoIndex(dotIdx)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    dotIdx === activePhotoIndex
                      ? "w-8 bg-[#F6C84B]"
                      : "w-2 bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to slide ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Interactive Thumbnail Bar */}
          <div className="mt-4 grid grid-cols-5 gap-2 sm:gap-3">
            {activePhotos.map((thumb, tIdx) => (
              <button
                key={thumb.title}
                type="button"
                onClick={() => setActivePhotoIndex(tIdx)}
                className={`relative aspect-16/10 overflow-hidden rounded-xl border-2 transition duration-200 ${
                  tIdx === activePhotoIndex
                    ? "border-[#5B2A86] scale-102 shadow-md ring-2 ring-[#F6C84B]"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Image
                  src={thumb.src}
                  alt={thumb.title}
                  fill
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Dual Parent Review Video Reels Showcase */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#5B2A86]">
              <Video size={15} />
              Parent Video Stories
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#281034]">
              Hear Directly From Our Parents
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Watch authentic video experiences of Dwarka families who chose Kidzee Sector 12.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {/* Reel 1: Aashvi's Mother */}
            <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-purple-200 bg-[#281034] shadow-xl">
              <div className="p-4 pb-2 border-b border-purple-900/60 bg-gradient-to-r from-[#3B174F] to-[#281034]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F6C84B] px-2.5 py-0.5 text-[10px] font-black text-[#281034]">
                    ❤️ Nursery Review
                  </span>
                  <div className="flex text-amber-400">
                    <Star size={12} className="fill-amber-400" />
                    <Star size={12} className="fill-amber-400" />
                    <Star size={12} className="fill-amber-400" />
                    <Star size={12} className="fill-amber-400" />
                    <Star size={12} className="fill-amber-400" />
                  </div>
                </div>
                <h3 className="mt-2 text-base font-bold text-white">Voices of Our Parents: Aashvi</h3>
                <p className="text-xs text-purple-200">Teacher care, daily learning & happiness</p>
              </div>
              <div className="relative aspect-[9/14] sm:aspect-[9/13] w-full bg-black flex items-center justify-center">
                <video
                  src="/videos/aashvi-nursery-review.mp4"
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>

            {/* Reel 2: Playschool Search & Safety */}
            <div className="flex flex-col overflow-hidden rounded-3xl border-2 border-purple-200 bg-[#281034] shadow-xl">
              <div className="p-4 pb-2 border-b border-purple-900/60 bg-gradient-to-r from-[#3B174F] to-[#281034]">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#F6C84B] px-2.5 py-0.5 text-[10px] font-black text-[#281034]">
                    🔒 Safety & Progress
                  </span>
                  <div className="flex text-amber-400">
                    <Star size={12} className="fill-amber-400" />
                    <Star size={12} className="fill-amber-400" />
                    <Star size={12} className="fill-amber-400" />
                    <Star size={12} className="fill-amber-400" />
                    <Star size={12} className="fill-amber-400" />
                  </div>
                </div>
                <h3 className="mt-2 text-base font-bold text-white">Why We Chose Kidzee Sector 12</h3>
                <p className="text-xs text-purple-200">Playschool search, safety & 1-month progress</p>
              </div>
              <div className="relative aspect-[9/14] sm:aspect-[9/13] w-full bg-black flex items-center justify-center">
                <video
                  src="/videos/playschool-security-review.mp4"
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Kidzee Sector 12 Advantage */}
      <section className="bg-[#FAF4FF] py-12 sm:py-16 border-t border-purple-100">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-[#5B2A86]">
              The Kidzee Advantage
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#281034]">
              Why Parents Choose Kidzee Sector 12
            </h2>
          </div>

          <div className="overflow-hidden rounded-2xl border border-purple-200/80 bg-white shadow-sm">
            <div className="grid grid-cols-3 bg-[#5B2A86] p-4 text-xs sm:text-sm font-bold text-white">
              <div>Pillar</div>
              <div className="text-amber-300">Kidzee Sector 12 Dwarka</div>
              <div className="text-purple-200">Other Local Play Schools</div>
            </div>

            <div className="divide-y divide-gray-100">
              {comparisonPillars.map((row) => (
                <div key={row.feature} className="grid grid-cols-3 p-4 text-xs sm:text-sm items-center">
                  <div className="font-bold text-gray-900 pr-2">{row.feature}</div>
                  <div className="font-semibold text-[#5B2A86] pr-2 flex items-start gap-1.5">
                    <Check size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>{row.kidzee}</span>
                  </div>
                  <div className="text-gray-500">{row.others}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Verified Parent Reviews */}
      <section className="bg-white py-12 sm:py-16 border-t border-gray-100">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-[#5B2A86]">
              Parent Feedback
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#281034]">
              Loved by Dwarka Parents
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {parentTestimonials.map((review) => (
              <div
                key={review.name}
                className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-[#FAF7FC] p-6 shadow-xs"
              >
                <div>
                  <div className="flex gap-1 text-amber-400 mb-3">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star key={i} size={16} className="fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm leading-relaxed text-gray-700 italic">
                    "{review.quote}"
                  </p>
                </div>

                <div className="mt-6 border-t border-purple-100 pt-3">
                  <p className="text-sm font-bold text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-500">{review.child}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Minimized / Collapsible FAQ Accordion Section */}
      <section className="bg-[#FAF4FF] py-10 sm:py-14 border-t border-purple-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-black uppercase tracking-wider text-[#5B2A86]">
              Got Questions?
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-black text-[#281034]">
              Frequently Asked Questions
            </h2>
            <p className="mt-1 text-xs text-gray-500">Tap on any question below to expand the answer</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={faq.q}
                  className="rounded-2xl border border-purple-200/70 bg-white overflow-hidden shadow-2xs transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4 sm:p-5 text-left transition hover:bg-purple-50/50"
                  >
                    <span className="text-xs sm:text-sm font-bold text-gray-900 pr-4 flex items-center gap-2.5">
                      <HelpCircle size={16} className="text-[#5B2A86] shrink-0" />
                      {faq.q}
                    </span>
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[#5B2A86] transition-transform duration-200 ${isOpen ? "rotate-180 bg-[#5B2A86] text-white" : ""}`}>
                      <ChevronDown size={15} />
                    </span>
                  </button>
                  {isOpen ? (
                    <div className="border-t border-purple-100 bg-[#FAF7FC] px-5 py-4 text-xs sm:text-sm leading-relaxed text-gray-700">
                      {faq.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="bg-[#281034] py-10 text-white text-center">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="text-2xl sm:text-3xl font-black">
            Give Your Child the Kidzee Advantage in Dwarka
          </h2>
          <p className="mt-2 text-sm text-purple-200 max-w-xl mx-auto">
            Book your guided school walkthrough and claim your 30% annual fee offer today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="#ad-enquiry"
              className="rounded-full bg-[#F6C84B] px-7 py-3 text-sm font-black text-[#281034] shadow-lg transition hover:bg-[#ebd532]"
            >
              Book Campus Visit & Claim 30% Off
            </a>
            <a
              href={`tel:${site.phone}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/20"
            >
              <Phone size={16} />
              <span>Call: {site.phoneDisplay}</span>
            </a>
          </div>

          {/* Compliance & Location Footer */}
          <div className="mt-10 border-t border-white/10 pt-6 text-xs text-purple-300 space-y-2">
            <p className="font-semibold text-purple-200">
              Kidzee Preschool & Daycare — Plot 16, Pocket 2, Sector 12B, Dwarka, New Delhi 110078
            </p>
            <p className="text-[11px] text-purple-400">
              *Flat 30% discount applies to annual fees for Playgroup & Nursery admissions for Academic Session 2026–27.
            </p>
            <div className="flex justify-center gap-4 pt-2 text-[11px] text-purple-300">
              <Link href="/privacy-policy" className="underline hover:text-white">
                Privacy Policy
              </Link>
              <span>•</span>
              <Link href="/terms" className="underline hover:text-white">
                Terms of Service
              </Link>
            </div>
            <p className="text-[10px] text-purple-400 pt-2">
              © {new Date().getFullYear()} Kidzee Sector 12 Dwarka. All rights reserved.
            </p>
          </div>
        </div>
      </section>

      {/* Sticky Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-between gap-2 border-t border-purple-200 bg-white p-3 shadow-2xl md:hidden">
        <a
          href={`tel:${site.phone}`}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 py-3 text-xs font-bold text-[#5B2A86]"
        >
          <Phone size={15} />
          <span>Call Now</span>
        </a>

        <a
          href="#ad-enquiry"
          className="flex flex-2 items-center justify-center gap-1.5 rounded-xl bg-[#5B2A86] py-3 text-xs font-extrabold text-white shadow-sm"
        >
          <span>Claim 30% Off & Book Visit</span>
        </a>
      </div>
    </div>
  );
}
