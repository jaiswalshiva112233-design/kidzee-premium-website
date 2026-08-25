"use client";

import {
  Baby,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Home,
  LoaderCircle,
  Save,
  ShieldCheck,
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

type StudentFormData = {
  firstName: string;
  middleName: string;
  lastName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  programme: Programme;
  status: StudentStatus;
  joiningDate: string;
  bloodGroup: string;
  medicalNotes: string;
  allergies: string;

  addressLine1: string;
  addressLine2: string;
  locality: string;
  city: string;
  state: string;
  postalCode: string;

  guardianName: string;
  guardianRelationship: GuardianRelationship;
  guardianPhone: string;
  guardianAlternatePhone: string;
  guardianEmail: string;
  guardianOccupation: string;
  guardianAddress: string;
  authorisedPickup: boolean;

  notes: string;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  student?: {
    id: string;
    studentNumber: string;
  };
};

const today = new Date().toISOString().split("T")[0];

const initialFormData: StudentFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  dateOfBirth: "",
  gender: "",
  programme: "PLAYGROUP",
  status: "ACTIVE",
  joiningDate: today,
  bloodGroup: "",
  medicalNotes: "",
  allergies: "",

  addressLine1: "",
  addressLine2: "",
  locality: "",
  city: "New Delhi",
  state: "Delhi",
  postalCode: "",

  guardianName: "",
  guardianRelationship: "MOTHER",
  guardianPhone: "",
  guardianAlternatePhone: "",
  guardianEmail: "",
  guardianOccupation: "",
  guardianAddress: "",
  authorisedPickup: true,

  notes: "",
};

const steps = [
  {
    id: 1,
    title: "Child",
    description: "Basic student details",
    icon: Baby,
  },
  {
    id: 2,
    title: "Guardian",
    description: "Primary parent details",
    icon: UsersRound,
  },
  {
    id: 3,
    title: "Health",
    description: "Medical information",
    icon: HeartPulse,
  },
  {
    id: 4,
    title: "Address",
    description: "Residential information",
    icon: Home,
  },
  {
    id: 5,
    title: "Review",
    description: "Check and save",
    icon: ShieldCheck,
  },
] as const;

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
  const currentDate = new Date();

  if (
    Number.isNaN(birthDate.getTime()) ||
    birthDate > currentDate
  ) {
    return null;
  }

  let years =
    currentDate.getFullYear() - birthDate.getFullYear();

  let months =
    currentDate.getMonth() - birthDate.getMonth();

  if (currentDate.getDate() < birthDate.getDate()) {
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
      (item) => item.value === programme,
    )?.label ?? programme
  );
}

