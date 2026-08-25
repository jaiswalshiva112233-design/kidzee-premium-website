"use client";

import {
  Baby,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  Mail,
  MessageSquareText,
  Phone,
  Save,
  UserRound,
  X,
} from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useState,
} from "react";

type Programme =
  | ""
  | "PLAYGROUP"
  | "NURSERY"
  | "JUNIOR_KG"
  | "SENIOR_KG"
  | "DAYCARE";

type EnquirySource =
  | "WEBSITE"
  | "FORMSPREE"
  | "GOOGLE_ADS"
  | "META_ADS"
  | "WHATSAPP"
  | "PHONE_CALL"
  | "WALK_IN"
  | "REFERRAL"
  | "OTHER";

type EnquiryStatus =
  | "NEW"
  | "CONTACTED"
  | "NO_ANSWER"
  | "VISIT_SCHEDULED"
  | "TRIAL_SCHEDULED"
  | "INTERESTED"
  | "FOLLOW_UP"
  | "ADMITTED"
  | "NOT_INTERESTED"
  | "CLOSED";

type EnquiryFormData = {
  parentName: string;
  childName: string;
  childDateOfBirth: string;
  phone: string;
  alternatePhone: string;
  email: string;
  programme: Programme;
  source: EnquirySource;
  status: EnquiryStatus;
  preferredVisitDate: string;
  trialDate: string;
  nextFollowUpAt: string;
  message: string;
  notes: string;
};

type ApiResponse = {
  success?: boolean;
  duplicate?: boolean;
  message?: string;
  enquiry?: {
    id: string;
    enquiryNumber: string;
  };
};

type AddEnquiryFormProps = {
  onCloseAction?: () => void;
  onCreatedAction?: () => void;
};

const initialFormData: EnquiryFormData = {
  parentName: "",
  childName: "",
  childDateOfBirth: "",
  phone: "",
  alternatePhone: "",
  email: "",
  programme: "",
  source: "PHONE_CALL",
  status: "NEW",
  preferredVisitDate: "",
  trialDate: "",
  nextFollowUpAt: "",
  message: "",
  notes: "",
};

const programmeOptions = [
  {
    value: "PLAYGROUP",
    label: "Playgroup · 2–3 years",
  },
  {
    value: "NURSERY",
    label: "Nursery · 3–4 years",
  },
  {
    value: "JUNIOR_KG",
    label: "Junior KG · 4–5 years",
  },
  {
    value: "SENIOR_KG",
    label: "Senior KG · 5–6 years",
  },
  {
    value: "DAYCARE",
    label: "Daycare",
  },
] as const;

const sourceOptions = [
  {
    value: "PHONE_CALL",
    label: "Phone Call",
  },
  {
    value: "WHATSAPP",
    label: "WhatsApp",
  },
  {
    value: "WALK_IN",
    label: "Walk-in",
  },
  {
    value: "WEBSITE",
    label: "Website",
  },
  {
    value: "FORMSPREE",
    label: "Formspree",
  },
  {
    value: "GOOGLE_ADS",
    label: "Google Ads",
  },
  {
    value: "META_ADS",
    label: "Meta Ads",
  },
  {
    value: "REFERRAL",
    label: "Referral",
  },
  {
    value: "OTHER",
    label: "Other",
  },
] as const;

const statusOptions = [
  {
    value: "NEW",
    label: "New",
  },
  {
    value: "CONTACTED",
    label: "Contacted",
  },
  {
    value: "NO_ANSWER",
    label: "No Answer",
  },
  {
    value: "VISIT_SCHEDULED",
    label: "Visit Scheduled",
  },
  {
    value: "TRIAL_SCHEDULED",
    label: "Trial Scheduled",
  },
  {
    value: "INTERESTED",
    label: "Interested",
  },
  {
    value: "FOLLOW_UP",
    label: "Follow-up",
  },
  {
    value: "ADMITTED",
    label: "Admitted",
  },
  {
    value: "NOT_INTERESTED",
    label: "Not Interested",
  },
  {
    value: "CLOSED",
    label: "Closed",
  },
] as const;

function calculateAge(dateOfBirth: string) {
  if (!dateOfBirth) {
    return null;
  }

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  const today = new Date();

  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate > today
  ) {
    return null;
  }

  let years =
    today.getFullYear() - birthDate.getFullYear();

  let months =
    today.getMonth() - birthDate.getMonth();

  if (today.getDate() < birthDate.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years,
    months,
    totalMonths: years * 12 + months,
  };
}

function suggestProgramme(
  totalMonths: number,
): Programme {
  if (totalMonths >= 24 && totalMonths < 36) {
    return "PLAYGROUP";
  }

  if (totalMonths >= 36 && totalMonths < 48) {
    return "NURSERY";
  }

  if (totalMonths >= 48 && totalMonths < 60) {
    return "JUNIOR_KG";
  }

  if (totalMonths >= 60 && totalMonths < 72) {
    return "SENIOR_KG";
  }

  return "";
}

