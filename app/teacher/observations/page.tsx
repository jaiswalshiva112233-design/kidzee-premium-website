"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  Plus,
  UserCheck,
  UsersRound,
  X,
} from "lucide-react";

type ObservationReport = {
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
  status: "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "APPROVED";
  centreHeadFeedback: string | null;
  student: { id: string; firstName: string; lastName: string; preferredName: string | null };
  batch: { id: string; name: string; programme: string };
  reviewedBy: { id: string; name: string } | null;
};

type StudentOption = {
  studentId: string;
  name: string;
  batch: { id: string; name: string; programme: string };
};

export default function TeacherObservationsPage() {
  const [reports, setReports] = useState<ObservationReport[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [studentId, setStudentId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [term, setTerm] = useState("Term 1 - 2026");
  const [strengths, setStrengths] = useState("");
  const [areasOfGrowth, setAreasOfGrowth] = useState("");
  const [socialEmotional, setSocialEmotional] = useState("");
  const [motorSkills, setMotorSkills] = useState("");
  const [language, setLanguage] = useState("");
  const [cognitive, setCognitive] = useState("");
  const [general, setGeneral] = useState("");
  const [submitStatus, setSubmitStatus] = useState<"DRAFT" | "SUBMITTED">("SUBMITTED");

  useEffect(() => {
    async function loadData() {
      try {
        const [repRes, stdRes] = await Promise.all([
          fetch("/api/teacher/observations").then((r) => r.json()),
          fetch("/api/teacher/students").then((r) => r.json()),
        ]);
        if (repRes.success) setReports(repRes.reports || []);
        if (stdRes.students) {
          setStudents(stdRes.students);
          if (stdRes.students[0]) {
            setStudentId(stdRes.students[0].studentId);
            setBatchId(stdRes.students[0].batch.id);
          }
        }
      } catch (err) {
        console.error("Observations load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function handleSelectStudent(sId: string) {
    setStudentId(sId);
    const found = students.find((s) => s.studentId === sId);
    if (found) setBatchId(found.batch.id);
  }

  async function handleCreateReport(e: React.FormEvent) {
    e.preventDefault();
    if (!studentId || !batchId || !strengths || !areasOfGrowth) return;

    setSaving(true);
    try {
      const res = await fetch("/api/teacher/observations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          batchId,
          term,
          strengths,
          areasOfGrowth,
          socialEmotionalDevelopment: socialEmotional || null,
          motorSkillsDevelopment: motorSkills || null,
          languageCommunication: language || null,
          cognitiveCuriosity: cognitive || null,
          generalObservations: general || null,
          status: submitStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReports((prev) => [data.report, ...prev]);
        setModalOpen(false);
        setStrengths("");
        setAreasOfGrowth("");
        setSocialEmotional("");
        setMotorSkills("");
        setLanguage("");
        setCognitive("");
        setGeneral("");
      } else {
        alert(data.message || "Failed to create observation report.");
      }
    } catch {
      alert("Error saving observation report.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#EAE2EF] bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2D1736] sm:text-2xl">Student Observation Reports</h1>
          <p className="text-xs font-semibold text-[#7E7085]">
            Child developmental milestones, strengths & progress records
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 py-3 text-xs font-black text-white shadow-xs transition hover:bg-[#48206C]"
        >
          <Plus size={16} />
          <span>New Observation</span>
        </button>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-[#5B2A86]" size={32} />
        </div>
      ) : reports.length === 0 ? (
        <div className="rounded-3xl border border-[#EAE2EF] bg-white p-10 text-center">
          <UserCheck className="mx-auto text-[#B3A2BE]" size={40} />
          <p className="mt-3 text-base font-black text-[#2D1736]">No observation reports created yet</p>
          <p className="mt-1 text-xs text-[#7E7085]">Create your first observation record for Centre Head review.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((rep) => {
            const studentName = rep.student.preferredName
              ? `${rep.student.preferredName} (${rep.student.firstName} ${rep.student.lastName})`
              : `${rep.student.firstName} ${rep.student.lastName}`;

            return (
              <div
                key={rep.id}
                className="rounded-3xl border border-[#EAE2EF] bg-white p-5 shadow-xs transition hover:border-[#D5C2E2]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-black text-[#2D1736]">{studentName}</p>
                      <span className="rounded-md bg-[#FAF8FB] px-2 py-0.5 text-[10px] font-bold text-[#7E7085]">
                        {rep.batch.name} • {rep.term}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] font-bold text-[#9C8EA3]">Report ID: {rep.reportNumber}</p>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
                      rep.status === "APPROVED"
                        ? "bg-[#DCFCE7] text-[#15803D]"
                        : rep.status === "CHANGES_REQUESTED"
                          ? "bg-[#FEF3C7] text-[#B45309]"
                          : rep.status === "SUBMITTED"
                            ? "bg-[#DBEAFE] text-[#1D4ED8]"
                            : "bg-[#F3F4F6] text-[#6B7280]"
                    }`}
                  >
                    {rep.status.replace("_", " ")}
                  </span>
                </div>

                {/* Feedback notice if changes requested */}
                {rep.status === "CHANGES_REQUESTED" && rep.centreHeadFeedback && (
                  <div className="mt-3.5 rounded-2xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-xs">
                    <span className="font-black text-[#B45309]">Centre Head Requested Changes: </span>
                    <p className="mt-0.5 font-semibold text-[#92400E]">{rep.centreHeadFeedback}</p>
                  </div>
                )}

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-[#FAF8FB] p-3.5">
                    <p className="text-xs font-black text-[#15803D]">Key Strengths</p>
                    <p className="mt-1 text-xs font-medium text-[#4D3F54]">{rep.strengths}</p>
                  </div>
                  <div className="rounded-2xl bg-[#FAF8FB] p-3.5">
                    <p className="text-xs font-black text-[#B45309]">Areas of Growth</p>
                    <p className="mt-1 text-xs font-medium text-[#4D3F54]">{rep.areasOfGrowth}</p>
                  </div>
                </div>

                {rep.socialEmotionalDevelopment && (
                  <p className="mt-3 text-xs font-medium text-[#54445B]">
                    <span className="font-bold text-[#5B2A86]">Social & Emotional: </span>
                    {rep.socialEmotionalDevelopment}
                  </p>
                )}

                {rep.motorSkillsDevelopment && (
                  <p className="mt-1 text-xs font-medium text-[#54445B]">
                    <span className="font-bold text-[#5B2A86]">Motor Skills: </span>
                    {rep.motorSkillsDevelopment}
                  </p>
                )}

                {rep.languageCommunication && (
                  <p className="mt-1 text-xs font-medium text-[#54445B]">
                    <span className="font-bold text-[#5B2A86]">Language: </span>
                    {rep.languageCommunication}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* New Observation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#F0EAF3] pb-4">
              <h3 className="text-base font-black text-[#2D1736]">New Child Observation Report</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-full p-1 text-[#7E7085] hover:bg-[#F3EAF8]"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-[#7E7085]">Student</label>
                  <select
                    value={studentId}
                    onChange={(e) => handleSelectStudent(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-bold text-[#2D1736]"
                  >
                    {students.map((s) => (
                      <option key={s.studentId} value={s.studentId}>
                        {s.name} ({s.batch.name})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-[#7E7085]">Term / Period</label>
                  <input
                    type="text"
                    required
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Term 1 - 2026"
                    className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-bold text-[#2D1736]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-[#15803D]">Key Strengths *</label>
                <textarea
                  rows={2}
                  required
                  value={strengths}
                  onChange={(e) => setStrengths(e.target.value)}
                  placeholder="e.g. Enthusiastic participant in circle time, shares toys willingly..."
                  className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-medium text-[#2D1736]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-[#B45309]">Areas of Growth *</label>
                <textarea
                  rows={2}
                  required
                  value={areasOfGrowth}
                  onChange={(e) => setAreasOfGrowth(e.target.value)}
                  placeholder="e.g. Encouraging tripod pencil grip, building longer attention span during storytelling..."
                  className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-medium text-[#2D1736]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-[#7E7085]">Social & Emotional</label>
                <input
                  type="text"
                  value={socialEmotional}
                  onChange={(e) => setSocialEmotional(e.target.value)}
                  placeholder="Peer interactions, expressing emotions, empathy..."
                  className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-medium text-[#2D1736]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-[#7E7085]">Motor Skills Development</label>
                <input
                  type="text"
                  value={motorSkills}
                  onChange={(e) => setMotorSkills(e.target.value)}
                  placeholder="Running, jumping, block balancing, scissor cutting..."
                  className="mt-1 w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] p-3 text-xs font-medium text-[#2D1736]"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-[#7E7085]">Language & Communication</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  placeholder="Vocabulary, sentence formation, phonics sounds..."
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
                    Save Draft
                  </button>
                  <button
                    type="submit"
                    onClick={() => setSubmitStatus("SUBMITTED")}
                    disabled={saving}
                    className="rounded-xl bg-[#5B2A86] px-5 py-2.5 text-xs font-black text-white hover:bg-[#48206C]"
                  >
                    {saving ? "Submitting..." : "Submit to Centre Head"}
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
