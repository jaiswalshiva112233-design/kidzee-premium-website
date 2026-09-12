"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  HeartPulse,
  Loader2,
  Phone,
  Search,
  User,
  UsersRound,
} from "lucide-react";

type TeacherStudent = {
  assignmentId: string;
  rollNumber: string | null;
  batch: { id: string; name: string; programme: string; room: string | null };
  studentId: string;
  studentNumber: string;
  name: string;
  dateOfBirth: string;
  gender: string | null;
  bloodGroup: string | null;
  medicalNotes: string | null;
  allergies: string | null;
  profilePhotoUrl: string | null;
  emergencyContact: { name: string; phone: string; relationship: string } | null;
};

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<TeacherStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadStudents() {
      try {
        const res = await fetch("/api/teacher/students");
        const data = await res.json();
        if (data.success) {
          setStudents(data.students || []);
        }
      } catch (err) {
        console.error("Students load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStudents();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.studentNumber.toLowerCase().includes(q) ||
      s.batch.name.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-[#EAE2EF] bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#2D1736] sm:text-2xl">My Students Roster</h1>
          <p className="text-xs font-semibold text-[#7E7085]">
            {students.length} children actively assigned to your sections
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 text-[#B3A2BE]" size={16} />
          <input
            type="text"
            placeholder="Search by name or section..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-[#D5C2E2] bg-[#FAF8FB] py-2 pl-9 pr-3 text-xs font-bold text-[#2D1736] placeholder-[#B3A2BE] focus:border-[#5B2A86] focus:outline-hidden"
          />
        </div>
      </div>

      {/* Roster Grid */}
      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-[#5B2A86]" size={32} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-[#EAE2EF] bg-white p-10 text-center">
          <UsersRound className="mx-auto text-[#B3A2BE]" size={40} />
          <p className="mt-3 text-base font-black text-[#2D1736]">No students found</p>
          <p className="mt-1 text-xs text-[#7E7085]">Try adjusting your search query.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => {
            const birthDate = new Date(s.dateOfBirth);
            const ageMonths = Math.floor(
              (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.4375)
            );
            const ageYears = Math.floor(ageMonths / 12);
            const remainingMonths = ageMonths % 12;

            return (
              <div
                key={s.assignmentId}
                className="flex flex-col justify-between rounded-3xl border border-[#EAE2EF] bg-white p-5 shadow-xs transition hover:border-[#D5C2E2]"
              >
                <div>
                  {/* Top info */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F4ECF8] text-base font-black text-[#5B2A86]">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-black text-[#2D1736]">{s.name}</p>
                          {s.rollNumber && (
                            <span className="rounded-md bg-[#F0EAF3] px-1.5 py-0.5 text-[10px] font-bold text-[#5B2A86]">
                              #{s.rollNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-[#7E7085]">
                          {ageYears}y {remainingMonths}m • {s.batch.name}
                        </p>
                      </div>
                    </div>

                    {s.bloodGroup && (
                      <span className="rounded-lg bg-[#FEE2E2] px-2 py-0.5 text-[10px] font-black text-[#B91C1C]">
                        {s.bloodGroup}
                      </span>
                    )}
                  </div>

                  {/* Health Alerts */}
                  {(s.allergies || s.medicalNotes) && (
                    <div className="mt-3.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-2.5 text-xs text-[#92400E]">
                      <div className="flex items-center gap-1.5 font-black text-[#B45309]">
                        <AlertTriangle size={13} />
                        <span>Allergy / Medical Note:</span>
                      </div>
                      <p className="mt-0.5 text-[11px] font-medium">{s.allergies || s.medicalNotes}</p>
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                {s.emergencyContact ? (
                  <div className="mt-4 pt-3 border-t border-[#F0EAF3]">
                    <p className="text-[10px] font-black uppercase tracking-wider text-[#7E7085]">
                      Primary Guardian: {s.emergencyContact.name} ({s.emergencyContact.relationship})
                    </p>
                    <a
                      href={`tel:${s.emergencyContact.phone}`}
                      className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#F3EAF8] py-2 text-xs font-black text-[#5B2A86] transition hover:bg-[#E9DBF2]"
                    >
                      <Phone size={13} />
                      <span>{s.emergencyContact.phone}</span>
                    </a>
                  </div>
                ) : (
                  <div className="mt-4 pt-3 border-t border-[#F0EAF3]">
                    <p className="text-[11px] italic text-[#A69AA8]">No guardian phone recorded</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
