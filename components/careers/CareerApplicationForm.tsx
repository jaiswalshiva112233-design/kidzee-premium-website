"use client";

import { FormEvent, useState } from "react";
import { CheckCircle2, LoaderCircle, Send } from "lucide-react";

import { collectPersistentAttribution } from "@/lib/marketing/clientAttribution";

const inputClass =
  "min-h-12 w-full rounded-2xl border border-[#DED3E3] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10";

export default function CareerApplicationForm() {
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    setResult(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set("consent", data.get("consent") ? "true" : "false");
    const attribution = collectPersistentAttribution();
    for (const key of [
      "utmSource",
      "utmMedium",
      "utmCampaign",
      "utmContent",
      "utmTerm",
      "referrer",
      "landingPage",
      "gclid",
      "gbraid",
      "wbraid",
      "fbclid",
      "fbc",
      "fbp",
    ] as const) {
      data.set(key, attribution[key]);
    }
    data.set("firstTouch", JSON.stringify(attribution.firstTouch));
    data.set("lastTouch", JSON.stringify(attribution.lastTouch));
    try {
      const response = await fetch("/api/website/careers", { method: "POST", body: data });
      const body = (await response.json()) as { success?: boolean; message?: string };
      setResult({ success: response.ok && body.success === true, message: body.message ?? "Please try again." });
      if (response.ok && body.success) {
        window.dispatchEvent(
          new CustomEvent("kidzee:website-event", {
            detail: {
              eventType: "FORM_SUBMITTED",
              eventName: "career_application_submitted",
              targetText: "Career application",
            },
          }),
        );
        form.reset();
      }
    } catch {
      setResult({ success: false, message: "The application could not be submitted. Please try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={submit} data-analytics-name="career_application_started" className="rounded-[30px] border border-[#E8DFEC] bg-white p-5 shadow-[0_22px_60px_rgba(45,23,54,0.08)] sm:p-7" encType="multipart/form-data">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-black text-[#2D1736]">Name *<input name="name" required maxLength={120} className={`${inputClass} mt-2`} /></label>
        <label className="text-sm font-black text-[#2D1736]">Mobile *<input name="mobile" required inputMode="tel" maxLength={16} className={`${inputClass} mt-2`} /></label>
        <label className="text-sm font-black text-[#2D1736]">Email<input name="email" type="email" maxLength={180} className={`${inputClass} mt-2`} /></label>
        <label className="text-sm font-black text-[#2D1736]">Location<input name="location" maxLength={180} className={`${inputClass} mt-2`} /></label>
        <label className="text-sm font-black text-[#2D1736]">Position *
          <select name="position" required className={`${inputClass} mt-2`} defaultValue="">
            <option value="" disabled>Select a position</option><option>Preschool Teacher</option><option>Daycare Teacher</option><option>Assistant Teacher</option><option>Centre Coordinator</option><option>Other</option>
          </select>
        </label>
        <label className="text-sm font-black text-[#2D1736]">Qualification<input name="qualification" maxLength={250} className={`${inputClass} mt-2`} /></label>
        <label className="text-sm font-black text-[#2D1736]">Experience<input name="experience" maxLength={120} placeholder="Example: 2 years" className={`${inputClass} mt-2`} /></label>
        <label className="text-sm font-black text-[#2D1736]">Current / previous role<input name="currentRole" maxLength={180} className={`${inputClass} mt-2`} /></label>
        <label className="text-sm font-black text-[#2D1736]">Expected salary<input name="expectedSalary" maxLength={100} className={`${inputClass} mt-2`} /></label>
        <label className="text-sm font-black text-[#2D1736]">Joining availability<input name="joiningAvailability" maxLength={120} className={`${inputClass} mt-2`} /></label>
      </div>
      <label className="mt-4 block text-sm font-black text-[#2D1736]">Resume (PDF, DOC or DOCX, up to 5 MB)<input name="resume" type="file" accept=".pdf,.doc,.docx" className="mt-2 block w-full rounded-2xl border border-dashed border-[#CDB9D8] bg-[#FAF7FC] p-4 text-sm font-bold text-[#665A69]" /></label>
      <label className="mt-4 block text-sm font-black text-[#2D1736]">Short message<textarea name="message" rows={4} maxLength={1500} className={`${inputClass} mt-2 py-3`} /></label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <label className="mt-4 flex items-start gap-3 text-sm font-semibold leading-6 text-[#665A69]"><input name="consent" type="checkbox" required className="mt-1 h-4 w-4 accent-[#5B2A86]" />I agree that the centre may contact me regarding this application.</label>
      {result ? <p role="status" className={`mt-4 flex items-center gap-2 rounded-2xl p-4 text-sm font-black ${result.success ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{result.success ? <CheckCircle2 size={18} /> : null}{result.message}</p> : null}
      <button type="submit" disabled={sending} className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white transition hover:bg-[#48206D] disabled:opacity-60">{sending ? <LoaderCircle className="animate-spin" size={18} /> : <Send size={18} />}{sending ? "Submitting…" : "Submit Application"}</button>
    </form>
  );
}
