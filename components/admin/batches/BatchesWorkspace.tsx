"use client";

import { useState } from "react";
import {
  Layers,
  PlusCircle,
  UsersRound,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  UserPlus,
  Trash2,
  Calendar,
  Sparkles,
  Search,
  Filter
} from "lucide-react";

type StaffSummary = {
  id: string;
  staffNumber: string;
  name: string;
  designation: string;
  phone: string;
};

type BatchItem = {
  id: string;
  name: string;
  programme: string;
  academicYear: string;
  room: string | null;
  capacity: number;
  status: string;
  notes: string | null;
  primaryTeacher: StaffSummary | null;
  assistantTeacher: StaffSummary | null;
  activeStudentCount: number;
  capacityEvaluation: {
    exceeded: boolean;
    nearCapacity: boolean;
    activeCount: number;
    capacity: number;
    occupancyRate: number;
    message: string | null;
  };
};

type StudentSummary = {
  id: string;
  studentNumber: string;
  firstName: string;
  lastName: string | null;
  programme: string;
  currentBatchName?: string | null;
};

type BatchesWorkspaceProps = {
  initialBatches: BatchItem[];
  staffMembers: StaffSummary[];
  students: StudentSummary[];
};

const PROGRAMME_LABELS: Record<string, string> = {
  PLAYGROUP: "Playgroup (1.5 - 2.5y)",
  NURSERY: "Nursery (2.5 - 3.5y)",
  JUNIOR_KG: "Junior KG (3.5 - 4.5y)",
  SENIOR_KG: "Senior KG (4.5 - 5.5y)",
  DAYCARE: "Daycare",
};

const DEFAULT_CAPACITIES: Record<string, number> = {
  PLAYGROUP: 8,
  NURSERY: 8,
  JUNIOR_KG: 10,
  SENIOR_KG: 10,
  DAYCARE: 12,
};

