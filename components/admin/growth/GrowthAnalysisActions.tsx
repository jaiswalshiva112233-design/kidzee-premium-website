"use client";

import { BrainCircuit, LoaderCircle } from "lucide-react";
import { useState } from "react";

export default function GrowthAnalysisActions() {
  const [busy, setBusy] = useState("");
  const [answer, setAnswer] = useState("");
  async function analyse(scope: "WEBSITE" | "ADS") {
    setBusy(scope); setAnswer("");
    try { const response = await fetch("/api/admin/growth/analyse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ scope }) }); const result = await response.json() as { answer?: string; message?: string }; if (!response.ok) throw new Error(result.message || "Analysis failed."); setAnswer(result.answer || "No evidence-backed finding was returned."); }
    catch (error) { setAnswer(error instanceof Error ? error.message : "Analysis failed."); }
    finally { setBusy(""); }
  }
  return <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><BrainCircuit className="text-[#6A328F]"/><div><h2 className="font-black text-[#2D1736]">Evidence-only AI analysis</h2><p className="text-xs font-semibold text-[#817684]">Uses collected CentreOS evidence. It never changes the website or ads automatically.</p></div></div><div className="mt-4 flex flex-wrap gap-2"><button disabled={Boolean(busy)} onClick={() => void analyse("WEBSITE")} className="rounded-xl bg-[#5B2A86] px-4 py-3 text-xs font-black text-white">{busy === "WEBSITE" ? <LoaderCircle size={15} className="animate-spin"/> : "Analyse website & SEO"}</button><button disabled={Boolean(busy)} onClick={() => void analyse("ADS")} className="rounded-xl bg-[#F6C84B] px-4 py-3 text-xs font-black text-[#2D1736]">{busy === "ADS" ? <LoaderCircle size={15} className="animate-spin"/> : "Analyse Google & Meta Ads"}</button></div>{answer ? <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#FAF8FB] p-4 text-sm font-semibold leading-6 text-[#574B5B]">{answer}</div> : null}</section>;
}