function formatAge(
  years: number,
  months: number,
) {
  const yearText =
    years === 1 ? "1 year" : `${years} years`;

  const monthText =
    months === 1 ? "1 month" : `${months} months`;

  if (years === 0) {
    return monthText;
  }

  if (months === 0) {
    return yearText;
  }

  return `${yearText} ${monthText}`;
}

export default function AddEnquiryForm({
  onCloseAction,
  onCreatedAction,
}: AddEnquiryFormProps) {
  const [formData, setFormData] =
    useState<EnquiryFormData>(initialFormData);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  const calculatedAge = useMemo(
    () =>
      calculateAge(
        formData.childDateOfBirth,
      ),
    [formData.childDateOfBirth],
  );

  const suggestedProgramme = useMemo(() => {
    if (!calculatedAge) {
      return "";
    }

    return suggestProgramme(
      calculatedAge.totalMonths,
    );
  }, [calculatedAge]);

  function updateField(
    field: keyof EnquiryFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
    setSuccessMessage("");
  }

  function handleDateOfBirthChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const dateOfBirth = event.target.value;
    const age = calculateAge(dateOfBirth);

    setFormData((current) => ({
      ...current,
      childDateOfBirth: dateOfBirth,
      programme:
        current.programme ||
        (age
          ? suggestProgramme(age.totalMonths)
          : ""),
    }));

    setError("");
    setSuccessMessage("");
  }

  function resetForm() {
    setFormData(initialFormData);
    setError("");
    setSuccessMessage("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!formData.parentName.trim()) {
      setError("Please enter the parent’s name.");
      return;
    }

    if (
      formData.phone.replace(/\D/g, "")
        .length < 10
    ) {
      setError(
        "Please enter a valid parent phone number.",
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        "/api/admin/enquiries",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

            const result =
        (await response.json()) as ApiResponse;

      if (
        result.duplicate &&
        result.enquiry?.id
      ) {
        window.dispatchEvent(
          new CustomEvent(
            "centreos:open-enquiry",
            {
              detail: {
                id: result.enquiry.id,
              },
            },
          ),
        );

        setError(
          result.message ??
            "This enquiry already exists. Its record has been opened.",
        );

        return;
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "The enquiry could not be saved.",
        );
      }

      setSuccessMessage(
        result.enquiry?.enquiryNumber
          ? `Enquiry ${result.enquiry.enquiryNumber} has been saved.`
          : "Enquiry has been saved successfully.",
      );

      setFormData(initialFormData);

      if (result.enquiry?.id) {
        window.dispatchEvent(
          new CustomEvent(
            "centreos:open-enquiry",
            {
              detail: {
                id: result.enquiry.id,
                refresh: true,
              },
            },
          ),
        );
      }

      onCreatedAction?.();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The enquiry could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[30px] border border-[#E9E2ED] bg-white shadow-[0_22px_65px_rgba(45,23,54,0.12)]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-[#EEE8F1] bg-[#FAF8FC] px-5 py-5 sm:px-6">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
            <MessageSquareText
              aria-hidden="true"
              size={21}
            />
          </span>

          <div>
            <h2 className="text-xl font-black text-[#2D1736]">
              Add New Enquiry
            </h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
              Enter the parent’s details once.
              The enquiry will be available in the
              dashboard and follow-up system.
            </p>
          </div>
        </div>

        {onCloseAction ? (
          <button
            type="button"
            onClick={onCloseAction}
            aria-label="Close enquiry form"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#E5DCE9] bg-white text-[#6D6171] transition hover:bg-[#F3EAF8] hover:text-[#5B2A86]"
          >
            <X aria-hidden="true" size={19} />
          </button>
        ) : null}
      </div>

      <div className="space-y-8 p-5 sm:p-6">
        <section>
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F3EAF8] text-[#5B2A86]">
              <UserRound
                aria-hidden="true"
                size={18}
              />
            </span>

            <div>
              <h3 className="text-base font-black text-[#2D1736]">
                Parent details
              </h3>

              <p className="text-xs font-semibold text-[#8B808F]">
                Parent name and phone are required.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Parent name *
              </span>

              <input
                type="text"
                value={formData.parentName}
                disabled={submitting}
                autoComplete="name"
                placeholder="Enter parent’s full name"
                onChange={(event) =>
                  updateField(
                    "parentName",
                    event.target.value,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Primary phone *
              </span>

              <div className="relative mt-2">
                <Phone
                  aria-hidden="true"
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#958A99]"
                />

                <input
                  type="tel"
                  value={formData.phone}
                  disabled={submitting}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  onChange={(event) =>
                    updateField(
                      "phone",
                      event.target.value,
                    )
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white py-3 pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Alternate phone
              </span>

              <input
                type="tel"
                value={formData.alternatePhone}
                disabled={submitting}
                inputMode="tel"
                placeholder="Optional alternate number"
                onChange={(event) =>
                  updateField(
                    "alternatePhone",
                    event.target.value,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Email address
              </span>

              <div className="relative mt-2">
                <Mail
                  aria-hidden="true"
                  size={17}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#958A99]"
                />

                <input
                  type="email"
                  value={formData.email}
                  disabled={submitting}
                  autoComplete="email"
                  placeholder="Optional email address"
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value,
                    )
                  }
                  className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white py-3 pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </label>
          </div>
        </section>

        <section className="border-t border-[#EEE8F1] pt-7">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF3D5] text-[#8A6100]">
              <Baby
                aria-hidden="true"
                size={18}
              />
            </span>

            <div>
              <h3 className="text-base font-black text-[#2D1736]">
                Child and programme
              </h3>

              <p className="text-xs font-semibold text-[#8B808F]">
                Date of birth automatically calculates
                the child’s current age.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Child name
              </span>

              <input
                type="text"
                value={formData.childName}
                disabled={submitting}
                placeholder="Enter child’s name"
                onChange={(event) =>
                  updateField(
                    "childName",
                    event.target.value,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Date of birth
              </span>

              <input
                type="date"
                value={
                  formData.childDateOfBirth
                }
                disabled={submitting}
                max={
                  new Date()
                    .toISOString()
                    .split("T")[0]
                }
                onChange={
                  handleDateOfBirthChange
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            {calculatedAge ? (
              <div className="rounded-2xl border border-[#E5D9EA] bg-[#FAF8FC] px-4 py-4 md:col-span-2">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                      Current age
                    </p>

                    <p className="mt-1 text-lg font-black text-[#2D1736]">
                      {formatAge(
                        calculatedAge.years,
                        calculatedAge.months,
                      )}
                    </p>
                  </div>

                  {suggestedProgramme ? (
                    <div className="rounded-2xl bg-[#F2E8F7] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#7A459C]">
                        Suggested programme
                      </p>

                      <p className="mt-1 text-sm font-black text-[#5B2A86]">
                        {
                          programmeOptions.find(
                            (option) =>
                              option.value ===
                              suggestedProgramme,
                          )?.label
                        }
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Interested programme
              </span>

              <select
                value={formData.programme}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "programme",
                    event.target
                      .value as Programme,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <option value="">
                  Select programme
                </option>

                {programmeOptions.map(
                  (option) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Enquiry source
              </span>

              <select
                value={formData.source}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "source",
                    event.target
                      .value as EnquirySource,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sourceOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Current status
              </span>

              <select
                value={formData.status}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target
                      .value as EnquiryStatus,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {statusOptions.map((option) => (
                  <option
                    key={option.value}
                    value={option.value}
                  >
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>

        <section className="border-t border-[#EEE8F1] pt-7">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E8F4FF] text-[#1769AA]">
              <CalendarDays
                aria-hidden="true"
                size={18}
              />
            </span>

            <div>
              <h3 className="text-base font-black text-[#2D1736]">
                Visit and follow-up
              </h3>

              <p className="text-xs font-semibold text-[#8B808F]">
                Add dates only when they are confirmed.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Preferred visit
              </span>

              <input
                type="datetime-local"
                value={
                  formData.preferredVisitDate
                }
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "preferredVisitDate",
                    event.target.value,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Trial date
              </span>

              <input
                type="datetime-local"
                value={formData.trialDate}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "trialDate",
                    event.target.value,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Next follow-up
              </span>

              <input
                type="datetime-local"
                value={formData.nextFollowUpAt}
                disabled={submitting}
                onChange={(event) =>
                  updateField(
                    "nextFollowUpAt",
                    event.target.value,
                  )
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>
        </section>

        <section className="border-t border-[#EEE8F1] pt-7">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Parent’s message
              </span>

              <textarea
                value={formData.message}
                disabled={submitting}
                rows={5}
                placeholder="What is the parent looking for?"
                onChange={(event) =>
                  updateField(
                    "message",
                    event.target.value,
                  )
                }
                className="mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>

            <label className="block">
              <span className="text-sm font-black text-[#35243E]">
                Internal notes
              </span>

              <textarea
                value={formData.notes}
                disabled={submitting}
                rows={5}
                placeholder="Notes for the centre head or owner"
                onChange={(event) =>
                  updateField(
                    "notes",
                    event.target.value,
                  )
                }
                className="mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          </div>
        </section>

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
            className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
          >
            <CheckCircle2
              aria-hidden="true"
              size={19}
              className="mt-0.5 shrink-0"
            />

            {successMessage}
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#EEE8F1] bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <button
          type="button"
          onClick={resetForm}
          disabled={submitting}
          className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DED3E3] bg-white px-5 text-sm font-black text-[#625768] transition hover:bg-[#F7F2FA] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear Form
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.20)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
        >
          {submitting ? (
            <>
              <LoaderCircle
                aria-hidden="true"
                size={18}
                className="animate-spin"
              />
              Saving Enquiry…
            </>
          ) : (
            <>
              <Save
                aria-hidden="true"
                size={18}
              />
              Save Enquiry
            </>
          )}
        </button>
      </div>
    </form>
  );
}