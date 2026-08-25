"use client";

import { useSiteContact } from "@/components/SiteContactProvider";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  MessageCircle,
  ShieldCheck,
} from "lucide-react";
import {
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { collectPersistentAttribution } from "@/lib/marketing/clientAttribution";



type EnquiryFormData = {
  parentName: string;
  phone: string;
  childName: string;
  childAge: string;
  programme: string;
  enquiryType: string;
  preferredVisitDate: string;
  message: string;
  website: string;
};

type FormFieldName =
  | "parentName"
  | "phone"
  | "programme"
  | "enquiryType";

type FormErrors = Partial<Record<FormFieldName, string>>;

type SubmissionResult = {
  success?: boolean;
  enquiryNumber?: string;
  submissionId?: string;
  message?: string;
  field?: FormFieldName;
};

const initialFormData: EnquiryFormData = {
  parentName: "",
  phone: "",
  childName: "",
  childAge: "",
  programme: "",
  enquiryType: "SCHOOL_VISIT",
  preferredVisitDate: "",
  message: "",
  website: "",
};

const programmeOptions = [
  {
    value: "",
    label: "Not sure - please guide me",
  },
  {
    value: "PLAYGROUP",
    label: "Playgroup - 2 to 3 years",
  },
  {
    value: "NURSERY",
    label: "Nursery - 3 to 4 years",
  },
  {
    value: "JUNIOR_KG",
    label: "Junior KG - 4 to 5 years",
  },
  {
    value: "SENIOR_KG",
    label: "Senior KG - 5 to 6 years",
  },
  {
    value: "DAYCARE",
    label: "Daycare",
  },
] as const;

const enquiryTypeOptions = [
  {
    value: "SCHOOL_VISIT",
    label: "Book a school visit",
  },
  {
    value: "ADMISSION",
    label: "Preschool admission",
  },
  {
    value: "DAYCARE",
    label: "Daycare enquiry",
  },
  {
    value: "TRIAL",
    label: "Three-day trial",
  },
  {
    value: "FEES",
    label: "Fees and availability",
  },
  {
    value: "CALLBACK",
    label: "Request a callback",
  },
] as const;

function createSubmissionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2)
  );
}

function readCookie(name: string) {
  const prefix = `${name}=`;
  const match = document.cookie
    .split(";")
    .map((value) => value.trim())
    .find((value) => value.startsWith(prefix));

  return match ? decodeURIComponent(match.slice(prefix.length)) : "";
}

function collectMarketingContext() {
  let marketingConsent = false;

  try {
    const stored = JSON.parse(
      window.localStorage.getItem("kidzee-cookie-consent-v1") || "null",
    ) as { marketing?: unknown; version?: unknown } | null;

    marketingConsent =
      stored?.version === 1 && stored.marketing === true;
  } catch {
    marketingConsent = false;
  }

  return {
    marketingConsent,
    fbc: marketingConsent ? readCookie("_fbc") : "",
    fbp: marketingConsent ? readCookie("_fbp") : "",
  };
}

function createWhatsAppLink(
  formData: EnquiryFormData,
  enquiryNumber: string,
  phoneDigits: string,
) {
  const programmeLabel =
    programmeOptions.find(
      (option) => option.value === formData.programme,
    )?.label ?? "Please guide me";

  const enquiryLabel =
    enquiryTypeOptions.find(
      (option) =>
        option.value === formData.enquiryType,
    )?.label ?? "Admission enquiry";

  const message = [
    "Hello Kidzee Sector 12, Dwarka.",
    "",
    "My website enquiry has been saved.",
    "Reference: " + enquiryNumber,
    "Parent: " + formData.parentName.trim(),
    formData.childName.trim()
      ? "Child: " + formData.childName.trim()
      : "",
    formData.childAge.trim()
      ? "Child's age: " + formData.childAge.trim()
      : "",
    "Interested in: " + programmeLabel,
    "Enquiry: " + enquiryLabel,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    "https://wa.me/" +
    phoneDigits +
    "?text=" +
    encodeURIComponent(message)
  );
}

