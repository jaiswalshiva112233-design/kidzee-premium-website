"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  MessageSquare,
  Sparkles,
  UsersRound,
} from "lucide-react";

type DashboardSummary = {
  batches: Array<{ id: string; name: string; programme: string; room: string | null }>;
  attendanceSummary: {
    total: number;
    marked: number;
    present: number;
    absent: number;
  } | null;
  studentsCount: number;
  unreadMessagesCount: number;
  remainingLeaveDays: number;
};

export default function TeacherDashboardPage() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [attRes, stdRes, msgRes, lveRes] = await Promise.all([
          fetch("/api/teacher/attendance").then((r) => r.json()),
          fetch("/api/teacher/students").then((r) => r.json()),
          fetch("/api/admin/messages").then((r) => r.json()),
          fetch("/api/teacher/leave").then((r) => r.json()),
        ]);

        setData({
          batches: attRes.batches || [],
          attendanceSummary: attRes.summary || null,
          studentsCount: stdRes.students?.length || 0,
          unreadMessagesCount: msgRes.unreadCount || 0,
          remainingLeaveDays: lveRes.staff?.remainingPaidDays || 0,
        });
      } catch (err) {
        console.error("Dashboard load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const todayText = new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 rounded-3xl bg-[#ECE4F0]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="h-28 rounded-2xl bg-[#ECE4F0]" />
          <div className="h-28 rounded-2xl bg-[#ECE4F0]" />
          <div className="h-28 rounded-2xl bg-[#ECE4F0]" />
        </div>
      </div>
    );
  }

  const att = data?.attendanceSummary;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-[#2D1736] p-6 text-white shadow-md sm:p-8">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#FFD34E]/15 blur-2xl" />
        <div className="relative">
          <p className="text-xs font-black uppercase tracking-widest text-[#FFD34E]">Daily Overview</p>
          <h1 className="mt-2 text-2xl font-black sm:text-3xl">Classroom Dashboard</h1>
          <p className="mt-1 text-xs font-semibold text-white/70 sm:text-sm">{todayText}</p>
        </div>
      </section>

      {/* Unread Message Notice */}
      {data && data.unreadMessagesCount > 0 && (
        <Link
          href="/teacher/messages"
          className="flex items-center justify-between rounded-2xl border border-[#D5C2E2] bg-[#F7F2FA] p-4 transition hover:bg-[#EFE6F5]"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B2A86] text-white">
              <MessageSquare size={20} />
            </span>
            <div>
              <p className="text-sm font-black text-[#5B2A86]">
                You have {data.unreadMessagesCount} unread message{data.unreadMessagesCount > 1 ? "s" : ""}
              </p>
              <p className="text-xs font-medium text-[#7B6D82]">Tap to read messages from Centre Head or staff</p>
            </div>
          </div>
          <span className="rounded-full bg-[#5B2A86] px-3 py-1 text-xs font-bold text-white">View</span>
        </Link>
      )}

      {/* Today's Attendance Quick Action Card */}
      <section className="rounded-3xl border border-[#EAE2EF] bg-white p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4ECF8] text-[#5B2A86]">
              <CalendarCheck2 size={24} />
            </span>
            <div>
              <h2 className="text-lg font-black text-[#2D1736]">Today’s Student Attendance</h2>
              <p className="text-xs font-semibold text-[#7E7085]">
                {att
                  ? `${att.marked} of ${att.total} students recorded`
                  : "Ready to mark attendance"}
              </p>
            </div>
          </div>

          <Link
            href="/teacher/attendance"
            className="inline-flex items-center justify-center rounded-xl bg-[#5B2A86] px-5 py-3 text-xs font-black text-white shadow-xs transition hover:bg-[#48206C]"
          >
            Open Attendance Register
          </Link>
        </div>

        {att && att.total > 0 && (
          <div className="mt-5 grid grid-cols-4 gap-2 pt-4 border-t border-[#F0EAF3] text-center">
            <div className="rounded-xl bg-[#F0FDF4] p-2">
              <p className="text-xs font-bold text-[#16A34A]">Present</p>
              <p className="text-lg font-black text-[#15803D]">{att.present}</p>
            </div>
            <div className="rounded-xl bg-[#FEF2F2] p-2">
              <p className="text-xs font-bold text-[#DC2626]">Absent</p>
              <p className="text-lg font-black text-[#B91C1C]">{att.absent}</p>
            </div>
            <div className="rounded-xl bg-[#FFFBEB] p-2">
              <p className="text-xs font-bold text-[#D97706]">Unmarked</p>
              <p className="text-lg font-black text-[#B45309]">{att.total - att.marked}</p>
            </div>
            <div className="rounded-xl bg-[#F5F3FF] p-2">
              <p className="text-xs font-bold text-[#7C3AED]">Total</p>
              <p className="text-lg font-black text-[#6D28D9]">{att.total}</p>
            </div>
          </div>
        )}
      </section>

      {/* Quick Navigation Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/teacher/students"
          className="flex flex-col justify-between rounded-2xl border border-[#EAE2EF] bg-white p-5 shadow-xs transition hover:border-[#5B2A86]"
        >
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#5B2A86]">
              <UsersRound size={20} />
            </span>
            <h3 className="mt-3 text-base font-black text-[#2D1736]">My Students</h3>
            <p className="mt-1 text-xs font-semibold text-[#7E7085]">
              {data?.studentsCount || 0} active students assigned
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-[#5B2A86]">View Roster →</span>
        </Link>

        <Link
          href="/teacher/activities"
          className="flex flex-col justify-between rounded-2xl border border-[#EAE2EF] bg-white p-5 shadow-xs transition hover:border-[#5B2A86]"
        >
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#5B2A86]">
              <Sparkles size={20} />
            </span>
            <h3 className="mt-3 text-base font-black text-[#2D1736]">Weekly Activities</h3>
            <p className="mt-1 text-xs font-semibold text-[#7E7085]">Plan and submit daily learning logs</p>
          </div>
          <span className="mt-4 text-xs font-bold text-[#5B2A86]">Manage Plans →</span>
        </Link>

        <Link
          href="/teacher/leaves"
          className="flex flex-col justify-between rounded-2xl border border-[#EAE2EF] bg-white p-5 shadow-xs transition hover:border-[#5B2A86]"
        >
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#5B2A86]">
              <Clock3 size={20} />
            </span>
            <h3 className="mt-3 text-base font-black text-[#2D1736]">Leaves & History</h3>
            <p className="mt-1 text-xs font-semibold text-[#7E7085]">
              {data?.remainingLeaveDays || 0} paid leave days remaining
            </p>
          </div>
          <span className="mt-4 text-xs font-bold text-[#5B2A86]">Apply Leave →</span>
        </Link>

        <Link
          href="/teacher/observations"
          className="flex flex-col justify-between rounded-2xl border border-[#EAE2EF] bg-white p-5 shadow-xs transition hover:border-[#5B2A86]"
        >
          <div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#5B2A86]">
              <CheckCircle2 size={20} />
            </span>
            <h3 className="mt-3 text-base font-black text-[#2D1736]">Observations</h3>
            <p className="mt-1 text-xs font-semibold text-[#7E7085]">Student milestone and progress reports</p>
          </div>
          <span className="mt-4 text-xs font-bold text-[#5B2A86]">Create Report →</span>
        </Link>
      </section>

      {/* Assigned Batches Summary */}
      {data && data.batches.length > 0 && (
        <section className="rounded-3xl border border-[#EAE2EF] bg-white p-5 shadow-xs">
          <h2 className="text-sm font-black uppercase tracking-wider text-[#5B2A86]">My Assigned Sections</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.batches.map((b) => (
              <div key={b.id} className="rounded-2xl border border-[#F0EAF3] bg-[#FAF8FB] p-4">
                <p className="text-sm font-black text-[#2D1736]">{b.name}</p>
                <div className="mt-1 flex items-center gap-2 text-xs font-semibold text-[#7E7085]">
                  <span className="rounded-md bg-[#EBE0F3] px-2 py-0.5 text-[10px] font-black text-[#5B2A86]">{b.programme}</span>
                  {b.room && <span>Room: {b.room}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