export default function BatchesWorkspace({
  initialBatches,
  staffMembers,
  students,
}: BatchesWorkspaceProps) {
  const [batches, setBatches] = useState<BatchItem[]>(initialBatches);
  const [selectedProgramme, setSelectedProgramme] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Create Batch Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createProgramme, setCreateProgramme] = useState("NURSERY");
  const [createYear, setCreateYear] = useState("2026-2027");
  const [createRoom, setCreateRoom] = useState("");
  const [createCapacity, setCreateCapacity] = useState<number>(8);
  const [createPrimaryTeacherId, setCreatePrimaryTeacherId] = useState("");
  const [createAssistantTeacherId, setCreateAssistantTeacherId] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Manage Students Modal State
  const [manageBatch, setManageBatch] = useState<BatchItem | null>(null);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);
  const [loadingBatchStudents, setLoadingBatchStudents] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [assignRollNumber, setAssignRollNumber] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [assignError, setAssignError] = useState("");
  const [assignWarning, setAssignWarning] = useState<string | null>(null);

  async function refreshBatches() {
    try {
      const res = await fetch("/api/admin/batches");
      const data = await res.json();
      if (data.success) {
        setBatches(data.batches);
      }
    } catch (err) {
      console.error("Failed to refresh batches", err);
    }
  }

  function handleProgrammeChange(prog: string) {
    setCreateProgramme(prog);
    setCreateCapacity(DEFAULT_CAPACITIES[prog] ?? 8);
  }

  async function handleCreateBatch(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);

    try {
      const res = await fetch("/api/admin/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createName,
          programme: createProgramme,
          academicYear: createYear,
          room: createRoom || null,
          capacity: Number(createCapacity),
          primaryTeacherId: createPrimaryTeacherId || null,
          assistantTeacherId: createAssistantTeacherId || null,
          notes: createNotes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCreateError(data.message || "Failed to create section.");
        return;
      }

      setShowCreateModal(false);
      setCreateName("");
      setCreateRoom("");
      setCreatePrimaryTeacherId("");
      setCreateAssistantTeacherId("");
      setCreateNotes("");
      await refreshBatches();
    } catch (err) {
      setCreateError("A network error occurred while creating batch.");
    } finally {
      setCreating(false);
    }
  }

  async function openManageStudents(batch: BatchItem) {
    setManageBatch(batch);
    setAssignError("");
    setAssignWarning(null);
    setLoadingBatchStudents(true);

    try {
      const res = await fetch(`/api/admin/batches/${batch.id}`);
      const data = await res.json();
      if (data.success) {
        setBatchStudents(data.batch.students || []);
      }
    } catch (err) {
      console.error("Failed to load batch students", err);
    } finally {
      setLoadingBatchStudents(false);
    }
  }

  async function handleAssignStudent(e: React.FormEvent) {
    e.preventDefault();
    if (!manageBatch || !assignStudentId) return;

    setAssigning(true);
    setAssignError("");
    setAssignWarning(null);

    try {
      const res = await fetch(`/api/admin/batches/${manageBatch.id}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: assignStudentId,
          rollNumber: assignRollNumber || null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAssignError(data.message || "Failed to assign student.");
        return;
      }

      if (data.warning) {
        setAssignWarning(data.warning);
      }

      setAssignStudentId("");
      setAssignRollNumber("");

      // Reload batch students & update batch list count
      const updatedRes = await fetch(`/api/admin/batches/${manageBatch.id}`);
      const updatedData = await updatedRes.json();
      if (updatedData.success) {
        setBatchStudents(updatedData.batch.students || []);
      }
      await refreshBatches();
    } catch (err) {
      setAssignError("Failed to assign student to section.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleRemoveStudent(studentId: string) {
    if (!manageBatch) return;
    if (!confirm("Are you sure you want to unassign this student from this section?")) return;

    try {
      const res = await fetch(
        `/api/admin/batches/${manageBatch.id}/students?studentId=${studentId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || "Failed to remove student.");
        return;
      }

      // Reload
      const updatedRes = await fetch(`/api/admin/batches/${manageBatch.id}`);
      const updatedData = await updatedRes.json();
      if (updatedData.success) {
        setBatchStudents(updatedData.batch.students || []);
      }
      await refreshBatches();
    } catch (err) {
      alert("Network error removing student.");
    }
  }

  const filteredBatches = batches.filter((b) => {
    if (selectedProgramme !== "ALL" && b.programme !== selectedProgramme) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.programme.toLowerCase().includes(q) ||
        b.primaryTeacher?.name.toLowerCase().includes(q) ||
        b.room?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalStudentsInBatches = batches.reduce((sum, b) => sum + b.activeStudentCount, 0);
  const exceededCount = batches.filter((b) => b.capacityEvaluation.exceeded).length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#2D1736] sm:text-3xl">Batches & Sections</h1>
          <p className="text-xs font-semibold text-[#5B2A86]/80 sm:text-sm">
            Manage classroom sections, student rosters, teacher assignments, and teacher-child ratios.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-[#471E6B]"
        >
          <PlusCircle className="h-5 w-5" />
          Create New Section
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[#D5C2E2] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#5B2A86]/70">Active Sections</p>
          <p className="mt-2 text-2xl font-black text-[#2D1736]">{batches.length}</p>
          <p className="mt-1 text-[11px] text-[#5B2A86]/60">Across all programmes</p>
        </div>

        <div className="rounded-2xl border border-[#D5C2E2] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#5B2A86]/70">Enrolled Students</p>
          <p className="mt-2 text-2xl font-black text-[#2D1736]">{totalStudentsInBatches}</p>
          <p className="mt-1 text-[11px] text-[#5B2A86]/60">Assigned to sections</p>
        </div>

        <div className={`rounded-2xl border p-4 shadow-sm ${
          exceededCount > 0
            ? "border-rose-200 bg-rose-50/60"
            : "border-emerald-200 bg-emerald-50/60"
        }`}>
          <p className={`text-[11px] font-black uppercase tracking-wider ${
            exceededCount > 0 ? "text-rose-800" : "text-emerald-800"
          }`}>
            Capacity Ratio Alerts
          </p>
          <p className={`mt-2 text-2xl font-black ${
            exceededCount > 0 ? "text-rose-700" : "text-emerald-700"
          }`}>
            {exceededCount}
          </p>
          <p className={`mt-1 text-[11px] ${
            exceededCount > 0 ? "text-rose-600" : "text-emerald-600"
          }`}>
            {exceededCount > 0 ? "Sections exceeding recommended ratio" : "All sections within ratio"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#D5C2E2] bg-white p-4 shadow-sm">
          <p className="text-[11px] font-black uppercase tracking-wider text-[#5B2A86]/70">Available Staff</p>
          <p className="mt-2 text-2xl font-black text-[#2D1736]">{staffMembers.length}</p>
          <p className="mt-1 text-[11px] text-[#5B2A86]/60">Teaching & care staff</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-[#D5C2E2] bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5">
          {["ALL", "PLAYGROUP", "NURSERY", "JUNIOR_KG", "SENIOR_KG", "DAYCARE"].map((prog) => (
            <button
              key={prog}
              onClick={() => setSelectedProgramme(prog)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition ${
                selectedProgramme === prog
                  ? "bg-[#2D1736] text-white shadow"
                  : "bg-[#F7F2FA] text-[#5B2A86] hover:bg-[#ECE4F0]"
              }`}
            >
              {prog === "ALL" ? "All Programmes" : prog.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#5B2A86]/40" />
          <input
            type="text"
            placeholder="Search sections or teachers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-[#D5C2E2] py-2 pl-9 pr-4 text-xs font-medium focus:border-[#5B2A86] focus:outline-none sm:w-64"
          />
        </div>
      </div>

      {/* Batches Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredBatches.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-[#D5C2E2] bg-white py-12 text-center">
            <Layers className="mx-auto h-12 w-12 text-[#5B2A86]/30" />
            <p className="mt-3 text-base font-bold text-[#2D1736]">No sections found</p>
            <p className="text-xs text-[#5B2A86]/70">
              Try adjusting your filter or click &quot;Create New Section&quot; to add one.
            </p>
          </div>
        ) : (
          filteredBatches.map((batch) => {
            const ev = batch.capacityEvaluation;
            return (
              <div
                key={batch.id}
                className="flex flex-col justify-between rounded-3xl border border-[#D5C2E2] bg-white p-5 shadow-sm transition hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="inline-block rounded-full bg-[#ECE4F0] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#5B2A86]">
                        {batch.programme.replace("_", " ")}
                      </span>
                      <h3 className="mt-1 text-base font-black text-[#2D1736]">{batch.name}</h3>
                      <p className="text-xs text-[#5B2A86]/70">
                        {batch.academicYear} {batch.room ? "• " + batch.room : ""}
                      </p>
                    </div>
                    {ev.exceeded && (
                      <span className="flex items-center gap-1 rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-black text-rose-800 border border-rose-300">
                        <AlertTriangle className="h-3 w-3" />
                        Exceeded
                      </span>
                    )}
                  </div>

                  {/* Teachers Assigned */}
                  <div className="mt-4 rounded-2xl bg-[#F7F2FA] p-3 text-xs">
                    <p className="font-semibold text-[#2D1736]">
                      Primary:{" "}
                      <span className="font-bold text-[#5B2A86]">
                        {batch.primaryTeacher?.name || "Unassigned"}
                      </span>
                    </p>
                    {batch.assistantTeacher && (
                      <p className="mt-1 font-semibold text-[#2D1736]">
                        Assistant:{" "}
                        <span className="font-bold text-[#5B2A86]">
                          {batch.assistantTeacher.name}
                        </span>
                      </p>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#2D1736]">
                        Enrolled: {batch.activeStudentCount} / {batch.capacity}
                      </span>
                      <span
                        className={
                          ev.exceeded
                            ? "text-rose-600"
                            : ev.nearCapacity
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }
                      >
                        {ev.occupancyRate}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#ECE4F0]">
                      <div
                        className={`h-full transition-all ${
                          ev.exceeded
                            ? "bg-rose-500"
                            : ev.nearCapacity
                            ? "bg-amber-500"
                            : "bg-[#5B2A86]"
                        }`}
                        style={{ width: `${Math.min(100, ev.occupancyRate)}%` }}
                      />
                    </div>
                    {ev.message && (
                      <p className="mt-2 text-[11px] font-semibold text-rose-700">
                        {ev.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 border-t border-[#ECE4F0] pt-4">
                  <button
                    onClick={() => openManageStudents(batch)}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#2D1736] py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#471E6B]"
                  >
                    <UsersRound className="h-4 w-4" />
                    Manage Students ({batch.activeStudentCount})
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create Batch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ECE4F0] pb-4">
              <h2 className="text-lg font-black text-[#2D1736]">Create New Section</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-[#F7F2FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateBatch} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-[#2D1736]">Section Name *</label>
                <input
                  type="text"
                  required
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="e.g. Nursery Butterflies - Morning"
                  className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-[#2D1736]">Programme *</label>
                  <select
                    value={createProgramme}
                    onChange={(e) => handleProgrammeChange(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                  >
                    {Object.entries(PROGRAMME_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[#2D1736]">Academic Year *</label>
                  <input
                    type="text"
                    required
                    value={createYear}
                    onChange={(e) => setCreateYear(e.target.value)}
                    placeholder="2026-2027"
                    className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-[#2D1736]">Room / Location</label>
                  <input
                    type="text"
                    value={createRoom}
                    onChange={(e) => setCreateRoom(e.target.value)}
                    placeholder="Room 101, Ground Floor"
                    className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[#2D1736]">Max Capacity (Ratio Target)</label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={createCapacity}
                    onChange={(e) => setCreateCapacity(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-[#5B2A86]/70">
                    Recommended: {DEFAULT_CAPACITIES[createProgramme] ?? 8} students/teacher
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-[#2D1736]">Primary Teacher</label>
                  <select
                    value={createPrimaryTeacherId}
                    onChange={(e) => setCreatePrimaryTeacherId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                  >
                    <option value="">-- Select Teacher --</option>
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[#2D1736]">Assistant Teacher (Optional)</label>
                  <select
                    value={createAssistantTeacherId}
                    onChange={(e) => setCreateAssistantTeacherId(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                  >
                    <option value="">-- None --</option>
                    {staffMembers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.designation})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[#2D1736]">Notes / Instructions</label>
                <textarea
                  rows={2}
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="Optional section notes..."
                  className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl border border-[#D5C2E2] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-[#F7F2FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-xl bg-[#5B2A86] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#471E6B] disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  {creating ? "Creating..." : "Create Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Students Modal */}
      {manageBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ECE4F0] pb-4">
              <div>
                <span className="rounded-full bg-[#ECE4F0] px-2.5 py-0.5 text-[10px] font-black uppercase text-[#5B2A86]">
                  {manageBatch.programme.replace("_", " ")}
                </span>
                <h2 className="text-lg font-black text-[#2D1736]">{manageBatch.name} — Student Roster</h2>
                <p className="text-xs text-[#5B2A86]/70">
                  Capacity: {batchStudents.length} / {manageBatch.capacity} enrolled
                </p>
              </div>
              <button
                onClick={() => setManageBatch(null)}
                className="rounded-full p-2 text-gray-500 hover:bg-[#F7F2FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {assignError && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {assignError}
              </div>
            )}

            {assignWarning && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 p-3 text-xs font-bold text-amber-800 border border-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {assignWarning}
              </div>
            )}

            {/* Assign Student Form */}
            <form onSubmit={handleAssignStudent} className="mt-4 rounded-2xl bg-[#F7F2FA] p-4">
              <p className="text-xs font-black uppercase text-[#2D1736]">Assign Student to this Section</p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="sm:col-span-2">
                  <select
                    required
                    value={assignStudentId}
                    onChange={(e) => setAssignStudentId(e.target.value)}
                    className="w-full rounded-xl border border-[#D5C2E2] p-2.5 text-xs font-medium focus:border-[#5B2A86] focus:outline-none"
                  >
                    <option value="">-- Select Student to Assign --</option>
                    {students.map((std) => (
                      <option key={std.id} value={std.id}>
                        {std.firstName} {std.lastName} ({std.studentNumber}) - {std.programme}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    disabled={assigning || !assignStudentId}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#5B2A86] py-2.5 text-xs font-bold text-white shadow hover:bg-[#471E6B] disabled:opacity-50"
                  >
                    <UserPlus className="h-4 w-4" />
                    {assigning ? "Assigning..." : "Assign Student"}
                  </button>
                </div>
              </div>
            </form>

            {/* Current Enrolled List */}
            <div className="mt-4 flex-1 overflow-y-auto divide-y divide-[#ECE4F0]">
              {loadingBatchStudents ? (
                <div className="py-8 text-center text-sm font-semibold text-[#5B2A86]">Loading roster...</div>
              ) : batchStudents.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#5B2A86]/70">
                  No students assigned to this section yet.
                </div>
              ) : (
                batchStudents.map((s, idx) => (
                  <div key={s.studentId} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ECE4F0] text-xs font-black text-[#5B2A86]">
                        {s.rollNumber || idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold text-[#2D1736]">{s.name}</p>
                        <p className="text-xs text-[#5B2A86]/70">
                          ID: {s.studentNumber}
                          {s.primaryGuardian && (
                            <> • Contact: {s.primaryGuardian.name} ({s.primaryGuardian.phone})</>
                          )}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveStudent(s.studentId)}
                      title="Unassign Student"
                      className="rounded-xl p-2 text-rose-500 hover:bg-rose-50 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 border-t border-[#ECE4F0] pt-3 text-right">
              <button
                type="button"
                onClick={() => setManageBatch(null)}
                className="rounded-xl bg-[#2D1736] px-5 py-2 text-xs font-bold text-white hover:bg-[#471E6B]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
