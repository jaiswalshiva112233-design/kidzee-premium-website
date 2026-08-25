"use client";

import { useSiteContact } from "@/components/SiteContactProvider";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  LoaderCircle,
  MessageCircle,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { collectPersistentAttribution } from "@/lib/marketing/clientAttribution";

type AdmissionFormData = {
  parentName: string;
  phone: string;
  childName: string;
  programme: string;
  enquiryType: string;
  preferredVisitDate: string;
  website: string;
};

type FormFieldName =
  | "parentName"
  | "phone"
  | "enquiryType";

type FormErrors = Partial<Record<FormFieldName, string>>;

type SubmissionResult = {
  success?: boolean;
  enquiryNumber?: string;
  submissionId?: string;
  message?: string;
  field?: FormFieldName;
};

const initialFormData: AdmissionFormData = {
  parentName: "",
  phone: "",
  childName: "",
  programme: "",
  enquiryType: "SCHOOL_VISIT",
  preferredVisitDate: "",
  website: "",
};

const programmeOptions = [
  { value: "", label: "Please guide me" },
  { value: "PLAYGROUP", label: "Playgroup - 2 to 3 years" },
  { value: "NURSERY", label: "Nursery - 3 to 4 years" },
  { value: "JUNIOR_KG", label: "Junior KG - 4 to 5 years" },
  { value: "SENIOR_KG", label: "Senior KG - 5 to 6 years" },
  { value: "DAYCARE", label: "Daycare" },
] as const;

const enquiryTypeOptions = [
  { value: "SCHOOL_VISIT", label: "Book a school visit" },
  { value: "ADMISSION", label: "Preschool admission" },
  { value: "TRIAL", label: "Three-day trial" },
  { value: "DAYCARE", label: "Daycare enquiry" },
  { value: "FEES", label: "Fees and availability" },
  { value: "CALLBACK", label: "Request a callback" },
] as const;

