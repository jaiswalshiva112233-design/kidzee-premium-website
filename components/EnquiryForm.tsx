"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { site } from "@/lib/site";

interface EnquiryFormData {
  parentName: string;
  phone: string;
  childName: string;
  childAge: string;
  programme: string;
  enquiryType: string;
  message: string;
}

type FormErrors = Partial<
  Record<keyof EnquiryFormData, string>
>;

const initialFormData: EnquiryFormData = {
  parentName: "",
  phone: "",
  childName: "",
  childAge: "",
  programme: "",
  enquiryType: "Admission enquiry",
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
  {
    value: "Preschool with Daycare",
    label: "Preschool with Daycare",
  },
  {
    value: "Not sure",
    label: "Not sure — please guide me",
  },
];

const enquiryOptions = [
  "Admission enquiry",
  "Book a school visit",
  "3-day trial",
  "Daycare enquiry",
  "Transport enquiry",
  "Fee enquiry",
];

const enquiryHighlights = [
  {
    icon: Clock3,
    title: "Quick response",
    description:
      "Our admissions team will help you with the next steps.",
  },
  {
    icon: Sparkles,
    title: "3-day trial",
    description:
      "Ask whether a trial is suitable for your child.",
  },
  {
    icon: ShieldCheck,
    title: "No online payment",
    description:
      "This form only prepares your WhatsApp enquiry.",
  },
];

