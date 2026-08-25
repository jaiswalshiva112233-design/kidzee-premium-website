"use client";

import {
  CheckCircle2,
  CircleAlert,
  Clock3,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  LockKeyhole,
  RefreshCcw,
  ShieldCheck,
  Trash2,
  UploadCloud,
  X,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type StudentDocumentType =
  | "BIRTH_CERTIFICATE"
  | "CHILD_AADHAAR_CARD"
  | "PARENT_ID_PROOF"
  | "ADDRESS_PROOF"
  | "IMMUNISATION_RECORD"
  | "MEDICAL_CERTIFICATE"
  | "PASSPORT_PHOTO"
  | "TRANSFER_CERTIFICATE"
  | "OTHER";

type StudentDocumentStatus =
  | "UPLOADED"
  | "VERIFIED"
  | "REJECTED";

type StudentDocumentRecord = {
  id: string;
  studentId: string;
  documentType: StudentDocumentType;
  title: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  status: StudentDocumentStatus;
  notes: string | null;
  rejectionReason: string | null;
  expiresAt: string | null;
  uploadedById: string | null;
  uploadedByName: string | null;
  verifiedById: string | null;
  verifiedByName: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  viewUrl: string;
  downloadUrl: string;
};

type StudentDocumentsResponse = {
  success: boolean;
  message?: string;
  documents?: StudentDocumentRecord[];
  documentsComplete?: boolean;
};

type StudentDocumentsPanelProps = {
  studentId: string;
  studentName: string;
  initialDocumentsComplete: boolean;
  canDelete: boolean;
};

type DocumentOption = {
  value: StudentDocumentType;
  label: string;
  description: string;
  required: boolean;
};

const documentOptions: DocumentOption[] = [
  {
    value: "BIRTH_CERTIFICATE",
    label: "Birth Certificate",
    description:
      "Official proof of the child’s date of birth.",
    required: true,
  },
  {
    value: "PASSPORT_PHOTO",
    label: "Student Photograph",
    description:
      "Recent clear passport-size photograph.",
    required: true,
  },
  {
    value: "PARENT_ID_PROOF",
    label: "Parent Photo / ID Proof",
    description:
      "Parent photograph or government identity proof.",
    required: true,
  },
  {
    value: "ADDRESS_PROOF",
    label: "Address Proof",
    description:
      "Current residential-address evidence.",
    required: true,
  },
  {
    value: "IMMUNISATION_RECORD",
    label: "Vaccination Record",
    description:
      "Latest vaccination or immunisation record.",
    required: true,
  },
  {
    value: "CHILD_AADHAAR_CARD",
    label: "Child Aadhaar Card",
    description:
      "Child’s Aadhaar card, when available.",
    required: true,
  },
  {
    value: "MEDICAL_CERTIFICATE",
    label: "Medical Certificate",
    description:
      "Optional health or fitness certificate.",
    required: false,
  },
  {
    value: "TRANSFER_CERTIFICATE",
    label: "Transfer Certificate",
    description:
      "Optional previous-school transfer certificate.",
    required: false,
  },
  {
    value: "OTHER",
    label: "Other Document",
    description:
      "Any additional admission or student document.",
    required: false,
  },
];

const requiredOptions = documentOptions.filter(
  (option) => option.required,
);

const statusLabels: Record<
  StudentDocumentStatus,
  string
> = {
  UPLOADED: "Pending verification",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const statusStyles: Record<
  StudentDocumentStatus,
  string
> = {
  UPLOADED:
    "border-amber-200 bg-amber-50 text-amber-700",
  VERIFIED:
    "border-green-200 bg-green-50 text-green-700",
  REJECTED:
    "border-red-200 bg-red-50 text-red-700",
};

function getDocumentLabel(
  documentType: StudentDocumentType,
) {
  return (
    documentOptions.find(
      (option) =>
        option.value === documentType,
    )?.label ?? documentType
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}

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

function formatDateTime(value: string | null) {
  if (!value) {
    return "Not recorded";
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

async function readJsonResponse(
  response: Response,
) {
  return (await response
    .json()
    .catch(() => ({
      success: false,
      message:
        "The server returned an invalid response.",
    }))) as StudentDocumentsResponse;
}

export default function StudentDocumentsPanel({
  studentId,
  studentName,
  initialDocumentsComplete,
  canDelete,
}: StudentDocumentsPanelProps) {
  const router = useRouter();
  const fileInputRef =
    useRef<HTMLInputElement>(null);
  const uploadSectionRef =
    useRef<HTMLDivElement>(null);

  const [documents, setDocuments] = useState<
    StudentDocumentRecord[]
  >([]);
  const [documentsComplete, setDocumentsComplete] =
    useState(initialDocumentsComplete);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyDocumentId, setBusyDocumentId] =
    useState<string | null>(null);
  const [notice, setNotice] = useState<{
    tone: "success" | "error";
    message: string;
  } | null>(null);
  const [documentType, setDocumentType] =
    useState<StudentDocumentType>(
      "BIRTH_CERTIFICATE",
    );
  const [title, setTitle] = useState(
    "Birth Certificate",
  );
  const [notes, setNotes] = useState("");
  const [expiresAt, setExpiresAt] =
    useState("");
  const [selectedFile, setSelectedFile] =
    useState<File | null>(null);
  const [rejectingId, setRejectingId] =
    useState<string | null>(null);
  const [rejectionReason, setRejectionReason] =
    useState("");

  const loadDocuments = useCallback(
    async (showLoader = true) => {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const response = await fetch(
          `/api/admin/student-documents?studentId=${encodeURIComponent(
            studentId,
          )}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );
        const payload =
          await readJsonResponse(response);

        if (!response.ok || !payload.success) {
          throw new Error(
            payload.message ||
              "Student documents could not be loaded.",
          );
        }

        setDocuments(payload.documents ?? []);
        setDocumentsComplete(
          payload.documentsComplete ?? false,
        );
      } catch (error) {
        setNotice({
          tone: "error",
          message:
            error instanceof Error
              ? error.message
              : "Student documents could not be loaded.",
        });
      } finally {
        setLoading(false);
      }
    },
    [studentId, setNotice],
  );

  useEffect(() => {
    // Load the student's document register when this profile opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadDocuments();
  }, [loadDocuments]);

  const verifiedRequiredCount = useMemo(
    () =>
      requiredOptions.filter((option) =>
        documents.some(
          (document) =>
            document.documentType ===
              option.value &&
            document.status === "VERIFIED",
        ),
      ).length,
    [documents],
  );

  const selectDocumentType = (
    value: StudentDocumentType,
    shouldScroll = false,
  ) => {
    setDocumentType(value);
    setTitle(getDocumentLabel(value));
    setNotice(null);

    if (shouldScroll) {
      window.setTimeout(() => {
        uploadSectionRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 0);
    }
  };

  const resetUploadForm = () => {
    setDocumentType("BIRTH_CERTIFICATE");
    setTitle("Birth Certificate");
    setNotes("");
    setExpiresAt("");
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setNotice(null);

    if (!title.trim()) {
      setNotice({
        tone: "error",
        message:
          "Please enter the document title.",
      });
      return;
    }

    if (!selectedFile) {
      setNotice({
        tone: "error",
        message:
          "Please choose a PDF or image file.",
      });
      return;
    }

    if (selectedFile.size > 8 * 1024 * 1024) {
      setNotice({
        tone: "error",
        message:
          "The selected file is larger than 8 MB.",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.set("studentId", studentId);
      formData.set("documentType", documentType);
      formData.set("title", title.trim());
      formData.set("notes", notes.trim());
      formData.set("expiresAt", expiresAt);
      formData.set("file", selectedFile);

      const response = await fetch(
        "/api/admin/student-documents",
        {
          method: "POST",
          body: formData,
        },
      );
      const payload =
        await readJsonResponse(response);

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            "The document could not be uploaded.",
        );
      }

      setNotice({
        tone: "success",
        message:
          payload.message ||
          "Document uploaded successfully.",
      });
      resetUploadForm();
      await loadDocuments(false);
      router.refresh();
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "The document could not be uploaded.",
      });
    } finally {
      setUploading(false);
    }
  };

  const updateDocumentStatus = async (
    documentId: string,
    action: "VERIFY" | "REJECT" | "RESET",
  ) => {
    setBusyDocumentId(documentId);
    setNotice(null);

    try {
      const response = await fetch(
        "/api/admin/student-documents",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            documentId,
            action,
            rejectionReason:
              action === "REJECT"
                ? rejectionReason
                : undefined,
          }),
        },
      );
      const payload =
        await readJsonResponse(response);

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            "The document status could not be updated.",
        );
      }

      setNotice({
        tone: "success",
        message:
          payload.message ||
          "Document status updated.",
      });
      setRejectingId(null);
      setRejectionReason("");
      await loadDocuments(false);
      router.refresh();
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "The document status could not be updated.",
      });
    } finally {
      setBusyDocumentId(null);
    }
  };

  const deleteDocument = async (
    document: StudentDocumentRecord,
  ) => {
    const confirmed = window.confirm(
      `Permanently delete “${document.title}”? This action cannot be undone.`,
    );

    if (!confirmed) {
      return;
    }

    setBusyDocumentId(document.id);
    setNotice(null);

    try {
      const response = await fetch(
        `/api/admin/student-documents?documentId=${encodeURIComponent(
          document.id,
        )}`,
        {
          method: "DELETE",
        },
      );
      const payload =
        await readJsonResponse(response);

      if (!response.ok || !payload.success) {
        throw new Error(
          payload.message ||
            "The document could not be deleted.",
        );
      }

      setNotice({
        tone: "success",
        message:
          payload.message ||
          "Document deleted.",
      });
      await loadDocuments(false);
      router.refresh();
    } catch (error) {
      setNotice({
        tone: "error",
        message:
          error instanceof Error
            ? error.message
            : "The document could not be deleted.",
      });
    } finally {
      setBusyDocumentId(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[30px] border border-[#E9E2ED] bg-white shadow-[0_18px_55px_rgba(45,23,54,0.07)]">
        <div className="bg-[#2D1736] px-5 py-6 text-white sm:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                <ShieldCheck
                  aria-hidden="true"
                  size={25}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-[#F6C84B]">
                  Secure student records
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.03em] sm:text-3xl">
                  Document Centre
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-white/70">
                  Upload, review and verify admission documents for {studentName}.
                </p>
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-white/10 px-5 py-4 backdrop-blur">
              <div className="flex items-center gap-3">
                <span
                  className={[
                    "flex h-11 w-11 items-center justify-center rounded-2xl",
                    documentsComplete
                      ? "bg-green-400/20 text-green-200"
                      : "bg-amber-300/20 text-amber-200",
                  ].join(" ")}
                >
                  {documentsComplete ? (
                    <CheckCircle2
                      aria-hidden="true"
                      size={22}
                    />
                  ) : (
                    <Clock3
                      aria-hidden="true"
                      size={22}
                    />
                  )}
                </span>

                <div>
                  <p className="text-sm font-black">
                    {documentsComplete
                      ? "Documents complete"
                      : "Verification pending"}
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-white/65">
                    {verifiedRequiredCount} of {requiredOptions.length} required items verified
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 p-5 sm:p-7 xl:grid-cols-[1.3fr_0.7fr]">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                  Required checklist
                </p>
                <h3 className="mt-1 text-xl font-black text-[#2D1736]">
                  Admission documents
                </h3>
              </div>

              <span className="rounded-full bg-[#F3EAF8] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.08em] text-[#5B2A86]">
                {verifiedRequiredCount}/{requiredOptions.length} verified
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {requiredOptions.map((option) => {
                const matchingDocuments =
                  documents.filter(
                    (document) =>
                      document.documentType ===
                      option.value,
                  );
                const verified =
                  matchingDocuments.some(
                    (document) =>
                      document.status ===
                      "VERIFIED",
                  );
                const pending =
                  matchingDocuments.some(
                    (document) =>
                      document.status ===
                      "UPLOADED",
                  );
                const rejected =
                  matchingDocuments.some(
                    (document) =>
                      document.status ===
                      "REJECTED",
                  );

                return (
                  <article
                    key={option.value}
                    className={[
                      "rounded-[22px] border p-4 transition",
                      verified
                        ? "border-green-200 bg-green-50/60"
                        : rejected
                          ? "border-red-200 bg-red-50/50"
                          : pending
                            ? "border-amber-200 bg-amber-50/50"
                            : "border-[#E6DEE9] bg-[#FBF9FC]",
                    ].join(" ")}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          verified
                            ? "bg-green-100 text-green-700"
                            : rejected
                              ? "bg-red-100 text-red-700"
                              : pending
                                ? "bg-amber-100 text-amber-700"
                                : "bg-white text-[#7A459C] shadow-sm",
                        ].join(" ")}
                      >
                        {verified ? (
                          <CheckCircle2
                            aria-hidden="true"
                            size={19}
                          />
                        ) : rejected ? (
                          <XCircle
                            aria-hidden="true"
                            size={19}
                          />
                        ) : pending ? (
                          <Clock3
                            aria-hidden="true"
                            size={19}
                          />
                        ) : (
                          <FileText
                            aria-hidden="true"
                            size={19}
                          />
                        )}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-[#2D1736]">
                          {option.label}
                        </p>
                        <p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">
                          {verified
                            ? "Verified and complete"
                            : pending
                              ? "Waiting for verification"
                              : rejected
                                ? "Upload a corrected copy"
                                : "Not uploaded yet"}
                        </p>
                      </div>
                    </div>

                    {!verified ? (
                      <button
                        type="button"
                        onClick={() =>
                          selectDocumentType(
                            option.value,
                            true,
                          )
                        }
                        className="mt-4 inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-[#DCCFE4] bg-white px-3 text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
                      >
                        <UploadCloud
                          aria-hidden="true"
                          size={15}
                        />
                        {matchingDocuments.length > 0
                          ? "Upload another copy"
                          : "Upload document"}
                      </button>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          <div
            ref={uploadSectionRef}
            id="student-document-upload"
            className="scroll-mt-24 rounded-[24px] border border-[#E1D7E5] bg-[#F8F4FA] p-5"
          >
            <div className="flex items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5B2A86] text-white">
                <UploadCloud
                  aria-hidden="true"
                  size={21}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                  Secure upload
                </p>
                <h3 className="mt-1 text-lg font-black text-[#2D1736]">
                  Add a document
                </h3>
              </div>
            </div>

            <form
              onSubmit={handleUpload}
              className="mt-5 space-y-4"
            >
              <label className="block text-xs font-black text-[#4A3F4E]">
                Document type
                <select
                  value={documentType}
                  onChange={(event) =>
                    selectDocumentType(
                      event.target
                        .value as StudentDocumentType,
                    )
                  }
                  disabled={uploading}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-bold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:opacity-60"
                >
                  {documentOptions.map(
                    (option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                        {option.required
                          ? " (Required)"
                          : " (Optional)"}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block text-xs font-black text-[#4A3F4E]">
                Document title
                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  maxLength={120}
                  disabled={uploading}
                  placeholder="Enter document title"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none placeholder:text-[#A99FAC] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:opacity-60"
                />
              </label>

              <label className="block text-xs font-black text-[#4A3F4E]">
                Choose file
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/png,image/webp"
                  disabled={uploading}
                  onChange={(event) =>
                    setSelectedFile(
                      event.target.files?.[0] ??
                        null,
                    )
                  }
                  className="mt-2 block w-full rounded-2xl border border-dashed border-[#CDBED4] bg-white px-3 py-3 text-xs font-semibold text-[#615566] file:mr-3 file:rounded-xl file:border-0 file:bg-[#F3EAF8] file:px-3 file:py-2 file:text-xs file:font-black file:text-[#5B2A86] hover:file:bg-[#E9DDF0] disabled:opacity-60"
                />
              </label>

              {selectedFile ? (
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#E1D7E5] bg-white px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-[#2D1736]">
                      {selectedFile.name}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-[#8B808E]">
                      {formatFileSize(
                        selectedFile.size,
                      )}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value =
                          "";
                      }
                    }}
                    disabled={uploading}
                    aria-label="Remove selected file"
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <X
                      aria-hidden="true"
                      size={16}
                    />
                  </button>
                </div>
              ) : null}

              <label className="block text-xs font-black text-[#4A3F4E]">
                Expiry date
                <span className="ml-1 font-semibold text-[#968B99]">
                  (optional)
                </span>
                <input
                  type="date"
                  value={expiresAt}
                  onChange={(event) =>
                    setExpiresAt(
                      event.target.value,
                    )
                  }
                  disabled={uploading}
                  className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:opacity-60"
                />
              </label>

              <label className="block text-xs font-black text-[#4A3F4E]">
                Internal note
                <span className="ml-1 font-semibold text-[#968B99]">
                  (optional)
                </span>
                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  maxLength={1000}
                  rows={3}
                  disabled={uploading}
                  placeholder="Add any verification note"
                  className="mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none placeholder:text-[#A99FAC] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:opacity-60"
                />
              </label>

              <div className="flex items-start gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-3 py-3 text-xs font-semibold leading-5 text-blue-800">
                <LockKeyhole
                  aria-hidden="true"
                  size={17}
                  className="mt-0.5 shrink-0"
                />
                PDF, JPG, PNG or WebP only. Maximum 8 MB. Files remain behind admin login.
              </div>

              <button
                type="submit"
                disabled={uploading}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_12px_28px_rgba(91,42,134,0.2)] transition hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading ? (
                  <Loader2
                    aria-hidden="true"
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <UploadCloud
                    aria-hidden="true"
                    size={18}
                  />
                )}
                {uploading
                  ? "Uploading securely..."
                  : "Upload Document"}
              </button>
            </form>
          </div>
        </div>
      </section>

      {notice ? (
        <div
          role="status"
          className={[
            "flex items-start justify-between gap-4 rounded-[22px] border px-4 py-4 text-sm font-bold",
            notice.tone === "success"
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-red-200 bg-red-50 text-red-800",
          ].join(" ")}
        >
          <div className="flex items-start gap-2">
            {notice.tone === "success" ? (
              <CheckCircle2
                aria-hidden="true"
                size={19}
                className="mt-0.5 shrink-0"
              />
            ) : (
              <CircleAlert
                aria-hidden="true"
                size={19}
                className="mt-0.5 shrink-0"
              />
            )}
            <span>{notice.message}</span>
          </div>

          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss message"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/70"
          >
            <X
              aria-hidden="true"
              size={15}
            />
          </button>
        </div>
      ) : null}

      <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Document register
            </p>
            <h2 className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl">
              Uploaded files
            </h2>
            <p className="mt-2 text-sm font-semibold text-[#817684]">
              {documents.length} document record{documents.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadDocuments()
            }
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA] disabled:opacity-50"
          >
            <RefreshCcw
              aria-hidden="true"
              size={17}
              className={
                loading ? "animate-spin" : ""
              }
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mt-6 flex min-h-48 items-center justify-center rounded-[22px] border border-dashed border-[#DCCFE3] bg-[#FBF9FC]">
            <div className="text-center">
              <Loader2
                aria-hidden="true"
                size={26}
                className="mx-auto animate-spin text-[#5B2A86]"
              />
              <p className="mt-3 text-sm font-bold text-[#817684]">
                Loading secure documents...
              </p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="mt-6 flex min-h-56 flex-col items-center justify-center rounded-[22px] border border-dashed border-[#DCCFE3] bg-[#FBF9FC] px-5 py-10 text-center">
            <span className="flex h-15 w-15 items-center justify-center rounded-[20px] bg-[#F1E7F5] text-[#5B2A86]">
              <FileCheck2
                aria-hidden="true"
                size={28}
              />
            </span>
            <h3 className="mt-4 text-lg font-black text-[#2D1736]">
              No documents uploaded yet
            </h3>
            <p className="mt-2 max-w-md text-sm font-semibold leading-6 text-[#817684]">
              Select a checklist item above and upload the first secure document.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {documents.map((document) => {
              const busy =
                busyDocumentId === document.id;
              const isRejecting =
                rejectingId === document.id;

              return (
                <article
                  key={document.id}
                  className="rounded-[24px] border border-[#E8E1EB] bg-[#FBF9FC] p-4 sm:p-5"
                >
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-sm">
                        <FileText
                          aria-hidden="true"
                          size={22}
                        />
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="break-words text-sm font-black text-[#2D1736]">
                            {document.title}
                          </h3>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em] ${statusStyles[document.status]}`}
                          >
                            {statusLabels[document.status]}
                          </span>
                        </div>

                        <p className="mt-1 text-xs font-bold text-[#7A459C]">
                          {getDocumentLabel(
                            document.documentType,
                          )}
                        </p>
                        <p className="mt-2 break-all text-xs font-semibold text-[#817684]">
                          {document.fileName} · {formatFileSize(document.fileSize)}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#928896]">
                          Uploaded {formatDateTime(document.createdAt)}
                          {document.uploadedByName
                            ? ` by ${document.uploadedByName}`
                            : ""}
                        </p>

                        {document.expiresAt ? (
                          <p className="mt-1 text-xs font-semibold text-[#8A6100]">
                            Expires {formatDate(document.expiresAt)}
                          </p>
                        ) : null}

                        {document.notes ? (
                          <p className="mt-3 max-w-2xl rounded-xl bg-white px-3 py-2 text-xs font-semibold leading-5 text-[#6F6473]">
                            {document.notes}
                          </p>
                        ) : null}

                        {document.status ===
                          "VERIFIED" ? (
                          <p className="mt-3 flex items-center gap-2 text-xs font-bold text-green-700">
                            <ShieldCheck
                              aria-hidden="true"
                              size={15}
                            />
                            Verified {formatDateTime(document.verifiedAt)}
                            {document.verifiedByName
                              ? ` by ${document.verifiedByName}`
                              : ""}
                          </p>
                        ) : null}

                        {document.status ===
                          "REJECTED" ? (
                          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-semibold leading-5 text-red-800">
                            <span className="font-black">
                              Rejection reason:
                            </span>{" "}
                            {document.rejectionReason ||
                              "No reason recorded"}
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:max-w-[420px] xl:justify-end">
                      <a
                        href={document.viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DCCFE4] bg-white px-3 text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
                      >
                        <Eye
                          aria-hidden="true"
                          size={15}
                        />
                        View
                      </a>

                      <a
                        href={document.downloadUrl}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-[#DCCFE4] bg-white px-3 text-xs font-black text-[#5B2A86] transition hover:bg-[#F3EAF8]"
                      >
                        <Download
                          aria-hidden="true"
                          size={15}
                        />
                        Download
                      </a>

                      {document.status !==
                      "VERIFIED" ? (
                        <button
                          type="button"
                          onClick={() =>
                            void updateDocumentStatus(
                              document.id,
                              "VERIFY",
                            )
                          }
                          disabled={busy}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-green-600 px-3 text-xs font-black text-white transition hover:bg-green-700 disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2
                              aria-hidden="true"
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <CheckCircle2
                              aria-hidden="true"
                              size={15}
                            />
                          )}
                          Verify
                        </button>
                      ) : null}

                      {document.status !==
                      "REJECTED" ? (
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(document.id);
                            setRejectionReason("");
                          }}
                          disabled={busy}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                        >
                          <XCircle
                            aria-hidden="true"
                            size={15}
                          />
                          Reject
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            void updateDocumentStatus(
                              document.id,
                              "RESET",
                            )
                          }
                          disabled={busy}
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 text-xs font-black text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
                        >
                          <RefreshCcw
                            aria-hidden="true"
                            size={15}
                          />
                          Reset
                        </button>
                      )}

                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() =>
                            void deleteDocument(document)
                          }
                          disabled={busy}
                          title="Owner-only permanent deletion"
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                        >
                          <Trash2
                            aria-hidden="true"
                            size={15}
                          />
                          Delete
                        </button>
                      ) : null}
                    </div>
                  </div>

                  {isRejecting ? (
                    <div className="mt-4 rounded-[20px] border border-red-200 bg-red-50 p-4">
                      <label className="block text-xs font-black text-red-900">
                        Why is this document being rejected?
                        <textarea
                          value={rejectionReason}
                          onChange={(event) =>
                            setRejectionReason(
                              event.target.value,
                            )
                          }
                          maxLength={500}
                          rows={3}
                          autoFocus
                          placeholder="Example: The image is blurred; please upload a clear copy."
                          className="mt-2 w-full resize-y rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none placeholder:text-[#B8A7AA] focus:border-red-400 focus:ring-4 focus:ring-red-100"
                        />
                      </label>

                      <div className="mt-3 flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setRejectingId(null);
                            setRejectionReason("");
                          }}
                          disabled={busy}
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void updateDocumentStatus(
                              document.id,
                              "REJECT",
                            )
                          }
                          disabled={
                            busy ||
                            rejectionReason.trim()
                              .length < 3
                          }
                          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {busy ? (
                            <Loader2
                              aria-hidden="true"
                              size={15}
                              className="animate-spin"
                            />
                          ) : (
                            <XCircle
                              aria-hidden="true"
                              size={15}
                            />
                          )}
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
