"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Phone,
} from "lucide-react";

import { useSiteContact } from "@/components/SiteContactProvider";

interface ContactFormData {
  parentName: string;
  phone: string;
  childName: string;
  childAge: string;
  programme: string;
  message: string;
}

const initialFormData: ContactFormData = {
  parentName: "",
  phone: "",
  childName: "",
  childAge: "",
  programme: "Playgroup",
  message: "",
};

const programmeOptions = [
  "Playgroup",
  "Nursery",
  "Junior KG",
  "Senior KG",
  "Daycare",
  "3-Day Trial",
];

export default function ContactForm() {
  const site = useSiteContact();
  const [formData, setFormData] =
    useState<ContactFormData>(initialFormData);

  const [errors, setErrors] = useState<
    Partial<Record<keyof ContactFormData, string>>
  >({});

  const [submitted, setSubmitted] = useState(false);

  function updateField(
    field: keyof ContactFormData,
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
      Record<keyof ContactFormData, string>
    > = {};

    if (!formData.parentName.trim()) {
      nextErrors.parentName = "Please enter the parent’s name.";
    }

    const cleanedPhone = formData.phone.replace(/\D/g, "");

    if (!cleanedPhone) {
      nextErrors.phone = "Please enter a mobile number.";
    } else if (cleanedPhone.length !== 10) {
      nextErrors.phone = "Please enter a valid 10-digit mobile number.";
    }

    if (!formData.childName.trim()) {
      nextErrors.childName = "Please enter the child’s name.";
    }

    if (!formData.childAge.trim()) {
      nextErrors.childAge = "Please enter the child’s age.";
    }

    if (!formData.programme) {
      nextErrors.programme = "Please select an option.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const message = [
      "Hello Kidzee Sector 12, Dwarka,",
      "",
      "I would like to enquire about admissions.",
      "",
      `Parent's name: ${formData.parentName.trim()}`,
      `Phone number: ${formData.phone.trim()}`,
      `Child's name: ${formData.childName.trim()}`,
      `Child's age: ${formData.childAge.trim()}`,
      `Interested in: ${formData.programme}`,
      formData.message.trim()
        ? `Message: ${formData.message.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    const phoneNumber = site.phone.replace(/\D/g, "");

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
      message
    )}`;

    setSubmitted(true);

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-[32px] border border-[#E8DDF1] bg-white p-6 shadow-[0_24px_70px_rgba(52,20,68,0.1)] sm:p-8"
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
              errors.parentName
                ? "parentName-error"
                : undefined
            }
            className={inputClasses(Boolean(errors.parentName))}
          />
        </FormField>

        <FormField
          id="phone"
          label="Phone number"
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
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10)
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
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
            value={formData.childName}
            onChange={(event) =>
              updateField("childName", event.target.value)
            }
            placeholder="Enter child’s name"
            aria-invalid={Boolean(errors.childName)}
            aria-describedby={
              errors.childName
                ? "childName-error"
                : undefined
            }
            className={inputClasses(Boolean(errors.childName))}
          />
        </FormField>

        <FormField
          id="childAge"
          label="Child’s age"
          required
          error={errors.childAge}
        >
          <input
            id="childAge"
            name="childAge"
            type="text"
            inputMode="decimal"
            value={formData.childAge}
            onChange={(event) =>
              updateField("childAge", event.target.value)
            }
            placeholder="For example, 3 years"
            aria-invalid={Boolean(errors.childAge)}
            aria-describedby={
              errors.childAge
                ? "childAge-error"
                : undefined
            }
            className={inputClasses(Boolean(errors.childAge))}
          />
        </FormField>
      </div>

      <div className="mt-5">
        <FormField
          id="programme"
          label="Interested in"
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
              errors.programme
                ? "programme-error"
                : undefined
            }
            className={inputClasses(Boolean(errors.programme))}
          >
            {programmeOptions.map((programme) => (
              <option key={programme} value={programme}>
                {programme}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="mt-5">
        <FormField
          id="message"
          label="How can we help?"
        >
          <textarea
            id="message"
            name="message"
            rows={4}
            value={formData.message}
            onChange={(event) =>
              updateField("message", event.target.value)
            }
            placeholder="Share your preferred visit timing, daycare requirement or any questions"
            className={`${inputClasses(false)} min-h-[120px] resize-y`}
          />
        </FormField>
      </div>

      <div className="mt-6 rounded-[22px] border border-[#EEE4F3] bg-[#FCFAFD] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2
            aria-hidden="true"
            size={20}
            className="mt-0.5 shrink-0 text-[#5B2A86]"
          />

          <p className="text-sm leading-6 text-[#5F5F6D]">
            You can ask our team about programme suitability, the 3-day
            trial, daycare till 7 PM and preschool cab availability on selected
            routes. Daycare cab service is not available.
          </p>
        </div>
      </div>

      {submitted && (
        <div
          role="status"
          className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-semibold text-green-800"
        >
          WhatsApp has opened with your enquiry details. Review the message
          and tap send to complete your enquiry.
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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

      <p className="mt-4 text-center text-xs leading-5 text-[#77707C]">
        By submitting this form, you agree to be contacted regarding your
        admission enquiry.
      </p>
    </form>
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
