"use client";

import { useState } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Sparkles,
  UserCheck,
  FileText,
  Clock,
  Send,
  MessageSquare
} from "lucide-react";

export type ObservationItem = {
  id: string;
  reportNumber: string;
  term: string;
  reportDate: string;
  strengths: string;
  areasOfGrowth: string;
  socialEmotionalDevelopment: string | null;
  motorSkillsDevelopment: string | null;
  languageCommunication: string | null;
  cognitiveCuriosity: string | null;
  generalObservations: string | null;
  status: string;
  centreHeadFeedback: string | null;
  student: { id: string; firstName: string; lastName: string | null; preferredName: string | null };
  batch: { id: string; name: string; programme: string };
  teacher: { id: string; name: string; designation: string };
};

export type ActivityItem = {
  id: string;
  activityDate: string;
  weekStartDate: string;
  domain: string;
  title: string;
  description: string;
  learningOutcome: string | null;
  materialsNeeded: string | null;
  status: string;
  reviewNotes: string | null;
  batch: { id: string; name: string; programme: string };
  teacher: { id: string; name: string; designation: string };
};

export type LeaveItem = {
  id: string;
  leaveNumber: string;
  startDate: string;
  endDate: string;
  requestedDays: number;
  paidDays: number;
  unpaidDays: number;
  leaveType: string;
  reason: string | null;
  status: string;
  staff: { id: string; staffNumber: string; name: string; designation: string };
};

type TeacherReviewsWorkspaceProps = {
  initialObservations: ObservationItem[];
  initialActivities: ActivityItem[];
  initialLeaves: LeaveItem[];
};

