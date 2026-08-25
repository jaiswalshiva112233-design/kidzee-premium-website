"use client";

import { CheckCircle2, LoaderCircle, Save } from "lucide-react";
import { type FormEvent, useState } from "react";

type Settings = {
  admissionsYear: string;
  defaultCampaignName: string;
  defaultUtmSource: string;
  defaultUtmMedium: string;
  defaultUtmCampaign: string;
  monthlyGoogleAdsSpend: number;
  monthlyMetaAdsSpend: number;
  centreWording: string;
  miraKnowledge: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  noticeEnabled: boolean;
  noticeText: string;
  noticeLink: string;
};

const fields: Array<{ key: keyof Settings; label: string; help: string; multiline?: boolean }> = [
  { key: "admissionsYear", label: "Admissions year", help: "Example: 2026-27" },
  { key: "defaultCampaignName", label: "Default campaign name", help: "Used by the campaign planning workspace." },
  { key: "defaultUtmSource", label: "Default UTM source", help: "Optional campaign-link default, such as google or facebook." },
  { key: "defaultUtmMedium", label: "Default UTM medium", help: "Optional, such as cpc or paid_social." },
  { key: "defaultUtmCampaign", label: "Default UTM campaign", help: "Optional campaign identifier." },
  { key: "monthlyGoogleAdsSpend", label: "Google Ads spend this month (₹)", help: "Owner dashboard uses this editable amount to estimate Google Ads ROI." },
  { key: "monthlyMetaAdsSpend", label: "Meta Ads spend this month (₹)", help: "Owner dashboard uses this editable amount to estimate Meta Ads ROI." },
  { key: "centreWording", label: "Approved centre wording", help: "The standard centre name used by MIRA and managed content." },
  { key: "miraKnowledge", label: "Additional approved MIRA knowledge", help: "Only factual public information. Never add private records, secrets or unapproved fee promises.", multiline: true },
  { key: "defaultSeoTitle", label: "Default SEO title", help: "Fallback title for pages without a specific managed title." },
  { key: "defaultSeoDescription", label: "Default SEO description", help: "Fallback description for pages without a specific managed description.", multiline: true },
  { key: "noticeText", label: "Website notice", help: "Short notice shown above the website header when enabled.", multiline: true },
  { key: "noticeLink", label: "Notice link", help: "Optional internal /path or full https:// link." },
];

export default function WebsiteOperationsManager({ initialSettings }: { initialSettings: Settings }) {
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function save(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/admin/website-operations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = (await response.json()) as { message?: string; settings?: Settings };
      if (!response.ok || !result.settings) throw new Error(result.message || "Settings could not be saved.");
      setSettings(result.settings);
      setMessage("Website operating settings saved.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Settings could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <section className="rounded-[28px] border border-[#E5DCE9] bg-white p-5 sm:p-7">
        <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-[#6A328F]">Central website operations</p><h1 className="mt-2 text-3xl font-black text-[#2D1736]">Campaign, MIRA, SEO and notice defaults</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#817684]">Contact details, social links and operating hours remain in Contact Page so there is only one source for those values. Admissions page wording remains in Admissions & Page Text.</p></div></div>
        {message ? <div className="mt-5 flex items-center gap-2 rounded-xl bg-green-50 p-3 text-sm font-bold text-green-800"><CheckCircle2 size={16} /> {message}</div> : null}
        {error ? <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700">{error}</div> : null}
      </section>

      <section className="grid gap-4 rounded-[28px] border border-[#E5DCE9] bg-white p-5 sm:grid-cols-2 sm:p-7">
        {fields.map((field) => (
          <label key={field.key} className={field.multiline ? "sm:col-span-2" : ""}>
            <span className="text-sm font-black text-[#35243E]">{field.label}</span>
            <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">{field.help}</span>
            {field.multiline ? <textarea value={String(settings[field.key])} onChange={(event) => setSettings((current) => ({ ...current, [field.key]: event.target.value }))} className="mt-2 min-h-28 w-full rounded-2xl border border-[#DCCFE4] px-4 py-3 text-sm" /> : <input value={String(settings[field.key])} onChange={(event) => setSettings((current) => ({ ...current, [field.key]: event.target.value }))} className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] px-4 text-sm" />}
          </label>
        ))}
        <label className="sm:col-span-2 flex items-center gap-3 rounded-2xl bg-[#F8F4FA] p-4"><input type="checkbox" checked={settings.noticeEnabled} onChange={(event) => setSettings((current) => ({ ...current, noticeEnabled: event.target.checked }))} className="h-5 w-5 accent-[#5B2A86]" /><span><strong className="block text-sm text-[#2D1736]">Publish website notice</strong><span className="text-xs font-semibold text-[#817684]">The notice remains hidden until this is enabled.</span></span></label>
      </section>

      <button type="submit" disabled={saving} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white disabled:opacity-50">{saving ? <LoaderCircle size={18} className="animate-spin" /> : <Save size={18} />} Save central website settings</button>
    </form>
  );
}
