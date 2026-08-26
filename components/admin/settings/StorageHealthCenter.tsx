"use client";

import { AlertTriangle, Archive, Cloud, Database, HardDrive, ImageOff, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Settings = {
  aiMediaFeaturesEnabled: boolean;
  directVideoUploadEnabled: boolean;
  externalEmbedsEnabled: boolean;
  originalArchiveEnabled: boolean;
  compressionEnabled: boolean;
  privateProtectionLocked: boolean;
  backupWarningsEnabled: boolean;
  growthWarningsEnabled: boolean;
};

type Snapshot = {
  settings: Settings;
  totals: Record<string, number>;
  provider: { configured: boolean; bucket: string | null };
  largestFiles: Array<{ id: string; originalName: string; module: string; visibility: string; originalSize: number; optimizedSize: number | null; status: string }>;
  failedFiles: Array<{ id: string; originalName: string; module: string; processingError: string | null; updatedAt: string }>;
  monthlyGrowth: Array<{ month: string; files: number; bytes: number }>;
};

function size(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function StorageHealthCenter({ initialSnapshot }: { initialSnapshot: Snapshot }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSnapshot.settings);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const cards = [
    ["Total storage", size(initialSnapshot.totals.bytes || 0), HardDrive],
    ["Public media", `${initialSnapshot.totals.publicFiles || 0} files`, Cloud],
    ["Private files", `${initialSnapshot.totals.privateFiles || 0} files`, ShieldCheck],
    ["Archived", `${initialSnapshot.totals.archivedFiles || 0} files`, Archive],
  ] as const;

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/storage-health", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
      const result = await response.json() as { success?: boolean; message?: string };
      if (!response.ok || !result.success) throw new Error(result.message || "Settings could not be saved.");
      setMessage(result.message || "Saved.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Settings could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] bg-[#2D1736] px-6 py-8 text-white">
        <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B]">Owner Advanced</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Storage & Media Health</h1>
        <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/70">Monitor public gallery media, protected student files, compression, failed processing and storage growth without exposing private URLs.</p>
      </section>

      {!initialSnapshot.provider.configured ? <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900"><AlertTriangle size={20} /> Firebase Storage is not fully configured. New uploads remain blocked rather than falling back to the database.</div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon]) => <article key={label} className="rounded-2xl border border-[#E6DDE9] bg-white p-5"><Icon size={22} className="text-[#6A328F]" /><p className="mt-4 text-xs font-black uppercase tracking-[0.1em] text-[#8A7D8E]">{label}</p><p className="mt-1 text-2xl font-black text-[#2D1736]">{value}</p></article>)}
      </div>

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          ["Failed processing", initialSnapshot.totals.failedFiles || 0],
          ["Missing thumbnails", initialSnapshot.totals.missingThumbnails || 0],
          ["Orphan index entries", initialSnapshot.totals.orphanedFiles || 0],
          ["Public/private mismatch", initialSnapshot.totals.publicPrivateMismatches || 0],
          ["Broken published media", initialSnapshot.totals.brokenPublishedMedia || 0],
          ["Legacy DB file bodies", initialSnapshot.totals.legacyDatabaseFiles || 0],
        ].map(([label, value]) => <div key={String(label)} className={`rounded-2xl border p-4 ${Number(value) > 0 ? "border-amber-200 bg-amber-50" : "border-green-200 bg-green-50"}`}><p className="text-xs font-black uppercase tracking-[0.08em] text-[#6F6473]">{label}</p><p className="mt-2 text-2xl font-black text-[#2D1736]">{value}</p></div>)}
      </section>

      <section className="rounded-[28px] border border-[#E6DDE9] bg-white p-6">
        <h2 className="text-xl font-black text-[#2D1736]">Trial media defaults</h2>
        <p className="mt-1 text-sm font-semibold text-[#7C7180]">Private student protection is locked on. Changes are recorded in Owner audit history.</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {[
            ["externalEmbedsEnabled", "Instagram & YouTube embeds"],
            ["compressionEnabled", "Automatic photo compression"],
            ["originalArchiveEnabled", "Archive original public photos"],
            ["directVideoUploadEnabled", "Direct heavy video upload"],
            ["backupWarningsEnabled", "Backup age warnings"],
            ["growthWarningsEnabled", "Storage growth warnings"],
          ].map(([key, label]) => <label key={key} className="flex items-center justify-between gap-4 rounded-2xl bg-[#F8F4FA] p-4 text-sm font-black text-[#433748]"><span>{label}</span><input type="checkbox" checked={settings[key as keyof Settings]} onChange={(event) => setSettings((value) => ({ ...value, [key]: event.target.checked }))} className="h-5 w-5 accent-[#5B2A86]" /></label>)}
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-black text-green-800"><span>Private student file protection</span><span className="inline-flex items-center gap-1"><ShieldCheck size={16} /> Locked</span></div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-[#E2D7E7] bg-[#F8F4FA] p-4 text-sm font-black text-[#433748]"><span>AI media features</span><span>Off for trial</span></div>
        </div>
        <button type="button" disabled={busy} onClick={() => void save()} className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white disabled:opacity-50"><Save size={17} /> {busy ? "Saving…" : "Save media safety"}</button>
        {message ? <p className="mt-3 text-sm font-bold text-[#5B2A86]">{message}</p> : null}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[28px] border border-[#E6DDE9] bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-black text-[#2D1736]"><Database size={20} /> Largest files</h2><div className="mt-4 space-y-2">{initialSnapshot.largestFiles.length ? initialSnapshot.largestFiles.map((file) => <div key={file.id} className="flex items-center justify-between gap-3 rounded-xl bg-[#F8F4FA] p-3"><div className="min-w-0"><p className="truncate text-sm font-black text-[#403345]">{file.originalName}</p><p className="text-xs font-semibold text-[#887B8C]">{file.module} · {file.visibility}</p></div><p className="shrink-0 text-sm font-black text-[#5B2A86]">{size(file.optimizedSize ?? file.originalSize)}</p></div>) : <p className="text-sm font-semibold text-[#817684]">No indexed files yet.</p>}</div></section>
        <section className="rounded-[28px] border border-[#E6DDE9] bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-black text-[#2D1736]"><ImageOff size={20} /> Processing failures</h2><div className="mt-4 space-y-2">{initialSnapshot.failedFiles.length ? initialSnapshot.failedFiles.map((file) => <div key={file.id} className="rounded-xl bg-red-50 p-3"><p className="text-sm font-black text-red-800">{file.originalName}</p><p className="mt-1 text-xs font-semibold text-red-700">Retry the upload. The failed item cannot be published.</p></div>) : <p className="text-sm font-semibold text-green-700">No media processing failures.</p>}</div></section>
      </div>
    </div>
  );
}
