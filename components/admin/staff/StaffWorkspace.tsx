"use client";

import {
  CalendarDays,
  Download,
  IndianRupee,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Save,
  Search,
  ShieldCheck,
  UserCheck,
  UserRoundPlus,
  UsersRound,
  X,
} from "lucide-react";
import {
  type FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

type StaffStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "LEFT";

type StaffPaidLeaveCycle =
  | "NONE"
  | "MONTHLY"
  | "YEARLY";

type StaffTab = "ALL" | StaffStatus;

export type StaffWorkspaceRecord = {
  id: string;
  staffNumber: string;
  name: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  designation: string;
  joiningDate: string;
  leavingDate: string | null;
  status: StaffStatus;
  monthlySalary: string | null;
  paidLeaveCycle: StaffPaidLeaveCycle;
  paidLeaveAllowance: string;
  address: string | null;
  emergencyContact: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type StaffWorkspaceProps = {
  initialStaff: StaffWorkspaceRecord[];
};

type StaffFormData = {
  name: string;
  phone: string;
  alternatePhone: string;
  email: string;
  designation: string;
  joiningDate: string;
  leavingDate: string;
  status: StaffStatus;
  monthlySalary: string;
  paidLeaveCycle: StaffPaidLeaveCycle;
  paidLeaveAllowance: string;
  address: string;
  emergencyContact: string;
  notes: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  staff?: StaffWorkspaceRecord;
};

const today = new Date()
  .toISOString()
  .slice(0, 10);

const emptyFormData: StaffFormData = {
  name: "",
  phone: "",
  alternatePhone: "",
  email: "",
  designation: "",
  joiningDate: today,
  leavingDate: "",
  status: "ACTIVE",
  monthlySalary: "",
  paidLeaveCycle: "NONE",
  paidLeaveAllowance: "0",
  address: "",
  emergencyContact: "",
  notes: "",
};

const statusLabels: Record<StaffStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  LEFT: "Left Centre",
};

const statusStyles: Record<StaffStatus, string> = {
  ACTIVE:
    "border-green-200 bg-green-50 text-green-700",
  INACTIVE:
    "border-amber-200 bg-amber-50 text-amber-700",
  LEFT:
    "border-slate-200 bg-slate-100 text-slate-600",
};

const paidLeaveCycleLabels: Record<
  StaffPaidLeaveCycle,
  string
> = {
  NONE: "No paid leave",
  MONTHLY: "Monthly allowance",
  YEARLY: "Yearly allowance",
};

const tabs: Array<{
  value: StaffTab;
  label: string;
}> = [
  {
    value: "ALL",
    label: "All Staff",
  },
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
  },
  {
    value: "LEFT",
    label: "Left Centre",
  },
];

function formatDate(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatCurrency(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not recorded";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatPaidLeavePolicy(
  cycle: StaffPaidLeaveCycle,
  allowance: string,
) {
  if (cycle === "NONE") {
    return "No paid leave";
  }

  const days = Number(allowance);
  const formattedDays = Number.isFinite(days)
    ? new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
      }).format(days)
    : "0";

  return `${formattedDays} day${
    days === 1 ? "" : "s"
  } ${cycle === "MONTHLY" ? "per month" : "per year"}`;
}

