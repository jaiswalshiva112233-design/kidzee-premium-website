"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Baby,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  MessageCircle,
  Phone,
  School,
  Send,
  Sparkles,
  UsersRound,
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

const initialFormData: VisitFormData = {
  parentName: "",
  phone: "",
  childAge: "",
  programme: "",
  preferredTime: "",
};

const visitBenefits = [
  {
    icon: School,
    title: "Explore the preschool",
    description:
      "See the classrooms, play areas, activity spaces and daycare environment in person.",
  },
  {
    icon: UsersRound,
    title: "Meet the school team",
    description:
      "Speak with our educators and understand how children are supported throughout the day.",
  },
  {
    icon: Baby,
    title: "Discuss your child",
    description:
      "Share your child’s age, routine and requirements so our team can guide you properly.",
  },
  {
    icon: CalendarDays,
    title: "Understand admission",
    description:
      "Learn about programmes, timings, meals, daycare, transport and the admission process.",
  },
];

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
    label: "3-Day Trial",
  },
];

const visitTimeOptions = [
  "Morning",
  "Afternoon",
  "Saturday visit",
  "Please call me to confirm",
];

function createWhatsAppLink(message: string) {
  const phoneNumber = site.phone.replace(/\D/g, "");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export default function CTA() {
  const [formData, setFormData] =
    useState<VisitFormData>(initialFormData);

  const [errors, setErrors] = useState<
    Partial<Record<keyof VisitFormData, string>>
  >({});

  const [submitted, setSubmitted] = useState(false);

  const generalEnquiryLink = createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to know more about admissions, daycare or the 3-day trial."
  );

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
      [field]: "",
    }));

    setSubmitted(false);
  }

  function validateForm() {
    const nextErrors: Partial<
      Record<keyof VisitFormData, string>
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

    if (!formData.childAge.trim()) {
      nextErrors.childAge = "Please enter the child’s age.";
    }

    if (!formData.preferredTime) {
      nextErrors.preferredTime = "Please select a preferred visit time.";
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

    const whatsappUrl = createWhatsAppLink(message);

    setSubmitted(true);

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <section
      id="book-a-visit"
      aria-labelledby="book-visit-heading"
      className="relative overflow-hidden bg-[#FFF9F1] py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-24 top-16 h-80 w-80 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-24 bottom-10 h-80 w-80 rounded-full bg-[#FFF0B8] blur-3xl"
      />

      <Container className="relative">
        <div className="overflow-hidden rounded-[42px] bg-[#2C1735] shadow-[0_35px_90px_rgba(44,23,53,0.24)]">
          <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="relative overflow-hidden px-7 py-10 text-white sm:px-10 sm:py-12 lg:px-12 lg:py-14"
            >
              <div
                aria-hidden="true"
                className="absolute -left-20 top-12 h-64 w-64 rounded-full bg-[#7A3AA5]/30 blur-3xl"
              />

              <div
                aria-hidden="true"
                className="absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#F6C84B]/10 blur-3xl"
              />

              <div className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-sm font-black text-[#F6D86F] backdrop-blur">
                  <Sparkles aria-hidden="true" size={17} />
                  Book a school visit
                </div>

                <h2
                  id="book-visit-heading"
                  className="mt-6 text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl lg:text-[56px]"
                >
                  The best way to choose a preschool is to{" "}
                  <span className="block text-[#F6C84B]">
                    experience it yourself
                  </span>
                </h2>

                <p className="mt-6 max-w-2xl text-base leading-8 text-[#E8DDF1] sm:text-lg">
                  Visit Kidzee Sector 12B, Dwarka, meet our school team and
                  understand how your child will learn, play and settle into
                  the daily routine.
                </p>

                <div className="mt-9 grid gap-4 sm:grid-cols-2">
                  {visitBenefits.map((benefit, index) => {
                    const Icon = benefit.icon;

                    return (
                      <motion.article
                        key={benefit.title}
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.2 }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.05,
                          ease: "easeOut",
                        }}
                        className="rounded-[26px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#5B2A86] shadow-lg">
                          <Icon
                            aria-hidden="true"
                            size={21}
                          />
                        </div>

                        <h3 className="mt-4 text-lg font-black text-white">
                          {benefit.title}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-[#E8DDF1]">
                          {benefit.description}
                        </p>
                      </motion.article>
                    );
                  })}
                </div>

                <div className="mt-9 rounded-[28px] border border-white/10 bg-white/[0.07] p-5 backdrop-blur">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2C1735]">
                      <MapPin
                        aria-hidden="true"
                        size={21}
                      />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#F6D86F]">
                        Visit us
                      </p>

                      <p className="mt-2 font-bold leading-7 text-white">
                        {site.address}
                      </p>

                      <div className="mt-4 space-y-3 text-sm leading-6 text-[#E8DDF1]">
                        <div className="flex items-start gap-2">
                          <Clock3
                            aria-hidden="true"
                            size={16}
                            className="mt-1 shrink-0"
                          />

                          <p>
                            <strong className="text-white">
                              Preschool:
                            </strong>{" "}
                            Monday–Friday, 8:30 AM–1:00 PM
                          </p>
                        </div>

                        <div className="flex items-start gap-2">
                          <Clock3
                            aria-hidden="true"
                            size={16}
                            className="mt-1 shrink-0"
                          />

                          <p>
                            <strong className="text-white">
                              Daycare:
                            </strong>{" "}
                            Monday–Saturday, 12:30 PM–7:00 PM
                          </p>
                        </div>

                        <p className="pl-6">
                          School visits are best scheduled in advance so our
                          team can give you enough time and attention.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={`tel:${site.phone}`}
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-white px-6 text-sm font-black text-[#2C1735] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#F6C84B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2C1735]"
                  >
                    <Phone
                      aria-hidden="true"
                      size={17}
                    />

                    Call {site.phoneDisplay}
                  </a>

                  <a
                    href={site.whatsapp}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-white/20 bg-white/[0.08] px-6 text-sm font-black text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/[0.14] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#2C1735]"
                  >
                    <MessageCircle
                      aria-hidden="true"
                      size={17}
                    />

                    Chat on WhatsApp
                  </a>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="bg-white p-7 sm:p-10 lg:p-12"
            >
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#5B2A86]">
                Plan your visit
              </p>

              <h3 className="mt-4 text-3xl font-black leading-tight tracking-[-0.03em] text-[#2C1735] sm:text-4xl">
                Tell us a little about your child
              </h3>

              <p className="mt-4 leading-7 text-[#5F5F6D]">
                Complete the form and WhatsApp will open with your visit
                details ready for you to review and send.
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

                  <FormField
                    id="preferredTime"
                    label="Preferred visit time"
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
                      <option value="">
                        Select a time
                      </option>

                      {visitTimeOptions.map((time) => (
                        <option
                          key={time}
                          value={time}
                        >
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

                <button
                  type="submit"
                  className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_14px_35px_rgba(91,42,134,0.25)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4A2070] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/60 focus-visible:ring-offset-2"
                >
                  Book My School Visit

                  <Send
                    aria-hidden="true"
                    size={17}
                  />
                </button>

                <p className="text-center text-xs leading-5 text-[#77707C]">
                  Submitting this form opens WhatsApp. Your message is sent
                  only after you review and confirm it.
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

                    WhatsApp has opened with your visit details. Review the
                    message and tap send to complete your request.
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mt-8 flex flex-col items-center justify-between gap-5 rounded-[30px] border border-[#EADFF0] bg-white px-7 py-6 text-center shadow-[0_12px_35px_rgba(52,20,68,0.06)] sm:flex-row sm:text-left"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#5B2A86]">
              Not ready to visit yet?
            </p>

            <p className="mt-2 text-lg font-black text-[#2C1735]">
              Ask about admissions, daycare or the 3-day trial on WhatsApp.
            </p>
          </div>

          <Button
            href={generalEnquiryLink}
            external
            variant="secondary"
            className="shrink-0"
            ariaLabel="Ask Kidzee Sector 12 Dwarka about admissions on WhatsApp"
          >
            Ask on WhatsApp

            <ArrowRight
              aria-hidden="true"
              size={17}
            />
          </Button>
        </motion.div>
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