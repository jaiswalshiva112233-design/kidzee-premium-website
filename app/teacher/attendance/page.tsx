"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarCheck2,
  Check,
  CheckCircle2,
  ChevronLeft,
  Clock,
  Clock3,
  Edit3,
  Loader2,
  Save,
  UsersRound,
  X,
} from "lucide-react";

type AttendanceStudentItem = {
  studentId: string;
  rollNumber: string | null;
  studentNumber: string;
  name: string;
  profilePhotoUrl: string | null;
  allergies: string | null;
  medicalNotes: string | null;
  attendance: {
    id: string | null;
    status: string | null;
    notes: string;
  };
};

type BatchOption = {
  id: string;
  name: string;
  programme: string;
  room: string | null;
};

export default function TeacherAttendancePage() {
  const [batches, setBatches] = useState<BatchOption[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string>("");
  const [date, setDate] = useState<string>(() => {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  });
  const [students, setStudents] = useState<AttendanceStudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  // Note modal state
  const [noteModalStudent, setNoteModalStudent] = useState<AttendanceStudentItem | null>(null);
  const [currentNote, setCurrentNote] = useState("");

  useEffect(() => {
    async function fetchRegister() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedBatchId) query.set("batchId", selectedBatchId);
        if (date) query.set("date", date);

        const res = await fetch(`/api/teacher/attendance?${query.toString()}`);
        const data = await res.json();
        if (data.success) {
          setBatches(data.batches || []);
          if (data.selectedBatchId && data.selectedBatchId !== selectedBatchId) {
            setSelectedBatchId(data.selectedBatchId);
          }
          setStudents(data.register || []);
        }
      } catch (err) {
        console.error("Attendance load error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRegister();
  }, [selectedBatchId, date]);

  function handleSetStatus(studentId: string, status: string) {
    setStudents((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          return {
            ...item,
            attendance: {
              ...item.attendance,
              status: item.attendance.status === status ? null : status,
            },
          };
        }
        return item;
      })
    );
  }

  function handleMarkAllPresent() {
    setStudents((prev) =>
      prev.map((item) => ({
        ...item,
        attendance: {
          ...item.attendance,
          status: "PRESENT",
        },
      }))
    );
  }

  function openNoteModal(student: AttendanceStudentItem) {
    setNoteModalStudent(student);
    setCurrentNote(student.attendance.notes || "");
  }

  function saveNote() {
    if (!noteModalStudent) return;
    setStudents((prev) =>
      prev.map((item) => {
        if (item.studentId === noteModalStudent.studentId) {
          return {
            ...item,
            attendance: {
              ...item.attendance,
              notes: currentNote.trim(),
            },
          };
        }
        return item;
      })
    );
    setNoteModalStudent(null);
  }

  async function handleSaveRegister() {
    if (!selectedBatchId) return;
    setSaving(true);
    setSavedMessage(null);
    try {
      const entries = students
        .filter((s) => s.attendance.status)
        .map((s) => ({
          studentId: s.studentId,
          status: s.attendance.status,
          notes: s.attendance.notes || null,
        }));

      const res = await fetch("/api/teacher/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          batchId: selectedBatchId,
          date,
          entries,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMessage(data.message || "Attendance saved successfully!");
        setTimeout(() => setSavedMessage(null), 4000);
      } else {
        alert(data.message || "Failed to save attendance.");
      }
    } catch {
      alert("Network error while saving attendance.");
    } finally {
      setSaving(false);
    }
  }

  const presentCount = students.filter((s) => s.attendance.status === "PRESENT").length;
  const absentCount = students.filter((s) => s.attendance.status === "ABSENT").length;
  const lateCount = students.filter((s) => s.attendance.status === "LATE").length;
  const halfDayCount = students.filter((s) => s.attendance.status === "HALF_DAY").length;
  const unmarkedCount = students.filter((s) => !s.attendance.status).length;

  return (
    <div className="space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#EAE2EF] bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2D1736] sm:text-2xl">Daily Attendance Register</h1>
          <p className="text-xs font-semibold text-[#7E7085]">Mark preschool attendance for your section</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Section Selector */}
          {batches.length > 1 && (
            <select
              value={selectedBatchId}
              onChange={(e) => setSelectedBatchId(e.target.value)}
              className="rounded-xl border border-[#D5C2E2] bg-[#FAF8FB] px-3 py-2 text-xs font-bold text-[#2D1736]"
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.programme})
                </option>
              ))}
            </select>
          )}

          {/* Date Picker */}
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl border border-[#D5C2E2] bg-[#FAF8FB] px-3 py-2 text-xs font-bold text-[#2D1736]"
          />
        </div>
      </div>

      {/* Summary Chips & Quick Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#F4ECF8] p-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          <span className="rounded-lg bg-[#DCFCE7] px-2.5 py-1 text-[#15803D]">Present: {presentCount}</span>
          <span className="rounded-lg bg-[#FEE2E2] px-2.5 py-1 text-[#B91C1C]">Absent: {absentCount}</span>
          <span className="rounded-lg bg-[#FEF3C7] px-2.5 py-1 text-[#B45309]">Late: {lateCount}</span>
          <span className="rounded-lg bg-[#DBEAFE] px-2.5 py-1 text-[#1D4ED8]">Half Day: {halfDayCount}</span>
          <span className="rounded-lg bg-white px-2.5 py-1 text-[#7E7085]">Unmarked: {unmarkedCount}</span>
        </div>

        <button
          type="button"
          onClick={handleMarkAllPresent}
          className="rounded-xl bg-[#5B2A86] px-3.5 py-2 text-xs font-black text-white shadow-xs transition hover:bg-[#48206C]"
        >
          Mark All Present
        </button>
      </div>

      {/* Success Notification */}
      {savedMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-[#DCFCE7] p-3.5 text-xs font-bold text-[#15803D]">
          <CheckCircle2 size={18} />
          <span>{savedMessage}</span>
        </div>
      )}

      {/* Student Attendance List */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-[#5B2A86]" size={32} />
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-3xl border border-[#EAE2EF] bg-white p-10 text-center">
          <UsersRound className="mx-auto text-[#B3A2BE]" size={40} />
          <p className="mt-3 text-base font-black text-[#2D1736]">No students in this section</p>
          <p className="mt-1 text-xs text-[#7E7085]">Students assigned to this section will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {students.map((student) => {
            const currentStatus = student.attendance.status;
            return (
              <div
                key={student.studentId}
                className="flex flex-col gap-3 rounded-2xl border border-[#EAE2EF] bg-white p-4 shadow-xs transition hover:border-[#D5C2E2] sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Student Info */}
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4ECF8] font-black text-[#5B2A86]">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-black text-[#2D1736]">{student.name}</p>
                      {student.rollNumber && (
                        <span className="rounded-md bg-[#F0EAF3] px-1.5 py-0.5 text-[10px] font-bold text-[#5B2A86]">
                          #{student.rollNumber}
                        </span>
                      )}
                    </div>

                    {/* Allergies / Medical Note alert */}
                    {(student.allergies || student.medicalNotes) && (
                      <div className="mt-0.5 flex items-center gap-1 text-[11px] font-bold text-[#D97706]">
                        <AlertTriangle size={12} />
                        <span>Allergy: {student.allergies || student.medicalNotes}</span>
                      </div>
                    )}

                    {student.attendance.notes && (
                      <p className="mt-0.5 text-[11px] italic text-[#7E7085]">Note: {student.attendance.notes}</p>
                    )}
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleSetStatus(student.studentId, "PRESENT")}
                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                      currentStatus === "PRESENT"
                        ? "bg-[#16A34A] text-white shadow-xs"
                        : "bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7]"
                    }`}
                  >
                    Present
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(student.studentId, "ABSENT")}
                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                      currentStatus === "ABSENT"
                        ? "bg-[#DC2626] text-white shadow-xs"
                        : "bg-[#FEF2F2] text-[#DC2626] hover:bg-[#FEE2E2]"
                    }`}
                  >
                    Absent
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(student.studentId, "LATE")}
                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                      currentStatus === "LATE"
                        ? "bg-[#D97706] text-white shadow-xs"
                        : "bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7]"
                    }`}
                  >
                    Late
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetStatus(student.studentId, "HALF_DAY")}
                    className={`rounded-xl px-3 py-2 text-xs font-black transition ${
                      currentStatus === "HALF_DAY"
                        ? "bg-[#2563EB] text-white shadow-xs"
                        : "bg-[#EFF6FF] text-[#2563EB] hover:bg-[#DBEAFE]"
                    }`}
                  >
                    Half Day
                  </button>

                  {/* Note Button */}
                  <button
                    type="button"
                    onClick={() => openNoteModal(student)}
                    className={`rounded-xl p-2 transition ${
                      student.attendance.notes
                        ? "bg-[#5B2A86] text-white"
                        : "bg-[#F3EAF8] text-[#5B2A86] hover:bg-[#E9DBF2]"
                    }`}
                    title="Add attendance note"
                  >
                    <Edit3 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Save Button */}
      {students.length > 0 && (
        <div className="sticky bottom-20 z-30 flex justify-end md:bottom-6">
          <button
            type="button"
            onClick={handleSaveRegister}
            disabled={saving}
            className="flex items-center gap-2 rounded-2xl bg-[#5B2A86] px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[#48206C] disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            <span>Save Attendance Register</span>
          </button>
        </div>
      )}

      {/* Note Modal */}
      {noteModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#2D1736]">
                Attendance Note: {noteModalStudent.name}
              </h3>
              <button
                onClick={() => setNoteModalStudent(null)}
                className="rounded-full p-1 text-[#7E7085] hover:bg-[#F3EAF8]"
              >
                <X size={18} />
              </button>
            </div>
            <textarea
              rows={3}
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder="e.g. Mild fever at 11 AM; parent informed. Or late arrival due to rain."
              className="mt-4 w-full rounded-2xl border border-[#D5C2E2] p-3 text-xs font-medium text-[#2D1736] focus:border-[#5B2A86] focus:outline-hidden"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModalStudent(null)}
                className="rounded-xl px-4 py-2 text-xs font-bold text-[#7E7085]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveNote}
                className="rounded-xl bg-[#5B2A86] px-4 py-2 text-xs font-black text-white hover:bg-[#48206C]"
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
