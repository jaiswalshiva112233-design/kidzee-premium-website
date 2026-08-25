"use client";

import {
  Baby,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HeartPulse,
  Home,
  IndianRupee,
  Layers3,
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
  programmeDefinitionId: string;
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

  academicSession: string;
  preschoolEnabled: boolean;
  daycarePlanIds: string[];
  daycareEffectiveFrom: string;
  daycareEffectiveTo: string;
  scheduledWeekdays: number[];
  mealCombinationId: string;
  includeAdmissionFee: boolean;
  includeAnnualFee: boolean;
  includeKitFee: boolean;
  annualKitSkipReason: string;
  otherChargeIds: string[];
  approvedDiscount: string;
  billingDay: string;
  dueDay: string;
  documentsComplete: boolean;
  duplicateOverrideStudentId: string;
  duplicateOverrideReason: string;

  notes: string;
};

export type AddStudentPrefill = Partial<StudentFormData>;

type AddStudentFormProps = {
  enquiryId?: string;
  enquiryNumber?: string;
  initialValues?: AddStudentPrefill;
  programmeDefinitions?: Array<{
    id: string;
    code: string;
    name: string;
    ageMinimumMonths: number | null;
    ageMaximumMonths: number | null;
    feeVersion: {
      id: string;
      monthlyFee: number;
      admissionFee: number;
      annualFee: number;
      kitFee: number;
      combineAnnualAndKit: boolean;
      monthlyGstApplicable: boolean;
      monthlyGstRate: number;
      monthlyPriceType: "GST_INCLUSIVE" | "GST_EXCLUSIVE";
      admissionGstApplicable: boolean;
      admissionGstRate: number;
      admissionPriceType: "GST_INCLUSIVE" | "GST_EXCLUSIVE";
      annualGstApplicable: boolean;
      annualGstRate: number;
      annualPriceType: "GST_INCLUSIVE" | "GST_EXCLUSIVE";
      kitGstApplicable: boolean;
      kitGstRate: number;
      kitPriceType: "GST_INCLUSIVE" | "GST_EXCLUSIVE";
    } | null;
  }>;
  daycarePlans?: Array<{
    id: string;
    name: string;
    description: string | null;
    billingType: string;
    hoursIncluded: number | null;
    recurring: boolean;
    maximumVisits: number | null;
    mealRule: string;
    amount: number;
    gstApplicable: boolean;
    gstRate: number;
    priceType: "GST_INCLUSIVE" | "GST_EXCLUSIVE";
  }>;
  mealCombinations?: Array<{
    id: string;
    name: string;
    description: string | null;
    amount: number;
    gstApplicable: boolean;
    gstRate: number;
    priceType: "GST_INCLUSIVE" | "GST_EXCLUSIVE";
  }>;
  otherCharges?: Array<{
    id: string;
    name: string;
    description: string | null;
    amount: number;
    gstApplicable: boolean;
    gstRate: number;
    priceType: "GST_INCLUSIVE" | "GST_EXCLUSIVE";
  }>;
  canOverridePrice?: boolean;
};

type ApiResponse = {
  success?: boolean;
  message?: string;
  student?: {
    id: string;
    studentNumber: string;
  };
  code?: string;
  possibleDuplicate?: {
    id: string;
    studentNumber: string;
    name: string;
    guardian: string | null;
    phone: string | null;
    programme: string | null;
    status: string;
    createdAt: string;
  };
};

const today = new Date().toISOString().split("T")[0];

function academicSessionForDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  const startYear = date.getMonth() >= 3 ? date.getFullYear() : date.getFullYear() - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function configuredTotal(input: {
  amount: number;
  gstApplicable: boolean;
  gstRate: number;
  priceType: "GST_INCLUSIVE" | "GST_EXCLUSIVE";
}) {
  if (!input.gstApplicable || input.gstRate <= 0 || input.priceType === "GST_INCLUSIVE") return input.amount;
  return Math.round(input.amount * (1 + input.gstRate / 100) * 100) / 100;
}

