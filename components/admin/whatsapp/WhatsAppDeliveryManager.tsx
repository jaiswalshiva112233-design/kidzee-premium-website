"use client";

import { CheckCircle2, Clock3, LoaderCircle, MessageCircleMore, RefreshCw, RotateCcw, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type Delivery = {
  id: string;
  type: string;
  status: string;
  recipientPhone: string;
  attempts: number;
  maxAttempts: number;
  lastError: string | null;
  createdAt: string;
  updatedAt: string;
  enquiry: { enquiryNumber: string; parentName: string } | null;
  student: { studentNumber: string; firstName: string; lastName: string | null } | null;
  invoice: { invoiceNumber: string } | null;
  receipt: { receiptNumber: string } | null;
};

type DeliveryResponse = {
  success?: boolean;
  role?: string;
  messages?: Delivery[];
  counts?: Record<string, number>;
  message?: string;
};

const statusTone: Record<string, string> = {
  DELIVERED: "bg-emerald-100 text-emerald-800",
  READ: "bg-emerald-100 text-emerald-800",
  SENT: "bg-blue-100 text-blue-800",
  ACCEPTED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-amber-100 text-amber-800",
  PENDING: "bg-amber-100 text-amber-800",
  RETRY: "bg-orange-100 text-orange-800",
  FAILED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-100 text-slate-700",
};

function reference(item: Delivery) {
  if (item.receipt) return `Receipt ${item.receipt.receiptNumber}`;
  if (item.invoice) return `Invoice ${item.invoice.invoiceNumber}`;
  if (item.student) return `${item.student.firstName} ${item.student.lastName ?? ""}`.trim();
  if (item.enquiry) return `${item.enquiry.parentName} · ${item.enquiry.enquiryNumber}`;
  return "Centre communication";
}

export default function WhatsAppDeliveryManager() {
  const [items, setItems] = useState<Delivery[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [role, setRole] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [busyId, setBusyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const response = await fetch("/api/admin/whatsapp", { cache: "no-store" });
    const result = (await response.json()) as DeliveryResponse;
    if (!response.ok) throw new Error(result.message || "Unable to load WhatsApp history.");
    setItems(result.messages ?? []);
    setCounts(result.counts ?? {});
    setRole(result.role ?? "");
  }, []);

  useEffect(() => {
    // Load the persisted delivery queue after the client manager mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
      .catch((loadError: unknown) => setError(loadError instanceof Error ? loadError.message : "Unable to load WhatsApp history."))
      .finally(() => setLoading(false));
  }, [load]);

  const visible = useMemo(
    () => (filter === "ALL" ? items : items.filter((item) => item.status === filter)),
    [filter, items],
  );

  async function retry(id: string) {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch("/api/admin/whatsapp", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action: "RETRY" }),
      });
      const result = (await response.json()) as DeliveryResponse;
      if (!response.ok) throw new Error(result.message || "Retry could not be scheduled.");
      setItems(result.messages ?? []);
      setCounts(result.counts ?? {});
    } catch (retryError) {
      setError(retryError instanceof Error ? retryError.message : "Retry could not be scheduled.");
    } finally {
      setBusyId("");
    }
  }

  const cards = [
    ["Pending", (counts.PENDING ?? 0) + (counts.PROCESSING ?? 0), Clock3, "text-amber-700 bg-amber-50"],
    ["Retrying", counts.RETRY ?? 0, RefreshCw, "text-orange-700 bg-orange-50"],
    ["Delivered / read", (counts.DELIVERED ?? 0) + (counts.READ ?? 0), CheckCircle2, "text-emerald-700 bg-emerald-50"],
    ["Failed", (counts.FAILED ?? 0) + (counts.CANCELLED ?? 0), XCircle, "text-red-700 bg-red-50"],
  ] as const;

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value, Icon, tone]) => (
          <article key={label} className="rounded-[22px] border border-[#E7DFEA] bg-white p-4 shadow-sm">
            <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}><Icon size={18} /></span>
            <p className="mt-3 text-2xl font-black text-[#2D1736]">{value}</p>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.08em] text-[#827686]">{label}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#6A328F]">Message history</p>
            <h2 className="mt-1 text-xl font-black text-[#2D1736]">WhatsApp delivery log</h2>
            <p className="mt-1 text-xs font-semibold text-[#817684]">Successful messages cannot be resent. Failed messages are retried only by the owner and remain fully audited.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING", "RETRY", "DELIVERED", "READ", "FAILED"].map((value) => (
              <button key={value} type="button" onClick={() => setFilter(value)} className={`min-h-10 rounded-xl px-3 text-[11px] font-black ${filter === value ? "bg-[#5B2A86] text-white" : "bg-[#F5F0F7] text-[#5B2A86]"}`}>{value.replaceAll("_", " ")}</button>
            ))}
          </div>
        </div>

        {error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-700">{error}</div> : null}
        {loading ? <div className="mt-8 flex items-center justify-center gap-2 text-sm font-bold text-[#6A328F]"><LoaderCircle size={18} className="animate-spin" /> Loading delivery history</div> : null}

        {!loading ? <div className="mt-5 space-y-3">
          {visible.length ? visible.map((item) => {
            const canRetry = role === "OWNER" && ["FAILED", "CANCELLED"].includes(item.status);
            return (
              <article key={item.id} className="rounded-2xl border border-[#ECE5EF] bg-[#FBF9FC] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-3 py-1 text-[10px] font-black ${statusTone[item.status] ?? "bg-slate-100 text-slate-700"}`}>{item.status}</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.08em] text-[#6A328F]">{item.type.replaceAll("_", " ")}</span>
                    </div>
                    <p className="mt-3 text-sm font-black text-[#2D1736]">{reference(item)}</p>
                    <p className="mt-1 text-xs font-semibold text-[#746878]">To +{item.recipientPhone} · {new Date(item.createdAt).toLocaleString("en-IN")} · Attempt {item.attempts}/{item.maxAttempts}</p>
                    {item.lastError ? <p className="mt-2 text-xs font-bold text-red-700">Failure: {item.lastError}</p> : null}
                  </div>
                  {canRetry ? <button type="button" disabled={busyId === item.id} onClick={() => void retry(item.id)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#5B2A86] px-3 text-xs font-black text-white disabled:opacity-50">{busyId === item.id ? <LoaderCircle size={15} className="animate-spin" /> : <RotateCcw size={15} />} Retry safely</button> : null}
                </div>
              </article>
            );
          }) : <div className="rounded-2xl bg-[#FAF8FB] p-6 text-center text-sm font-semibold text-[#817684]"><MessageCircleMore className="mx-auto mb-2 text-[#6A328F]" />No messages match this filter.</div>}
        </div> : null}
      </section>
    </div>
  );
}
