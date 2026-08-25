import type { Metadata } from "next";
import { BriefcaseBusiness, HeartHandshake, ShieldCheck } from "lucide-react";

import PageShell from "@/components/PageShell";
import CareerApplicationForm from "@/components/careers/CareerApplicationForm";

export const metadata: Metadata = {
  title: "Preschool & Daycare Careers in Dwarka",
  description: "Apply for preschool and daycare roles at Kidzee Sector 12B, Dwarka. Send your details and resume directly to the centre.",
  alternates: { canonical: "/careers" },
};

export default function CareersPage() {
  return (
    <PageShell>
      <main className="bg-[#FBF9FC]">
        <section className="bg-[#2D1736] px-5 py-16 text-white sm:py-20">
          <div className="mx-auto max-w-6xl">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F6C84B]">Careers</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">Work with children. Grow with a caring team.</h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/75">We welcome thoughtful educators who are patient, dependable and comfortable working closely with young children and families.</p>
          </div>
        </section>
        <section className="px-5 py-12 sm:py-16">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-[#6A328F]">Join our centre</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#2D1736]">Tell us about your experience</h2>
              <p className="mt-4 text-sm font-semibold leading-7 text-[#6F6472]">Share clear, honest details. If your experience matches a current or upcoming requirement, the centre team will contact you.</p>
              <div className="mt-7 space-y-3">
                {[{ icon: HeartHandshake, text: "Warm, respectful work with children" }, { icon: BriefcaseBusiness, text: "Simple application reviewed by the centre" }, { icon: ShieldCheck, text: "Resume access is restricted to authorised staff" }].map(({ icon: Icon, text }) => <div key={text} className="flex items-center gap-3 rounded-2xl bg-white p-4 font-bold text-[#443648] shadow-sm"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#5B2A86]"><Icon size={19} /></span>{text}</div>)}
              </div>
            </div>
            <CareerApplicationForm />
          </div>
        </section>
      </main>
    </PageShell>
  );
}