const initialFormData: StudentFormData = {
  firstName: "",
  middleName: "",
  lastName: "",
  preferredName: "",
  dateOfBirth: "",
  gender: "",
  programme: "PLAYGROUP",
  programmeDefinitionId: "",
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

  academicSession: academicSessionForDate(today),
  preschoolEnabled: true,
  daycarePlanIds: [],
  daycareEffectiveFrom: today,
  daycareEffectiveTo: "",
  scheduledWeekdays: [],
  mealCombinationId: "",
  includeAdmissionFee: true,
  includeAnnualFee: true,
  includeKitFee: true,
  annualKitSkipReason: "",
  otherChargeIds: [],
  approvedDiscount: "0",
  billingDay: "1",
  dueDay: "5",
  documentsComplete: false,
  duplicateOverrideStudentId: "",
  duplicateOverrideReason: "",

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
    title: "Services",
    description: "Preschool, daycare and meals",
    icon: Layers3,
  },
  {
    id: 6,
    title: "Charges",
    description: "Annual, kit and other fees",
    icon: IndianRupee,
  },
  {
    id: 7,
    title: "Review",
    description: "Contract and draft bill",
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

function legacyProgrammeForCode(code: string): Programme {
  if (
    code === "PLAYGROUP" ||
    code === "NURSERY" ||
    code === "JUNIOR_KG" ||
    code === "SENIOR_KG" ||
    code === "DAYCARE"
  ) {
    return code;
  }
  return code.includes("DAYCARE") ? "DAYCARE" : "NURSERY";
}

export default function AddStudentForm({
  enquiryId,
  enquiryNumber,
  initialValues,
  programmeDefinitions = [],
  daycarePlans = [],
  mealCombinations = [],
  otherCharges = [],
  canOverridePrice = false,
}: AddStudentFormProps) {
  const router = useRouter();

  const createStartingData = () => {
    const programme = initialValues?.programme ?? initialFormData.programme;
    const definition = programmeDefinitions.find(
      (item) => item.code === programme,
    ) ?? programmeDefinitions[0];
    return {
      ...initialFormData,
      ...initialValues,
      programme: definition ? legacyProgrammeForCode(definition.code) : programme,
      programmeDefinitionId:
        initialValues?.programmeDefinitionId ?? definition?.id ?? "",
      joiningDate:
        initialValues?.joiningDate ||
        new Date().toISOString().split("T")[0],
    };
  };

  const [formData, setFormData] =
    useState<StudentFormData>(createStartingData);

  const [currentStep, setCurrentStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");
  const [possibleDuplicate, setPossibleDuplicate] = useState<ApiResponse["possibleDuplicate"]>(undefined);

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

  const selectedProgrammeName =
    programmeDefinitions.find(
      (programme) => programme.id === formData.programmeDefinitionId,
    )?.name ?? programmeLabel(formData.programme);

  const selectedProgramme = programmeDefinitions.find(
    (programme) => programme.id === formData.programmeDefinitionId,
  );
  const selectedDaycarePlans = daycarePlans.filter((plan) => formData.daycarePlanIds.includes(plan.id));
  const selectedMeal = mealCombinations.find((meal) => meal.id === formData.mealCombinationId) ?? null;
  const selectedOtherCharges = otherCharges.filter((charge) => formData.otherChargeIds.includes(charge.id));
  const firstBillPreview = useMemo(() => {
    const fee = formData.preschoolEnabled ? selectedProgramme?.feeVersion : null;
    const rows: Array<{ label: string; total: number; recurring: boolean }> = [];
    if (fee) {
      if (fee.monthlyFee > 0) rows.push({ label: `${selectedProgramme?.name ?? "Preschool"} monthly fee`, total: configuredTotal({ amount: fee.monthlyFee, gstApplicable: fee.monthlyGstApplicable, gstRate: fee.monthlyGstRate, priceType: fee.monthlyPriceType }), recurring: true });
      if (formData.includeAdmissionFee && fee.admissionFee > 0) rows.push({ label: "Admission fee", total: configuredTotal({ amount: fee.admissionFee, gstApplicable: fee.admissionGstApplicable, gstRate: fee.admissionGstRate, priceType: fee.admissionPriceType }), recurring: false });
      if (formData.includeAnnualFee && fee.annualFee > 0) rows.push({ label: "Annual fee", total: configuredTotal({ amount: fee.annualFee, gstApplicable: fee.annualGstApplicable, gstRate: fee.annualGstRate, priceType: fee.annualPriceType }), recurring: false });
      if (formData.includeKitFee && fee.kitFee > 0) rows.push({ label: "Kit fee", total: configuredTotal({ amount: fee.kitFee, gstApplicable: fee.kitGstApplicable, gstRate: fee.kitGstRate, priceType: fee.kitPriceType }), recurring: false });
    }
    for (const plan of selectedDaycarePlans) rows.push({ label: plan.name, total: configuredTotal(plan), recurring: plan.recurring });
    if (selectedMeal) rows.push({ label: selectedMeal.name, total: configuredTotal(selectedMeal), recurring: true });
    for (const charge of selectedOtherCharges) rows.push({ label: charge.name, total: configuredTotal(charge), recurring: false });
    const recurring = rows.filter((row) => row.recurring).reduce((sum, row) => sum + row.total, 0);
    const gross = rows.reduce((sum, row) => sum + row.total, 0);
    const discount = canOverridePrice ? Math.min(Math.max(0, Number(formData.approvedDiscount) || 0), gross) : 0;
    return { rows, recurring, gross, discount, total: gross - discount };
  }, [canOverridePrice, formData, selectedDaycarePlans, selectedMeal, selectedOtherCharges, selectedProgramme]);

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
    if (field === "firstName" || field === "lastName" || field === "dateOfBirth" || field === "guardianPhone") {
      setPossibleDuplicate(undefined);
    }
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
      programmeDefinitionId:
        age
          ? programmeDefinitions.find((programme) =>
              (programme.ageMinimumMonths == null || age.totalMonths >= programme.ageMinimumMonths) &&
              (programme.ageMaximumMonths == null || age.totalMonths <= programme.ageMaximumMonths),
            )?.id ?? current.programmeDefinitionId
          : current.programmeDefinitionId,
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

    if (step === 5) {
      if (!formData.preschoolEnabled && formData.daycarePlanIds.length === 0) {
        return "Enable preschool or select at least one daycare plan.";
      }
      if (formData.preschoolEnabled && (!formData.programmeDefinitionId || !selectedProgramme?.feeVersion)) {
        return "Select a preschool programme with an active fee version.";
      }
      if (formData.daycarePlanIds.length > 0 && !formData.daycareEffectiveFrom) {
        return "Enter the daycare plan start date.";
      }
    }

    if (step === 6) {
      const fee = selectedProgramme?.feeVersion;
      if (
        formData.preschoolEnabled &&
        Boolean(fee?.annualFee || fee?.kitFee) &&
        !formData.includeAnnualFee &&
        !formData.includeKitFee &&
        formData.annualKitSkipReason.trim().length < 5
      ) {
        return "Enter why the annual/kit charge is being skipped.";
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
    setFormData(createStartingData());

    setCurrentStep(1);
    setError("");
    setSuccessMessage("");
    setPossibleDuplicate(undefined);
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const childValidation = validateStep(1);
    const guardianValidation = validateStep(2);
    const addressValidation = validateStep(4);
    const servicesValidation = validateStep(5);
    const chargesValidation = validateStep(6);

    const validationMessage =
      childValidation ||
      guardianValidation ||
      addressValidation ||
      servicesValidation ||
      chargesValidation;

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
          body: JSON.stringify({
            ...formData,
            enquiryId: enquiryId || undefined,
            documentsComplete: formData.documentsComplete,
            duplicateOverrideStudentId: formData.duplicateOverrideStudentId || undefined,
            duplicateOverrideReason: formData.duplicateOverrideReason || undefined,
            contract: {
              academicSession: formData.academicSession,
              preschoolEnabled: formData.preschoolEnabled,
              preschoolProgrammeId: formData.preschoolEnabled ? formData.programmeDefinitionId : null,
              daycareSelections: formData.daycarePlanIds.map((planDefinitionId) => ({
                planDefinitionId,
                effectiveFrom: formData.daycareEffectiveFrom,
                effectiveTo: formData.daycareEffectiveTo || null,
                scheduledWeekdays: formData.scheduledWeekdays,
              })),
              mealCombinationId: formData.mealCombinationId || null,
              includeAdmissionFee: formData.includeAdmissionFee,
              includeAnnualFee: formData.includeAnnualFee,
              includeKitFee: formData.includeKitFee,
              annualKitSkipReason: formData.annualKitSkipReason || null,
              otherChargeIds: formData.otherChargeIds,
              approvedDiscount: canOverridePrice ? Number(formData.approvedDiscount) || 0 : 0,
              billingDay: Number(formData.billingDay),
              dueDay: Number(formData.dueDay),
            },
          }),
        },
      );

      const result =
        (await response.json()) as ApiResponse;

      if (!response.ok || !result.success) {
        if (response.status === 409 && result.code === "POSSIBLE_DUPLICATE_STUDENT" && result.possibleDuplicate) {
          setPossibleDuplicate(result.possibleDuplicate);
          setCurrentStep(7);
          setError(result.message ?? "Possible existing student found.");
          return;
        }
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

      if (enquiryId && result.student?.id) {
        router.push(`/admin/students/${result.student.id}`);
        router.refresh();
      } else {
        setFormData(createStartingData());
        setCurrentStep(1);
        router.refresh();
      }
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
            {enquiryNumber ? (
              <p className="mb-1 text-[10px] font-black uppercase tracking-[0.12em] text-[#7A459C]">
                Creating from enquiry {enquiryNumber}
              </p>
            ) : null}
            <h2 className="text-xl font-black text-[#2D1736] sm:text-2xl">
              {enquiryId
                ? "Complete Student Profile"
                : "Add New Student"}
            </h2>

            <p className="mt-1 text-sm font-semibold leading-6 text-[#817684]">
              {enquiryId
                ? "The parent enquiry is linked. Complete the child contract and create one combined draft bill."
                : "Complete the child and service contract once. CentreOS will create the student, ledger and combined draft bill together."}
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
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
                  value={formData.programmeDefinitionId || formData.programme}
                  disabled={submitting}
                  onChange={(event) => {
                    const definition = programmeDefinitions.find(
                      (programme) => programme.id === event.target.value,
                    );
                    if (definition) {
                      setFormData((current) => ({
                        ...current,
                        programmeDefinitionId: definition.id,
                        programme: legacyProgrammeForCode(definition.code),
                      }));
                    } else {
                      setFormData((current) => ({
                        ...current,
                        programmeDefinitionId: "",
                        programme: event.target.value as Programme,
                      }));
                    }
                    setError("");
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
              icon={Layers3}
              title="Enrollment services"
              description="Choose every service now so CentreOS creates one child contract and one combined bill."
            />

            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[24px] border border-[#E4D9E9] bg-[#FAF8FC] p-5">
                <label className="flex items-center gap-3 text-sm font-black text-[#2D1736]">
                  <input type="checkbox" checked={formData.preschoolEnabled} disabled={submitting} onChange={(event) => updateField("preschoolEnabled", event.target.checked)} className="h-5 w-5 accent-[#5B2A86]" />
                  Preschool service
                </label>
                <p className="mt-2 text-xs font-semibold leading-5 text-[#817684]">
                  {formData.preschoolEnabled
                    ? `${selectedProgrammeName} · ${formatMoney(selectedProgramme?.feeVersion?.monthlyFee ?? 0)} monthly`
                    : "The child will be treated as daycare-only and excluded from preschool attendance."}
                </p>
                <label className="mt-4 block">
                  <span className="text-sm font-black text-[#35243E]">Academic session *</span>
                  <input value={formData.academicSession} disabled={submitting} onChange={(event) => updateField("academicSession", event.target.value)} placeholder="2026-27" className={inputClassName} />
                </label>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <InputField label="Billing day" type="number" value={formData.billingDay} disabled={submitting} onChange={(value) => updateField("billingDay", value)} />
                  <InputField label="Due day" type="number" value={formData.dueDay} disabled={submitting} onChange={(value) => updateField("dueDay", value)} />
                </div>
              </div>

              <div className="rounded-[24px] border border-[#E4D9E9] bg-white p-5">
                <p className="text-sm font-black text-[#2D1736]">Daycare plans</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">Select one or more configured plans. Historical prices are snapshotted.</p>
                <div className="mt-4 space-y-3">
                  {daycarePlans.length ? daycarePlans.map((plan) => {
                    const checked = formData.daycarePlanIds.includes(plan.id);
                    return (
                      <label key={plan.id} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E6DDEB] p-4">
                        <input type="checkbox" checked={checked} disabled={submitting} onChange={(event) => updateField("daycarePlanIds", event.target.checked ? [...formData.daycarePlanIds, plan.id] : formData.daycarePlanIds.filter((id) => id !== plan.id))} className="mt-0.5 h-5 w-5 accent-[#5B2A86]" />
                        <span className="min-w-0">
                          <span className="block text-sm font-black text-[#2D1736]">{plan.name}</span>
                          <span className="mt-1 block text-xs font-semibold text-[#817684]">{plan.billingType} · {plan.hoursIncluded ? `${plan.hoursIncluded} hours · ` : ""}{formatMoney(configuredTotal(plan))}{plan.recurring ? " monthly" : ""}</span>
                        </span>
                      </label>
                    );
                  }) : <p className="rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">No active daycare plan with a price is available in Billing Catalogue.</p>}
                </div>
              </div>

              {formData.daycarePlanIds.length > 0 ? (
                <div className="rounded-[24px] border border-[#E4D9E9] bg-white p-5 lg:col-span-2">
                  <div className="grid gap-4 md:grid-cols-3">
                    <InputField label="Daycare start date *" type="date" value={formData.daycareEffectiveFrom} disabled={submitting} onChange={(value) => updateField("daycareEffectiveFrom", value)} />
                    <InputField label="Temporary end date" type="date" value={formData.daycareEffectiveTo} disabled={submitting} onChange={(value) => updateField("daycareEffectiveTo", value)} />
                    <label className="block">
                      <span className="text-sm font-black text-[#35243E]">Meal plan</span>
                      <select value={formData.mealCombinationId} disabled={submitting} onChange={(event) => updateField("mealCombinationId", event.target.value)} className={inputClassName}>
                        <option value="">No paid meal plan</option>
                        {mealCombinations.map((meal) => <option key={meal.id} value={meal.id}>{meal.name} · {formatMoney(configuredTotal(meal))}</option>)}
                      </select>
                    </label>
                  </div>
                  <div className="mt-5">
                    <p className="text-sm font-black text-[#35243E]">Contract weekdays (for weekly/custom plans)</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label, day) => {
                        const active = formData.scheduledWeekdays.includes(day);
                        return <button key={label} type="button" disabled={submitting} onClick={() => updateField("scheduledWeekdays", active ? formData.scheduledWeekdays.filter((item) => item !== day) : [...formData.scheduledWeekdays, day].sort())} className={`min-h-10 rounded-xl border px-4 text-xs font-black ${active ? "border-[#5B2A86] bg-[#5B2A86] text-white" : "border-[#DCCFE4] bg-white text-[#5B2A86]"}`}>{label}</button>;
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {currentStep === 6 ? (
          <section>
            <SectionTitle
              icon={IndianRupee}
              title="Admission charges and approval"
              description="Choose one-time items and review the exact financial impact before saving."
            />
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="rounded-[24px] border border-[#E4D9E9] bg-[#FAF8FC] p-5">
                <p className="text-sm font-black text-[#2D1736]">Programme charges</p>
                {([[
                  "includeAdmissionFee", "Admission fee", selectedProgramme?.feeVersion?.admissionFee ?? 0,
                ], [
                  "includeAnnualFee", "Annual fee", selectedProgramme?.feeVersion?.annualFee ?? 0,
                ], [
                  "includeKitFee", "Kit fee", selectedProgramme?.feeVersion?.kitFee ?? 0,
                ]] as const).map(([field, label, amount]) => (
                  <label key={field} className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-[#E6DDEB] bg-white p-4">
                    <span className="flex items-center gap-3 text-sm font-black text-[#2D1736]"><input type="checkbox" checked={formData[field]} disabled={submitting || !formData.preschoolEnabled || amount <= 0} onChange={(event) => updateField(field, event.target.checked)} className="h-5 w-5 accent-[#5B2A86]" />{label}</span>
                    <span className="text-sm font-black text-[#5B2A86]">{formatMoney(amount)}</span>
                  </label>
                ))}
                {!formData.includeAnnualFee && !formData.includeKitFee && formData.preschoolEnabled ? (
                  <label className="mt-4 block"><span className="text-sm font-black text-[#35243E]">Reason for skipping Annual / Kit *</span><textarea value={formData.annualKitSkipReason} disabled={submitting} rows={3} onChange={(event) => updateField("annualKitSkipReason", event.target.value)} placeholder="Already purchased, transfer case, approved waiver…" className={textareaClassName} /></label>
                ) : null}
              </div>

              <div className="rounded-[24px] border border-[#E4D9E9] bg-white p-5">
                <p className="text-sm font-black text-[#2D1736]">Other one-time charges</p>
                <div className="mt-3 space-y-3">
                  {otherCharges.length ? otherCharges.map((charge) => {
                    const checked = formData.otherChargeIds.includes(charge.id);
                    return <label key={charge.id} className="flex items-center justify-between gap-3 rounded-2xl border border-[#E6DDEB] p-4"><span className="flex items-center gap-3 text-sm font-black text-[#2D1736]"><input type="checkbox" checked={checked} disabled={submitting} onChange={(event) => updateField("otherChargeIds", event.target.checked ? [...formData.otherChargeIds, charge.id] : formData.otherChargeIds.filter((id) => id !== charge.id))} className="h-5 w-5 accent-[#5B2A86]" />{charge.name}</span><span className="text-sm font-black text-[#5B2A86]">{formatMoney(configuredTotal(charge))}</span></label>;
                  }) : <p className="text-sm font-semibold text-[#817684]">No active optional charges.</p>}
                </div>
                {canOverridePrice ? <InputField label="Owner-approved bill discount" type="number" value={formData.approvedDiscount} disabled={submitting} onChange={(value) => updateField("approvedDiscount", value)} /> : null}
                <label className="mt-5 flex items-start gap-3 rounded-2xl bg-[#F3EAF8] p-4 text-sm font-black text-[#2D1736]"><input type="checkbox" checked={formData.documentsComplete} disabled={submitting} onChange={(event) => updateField("documentsComplete", event.target.checked)} className="mt-0.5 h-5 w-5 accent-[#5B2A86]" /><span>Documents and admission checks are complete.<span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">If left unchecked, the contract and bill stay draft and the enquiry is not marked admitted.</span></span></label>
              </div>
            </div>
          </section>
        ) : null}

        {currentStep === 7 ? (
          <section>
            <SectionTitle
              icon={ShieldCheck}
              title="Review contract and first bill"
              description="One save creates the student, contract, service lines and this combined draft bill atomically."
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
                    selectedProgrammeName,
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

              <ReviewCard
                title="Active services"
                rows={[
                  ["Preschool", formData.preschoolEnabled ? selectedProgrammeName : "Not selected"],
                  ["Daycare", selectedDaycarePlans.length ? selectedDaycarePlans.map((plan) => plan.name).join(", ") : "Not selected"],
                  ["Meals", selectedMeal?.name ?? "Not selected"],
                  ["Academic session", formData.academicSession],
                  ["Admission status", formData.documentsComplete ? "Ready to confirm" : "Documents pending"],
                ]}
              />

              <ReviewCard
                title="Combined bill preview"
                rows={[
                  ...firstBillPreview.rows.map((row) => [row.recurring ? `${row.label} · recurring` : `${row.label} · one-time`, formatMoney(row.total)] as [string, string]),
                  ["Recurring monthly value", formatMoney(firstBillPreview.recurring)],
                  ["Approved discount", formatMoney(firstBillPreview.discount)],
                  ["First draft bill total", formatMoney(firstBillPreview.total)],
                ]}
              />
            </div>

            {possibleDuplicate ? (
              <div className="mt-6 rounded-[24px] border border-amber-300 bg-amber-50 p-5">
                <h3 className="text-lg font-black text-amber-950">Possible existing student found</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-amber-900">{possibleDuplicate.name} · {possibleDuplicate.studentNumber} · {possibleDuplicate.programme ?? "Programme not set"} · {possibleDuplicate.guardian ?? "Guardian"} · {possibleDuplicate.phone ?? "No phone"}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button type="button" onClick={() => router.push(`/admin/students/${possibleDuplicate.id}`)} className="min-h-11 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white">Open existing student</button>
                  <button type="button" onClick={() => updateField("duplicateOverrideStudentId", possibleDuplicate.id)} className="min-h-11 rounded-2xl border border-amber-400 bg-white px-5 text-sm font-black text-amber-900">Continue as sibling / twin</button>
                </div>
                {formData.duplicateOverrideStudentId === possibleDuplicate.id ? <label className="mt-4 block"><span className="text-sm font-black text-amber-950">Required reason</span><textarea value={formData.duplicateOverrideReason} disabled={submitting} rows={3} onChange={(event) => updateField("duplicateOverrideReason", event.target.value)} placeholder="For example: twin sibling with the same guardian details" className={textareaClassName} /></label> : null}
              </div>
            ) : null}
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
                Saving contract…
              </>
            ) : (
              <>
                <Save
                  aria-hidden="true"
                  size={18}
                />
                Save & Generate Draft Bill
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
