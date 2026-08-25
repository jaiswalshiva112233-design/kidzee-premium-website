"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Laptop, LoaderCircle, ShieldOff, TestTube2 } from "lucide-react";

type Marker = { deviceId: string; mode: "staff" | "test" } | null;

export default function InternalDeviceSettings() {
  const [marker, setMarker] = useState<Marker>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [label, setLabel] = useState("");
  const [devices, setDevices] = useState<Array<{ id: string; label: string; mode: string; addedBy: string; addedAt: string }>>([]);

  async function load() {
    try {
      const response = await fetch("/api/admin/internal-device", { cache: "no-store" });
      const body = (await response.json()) as { marker?: Marker; devices?: Array<{ id: string; label: string; mode: string; addedBy: string; addedAt: string }> };
      setMarker(body.marker ?? null);
      setDevices(body.devices ?? []);
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function change(action: "staff" | "test" | "remove") {
    setLoading(true); setMessage("");
    try {
      const response = await fetch("/api/admin/internal-device", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, label }),
      });
      const body = (await response.json()) as { marker?: Marker; message?: string };
      if (!response.ok) throw new Error(body.message);
      setMarker(body.marker ?? null); setMessage(body.message ?? (action === "remove" ? "This device will now count as external traffic." : "Saved."));
    } catch (error) { setMessage(error instanceof Error ? error.message : "The setting could not be saved."); }
    finally { setLoading(false); }
  }

  return <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]"><Laptop size={20} /></span><div><h2 className="text-lg font-black text-[#2D1736]">Staff traffic on this device</h2><p className="mt-1 text-sm font-semibold leading-6 text-[#776B7A]">Exclude this phone or laptop from genuine visitor, funnel and advertising conversion reports.</p></div></div>
  <div className="mt-5 rounded-2xl bg-[#FAF8FB] p-4"><p className="flex items-center gap-2 text-sm font-black text-[#2D1736]">{loading ? <LoaderCircle className="animate-spin" size={17} /> : marker ? <CheckCircle2 className="text-emerald-600" size={17} /> : <ShieldOff className="text-amber-600" size={17} />}{loading ? "Checking…" : marker?.mode === "test" ? "Test Mode active" : marker ? "Marked as staff" : "Currently counted as external"}</p>{message ? <p role="status" className="mt-2 text-xs font-bold text-[#6A328F]">{message}</p> : null}</div>
  <label className="mt-4 block text-xs font-black text-[#574B5B]">Device name<input value={label} onChange={(event) => setLabel(event.target.value)} maxLength={80} placeholder="Example: Owner laptop" className="mt-2 min-h-11 w-full rounded-xl border border-[#D9CBE0] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none focus:border-[#6A328F]" /></label>
  <div className="mt-4 flex flex-wrap gap-2"><button onClick={() => void change("staff")} disabled={loading} className="min-h-11 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white disabled:opacity-50">Mark This Device as Staff</button><button onClick={() => void change("test")} disabled={loading} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#D9CBE0] bg-white px-4 text-xs font-black text-[#5B2A86] disabled:opacity-50"><TestTube2 size={15} />Test Mode</button>{marker ? <button onClick={() => void change("remove")} disabled={loading} className="min-h-11 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-black text-red-700 disabled:opacity-50">Remove marker</button> : null}</div>{devices.length ? <div className="mt-5 border-t border-[#E9E1EC] pt-4"><p className="text-xs font-black uppercase tracking-[0.12em] text-[#817684]">Registered internal identities ({devices.length})</p><div className="mt-2 grid gap-2 sm:grid-cols-2">{devices.slice(0, 12).map((device) => <p key={device.id} className="rounded-xl bg-[#FAF8FB] p-3 text-xs font-bold text-[#574B5B]">{device.label} · {device.mode} · {device.addedBy}</p>)}</div></div> : null}</section>;
}
