"use client";

import { CheckCircle2, LoaderCircle, RotateCcw, ShieldCheck, Sparkles, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Recommendation = {
  id: string;
  category: string;
  title: string;
  reason: string;
  expectedImpact: string;
  risk: string;
  preview: { proposedAction?: string; confidence?: string };
  affectedModules: string[];
  status: string;
  rollbackPlan: string;
};

export default function GrowthRecommendationManager() {
  const [items, setItems] = useState<Recommendation[]>([]);
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/growth/recommendations", { cache: "no-store" });
    const result = (await response.json()) as { recommendations?: Recommendation[]; role?: string; message?: string };
    if (!response.ok) throw new Error(result.message || "Unable to load recommendations.");
    setItems(result.recommendations ?? []);
    setRole(result.role ?? "");
  }, []);

  useEffect(() => {
    // Load the approval queue after the client manager mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load().catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load recommendations."));
  }, [load]);

  async function request(method: "POST" | "PATCH", payload?: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/growth/recommendations", {
        method,
        headers: payload ? { "Content-Type": "application/json" } : undefined,
        body: payload ? JSON.stringify(payload) : undefined,
      });
      const result = (await response.json()) as { recommendations?: Recommendation[]; role?: string; message?: string };
      if (!response.ok) throw new Error(result.message || "Recommendation action failed.");
      setItems(result.recommendations ?? []);
      setRole(result.role ?? role);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Recommendation action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-black uppercase tracking-[0.15em] text-[#6A328F]">Approval-controlled recommendations</p><h2 className="mt-1 text-xl font-black text-[#2D1736]">Growth action queue</h2><p className="mt-1 max-w-2xl text-xs font-semibold leading-5 text-[#817684]">Every action shows its evidence, impact, risk, preview, affected modules and rollback plan. CentreOS never applies a recommendation automatically.</p></div>
        <button type="button" disabled={busy} onClick={() => void request("POST")} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white disabled:opacity-50">{busy ? <LoaderCircle className="animate-spin" size={16} /> : <Sparkles size={16} />} Refresh evidence</button>
      </div>
      {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div> : null}
      <div className="mt-5 space-y-4">
        {items.length ? items.map((item) => (
          <article key={item.id} className="rounded-2xl border border-[#E9E2ED] bg-[#FBF9FC] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="rounded-full bg-[#EDE2F2] px-3 py-1 text-[10px] font-black text-[#5B2A86]">{item.category.replaceAll("_", " ")}</span><span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-[#625768]">{item.status}</span></div>
            <h3 className="mt-3 text-base font-black text-[#2D1736]">{item.title}</h3>
            <div className="mt-3 grid gap-3 text-xs leading-5 sm:grid-cols-2"><p><strong>Reason:</strong> {item.reason}</p><p><strong>Expected impact:</strong> {item.expectedImpact}</p><p><strong>Risk:</strong> {item.risk}</p><p><strong>Preview:</strong> {item.preview?.proposedAction ?? "No automatic change"}</p><p><strong>Files/modules:</strong> {Array.isArray(item.affectedModules) ? item.affectedModules.join(", ") : "Review required"}</p><p><strong>Rollback:</strong> {item.rollbackPlan}</p></div>
            {role === "OWNER" ? <div className="mt-4 flex flex-wrap gap-2">
              {item.status === "RECOMMENDED" ? <><button onClick={() => void request("PATCH", { id: item.id, action: "APPROVE" })} className="inline-flex items-center gap-1 rounded-lg bg-green-100 px-3 py-2 text-xs font-black text-green-800"><ShieldCheck size={14} /> Approve preview</button><button onClick={() => void request("PATCH", { id: item.id, action: "REJECT" })} className="inline-flex items-center gap-1 rounded-lg bg-red-100 px-3 py-2 text-xs font-black text-red-800"><XCircle size={14} /> Reject</button></> : null}
              {item.status === "APPROVED" ? <button onClick={() => void request("PATCH", { id: item.id, action: "MARK_APPLIED" })} className="inline-flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-2 text-xs font-black text-blue-800"><CheckCircle2 size={14} /> Mark manually applied</button> : null}
              {item.status === "APPLIED" ? <button onClick={() => void request("PATCH", { id: item.id, action: "ROLLBACK" })} className="inline-flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-2 text-xs font-black text-amber-800"><RotateCcw size={14} /> Record rollback</button> : null}
            </div> : null}
          </article>
        )) : <p className="rounded-2xl bg-[#FAF8FB] p-4 text-sm font-semibold text-[#817684]">Select Refresh evidence to save the current evidence-based recommendations.</p>}
      </div>
    </section>
  );
}
