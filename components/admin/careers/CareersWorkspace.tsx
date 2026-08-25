"use client";

import { useState } from "react";
import { Download, LoaderCircle, MapPin, Phone, Save } from "lucide-react";

type Applicant = {
  id: string; applicationNumber: string; name: string; phone: string; email: string | null;
  location: string | null; position: string; qualification: string | null; experience: string | null;
  currentRole: string | null; expectedSalary: string | null; joiningAvailability: string | null;
  message: string | null; notes: string | null; status: string; hasResume: boolean; createdAt: string;
  source: string | null; medium: string | null; campaign: string | null; landingPage: string | null; trafficClass: string;
};

const statuses = ["NEW", "REVIEWED", "SHORTLISTED", "INTERVIEW", "SELECTED", "REJECTED", "JOINED"];

export default function CareersWorkspace({ initialApplicants }: { initialApplicants: Applicant[] }) {
  const [applicants, setApplicants] = useState(initialApplicants);
  const [savingId, setSavingId] = useState("");

  async function updateStatus(id: string, status: string) {
    setSavingId(id);
    try {
      const response = await fetch(`/api/admin/careers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error();
      setApplicants((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    } finally {
      setSavingId("");
    }
  }

  if (applicants.length === 0) {
    return <div className="rounded-[26px] border border-[#E5DDE9] bg-white p-8 text-center"><p className="text-lg font-black text-[#2D1736]">No applications yet</p><p className="mt-2 text-sm font-semibold text-[#7B7080]">New career applications will appear here, separate from admission leads.</p></div>;
  }

  return <div className="grid gap-4 xl:grid-cols-2">{applicants.map((item) => (
    <article key={item.id} className="rounded-[26px] border border-[#E5DDE9] bg-white p-5 shadow-[0_12px_35px_rgba(45,23,54,0.05)]">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#7C439E]">{item.applicationNumber}</p><h2 className="mt-1 text-xl font-black text-[#2D1736]">{item.name}</h2><p className="mt-1 text-sm font-bold text-[#6F6472]">{item.position}</p></div><span className="rounded-full bg-[#F3EAF8] px-3 py-1.5 text-[11px] font-black text-[#5B2A86]">{item.status.replaceAll("_", " ")}</span></div>
      <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[#665A69]"><a href={`tel:${item.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F5FA] px-3 py-2"><Phone size={14} />{item.phone}</a>{item.location ? <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F8F5FA] px-3 py-2"><MapPin size={14} />{item.location}</span> : null}</div>
      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-black"><span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-800">Recruitment</span><span className="rounded-full bg-[#F8F5FA] px-3 py-1.5 text-[#665A69]">{item.source || "Direct / unknown"}</span>{item.campaign ? <span className="rounded-full bg-[#F8F5FA] px-3 py-1.5 text-[#665A69]">Campaign: {item.campaign}</span> : null}<span className={`rounded-full px-3 py-1.5 ${item.trafficClass === "GENUINE" ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{item.trafficClass.replaceAll("_", " ")}</span></div>
      <dl className="mt-4 grid gap-3 rounded-2xl bg-[#FAF8FB] p-4 text-sm sm:grid-cols-2"><div><dt className="text-[10px] font-black uppercase text-[#958A98]">Qualification</dt><dd className="mt-1 font-bold text-[#3B2D3F]">{item.qualification || "Not provided"}</dd></div><div><dt className="text-[10px] font-black uppercase text-[#958A98]">Experience</dt><dd className="mt-1 font-bold text-[#3B2D3F]">{item.experience || "Not provided"}</dd></div><div><dt className="text-[10px] font-black uppercase text-[#958A98]">Availability</dt><dd className="mt-1 font-bold text-[#3B2D3F]">{item.joiningAvailability || "Not provided"}</dd></div><div><dt className="text-[10px] font-black uppercase text-[#958A98]">Applied</dt><dd className="mt-1 font-bold text-[#3B2D3F]">{new Date(item.createdAt).toLocaleDateString("en-IN")}</dd></div></dl>
      {item.message ? <p className="mt-4 text-sm font-semibold leading-6 text-[#665A69]">{item.message}</p> : null}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row"><select value={item.status} disabled={savingId === item.id} onChange={(event) => void updateStatus(item.id, event.target.value)} className="min-h-11 flex-1 rounded-xl border border-[#DDD2E2] bg-white px-3 text-sm font-black text-[#2D1736]">{statuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}</select>{savingId === item.id ? <span className="inline-flex items-center justify-center gap-2 px-3 text-sm font-bold text-[#6A328F]"><LoaderCircle className="animate-spin" size={17} />Saving</span> : <span className="inline-flex items-center justify-center gap-2 px-3 text-xs font-black text-emerald-700"><Save size={15} />Saved</span>}{item.hasResume ? <a href={`/api/admin/careers/${item.id}/resume`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2D1736] px-4 text-sm font-black text-white"><Download size={17} />Resume</a> : null}</div>
    </article>
  ))}</div>;
}
