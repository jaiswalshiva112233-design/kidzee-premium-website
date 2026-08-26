"use client";

import { AlertTriangle, CheckCircle2, DatabaseBackup, Download, FileJson, Image, Settings, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type BackupType = "DATABASE" | "WEBSITE_CONTENT" | "MEDIA_INDEX" | "SETTINGS";
type History = {
  id: string;
  exportType: BackupType;
  status: "GENERATING" | "COMPLETED" | "FAILED";
  fileName: string | null;
  sizeBytes: number | null;
  recordCount: number | null;
  errorMessage: string | null;
  createdByName: string;
  completedAt: string | null;
  createdAt: string;
};

function size(bytes: number | null) {
  if (!bytes) return "—";
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ageHours(value?: string | null) {
  if (!value) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(value).getTime()) / 3_600_000;
}

export default function BackupExportCenter({ initialHistory }: { initialHistory: History[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<BackupType | "">("");
  const [message, setMessage] = useState("");
  const latest = useMemo(() => new Map(initialHistory.filter((item) => item.status === "COMPLETED").map((item) => [item.exportType, item])), [initialHistory]);
  const databaseWarning = ageHours(latest.get("DATABASE")?.completedAt) > 24;
  const mediaWarning = ageHours(latest.get("MEDIA_INDEX")?.completedAt) > 24 * 7;
  const options: Array<{ type: BackupType; title: string; description: string; Icon: typeof DatabaseBackup }> = [
    { type: "DATABASE", title: "Download Database Backup", description: "Students, guardians, admissions, enquiries, contracts, fees, receipts, ledger, daycare, attendance, payroll, careers, attribution and audit history. File bodies are excluded.", Icon: DatabaseBackup },
    { type: "WEBSITE_CONTENT", title: "Download Website Content Backup", description: "Website Manager content, gallery/reel references, landing pages and campaign URLs without credentials or environment values.", Icon: FileJson },
    { type: "MEDIA_INDEX", title: "Download Media Index", description: "External storage paths, sizes, visibility, links and processing states. No media binaries or signed URLs.", Icon: Image },
    { type: "SETTINGS", title: "Download Settings Backup", description: "Centre, programme, fee, daycare, meal and media-safety configuration. Passwords and tokens are excluded.", Icon: Settings },
  ];

  async function download(type: BackupType) {
    setBusy(type);
    setMessage("");
    try {
      const response = await fetch("/api/admin/backup-exports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ exportType: type }) });
      if (!response.ok) {
        const result = await response.json() as { message?: string };
        throw new Error(result.message || "Backup could not be created.");
      }
      const blob = await response.blob();
      const disposition = response.headers.get("content-disposition") || "";
      const fileName = disposition.match(/filename="([^"]+)"/)?.[1] || `centreos-${type.toLowerCase()}.json`;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage(`${fileName} downloaded successfully.`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Backup could not be created.");
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] bg-[#2D1736] px-6 py-8 text-white"><p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B]">Owner Advanced</p><h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Backup & Export</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/70">Create safe manual exports before trial launch and before major changes. Exports never include passwords, environment files, tokens, signed URLs or binary media.</p></section>

      {(databaseWarning || mediaWarning) ? <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900"><div className="flex gap-2"><AlertTriangle size={19} /><span>{databaseWarning ? "Database backup is older than 24 hours. " : ""}{mediaWarning ? "Media index backup is older than 7 days." : ""}</span></div></div> : <div className="flex gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-800"><CheckCircle2 size={19} /> Backup timing is within the recommended window.</div>}

      <div className="grid gap-5 lg:grid-cols-2">
        {options.map(({ type, title, description, Icon }) => {
          const previous = latest.get(type);
          return <article key={type} className="rounded-[26px] border border-[#E6DDE9] bg-white p-6 shadow-sm"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]"><Icon size={22} /></span><h2 className="mt-4 text-xl font-black text-[#2D1736]">{title}</h2><p className="mt-2 text-sm font-semibold leading-6 text-[#766A7A]">{description}</p><p className="mt-4 text-xs font-bold text-[#8B7E8F]">Last successful: {previous?.completedAt ? new Date(previous.completedAt).toLocaleString("en-IN") : "Never"}</p><button type="button" disabled={Boolean(busy)} onClick={() => void download(type)} className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white disabled:opacity-45"><Download size={17} /> {busy === type ? "Preparing…" : "Create & Download"}</button></article>;
        })}
      </div>
      {message ? <p className="rounded-2xl bg-[#F3EAF8] p-4 text-sm font-bold text-[#5B2A86]">{message}</p> : null}

      <section className="rounded-[28px] border border-[#E6DDE9] bg-white p-6"><h2 className="flex items-center gap-2 text-xl font-black text-[#2D1736]"><ShieldCheck size={20} /> Restore safety</h2><ol className="mt-4 list-decimal space-y-2 pl-5 text-sm font-semibold leading-6 text-[#6F6373]"><li>Do not import a backup into the live database yourself.</li><li>Keep the database, website content, media index and settings exports from the same date together.</li><li>Ask the technical administrator to verify record counts, migration version and storage paths in an isolated database first.</li><li>Restore only after a new live backup and written Owner approval.</li></ol><p className="mt-4 rounded-xl bg-[#FFF6D9] p-3 text-xs font-black text-[#755600]">Automatic restore is intentionally not implemented because a wrong restore can overwrite live admissions, fees and attendance.</p></section>

      <section className="rounded-[28px] border border-[#E6DDE9] bg-white p-6"><h2 className="text-xl font-black text-[#2D1736]">Backup history</h2><div className="mt-4 overflow-x-auto"><table className="min-w-full text-left text-sm"><thead><tr className="border-b border-[#E9E1EC] text-xs uppercase tracking-[0.08em] text-[#887B8C]"><th className="p-3">Type</th><th className="p-3">Status</th><th className="p-3">Created</th><th className="p-3">Owner</th><th className="p-3">Records</th><th className="p-3">Size</th></tr></thead><tbody>{initialHistory.map((item) => <tr key={item.id} className="border-b border-[#F0EAF2]"><td className="p-3 font-black text-[#403345]">{item.exportType.replaceAll("_", " ")}</td><td className="p-3 font-bold">{item.status}</td><td className="p-3">{new Date(item.createdAt).toLocaleString("en-IN")}</td><td className="p-3">{item.createdByName}</td><td className="p-3">{item.recordCount ?? "—"}</td><td className="p-3">{size(item.sizeBytes)}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
