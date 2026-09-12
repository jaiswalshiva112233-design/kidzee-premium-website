"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  CalendarCheck2,
  CalendarDays,
  CalendarX2,
  Clock,
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  FileText
} from "lucide-react";

type StaffLeaveInfo = {
  id: string;
  name: string;
  staffNumber: string;
  paidLeaveAllowance: number;
  paidLeaveCycle: string;
  totalPaidDaysUsed: number;
  remainingPaidDays: number;
  pendingRequestsCount: number;
};

type LeaveRequest = {
  id: string;
  leaveNumber: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedDays: number;
  paidDays: number;
  unpaidDays: number;
  reason: string;
  reviewNotes: string | null;
  approvedBy?: { id: string; name: string } | null;
  createdAt: string;
};

type AttendanceRecord = {
  id: string;
  attendanceDate: string;
  status: "PRESENT" | "ABSENT" | "LATE" | "HALF_DAY" | "LEAVE";
  checkInTime: string | null;
  checkOutTime: string | null;
  notes: string | null;
  isSandwichDay: boolean;
};

type AttendanceSummary = {
  present: number;
  absent: number;
  late: number;
  halfDay: number;
  leave: number;
  sandwichDays: number;
};

export default function TeacherLeavesPage() {
  const [activeTab, setActiveTab] = useState<"leaves" | "attendance">("leaves");
  const [leaveInfo, setLeaveInfo] = useState<StaffLeaveInfo | null>(null);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceSummary, setAttendanceSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Calendar navigation
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [leaveType, setLeaveType] = useState<"PAID_LEAVE" | "UNPAID_LEAVE">("PAID_LEAVE");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  async function loadData() {
    setLoading(true);
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;

      const [leaveRes, attRes] = await Promise.all([
        fetch("/api/teacher/leave").then((r) => r.json()),
        fetch(`/api/teacher/my-attendance?year=${year}&month=${month}`).then((r) => r.json()),
      ]);

      if (leaveRes.success) {
        setLeaveInfo(leaveRes.staff);
        setRequests(leaveRes.requests || []);
      }
      if (attRes.success) {
        setAttendanceRecords(attRes.records || []);
        setAttendanceSummary(attRes.summary || null);
      }
    } catch (err) {
      console.error("Failed to load leaves & attendance data", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentDate]);

  function prevMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  }

  async function handleApplyLeave(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");

    if (!startDate || !endDate) {
      setFormError("Please select both start and end dates.");
      return;
    }
    if (new Date(endDate) < new Date(startDate)) {
      setFormError("End date cannot be earlier than start date.");
      return;
    }
    if (!reason.trim()) {
      setFormError("Please specify a reason for your leave request.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/teacher/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate,
          endDate,
          leaveType,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.message || "Failed to submit leave application.");
        return;
      }

      setFormSuccess("Leave application submitted successfully! Centre Head will review.");
      setStartDate("");
      setEndDate("");
      setReason("");
      setTimeout(() => {
        setShowApplyModal(false);
        setFormSuccess("");
        loadData();
      }, 1500);
    } catch (err) {
      setFormError("A network error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  }

  const monthName = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(currentDate);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black text-[#2D1736] sm:text-3xl">Leave & My Attendance</h1>
          <p className="text-xs font-semibold text-[#5B2A86]/80 sm:text-sm">
            Track your leave balance, apply for leaves, and inspect monthly attendance.
          </p>
        </div>
        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 py-3 text-sm font-bold text-white shadow transition hover:bg-[#471E6B]"
        >
          <PlusCircle className="h-5 w-5" />
          Apply for Leave
        </button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-[#ECE4F0] p-1">
        <button
          onClick={() => setActiveTab("leaves")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            activeTab === "leaves"
              ? "bg-[#2D1736] text-white shadow"
              : "text-[#5B2A86] hover:bg-[#D5C2E2]/50"
          }`}
        >
          Leave Applications & Balance
        </button>
        <button
          onClick={() => setActiveTab("attendance")}
          className={`flex-1 rounded-xl py-2.5 text-xs font-bold transition sm:text-sm ${
            activeTab === "attendance"
              ? "bg-[#2D1736] text-white shadow"
              : "text-[#5B2A86] hover:bg-[#D5C2E2]/50"
          }`}
        >
          My Attendance Calendar
        </button>
      </div>

      {/* Leaves Tab Content */}
      {activeTab === "leaves" && (
        <div className="space-y-6">
          {/* Balance Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-[#D5C2E2] bg-white p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#5B2A86]/70">Annual Allowance</p>
              <p className="mt-2 text-2xl font-black text-[#2D1736]">
                {loading ? "..." : leaveInfo?.paidLeaveAllowance ?? 0}
                <span className="text-xs font-medium text-[#5B2A86]/70"> days</span>
              </p>
              <p className="mt-1 text-[11px] text-[#5B2A86]/60">Cycle: {leaveInfo?.paidLeaveCycle || "Annual"}</p>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-800">Remaining Paid</p>
              <p className="mt-2 text-2xl font-black text-emerald-700">
                {loading ? "..." : leaveInfo?.remainingPaidDays ?? 0}
                <span className="text-xs font-medium text-emerald-600"> days</span>
              </p>
              <p className="mt-1 text-[11px] text-emerald-600">Available to utilize</p>
            </div>

            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-wider text-blue-800">Paid Days Used</p>
              <p className="mt-2 text-2xl font-black text-blue-700">
                {loading ? "..." : leaveInfo?.totalPaidDaysUsed ?? 0}
                <span className="text-xs font-medium text-blue-600"> days</span>
              </p>
              <p className="mt-1 text-[11px] text-blue-600">Approved this cycle</p>
            </div>

            <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-800">Pending Requests</p>
              <p className="mt-2 text-2xl font-black text-amber-700">
                {loading ? "..." : leaveInfo?.pendingRequestsCount ?? 0}
              </p>
              <p className="mt-1 text-[11px] text-amber-600">Awaiting Centre Head</p>
            </div>
          </div>

          {/* Leave History List */}
          <div className="rounded-3xl border border-[#D5C2E2] bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-lg font-black text-[#2D1736]">Leave Application History</h2>
            <p className="text-xs font-semibold text-[#5B2A86]/70">
              Review statuses and feedback from Centre Head
            </p>

            <div className="mt-5 divide-y divide-[#ECE4F0]">
              {loading ? (
                <div className="py-8 text-center text-sm font-semibold text-[#5B2A86]">Loading leaves...</div>
              ) : requests.length === 0 ? (
                <div className="py-8 text-center">
                  <CalendarDays className="mx-auto h-12 w-12 text-[#5B2A86]/30" />
                  <p className="mt-3 text-sm font-bold text-[#2D1736]">No leave applications yet</p>
                  <p className="text-xs text-[#5B2A86]/70">You haven&apos;t submitted any leave applications this cycle.</p>
                </div>
              ) : (
                requests.map((req) => (
                  <div key={req.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-black text-[#5B2A86]">{req.leaveNumber}</span>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                              req.status === "APPROVED"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                : req.status === "REJECTED"
                                ? "bg-rose-100 text-rose-800 border border-rose-300"
                                : "bg-amber-100 text-amber-800 border border-amber-300"
                            }`}
                          >
                            {req.status}
                          </span>
                          <span className="rounded bg-[#ECE4F0] px-2 py-0.5 text-[10px] font-bold text-[#2D1736]">
                            {req.leaveType === "PAID_LEAVE" ? "Paid Leave" : "Unpaid Leave"}
                          </span>
                        </div>
                        <p className="mt-1 text-sm font-bold text-[#2D1736]">
                          {new Date(req.startDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          -{" "}
                          {new Date(req.endDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          <span className="text-xs font-semibold text-[#5B2A86]/70">
                            ({req.requestedDays} {req.requestedDays === 1 ? "day" : "days"})
                          </span>
                        </p>
                        <p className="mt-1 text-xs text-[#5B2A86]/90">
                          <span className="font-semibold text-[#2D1736]">Reason:</span> {req.reason}
                        </p>
                        {req.reviewNotes && (
                          <p className="mt-1 rounded-lg bg-amber-50 p-2 text-xs text-amber-900 border border-amber-200">
                            <span className="font-bold">Centre Head Note:</span> {req.reviewNotes}
                          </p>
                        )}
                      </div>

                      <div className="text-xs text-[#5B2A86]/70 sm:text-right">
                        Applied {new Date(req.createdAt).toLocaleDateString("en-IN")}
                        {req.approvedBy && (
                          <p className="text-[11px] font-semibold text-[#2D1736]">
                            Reviewed by: {req.approvedBy.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Attendance Tab Content */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          {/* Month Navigator */}
          <div className="flex items-center justify-between rounded-3xl border border-[#D5C2E2] bg-white p-4 shadow-sm">
            <button
              onClick={prevMonth}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F2FA] text-[#2D1736] transition hover:bg-[#ECE4F0]"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <h2 className="text-lg font-black text-[#2D1736]">{monthName}</h2>
              <p className="text-xs font-semibold text-[#5B2A86]/70">Monthly Attendance Breakdown</p>
            </div>
            <button
              onClick={nextMonth}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F7F2FA] text-[#2D1736] transition hover:bg-[#ECE4F0]"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {/* Month Stats */}
          {attendanceSummary && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3 text-center">
                <p className="text-[11px] font-black uppercase text-emerald-800">Present</p>
                <p className="mt-1 text-2xl font-black text-emerald-700">{attendanceSummary.present}</p>
              </div>
              <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3 text-center">
                <p className="text-[11px] font-black uppercase text-rose-800">Absent</p>
                <p className="mt-1 text-2xl font-black text-rose-700">{attendanceSummary.absent}</p>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3 text-center">
                <p className="text-[11px] font-black uppercase text-amber-800">Late</p>
                <p className="mt-1 text-2xl font-black text-amber-700">{attendanceSummary.late}</p>
              </div>
              <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3 text-center">
                <p className="text-[11px] font-black uppercase text-purple-800">Half Day</p>
                <p className="mt-1 text-2xl font-black text-purple-700">{attendanceSummary.halfDay}</p>
              </div>
              <div className="col-span-2 rounded-2xl border border-blue-200 bg-blue-50/50 p-3 text-center sm:col-span-1">
                <p className="text-[11px] font-black uppercase text-blue-800">Approved Leave</p>
                <p className="mt-1 text-2xl font-black text-blue-700">{attendanceSummary.leave}</p>
              </div>
            </div>
          )}

          {/* Records List */}
          <div className="rounded-3xl border border-[#D5C2E2] bg-white p-5 shadow-sm sm:p-6">
            <h3 className="text-base font-black text-[#2D1736]">Daily Logs</h3>
            <div className="mt-4 divide-y divide-[#ECE4F0]">
              {loading ? (
                <div className="py-6 text-center text-sm font-semibold text-[#5B2A86]">Loading logs...</div>
              ) : attendanceRecords.length === 0 ? (
                <div className="py-6 text-center text-sm text-[#5B2A86]/70">
                  No attendance records recorded for this month.
                </div>
              ) : (
                attendanceRecords.map((r) => (
                  <div key={r.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 flex-col items-center justify-center rounded-xl bg-[#F7F2FA] text-[#2D1736]">
                        <span className="text-[10px] font-bold uppercase">
                          {new Date(r.attendanceDate).toLocaleDateString("en-IN", { weekday: "short" })}
                        </span>
                        <span className="text-sm font-black">
                          {new Date(r.attendanceDate).getDate()}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-[#2D1736]">
                          {new Date(r.attendanceDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                        <p className="text-xs text-[#5B2A86]/70">
                          {r.checkInTime ? `In: ${r.checkInTime}` : "No in-time"} •{" "}
                          {r.checkOutTime ? `Out: ${r.checkOutTime}` : "No out-time"}
                          {r.notes ? ` (${r.notes})` : ""}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black ${
                        r.status === "PRESENT"
                          ? "bg-emerald-100 text-emerald-800"
                          : r.status === "ABSENT"
                          ? "bg-rose-100 text-rose-800"
                          : r.status === "LATE"
                          ? "bg-amber-100 text-amber-800"
                          : r.status === "HALF_DAY"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#ECE4F0] pb-4">
              <h2 className="text-lg font-black text-[#2D1736]">Apply for Leave</h2>
              <button
                onClick={() => setShowApplyModal(false)}
                className="rounded-full p-2 text-gray-500 hover:bg-[#F7F2FA]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-800 border border-rose-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                {formSuccess}
              </div>
            )}

            <form onSubmit={handleApplyLeave} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-[#2D1736]">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-[#2D1736]">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-2.5 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[#2D1736]">Leave Type</label>
                <div className="mt-1 grid grid-cols-2 gap-3">
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-xs font-bold transition ${
                      leaveType === "PAID_LEAVE"
                        ? "border-[#5B2A86] bg-[#5B2A86]/10 text-[#5B2A86]"
                        : "border-[#D5C2E2] text-gray-600 hover:bg-[#F7F2FA]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="leaveType"
                      value="PAID_LEAVE"
                      checked={leaveType === "PAID_LEAVE"}
                      onChange={() => setLeaveType("PAID_LEAVE")}
                      className="sr-only"
                    />
                    Paid Leave ({leaveInfo?.remainingPaidDays ?? 0} days remaining)
                  </label>
                  <label
                    className={`flex cursor-pointer items-center justify-center rounded-xl border p-3 text-xs font-bold transition ${
                      leaveType === "UNPAID_LEAVE"
                        ? "border-[#5B2A86] bg-[#5B2A86]/10 text-[#5B2A86]"
                        : "border-[#D5C2E2] text-gray-600 hover:bg-[#F7F2FA]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="leaveType"
                      value="UNPAID_LEAVE"
                      checked={leaveType === "UNPAID_LEAVE"}
                      onChange={() => setLeaveType("UNPAID_LEAVE")}
                      className="sr-only"
                    />
                    Unpaid Leave
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-[#2D1736]">Reason *</label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain reason for leave (e.g. personal family event, medical appointment, urgent personal work)..."
                  className="mt-1 w-full rounded-xl border border-[#D5C2E2] p-3 text-sm font-medium focus:border-[#5B2A86] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-xl border border-[#D5C2E2] px-4 py-2.5 text-xs font-bold text-gray-600 hover:bg-[#F7F2FA]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-xl bg-[#5B2A86] px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-[#471E6B] disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? "Submitting..." : "Submit Application"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
