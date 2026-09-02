"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Clock3,
  HelpCircle,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
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

const campusPhotos = [
  {
    src: "/images/hero/hero-classroom.jpg",
    title: "Air-Conditioned Activity Classrooms",
    subtitle: "Low 1:8 student-teacher ratio & sensory learning tools",
  },
  {
    src: "/images/hero/hero-main.jpg",
    title: "Soft Play & Indoor Activity Zone",
    subtitle: "Ball pool, motor skill development & safe play areas",
  },
  {
    src: "/images/about/about-main.jpg",
    title: "Dedicated Extended Daycare & Learning",
    subtitle: "Hygienic nap rooms & nutritious warm meals till 7:00 PM",
  },
];

const comparisonPillars = [
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
    feature: "Curriculum & Methodology",
    kidzee: "Proprietary Péntemind & iLLUME (Penta-Sensory Learning)",
    others: "Basic informal rote memorization",
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
    name: "Pooja Sharma",
    child: "Mother of Aarav (Nursery)",
    rating: 5,
    quote:
      "The 1:8 teacher-student ratio makes a huge difference. Aarav receives personalized love and attention every day. His confidence and speech have improved tremendously!",
  },
  {
    name: "Rohit Malhotra",
    child: "Father of Ananya (Daycare & Playgroup)",
    rating: 5,
    quote:
      "As working parents in Dwarka, the extended daycare till 7 PM with fresh warm meals is a lifesaver. The hygiene standards and loving care from the teachers are unmatched.",
  },
  {
    name: "Deepika Verma",
    child: "Mother of Vihaan (Junior KG)",
    rating: 5,
    quote:
      "The iLLUME curriculum is truly experiential. Vihaan loves coming to school every single morning. Best preschool in Sector 12!",
  },
];

const faqs = [
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
  {
    q: "How safe is the centre and what security measures are in place?",
    a: "Our entire campus in Sector 12B is under 24/7 CCTV surveillance with controlled entry access, background-verified staff, child-safe soft furniture, sanitized washrooms, and emergency medical tie-up.",
  },
];

function getYouTubeEmbedUrl(url: string) {
  if (!url) return "";
  try {
    if (url.includes("youtube.com/embed/")) return url;
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtube.com/shorts/")) {
      const id = url.split("youtube.com/shorts/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtube.com/watch")) {
      const urlObj = new URL(url);
      const id = urlObj.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : url;
    }
  } catch {
    return url;
  }
  return url;
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
  const embedUrl = getYouTubeEmbedUrl(content.reviewVideoUrl || "");
  const isDirectVideo =
    content.reviewVideoUrl &&
    (content.reviewVideoUrl.endsWith(".mp4") ||
      content.reviewVideoUrl.endsWith(".webm") ||
      content.reviewVideoUrl.includes("/api/") ||
      content.reviewVideoUrl.startsWith("http"));

  return (
    <div className="min-h-screen bg-[#FAF7FC] text-[#281034] font-sans antialiased selection:bg-[#5B2A86] selection:text-white">
      {/* Top Special Offer Banner */}
      <div className="bg-gradient-to-r from-[#5B2A86] via-[#7B3FA2] to-[#5B2A86] px-4 py-2 text-center text-xs sm:text-sm font-bold text-white shadow-sm">
        <span className="inline-flex items-center gap-2">
          <span>🎉</span>
          <span>
            {content.offerText ||
              "Limited Time Offer: Flat 30% Off Annual Fee on Playgroup & Nursery Admissions (2026–27) | Free 3-Day Trial"}
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
                "Nurturing early childhood education with a low 1:8 teacher-student ratio, Péntemind curriculum, air-conditioned classrooms, and extended daycare till 7:00 PM with fresh warm meals."}
            </p>

            {/* 4 Distinct Value Cards (No Repetitions) */}
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

            {/* Direct Action Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#1FAF38] px-6 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[#19922F]"
              >
                <FaWhatsapp size={18} />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={`tel:${site.phone}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-xs sm:text-sm font-bold text-[#5B2A86] border border-purple-200 shadow-xs transition hover:bg-purple-50"
              >
                <Phone size={16} />
                <span>Call Admissions</span>
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
                submitButtonText="Claim 30% Off & Book Free Visit"
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

      {/* Parent Review Video Player Section */}
      <section className="border-t border-purple-100 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[#5B2A86]">
              <Video size={15} />
              Parent Video Stories
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#281034]">
              Hear Directly From Our Parents
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Watch real experiences of Dwarka families who chose Kidzee Sector 12 for early education.
            </p>
          </div>

          <div className="overflow-hidden rounded-3xl border-2 border-purple-200 bg-[#281034] shadow-xl">
            {embedUrl ? (
              <div className="relative aspect-16/9 w-full">
                <iframe
                  src={embedUrl}
                  title={content.reviewVideoTitle || "Kidzee Sector 12 Dwarka Parent Review"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            ) : isDirectVideo ? (
              <video
                src={content.reviewVideoUrl}
                controls
                className="aspect-16/9 w-full object-cover"
                poster="/images/hero/hero-main.jpg"
              />
            ) : (
              <div className="relative aspect-16/9 flex flex-col items-center justify-center p-6 text-center text-white bg-gradient-to-br from-[#3B174F] to-[#281034]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F6C84B] text-[#281034] shadow-lg mb-4">
                  <Play size={24} className="ml-1 fill-[#281034]" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold">
                  {content.reviewVideoTitle || "Real Parent Review & Campus Experience"}
                </h3>
                <p className="mt-2 text-xs sm:text-sm text-purple-200 max-w-md">
                  Experience why local Dwarka parents trust our caring teachers, 1:8 ratio, and safe classrooms.
                </p>
                <div className="mt-4 flex items-center gap-1 text-amber-400">
                  <Star size={16} className="fill-amber-400" />
                  <Star size={16} className="fill-amber-400" />
                  <Star size={16} className="fill-amber-400" />
                  <Star size={16} className="fill-amber-400" />
                  <Star size={16} className="fill-amber-400" />
                  <span className="ml-2 text-xs font-bold text-white">5.0 Parent Rating</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Real Campus Facility Photo Grid */}
      <section className="border-t border-gray-100 bg-[#FAF7FC] py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-[#5B2A86]">
              Campus Walkthrough
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#281034]">
              Safe, Joyous & Inspiring Spaces
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Take a look inside our Sector 12B Dwarka campus with low 1:8 ratios and dedicated play areas.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {campusPhotos.map((photo) => (
              <div
                key={photo.title}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs transition hover:shadow-md"
              >
                <div className="relative aspect-4/3 overflow-hidden bg-gray-100">
                  <Image
                    src={photo.src}
                    alt={photo.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-sm font-bold text-gray-900">{photo.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">{photo.subtitle}</p>
                </div>
              </div>
            ))}
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

      {/* FAQ Accordion Section */}
      <section className="bg-[#FAF4FF] py-12 sm:py-16 border-t border-purple-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-[#5B2A86]">
              Got Questions?
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#281034]">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-purple-200/60 bg-white p-5 shadow-xs"
              >
                <h3 className="text-base font-bold text-gray-900 flex items-start gap-2">
                  <HelpCircle size={18} className="text-[#5B2A86] shrink-0 mt-0.5" />
                  <span>{faq.q}</span>
                </h3>
                <p className="mt-2 pl-6 text-xs sm:text-sm leading-relaxed text-gray-600">
                  {faq.a}
                </p>
              </div>
            ))}
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
