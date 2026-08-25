"use client";

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  UserMinus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";

type FeeTreatment =
  | "STOP_FROM_CURRENT_MONTH"
  | "CHARGE_FULL_CURRENT_MONTH"
  | "CHARGE_UP_TO_LEAVING_DATE"
  | "MANUAL_ADJUSTMENT";

type PendingFeeAction =
  | "KEEP_PENDING"
  | "MARK_WAIVED"
  | "REVIEW_LATER";

type WithdrawStudentDialogProps = {
  studentId: string;
  studentName: string;
  studentNumber: string;
  joiningDate?: string | Date | null;
  disabled?: boolean;
};

type WithdrawalFormData = {
  leavingDate: string;
  reason: string;
  feeTreatment: FeeTreatment;
  finalAdjustment: string;
  pendingFeeAction: PendingFeeAction;
  remarks: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
};

const feeTreatmentOptions: Array<{
  value: FeeTreatment;
  title: string;
  description: string;
}> = [
  {
    value: "STOP_FROM_CURRENT_MONTH",
    title: "Stop fees from current month",
    description:
      "Do not charge a new fee for the withdrawal month.",
  },
  {
    value: "CHARGE_FULL_CURRENT_MONTH",
    title: "Charge full current month",
    description:
      "Keep the complete fee for the withdrawal month.",
  },
  {
    value: "CHARGE_UP_TO_LEAVING_DATE",
    title: "Charge up to leaving date",
    description:
      "Review the final amount according to the leaving date.",
  },
  {
    value: "MANUAL_ADJUSTMENT",
    title: "Manual final adjustment",
    description:
      "Enter a custom final settlement amount.",
  },
];

const pendingFeeOptions: Array<{
  value: PendingFeeAction;
  title: string;
  description: string;
}> = [
  {
    value: "KEEP_PENDING",
    title: "Keep existing pending balance",
    description:
      "Outstanding amounts remain visible until collected.",
  },
  {
    value: "MARK_WAIVED",
    title: "Mark pending balance for waiver",
    description:
      "Record that the outstanding amount should be waived.",
  },
  {
    value: "REVIEW_LATER",
    title: "Review pending balance later",
    description:
      "Keep the balance open for a later decision.",
  },
];

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