function createWhatsAppLink(message: string) {
  const phoneNumber = site.phone.replace(/\D/g, "");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(
    message
  )}`;
}

export default function EnquiryForm() {
  const [formData, setFormData] =
    useState<EnquiryFormData>(initialFormData);

  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function updateField(
    field: keyof EnquiryFormData,
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
    const nextErrors: FormErrors = {};

    if (!formData.parentName.trim()) {
      nextErrors.parentName =
        "Please enter the parent’s name.";
    }

    const cleanedPhone = formData.phone.replace(/\D/g, "");

    if (!cleanedPhone) {
      nextErrors.phone =
        "Please enter a mobile number.";
    } else if (cleanedPhone.length !== 10) {
      nextErrors.phone =
        "Please enter a valid 10-digit mobile number.";
    }

    if (!formData.childName.trim()) {
      nextErrors.childName =
        "Please enter the child’s name.";
    }

    if (!formData.childAge.trim()) {
      nextErrors.childAge =
        "Please enter the child’s age.";
    }

    if (!formData.programme) {
      nextErrors.programme =
        "Please select a programme.";
    }

    if (!formData.enquiryType) {
      nextErrors.enquiryType =
        "Please select an enquiry type.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    const message = [
      "Hello Kidzee Sector 12, Dwarka,",
      "",
      `I would like to make an enquiry about: ${formData.enquiryType}`,
      "",
      `Parent's name: ${formData.parentName.trim()}`,
      `Phone number: ${formData.phone.trim()}`,
      `Child's name: ${formData.childName.trim()}`,
      `Child's age: ${formData.childAge.trim()}`,
      `Programme: ${formData.programme}`,
      formData.message.trim()
        ? `Additional message: ${formData.message.trim()}`
        : "",
    ]
      .filter(Boolean)
      .join("\n");

    setSubmitted(true);

    window.open(
      createWhatsAppLink(message),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <div className="overflow-hidden rounded-[34px] border border-[#E8DDF1] bg-white shadow-[0_26px_75px_rgba(52,20,68,0.11)]">
      <div className="border-b border-[#EADFF0] bg-[#F8F3FC] px-6 py-7 sm:px-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#5B2A86] text-white shadow-[0_10px_25px_rgba(91,42,134,0.22)]">
            <MessageCircle
              aria-hidden="true"
              size={22}
            />
          </div>

          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5B2A86]">
              Admission enquiry
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-[-0.02em] text-[#2C1735] sm:text-3xl">
              Tell us how we can help
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5F5F6D]">
              Share a few details and WhatsApp will open with
              your enquiry ready to review and send.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="p-6 sm:p-8"
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
                updateField(
                  "parentName",
                  event.target.value
                )
              }
              placeholder="Enter your name"
              aria-invalid={Boolean(errors.parentName)}
              aria-describedby={
                errors.parentName
                  ? "parentName-error"
                  : undefined
              }
              className={inputClasses(
                Boolean(errors.parentName)
              )}
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
                errors.phone
                  ? "phone-error"
                  : undefined
              }
              className={inputClasses(
                Boolean(errors.phone)
              )}
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
                updateField(
                  "childName",
                  event.target.value
                )
              }
              placeholder="Enter child’s name"
              aria-invalid={Boolean(errors.childName)}
              aria-describedby={
                errors.childName
                  ? "childName-error"
                  : undefined
              }
              className={inputClasses(
                Boolean(errors.childName)
              )}
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
                updateField(
                  "childAge",
                  event.target.value
                )
              }
              placeholder="For example, 3 years"
              aria-invalid={Boolean(errors.childAge)}
              aria-describedby={
                errors.childAge
                  ? "childAge-error"
                  : undefined
              }
              className={inputClasses(
                Boolean(errors.childAge)
              )}
            />
          </FormField>
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
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
                updateField(
                  "programme",
                  event.target.value
                )
              }
              aria-invalid={Boolean(errors.programme)}
              aria-describedby={
                errors.programme
                  ? "programme-error"
                  : undefined
              }
              className={inputClasses(
                Boolean(errors.programme)
              )}
            >
              <option value="">
                Select a programme
              </option>

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

          <FormField
            id="enquiryType"
            label="Enquiry about"
            required
            error={errors.enquiryType}
          >
            <select
              id="enquiryType"
              name="enquiryType"
              value={formData.enquiryType}
              onChange={(event) =>
                updateField(
                  "enquiryType",
                  event.target.value
                )
              }
              aria-invalid={Boolean(
                errors.enquiryType
              )}
              aria-describedby={
                errors.enquiryType
                  ? "enquiryType-error"
                  : undefined
              }
              className={inputClasses(
                Boolean(errors.enquiryType)
              )}
            >
              {enquiryOptions.map((option) => (
                <option
                  key={option}
                  value={option}
                >
                  {option}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="mt-5">
          <FormField
            id="message"
            label="Additional message"
          >
            <textarea
              id="message"
              name="message"
              rows={4}
              value={formData.message}
              onChange={(event) =>
                updateField(
                  "message",
                  event.target.value
                )
              }
              placeholder="Share your preferred visit time, daycare requirement or any questions"
              className={`${inputClasses(
                false
              )} min-h-[120px] resize-y`}
            />
          </FormField>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {enquiryHighlights.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="rounded-[20px] border border-[#EEE4F3] bg-[#FCFAFD] p-4"
              >
                <Icon
                  aria-hidden="true"
                  size={20}
                  className="text-[#5B2A86]"
                />

                <p className="mt-3 text-sm font-black text-[#2C1735]">
                  {item.title}
                </p>

                <p className="mt-1 text-xs leading-5 text-[#69606E]">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {submitted && (
          <div
            role="status"
            className="mt-5 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
          >
            <CheckCircle2
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0"
            />

            WhatsApp has opened with your enquiry details.
            Review the message and tap send to contact our
            admissions team.
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="inline-flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-7 text-sm font-black text-white shadow-[0_14px_35px_rgba(91,42,134,0.24)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4A2070] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/60 focus-visible:ring-offset-2"
          >
            Continue on WhatsApp

            <ArrowRight
              aria-hidden="true"
              size={18}
            />
          </button>

          <a
            href={`tel:${site.phone}`}
            className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full border border-[#DCCEE5] bg-white px-6 text-sm font-black text-[#5B2A86] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F8F3FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/60 focus-visible:ring-offset-2"
          >
            <Phone
              aria-hidden="true"
              size={18}
            />

            Call {site.phoneDisplay}
          </a>
        </div>

        <p className="mt-4 text-center text-xs leading-5 text-[#77707C]">
          By submitting this form, you agree to be
          contacted regarding your admission enquiry.
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
    "w-full rounded-2xl border bg-[#FFFDFA] px-4 py-3.5",
    "text-base text-[#2C1735] outline-none",
    "placeholder:text-[#9A929E]",
    "transition duration-200",
    "focus:ring-4 focus:ring-[#F6C84B]/30",
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-[#DFD5E5] focus:border-[#5B2A86]",
  ].join(" ");
}