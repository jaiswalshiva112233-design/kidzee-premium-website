"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Phone,
  UserRound,
} from "lucide-react";

import { site } from "@/lib/site";

interface AdmissionFormData {
  parentName: string;
  childName: string;
  phone: string;
  programme: string;
  preferredDate: string;
  message: string;
}

const initialFormData: AdmissionFormData = {
  parentName: "",
  childName: "",
  phone: "",
  programme: "",
  preferredDate: "",
  message: "",
};

const programmeOptions = [
  {
    value: "Playgroup",
    label: "Playgroup — 2–3 years",
  },
  {
    value: "Nursery",
    label: "Nursery — 3–4 years",
  },
  {
    value: "Junior KG",
    label: "Junior KG — 4–5 years",
  },
  {
    value: "Senior KG",
    label: "Senior KG — 5–6 years",
  },
  {
    value: "Daycare",
    label: "Daycare",
  },
];

export default function AdmissionForm() {
  const [formData, setFormData] =
    useState<AdmissionFormData>(initialFormData);

  const [errors, setErrors] = useState<
    Partial<Record<keyof AdmissionFormData, string>>
  >({});

  const [submitted, setSubmitted] = useState(false);

  function updateField(
    field: keyof AdmissionFormData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: "",
    }));

    setSubmitted(false);
  }

  function validateForm() {
    const nextErrors: Partial<
      Record<keyof AdmissionFormData, string>
    > = {};

    if (!formData.parentName.trim()) {
      nextErrors.parentName = "Please enter the parent’s name.";
    }

    if (!formData.childName.trim()) {
      nextErrors.childName = "Please enter the child’s name.";
    }

    const cleanedPhone = formData.phone.replace(/\D/g, "");

    if (!cleanedPhone) {
      nextErrors.phone = "Please enter a mobile number.";
    } else if (cleanedPhone.length !== 10) {
      nextErrors.phone = "Please enter a valid 10-digit mobile number.";
    }

    if (!formData.programme) {
      nextErrors.programme = "Please select a programme.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const enquiryMessage = [
      "Hello Kidzee Sector 12, Dwarka,",
      "",
      "I would like to enquire about admission.",
      "",
      `Parent's name: ${formData.parentName.trim()}`,
      `Child's name: ${formData.childName.trim()}`,
      `Mobile number: ${formData.phone.trim()}`,
      `Programme: ${formData.programme}`,
      formData.preferredDate
        ? `Preferred visit date: ${formData.preferredDate}`
        : "",
      formData.message.trim()
        ? `Message: ${formData.message.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const whatsappNumber = site.phone.replace(/\D/g, "");

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
      enquiryMessage
    )}`;

    setSubmitted(true);
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="overflow-hidden rounded-[32px] border border-[#E8DDF1] bg-white shadow-[0_24px_80px_rgba(52,20,68,0.12)]">
      <div className="border-b border-[#EEE6F3] bg-[#F9F5FC] px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5B2A86] text-white">
            <UserRound aria-hidden="true" size={22} />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#5B2A86]">
              Admission enquiry
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-[-0.025em] text-[#2C1735] sm:text-3xl">
              Tell us a little about your child
            </h2>

            <p className="mt-2 text-sm leading-6 text-[#5F5F6D] sm:text-base">
              Submit the form to continue your enquiry with our admissions
              team on WhatsApp.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-6 px-6 py-7 sm:px-8 sm:py-8"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="parentName"
            label="Parent’s name"
            required
            error={errors.parentName}
          >
            <input
              id="parentName"
              name="parentName"
              type="text"
              autoComplete="name"
              value={formData.parentName}
              onChange={(event) =>
                updateField("parentName", event.target.value)
              }
              placeholder="Enter your name"
              aria-invalid={Boolean(errors.parentName)}
              aria-describedby={
                errors.parentName ? "parentName-error" : undefined
              }
              className={inputClasses(Boolean(errors.parentName))}
            />
          </FormField>

          <FormField
            id="childName"
            label="Child’s name"
            required
            error={errors.childName}
          >
            <input
              id="childName"
              name="childName"
              type="text"
              autoComplete="off"
              value={formData.childName}
              onChange={(event) =>
                updateField("childName", event.target.value)
              }
              placeholder="Enter child’s name"
              aria-invalid={Boolean(errors.childName)}
              aria-describedby={
                errors.childName ? "childName-error" : undefined
              }
              className={inputClasses(Boolean(errors.childName))}
            />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            id="phone"
            label="Mobile number"
            required
            error={errors.phone}
          >
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={10}
              value={formData.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value.replace(/\D/g, "").slice(0, 10)
                )
              }
              placeholder="10-digit mobile number"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={
                errors.phone ? "phone-error" : undefined
              }
              className={inputClasses(Boolean(errors.phone))}
            />
          </FormField>

          <FormField
            id="programme"
            label="Programme"
            required
            error={errors.programme}
          >
            <select
              id="programme"
              name="programme"
              value={formData.programme}
              onChange={(event) =>
                updateField("programme", event.target.value)
              }
              aria-invalid={Boolean(errors.programme)}
              aria-describedby={
                errors.programme ? "programme-error" : undefined
              }
              className={inputClasses(Boolean(errors.programme))}
            >
              <option value="">Select a programme</option>

              {programmeOptions.map((programme) => (
                <option
                  key={programme.value}
                  value={programme.value}
                >
                  {programme.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField
          id="preferredDate"
          label="Preferred school-visit date"
        >
          <div className="relative">
            <CalendarDays
              aria-hidden="true"
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6F80]"
            />

            <input
              id="preferredDate"
              name="preferredDate"
              type="date"
              value={formData.preferredDate}
              onChange={(event) =>
                updateField("preferredDate", event.target.value)
              }
              className={`${inputClasses(false)} pl-11`}
            />
          </div>
        </FormField>

        <FormField
          id="message"
          label="Anything you would like us to know?"
        >
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={(event) =>
              updateField("message", event.target.value)
            }
            placeholder="Share your questions, preferred timing or daycare requirement"
            className={`${inputClasses(false)} min-h-[120px] resize-y`}
          />
        </FormField>

        <div className="rounded-[22px] border border-[#EEE4F3] bg-[#FCFAFD] p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-[#5B2A86]"
            />

            <p className="text-sm leading-6 text-[#5F5F6D]">
              You can also ask our team about the 3-day trial, preschool
              timings, daycare till 7 PM and transport availability.
            </p>
          </div>
        </div>

        {submitted && (
          <div
            role="status"
            className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
          >
            Your enquiry has been prepared. Please send the message in
            WhatsApp to complete it.
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            className="inline-flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-7 text-base font-black text-white shadow-[0_14px_34px_rgba(91,42,134,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4A2070] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/70 focus-visible:ring-offset-2"
          >
            Continue on WhatsApp
            <ArrowRight aria-hidden="true" size={19} />
          </button>

          <a
            href={`tel:${site.phone}`}
            className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full border border-[#E0D1E8] bg-white px-6 text-base font-black text-[#5B2A86] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8F3FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/70 focus-visible:ring-offset-2"
          >
            <Phone aria-hidden="true" size={18} />
            Call {site.phoneDisplay}
          </a>
        </div>

        <p className="text-center text-xs leading-5 text-[#77707C]">
          By submitting this form, you agree to be contacted regarding your
          admission enquiry.
        </p>
      </form>
    </div>
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

function FormField({
  id,
  label,
  required = false,
  error,
  children,
}: FormFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-black text-[#35223E]"
      >
        {label}

        {required && (
          <span
            aria-hidden="true"
            className="ml-1 text-[#8A2D5E]"
          >
            *
          </span>
        )}
      </label>

      {children}

      {error && (
        <p
          id={`${id}-error`}
          className="mt-2 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function inputClasses(hasError: boolean) {
  return [
    "w-full rounded-2xl border bg-white px-4 py-3.5",
    "text-base text-[#2C1735] outline-none",
    "placeholder:text-[#9A929E]",
    "transition duration-200",
    "focus:ring-4 focus:ring-[#F6C84B]/30",
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-[#DFD5E5] focus:border-[#5B2A86]",
  ].join(" ");
}