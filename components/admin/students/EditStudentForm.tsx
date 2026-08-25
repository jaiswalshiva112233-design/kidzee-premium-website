"use client";

import {
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Home,
  LoaderCircle,
  Save,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useMemo,
  useState,
} from "react";

type Programme =
  | "PLAYGROUP"
  | "NURSERY"
  | "JUNIOR_KG"
  | "SENIOR_KG"
  | "DAYCARE";

type StudentStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "WITHDRAWN"
  | "GRADUATED";

type GuardianRelationship =
  | "MOTHER"
  | "FATHER"
  | "GRANDMOTHER"
  | "GRANDFATHER"
  | "GUARDIAN"
  | "OTHER";

export type EditStudentInitialData = {
  id: string;
  studentNumber: string;

  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;

  dateOfBirth: string;
  gender: string;
  programme: Programme;
  programmeDefinitionId: string;
  status: StudentStatus;
  joiningDate: string;
  leavingDate: string;

  bloodGroup: string;
  medicalNotes: string;
  allergies: string;

  addressLine1: string;
  addressLine2: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;

  notes: string;

  guardianId: string;
  guardianName: string;
  guardianRelationship: GuardianRelationship;
  guardianPhone: string;
  guardianAlternatePhone: string;
  guardianEmail: string;
  guardianOccupation: string;
  guardianAddress: string;
  authorisedPickup: boolean;
};

