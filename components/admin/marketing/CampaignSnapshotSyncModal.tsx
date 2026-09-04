"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, LoaderCircle, RefreshCw, Sparkles, X } from "lucide-react";

type Props = {
  channel: "GOOGLE" | "META" | "ORGANIC";
  defaultSpend?: number;
  defaultClicks?: number;
  defaultImpressions?: number;
  defaultBudget?: number;
  defaultCampaign?: string;
};

export default function CampaignSnapshotSyncModal({
  channel,
  defaultSpend = 13.81,
  defaultClicks = 2,
  defaultImpressions = 9,
  defaultBudget = 500,
  defaultCampaign = "Kidzee_Dwarka_Sec12_Search_2KM",
}: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [spend, setSpend] = useState(String(defaultSpend));
  const [clicks, setClicks] = useState(String(defaultClicks));
  const [impressions, setImpressions] = useState(String(defaultImpressions));
  const [budget, setBudget] = useState(String(defaultBudget));
  const [campaignName, setCampaignName] = useState(defaultCampaign);

  async function handleSync(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/marketing/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          spend: parseFloat(spend) || 0,
          clicks: parseInt(clicks, 10) || 0,
          impressions: parseInt(impressions, 10) || 0,
          budget: parseFloat(budget) || 500,
          campaignName,
        }),
      });

      const data = await res.json() as { success?: boolean; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update snapshot.");
      }

      setMessage("Campaign snapshot updated successfully!");
      router.refresh();
      setTimeout(() => {
        setIsOpen(false);
        setMessage("");
      }, 800);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Error updating snapshot.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 rounded-xl border border-[#D5C2E6] bg-white px-3.5 py-2 text-xs font-black text-[#5B2A86] shadow-sm transition hover:bg-[#FAF5FD] hover:border-[#B483D6]"
      >
        <RefreshCw size={14} className="text-[#6A328F]" />
        <span>Sync Campaign Snapshot</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-[#1F0E2F]/60 backdrop-blur-xs"
            onClick={() => !isSubmitting && setIsOpen(false)}
          />

          <div className="relative w-full max-w-md rounded-3xl border border-[#E9DFEF] bg-white p-6 shadow-2xl z-10">
            <div className="flex items-center justify-between border-b border-[#F0E8F6] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#5B2A86] text-white">
                  <Sparkles size={18} className="text-amber-300" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#2D1736]">
                    Sync Google Ads Snapshot
                  </h3>
                  <p className="text-[11px] text-[#7A6E82]">
                    Updates live spend, clicks & keywords in CentreOS
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-lg p-1 text-[#8A7996] hover:bg-[#F6EEFA] hover:text-[#5B2A86]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSync} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-[#6D5D77] mb-1">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full rounded-xl border border-[#DACCE3] px-3 py-2 font-bold text-[#2D1736] focus:border-[#5B2A86] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6D5D77] mb-1">
                    Daily Budget (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full rounded-xl border border-[#DACCE3] px-3 py-2 font-bold text-[#2D1736] focus:border-[#5B2A86] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6D5D77] mb-1">
                    Total Spend (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={spend}
                    onChange={(e) => setSpend(e.target.value)}
                    className="w-full rounded-xl border border-[#DACCE3] px-3 py-2 font-bold text-[#2D1736] focus:border-[#5B2A86] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-[#6D5D77] mb-1">
                    Clicks
                  </label>
                  <input
                    type="number"
                    value={clicks}
                    onChange={(e) => setClicks(e.target.value)}
                    className="w-full rounded-xl border border-[#DACCE3] px-3 py-2 font-bold text-[#2D1736] focus:border-[#5B2A86] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#6D5D77] mb-1">
                    Impressions
                  </label>
                  <input
                    type="number"
                    value={impressions}
                    onChange={(e) => setImpressions(e.target.value)}
                    className="w-full rounded-xl border border-[#DACCE3] px-3 py-2 font-bold text-[#2D1736] focus:border-[#5B2A86] focus:outline-none"
                    required
                  />
                </div>
              </div>

              {message && (
                <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 p-2.5 text-emerald-800 font-bold">
                  <CheckCircle2 size={15} className="text-emerald-600" />
                  <span>{message}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl border border-[#DACCE3] px-3.5 py-2 font-bold text-[#6D5D77] hover:bg-[#FAF6FC]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#5B2A86] px-4 py-2 font-black text-white shadow-md transition hover:bg-[#4B2070] disabled:opacity-50"
                >
                  {isSubmitting && <LoaderCircle size={14} className="animate-spin" />}
                  <span>Save & Sync</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