export default function EnquiryForm() {
  const site = useSiteContact();
  const [formData, setFormData] =
    useState<EnquiryFormData>(initialFormData);
  const [errors, setErrors] =
    useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] =
    useState(false);
  const [submissionError, setSubmissionError] =
    useState("");
  const [enquiryNumber, setEnquiryNumber] =
    useState("");
  const submissionId = useRef("");

  function updateField(
    field: keyof EnquiryFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (
      field === "parentName" ||
      field === "phone" ||
      field === "programme" ||
      field === "enquiryType"
    ) {
      setErrors((current) => ({
        ...current,
        [field]: "",
      }));
    }

    setSubmissionError("");
    setEnquiryNumber("");
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (formData.parentName.trim().length < 2) {
      nextErrors.parentName =
        "Please enter the parent's name.";
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      nextErrors.phone =
        "Please enter a valid 10-digit Indian mobile number.";
    }

    if (
      !enquiryTypeOptions.some(
        (option) =>
          option.value === formData.enquiryType,
      )
    ) {
      nextErrors.enquiryType =
        "Please select how we can help.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (isSubmitting || !validateForm()) {
      return;
    }

    if (!submissionId.current) {
      submissionId.current = createSubmissionId();
    }

    const whatsappWindow = window.open(
      "about:blank",
      "kidzee-website-whatsapp",
    );

    if (whatsappWindow) {
      whatsappWindow.opener = null;
      whatsappWindow.document.title = "Saving your Kidzee enquiry";
      whatsappWindow.document.body.innerHTML =
        '<p style="font:600 16px/1.6 system-ui;padding:32px;color:#2D1736">Saving your enquiry securely before opening WhatsApp...</p>';
    }

    setIsSubmitting(true);
    setSubmissionError("");

    try {
      const response = await fetch(
        "/api/website/enquiry",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            ...collectPersistentAttribution(),
            ...collectMarketingContext(),
            submissionId: submissionId.current,
          }),
          signal: AbortSignal.timeout(20_000),
        },
      );

      const result =
        (await response.json()) as SubmissionResult;

      if (!response.ok || !result.success) {
        if (result.field) {
          setErrors((current) => ({
            ...current,
            [result.field!]:
              result.message ||
              "Please check this field.",
          }));
        }

        throw new Error(
          result.message ||
            "Your enquiry could not be submitted.",
        );
      }

      const savedEnquiryNumber =
        result.enquiryNumber?.trim() ?? "";

      if (!savedEnquiryNumber) {
        throw new Error(
          "Your enquiry was received, but its reference number could not be confirmed. Please call the centre before submitting again.",
        );
      }

      setEnquiryNumber(savedEnquiryNumber);

      const whatsappUrl = createWhatsAppLink(
        formData,
        savedEnquiryNumber,
        site.phoneDigits,
      );

      window.dispatchEvent(
        new CustomEvent("kidzee:website-event", {
          detail: {
            eventType: "FORM_SUBMITTED",
            eventName: "website_enquiry_submitted",
            targetText:
              enquiryTypeOptions.find(
                (option) =>
                  option.value === formData.enquiryType,
              )?.label ?? "Website enquiry",
            enquiryNumber: savedEnquiryNumber,
            submissionId:
              result.submissionId || submissionId.current,
          },
        }),
      );

      window.dispatchEvent(
        new CustomEvent("kidzee:website-event", {
          detail: {
            eventType: "WHATSAPP_CLICK",
            eventName: "saved_website_enquiry_whatsapp_opened",
            targetText: "Saved website enquiry",
            targetUrl: whatsappUrl,
            enquiryNumber: savedEnquiryNumber,
          },
        }),
      );

      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.location.replace(whatsappUrl);
      } else {
        window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      if (whatsappWindow && !whatsappWindow.closed) {
        whatsappWindow.close();
      }

      setSubmissionError(
        error instanceof Error
          ? error.message
          : "Your enquiry could not be submitted. Please call or WhatsApp the centre.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (enquiryNumber) {
    return (
      <div
        role="status"
        className="rounded-[28px] border border-[#BCE4C9] bg-[#F1FBF4] p-6 sm:p-8"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#197A43] text-white">
          <CheckCircle2
            aria-hidden="true"
            size={24}
          />
        </span>

        <h3 className="mt-5 text-2xl font-black text-[#173C27]">
          Your enquiry is safely in CentreOS.
        </h3>

        <p className="mt-3 leading-7 text-[#41604C]">
          Our admissions team now has your details. WhatsApp has opened with
          your reference so you can continue immediately:
        </p>

        <p className="mt-4 inline-flex rounded-full border border-[#A8D8B7] bg-white px-4 py-2 text-sm font-black tracking-[0.08em] text-[#146B39]">
          {enquiryNumber}
        </p>

        <a
          href={createWhatsAppLink(
            formData,
            enquiryNumber,
            site.phoneDigits,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-[#25D366] px-6 text-sm font-black text-white shadow-[0_14px_32px_rgba(37,211,102,0.24)] transition hover:-translate-y-0.5 hover:bg-[#20BD5A] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/35 sm:w-auto"
        >
          <MessageCircle
            aria-hidden="true"
            size={18}
          />
          Open WhatsApp Again
        </a>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label="Website admission and daycare enquiry form"
      data-analytics-name="website_enquiry_form"
      className="space-y-5"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="parentName"
          label="Parent's name"
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
                event.target.value,
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
              Boolean(errors.parentName),
            )}
          />
        </FormField>

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
                event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10),
              )
            }
            placeholder="10-digit mobile number"
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={
              errors.phone ? "phone-error" : undefined
            }
            className={inputClasses(
              Boolean(errors.phone),
            )}
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="childName"
          label="Child's name"
        >
          <input
            id="childName"
            name="childName"
            type="text"
            autoComplete="off"
            value={formData.childName}
            onChange={(event) =>
              updateField(
                "childName",
                event.target.value,
              )
            }
            placeholder="Optional"
            className={inputClasses(false)}
          />
        </FormField>

        <FormField
          id="childAge"
          label="Child's age"
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
                event.target.value.slice(0, 80),
              )
            }
            placeholder="For example, 3 years"
            className={inputClasses(false)}
          />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField
          id="programme"
          label="Programme"
          error={errors.programme}
        >
          <select
            id="programme"
            name="programme"
            value={formData.programme}
            onChange={(event) =>
              updateField(
                "programme",
                event.target.value,
              )
            }
            className={inputClasses(
              Boolean(errors.programme),
            )}
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
        </FormField>

        <FormField
          id="enquiryType"
          label="How can we help?"
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
                event.target.value,
              )
            }
            aria-invalid={Boolean(
              errors.enquiryType,
            )}
            aria-describedby={
              errors.enquiryType
                ? "enquiryType-error"
                : undefined
            }
            className={inputClasses(
              Boolean(errors.enquiryType),
            )}
          >
            {enquiryTypeOptions.map((option) => (
              <option
                key={option.value}
                value={option.value}
              >
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        id="preferredVisitDate"
        label="Preferred school-visit date"
      >
        <div className="relative">
          <CalendarDays
            aria-hidden="true"
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#756A79]"
          />

          <input
            id="preferredVisitDate"
            name="preferredVisitDate"
            type="date"
            value={formData.preferredVisitDate}
            onChange={(event) =>
              updateField(
                "preferredVisitDate",
                event.target.value,
              )
            }
            className={
              inputClasses(false) + " pl-11"
            }
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
          rows={3}
          maxLength={1500}
          value={formData.message}
          onChange={(event) =>
            updateField(
              "message",
              event.target.value,
            )
          }
          placeholder="Preferred timing, daycare requirement or questions"
          className={
            inputClasses(false) +
            " min-h-[105px] resize-y"
          }
        />
      </FormField>

      <div
        aria-hidden="true"
        className="absolute -left-[10000px] h-px w-px overflow-hidden"
      >
        <label htmlFor="website">
          Leave this field empty
        </label>

        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={formData.website}
          onChange={(event) =>
            updateField(
              "website",
              event.target.value,
            )
          }
        />
      </div>

      {submissionError ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800"
        >
          {submissionError}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-full bg-[#5B2A86] px-7 text-base font-black text-white shadow-[0_14px_35px_rgba(91,42,134,0.24)] transition hover:-translate-y-0.5 hover:bg-[#4A2070] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/55 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-65"
      >
        {isSubmitting ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              size={19}
              className="animate-spin"
            />
            Saving your enquiry
          </>
        ) : (
          <>
            Send Enquiry
            <ArrowRight
              aria-hidden="true"
              size={19}
            />
          </>
        )}
      </button>

      <p className="text-center text-xs font-semibold leading-5 text-[#6F6474]">
        Your enquiry is saved first. WhatsApp opens only after CentreOS
        confirms it.
      </p>

      <div className="flex items-start gap-2.5">
        <ShieldCheck
          aria-hidden="true"
          size={17}
          className="mt-0.5 shrink-0 text-[#5B2A86]"
        />

        <p className="text-xs leading-5 text-[#746A78]">
          Your details are used only to respond to this
          enquiry. By submitting, you agree to be contacted
          by the centre. Read our{" "}
          <Link
            href="/privacy-policy"
            className="font-bold text-[#5B2A86] underline decoration-[#5B2A86]/30 underline-offset-2 hover:decoration-[#5B2A86]"
          >
            privacy policy
          </Link>
          .
        </p>
      </div>
    </form>
  );
}

type FormFieldProps = {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
};

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

        {required ? (
          <span
            aria-hidden="true"
            className="ml-1 text-[#9B2F62]"
          >
            *
          </span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p
          id={id + "-error"}
          className="mt-2 text-sm font-semibold text-red-700"
        >
          {error}
        </p>
      ) : null}
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