function toDateInputValue(value?: string | Date | null) {
  if (!value) {
    return "";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().split("T")[0];
}

function getTodayInputValue() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default function WithdrawStudentDialog({
  studentId,
  studentName,
  studentNumber,
  joiningDate,
  disabled = false,
}: WithdrawStudentDialogProps) {
  const router = useRouter();

  const joiningDateValue = useMemo(
    () => toDateInputValue(joiningDate),
    [joiningDate],
  );

  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState<WithdrawalFormData>({
    leavingDate: getTodayInputValue(),
    reason: "",
    feeTreatment: "CHARGE_FULL_CURRENT_MONTH",
    finalAdjustment: "",
    pendingFeeAction: "KEEP_PENDING",
    remarks: "",
  });

  function updateField<Key extends keyof WithdrawalFormData>(
    field: Key,
    value: WithdrawalFormData[Key],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function closeDialog() {
    if (submitting) {
      return;
    }

    setOpen(false);
    setError("");
    setSuccessMessage("");
  }

  function validateForm() {
    if (!formData.leavingDate) {
      return "Please enter the leaving date.";
    }

    if (
      joiningDateValue &&
      formData.leavingDate < joiningDateValue
    ) {
      return "Leaving date cannot be before the joining date.";
    }

    if (!formData.reason.trim()) {
      return "Please enter the reason for withdrawal.";
    }

    if (
      formData.feeTreatment === "MANUAL_ADJUSTMENT" &&
      Number(formData.finalAdjustment) <= 0
    ) {
      return "Please enter a valid final adjustment amount.";
    }

    return "";
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const validationMessage = validateForm();

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/students/${encodeURIComponent(
          studentId,
        )}/withdraw`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            leavingDate: formData.leavingDate,
            reason: formData.reason.trim(),
            feeTreatment: formData.feeTreatment,
            finalAdjustment:
              formData.feeTreatment === "MANUAL_ADJUSTMENT"
                ? formData.finalAdjustment
                : "0",
            pendingFeeAction: formData.pendingFeeAction,
            remarks: formData.remarks.trim(),
          }),
        },
      );

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "The student could not be withdrawn.",
        );
      }

      setSuccessMessage(
        result.message ??
          `${studentName} has been withdrawn successfully.`,
      );

      router.refresh();

      window.setTimeout(() => {
        setOpen(false);
      }, 1200);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The student could not be withdrawn.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-5 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <UserMinus aria-hidden="true" size={17} />
        Withdraw Student
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-student-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1B1020]/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeDialog();
            }
          }}
        >
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[30px] bg-white shadow-[0_30px_100px_rgba(28,14,34,0.35)]">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#EEE8F1] bg-white/95 p-5 backdrop-blur sm:p-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-red-700">
                  Student withdrawal
                </p>

                <h2
                  id="withdraw-student-title"
                  className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl"
                >
                  Withdraw {studentName}
                </h2>

                <p className="mt-1 text-sm font-semibold text-[#817684]">
                  {studentNumber}
                </p>
              </div>

              <button
                type="button"
                onClick={closeDialog}
                disabled={submitting}
                aria-label="Close withdrawal dialog"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E2D8E6] bg-white text-[#625768] transition hover:bg-[#F6F1F8] disabled:opacity-50"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-7 p-5 sm:p-6">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle
                      aria-hidden="true"
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />

                    <div>
                      <p className="text-sm font-black text-amber-900">
                        Future attendance and fee generation will stop.
                      </p>

                      <p className="mt-1 text-xs font-semibold leading-5 text-amber-800">
                        Existing receipts, payments and attendance history remain saved.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black text-[#35243E]">
                      Leaving date *
                    </span>

                    <input
                      type="date"
                      min={joiningDateValue || undefined}
                      max={getTodayInputValue()}
                      value={formData.leavingDate}
                      disabled={submitting}
                      onChange={(event) =>
                        updateField(
                          "leavingDate",
                          event.target.value,
                        )
                      }
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-[#35243E]">
                      Reason for leaving *
                    </span>

                    <input
                      type="text"
                      value={formData.reason}
                      disabled={submitting}
                      placeholder="Example: Shifted residence"
                      onChange={(event) =>
                        updateField(
                          "reason",
                          event.target.value,
                        )
                      }
                      className={inputClassName}
                    />
                  </label>
                </div>

                <ChoiceSection
                  title="Final month fee"
                  options={feeTreatmentOptions}
                  selected={formData.feeTreatment}
                  disabled={submitting}
                  onSelect={(value) =>
                    updateField(
                      "feeTreatment",
                      value as FeeTreatment,
                    )
                  }
                />

                {formData.feeTreatment === "MANUAL_ADJUSTMENT" ? (
                  <label className="block">
                    <span className="text-sm font-black text-[#35243E]">
                      Final adjustment amount *
                    </span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.finalAdjustment}
                      disabled={submitting}
                      placeholder="0"
                      onChange={(event) =>
                        updateField(
                          "finalAdjustment",
                          event.target.value,
                        )
                      }
                      className={inputClassName}
                    />
                  </label>
                ) : null}

                <ChoiceSection
                  title="Pending fee handling"
                  options={pendingFeeOptions}
                  selected={formData.pendingFeeAction}
                  disabled={submitting}
                  onSelect={(value) =>
                    updateField(
                      "pendingFeeAction",
                      value as PendingFeeAction,
                    )
                  }
                />

                <label className="block">
                  <span className="text-sm font-black text-[#35243E]">
                    Remarks
                  </span>

                  <textarea
                    rows={4}
                    value={formData.remarks}
                    disabled={submitting}
                    placeholder="Optional internal note"
                    onChange={(event) =>
                      updateField(
                        "remarks",
                        event.target.value,
                      )
                    }
                    className={textareaClassName}
                  />
                </label>

                {error ? (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                  >
                    {error}
                  </div>
                ) : null}

                {successMessage ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                    <CheckCircle2
                      aria-hidden="true"
                      size={20}
                      className="mt-0.5 shrink-0 text-green-700"
                    />

                    <p className="text-sm font-black text-green-800">
                      {successMessage}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#EEE8F1] bg-white/95 p-5 backdrop-blur sm:flex-row sm:justify-end sm:p-6">
                <button
                  type="button"
                  onClick={closeDialog}
                  disabled={submitting}
                  className="min-h-12 rounded-2xl border border-[#DCCFE4] px-5 text-sm font-black text-[#5B2A86]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-sm font-black text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle
                        aria-hidden="true"
                        size={17}
                        className="animate-spin"
                      />
                      Withdrawing...
                    </>
                  ) : (
                    <>
                      <UserMinus
                        aria-hidden="true"
                        size={17}
                      />
                      Confirm Withdrawal
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

type ChoiceOption = {
  value: string;
  title: string;
  description: string;
};

function ChoiceSection({
  title,
  options,
  selected,
  disabled,
  onSelect,
}: {
  title: string;
  options: ChoiceOption[];
  selected: string;
  disabled: boolean;
  onSelect: (value: string) => void;
}) {
  return (
    <section className="border-t border-[#EEE8F1] pt-7">
      <h3 className="text-base font-black text-[#2D1736]">
        {title}
      </h3>

      <div className="mt-4 grid gap-3">
        {options.map((option) => {
          const active = selected === option.value;

          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(option.value)}
              className={[
                "flex items-start gap-4 rounded-2xl border p-4 text-left transition",
                active
                  ? "border-[#5B2A86] bg-[#F3EAF8]"
                  : "border-[#E5DCE9] bg-[#FAF8FC] hover:border-[#CDBCD6]",
              ].join(" ")}
            >
              <span
                className={[
                  "mt-0.5 h-5 w-5 shrink-0 rounded-full border-2",
                  active
                    ? "border-[#5B2A86] bg-[#5B2A86] shadow-[inset_0_0_0_4px_white]"
                    : "border-[#CFC3D4] bg-white",
                ].join(" ")}
              />

              <span>
                <span className="block text-sm font-black text-[#2D1736]">
                  {option.title}
                </span>

                <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
                  {option.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