export default function AddStudentForm() {
  const router = useRouter();

  const [formData, setFormData] =
    useState<StudentFormData>(initialFormData);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
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

  function updateField<K extends keyof StudentFormData>(
    field: K,
    value: StudentFormData[K],
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
    const value = event.target.value;
    const age = calculateAge(value);

    setFormData((current) => ({
      ...current,
      dateOfBirth: value,
      programme:
        age && suggestProgramme(age.totalMonths)
          ? (suggestProgramme(
              age.totalMonths,
            ) as Programme)
          : current.programme,
    }));

    setError("");
    setSuccessMessage("");
  }

  function validateStep(step: number) {
    if (step === 1) {
      if (formData.firstName.trim().length < 2) {
        return "Please enter the child’s first name.";
      }

      if (!formData.dateOfBirth) {
        return "Please enter the child’s date of birth.";
      }

      if (!formData.joiningDate) {
        return "Please enter the joining date.";
      }
    }

    if (step === 2) {
      if (formData.guardianName.trim().length < 2) {
        return "Please enter the primary guardian’s name.";
      }

      if (
        formData.guardianPhone.replace(/\D/g, "")
          .length < 10
      ) {
        return "Please enter a valid guardian phone number.";
      }
    }

    if (step === 4) {
      if (
        formData.postalCode &&
        !/^\d{6}$/.test(formData.postalCode)
      ) {
        return "Please enter a valid 6-digit PIN code.";
      }
    }

    return "";
  }

  function goToNextStep() {
    const validationMessage =
      validateStep(currentStep);

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setError("");
    setCurrentStep((current) =>
      Math.min(current + 1, steps.length),
    );
  }

  function goToPreviousStep() {
    setError("");
    setCurrentStep((current) =>
      Math.max(current - 1, 1),
    );
  }

  function resetForm() {
    setFormData({
      ...initialFormData,
      joiningDate:
        new Date().toISOString().split("T")[0],
    });

    setCurrentStep(1);
    setError("");
    setSuccessMessage("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const childValidation = validateStep(1);
    const guardianValidation = validateStep(2);
    const addressValidation = validateStep(4);

    const validationMessage =
      childValidation ||
      guardianValidation ||
      addressValidation;

    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      const response = await fetch(
        "/api/admin/students",
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

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ??
            "The student could not be saved.",
        );
      }

      setSuccessMessage(
        result.student?.studentNumber
          ? `Student ${result.student.studentNumber} has been added successfully.`
          : "Student added successfully.",
      );

      setFormData({
        ...initialFormData,
        joiningDate:
          new Date().toISOString().split("T")[0],
      });

      setCurrentStep(1);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "The student could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-[30px] border border-[#E9E2ED] bg-white shadow-[0_22px_65px_rgba(45,23,54,0.1)]"
    >
      <div className="border-b border-[#EEE8F1] bg-[#FAF8FC] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F7] text-[#5B2A86]">
            <UserRound aria-hidden="true" size={22} />
          </span>

          <div>
            <h2 className="text-xl font-black text-[#2D1736] sm:text-2xl">
              Add New Student
            </h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
              Complete each step. The student number will
              be generated automatically after saving.
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {steps.map((step) => {
            const Icon = step.icon;
            const active = step.id === currentStep;
            const completed = step.id < currentStep;

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  if (step.id <= currentStep) {
                    setCurrentStep(step.id);
                    setError("");
                  }
                }}
                className={[
                  "rounded-2xl border p-3 text-left transition",
                  active
                    ? "border-[#5B2A86] bg-[#F3EAF8]"
                    : completed
                      ? "border-green-200 bg-green-50"
                      : "border-[#E5DCE9] bg-white",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={[
                      "flex h-8 w-8 items-center justify-center rounded-xl",
                      active
                        ? "bg-[#5B2A86] text-white"
                        : completed
                          ? "bg-green-100 text-green-700"
                          : "bg-[#F4EFF6] text-[#817684]",
                    ].join(" ")}
                  >
                    {completed ? (
                      <CheckCircle2
                        aria-hidden="true"
                        size={16}
                      />
                    ) : (
                      <Icon
                        aria-hidden="true"
                        size={16}
                      />
                    )}
                  </span>

                  <span className="text-xs font-black text-[#2D1736]">
                    {step.title}
                  </span>
                </div>

                <p className="mt-2 hidden text-[11px] font-semibold leading-4 text-[#8B808F] sm:block">
                  {step.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {currentStep === 1 ? (
          <section>
            <SectionTitle
              icon={Baby}
              title="Child details"
              description="Enter the student’s basic information."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <InputField
                label="First name *"
                value={formData.firstName}
                disabled={submitting}
                placeholder="Child’s first name"
                onChange={(value) =>
                  updateField("firstName", value)
                }
              />

              <InputField
                label="Middle name"
                value={formData.middleName}
                disabled={submitting}
                placeholder="Optional"
                onChange={(value) =>
                  updateField("middleName", value)
                }
              />

              <InputField
                label="Last name"
                value={formData.lastName}
                disabled={submitting}
                placeholder="Optional"
                onChange={(value) =>
                  updateField("lastName", value)
                }
              />

              <InputField
                label="Preferred name"
                value={formData.preferredName}
                disabled={submitting}
                placeholder="Name used in class"
                onChange={(value) =>
                  updateField("preferredName", value)
                }
              />

              <label className="block">
                <span className="text-sm font-black text-[#35243E]">
                  Date of birth *
                </span>

                <input
                  type="date"
                  value={formData.dateOfBirth}
                  disabled={submitting}
                  max={today}
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
                  disabled={submitting}
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
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
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
                  value={formData.programme}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "programme",
                      event.target.value as Programme,
                    )
                  }
                  className={inputClassName}
                >
                  {programmeOptions.map((option) => (
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
                  disabled={submitting}
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
                  Student status
                </span>

                <select
                  value={formData.status}
                  disabled={submitting}
                  onChange={(event) =>
                    updateField(
                      "status",
                      event.target
                        .value as StudentStatus,
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
                  <option value="WITHDRAWN">
                    Withdrawn
                  </option>
                  <option value="GRADUATED">
                    Graduated
                  </option>
                </select>
              </label>
            </div>

            {calculatedAge ? (
              <div className="mt-6 rounded-[22px] border border-[#E5D9EA] bg-[#FAF8FC] p-5">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                  Current age
                </p>

                <p className="mt-1 text-xl font-black text-[#2D1736]">
                  {formatAge(
                    calculatedAge.years,
                    calculatedAge.months,
                  )}
                </p>

                {suggestedProgramme ? (
                  <p className="mt-2 text-sm font-bold text-[#5B2A86]">
                    Suggested:{" "}
                    {programmeLabel(
                      suggestedProgramme,
                    )}
                  </p>
                ) : null}
              </div>
            ) : null}
          </section>
        ) : null}

        {currentStep === 2 ? (
          <section>
            <SectionTitle
              icon={UsersRound}
              title="Primary guardian"
              description="This guardian will be the main contact for the student."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InputField
                label="Guardian name *"
                value={formData.guardianName}
                disabled={submitting}
                placeholder="Full name"
                onChange={(value) =>
                  updateField("guardianName", value)
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
                  disabled={submitting}
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
                disabled={submitting}
                type="tel"
                placeholder="10-digit mobile number"
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
                disabled={submitting}
                type="tel"
                placeholder="Optional alternate number"
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
                disabled={submitting}
                type="email"
                placeholder="Optional email"
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
                disabled={submitting}
                placeholder="Optional"
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
                  disabled={submitting}
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
                  disabled={submitting}
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
                    Keep this checked only when this
                    guardian is allowed to collect the
                    child from the centre.
                  </span>
                </span>
              </label>
            </div>
          </section>
        ) : null}

        {currentStep === 3 ? (
          <section>
            <SectionTitle
              icon={HeartPulse}
              title="Health information"
              description="Record information required for safe daily care."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InputField
                label="Blood group"
                value={formData.bloodGroup}
                disabled={submitting}
                placeholder="Example: B+"
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
                  disabled={submitting}
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
                  disabled={submitting}
                  rows={5}
                  placeholder="Medical conditions, regular medication or special care instructions"
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
          </section>
        ) : null}

        {currentStep === 4 ? (
          <section>
            <SectionTitle
              icon={Home}
              title="Student address"
              description="Enter the child’s residential address."
            />

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <InputField
                label="Address line 1"
                value={formData.addressLine1}
                disabled={submitting}
                placeholder="House number and street"
                onChange={(value) =>
                  updateField("addressLine1", value)
                }
              />

              <InputField
                label="Address line 2"
                value={formData.addressLine2}
                disabled={submitting}
                placeholder="Apartment, block or landmark"
                onChange={(value) =>
                  updateField("addressLine2", value)
                }
              />

              <InputField
                label="Locality"
                value={formData.locality}
                disabled={submitting}
                placeholder="Sector or locality"
                onChange={(value) =>
                  updateField("locality", value)
                }
              />

              <InputField
                label="City"
                value={formData.city}
                disabled={submitting}
                placeholder="City"
                onChange={(value) =>
                  updateField("city", value)
                }
              />

              <InputField
                label="State"
                value={formData.state}
                disabled={submitting}
                placeholder="State"
                onChange={(value) =>
                  updateField("state", value)
                }
              />

              <InputField
                label="PIN code"
                value={formData.postalCode}
                disabled={submitting}
                placeholder="6-digit PIN code"
                onChange={(value) =>
                  updateField("postalCode", value)
                }
              />

              <label className="block md:col-span-2">
                <span className="text-sm font-black text-[#35243E]">
                  Internal notes
                </span>

                <textarea
                  value={formData.notes}
                  disabled={submitting}
                  rows={4}
                  placeholder="Any internal notes about the student or admission"
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
          </section>
        ) : null}

        {currentStep === 5 ? (
          <section>
            <SectionTitle
              icon={ShieldCheck}
              title="Review student record"
              description="Check the important details before saving."
            />

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <ReviewCard
                title="Student"
                rows={[
                  [
                    "Name",
                    [
                      formData.firstName,
                      formData.middleName,
                      formData.lastName,
                    ]
                      .filter(Boolean)
                      .join(" "),
                  ],
                  [
                    "Date of birth",
                    formData.dateOfBirth ||
                      "Not entered",
                  ],
                  [
                    "Age",
                    calculatedAge
                      ? formatAge(
                          calculatedAge.years,
                          calculatedAge.months,
                        )
                      : "Not available",
                  ],
                  [
                    "Programme",
                    programmeLabel(
                      formData.programme,
                    ),
                  ],
                  [
                    "Joining date",
                    formData.joiningDate,
                  ],
                ]}
              />

              <ReviewCard
                title="Primary guardian"
                rows={[
                  [
                    "Name",
                    formData.guardianName ||
                      "Not entered",
                  ],
                  [
                    "Relationship",
                    formData.guardianRelationship.replaceAll(
                      "_",
                      " ",
                    ),
                  ],
                  [
                    "Phone",
                    formData.guardianPhone ||
                      "Not entered",
                  ],
                  [
                    "Pickup authorised",
                    formData.authorisedPickup
                      ? "Yes"
                      : "No",
                  ],
                ]}
              />

              <ReviewCard
                title="Health"
                rows={[
                  [
                    "Blood group",
                    formData.bloodGroup ||
                      "Not entered",
                  ],
                  [
                    "Allergies",
                    formData.allergies ||
                      "None recorded",
                  ],
                  [
                    "Medical notes",
                    formData.medicalNotes ||
                      "None recorded",
                  ],
                ]}
              />

              <ReviewCard
                title="Address"
                rows={[
                  [
                    "Address",
                    [
                      formData.addressLine1,
                      formData.addressLine2,
                      formData.locality,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                      "Not entered",
                  ],
                  [
                    "City",
                    formData.city || "Not entered",
                  ],
                  [
                    "State",
                    formData.state || "Not entered",
                  ],
                  [
                    "PIN code",
                    formData.postalCode ||
                      "Not entered",
                  ],
                ]}
              />
            </div>
          </section>
        ) : null}

        {error ? (
          <div
            role="alert"
            className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
          >
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div
            role="status"
            className="mt-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold leading-6 text-green-700"
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

      <div className="sticky bottom-0 flex flex-col gap-3 border-t border-[#EEE8F1] bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={resetForm}
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-[#DED3E3] bg-white px-5 text-sm font-black text-[#625768] transition hover:bg-[#F7F2FA] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Clear
          </button>

          {currentStep > 1 ? (
            <button
              type="button"
              onClick={goToPreviousStep}
              disabled={submitting}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-[#DED3E3] bg-white px-5 text-sm font-black text-[#5B2A86] transition hover:bg-[#F7F2FA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ChevronLeft
                aria-hidden="true"
                size={18}
              />
              Previous
            </button>
          ) : null}
        </div>

        {currentStep < steps.length ? (
          <button
            type="button"
            onClick={goToNextStep}
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.2)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Continue
            <ChevronRight
              aria-hidden="true"
              size={18}
            />
          </button>
        ) : (
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_12px_30px_rgba(91,42,134,0.2)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  size={18}
                  className="animate-spin"
                />
                Saving Student…
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                  size={18}
                />
                Save Student
              </>
            )}
          </button>
        )}
      </div>
    </form>
  );
}

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

const textareaClassName =
  "mt-2 w-full resize-y rounded-2xl border border-[#DCCFE4] bg-white px-4 py-3 text-sm font-semibold leading-6 text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10 disabled:cursor-not-allowed disabled:opacity-60";

type InputFieldProps = {
  label: string;
  value: string;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function InputField({
  label,
  value,
  placeholder,
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
        placeholder={placeholder}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={inputClassName}
      />
    </label>
  );
}

type SectionTitleProps = {
  icon: typeof UserRound;
  title: string;
  description: string;
};

function SectionTitle({
  icon: Icon,
  title,
  description,
}: SectionTitleProps) {
  return (
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
  );
}

type ReviewCardProps = {
  title: string;
  rows: [string, string][];
};

function ReviewCard({
  title,
  rows,
}: ReviewCardProps) {
  return (
    <article className="rounded-[24px] border border-[#E9E2ED] bg-[#FAF8FC] p-5">
      <h3 className="text-base font-black text-[#2D1736]">
        {title}
      </h3>

      <div className="mt-4 space-y-3">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="border-b border-[#EEE8F1] pb-3 last:border-0 last:pb-0"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#8B808F]">
              {label}
            </p>

            <p className="mt-1 break-words text-sm font-bold leading-6 text-[#514657]">
              {value}
            </p>
          </div>
        ))}
      </div>
    </article>
  );
}