type AdmissionFormProps = {
  initialProgramme?: string;
  initialEnquiryType?: string;
  landingPageId?: string;
  landingVariantId?: string;
  growthExperimentId?: string;
};

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
  formData: AdmissionFormData,
  enquiryNumber: string,
  phoneDigits: string,
) {
  const programmeLabel =
    programmeOptions.find(
      (option) => option.value === formData.programme,
    )?.label ?? "Please guide me";

  const enquiryLabel =
    enquiryTypeOptions.find(
      (option) => option.value === formData.enquiryType,
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

export default function AdmissionForm({
  initialProgramme = "",
  initialEnquiryType = "SCHOOL_VISIT",
  landingPageId = "",
  landingVariantId = "",
  growthExperimentId = "",
}: AdmissionFormProps) {
  const site = useSiteContact();
  const [formData, setFormData] =
    useState<AdmissionFormData>(() => ({
      ...initialFormData,
      programme: initialProgramme,
      enquiryType: initialEnquiryType,
    }));
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState("");
  const [enquiryNumber, setEnquiryNumber] = useState("");
  const submissionId = useRef("");

  function updateField(
    field: keyof AdmissionFormData,
    value: string,
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    if (
      field === "parentName" ||
      field === "phone" ||
      field === "enquiryType"
    ) {
      setErrors((current) => ({
        ...current,
        [field]: "",
      }));
    }

    setSubmissionError("");
  }

  function validateForm() {
    const nextErrors: FormErrors = {};

    if (formData.parentName.trim().length < 2) {
      nextErrors.parentName = "Please enter the parent's name.";
    }

    const phoneDigits = formData.phone.replace(/\D/g, "");

    if (!/^[6-9]\d{9}$/.test(phoneDigits)) {
      nextErrors.phone =
        "Please enter a valid 10-digit Indian mobile number.";
    }

    if (
      !enquiryTypeOptions.some(
        (option) => option.value === formData.enquiryType,
      )
    ) {
      nextErrors.enquiryType = "Please select how we can help.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting || !validateForm()) {
      return;
    }

    if (!submissionId.current) {
      submissionId.current = createSubmissionId();
    }

    const whatsappWindow = window.open(
      "about:blank",
      "kidzee-admission-whatsapp",
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
      const response = await fetch("/api/website/enquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parentName: formData.parentName,
          phone: formData.phone,
          childName: formData.childName,
          programme: formData.programme,
          enquiryType: formData.enquiryType,
          preferredVisitDate: formData.preferredVisitDate,
          website: formData.website,
          message: "Admission page enquiry",
          landingPageId,
          landingVariantId,
          growthExperimentId,
          ...collectPersistentAttribution(),
          ...collectMarketingContext(),
          submissionId: submissionId.current,
        }),
        signal: AbortSignal.timeout(20_000),
      });

      const result = (await response.json()) as SubmissionResult;

      if (!response.ok || !result.success) {
        if (result.field) {
          setErrors((current) => ({
            ...current,
            [result.field!]:
              result.message || "Please check this field.",
          }));
        }

        throw new Error(
          result.message || "Your enquiry could not be submitted.",
        );
      }

      const savedEnquiryNumber = result.enquiryNumber?.trim() ?? "";

      if (!savedEnquiryNumber) {
        throw new Error(
          "Your enquiry was received, but its reference number could not be confirmed. Please call the centre before submitting again.",
        );
      }

      setEnquiryNumber(savedEnquiryNumber);

      const whatsappNumber = site.phone.replace(/\D/g, "");
      const whatsappUrl = createWhatsAppLink(
        formData,
        savedEnquiryNumber,
        whatsappNumber,
      );

      window.dispatchEvent(
        new CustomEvent("kidzee:website-event", {
          detail: {
            eventType: "FORM_SUBMITTED",
            eventName: "admissions_page_enquiry_submitted",
            targetText:
              enquiryTypeOptions.find(
                (option) => option.value === formData.enquiryType,
              )?.label ?? "Admission enquiry",
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
            eventName: "admissions_enquiry_whatsapp_opened",
            targetText: "Saved admission enquiry",
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
          : "Your enquiry could not be saved right now. Please call or WhatsApp the centre.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (enquiryNumber) {
    const whatsappNumber = site.phone.replace(/\D/g, "");

    return (
      <section
        id="admission-enquiry"
        role="status"
        aria-labelledby="admission-success-heading"
        className="scroll-mt-28 rounded-[32px] border border-[#BCE4C9] bg-[#F1FBF4] p-7 shadow-[0_24px_80px_rgba(52,20,68,0.1)] sm:p-9"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#197A43] text-white">
          <CheckCircle2 aria-hidden="true" size={25} />
        </span>

        <p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-[#197A43]">
          Safely saved in CentreOS
        </p>
        <h2
          id="admission-success-heading"
          className="mt-2 text-3xl font-black tracking-[-0.035em] text-[#173C27]"
        >
          Thank you. We have your enquiry.
        </h2>
        <p className="mt-4 leading-7 text-[#41604C]">
          Our centre team can now see your details. WhatsApp has opened with
          your reference so you can continue the conversation immediately.
        </p>

        <div className="mt-5 rounded-2xl border border-[#BCE4C9] bg-white px-5 py-4">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-[#567060]">
            Enquiry reference
          </p>
          <p className="mt-1 break-all text-lg font-black text-[#173C27]">
            {enquiryNumber}
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={createWhatsAppLink(
              formData,
              enquiryNumber,
              whatsappNumber,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-full bg-[#20C968] px-6 text-base font-black text-white shadow-[0_14px_34px_rgba(32,201,104,0.2)] transition hover:-translate-y-0.5 hover:bg-[#18B85B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/70 focus-visible:ring-offset-2"
          >
            <MessageCircle aria-hidden="true" size={19} />
            Open WhatsApp Again
          </a>

          <a
            href={`tel:${site.phone}`}
            className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full border border-[#A9CEB5] bg-white px-6 text-base font-black text-[#197A43] transition hover:-translate-y-0.5 hover:bg-[#E8F7ED] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/70 focus-visible:ring-offset-2"
          >
            <Phone aria-hidden="true" size={18} />
            Call the Centre
          </a>
        </div>
      </section>
    );
  }

  return (
    <section
      id="admission-enquiry"
      aria-labelledby="admission-form-heading"
      className="scroll-mt-28 overflow-hidden rounded-[32px] border border-[#E8DDF1] bg-white shadow-[0_24px_80px_rgba(52,20,68,0.12)]"
    >
      <div className="border-b border-[#EEE6F3] bg-[#F9F5FC] px-6 py-6 sm:px-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#5B2A86] text-white">
            <UserRound aria-hidden="true" size={22} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-[#5B2A86]">
              Quick admission enquiry
            </p>
            <h2
              id="admission-form-heading"
              className="mt-1 text-2xl font-black tracking-[-0.025em] text-[#2C1735] sm:text-3xl"
            >
              How can we help your family?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#5F5F6D] sm:text-base">
              Your enquiry goes directly to the centre panel so our team can
              follow up with you.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        aria-label="Admission enquiry form"
        data-analytics-name="admission_enquiry_form"
        className="space-y-5 px-6 py-7 sm:px-8 sm:py-8"
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
                  event.target.value.replace(/\D/g, "").slice(0, 10),
                )
              }
              placeholder="10-digit mobile number"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              className={inputClasses(Boolean(errors.phone))}
            />
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField id="childName" label="Child's name (optional)">
            <input
              id="childName"
              name="childName"
              type="text"
              autoComplete="off"
              value={formData.childName}
              onChange={(event) =>
                updateField("childName", event.target.value)
              }
              placeholder="Enter child's name"
              className={inputClasses(false)}
            />
          </FormField>

          <FormField id="programme" label="Programme">
            <select
              id="programme"
              name="programme"
              value={formData.programme}
              onChange={(event) =>
                updateField("programme", event.target.value)
              }
              className={inputClasses(false)}
            >
              {programmeOptions.map((programme) => (
                <option key={programme.value} value={programme.value}>
                  {programme.label}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
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
                updateField("enquiryType", event.target.value)
              }
              aria-invalid={Boolean(errors.enquiryType)}
              aria-describedby={
                errors.enquiryType ? "enquiryType-error" : undefined
              }
              className={inputClasses(Boolean(errors.enquiryType))}
            >
              {enquiryTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField id="preferredVisitDate" label="Preferred visit date">
            <div className="relative">
              <CalendarDays
                aria-hidden="true"
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#7A6F80]"
              />
              <input
                id="preferredVisitDate"
                name="preferredVisitDate"
                type="date"
                value={formData.preferredVisitDate}
                onChange={(event) =>
                  updateField("preferredVisitDate", event.target.value)
                }
                className={`${inputClasses(false)} pl-11`}
              />
            </div>
          </FormField>
        </div>

        <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label htmlFor="admissionWebsite">Website</label>
          <input
            id="admissionWebsite"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={formData.website}
            onChange={(event) => updateField("website", event.target.value)}
          />
        </div>

        <div className="rounded-[22px] border border-[#EEE4F3] bg-[#FCFAFD] p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-[#5B2A86]"
            />
            <p className="text-sm leading-6 text-[#5F5F6D]">
              Your details are saved securely in CentreOS and used only to
              respond to this enquiry.
            </p>
          </div>
        </div>

        {submissionError ? (
          <div
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-800"
          >
            {submissionError}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex min-h-[54px] flex-1 items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-7 text-base font-black text-white shadow-[0_14px_34px_rgba(91,42,134,0.24)] transition hover:-translate-y-0.5 hover:bg-[#4A2070] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/70 focus-visible:ring-offset-2"
          >
            {isSubmitting ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  size={19}
                  className="animate-spin"
                />
                Saving Enquiry...
              </>
            ) : (
              <>
                Send Enquiry
                <ArrowRight aria-hidden="true" size={19} />
              </>
            )}
          </button>

          <a
            href={`tel:${site.phone}`}
            className="inline-flex min-h-[54px] items-center justify-center gap-2 rounded-full border border-[#E0D1E8] bg-white px-6 text-base font-black text-[#5B2A86] transition hover:-translate-y-0.5 hover:bg-[#F8F3FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/70 focus-visible:ring-offset-2"
          >
            <Phone aria-hidden="true" size={18} />
            Call {site.phoneDisplay}
          </a>
        </div>

        <p className="text-center text-xs font-semibold leading-5 text-[#6F6474]">
          Your enquiry is saved first. WhatsApp opens only after CentreOS
          confirms it.
        </p>

        <p className="text-center text-xs leading-5 text-[#77707C]">
          By submitting, you agree to be contacted about this enquiry.
        </p>
      </form>
    </section>
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
          <span aria-hidden="true" className="ml-1 text-[#8A2D5E]">
            *
          </span>
        ) : null}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
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