function formatDateInput(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function createWhatsAppNumber(phone: string) {
  const digits = phone.replace(/\D/g, "");

  return digits.length === 10
    ? `91${digits}`
    : digits;
}

function formDataFromStaff(
  staff: StaffWorkspaceRecord,
): StaffFormData {
  return {
    name: staff.name,
    phone: staff.phone,
    alternatePhone:
      staff.alternatePhone ?? "",
    email: staff.email ?? "",
    designation: staff.designation,
    joiningDate: formatDateInput(
      staff.joiningDate,
    ),
    leavingDate: formatDateInput(
      staff.leavingDate,
    ),
    status: staff.status,
    monthlySalary:
      staff.monthlySalary ?? "",
    paidLeaveCycle:
      staff.paidLeaveCycle,
    paidLeaveAllowance:
      staff.paidLeaveAllowance,
    address: staff.address ?? "",
    emergencyContact:
      staff.emergencyContact ?? "",
    notes: staff.notes ?? "",
  };
}

export default function StaffWorkspace({
  initialStaff,
}: StaffWorkspaceProps) {
  const [staffRecords, setStaffRecords] =
    useState(initialStaff);

  const [activeTab, setActiveTab] =
    useState<StaffTab>("ALL");

  const [searchQuery, setSearchQuery] =
    useState("");

  const [showSalary, setShowSalary] =
    useState(false);

  const [panelOpen, setPanelOpen] =
    useState(false);

  const [editingStaffId, setEditingStaffId] =
    useState<string | null>(null);

  const [formData, setFormData] =
    useState<StaffFormData>(emptyFormData);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  useEffect(() => {
    if (!panelOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [panelOpen]);

  const counts = useMemo(
    () => ({
      ALL: staffRecords.length,
      ACTIVE: staffRecords.filter(
        (staff) => staff.status === "ACTIVE",
      ).length,
      INACTIVE: staffRecords.filter(
        (staff) => staff.status === "INACTIVE",
      ).length,
      LEFT: staffRecords.filter(
        (staff) => staff.status === "LEFT",
      ).length,
    }),
    [staffRecords],
  );

  const visibleStaff = useMemo(() => {
    const query = searchQuery
      .trim()
      .toLowerCase();

    return staffRecords.filter((staff) => {
      if (
        activeTab !== "ALL" &&
        staff.status !== activeTab
      ) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [
        staff.staffNumber,
        staff.name,
        staff.phone,
        staff.alternatePhone,
        staff.email,
        staff.designation,
        staff.address,
        staff.emergencyContact,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(query),
        );
    });
  }, [
    activeTab,
    searchQuery,
    staffRecords,
  ]);

  function updateField<
    K extends keyof StaffFormData,
  >(
    field: K,
    value: StaffFormData[K],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function openCreatePanel() {
    setEditingStaffId(null);
    setFormData({
      ...emptyFormData,
      joiningDate: new Date()
        .toISOString()
        .slice(0, 10),
    });
    setError("");
    setSuccessMessage("");
    setPanelOpen(true);
  }

  function openEditPanel(
    staff: StaffWorkspaceRecord,
  ) {
    setEditingStaffId(staff.id);
    setFormData(formDataFromStaff(staff));
    setError("");
    setSuccessMessage("");
    setPanelOpen(true);
  }

  function closePanel() {
    if (submitting) {
      return;
    }

    setPanelOpen(false);
    setEditingStaffId(null);
    setError("");
    setSuccessMessage("");
  }

  function validateForm() {
    if (formData.name.trim().length < 2) {
      return "Please enter the staff member’s full name.";
    }

    const phone = formData.phone.replace(
      /\D/g,
      "",
    );

    if (phone.length < 10) {
      return "Please enter a valid primary phone number.";
    }

    if (
      formData.alternatePhone &&
      formData.alternatePhone.replace(
        /\D/g,
        "",
      ).length < 10
    ) {
      return "Please enter a valid alternate phone number.";
    }

    if (
      formData.email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.email,
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (
      formData.designation.trim().length < 2
    ) {
      return "Please enter the staff designation.";
    }

    if (!formData.joiningDate) {
      return "Please enter the joining date.";
    }

    if (
      formData.status === "LEFT" &&
      !formData.leavingDate
    ) {
      return "Please enter the leaving date.";
    }

    if (
      formData.leavingDate &&
      formData.leavingDate <
        formData.joiningDate
    ) {
      return "Leaving date cannot be before the joining date.";
    }

    if (
      formData.monthlySalary &&
      Number(formData.monthlySalary) < 0
    ) {
      return "Monthly salary cannot be negative.";
    }

    if (
      formData.paidLeaveCycle !== "NONE"
    ) {
      const allowance = Number(
        formData.paidLeaveAllowance,
      );

      if (
        !Number.isFinite(allowance) ||
        allowance <= 0 ||
        allowance > 366
      ) {
        return "Enter a paid-leave allowance between 0.5 and 366 days.";
      }
    }

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage =
      validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        editingStaffId
          ? `/api/admin/staff/${editingStaffId}`
          : "/api/admin/staff",
        {
          method: editingStaffId
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const result =
        (await response.json()) as ApiResponse;

      if (
        !response.ok ||
        !result.success ||
        !result.staff
      ) {
        throw new Error(
          result.message ??
            "The staff record could not be saved.",
        );
      }

      if (editingStaffId) {
        setStaffRecords((current) =>
          current.map((staff) =>
            staff.id === result.staff?.id
              ? result.staff
              : staff,
          ),
        );
      } else {
        setStaffRecords((current) => [
          result.staff as StaffWorkspaceRecord,
          ...current,
        ]);
      }

      setSuccessMessage(
        result.message ??
          "Staff record saved successfully.",
      );

      setFormData(
        formDataFromStaff(result.staff),
      );

      setEditingStaffId(result.staff.id);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The staff record could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <section className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            label="Total Staff"
            value={counts.ALL}
            description="Complete staff register"
            icon={UsersRound}
            colour="bg-[#F3EAF8] text-[#5B2A86]"
          />

          <SummaryCard
            label="Active Staff"
            value={counts.ACTIVE}
            description="Currently working"
            icon={UserCheck}
            colour="bg-green-50 text-green-700"
          />

          <SummaryCard
            label="Inactive"
            value={counts.INACTIVE}
            description="Temporarily inactive"
            icon={ShieldCheck}
            colour="bg-amber-50 text-amber-700"
          />

          <SummaryCard
            label="Left Centre"
            value={counts.LEFT}
            description="Past staff records"
            icon={CalendarDays}
            colour="bg-slate-100 text-slate-600"
          />
        </div>

        <div className="rounded-[30px] border border-[#E8E0EB] bg-white p-5 shadow-[0_20px_60px_rgba(45,23,54,0.08)] sm:p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                Staff register
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#2D1736]">
                Centre team
              </h2>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                Search staff, manage employment status
                and keep contact information updated.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  setShowSalary((current) => !current)
                }
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DED3E3] bg-white px-5 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA]"
              >
                <ShieldCheck
                  aria-hidden="true"
                  size={18}
                />

                {showSalary
                  ? "Hide Salary"
                  : "Show Salary"}
              </button>

              {/* This API endpoint returns a CSV download, not an app page. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a
                href="/api/admin/staff?format=csv"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DED3E3] bg-white px-5 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA]"
              >
                <Download
                  aria-hidden="true"
                  size={18}
                />
                Export Staff
              </a>

              <button
                type="button"
                onClick={openCreatePanel}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)] transition hover:-translate-y-0.5 hover:bg-[#4B206F]"
              >
                <UserRoundPlus
                  aria-hidden="true"
                  size={18}
                />
                Add Staff
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            <label className="relative block">
              <span className="sr-only">
                Search staff
              </span>

              <Search
                aria-hidden="true"
                size={19}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#8D8291]"
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value,
                  )
                }
                placeholder="Search by name, phone, staff number or designation"
                className="min-h-13 w-full rounded-2xl border border-[#DDD2E2] bg-[#FAF8FC] pl-12 pr-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#9D939F] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
              />
            </label>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => {
                const active =
                  activeTab === tab.value;

                return (
                  <button
                    key={tab.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setActiveTab(tab.value)
                    }
                    className={[
                      "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-black transition",
                      active
                        ? "border-[#5B2A86] bg-[#5B2A86] text-white"
                        : "border-[#E2D8E6] bg-white text-[#6E6272] hover:bg-[#F7F2FA]",
                    ].join(" ")}
                  >
                    {tab.label}

                    <span
                      className={[
                        "rounded-full px-2 py-0.5 text-xs",
                        active
                          ? "bg-white/20 text-white"
                          : "bg-[#F2ECF5] text-[#5B2A86]",
                      ].join(" ")}
                    >
                      {counts[tab.value]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {visibleStaff.length === 0 ? (
          <div className="rounded-[30px] border border-dashed border-[#DCCFE4] bg-white px-6 py-14 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#F3EAF8] text-[#5B2A86]">
              <UsersRound
                aria-hidden="true"
                size={28}
              />
            </span>

            <h3 className="mt-5 text-xl font-black text-[#2D1736]">
              {staffRecords.length === 0
                ? "No staff records yet"
                : "No matching staff found"}
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm font-semibold leading-6 text-[#817684]">
              {staffRecords.length === 0
                ? "Add your teachers, centre head, helpers and support team to begin the staff register."
                : "Try another search or select a different staff status."}
            </p>

            {staffRecords.length === 0 ? (
              <button
                type="button"
                onClick={openCreatePanel}
                className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white"
              >
                <UserRoundPlus
                  aria-hidden="true"
                  size={18}
                />
                Add First Staff Member
              </button>
            ) : null}
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
            {visibleStaff.map((staff) => (
              <article
                key={staff.id}
                className="overflow-hidden rounded-[28px] border border-[#E8E0EB] bg-white shadow-[0_18px_50px_rgba(45,23,54,0.07)]"
              >
                <div className="bg-[#2D1736] p-5 text-white">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#FFD34E]">
                        {staff.staffNumber}
                      </p>

                      <h3 className="mt-2 truncate text-xl font-black">
                        {staff.name}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-white/70">
                        {staff.designation}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em]",
                        statusStyles[staff.status],
                      ].join(" ")}
                    >
                      {statusLabels[staff.status]}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <a
                      href={`tel:${staff.phone}`}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-white px-3 text-sm font-black text-[#2D1736] transition hover:bg-[#FFF8DB]"
                    >
                      <Phone
                        aria-hidden="true"
                        size={17}
                      />
                      Call
                    </a>

                    <a
                      href={`https://wa.me/${createWhatsAppNumber(
                        staff.phone,
                      )}?text=${encodeURIComponent(
                        `Hello ${staff.name}, this is Kidzee Sector 12, Dwarka.`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl bg-[#25D366] px-3 text-sm font-black text-white transition hover:bg-[#1EBC59]"
                    >
                      <MessageSquareText
                        aria-hidden="true"
                        size={17}
                      />
                      WhatsApp
                    </a>
                  </div>
                </div>

                <div className="space-y-4 p-5">
                  <DetailRow
                    icon={Phone}
                    label="Phone"
                    value={staff.phone}
                  />

                  <DetailRow
                    icon={Mail}
                    label="Email"
                    value={
                      staff.email ??
                      "Not recorded"
                    }
                  />

                  <DetailRow
                    icon={CalendarDays}
                    label="Joining date"
                    value={formatDate(
                      staff.joiningDate,
                    )}
                  />

                  <DetailRow
                    icon={IndianRupee}
                    label="Monthly salary"
                    value={
                      showSalary
                        ? formatCurrency(
                            staff.monthlySalary,
                          )
                        : "••••••"
                    }
                  />

                  <DetailRow
                    icon={CalendarDays}
                    label="Paid leave"
                    value={formatPaidLeavePolicy(
                      staff.paidLeaveCycle,
                      staff.paidLeaveAllowance,
                    )}
                  />

                  <DetailRow
                    icon={MapPin}
                    label="Address"
                    value={
                      staff.address ??
                      "Not recorded"
                    }
                  />

                  {staff.status === "LEFT" ? (
                    <DetailRow
                      icon={CalendarDays}
                      label="Leaving date"
                      value={formatDate(
                        staff.leavingDate,
                      )}
                    />
                  ) : null}

                  <button
                    type="button"
                    onClick={() =>
                      openEditPanel(staff)
                    }
                    className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-[#F8F4FA] px-5 text-sm font-black text-[#5B2A86] transition hover:border-[#5B2A86] hover:bg-[#F1E8F6]"
                  >
                    <UserCheck
                      aria-hidden="true"
                      size={18}
                    />
                    Manage Staff Record
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {panelOpen ? (
        <div className="fixed inset-0 z-[150]">
          <button
            type="button"
            aria-label="Close staff form"
            onClick={closePanel}
            className="absolute inset-0 bg-[#1F1027]/60 backdrop-blur-sm"
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-label={
              editingStaffId
                ? "Edit staff record"
                : "Add staff record"
            }
            className="absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col bg-[#F8F6FA] shadow-[-24px_0_70px_rgba(31,16,39,0.26)]"
          >
            <div className="flex items-start justify-between gap-4 border-b border-[#E5DCE9] bg-white px-5 py-5 sm:px-7">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#7A459C]">
                  Staff management
                </p>

                <h2 className="mt-1 text-2xl font-black text-[#2D1736]">
                  {editingStaffId
                    ? "Edit Staff Record"
                    : "Add Staff Member"}
                </h2>

                <p className="mt-1 text-sm font-semibold text-[#817684]">
                  All details can be edited later.
                </p>
              </div>

              <button
                type="button"
                onClick={closePanel}
                disabled={submitting}
                aria-label="Close staff form"
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#E1D7E5] bg-white text-[#685D6C] transition hover:bg-[#F6F1F8] disabled:opacity-50"
              >
                <X
                  aria-hidden="true"
                  size={22}
                />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 overflow-y-auto p-5 sm:p-7">
                <div className="space-y-6">
                  <FormSection
                    title="Basic information"
                    description="Name, role and centre employment status."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Full name *"
                        value={formData.name}
                        placeholder="Staff member’s full name"
                        onChange={(value) =>
                          updateField(
                            "name",
                            value,
                          )
                        }
                      />

                      <TextField
                        label="Designation *"
                        value={
                          formData.designation
                        }
                        placeholder="Teacher, Centre Head, Helper"
                        list="staff-designations"
                        onChange={(value) =>
                          updateField(
                            "designation",
                            value,
                          )
                        }
                      />

                      <datalist id="staff-designations">
                        <option value="Centre Head" />
                        <option value="Academic Coordinator" />
                        <option value="Class Teacher" />
                        <option value="Assistant Teacher" />
                        <option value="Daycare Teacher" />
                        <option value="Activity Teacher" />
                        <option value="Front Desk Executive" />
                        <option value="Admission Counsellor" />
                        <option value="Helper" />
                        <option value="Cook" />
                        <option value="Security Guard" />
                        <option value="Driver" />
                      </datalist>

                      <label className="block">
                        <span className="text-sm font-black text-[#35243E]">
                          Staff status *
                        </span>

                        <select
                          value={formData.status}
                          onChange={(event) =>
                            updateField(
                              "status",
                              event.target
                                .value as StaffStatus,
                            )
                          }
                          className={inputClassName}
                        >
                          <option value="ACTIVE">
                            Active
                          </option>
                          <option value="INACTIVE">
                            Inactive
                          </option>
                          <option value="LEFT">
                            Left Centre
                          </option>
                        </select>
                      </label>

                      <TextField
                        label="Monthly salary"
                        value={
                          formData.monthlySalary
                        }
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Example: 25000"
                        onChange={(value) =>
                          updateField(
                            "monthlySalary",
                            value,
                          )
                        }
                      />

                      <TextField
                        label="Joining date *"
                        value={
                          formData.joiningDate
                        }
                        type="date"
                        onChange={(value) =>
                          updateField(
                            "joiningDate",
                            value,
                          )
                        }
                      />

                      {formData.status ===
                      "LEFT" ? (
                        <TextField
                          label="Leaving date *"
                          value={
                            formData.leavingDate
                          }
                          type="date"
                          onChange={(value) =>
                            updateField(
                              "leavingDate",
                              value,
                            )
                          }
                        />
                      ) : null}
                    </div>
                  </FormSection>

                  <FormSection
                    title="Paid leave policy"
                    description="Choose whether this employee receives paid leave and define the allowance. Sandwich-rule days use the same balance."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="block">
                        <span className="text-sm font-black text-[#35243E]">
                          Paid leave option *
                        </span>

                        <select
                          value={
                            formData.paidLeaveCycle
                          }
                          onChange={(event) => {
                            const cycle = event.target
                              .value as StaffPaidLeaveCycle;

                            setFormData((current) => ({
                              ...current,
                              paidLeaveCycle: cycle,
                              paidLeaveAllowance:
                                cycle === "NONE"
                                  ? "0"
                                  : current.paidLeaveAllowance ===
                                      "0"
                                    ? ""
                                    : current.paidLeaveAllowance,
                            }));
                          }}
                          className={inputClassName}
                        >
                          {Object.entries(
                            paidLeaveCycleLabels,
                          ).map(([value, label]) => (
                            <option
                              key={value}
                              value={value}
                            >
                              {label}
                            </option>
                          ))}
                        </select>
                      </label>

                      {formData.paidLeaveCycle !==
                      "NONE" ? (
                        <TextField
                          label={`Allowed days per ${
                            formData.paidLeaveCycle ===
                            "MONTHLY"
                              ? "month"
                              : "year"
                          } *`}
                          value={
                            formData.paidLeaveAllowance
                          }
                          type="number"
                          min="0.5"
                          max="366"
                          step="0.5"
                          placeholder="Example: 12"
                          onChange={(value) =>
                            updateField(
                              "paidLeaveAllowance",
                              value,
                            )
                          }
                        />
                      ) : (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-sm font-black text-amber-900">
                            No paid leave
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
                            Approved leave days will be
                            treated as unpaid for this
                            employee.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#F4EEF8] p-4">
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-[#6A328F]">
                        Sandwich rule
                      </p>
                      <p className="mt-2 text-sm font-semibold leading-6 text-[#5E5263]">
                        If leave is taken on both sides of
                        the weekly holiday, the holiday is
                        counted too. Working on either side
                        prevents the extra deduction.
                      </p>
                    </div>
                  </FormSection>

                  <FormSection
                    title="Contact information"
                    description="Primary, alternate and emergency contact details."
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <TextField
                        label="Primary phone *"
                        value={formData.phone}
                        type="tel"
                        placeholder="10-digit mobile number"
                        onChange={(value) =>
                          updateField(
                            "phone",
                            value,
                          )
                        }
                      />

                      <TextField
                        label="Alternate phone"
                        value={
                          formData.alternatePhone
                        }
                        type="tel"
                        placeholder="Optional number"
                        onChange={(value) =>
                          updateField(
                            "alternatePhone",
                            value,
                          )
                        }
                      />

                      <TextField
                        label="Email address"
                        value={formData.email}
                        type="email"
                        placeholder="Optional email"
                        onChange={(value) =>
                          updateField(
                            "email",
                            value,
                          )
                        }
                      />

                      <TextField
                        label="Emergency contact"
                        value={
                          formData.emergencyContact
                        }
                        placeholder="Name and phone number"
                        onChange={(value) =>
                          updateField(
                            "emergencyContact",
                            value,
                          )
                        }
                      />
                    </div>
                  </FormSection>

                  <FormSection
                    title="Address and notes"
                    description="Additional information for centre administration."
                  >
                    <label className="block">
                      <span className="text-sm font-black text-[#35243E]">
                        Residential address
                      </span>

                      <textarea
                        value={formData.address}
                        onChange={(event) =>
                          updateField(
                            "address",
                            event.target.value,
                          )
                        }
                        rows={3}
                        placeholder="Complete residential address"
                        className={textareaClassName}
                      />
                    </label>

                    <label className="mt-4 block">
                      <span className="text-sm font-black text-[#35243E]">
                        Internal notes
                      </span>

                      <textarea
                        value={formData.notes}
                        onChange={(event) =>
                          updateField(
                            "notes",
                            event.target.value,
                          )
                        }
                        rows={4}
                        placeholder="Qualifications, responsibilities or important notes"
                        className={textareaClassName}
                      />
                    </label>
                  </FormSection>

                  {error ? (
                    <div
                      role="alert"
                      className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
                    >
                      {error}
                    </div>
                  ) : null}

                  {successMessage ? (
                    <div
                      role="status"
                      className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
                    >
                      {successMessage}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="border-t border-[#E5DCE9] bg-white px-5 py-4 sm:px-7">
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closePanel}
                    disabled={submitting}
                    className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DDD2E2] bg-white px-6 text-sm font-black text-[#665A6B] transition hover:bg-[#F7F2FA] disabled:opacity-50"
                  >
                    Close
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-7 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)] transition hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <LoaderCircle
                          aria-hidden="true"
                          size={18}
                          className="animate-spin"
                        />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save
                          aria-hidden="true"
                          size={18}
                        />
                        {editingStaffId
                          ? "Save Changes"
                          : "Add Staff Member"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </aside>
        </div>
      ) : null}
    </>
  );
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10";

const textareaClassName =
  "mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10";

type TextFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  min?: string;
  max?: string;
  step?: string;
  list?: string;
  onChange: (value: string) => void;
};

function TextField({
  label,
  value,
  placeholder,
  type = "text",
  min,
  max,
  step,
  list,
  onChange,
}: TextFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#35243E]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        min={min}
        max={max}
        step={step}
        list={list}
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={inputClassName}
      />
    </label>
  );
}

type FormSectionProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

function FormSection({
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="rounded-[26px] border border-[#E7DFEA] bg-white p-5 sm:p-6">
      <h3 className="text-lg font-black text-[#2D1736]">
        {title}
      </h3>

      <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
        {description}
      </p>

      <div className="mt-5">{children}</div>
    </section>
  );
}

type SummaryCardProps = {
  label: string;
  value: number;
  description: string;
  icon: typeof UsersRound;
  colour: string;
};

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  colour,
}: SummaryCardProps) {
  return (
    <article className="rounded-[26px] border border-[#E8E0EB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)]">
      <span
        className={[
          "flex h-12 w-12 items-center justify-center rounded-2xl",
          colour,
        ].join(" ")}
      >
        <Icon
          aria-hidden="true"
          size={22}
        />
      </span>

      <p className="mt-5 text-sm font-bold text-[#746A78]">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black tracking-[-0.04em] text-[#2D1736]">
        {value}
      </p>

      <p className="mt-2 text-xs font-semibold text-[#928896]">
        {description}
      </p>
    </article>
  );
}

type DetailRowProps = {
  icon: typeof Phone;
  label: string;
  value: string;
};

function DetailRow({
  icon: Icon,
  label,
  value,
}: DetailRowProps) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#5B2A86]">
        <Icon
          aria-hidden="true"
          size={16}
        />
      </span>

      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#918695]">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-bold leading-5 text-[#4E4353]">
          {value}
        </p>
      </div>
    </div>
  );
}

