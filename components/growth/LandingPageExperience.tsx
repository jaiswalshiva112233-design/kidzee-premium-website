"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Check,
  CheckCircle2,
  Clock3,
  HelpCircle,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
  Utensils,
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
    subtitle: "Child-safe ergonomic furniture & sensory learning tools",
  },
  {
    src: "/images/hero/hero-main.jpg",
    title: "Soft Play & Indoor Activity Zone",
    subtitle: "Ball pool, motor skill development & safe play areas",
  },
  {
    src: "/images/hero/hero-building.jpg",
    title: "Dedicated Extended Daycare",
    subtitle: "Hygienic nap rooms & nutritious warm meals till 7:00 PM",
  },
];

const comparisonPillars = [
  {
    feature: "Curriculum & Learning",
    kidzee: "Proprietary iLLUME (Penta-Sensory & Multiple Intelligence)",
    others: "Basic informal rote learning",
  },
  {
    feature: "Safety & Premises",
    kidzee: "24/7 CCTV Monitored Secure Premises + Verified Staff",
    others: "Unmonitored shared residential areas",
  },
  {
    feature: "Daycare & Meals",
    kidzee: "Extended till 7:00 PM with fresh, warm, hygienic meals",
    others: "Closes early (2-4 PM), outside packed food",
  },
  {
    feature: "Trial & Transition",
    kidzee: "Complimentary 3-Day Parent Transition & Trial",
    others: "Direct admission with no trial period",
  },
  {
    feature: "Location & Hygiene",
    kidzee: "Sanitized building in Sector 12B Dwarka with emergency medical protocol",
    others: "Congested residential basements",
  },
];