type EditStudentFormProps = {
  initialData: EditStudentInitialData;
  programmeDefinitions?: Array<{
    id: string;
    code: string;
    name: string;
    ageMinimumMonths: number | null;
    ageMaximumMonths: number | null;
  }>;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  student?: {
    id: string;
    studentNumber: string;
  };
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

const statusOptions = [
  {
    value: "ACTIVE",
    label: "Active",
  },
  {
    value: "INACTIVE",
    label: "Inactive",
  },
  {
    value: "GRADUATED",
    label: "Graduated",
  },
] as const;

const guardianRelationshipOptions = [
  {
    value: "MOTHER",
    label: "Mother",
  },
  {
    value: "FATHER",
    label: "Father",
  },
  {
    value: "GRANDMOTHER",
    label: "Grandmother",
  },
  {
    value: "GRANDFATHER",
    label: "Grandfather",
  },
  {
    value: "GUARDIAN",
    label: "Guardian",
  },
  {
    value: "OTHER",
    label: "Other",
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

function formatAge(years: number, months: number) {
  if (years === 0) {
    return months === 1
      ? "1 month"
      : `${months} months`;
  }

  if (months === 0) {
    return years === 1
      ? "1 year"
      : `${years} years`;
  }

  return `${years} years ${months} months`;
}

function suggestProgramme(
  totalMonths: number,
): Programme | null {
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

  return null;
}

function programmeLabel(programme: Programme) {
  return (
    programmeOptions.find(
      (option) => option.value === programme,
    )?.label ?? programme
  );
}

function legacyProgrammeForCode(code: string): Programme {
  return programmeOptions.some((option) => option.value === code)
    ? (code as Programme)
    : code.includes("DAYCARE")
      ? "DAYCARE"
      : "NURSERY";
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

export default function EditStudentForm({
  initialData,
  programmeDefinitions = [],
}: EditStudentFormProps) {
  const router = useRouter();

  const [formData, setFormData] =
    useState<EditStudentInitialData>(initialData);

  const [submitting, setSubmitting] =
    useState(false);

  const [deleting, setDeleting] = useState(false);

  const [showDeleteConfirmation, setShowDeleteConfirmation] =
    useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const calculatedAge = useMemo(
    () => calculateAge(formData.dateOfBirth),
    [formData.dateOfBirth],
  );

  const suggestedProgramme = useMemo(() => {
    if (!calculatedAge) {
      return null;
    }

    return suggestProgramme(
      calculatedAge.totalMonths,
    );
  }, [calculatedAge]);

  function updateField<
    Key extends keyof EditStudentInitialData,
  >(
    field: Key,
    value: EditStudentInitialData[Key],
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
    updateField(
      "dateOfBirth",
      event.target.value,
    );
  }

  function resetForm() {
    setFormData(initialData);
    setError("");
    setSuccessMessage("");
    setShowDeleteConfirmation(false);
  }

  function validateForm() {
    if (formData.firstName.trim().length < 2) {
      return "Please enter the child’s first name.";
    }

    if (!formData.dateOfBirth) {
      return "Please enter the child’s date of birth.";
    }

    if (!formData.joiningDate) {
      return "Please enter the joining date.";
    }

    if (
      formData.leavingDate &&
      formData.leavingDate < formData.joiningDate
    ) {
      return "Leaving date cannot be before the joining date.";
    }

    if (
      formData.guardianName.trim().length < 2
    ) {
      return "Please enter the primary guardian’s name.";
    }

    if (
      formData.guardianPhone.replace(/\D/g, "")
        .length < 10
    ) {
      return "Please enter a valid guardian phone number.";
    }

    if (
      formData.guardianEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        formData.guardianEmail,
      )
    ) {
      return "Please enter a valid guardian email address.";
    }

    if (
      formData.postalCode &&
      !/^\d{6}$/.test(formData.postalCode)
    ) {
      return "Please enter a valid 6-digit PIN code.";
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
        `/api/admin/students/${formData.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const result =
        (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "The student record could not be updated.",
        );
      }

      setSuccessMessage(
        "Student record updated successfully.",
      );

      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The student record could not be updated.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        `/api/admin/students/${formData.id}`,
        {
          method: "DELETE",
        },
      );

      const result =
        (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "The student record could not be deleted.",
        );
      }

      router.push("/admin/students");
      router.refresh();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "The student record could not be deleted.",
      );

      setShowDeleteConfirmation(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-[30px] border border-[#E9E2ED] bg-white shadow-[0_22px_65px_rgba(45,23,54,0.1)]"
      >
        <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
                <UserRound
                  aria-hidden="true"
                  size={22}
                />
              </span>

              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                  {formData.studentNumber}
                </p>

                <h2 className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl">
                  Edit Student Record
                </h2>

                <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
                  Update student, guardian, health and
                  address information from this form.
                </p>
              </div>
            </div>

            <label className="block min-w-48">
              <span className="text-sm font-black text-[#35243E]">
                Student status
              </span>

              <select
                value={formData.status}
                disabled={submitting || deleting}
                onChange={(event) =>
                  updateField(
                    "status",
                    event.target
                      .value as StudentStatus,
                  )
                }
                className={inputClassName}
              >
                {formData.status === "WITHDRAWN" ? (
                  <option value="WITHDRAWN">
                    Withdrawn (managed through withdrawal)
                  </option>
                ) : null}
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
        </div>

        <div className="space-y-8 p-5 sm:p-6">
          <FormSection
            icon={UserRound}
            title="Student information"
            description="Basic identification, programme and admission dates."
          >
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <InputField
                label="First name *"
                value={formData.firstName}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField("firstName", value)
                }
              />

              <InputField
                label="Middle name"
                value={formData.middleName}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField("middleName", value)
                }
              />

              <InputField
                label="Last name"
                value={formData.lastName}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField("lastName", value)
                }
              />

              <InputField
                label="Preferred name"
                value={formData.preferredName}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField(
                    "preferredName",
                    value,
                  )
                }
              />

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Date of birth *
                </span>

                <input
                  type="date"
                  value={formData.dateOfBirth}
                  disabled={submitting || deleting}
                  max={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={handleDateOfBirthChange}
                  className={inputClassName}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Gender
                </span>

                <select
                  value={formData.gender}
                  disabled={submitting || deleting}
                  onChange={(event) =>
                    updateField(
                      "gender",
                      event.target.value,
                    )
                  }
                  className={inputClassName}
                >
                  <option value="">
                    Select gender
                  </option>
                  <option value="Female">
                    Female
                  </option>
                  <option value="Male">Male</option>
                  <option value="Other">
                    Other
                  </option>
                  <option value="Prefer not to say">
                    Prefer not to say
                  </option>
                </select>
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Programme *
                </span>

                <select
                  value={formData.programmeDefinitionId || formData.programme}
                  disabled={submitting || deleting}
                  onChange={(event) => {
                    const definition = programmeDefinitions.find(
                      (programme) => programme.id === event.target.value,
                    );
                    setFormData((current) => definition
                      ? {
                          ...current,
                          programmeDefinitionId: definition.id,
                          programme: legacyProgrammeForCode(definition.code),
                        }
                      : {
                          ...current,
                          programmeDefinitionId: "",
                          programme: event.target.value as Programme,
                        });
                    setError("");
                    setSuccessMessage("");
                  }}
                  className={inputClassName}
                >
                  {programmeDefinitions.length > 0
                    ? programmeDefinitions.map((option) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                          {option.ageMinimumMonths != null || option.ageMaximumMonths != null
                            ? ` · ${option.ageMinimumMonths ?? 0}–${option.ageMaximumMonths ?? "∞"} months`
                            : ""}
                        </option>
                      ))
                    : programmeOptions.map((option) => (
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
                  Joining date *
                </span>

                <input
                  type="date"
                  value={formData.joiningDate}
                  disabled={submitting || deleting}
                  onChange={(event) =>
                    updateField(
                      "joiningDate",
                      event.target.value,
                    )
                  }
                  className={inputClassName}
                />
              </label>

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Leaving date
                </span>

                <input
                  type="date"
                  value={formData.leavingDate}
                  disabled={submitting || deleting}
                  onChange={(event) =>
                    updateField(
                      "leavingDate",
                      event.target.value,
                    )
                  }
                  className={inputClassName}
                />
              </label>
            </div>

            {calculatedAge ? (
              <div className="mt-5 rounded-[22px] border border-[#E5D9EA] bg-[#FAF8FC] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                      Current age
                    </p>

                    <p className="mt-1 text-xl font-black text-[#2D1736]">
                      {formatAge(
                        calculatedAge.years,
                        calculatedAge.months,
                      )}
                    </p>
                  </div>

                  {suggestedProgramme ? (
                    <div className="rounded-2xl bg-[#F2E8F7] px-4 py-3">
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-[#7A459C]">
                        Age-based suggestion
                      </p>

                      <p className="mt-1 text-sm font-black text-[#5B2A86]">
                        {programmeLabel(
                          suggestedProgramme,
                        )}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </FormSection>

          <FormSection
            icon={UsersRound}
            title="Primary guardian"
            description="Update the main family contact and pickup permission."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Guardian name *"
                value={formData.guardianName}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField(
                    "guardianName",
                    value,
                  )
                }
              />

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Relationship *
                </span>

                <select
                  value={
                    formData.guardianRelationship
                  }
                  disabled={submitting || deleting}
                  onChange={(event) =>
                    updateField(
                      "guardianRelationship",
                      event.target
                        .value as GuardianRelationship,
                    )
                  }
                  className={inputClassName}
                >
                  {guardianRelationshipOptions.map(
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

              <InputField
                label="Primary phone *"
                value={formData.guardianPhone}
                type="tel"
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField(
                    "guardianPhone",
                    value,
                  )
                }
              />

              <InputField
                label="Alternate phone"
                value={
                  formData.guardianAlternatePhone
                }
                type="tel"
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField(
                    "guardianAlternatePhone",
                    value,
                  )
                }
              />

              <InputField
                label="Email"
                value={formData.guardianEmail}
                type="email"
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField(
                    "guardianEmail",
                    value,
                  )
                }
              />

              <InputField
                label="Occupation"
                value={formData.guardianOccupation}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField(
                    "guardianOccupation",
                    value,
                  )
                }
              />

              <label className="block md:col-span-2">
                <span className="text-sm font-black text-[#35243E]">
                  Guardian address
                </span>

                <textarea
                  value={formData.guardianAddress}
                  disabled={submitting || deleting}
                  rows={3}
                  placeholder="Leave empty when same as student address"
                  onChange={(event) =>
                    updateField(
                      "guardianAddress",
                      event.target.value,
                    )
                  }
                  className={textareaClassName}
                />
              </label>

              <label className="flex items-start gap-3 rounded-2xl border border-[#E5DCE9] bg-[#FAF8FC] p-4 md:col-span-2">
                <input
                  type="checkbox"
                  checked={
                    formData.authorisedPickup
                  }
                  disabled={submitting || deleting}
                  onChange={(event) =>
                    updateField(
                      "authorisedPickup",
                      event.target.checked,
                    )
                  }
                  className="mt-1 h-4 w-4 accent-[#5B2A86]"
                />

                <span>
                  <span className="block text-sm font-black text-[#2D1736]">
                    Authorised to pick up the child
                  </span>

                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
                    Uncheck this when the guardian must
                    not collect the child.
                  </span>
                </span>
              </label>
            </div>
          </FormSection>

          <FormSection
            icon={HeartPulse}
            title="Health information"
            description="Keep allergies and important medical instructions current."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Blood group"
                value={formData.bloodGroup}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField("bloodGroup", value)
                }
              />

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Allergies
                </span>

                <textarea
                  value={formData.allergies}
                  disabled={submitting || deleting}
                  rows={4}
                  placeholder="Food, medicine or environmental allergies"
                  onChange={(event) =>
                    updateField(
                      "allergies",
                      event.target.value,
                    )
                  }
                  className={textareaClassName}
                />
              </label>

              <label className="block md:col-span-2">
                <span className="text-sm font-black text-[#35243E]">
                  Medical information
                </span>

                <textarea
                  value={formData.medicalNotes}
                  disabled={submitting || deleting}
                  rows={5}
                  placeholder="Medical conditions, medication or special care instructions"
                  onChange={(event) =>
                    updateField(
                      "medicalNotes",
                      event.target.value,
                    )
                  }
                  className={textareaClassName}
                />
              </label>
            </div>
          </FormSection>

          <FormSection
            icon={Home}
            title="Residential address"
            description="Update the student’s current residential information."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Address line 1"
                value={formData.addressLine1}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField(
                    "addressLine1",
                    value,
                  )
                }
              />

              <InputField
                label="Address line 2"
                value={formData.addressLine2}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField(
                    "addressLine2",
                    value,
                  )
                }
              />

              <InputField
                label="Locality"
                value={formData.locality}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField("locality", value)
                }
              />

              <InputField
                label="City"
                value={formData.city}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField("city", value)
                }
              />

              <InputField
                label="State"
                value={formData.state}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField("state", value)
                }
              />

              <InputField
                label="PIN code"
                value={formData.postalCode}
                disabled={submitting || deleting}
                onChange={(value) =>
                  updateField(
                    "postalCode",
                    value,
                  )
                }
              />

              <label className="block md:col-span-2">
                <span className="text-sm font-black text-[#35243E]">
                  Internal notes
                </span>

                <textarea
                  value={formData.notes}
                  disabled={submitting || deleting}
                  rows={4}
                  placeholder="Internal notes about this student"
                  onChange={(event) =>
                    updateField(
                      "notes",
                      event.target.value,
                    )
                  }
                  className={textareaClassName}
                />
              </label>
            </div>
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

          <section className="rounded-[24px] border border-red-200 bg-red-50/60 p-5">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                <AlertTriangle
                  aria-hidden="true"
                  size={19}
                />
              </span>

              <div>
                <h3 className="text-base font-black text-red-800">
                  Permanent deletion
                </h3>

                <p className="mt-1 text-sm font-semibold leading-6 text-red-700/80">
                  Only delete a test or duplicate record.
                  Students with payments or receipts
                  cannot be deleted.
                </p>

                <button
                  type="button"
                  disabled={submitting || deleting}
                  onClick={() =>
                    setShowDeleteConfirmation(true)
                  }
                  className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-2xl border border-red-300 bg-white px-4 text-sm font-black text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2
                    aria-hidden="true"
                    size={17}
                  />
                  Delete Student
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-[#EEE8F1] bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting || deleting}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DED3E3] bg-white px-5 text-sm font-black text-[#625768] transition hover:bg-[#F7F2FA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Undo Changes
          </button>

          <button
            type="submit"
            disabled={submitting || deleting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.2)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  size={18}
                  className="animate-spin"
                />
                Saving Changes…
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                  size={18}
                />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>

      {showDeleteConfirmation ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#201025]/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)]">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <Trash2
                aria-hidden="true"
                size={22}
              />
            </span>

            <h2 className="mt-5 text-2xl font-black text-[#2D1736]">
              Delete this student?
            </h2>

            <p className="mt-3 text-sm font-semibold leading-6 text-[#746878]">
              This permanently removes the student and
              guardian record. This action cannot be
              undone.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                disabled={deleting}
                onClick={() =>
                  setShowDeleteConfirmation(false)
                }
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DED3E3] bg-white px-4 text-sm font-black text-[#625768]"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={deleting}
                onClick={() => void handleDelete()}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-red-700 px-4 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <>
                    <LoaderCircle
                      aria-hidden="true"
                      size={17}
                      className="animate-spin"
                    />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2
                      aria-hidden="true"
                      size={17}
                    />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

type InputFieldProps = {
  label: string;
  value: string;
  type?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function InputField({
  label,
  value,
  type = "text",
  disabled,
  onChange,
}: InputFieldProps) {
  return (
    <label className="block">
      <span className="text-sm font-black text-[#35243E]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={inputClassName}
      />
    </label>
  );
}

type FormSectionProps = {
  icon: typeof UserRound;
  title: string;
  description: string;
  children: React.ReactNode;
};

function FormSection({
  icon: Icon,
  title,
  description,
  children,
}: FormSectionProps) {
  return (
    <section className="border-b border-[#EEE8F1] pb-8 last:border-0 last:pb-0">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
          <Icon aria-hidden="true" size={19} />
        </span>

        <div>
          <h3 className="text-lg font-black text-[#2D1736]">
            {title}
          </h3>

          <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
            {description}
          </p>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </section>
  );
}
