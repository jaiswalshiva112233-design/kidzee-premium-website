"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CircleDollarSign,
  HeartPulse,
  MessageCircleMore,
  Phone,
  Search,
  UserRoundPlus,
} from "lucide-react";
import { useMemo, useState } from "react";

export type StudentRegisterRow = {
  id: string;
  studentNumber: string;
  admissionNumber: string | null;
  name: string;
  programme: string;
  status: string;
  dateOfBirth: string;
  joiningDate: string;
  medicalNotes: string | null;
  allergies: string | null;
  guardianName: string | null;
  guardianRelationship: string | null;
  guardianPhone: string | null;
  contractStatus: string | null;
  preschoolActive: boolean;
  daycareActive: boolean;
  mealsActive: boolean;
  documentsPending: boolean;
  admissionStarted: boolean;
  feeStatus: "PAID" | "PENDING" | "PART_PAID" | "OVERDUE";
  outstanding: number;
};

type RegisterFilter =
  | "ALL"
  | "PRESCHOOL"
  | "DAYCARE"
  | "BOTH"
  | "DAYCARE_ONLY"
  | "FEE_PENDING"
  | "INACTIVE"
  | "DOCUMENTS_PENDING"
  | "ADMISSION_STARTED";

const statusStyles: Record<string, string> = {
  ACTIVE: "border-green-200 bg-green-50 text-green-700",
  INACTIVE: "border-slate-200 bg-slate-50 text-slate-600",
  WITHDRAWN: "border-red-200 bg-red-50 text-red-700",
  GRADUATED: "border-blue-200 bg-blue-50 text-blue-700",
};

const feeStyles: Record<StudentRegisterRow["feeStatus"], string> = {
  PAID: "border-green-200 bg-green-50 text-green-700",
  PENDING: "border-amber-200 bg-amber-50 text-amber-800",
  PART_PAID: "border-orange-200 bg-orange-50 text-orange-800",
  OVERDUE: "border-red-200 bg-red-50 text-red-700",
};

const feeLabels: Record<StudentRegisterRow["feeStatus"], string> = {
  PAID: "Fees clear",
  PENDING: "Fee pending",
  PART_PAID: "Part paid",
  OVERDUE: "Overdue",
};

const filters: Array<{ value: RegisterFilter; label: string }> = [
  { value: "ALL", label: "All students" },
  { value: "PRESCHOOL", label: "Preschool" },
  { value: "DAYCARE", label: "Daycare" },
  { value: "BOTH", label: "Preschool + Daycare" },
  { value: "DAYCARE_ONLY", label: "Daycare only" },
  { value: "FEE_PENDING", label: "Fee pending" },
  { value: "DOCUMENTS_PENDING", label: "Documents pending" },
  { value: "ADMISSION_STARTED", label: "Admission started" },
  { value: "INACTIVE", label: "Inactive" },
];

function date(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function age(value: string) {
  const birth = new Date(value);
  const now = new Date();
  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 0) {
    years -= 1;
    months += 12;
  }
  if (years <= 0) return `${months} month${months === 1 ? "" : "s"}`;
  return months
    ? `${years} years ${months} months`
    : `${years} year${years === 1 ? "" : "s"}`;
}

