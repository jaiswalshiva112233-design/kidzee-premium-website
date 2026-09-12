"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  Sparkles,
  Tag,
  X,
} from "lucide-react";

type TeacherActivityItem = {
  id: string;
  title: string;
  domain: string;
  description: string;
  learningOutcome: string | null;
  materialsNeeded: string | null;
  activityDate: string;
  status: "DRAFT" | "SUBMITTED" | "REVIEWED";
  reviewNotes: string | null;
  batch: { id: string; name: string; programme: string };
  teacher: { id: string; name: string };
};

type BatchOption = {
  id: string;
  name: string;
  programme: string;
};

const DOMAIN_LABELS: Record<string, string> = {
  GROSS_MOTOR: "Gross Motor Skills",
  FINE_MOTOR: "Fine Motor Skills",
  LANGUAGE_LITERACY: "Language & Literacy",
  COGNITIVE_MATH: "Cognitive & Math",
  CREATIVE_ARTS: "Creative & Visual Arts",
  SOCIAL_EMOTIONAL: "Social & Emotional",
  SENSORY_EXPLORATION: "Sensory Play",
  GENERAL_THEME: "Theme / Unit Study",
};

export default function TeacherActivitiesPage() {
  const [activities, setActivities] = useState<TeacherActivityItem[]>([]);
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [batchId, setBatchId] = useState("");
  const [title, setTitle] = useState("");
  const [domain, setDomain] = useState("LANGUAGE_LITERACY");
  const [description, setDescription] = useState("");
  const [learningOutcome, setLearningOutcome] = useState("");
  const [materialsNeeded, setMaterialsNeeded] = useState("");
  const [activityDate, setActivityDate] = useState(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  });
  const [submitStatus, setSubmitStatus] = useState<"DRAFT" | "SUBMITTED">("SUBMITTED");

  useEffect(() => {
    async function loadData() {
      try {
        const [actRes, btcRes] = await Promise.all([
          fetch("/api/teacher/activities").then((r) => r.json()),
          fetch("/api/teacher/attendance").then((r) => r.json()),
        ]);

        if (actRes.success) setActivities(actRes.activities || []);
        if (btcRes.batches) {
          setBatches(btcRes.batches);
          if (btcRes.batches[0]) setBatchId(btcRes.batches[0].id);
        }
      } catch (err) {
        console.error("Activities load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  async function handleCreateActivity(e: React.FormEvent) {
    e.preventDefault();
    if (!title || !description || !batchId) return;

    setSaving(true);
    try {
      const res = await fetch("/api/teacher/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId,
          title,
          domain,
          description,
          learningOutcome,
          materialsNeeded,
          activityDate,
          status: submitStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActivities((prev) => [data.activity, ...prev]);
        setModalOpen(false);
        setTitle("");
        setDescription("");
        setLearningOutcome("");
        setMaterialsNeeded("");
      } else {
        alert(data.message || "Failed to create activity.");
      }
    } catch {
      alert("Error saving activity.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#EAE2EF] bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2D1736] sm:text-2xl">Weekly Activities & Learning Records</h1>
          <p className="text-xs font-semibold text-[#7E7085]">Plan and document daily classroom activities</p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 py-3 text-xs font-black text-white shadow-xs transition hover:bg-[#48206C]"
        >
          <Plus size={16} />
          <span>New Activity Plan</span>
        </button>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-[#5B2A86]" size={32} />
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-3xl border border-[#EAE2EF] bg-white p-10 text-center">
          <Sparkles className="mx-auto text-[#B3A2BE]" size={40} />
          <p className="mt-3 text-base font-black text-[#2D1736]">No activity plans submitted yet</p>
          <p className="mt-1 text-xs text-[#7E7085]">Tap "+ New Activity Plan" to log your classroom plans.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activities.map((act) => {
            const dateStr = new Intl.DateTimeFormat("en-IN", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            }).format(new Date(act.activityDate));

            return (
              <div
                key={act.id}
                className="rounded-3xl border border-[#EAE2EF] bg-white p-5 shadow-xs transition hover:border-[#D5C2E2]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#F3EAF8] px-2 py-0.5 text-[10px] font-black uppercase text-[#5B2A86]">
                        {DOMAIN_LABELS[act.domain] || act.domain}
                      </span>
                      <span className="rounded-md bg-[#FAF8FB] px-2 py-0.5 text-[10px] font-bold text-[#7E7085]">
                        {act.batch.name}
                      </span>
                      <span className="text-[11px] font-semibold text-[#9C8EA3]">{dateStr}</span>
                    </div>
                    <h2 className="mt-2 text-base font-black text-[#2D1736]">{act.title}</h2>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      act.status === "REVIEWED"
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : act.status === "SUBMITTED"
                          ? "bg-[#DBEAFE] text-[#1D4ED8]"
                          : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {act.status}
                  </span>
                </div>

                <p className="mt-3 text-xs font-medium leading-relaxed text-[#54445B]">{act.description}</p>

                {act.learningOutcome && (
                  <div className="mt-3 rounded-2xl bg-[#FAF8FB] p-3 text-xs font-medium text-[#2D1736]">
                    <span className="font-bold text-[#5B2A86]">Learning Outcome: </span>
                    {act.learningOutcome}
                  </div>
                )}

                {act.materialsNeeded && (
                  <p className="mt-2 text-[11px] font-medium text-[#7E7085]">
                    <span className="font-bold">Materials Needed:</span> {act.materialsNeeded}
                  </p>
                )}

                {act.reviewNotes && (
                  <div className="mt-3 rounded-2xl border border-[#D5C2E2] bg-[#F7F2FA] p-3 text-xs">
                    <span className="font-black text-[#5B2A86]">Centre Head Review: </span>
                    <span className="font-medium text-[#54445B]">{act.reviewNotes}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal New Activity */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F0EAF3] pb-4">
              <h3 className="text-base font-black text-[#2D1736]">Create Learning Activity</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 text-[#7E7085] hover:bg-[#F3EAF8]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateActivity} className="mt-4 space-y-4">
              <div>
                <label className="text-[11px] font-black uppercase text-[#7E7085]">Section / Batch</label>
                <select
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-bold text-[#2D1736]"
                >
                  {batches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.programme})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-[#7E7085]">Activity Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Finger Painting Primary Colours"
                  className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-bold text-[#2D1736]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-[#7E7085]">Learning Domain</label>
                  <select
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-bold text-[#2D1736]"
                  >
                    {Object.entries(DOMAIN_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-[#7E7085]">Planned Date</label>
                  <input
                    type="date"
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-bold text-[#2D1736]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-[#7E7085]">Activity Description</label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the steps, group interaction and instructions..."
                  className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-medium text-[#2D1736]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-[#7E7085]">Learning Outcome</label>
                <input
                  type="text"
                  value={learningOutcome}
                  onChange={(e) => setLearningOutcome(e.target.value)}
                  placeholder="e.g. Identifies Red, Blue and Yellow; develops fine motor grip"
                  className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-medium text-[#2D1736]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-[#7E7085]">Materials Needed</label>
                <input
                  type="text"
                  value={materialsNeeded}
                  onChange={(e) => setMaterialsNeeded(e.target.value)}
                  placeholder="e.g. Non-toxic finger paint, drawing sheets, wet wipes"
                  className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-medium text-[#2D1736]"
                />
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#F0EAF3]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl px-4 py-2 text-xs font-bold text-[#7E7085]"
                >
                  Cancel
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    onClick={() => setSubmitStatus("DRAFT")}
                    disabled={saving}
                    className="rounded-xl border border-[#D5C2E2] bg-white px-4 py-2.5 text-xs font-bold text-[#5B2A86]"
                  >
                    Save as Draft
                  </button>
                  <button
                    type="submit"
                    onClick={() => setSubmitStatus("SUBMITTED")}
                    disabled={saving}
                    className="rounded-xl bg-[#5B2A86] px-5 py-2.5 text-xs font-black text-white hover:bg-[#48206C]"
                  >
                    {saving ? "Saving..." : "Submit to Centre Head"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
