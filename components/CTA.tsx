"use client";

import { FormEvent, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

interface VisitFormData {
  parentName: string;
  phone: string;
  childAge: string;
  programme: string;
  preferredTime: string;
}

type VisitFormErrors = Partial<Record<keyof VisitFormData, string>>;

const initialFormData: VisitFormData = {
  parentName: "",
  phone: "",
  childAge: "",
  programme: "",
  preferredTime: "",
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
    value: "3-Day Trial",
    label: "3-day trial",
  },
] as const;

const visitTimeOptions = [
  "Morning",
  "Afternoon",
  "Please call me to confirm",
] as const;

function createWhatsAppLink(message: string) {
  const phoneNumber = site.phone.replace(/\D/g, "");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export default function CTA() {
  const [formData, setFormData] =
    useState<VisitFormData>(initialFormData);

  const [errors, setErrors] = useState<VisitFormErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function updateField(
    field: keyof VisitFormData,
    value: string
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setErrors((current) => ({
      ...current,
      [field]: undefined,
    }));

    setSubmitted(false);
  }

  function validateForm() {
    const nextErrors: VisitFormErrors = {};

    if (!formData.parentName.trim()) {
      nextErrors.parentName = "Please enter the parent’s name.";
    }

    const cleanedPhone = formData.phone.replace(/\D/g, "");

    if (!cleanedPhone) {
      nextErrors.phone = "Please enter a mobile number.";
    } else if (cleanedPhone.length !== 10) {
      nextErrors.phone =
        "Please enter a valid 10-digit mobile number.";
    }

    if (!formData.childAge.trim()) {
      nextErrors.childAge = "Please enter the child’s age.";
    }

    if (!formData.programme) {
      nextErrors.programme = "Please select a programme.";
    }

    if (!formData.preferredTime) {
      nextErrors.preferredTime =
        "Please select a preferred visit time.";
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
      "I would like to book a school visit.",
      "",
      `Parent's name: ${formData.parentName.trim()}`,
      `Phone number: ${formData.phone.trim()}`,
      `Child's age: ${formData.childAge.trim()}`,
      `Interested in: ${formData.programme}`,
      `Preferred visit time: ${formData.preferredTime}`,
    ].join("\n");

    setSubmitted(true);

    window.open(
      createWhatsAppLink(message),
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <section
      id="book-a-visit"
      aria-labelledby="book-visit-heading"
      className="relative overflow-hidden bg-[#FFF9F1] py-16 sm:py-20 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-36 top-10 h-80 w-80 rounded-full bg-[#EADDF1] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-36 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl"
      />

      <Container className="relative">
        <div className="overflow-hidden rounded-[34px] bg-[#2D1736] shadow-[0_30px_80px_rgba(45,23,54,0.22)]">
          <div className="grid lg:grid-cols-[0.88fr_1.12fr]">
            <div className="relative overflow-hidden px-7 py-10 text-white sm:px-10 sm:py-12 lg:px-12 lg:py-14">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[#7A459C]/25 blur-3xl"
              />

              <div
                aria-hidden="true"
                className="pointer-events-none absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-[#F6C84B]/10 blur-3xl"
              />

              <div className="relative">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-[#F6D86F]">
                  Admissions and centre visits
                </p>

                <h2
                  id="book-visit-heading"
                  className="mt-5 text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl"
                >
                  Visit the centre before choosing a programme.
                </h2>

                <p className="mt-6 max-w-xl text-base leading-8 text-white/75 sm:text-lg">
                  Meet our team, see the learning spaces and discuss the
                  programme most suitable for your child’s age and routine.
                </p>

                <div className="mt-9 space-y-4">
                  <div className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/[0.07] p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                      <MapPin aria-hidden="true" size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-white">
                        Kidzee Sector 12B, Dwarka
                      </p>

                      <p className="mt-2 text-sm leading-6 text-white/70">
                        {site.address}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 rounded-[24px] border border-white/10 bg-white/[0.07] p-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-[#5B2A86]">
                      <Clock3 aria-hidden="true" size={20} />
                    </div>

                    <div>
                      <p className="text-sm font-black text-white">
                        Visits are scheduled in advance
                      </p>

                      <p className="mt-2 text-sm leading-6 text-white/70">
                        Choose a preferred time in the form. Our team will
                        confirm availability with you.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button
                    href={`tel:${site.phone}`}
                    variant="yellow"
                    size="md"
                    leftIcon={<Phone size={17} />}
                  >
                    Call {site.phoneDisplay}
                  </Button>

                  <Button
                    href={site.whatsappVisit}
                    external
                    variant="secondary"
                    size="md"
                    leftIcon={<MessageCircle size={17} />}
                    className="border-white/25 bg-white/[0.06] text-white hover:bg-white/10"
                  >
                    WhatsApp Us
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-white p-7 sm:p-10 lg:p-12">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-[#5B2A86]">
                Book a visit
              </p>

              <h3 className="mt-4 text-3xl font-black leading-tight tracking-[-0.03em] text-[#2D1736] sm:text-4xl">
                Share your visit details
              </h3>

              <p className="mt-4 max-w-xl leading-7 text-[#6F6474]">
                After submitting, WhatsApp will open with your details ready
                for review. The message is sent only when you tap send.
              </p>

              <form
                onSubmit={handleSubmit}
                noValidate
                className="mt-8 space-y-5"
              >
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
                      errors.phone ? "phone-error" : undefined
                    }
                    className={inputClasses(Boolean(errors.phone))}
                  />
                </FormField>

                <div className="grid gap-5 sm:grid-cols-2">
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
                      className={inputClasses(
                        Boolean(errors.childAge)
                      )}
                    />
                  </FormField>

                  <FormField
                    id="preferredTime"
                    label="Preferred time"
                    required
                    error={errors.preferredTime}
                  >
                    <select
                      id="preferredTime"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={(event) =>
                        updateField(
                          "preferredTime",
                          event.target.value
                        )
                      }
                      aria-invalid={Boolean(
                        errors.preferredTime
                      )}
                      aria-describedby={
                        errors.preferredTime
                          ? "preferredTime-error"
                          : undefined
                      }
                      className={inputClasses(
                        Boolean(errors.preferredTime)
                      )}
                    >
                      <option value="">Select a time</option>

                      {visitTimeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>

                <FormField
                  id="programme"
                  label="Programme interested in"
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
                    className={inputClasses(
                      Boolean(errors.programme)
                    )}
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

                <button
                  type="submit"
                  className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_14px_35px_rgba(91,42,134,0.24)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#4A2070] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/50 focus-visible:ring-offset-2"
                >
                  Continue on WhatsApp
                  <Send aria-hidden="true" size={17} />
                </button>

                <p className="text-center text-xs leading-5 text-[#77707C]">
                  Your information is used only to respond to your visit
                  request.
                </p>

                {submitted && (
                  <div
                    role="status"
                    className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm leading-6 text-green-800"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      size={20}
                      className="mt-0.5 shrink-0"
                    />

                    <span>
                      WhatsApp has opened. Review the prepared message and
                      tap send to complete your request.
                    </span>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </Container>
    </section>
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
          <span aria-hidden="true" className="ml-1 text-red-700">
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
    "text-base text-[#2D1736] outline-none",
    "placeholder:text-[#9A929E]",
    "transition duration-200",
    "focus:ring-4 focus:ring-[#F6C84B]/30",
    hasError
      ? "border-red-400 focus:border-red-500"
      : "border-[#DFD5E5] focus:border-[#5B2A86]",
  ].join(" ");
}