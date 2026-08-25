import type { Metadata } from "next";
import Link from "next/link";
import {
  AlertCircle,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import PageShell from "@/components/PageShell";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildSiteContact } from "@/lib/siteContact";

export const metadata: Metadata = {
  title: "Terms of Use",
  description:
    "Read the terms governing the use of the Kidzee Sector 12, Dwarka website.",
  alternates: {
    canonical: "/terms",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const sections = [
  {
    title: "Website information",
    content: [
      "The information on this website is provided to help parents understand our preschool programmes, daycare services, facilities and admission process.",
      "We make reasonable efforts to keep the information accurate and current. Programme details, timings, availability, activities and admission requirements may change when necessary.",
    ],
  },
  {
    title: "Admissions and enrolment",
    content: [
      "Submitting an enquiry form, sending a WhatsApp message or booking a school visit does not confirm admission or reserve a seat.",
      "Admission is subject to seat availability, age eligibility, document verification, completion of the required forms and acceptance of the centre’s applicable policies.",
      "Parents should confirm all current admission details directly with the centre before making a decision.",
    ],
  },
  {
    title: "Fees and payments",
    content: [
      "Any fee information discussed through the website, phone, WhatsApp or during a visit should be confirmed directly with the centre before payment.",
      "Payment schedules, inclusions, refunds, withdrawals, kits, transport and other charges are governed by the written admission documents and receipts provided at the time of enrolment.",
    ],
  },
  {
    title: "Trial classes and school visits",
    content: [
      "Trial classes and school visits are subject to prior confirmation, available slots and the centre’s operating schedule.",
      "The centre may reschedule or cancel a visit or trial class due to holidays, events, maintenance, safety requirements or other operational reasons.",
    ],
  },
  {
    title: "Parent responsibilities",
    content: [
      "Parents and guardians are responsible for providing accurate contact, medical, emergency and authorised-pick-up information.",
      "Parents must promptly inform the centre of any change that may affect a child’s safety, care, attendance or authorised collection arrangements.",
    ],
  },
  {
    title: "Photographs and website content",
    content: [
      "The website’s text, branding, layout and original media may not be copied, republished or used commercially without permission.",
      "Photographs of children are used only where the centre has an appropriate basis or permission to publish them. Parents may contact the centre regarding any concern about a photograph.",
    ],
  },
  {
    title: "External services",
    content: [
      "This website may include links to services such as WhatsApp, Instagram, Google Maps or other third-party platforms.",
      "Those services operate under their own terms and privacy policies. We are not responsible for their availability, security or content.",
    ],
  },
  {
    title: "Website availability",
    content: [
      "We do not guarantee that the website will always be available, error-free or uninterrupted.",
      "We may update, suspend or remove website content without prior notice when required for maintenance, accuracy, security or operational reasons.",
    ],
  },
  {
    title: "Limitation of responsibility",
    content: [
      "The website is intended for general information and enquiry purposes. Parents should rely on the centre’s written admission documents and direct confirmation for final decisions.",
      "To the extent permitted by law, the centre is not responsible for losses caused solely by reliance on outdated, incomplete or incorrectly entered website information.",
    ],
  },
  {
    title: "Changes to these terms",
    content: [
      "These terms may be updated when our website, services or operating requirements change.",
      "The version published on this page will apply from the date it is made available.",
    ],
  },
] as const;

export default async function TermsPage() {
  const site = buildSiteContact(await getWebsiteContactSettings());
  return (
    <PageShell>
      <main>
      <section className="relative overflow-hidden bg-[#FAF7FC] pb-16 pt-32 sm:pb-20 sm:pt-36 lg:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#EADDF1] blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl"
        />

        <Container size="narrow" className="relative text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white px-4 py-2 text-sm font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(52,20,68,0.06)]">
            <FileText aria-hidden="true" size={16} />
            Website terms
          </div>

          <h1 className="mt-6 text-balance text-4xl font-black leading-tight tracking-[-0.04em] text-[#2D1736] sm:text-5xl lg:text-6xl">
            Terms of Use
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
            These terms explain how the Kidzee Sector 12, Dwarka website may
            be used and how online enquiries are handled.
          </p>
        </Container>
      </section>

      <section className="bg-white py-16 sm:py-20 lg:py-24">
        <Container size="narrow">
          <div className="rounded-[30px] border border-[#5B2A86]/10 bg-[#FFFDFE] p-6 shadow-[0_20px_60px_rgba(52,20,68,0.07)] sm:p-8 lg:p-10">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                <ShieldCheck aria-hidden="true" size={23} />
              </div>

              <div>
                <h2 className="text-2xl font-black tracking-[-0.025em] text-[#2D1736]">
                  Important information
                </h2>

                <p className="mt-3 leading-7 text-[#6F6474]">
                  This website supports enquiries and school visits. Final
                  admission conditions are governed by the documents and
                  policies provided directly by the centre.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-10 space-y-6">
            {sections.map((section, index) => (
              <section
                key={section.title}
                className="rounded-[26px] border border-[#5B2A86]/10 bg-white p-6 shadow-[0_12px_40px_rgba(52,20,68,0.05)] sm:p-8"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3EAF8] text-sm font-black text-[#5B2A86]">
                    {index + 1}
                  </span>

                  <div>
                    <h2 className="text-xl font-black tracking-[-0.02em] text-[#2D1736] sm:text-2xl">
                      {section.title}
                    </h2>

                    <div className="mt-4 space-y-3">
                      {section.content.map((paragraph) => (
                        <p
                          key={paragraph}
                          className="leading-7 text-[#6F6474]"
                        >
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 rounded-[30px] border border-[#F6C84B]/45 bg-[#FFF9E8] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <AlertCircle
                aria-hidden="true"
                size={24}
                className="mt-1 shrink-0 text-[#7A5810]"
              />

              <div>
                <h2 className="text-xl font-black text-[#35240A]">
                  Questions about these terms
                </h2>

                <p className="mt-3 leading-7 text-[#69552B]">
                  Contact the centre directly when you need clarification
                  about admissions, fees, attendance, withdrawal, transport,
                  daycare or any other centre policy.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button
                    href={`tel:${site.phone}`}
                    variant="dark"
                    size="md"
                    leftIcon={<Phone size={17} />}
                  >
                    Call the Centre
                  </Button>

                  <Button
                    href={site.whatsapp}
                    external
                    variant="secondary"
                    size="md"
                    leftIcon={<MessageCircle size={17} />}
                  >
                    WhatsApp
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-[#5B2A86]/10 pt-8 text-center sm:flex-row sm:text-left">
            <div className="flex items-center gap-3 text-sm text-[#6F6474]">
              <Mail aria-hidden="true" size={17} className="text-[#5B2A86]" />

              <a
                href={`mailto:${site.email}`}
                className="font-bold transition-colors hover:text-[#5B2A86]"
              >
                {site.email}
              </a>
            </div>

            <Link
              href="/privacy-policy"
              className="rounded-full px-4 py-2 text-sm font-black text-[#5B2A86] transition-colors hover:bg-[#F3EAF8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            >
              Read our Privacy Policy
            </Link>
          </div>
        </Container>
      </section>
      </main>
    </PageShell>
  );
}