function money(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

function whatsappHref(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  const number = digits.length === 10 ? `91${digits}` : digits;
  return number ? `https://wa.me/${number}` : null;
}

function matchesFilter(student: StudentRegisterRow, filter: RegisterFilter) {
  switch (filter) {
    case "PRESCHOOL":
      return student.preschoolActive;
    case "DAYCARE":
      return student.daycareActive;
    case "BOTH":
      return student.preschoolActive && student.daycareActive;
    case "DAYCARE_ONLY":
      return student.daycareActive && !student.preschoolActive;
    case "FEE_PENDING":
      return student.feeStatus !== "PAID";
    case "INACTIVE":
      return student.status !== "ACTIVE";
    case "DOCUMENTS_PENDING":
      return student.documentsPending;
    case "ADMISSION_STARTED":
      return student.admissionStarted;
    default:
      return true;
  }
}

export default function StudentRegister({
  students,
}: {
  students: StudentRegisterRow[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RegisterFilter>("ALL");
  const [programme, setProgramme] = useState("ALL");

  const programmes = useMemo(
    () => Array.from(new Set(students.map((student) => student.programme))).sort(),
    [students],
  );

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return students.filter((student) => {
      if (!matchesFilter(student, filter)) return false;
      if (programme !== "ALL" && student.programme !== programme) return false;
      if (!needle) return true;
      return [
        student.name,
        student.studentNumber,
        student.admissionNumber,
        student.programme,
        student.guardianName,
        student.guardianPhone,
        student.preschoolActive ? "preschool" : null,
        student.daycareActive ? "daycare" : null,
        student.mealsActive ? "meals" : null,
        feeLabels[student.feeStatus],
        student.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [filter, programme, query, students]);

  return (
    <div className="mt-6">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_250px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6A328F]" size={20} />
          <span className="sr-only">Search students</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Child, parent, phone, student number or class"
            className="min-h-14 w-full rounded-2xl border border-[#DCCFE4] bg-white pl-12 pr-4 text-base font-bold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
          />
        </label>

        <label>
          <span className="sr-only">Filter by class</span>
          <select
            value={programme}
            onChange={(event) => setProgramme(event.target.value)}
            className="min-h-14 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#4F4056] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
          >
            <option value="ALL">All classes</option>
            {programmes.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </label>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2" aria-label="Student filters">
        {filters.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            aria-pressed={filter === item.value}
            className={`min-h-11 shrink-0 rounded-xl px-4 text-xs font-black transition ${filter === item.value ? "bg-[#5B2A86] text-white" : "border border-[#E2D8E7] bg-white text-[#65596A] hover:bg-[#F6F1F8]"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      <p className="mt-2 text-sm font-bold text-[#817684]">
        {visible.length} of {students.length} students
      </p>

      {students.length === 0 ? (
        <div className="mt-6 flex min-h-[280px] flex-col items-center justify-center rounded-[28px] border border-dashed border-[#DCCFE3] bg-white p-8 text-center">
          <UserRoundPlus className="text-[#5B2A86]" size={34} />
          <h3 className="mt-4 text-xl font-black text-[#2D1736]">No student records yet</h3>
          <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
            Start an admission to create the child profile, services and first combined bill together.
          </p>
          <Link href="/admin/admissions" className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-[#5B2A86] px-5 text-sm font-black text-white">
            Open Admissions
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-[26px] border border-dashed border-[#DCCFE3] bg-white p-8 text-center font-bold text-[#817684]">
          No student matches these filters.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 xl:grid-cols-2">
          {visible.map((student) => {
            const whatsapp = whatsappHref(student.guardianPhone);
            return (
              <article key={student.id} className="rounded-[26px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                      {student.studentNumber}{student.admissionNumber ? ` · ${student.admissionNumber}` : ""}
                    </p>
                    <h3 className="mt-2 text-xl font-black text-[#2D1736]">{student.name}</h3>
                    <p className="mt-1 text-sm font-semibold text-[#817684]">{student.programme}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-3 py-1.5 text-[10px] font-black ${statusStyles[student.status] ?? statusStyles.INACTIVE}`}>
                    {student.status.replaceAll("_", " ")}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {student.preschoolActive ? <ServiceBadge label="Preschool" tone="purple" /> : null}
                  {student.daycareActive ? <ServiceBadge label="Daycare" tone="blue" /> : null}
                  {student.mealsActive ? <ServiceBadge label="Meals" tone="green" /> : null}
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase ${feeStyles[student.feeStatus]}`}>
                    {feeLabels[student.feeStatus]}
                  </span>
                  {student.contractStatus ? <ServiceBadge label={`Contract ${student.contractStatus.replaceAll("_", " ")}`} tone="neutral" /> : null}
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <Info label="Age" value={age(student.dateOfBirth)} detail={`Joined ${date(student.joiningDate)}`} />
                  <Info label="Primary guardian" value={student.guardianName ?? "Not entered"} detail={student.guardianPhone ?? student.guardianRelationship?.replaceAll("_", " ")} />
                  <Info label="Outstanding" value={money(student.outstanding)} detail={feeLabels[student.feeStatus]} />
                  <Info label="Admission" value={student.admissionStarted ? "In progress" : student.admissionNumber ? "Completed" : "Direct profile"} detail={student.documentsPending ? "Documents pending" : "Documents complete / not required"} />
                </div>

                {student.medicalNotes || student.allergies ? (
                  <div className="mt-4 flex gap-3 rounded-2xl border border-red-100 bg-red-50/60 p-4">
                    <HeartPulse className="shrink-0 text-red-600" size={18} />
                    <p className="text-sm font-semibold text-red-700">
                      {student.allergies ? `Allergies: ${student.allergies}. ` : ""}{student.medicalNotes}
                    </p>
                  </div>
                ) : null}

                <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <Link href={`/admin/students/${student.id}`} className="col-span-2 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white sm:order-last sm:ml-auto">
                    Open Profile <ArrowRight size={17} />
                  </Link>
                  <Link href={`/admin/fees?studentId=${encodeURIComponent(student.id)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] px-3 text-xs font-black text-[#5B2A86]">
                    <CircleDollarSign size={16} /> Collect Fee
                  </Link>
                  <Link href={`/admin/attendance?studentId=${encodeURIComponent(student.id)}`} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] px-3 text-xs font-black text-[#5B2A86]">
                    <CalendarCheck2 size={16} /> Attendance
                  </Link>
                  {student.guardianPhone ? <a href={`tel:${student.guardianPhone}`} aria-label={`Call guardian for ${student.name}`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DCCFE4] px-4 text-[#5B2A86]"><Phone size={17} /></a> : null}
                  {whatsapp ? <a href={whatsapp} target="_blank" rel="noreferrer" aria-label={`WhatsApp guardian for ${student.name}`} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-green-200 bg-green-50 px-4 text-green-700"><MessageCircleMore size={18} /></a> : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ServiceBadge({ label, tone }: { label: string; tone: "purple" | "blue" | "green" | "neutral" }) {
  const styles = {
    purple: "border-purple-200 bg-purple-50 text-purple-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    green: "border-green-200 bg-green-50 text-green-700",
    neutral: "border-slate-200 bg-slate-50 text-slate-600",
  }[tone];
  return <span className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase ${styles}`}>{label}</span>;
}

function Info({ label, value, detail }: { label: string; value: string; detail?: string | null }) {
  return (
    <div className="rounded-2xl bg-[#FAF8FC] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">{label}</p>
      <p className="mt-1 break-words text-sm font-black text-[#2D1736]">{value}</p>
      {detail ? <p className="mt-1 break-words text-xs font-semibold text-[#817684]">{detail}</p> : null}
    </div>
  );
}