export default function TeacherReviewsWorkspace({
  initialObservations,
  initialActivities,
  initialLeaves,
}: TeacherReviewsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"observations" | "activities" | "leaves">("observations");
  const [observations, setObservations] = useState<ObservationItem[]>(initialObservations);
  const [activities, setActivities] = useState<ActivityItem[]>(initialActivities);
  const [leaves, setLeaves] = useState<LeaveItem[]>(initialLeaves);

  // Review Feedback states
  const [actionNotes, setActionNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleObservationAction(id: string, action: "APPROVE_OBSERVATION" | "REQUEST_OBSERVATION_CHANGES") {
    setProcessingId(id);
    setAlertMessage(null);
    const feedback = actionNotes[id] || "";

    if (action === "REQUEST_OBSERVATION_CHANGES" && !feedback.trim()) {
      setAlertMessage({ type: "error", text: "Please enter feedback for the teacher when requesting changes." });
      setProcessingId(null);
      return;
    }

    try {
      const res = await fetch("/api/admin/teacher-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, feedback }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAlertMessage({ type: "error", text: data.message || "Failed to process observation." });
        return;
      }

      setObservations((prev) => prev.filter((o) => o.id !== id));
      setAlertMessage({
        type: "success",
        text: action === "APPROVE_OBSERVATION" ? "Observation report approved!" : "Returned to teacher for changes.",
      });
    } catch (err) {
      setAlertMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleActivityReview(id: string) {
    setProcessingId(id);
    setAlertMessage(null);
    const notes = actionNotes[id] || "";

    try {
      const res = await fetch("/api/admin/teacher-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "REVIEW_ACTIVITY", id, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAlertMessage({ type: "error", text: data.message || "Failed to review activity." });
        return;
      }

      setActivities((prev) => prev.filter((a) => a.id !== id));
      setAlertMessage({ type: "success", text: "Activity marked as reviewed!" });
    } catch (err) {
      setAlertMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setProcessingId(null);
    }
  }

  async function handleLeaveAction(id: string, action: "APPROVE_LEAVE" | "REJECT_LEAVE") {
    setProcessingId(id);
    setAlertMessage(null);
    const notes = actionNotes[id] || "";

    try {
      const res = await fetch("/api/admin/teacher-reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, id, notes }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAlertMessage({ type: "error", text: data.message || "Failed to process leave request." });
        return;
      }

      setLeaves((prev) => prev.filter((l) => l.id !== id));
      setAlertMessage({
        type: "success",
        text: action === "APPROVE_LEAVE" ? "Teacher leave approved and attendance updated!" : "Leave request rejected.",
      });
    } catch (err) {
      setAlertMessage({ type: "error", text: "Network error occurred." });
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#2D1736] sm:text-3xl">Teacher Reviews & Approvals</h1>
        <p className="text-xs font-semibold text-[#5B2A86]/80 sm:text-sm">
          Centre Head approval dashboard for student observations, weekly activity plans, and teacher leaves.
        </p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-amber-800">Pending Observations</p>
          <p className="mt-2 text-2xl font-black text-amber-700">{observations.length}</p>
          <p className="mt-1 text-[11px] text-amber-600">Awaiting approval</p>
        </div>

        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-blue-800">Pending Activities</p>
          <p className="mt-2 text-2xl font-black text-blue-700">{activities.length}</p>
          <p className="mt-1 text-[11px] text-blue-600">Weekly learning plans</p>
        </div>

        <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-purple-800">Leave Requests</p>
          <p className="mt-2 text-2xl font-black text-purple-700">{leaves.length}</p>
          <p className="mt-1 text-[11px] text-purple-600">Teacher leaves</p>
        </div>

        <div className="rounded-2xl border border-[#D5C2E2] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#5B2A86]/70">Total Action Items</p>
          <p className="mt-2 text-2xl font-black text-[#2D1736]">
            {observations.length + activities.length + leaves.length}
          </p>
          <p className="mt-1 text-[11px] text-[#5B2A86]/60">Require Centre Head action</p>
        </div>
      </div>

      {/* Status Banner */}
      {alertMessage && (
        <div
          className={`flex items-center gap-2 rounded-2xl p-4 text-xs font-bold border ${
            alertMessage.type === "success"
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-rose-300 bg-rose-50 text-rose-800"
          }`}
        >
          {alertMessage.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {alertMessage.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex rounded-2xl bg-[#ECE4F0] p-1">
        <button
          onClick={() => setActiveTab("observations")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            activeTab === "observations"
              ? "bg-[#2D1736] text-white shadow"
              : "text-[#5B2A86] hover:bg-[#D5C2E2]/50"
          }`}
        >
          Observations ({observations.length})
        </button>
        <button
          onClick={() => setActiveTab("activities")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            activeTab === "activities"
              ? "bg-[#2D1736] text-white shadow"
              : "text-[#5B2A86] hover:bg-[#D5C2E2]/50"
          }`}
        >
          Activity Plans ({activities.length})
        </button>
        <button
          onClick={() => setActiveTab("leaves")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            activeTab === "leaves"
              ? "bg-[#2D1736] text-white shadow"
              : "text-[#5B2A86] hover:bg-[#D5C2E2]/50"
          }`}
        >
          Teacher Leaves ({leaves.length})
        </button>
      </div>

      {/* Tab 1: Observations */}
      {activeTab === "observations" && (
        <div className="space-y-4">
          {observations.length === 0 ? (
            <div className="rounded-3xl border border-[#D5C2E2] bg-white py-12 text-center">
              <ClipboardCheck className="mx-auto h-12 w-12 text-[#5B2A86]/30" />
              <p className="mt-3 text-base font-bold text-[#2D1736]">Queue is clear!</p>
              <p className="text-xs text-[#5B2A86]/70">No pending student observation reports.</p>
            </div>
          ) : (
            observations.map((obs) => (
              <div
                key={obs.id}
                className="rounded-3xl border border-[#D5C2E2] bg-white p-5 shadow-sm transition sm:p-6"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#5B2A86]">{obs.reportNumber}</span>
                      <span className="rounded bg-[#ECE4F0] px-2 py-0.5 text-[10px] font-bold text-[#2D1736]">
                        Term: {obs.term}
                      </span>
                      <span className="text-xs font-bold text-[#5B2A86]">{obs.batch.name}</span>
                    </div>
                    <h3 className="mt-1 text-base font-black text-[#2D1736]">
                      Student: {obs.student.preferredName || ((obs.student.firstName || "") + " " + (obs.student.lastName || "")).trim()}
                    </h3>
                    <p className="text-xs text-[#5B2A86]/70">
                      Reported by {obs.teacher.name} on {new Date(obs.reportDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50/50 p-3 text-xs border border-emerald-100">
                    <p className="font-bold text-emerald-900">Key Strengths:</p>
                    <p className="mt-1 text-emerald-800 whitespace-pre-wrap">{obs.strengths}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50/50 p-3 text-xs border border-amber-100">
                    <p className="font-bold text-amber-900">Areas of Growth:</p>
                    <p className="mt-1 text-amber-800 whitespace-pre-wrap">{obs.areasOfGrowth}</p>
                  </div>
                </div>

                {obs.generalObservations && (
                  <div className="mt-3 rounded-2xl bg-[#F7F2FA] p-3 text-xs">
                    <p className="font-bold text-[#2D1736]">General Observations:</p>
                    <p className="mt-1 text-[#5B2A86] whitespace-pre-wrap">{obs.generalObservations}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Feedback / change request instructions..."
                    value={actionNotes[obs.id] || ""}
                    onChange={(e) => setActionNotes({ ...actionNotes, [obs.id]: e.target.value })}
                    className="flex-1 rounded-xl border border-[#D5C2E2] p-2.5 text-xs font-medium focus:border-[#5B2A86] focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleObservationAction(obs.id, "REQUEST_OBSERVATION_CHANGES")}
                      disabled={processingId === obs.id}
                      className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    >
                      Request Changes
                    </button>
                    <button
                      onClick={() => handleObservationAction(obs.id, "APPROVE_OBSERVATION")}
                      disabled={processingId === obs.id}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: Activity Plans */}
      {activeTab === "activities" && (
        <div className="space-y-4">
          {activities.length === 0 ? (
            <div className="rounded-3xl border border-[#D5C2E2] bg-white py-12 text-center">
              <ClipboardCheck className="mx-auto h-12 w-12 text-[#5B2A86]/30" />
              <p className="mt-3 text-base font-bold text-[#2D1736]">Queue is clear!</p>
              <p className="text-xs text-[#5B2A86]/70">No pending weekly activity plans to review.</p>
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                className="rounded-3xl border border-[#D5C2E2] bg-white p-5 shadow-sm transition sm:p-6"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase text-blue-800">
                        {act.domain.replace("_", " ")}
                      </span>
                      <span className="text-xs font-bold text-[#5B2A86]">{act.batch.name}</span>
                    </div>
                    <h3 className="mt-1 text-base font-black text-[#2D1736]">{act.title}</h3>
                    <p className="text-xs text-[#5B2A86]/70">
                      Planned by {act.teacher.name} for {new Date(act.activityDate).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-[#F7F2FA] p-4 text-xs space-y-2">
                  <p className="text-[#5B2A86]/90 whitespace-pre-wrap">{act.description}</p>
                  {act.learningOutcome && (
                    <p className="text-[#5B2A86]">
                      <span className="font-bold text-[#2D1736]">Learning Outcome:</span> {act.learningOutcome}
                    </p>
                  )}
                  {act.materialsNeeded && (
                    <p className="text-[#5B2A86]">
                      <span className="font-bold text-[#2D1736]">Materials:</span> {act.materialsNeeded}
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Review notes or feedback for teacher..."
                    value={actionNotes[act.id] || ""}
                    onChange={(e) => setActionNotes({ ...actionNotes, [act.id]: e.target.value })}
                    className="flex-1 rounded-xl border border-[#D5C2E2] p-2.5 text-xs font-medium focus:border-[#5B2A86] focus:outline-none"
                  />
                  <button
                    onClick={() => handleActivityReview(act.id)}
                    disabled={processingId === act.id}
                    className="flex items-center justify-center gap-1.5 rounded-xl bg-[#5B2A86] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#471E6B] disabled:opacity-50"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Reviewed
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 3: Teacher Leaves */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
          {leaves.length === 0 ? (
            <div className="rounded-3xl border border-[#D5C2E2] bg-white py-12 text-center">
              <ClipboardCheck className="mx-auto h-12 w-12 text-[#5B2A86]/30" />
              <p className="mt-3 text-base font-bold text-[#2D1736]">Queue is clear!</p>
              <p className="text-xs text-[#5B2A86]/70">No pending teacher leave applications.</p>
            </div>
          ) : (
            leaves.map((lve) => (
              <div
                key={lve.id}
                className="rounded-3xl border border-[#D5C2E2] bg-white p-5 shadow-sm transition sm:p-6"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-[#5B2A86]">{lve.leaveNumber}</span>
                      <span className="rounded bg-[#ECE4F0] px-2 py-0.5 text-[10px] font-bold text-[#2D1736]">
                        {lve.leaveType === "PAID_LEAVE" ? "Paid Leave" : "Unpaid Leave"}
                      </span>
                    </div>
                    <h3 className="mt-1 text-base font-black text-[#2D1736]">
                      {lve.staff.name} ({lve.staff.designation})
                    </h3>
                    <p className="text-xs text-[#5B2A86]/80 font-semibold">
                      Dates: {new Date(lve.startDate).toLocaleDateString("en-IN")} to {new Date(lve.endDate).toLocaleDateString("en-IN")}{" "}
                      <span className="text-[#2D1736]">({lve.requestedDays} {lve.requestedDays === 1 ? "day" : "days"})</span>
                    </p>
                  </div>
                </div>

                {lve.reason && (
                  <div className="mt-3 rounded-2xl bg-[#F7F2FA] p-3 text-xs">
                    <p className="font-bold text-[#2D1736]">Reason:</p>
                    <p className="mt-0.5 text-[#5B2A86]">{lve.reason}</p>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    placeholder="Approval / rejection note for teacher..."
                    value={actionNotes[lve.id] || ""}
                    onChange={(e) => setActionNotes({ ...actionNotes, [lve.id]: e.target.value })}
                    className="flex-1 rounded-xl border border-[#D5C2E2] p-2.5 text-xs font-medium focus:border-[#5B2A86] focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLeaveAction(lve.id, "REJECT_LEAVE")}
                      disabled={processingId === lve.id}
                      className="rounded-xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleLeaveAction(lve.id, "APPROVE_LEAVE")}
                      disabled={processingId === lve.id}
                      className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Approve Leave
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
