"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { ArrowRight, LoaderCircle, Phone, Send, Sparkles, X } from "lucide-react";

import { useSiteContact } from "@/components/SiteContactProvider";
import { collectPersistentAttribution } from "@/lib/marketing/clientAttribution";

type Message = { role: "mira" | "parent"; text: string; actions?: string[] };
const quickQuestions = ["Which programme is right?", "Tell me about daycare", "I want to visit", "Get fee details"];

export default function MiraPanel({ onClose }: { onClose: () => void }) {
  const site = useSiteContact();
  const [messages, setMessages] = useState<Message[]>([
    { role: "mira", text: "Hello, I’m MIRA. I can help with programmes, daycare and school visits. What would you like to know?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadSaved, setLeadSaved] = useState(false);
  const [leadIntent, setLeadIntent] = useState("CALLBACK");
  const formRef = useRef<HTMLFormElement>(null);

  async function ask(question: string) {
    const clean = question.trim();
    if (!clean || sending) return;
    setMessages((current) => [...current, { role: "parent", text: clean }]);
    setInput("");
    setSending(true);
    try {
      const response = await fetch("/api/website/mira", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean }),
        signal: AbortSignal.timeout(10_000),
      });
      const body = (await response.json()) as { reply?: string; actions?: string[]; intent?: string; message?: string };
      if (!response.ok) throw new Error(body.message || "MIRA could not answer right now.");
      if (body.intent) setLeadIntent(body.intent);
      setMessages((current) => [...current, { role: "mira", text: body.reply ?? "The centre team can help with that.", actions: body.actions }]);
    } catch {
      setMessages((current) => [...current, { role: "mira", text: "I’m unable to check that right now. You can request a callback below.", actions: ["Request a Call", "Call Us"] }]);
    } finally {
      setSending(false);
    }
  }

  function action(actionLabel: string) {
    if (actionLabel.includes("Call Us")) { window.location.href = `tel:${site.phone}`; return; }
    if (actionLabel.includes("Programmes")) { window.location.href = "/programmes"; return; }
    if (actionLabel.includes("Daycare")) { window.location.href = "/daycare"; return; }
    if (actionLabel.includes("School Visit")) setLeadIntent("SCHOOL_VISIT");
    else if (actionLabel.includes("Fee")) setLeadIntent("FEES");
    setShowLeadForm(true);
  }

  async function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    const data = new FormData(event.currentTarget);
    const payload = {
      parentName: data.get("parentName"), phone: data.get("phone"), childAge: data.get("childAge"),
      programme: data.get("programme"),
      enquiryType: leadIntent === "DAYCARE" || leadIntent === "FEES" || leadIntent === "SCHOOL_VISIT"
        ? leadIntent
        : leadIntent === "PROGRAMME"
          ? "ADMISSION"
          : "CALLBACK",
      message: `Callback requested through MIRA (${leadIntent.toLowerCase().replaceAll("_", " ")})`,
      submissionId: `mira_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      ...collectPersistentAttribution(),
      marketingConsent: data.get("consent") === "on",
    };
    try {
      const response = await fetch("/api/website/enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20_000),
      });
      const body = (await response.json()) as { message?: string; enquiryNumber?: string };
      if (!response.ok) throw new Error(body.message);
      setLeadSaved(true);
      setMessages((current) => [...current, { role: "mira", text: `Your callback request is saved${body.enquiryNumber ? ` (${body.enquiryNumber})` : ""}. The centre team will contact you.` }]);
      window.dispatchEvent(new CustomEvent("kidzee:website-event", {
        detail: {
          eventType: "FORM_SUBMITTED",
          eventName: "mira_callback_submitted",
          targetText: leadIntent,
          enquiryNumber: body.enquiryNumber,
          submissionId: payload.submissionId,
        },
      }));
      formRef.current?.reset();
    } catch (error) {
      setMessages((current) => [...current, { role: "mira", text: error instanceof Error && error.message ? error.message : "The request could not be saved. Please call the centre." }]);
    } finally { setSending(false); }
  }

  return (
    <section role="dialog" aria-label="MIRA Kidzee Admissions Assistant" className="fixed bottom-[9rem] right-3 z-[80] flex max-h-[min(680px,calc(100dvh-11rem))] w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[28px] border border-[#E4D9E8] bg-white shadow-[0_28px_80px_rgba(45,23,54,0.28)] md:bottom-[10rem] md:right-6 md:max-h-[620px]">
      <header className="flex items-center justify-between bg-[#2D1736] px-5 py-4 text-white"><div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]"><Sparkles size={20} /></span><div><h2 className="font-black">MIRA</h2><p className="text-[11px] font-bold text-white/65">Kidzee Admissions Assistant</p></div></div><button type="button" onClick={onClose} aria-label="Close MIRA" className="rounded-xl p-2 hover:bg-white/10"><X size={19} /></button></header>
      <div className="flex-1 space-y-3 overflow-y-auto bg-[#FAF8FB] p-4" aria-live="polite">
        {messages.map((message, index) => <div key={`${message.role}-${index}`} className={message.role === "parent" ? "ml-auto max-w-[85%]" : "max-w-[90%]"}><p className={`rounded-2xl px-4 py-3 text-sm font-semibold leading-6 ${message.role === "parent" ? "rounded-br-md bg-[#5B2A86] text-white" : "rounded-bl-md border border-[#E8DFEC] bg-white text-[#453849]"}`}>{message.text}</p>{message.actions?.length ? <div className="mt-2 flex flex-wrap gap-2">{message.actions.map((label) => <button key={label} type="button" onClick={() => action(label)} className="rounded-full border border-[#D8C9DE] bg-white px-3 py-1.5 text-[11px] font-black text-[#5B2A86]">{label}</button>)}</div> : null}</div>)}
        {sending && !showLeadForm ? <p className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-bold text-[#6A328F]"><LoaderCircle className="animate-spin" size={16} />Checking…</p> : null}
        {messages.length === 1 ? <div className="flex flex-wrap gap-2 pt-1">{quickQuestions.map((question) => <button key={question} onClick={() => void ask(question)} className="rounded-full border border-[#D8C9DE] bg-white px-3 py-2 text-[11px] font-black text-[#5B2A86]">{question}</button>)}</div> : null}
        {showLeadForm && !leadSaved ? <form ref={formRef} onSubmit={saveLead} aria-label="MIRA callback request" data-analytics-name="MIRA callback request" className="rounded-2xl border border-[#E2D7E7] bg-white p-4"><p className="text-sm font-black text-[#2D1736]">Request a call</p><div className="mt-3 grid gap-2"><input required name="parentName" autoComplete="name" aria-label="Parent name" placeholder="Parent name" className="min-h-10 rounded-xl border border-[#DED3E3] px-3 text-sm font-bold" /><input required name="phone" inputMode="tel" autoComplete="tel" pattern="[0-9+ -]{10,16}" aria-label="Mobile number" placeholder="10-digit mobile" className="min-h-10 rounded-xl border border-[#DED3E3] px-3 text-sm font-bold" /><input required name="childAge" aria-label="Child age" placeholder="Child age" className="min-h-10 rounded-xl border border-[#DED3E3] px-3 text-sm font-bold" /><select name="programme" aria-label="Programme of interest" className="min-h-10 rounded-xl border border-[#DED3E3] px-3 text-sm font-bold"><option value="">Not sure yet</option><option value="PLAYGROUP">Playgroup</option><option value="NURSERY">Nursery</option><option value="JUNIOR_KG">Junior KG</option><option value="SENIOR_KG">Senior KG</option><option value="DAYCARE">Daycare</option></select><label className="flex gap-2 text-[11px] font-semibold text-[#6F6472]"><input required type="checkbox" name="consent" />I agree to be contacted about my enquiry.</label><button disabled={sending} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white">{sending ? <LoaderCircle className="animate-spin" size={15} /> : <Send size={15} />}Save callback request</button></div></form> : null}
      </div>
      <form onSubmit={(event) => { event.preventDefault(); void ask(input); }} className="flex gap-2 border-t border-[#E9E1EC] bg-white p-3"><input value={input} onChange={(event) => setInput(event.target.value)} maxLength={600} placeholder="Ask about admissions…" aria-label="Message MIRA" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#DED3E3] px-3 text-sm font-bold outline-none focus:border-[#6A328F]" /><button disabled={sending || !input.trim()} aria-label="Send message" className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5B2A86] text-white disabled:opacity-40"><ArrowRight size={19} /></button></form>
      <div className="flex items-center justify-between border-t border-[#EEE8F0] px-4 py-2 text-[10px] font-bold text-[#877B8A]"><span>Admissions information only</span><Link href={`tel:${site.phone}`} className="inline-flex items-center gap-1 text-[#5B2A86]"><Phone size={12} />Call centre</Link></div>
    </section>
  );
}
