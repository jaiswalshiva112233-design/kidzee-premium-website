"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Loader2 } from "lucide-react";

type Landing = { id: string; name: string; slug: string; pageType: string; status: string };
type Item = {
  id: string; platform: string; purpose: string; destinationType: string; finalUrl: string;
  campaignName: string; active: boolean; createdAt: string; leads: number; applications: number;
  createdBy: { name: string } | null; landingPage: Landing | null;
};
type Payload = { success: boolean; message?: string; items?: Item[]; landingPages?: Landing[] };

const fixedDestinations = [
  ["Homepage", "/"], ["Admissions", "/admissions"], ["Preschool programmes", "/programmes"],
  ["Daycare", "/daycare"], ["Careers", "/careers"],
] as const;

export default function CampaignUrlBuilder() {
  const [items, setItems] = useState<Item[]>([]);
  const [landingPages, setLandingPages] = useState<Landing[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState("");
  const [platform, setPlatform] = useState("META");
  const [purpose, setPurpose] = useState("ADMISSION");
  const [destination, setDestination] = useState("/admissions");
  const [customPath, setCustomPath] = useState("");
  const [campaignName, setCampaignName] = useState("");
  const [adSetName, setAdSetName] = useState("");
  const [creativeName, setCreativeName] = useState("");
  const [keyword, setKeyword] = useState("");
  const [source, setSource] = useState("meta");
  const [medium, setMedium] = useState("paid_social");

  async function load() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/marketing/campaign-urls", { cache: "no-store" });
      const data = await response.json() as Payload;
      if (!response.ok || !data.success) throw new Error(data.message || "Could not load campaign URLs.");
      setItems(data.items || []); setLandingPages(data.landingPages || []);
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load campaign URLs."); }
    finally { setLoading(false); }
  }
  useEffect(() => {
    // Initial remote data is loaded once after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, []);

  function changePlatform(value: string) {
    const defaults: Record<string, [string, string]> = { GOOGLE: ["google", "paid_search"], META: ["meta", "paid_social"], ORGANIC: ["organic", "organic"], OLX: ["olx", "listing"], REFERRAL: ["referral", "referral"], OTHER: ["other", "campaign"] };
    setPlatform(value); setSource(defaults[value][0]); setMedium(defaults[value][1]);
  }
  function changePurpose(value: string) {
    setPurpose(value);
    if (value === "RECRUITMENT") setDestination("/careers");
    else if (destination.startsWith("/careers")) setDestination(value === "ADMISSION" ? "/admissions" : "/");
  }

  const choices = useMemo(() => [
    ...fixedDestinations.map(([label, value]) => ({ label, value, landingPageId: "", scope: value.startsWith("/careers") ? "RECRUITMENT" : value === "/" ? "GENERAL" : "ADMISSION" })),
    ...landingPages.map((page) => ({ label: `${page.name} (${page.status.toLowerCase()})`, value: `/landing/${page.slug}`, landingPageId: page.id, scope: /career|recruit/i.test(page.pageType) ? "RECRUITMENT" : "ADMISSION" })),
    { label: "Specific website or job page", value: "__CUSTOM__", landingPageId: "", scope: "GENERAL" },
  ].filter((choice) => choice.value === "__CUSTOM__" || purpose === "GENERAL" || choice.scope === purpose || (purpose === "ADMISSION" && choice.scope === "GENERAL")), [landingPages, purpose]);

  async function submit(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    try {
      const selected = choices.find((item) => item.value === destination);
      const destinationUrl = destination === "__CUSTOM__" ? customPath : destination;
      const response = await fetch("/api/admin/marketing/campaign-urls", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ platform, purpose, destinationType: selected?.label || "Custom", destinationUrl, landingPageId: selected?.landingPageId || null, campaignName, adSetName, creativeName, keyword, utmSource: source, utmMedium: medium, utmCampaign: campaignName.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") }) });
      const data = await response.json() as Payload;
      if (!response.ok || !data.success) throw new Error(data.message || "Could not create URL.");
      setCampaignName(""); setAdSetName(""); setCreativeName(""); setKeyword(""); setMessage("Campaign URL created and ready to copy."); await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create URL."); }
    finally { setSaving(false); }
  }

  async function copy(value: string, id: string) {
    await navigator.clipboard.writeText(value); setCopied(id); window.setTimeout(() => setCopied(""), 1800);
  }

  return <div className="space-y-6">
    <form onSubmit={submit} className="rounded-[28px] border border-[#E4D8E9] bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3"><span className="rounded-2xl bg-[#F3EBF7] p-3 text-[#632B87]"><Link2 size={22}/></span><div><h2 className="text-xl font-black text-[#2D1736]">Create a tracked campaign link</h2><p className="mt-1 text-sm font-semibold text-[#746878]">Admissions and recruitment remain strictly separate. General links track visits only.</p></div></div>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Platform"><select value={platform} onChange={(e)=>changePlatform(e.target.value)}>{["GOOGLE","META","ORGANIC","OLX","REFERRAL","OTHER"].map(v=><option key={v}>{v}</option>)}</select></Field>
        <Field label="Purpose"><select value={purpose} onChange={(e)=>changePurpose(e.target.value)}>{["ADMISSION","RECRUITMENT","GENERAL"].map(v=><option key={v}>{v}</option>)}</select></Field>
        <Field label="Destination"><select value={destination} onChange={(e)=>setDestination(e.target.value)}>{choices.map(v=><option key={`${v.value}-${v.label}`} value={v.value}>{v.label}</option>)}</select></Field>
        {destination === "__CUSTOM__" ? <Field label="Specific website path"><input required value={customPath} onChange={(e)=>setCustomPath(e.target.value)} placeholder={purpose === "RECRUITMENT" ? "/careers?position=nursery-teacher" : "/admissions"}/></Field> : null}
        <Field label="Campaign name"><input required value={campaignName} onChange={(e)=>setCampaignName(e.target.value)} placeholder="admission_open_dec2026"/></Field>
        <Field label="Ad set name (optional)"><input value={adSetName} onChange={(e)=>setAdSetName(e.target.value)} /></Field>
        <Field label="Creative / ad name (optional)"><input value={creativeName} onChange={(e)=>setCreativeName(e.target.value)} /></Field>
        {platform === "GOOGLE" ? <Field label="Keyword (optional)"><input value={keyword} onChange={(e)=>setKeyword(e.target.value)} /></Field> : null}
        <Field label="UTM source"><input required value={source} onChange={(e)=>setSource(e.target.value)} /></Field>
        <Field label="UTM medium"><input required value={medium} onChange={(e)=>setMedium(e.target.value)} /></Field>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-3"><button disabled={saving} className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#632B87] px-5 text-sm font-black text-white disabled:opacity-60">{saving?<Loader2 className="animate-spin" size={18}/>:<Link2 size={18}/>} Generate campaign URL</button>{message?<p className="text-sm font-bold text-[#5B4D61]">{message}</p>:null}</div>
    </form>
    <section className="rounded-[28px] border border-[#E4D8E9] bg-white p-5 shadow-sm sm:p-7"><h2 className="text-xl font-black text-[#2D1736]">Created URLs</h2>{loading?<p className="mt-5 text-sm font-bold text-[#817684]">Loading…</p>:items.length===0?<p className="mt-5 text-sm font-bold text-[#817684]">No campaign URLs created yet.</p>:<div className="mt-5 space-y-3">{items.map(item=><article key={item.id} className="rounded-2xl border border-[#ECE4EF] p-4"><div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"><div className="min-w-0"><div className="flex flex-wrap gap-2"><Badge>{item.platform}</Badge><Badge>{item.purpose}</Badge>{!item.active?<Badge>ARCHIVED</Badge>:null}</div><h3 className="mt-2 font-black text-[#2D1736]">{item.campaignName}</h3><p className="mt-1 break-all text-xs font-semibold text-[#746878]">{item.finalUrl}</p><p className="mt-2 text-xs font-bold text-[#817684]">{item.destinationType} · {item.createdBy?.name || "Owner"} · {new Date(item.createdAt).toLocaleDateString("en-IN")} · {item.purpose==="RECRUITMENT"?`${item.applications} applications`:`${item.leads} admission leads`}</p></div><button type="button" onClick={()=>void copy(item.finalUrl,item.id)} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#D9C7E2] px-4 text-xs font-black text-[#632B87]">{copied===item.id?<Check size={16}/>:<Copy size={16}/>} {copied===item.id?"Copied":"Copy URL"}</button></div></article>)}</div>}</section>
  </div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label className="grid gap-2 text-xs font-black uppercase tracking-[0.08em] text-[#6E6172]">{label}<span className="[&_input]:min-h-12 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[#DCCFE2] [&_input]:px-4 [&_input]:text-sm [&_input]:font-semibold [&_input]:normal-case [&_input]:tracking-normal [&_select]:min-h-12 [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-[#DCCFE2] [&_select]:bg-white [&_select]:px-4 [&_select]:text-sm [&_select]:font-semibold [&_select]:normal-case [&_select]:tracking-normal">{children}</span></label> }
function Badge({children}:{children:React.ReactNode}) { return <span className="rounded-full bg-[#F3EBF7] px-2.5 py-1 text-[10px] font-black text-[#632B87]">{children}</span> }
