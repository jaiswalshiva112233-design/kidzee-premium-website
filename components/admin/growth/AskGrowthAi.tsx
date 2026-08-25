"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, Send, Sparkles } from "lucide-react";

export default function AskGrowthAi() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!question.trim() || loading) return;
    setLoading(true); setAnswer("");
    try {
      const response = await fetch("/api/admin/growth", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question }) });
      const result = (await response.json()) as { answer?: string; message?: string };
      setAnswer(result.answer ?? result.message ?? "No answer is available.");
    } catch { setAnswer("Growth analysis is temporarily unavailable."); }
    finally { setLoading(false); }
  }
  return <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF2C5] text-[#6B4C00]"><Sparkles size={20} /></span><div><h2 className="text-lg font-black text-[#2D1736]">Ask AI</h2><p className="text-sm font-semibold text-[#776B7A]">Answers use genuine admission data only. Careers and internal/test traffic are excluded.</p></div></div><form onSubmit={submit} className="mt-5 flex flex-col gap-3 sm:flex-row"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Example: Which source produced confirmed admissions?" maxLength={600} className="min-h-12 flex-1 rounded-2xl border border-[#DDD2E2] px-4 text-sm font-bold outline-none focus:border-[#6A328F]" /><button disabled={loading || !question.trim()} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white disabled:opacity-50">{loading ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}Ask</button></form>{answer ? <div className="mt-4 whitespace-pre-wrap rounded-2xl bg-[#FAF8FB] p-4 text-sm font-semibold leading-7 text-[#443648]">{answer}</div> : null}</section>;
}
