"use client";

import { BrainCircuit, Database, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Route = { id: string; scope: string; provider: string; protocol: string; model: string; baseUrl: string; apiKeyEnvVar: string; enabled: boolean; maxOutputTokens: number; monthlyCallLimit: number };
type Payload = { success?: boolean; message?: string; canManage?: boolean; control?: { enabled: boolean }; routes?: Route[]; collectedEvents?: number; dataCollectionContinues?: boolean };

export default function GrowthControlCentre() {
  const [data, setData] = useState<Payload>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/admin/growth/control", { cache: "no-store" });
    const result = (await response.json()) as Payload;
    if (!response.ok) throw new Error(result.message || "Unable to load AI controls.");
    setData(result);
  }, []);
  // The asynchronous request is the external system synchronized by this effect.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load().catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Unable to load AI controls.")); }, [load]);

  async function save(payload: Record<string, unknown>) {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/admin/growth/control", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = (await response.json()) as Payload;
      if (!response.ok) throw new Error(result.message || "AI settings could not be saved.");
      setData(result); setMessage(result.message || "Saved.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "AI settings could not be saved."); }
    finally { setBusy(false); }
  }

  function updateRoute(id: string, field: keyof Route, value: string | number | boolean) {
    setData((current) => ({ ...current, routes: (current.routes ?? []).map((route) => route.id === id ? { ...route, [field]: value } : route) }));
  }

  return <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex items-start gap-3"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]"><BrainCircuit size={22} /></span><div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#6A328F]">Owner control centre</p><h2 className="mt-1 text-xl font-black text-[#2D1736]">AI analysis and model routing</h2><p className="mt-1 max-w-2xl text-sm font-semibold text-[#817684]">Turning analysis off prevents every external AI API call. Website, ads, CRM and conversion data continue collecting without interruption.</p></div></div>{data.canManage ? <button disabled={busy} onClick={() => void save({ action: "toggle", enabled: !data.control?.enabled })} className={`min-h-12 rounded-2xl px-5 text-sm font-black text-white ${data.control?.enabled ? "bg-emerald-600" : "bg-slate-600"}`}>AI Analysis {data.control?.enabled ? "ON" : "OFF"}</button> : null}</div>
    <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl bg-[#F8F4FA] p-4"><Database size={18} className="text-[#6A328F]"/><p className="mt-2 text-2xl font-black text-[#2D1736]">{data.collectedEvents ?? 0}</p><p className="text-xs font-black uppercase text-[#817684]">Stored website events</p></div><div className="rounded-2xl bg-emerald-50 p-4"><ShieldCheck size={18} className="text-emerald-700"/><p className="mt-2 font-black text-emerald-900">Data collection remains active</p><p className="mt-1 text-xs font-semibold text-emerald-800">No historical data is deleted when AI is disabled.</p></div></div>
    <div className="mt-6 grid gap-4 xl:grid-cols-2">{(data.routes ?? []).map((route) => <article key={route.id} className="rounded-2xl border border-[#E9E1EC] p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-black text-[#2D1736]">{route.scope.replaceAll("_", " ")}</h3><label className="text-xs font-black text-[#6A328F]"><input type="checkbox" checked={route.enabled} disabled={!data.canManage} onChange={(event) => updateRoute(route.id, "enabled", event.target.checked)} className="mr-2 accent-[#6A328F]"/>Enabled</label></div><div className="mt-4 grid gap-3 sm:grid-cols-2"><Field label="Provider" value={route.provider} onChange={(v) => updateRoute(route.id, "provider", v)} /><Field label="Model" value={route.model} onChange={(v) => updateRoute(route.id, "model", v)} /><Field label="HTTPS API base URL" value={route.baseUrl} onChange={(v) => updateRoute(route.id, "baseUrl", v)} /><Field label="Secret environment variable" value={route.apiKeyEnvVar} onChange={(v) => updateRoute(route.id, "apiKeyEnvVar", v)} /><Select label="Protocol" value={route.protocol} onChange={(v) => updateRoute(route.id, "protocol", v)} /><Field label="Monthly call limit" type="number" value={String(route.monthlyCallLimit)} onChange={(v) => updateRoute(route.id, "monthlyCallLimit", Number(v))} /></div>{data.canManage ? <button disabled={busy} onClick={() => void save({ action: "save-route", ...route })} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white disabled:opacity-50">{busy ? <LoaderCircle className="animate-spin" size={15}/> : <Save size={15}/>}Save route</button> : null}</article>)}</div>
    {message ? <p role="status" className="mt-4 rounded-xl bg-[#FAF8FB] p-3 text-xs font-bold text-[#5B2A86]">{message}</p> : null}
  </section>;
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (value: string) => void; type?: string }) { return <label><span className="mb-1 block text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">{label}</span><input type={type} value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 w-full rounded-xl border border-[#DDD2E2] px-3 text-xs font-bold text-[#2D1736]" /></label>; }
function Select({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) { return <label><span className="mb-1 block text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-10 w-full rounded-xl border border-[#DDD2E2] px-3 text-xs font-bold"><option value="OPENAI_RESPONSES">Responses-compatible</option><option value="OPENAI_CHAT_COMPATIBLE">Chat-compatible</option></select></label>; }
