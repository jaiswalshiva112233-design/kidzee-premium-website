"use client";

import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  FileClock,
  LoaderCircle,
  MessageSquareText,
  ReceiptText,
  ShieldAlert,
  Trash2,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

type DataControlSection =
  | "enquiries"
  | "students"
  | "fees"
  | "expenses"
  | "websiteLeadHistory"
  | "activityHistory"
  | "preschoolCatalogue"
  | "daycareCatalogue"
  | "mealCatalogue"
  | "otherChargeCatalogue"
  | "legacyFeeSettings";

type DeleteAction =
  | "deleteEnquiry"
  | "deleteStudent"
  | "deleteInvoice"
  | "deletePayment"
  | "deleteExpense";

export type DataControlSnapshot = {
  createdAt: string;
  totals: {
    enquiries: number;
    followUps: number;
    websiteSubmissions: number;
    students: number;
    guardians: number;
    invoices: number;
    payments: number;
    receipts: number;
    expenses: number;
    attendance: number;
    daycareSessions: number;
    documents: number;
    activityLogs: number;
  };
  enquiries: Array<{
    id: string;
    enquiryNumber: string;
    parentName: string;
    childName: string | null;
    phone: string;
    source: string;
    status: string;
    websiteSubmissionCount: number;
    followUpCount: number;
    createdAt: string | null;
  }>;
  students: Array<{
    id: string;
    studentNumber: string;
    name: string;
    programme: string;
    status: string;
    createdAt: string | null;
    linked: {
      guardians: number;
      feeAccounts: number;
      feeInvoices: number;
      payments: number;
      receipts: number;
      attendanceRecords: number;
      documents: number;
      daycarePlans: number;
      daycareSessions: number;
      ledgerCharges: number;
      financialCorrections: number;
      whatsappMessages: number;
      contracts: number;
      contractServices: number;
      admissions: number;
      enquiries: number;
    };
    services: { preschool: boolean; daycare: boolean };
    protectedFinancialHistory: number;
  }>;
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    category: string;
    feePeriodLabel: string;
    totalAmount: string;
    paidAmount: string;
    status: string;
    createdAt: string | null;
    studentNumber: string;
    studentName: string;
    payments: Array<{
      paymentNumber: string;
      receiptNumber: string | null;
    }>;
  }>;
  standalonePayments: Array<{
    id: string;
    paymentNumber: string;
    category: string;
    feePeriodLabel: string | null;
    amountReceived: string;
    status: string;
    createdAt: string | null;
    studentNumber: string;
    studentName: string;
    receiptNumber: string | null;
  }>;
  expenses: Array<{
    id: string;
    expenseNumber: string;
    title: string;
    vendorName: string | null;
    category: string;
    totalAmount: string;
    paymentMethod: string;
    expenseDate: string | null;
    createdAt: string | null;
  }>;
  catalogue: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    dependencies: string[];
    safeToDelete: boolean;
    recommendation: string;
  }>;
};

type DeleteTarget = {
  action: DeleteAction;
  id: string;
  recordNumber: string;
  title: string;
  warning: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  snapshot?: DataControlSnapshot;
  blockers?: string[];
};

const sectionOptions: Array<{
  id: DataControlSection;
  title: string;
  description: string;
}> = [
  {
    id: "enquiries",
    title: "Enquiries & follow-ups",
    description:
      "Deletes every enquiry, follow-up and website submission linked to it.",
  },
  {
    id: "students",
    title: "Students & linked records",
    description:
      "Deletes students, guardians, documents, attendance, daycare and all linked fees.",
  },
  {
    id: "fees",
    title: "Fees, payments & receipts",
    description:
      "Keeps students but deletes fee accounts, invoices, payments and receipts.",
  },
  {
    id: "expenses",
    title: "Expenses",
    description: "Deletes every expense and its accounting details.",
  },
  {
    id: "websiteLeadHistory",
    title: "Website attribution history",
    description:
      "Keeps enquiries but removes submission, campaign, click and landing-page history.",
  },
  {
    id: "activityHistory",
    title: "CentreOS activity history",
    description:
      "Deletes the internal audit trail. This action is not logged again.",
  },
  {
    id: "preschoolCatalogue",
    title: "Test preschool programmes & fees",
    description: "Deletes only programme definitions and fee versions that have no remaining student, contract or invoice dependency.",
  },
  {
    id: "daycareCatalogue",
    title: "Test daycare plans & prices",
    description: "Deletes only unused daycare plans and price versions. Used historical plans remain protected.",
  },
  {
    id: "mealCatalogue",
    title: "Test meals & meal combinations",
    description: "Deletes only meals and combinations with no remaining child, session, contract or invoice dependency.",
  },
  {
    id: "otherChargeCatalogue",
    title: "Test other-charge types",
    description: "Deletes only charge definitions that have no student, contract or historical invoice use.",
  },
  {
    id: "legacyFeeSettings",
    title: "Unused legacy fee/daycare settings",
    description: "Deletes legacy preschool fee and daycare rate versions only when no historical record uses them.",
  },
];

