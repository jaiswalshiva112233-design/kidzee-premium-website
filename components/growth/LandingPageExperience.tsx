"use client";

import { CheckCircle2, Phone, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import AdmissionForm from "@/components/AdmissionForm";
import CareerApplicationForm from "@/components/careers/CareerApplicationForm";
import { useSiteContact } from "@/components/SiteContactProvider";

type Content = { badge?: string; heading?: string; highlight?: string; description?: string; bullets?: string[]; primaryCta?: string; secondaryCta?: string; programme?: string; enquiryType?: string };
type Variant = { id: string; variantKey: string; name: string; content: Content; allocation: number };
type Experiment = { id: string; variants: Array<{ allocation: number; variant: Variant }> } | null;

function anonymousBucket(key: string) {
  let id = "";
  try { id = localStorage.getItem("kidzee-website-visitor-id") || ""; } catch { /* use stable page key below */ }
  const input = `${id || key}|${key}`;
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) hash = ((hash << 5) - hash + input.charCodeAt(index)) | 0;
  return Math.abs(hash) % 100;
}

export default function LandingPageExperience({ page, variants, experiment }: { page: { id: string; slug: string; name: string; pageType: string; content: Content }; variants: Variant[]; experiment: Experiment }) {
  const site = useSiteContact();
  const eligible = useMemo(() => experiment?.variants.map((item) => ({ ...item.variant, allocation: item.allocation })) ?? variants.filter((item) => item.allocation > 0), [experiment, variants]);
  const [selected, setSelected] = useState<Variant>(() => eligible[0] ?? { id: "", variantKey: "A", name: "Original", content: page.content, allocation: 100 });

  useEffect(() => {
    const bucket = anonymousBucket(`${page.id}:${experiment?.id ?? "default"}`);
    let cumulative = 0;
    const variant = eligible.find((item) => { cumulative += item.allocation; return bucket < cumulative; }) ?? eligible[eligible.length - 1];
    // Variant assignment is restored after hydration so SSR remains deterministic.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (variant) setSelected(variant);
  }, [eligible, experiment?.id, page.id]);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("kidzee:website-event", { detail: { eventType: "LANDING_VARIANT_VIEW", eventName: page.slug, targetText: selected.variantKey, landingPageId: page.id, landingVariantId: selected.id, growthExperimentId: experiment?.id ?? "" } }));
  }, [experiment?.id, page.id, page.slug, selected.id, selected.variantKey]);

  const content = selected.content?.heading ? selected.content : page.content;
  return <main className="bg-[linear-gradient(135deg,#fff_0%,#fbf5ff_58%,#fff8df_100%)] py-12 sm:py-16">
    <div className="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <section className="pt-3"><span className="inline-flex items-center gap-2 rounded-full border border-[#E3D6E8] bg-white px-4 py-2 text-xs font-black text-[#5B2A86]"><Sparkles size={15}/>{content.badge || page.name}</span><h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-[-0.045em] text-[#2D1736] sm:text-5xl">{content.heading}<span className="block text-[#6A328F]">{content.highlight}</span></h1><p className="mt-5 max-w-2xl text-lg font-semibold leading-8 text-[#665A69]">{content.description}</p><ul className="mt-6 grid gap-3 sm:grid-cols-2">{(content.bullets ?? []).map((item) => <li key={item} className="flex gap-2 rounded-2xl bg-white p-3 text-sm font-bold text-[#4E3B54] shadow-sm"><CheckCircle2 size={18} className="shrink-0 text-emerald-600"/>{item}</li>)}</ul><div className="mt-7 flex flex-wrap gap-3"><a href="#landing-enquiry" className="inline-flex min-h-12 items-center rounded-full bg-[#5B2A86] px-6 text-sm font-black text-white">{content.primaryCta || "Book a School Visit"}</a><a href={`tel:${site.phone}`} className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#D8CBE0] bg-white px-6 text-sm font-black text-[#5B2A86]"><Phone size={17}/>{content.secondaryCta || "Call Admissions"}</a></div></section>
      <section id="landing-enquiry" className="scroll-mt-24">
        {page.pageType === "RECRUITMENT" ? (
          <CareerApplicationForm />
        ) : (
          <AdmissionForm
            initialProgramme={content.programme || (page.pageType === "DAYCARE" ? "DAYCARE" : "")}
            initialEnquiryType={content.enquiryType || (page.pageType === "DAYCARE" ? "DAYCARE" : "SCHOOL_VISIT")}
            landingPageId={page.id}
            landingVariantId={selected.id}
            growthExperimentId={experiment?.id ?? ""}
          />
        )}
      </section>
    </div>
  </main>;
}