const parentTestimonials = [
  {
    name: "Pooja Sharma",
    child: "Mother of Aarav (Nursery)",
    rating: 5,
    quote:
      "Kidzee Sector 12 Dwarka has been a second home for Aarav. His confidence and speech have improved tremendously. The attentive teachers and safe environment give us complete peace of mind!",
  },
  {
    name: "Rohit Malhotra",
    child: "Father of Ananya (Daycare & Playgroup)",
    rating: 5,
    quote:
      "As working parents in Dwarka, the extended daycare till 7 PM with fresh warm meals is a lifesaver. The hygiene standards and loving care from the staff are unmatched.",
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
    q: "What are the school and daycare timings in Sector 12 Dwarka?",
    a: "Preschool operates from 8:30 AM to 1:00 PM (Monday to Friday). Extended daycare operates from 12:30 PM to 7:00 PM (Monday to Saturday) with warm nutritious meals and dedicated rest areas.",
  },
  {
    q: "Is there a trial period available before final admission?",
    a: "Yes! We offer a 3-day preschool trial experience so your child can settle in comfortably and you can experience our teaching methodology firsthand.",
  },
  {
    q: "How safe is the centre and what security measures are in place?",
    a: "Our entire campus in Sector 12B is under 24/7 CCTV surveillance with secure entry access, background-verified staff, child-safe soft furniture, sanitized washrooms, and emergency medical support.",
  },
  {
    q: "What is the admission process for 2026–27?",
    a: "You can book a guided campus visit using the form on this page. Our admissions team will walk you through the classroom, explain the curriculum, and assist with document verification.",
  },
];

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

  const defaultBullets = [
    "24/7 CCTV Monitored Secure Premises",
    "Fresh, Nutritious Warm Meals Prepared Daily",
    "Extended Daycare Available until 7:00 PM",
    "India's Proven iLLUME Multiple-Intelligence Curriculum",
    "Air-Conditioned, Child-Safe Activity Classrooms",
    "3-Day Free Preschool Trial Experience",
  ];

  const bullets = content.bullets && content.bullets.length > 0 ? content.bullets : defaultBullets;

  return (
    <div className="min-h-screen bg-[#FAF7FC] text-[#281034]">
      {/* Top Admissions Announcement Strip */}
      <div className="bg-gradient-to-r from-[#5B2A86] via-[#7B3FA2] to-[#5B2A86] px-4 py-2.5 text-center text-xs sm:text-sm font-bold text-white shadow-sm">
        <span className="inline-flex items-center gap-2">
          <span>✨</span>
          <span>
            {content.offerText ||
              "Admissions Open for Academic Year 2026–27 | Book a Guided Campus Walkthrough & 3-Day Trial"}
          </span>
        </span>
      </div>

      {/* Floating Trust Header */}
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/kidzee-logo.png"
              alt="Kidzee Sector 12 Dwarka"
              width={130}
              height={45}
              className="h-9 w-auto object-contain"
              priority
            />
            <span className="hidden sm:inline-block rounded-full bg-[#FAF4FF] px-2.5 py-1 text-[11px] font-bold text-[#5B2A86]">
              Sector 12, Dwarka
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden md:flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <Star size={14} className="fill-amber-400 text-amber-400" />
              <span>4.9 / 5 (Google Verified Reviews)</span>
            </div>

            <a
              href={`tel:${site.phone}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#5B2A86] px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[#471E6C]"
            >
              <Phone size={14} />
              <span className="hidden xs:inline">Call:</span> {site.phoneDisplay}
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section with Sticky Lead Form */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#FAF4FF] via-white to-[#FAF7FC] py-8 sm:py-14">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:items-start">
          {/* Left Column: Value Prop */}
          <div className="space-y-5">
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
                "Nurturing early childhood education with playgroup, nursery, kindergarten, and full-day daycare till 7:00 PM. Air-conditioned classrooms, fresh warm meals, and CCTV monitored premises for complete peace of mind."}
            </p>

            {/* Trust Pill Tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#5B2A86] border border-purple-100 shadow-2xs">
                <ShieldCheck size={14} className="text-emerald-600" />
                24/7 CCTV Monitored
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#5B2A86] border border-purple-100 shadow-2xs">
                <Utensils size={14} className="text-amber-600" />
                Fresh Meals Included
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#5B2A86] border border-purple-100 shadow-2xs">
                <Clock3 size={14} className="text-blue-600" />
                Daycare Till 7 PM
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-[#5B2A86] border border-purple-100 shadow-2xs">
                <MapPin size={14} className="text-rose-600" />
                Pocket 8, Sec 12B
              </span>
            </div>

            {/* Bullet Highlights Grid */}
            <ul className="grid gap-2.5 sm:grid-cols-2 pt-2">
              {bullets.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2.5 rounded-xl bg-white p-3 text-xs sm:text-sm font-semibold text-gray-800 border border-gray-100 shadow-2xs"
                >
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* Direct Instant Action Row */}
            <div className="flex flex-wrap items-center gap-3 pt-3">
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-[#1FAF38] px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-sm transition hover:bg-[#19922F]"
              >
                <FaWhatsapp size={18} />
                <span>Chat on WhatsApp</span>
              </a>

              <a
                href={`tel:${site.phone}`}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-xs sm:text-sm font-bold text-[#5B2A86] border border-purple-200 shadow-xs transition hover:bg-purple-50"
              >
                <Phone size={16} />
                <span>Call Admissions</span>
              </a>
            </div>
          </div>

          {/* Right Column: Sticky Lead Capture Form */}
          <div id="ad-enquiry" className="scroll-mt-24">
            <div className="rounded-3xl border-2 border-[#5B2A86]/20 bg-white p-5 sm:p-7 shadow-xl ring-1 ring-purple-500/5">
              <div className="mb-5 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-[#5B2A86]">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Admissions Desk 2026–27</span>
                </div>
                <h2 className="mt-1 text-xl sm:text-2xl font-black text-gray-900">
                  Book a Campus Visit
                </h2>
                <p className="mt-1 text-xs text-gray-600">
                  Experience classrooms, meet educators, and explore our 3-day preschool trial.
                </p>
              </div>

              {page.pageType === "RECRUITMENT" ? (
                <CareerApplicationForm />
              ) : (
                <AdmissionForm
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
        </div>
      </section>

      {/* Real Campus Facility Photo Grid */}
      <section className="border-t border-gray-100 bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-[#5B2A86]">
              Campus Walkthrough
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black text-[#281034]">
              Safe, Joyous & Inspiring Spaces
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Take a look inside our Sector 12B Dwarka campus designed specifically for toddlers and young learners.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {campusPhotos.map((photo) => (
              <div
                key={photo.title}
                className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
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
                  <h3 className="text-base font-bold text-gray-900">{photo.title}</h3>
                  <p className="mt-1 text-xs text-gray-600">{photo.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Kidzee Sector 12 vs Other Local Playschools */}
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
                <div key={row.feature} className="grid grid-cols-3 p-4 text-xs sm:text-sm">
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
            Book your guided school walkthrough and 3-day preschool trial today.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <a
              href="#ad-enquiry"
              className="rounded-full bg-[#F6C84B] px-7 py-3 text-sm font-black text-[#281034] shadow-lg transition hover:bg-[#ebd532]"
            >
              Book Campus Visit
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
          <span>Book Campus Visit</span>
        </a>
      </div>
    </div>
  );
}