function readable(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function linkedStudentSummary(
  linked: DataControlSnapshot["students"][number]["linked"],
) {
  return [
    `${linked.guardians} guardian${linked.guardians === 1 ? "" : "s"}`,
    `${linked.contracts} contract${linked.contracts === 1 ? "" : "s"}`,
    `${linked.contractServices} contract service${linked.contractServices === 1 ? "" : "s"}`,
    `${linked.feeInvoices} invoice${linked.feeInvoices === 1 ? "" : "s"}`,
    `${linked.payments} payment${linked.payments === 1 ? "" : "s"}`,
    `${linked.receipts} receipt${linked.receipts === 1 ? "" : "s"}`,
    `${linked.attendanceRecords} attendance record${linked.attendanceRecords === 1 ? "" : "s"}`,
    `${linked.daycareSessions} daycare session${linked.daycareSessions === 1 ? "" : "s"}`,
    `${linked.ledgerCharges} ledger charge${linked.ledgerCharges === 1 ? "" : "s"}`,
    `${linked.documents} document${linked.documents === 1 ? "" : "s"}`,
  ].join(" · ");
}

function sectionForCatalogueType(type: string): DataControlSection {
  if (type === "PRESCHOOL_PROGRAMME") return "preschoolCatalogue";
  if (type === "DAYCARE_PLAN") return "daycareCatalogue";
  if (type === "MEAL" || type === "MEAL_COMBINATION") return "mealCatalogue";
  if (type === "OTHER_CHARGE") return "otherChargeCatalogue";
  return "legacyFeeSettings";
}

export default function DataControlCenter({
  initialSnapshot,
}: {
  initialSnapshot: DataControlSnapshot;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [recordConfirmation, setRecordConfirmation] = useState("");
  const [selectedSections, setSelectedSections] = useState<DataControlSection[]>([]);
  const [bulkConfirmation, setBulkConfirmation] = useState("");
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [testDataConfirmed, setTestDataConfirmed] = useState(false);
  const [recordBackupConfirmed, setRecordBackupConfirmed] = useState(false);
  const [recordTestDataConfirmed, setRecordTestDataConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const financialRecordCount =
    snapshot.totals.invoices +
    snapshot.totals.payments +
    snapshot.totals.receipts;

  const hasAnyLaunchData = useMemo(
    () =>
      snapshot.totals.enquiries > 0 ||
      snapshot.totals.students > 0 ||
      financialRecordCount > 0 ||
      snapshot.totals.expenses > 0 ||
      snapshot.totals.websiteSubmissions > 0 ||
      snapshot.totals.activityLogs > 0,
    [financialRecordCount, snapshot.totals],
  );

  const selectedStudents = selectedSections.includes("students")
    ? snapshot.students
    : [];
  const selectedCatalogue = snapshot.catalogue.filter((item) =>
    selectedSections.includes(sectionForCatalogueType(item.type)),
  );

  function toggleSection(section: DataControlSection) {
    setSelectedSections((current) =>
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section],
    );
  }

  async function submitAction(payload: Record<string, unknown>) {
    setBusy(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/data-control", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success || !result.snapshot) {
        throw new Error(result.message || "The data change could not be completed.");
      }

      setSnapshot(result.snapshot);
      setMessage(result.message || "The selected data was removed.");
      return true;
    } catch (actionError) {
      setError(
        actionError instanceof Error
          ? actionError.message
          : "The data change could not be completed.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function deleteRecord() {
    if (!deleteTarget) {
      return;
    }

    const success = await submitAction({
      action: deleteTarget.action,
      id: deleteTarget.id,
      confirmation: recordConfirmation,
      backupConfirmed: recordBackupConfirmed,
      testDataConfirmed: recordTestDataConfirmed,
    });

    if (success) {
      setDeleteTarget(null);
      setRecordConfirmation("");
      setRecordBackupConfirmed(false);
      setRecordTestDataConfirmed(false);
    }
  }

  async function deleteSelectedData() {
    const success = await submitAction({
      action: "deleteSelected",
      sections: selectedSections,
      confirmation: bulkConfirmation,
      backupConfirmed,
      testDataConfirmed,
    });

    if (success) {
      setSelectedSections([]);
      setBulkConfirmation("");
      setBackupConfirmed(false);
      setTestDataConfirmed(false);
    }
  }

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_24px_70px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
              <DatabaseBackup aria-hidden="true" size={27} />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B]">
                Owner-only safety centre
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em] sm:text-4xl">
                Data & History
              </h1>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-7 text-white/70">
                Review, back up and permanently remove test records before your centre head begins. Every linked record is shown before deletion.
              </p>
            </div>
          </div>

          <a
            href="/api/admin/data-control/export"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#F6C84B] px-5 text-sm font-black text-[#2D1736] transition hover:bg-[#FFD65F]"
          >
            <DatabaseBackup aria-hidden="true" size={18} />
            Download Full Backup
          </a>
        </div>
      </section>

      {message ? (
        <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-800">
          <CheckCircle2 aria-hidden="true" size={19} className="mt-0.5 shrink-0" />
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
          <AlertTriangle aria-hidden="true" size={19} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard icon={MessageSquareText} label="Enquiries" value={snapshot.totals.enquiries} detail={`${snapshot.totals.followUps} follow-ups · ${snapshot.totals.websiteSubmissions} website submissions`} />
        <SummaryCard icon={UsersRound} label="Students" value={snapshot.totals.students} detail={`${snapshot.totals.guardians} guardians · ${snapshot.totals.documents} documents`} />
        <SummaryCard icon={ReceiptText} label="Financial records" value={financialRecordCount} detail={`${snapshot.totals.invoices} invoices · ${snapshot.totals.payments} payments · ${snapshot.totals.receipts} receipts`} />
        <SummaryCard icon={WalletCards} label="Expenses" value={snapshot.totals.expenses} detail={`${snapshot.totals.activityLogs} activity-history records`} />
      </section>

      <section className="rounded-[28px] border border-amber-200 bg-[#FFF9E8] p-5 shadow-[0_14px_40px_rgba(45,23,54,0.05)] sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
            <ShieldAlert aria-hidden="true" size={22} />
          </span>
          <div>
            <h2 className="text-xl font-black text-[#2D1736]">Safe launch cleanup</h2>
            <p className="mt-2 max-w-4xl text-sm font-semibold leading-6 text-[#6D5E48]">
              Use this only for test or sample data. After launch, cancel, close or archive genuine financial and parent records instead of deleting them.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 lg:grid-cols-2">
          {sectionOptions.map((section) => {
            const checked = selectedSections.includes(section.id);

            return (
              <label
                key={section.id}
                className={[
                  "flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition",
                  checked
                    ? "border-[#7A459C] bg-white shadow-sm"
                    : "border-amber-200 bg-white/70 hover:border-[#C9AED7]",
                ].join(" ")}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleSection(section.id)}
                  className="mt-1 h-4 w-4 accent-[#5B2A86]"
                />
                <span>
                  <span className="block text-sm font-black text-[#2D1736]">{section.title}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">{section.description}</span>
                </span>
              </label>
            );
          })}
        </div>

        {selectedStudents.length > 0 || selectedCatalogue.length > 0 ? (
          <div className="mt-6 rounded-2xl border border-[#DCCFE2] bg-white p-4 sm:p-5">
            <h3 className="text-base font-black text-[#2D1736]">
              Review exactly what will be removed
            </h3>
            <p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">
              Nothing is deleted until every safety confirmation below is complete. Used historical catalogue records are kept automatically.
            </p>

            {selectedStudents.length > 0 ? (
              <div className="mt-4 space-y-3">
                {selectedStudents.map((student) => (
                  <article key={student.id} className="rounded-xl border border-red-100 bg-red-50/50 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-black text-[#2D1736]">
                        {student.name} · {student.studentNumber}
                      </p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase text-[#6A328F]">
                        {readable(student.programme)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#6F626F]">
                      Services: {student.services.preschool ? "Preschool" : "No preschool"} · {student.services.daycare ? "Daycare" : "No daycare"}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">
                      Will delete: {linkedStudentSummary(student.linked)}, the student profile and linked admission. {student.linked.enquiries > 0 ? "The enquiry is retained and returned to Contacted unless Enquiries is also selected." : "No linked enquiry."}
                    </p>
                    {student.protectedFinancialHistory > 0 ? (
                      <p className="mt-2 text-xs font-black text-red-700">
                        Includes {student.protectedFinancialHistory} paid, receipt or correction record(s). Delete only if this is confirmed pre-launch test data.
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}

            {selectedCatalogue.length > 0 ? (
              <div className="mt-4 space-y-2">
                {selectedSections.includes("students") ? (
                  <p className="rounded-xl bg-[#F6F1F8] px-3 py-2 text-xs font-bold text-[#5B2A86]">
                    Catalogue dependencies are checked again after the selected test students are removed in the same transaction.
                  </p>
                ) : null}
                {selectedCatalogue.map((item) => (
                  <article key={`${item.type}-${item.id}`} className="flex flex-col gap-2 rounded-xl border border-[#E9E2ED] p-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-[#2D1736]">{item.name}</p>
                      <p className="mt-1 text-xs font-semibold text-[#817684]">
                        {readable(item.type)} · {readable(item.status)} · {item.dependencies.join(" · ") || "No dependencies"}
                      </p>
                    </div>
                    <span className={["shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black uppercase", item.safeToDelete ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-800"].join(" ")}>
                      {item.safeToDelete ? "Will delete" : "Protected for now"}
                    </span>
                  </article>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 grid gap-4 rounded-2xl border border-amber-200 bg-white p-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div className="space-y-4">
            <label className="block">
              <span className="text-xs font-black uppercase tracking-[0.1em] text-[#6A328F]">Type DELETE SELECTED DATA</span>
              <input
                value={bulkConfirmation}
                onChange={(event) => setBulkConfirmation(event.target.value)}
                placeholder="DELETE SELECTED DATA"
                autoComplete="off"
                className="mt-2 min-h-12 w-full rounded-xl border border-[#DCCFE2] px-4 text-sm font-bold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
              />
            </label>

            <label className="flex items-start gap-3 text-sm font-bold text-[#5E5262]">
              <input
                type="checkbox"
                checked={backupConfirmed}
                onChange={(event) => setBackupConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#5B2A86]"
              />
              I downloaded and checked the backup before deleting these records.
            </label>

            <label className="flex items-start gap-3 text-sm font-bold text-[#5E5262]">
              <input
                type="checkbox"
                checked={testDataConfirmed}
                onChange={(event) => setTestDataConfirmed(event.target.checked)}
                className="mt-0.5 h-4 w-4 accent-[#5B2A86]"
              />
              I confirm these are pre-launch test or sample records, not genuine centre records.
            </label>
          </div>

          <button
            type="button"
            disabled={busy || selectedSections.length === 0 || bulkConfirmation !== "DELETE SELECTED DATA" || !backupConfirmed || !testDataConfirmed}
            onClick={() => void deleteSelectedData()}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? <LoaderCircle aria-hidden="true" size={18} className="animate-spin" /> : <Trash2 aria-hidden="true" size={18} />}
            Delete Selected Data
          </button>
        </div>
      </section>

      {!hasAnyLaunchData ? (
        <section className="rounded-[26px] border border-green-200 bg-green-50 p-7 text-center">
          <CheckCircle2 aria-hidden="true" size={34} className="mx-auto text-green-700" />
          <h2 className="mt-3 text-xl font-black text-green-900">Centre data is clean</h2>
          <p className="mt-2 text-sm font-semibold text-green-800">No launch-test records remain in these sections.</p>
        </section>
      ) : null}

      <RecordSection title="Enquiries" subtitle="Deleting an enquiry also deletes its follow-ups and website submission history." count={snapshot.enquiries.length}>
        {snapshot.enquiries.map((enquiry) => (
          <RecordRow
            key={enquiry.id}
            title={`${enquiry.parentName}${enquiry.childName ? ` · ${enquiry.childName}` : ""}`}
            number={enquiry.enquiryNumber}
            meta={`${enquiry.phone} · ${readable(enquiry.source)} · ${readable(enquiry.status)} · ${enquiry.followUpCount} follow-ups · ${enquiry.websiteSubmissionCount} submissions · ${formatDate(enquiry.createdAt)}`}
            onDelete={() => setDeleteTarget({ action: "deleteEnquiry", id: enquiry.id, recordNumber: enquiry.enquiryNumber, title: `Delete ${enquiry.enquiryNumber}?`, warning: "Its follow-ups, attribution and website submission history will also be deleted." })}
          />
        ))}
      </RecordSection>

      <RecordSection title="Students" subtitle="The linked-record count prevents accidental deletion of genuine student history." count={snapshot.students.length}>
        {snapshot.students.map((student) => (
          <RecordRow
            key={student.id}
            title={`${student.name} · ${readable(student.programme)}`}
            number={student.studentNumber}
            meta={`${readable(student.status)} · ${linkedStudentSummary(student.linked)} · added ${formatDate(student.createdAt)}`}
            onDelete={() => setDeleteTarget({ action: "deleteStudent", id: student.id, recordNumber: student.studentNumber, title: `Delete ${student.name}?`, warning: "This permanently deletes the student, guardians, documents, attendance, daycare records, invoices, payments and receipts." })}
          />
        ))}
      </RecordSection>

      <RecordSection title="Fees, payments & receipts" subtitle="Delete a complete invoice bundle so totals, payments and receipts cannot become inconsistent." count={snapshot.invoices.length + snapshot.standalonePayments.length}>
        {snapshot.invoices.map((invoice) => (
          <RecordRow
            key={invoice.id}
            title={`${invoice.studentName} · ${invoice.feePeriodLabel}`}
            number={invoice.invoiceNumber}
            meta={`${readable(invoice.category)} · ${formatCurrency(invoice.totalAmount)} · ${readable(invoice.status)} · ${invoice.payments.map((payment) => [payment.paymentNumber, payment.receiptNumber].filter(Boolean).join(" / ")).join(", ") || "No payment"}`}
            onDelete={() => setDeleteTarget({ action: "deleteInvoice", id: invoice.id, recordNumber: invoice.invoiceNumber, title: `Delete ${invoice.invoiceNumber}?`, warning: "The invoice, every linked payment and every linked receipt will be deleted together." })}
          />
        ))}

        {snapshot.standalonePayments.map((payment) => (
          <RecordRow
            key={payment.id}
            title={`${payment.studentName} · ${payment.feePeriodLabel || readable(payment.category)}`}
            number={payment.paymentNumber}
            meta={`${formatCurrency(payment.amountReceived)} · ${readable(payment.status)} · ${payment.receiptNumber || "No receipt"}`}
            onDelete={() => setDeleteTarget({ action: "deletePayment", id: payment.id, recordNumber: payment.paymentNumber, title: `Delete ${payment.paymentNumber}?`, warning: "The standalone payment and its linked receipt will be deleted together." })}
          />
        ))}
      </RecordSection>

      <RecordSection title="Expenses" subtitle="Review the amount and vendor carefully before permanent deletion." count={snapshot.expenses.length}>
        {snapshot.expenses.map((expense) => (
          <RecordRow
            key={expense.id}
            title={`${expense.title}${expense.vendorName ? ` · ${expense.vendorName}` : ""}`}
            number={expense.expenseNumber}
            meta={`${formatCurrency(expense.totalAmount)} · ${readable(expense.category)} · ${readable(expense.paymentMethod)} · ${formatDate(expense.expenseDate)}`}
            onDelete={() => setDeleteTarget({ action: "deleteExpense", id: expense.id, recordNumber: expense.expenseNumber, title: `Delete ${expense.expenseNumber}?`, warning: "This expense will be permanently removed from accounts and reports." })}
          />
        ))}
      </RecordSection>

      <section className="rounded-[24px] border border-[#E9E2ED] bg-[#FAF8FC] px-5 py-4 text-xs font-semibold leading-5 text-[#817684]">
        <FileClock aria-hidden="true" size={17} className="mr-2 inline text-[#7A459C]" />
        Snapshot refreshed {new Date(snapshot.createdAt).toLocaleString("en-IN")}. Staff, payroll, website content and admin accounts are deliberately protected. Catalogue records with genuine historical use are retained automatically.
      </section>

      {deleteTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B0E20]/70 p-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="delete-record-title" className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <Trash2 aria-hidden="true" size={23} />
              </span>
              <button type="button" onClick={() => { setDeleteTarget(null); setRecordConfirmation(""); setRecordBackupConfirmed(false); setRecordTestDataConfirmed(false); }} className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#E7DEE9] text-[#5D5161] hover:bg-[#F6F1F8]" aria-label="Close">
                <X aria-hidden="true" size={19} />
              </button>
            </div>

            <h2 id="delete-record-title" className="mt-5 text-2xl font-black text-[#2D1736]">{deleteTarget.title}</h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#766A79]">{deleteTarget.warning}</p>

            <label className="mt-5 block">
              <span className="text-xs font-black uppercase tracking-[0.08em] text-red-700">Type DELETE {deleteTarget.recordNumber}</span>
              <input
                value={recordConfirmation}
                onChange={(event) => setRecordConfirmation(event.target.value)}
                autoFocus
                autoComplete="off"
                className="mt-2 min-h-12 w-full rounded-xl border border-[#DCCFE2] px-4 text-sm font-bold outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
              />
            </label>

            <div className="mt-4 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <label className="flex items-start gap-3 text-xs font-bold leading-5 text-[#5E5262]">
                <input
                  type="checkbox"
                  checked={recordBackupConfirmed}
                  onChange={(event) => setRecordBackupConfirmed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#5B2A86]"
                />
                I downloaded and checked the full backup.
              </label>
              <label className="flex items-start gap-3 text-xs font-bold leading-5 text-[#5E5262]">
                <input
                  type="checkbox"
                  checked={recordTestDataConfirmed}
                  onChange={(event) => setRecordTestDataConfirmed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#5B2A86]"
                />
                I confirm this is a pre-launch test or sample record.
              </label>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => { setDeleteTarget(null); setRecordConfirmation(""); setRecordBackupConfirmed(false); setRecordTestDataConfirmed(false); }} className="min-h-11 rounded-xl border border-[#DDD2E2] px-5 text-sm font-black text-[#5A4E5E] hover:bg-[#F7F3F8]">Keep Record</button>
              <button type="button" disabled={busy || recordConfirmation !== `DELETE ${deleteTarget.recordNumber}` || !recordBackupConfirmed || !recordTestDataConfirmed} onClick={() => void deleteRecord()} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40">
                {busy ? <LoaderCircle aria-hidden="true" size={17} className="animate-spin" /> : <Trash2 aria-hidden="true" size={17} />}
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, detail }: { icon: typeof MessageSquareText; label: string; value: number; detail: string }) {
  return (
    <article className="rounded-[22px] border border-[#E9E2ED] bg-white p-5 shadow-[0_10px_30px_rgba(45,23,54,0.05)]">
      <div className="flex items-center justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#6A328F]"><Icon aria-hidden="true" size={19} /></span>
        <span className="text-3xl font-black text-[#2D1736]">{value}</span>
      </div>
      <p className="mt-4 text-sm font-black text-[#2D1736]">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">{detail}</p>
    </article>
  );
}

function RecordSection({ title, subtitle, count, children }: { title: string; subtitle: string; count: number; children: React.ReactNode }) {
  return (
    <details open className="group rounded-[28px] border border-[#E9E2ED] bg-white shadow-[0_14px_40px_rgba(45,23,54,0.055)]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 sm:px-7">
        <span>
          <span className="block text-xl font-black text-[#2D1736]">{title}</span>
          <span className="mt-1 block text-sm font-semibold leading-6 text-[#817684]">{subtitle}</span>
        </span>
        <span className="rounded-full bg-[#F3EAF8] px-3 py-1.5 text-xs font-black text-[#5B2A86]">{count} records</span>
      </summary>
      <div className="border-t border-[#EEE8F0] px-4 py-3 sm:px-6">
        {count > 0 ? children : <p className="py-5 text-center text-sm font-semibold text-[#8A7E8D]">No records in this section.</p>}
      </div>
    </details>
  );
}

function RecordRow({ title, number, meta, onDelete }: { title: string; number: string; meta: string; onDelete: () => void }) {
  return (
    <article className="flex flex-col gap-3 border-b border-[#F0EBF2] py-4 last:border-b-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-black text-[#2D1736]">{title}</h3>
          <span className="rounded-full bg-[#F6F1F8] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.06em] text-[#6A328F]">{number}</span>
        </div>
        <p className="mt-1.5 text-xs font-semibold leading-5 text-[#817684]">{meta}</p>
      </div>
      <button type="button" onClick={onDelete} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 text-xs font-black text-red-700 transition hover:border-red-300 hover:bg-red-100">
        <Trash2 aria-hidden="true" size={15} />
        Delete
      </button>
    </article>
  );
}
