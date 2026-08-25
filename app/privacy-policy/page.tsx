import type { Metadata } from "next";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildSiteContact } from "@/lib/siteContact";
import {
  ArrowRight,
  CheckCircle2,
  Database,
  ExternalLink,
  FileText,
  LockKeyhole,
  Mail,
  MessageCircle,
  Phone,
  ShieldCheck,
  Trash2,
  UserRoundCheck,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Read the privacy policy for the Kidzee Sector 12, Dwarka website, including how admission enquiries, contact details and website information are handled.",
  alternates: {
    canonical: "/privacy-policy",
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Privacy Policy | Kidzee Sector 12, Dwarka",
    description:
      "Information about how personal details submitted through the Kidzee Sector 12, Dwarka website are collected, used and protected.",
    url: "/privacy-policy",
    type: "website",
  },
};

const sections = [
  {
    id: "information-we-collect",
    title: "1. Information we may collect",
    icon: Database,
  },
  {
    id: "how-we-use-information",
    title: "2. How we use your information",
    icon: UserRoundCheck,
  },
  {
    id: "child-information",
    title: "3. Information about children",
    icon: ShieldCheck,
  },
  {
    id: "sharing-information",
    title: "4. Sharing of information",
    icon: LockKeyhole,
  },
  {
    id: "third-party-services",
    title: "5. Third-party services",
    icon: ExternalLink,
  },
  {
    id: "data-retention",
    title: "6. Data retention",
    icon: FileText,
  },
  {
    id: "your-choices",
    title: "7. Your choices and requests",
    icon: Trash2,
  },
];

export default async function PrivacyPage() {
  const site = buildSiteContact(await getWebsiteContactSettings());
  return (
    <PageShell>
      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative bg-[linear-gradient(135deg,#faf7ff_0%,#ffffff_54%,#fff7d7_100%)] pb-16 pt-[104px] sm:pb-20 sm:pt-28 lg:pb-24 lg:pt-32">
          <div className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-purple-200/35 blur-3xl" />
          <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-yellow-200/40 blur-3xl" />

          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              <span className="eyebrow">Website information</span>

              <h1 className="title mt-5">Privacy Policy</h1>

              <p className="lead mx-auto mt-6 max-w-3xl">
                This policy explains what information may be collected through
                the Kidzee Sector 12, Dwarka website and how that information
                may be used, stored and protected.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/90 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">
                  <ShieldCheck size={15} className="text-purple-700" />
                  Last updated: 29 July 2026
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white/90 px-4 py-2 text-xs font-bold text-slate-700 shadow-sm">
                  <LockKeyhole size={15} className="text-purple-700" />
                  Applies to website enquiries
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Policy Content */}
        <section className="section bg-white">
          <div className="container">
            <div className="grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-14">
              {/* Table of Contents */}
              <aside className="lg:sticky lg:top-28 lg:self-start">
                <div className="rounded-[30px] border border-purple-100 bg-[#faf8ff] p-6">
                  <p className="text-sm font-black uppercase tracking-[0.14em] text-purple-800">
                    On this page
                  </p>

                  <nav className="mt-5 grid gap-2">
                    {sections.map((section) => {
                      const Icon = section.icon;

                      return (
                        <a
                          key={section.id}
                          href={`#${section.id}`}
                          className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-bold leading-6 text-slate-700 transition hover:bg-white hover:text-purple-800"
                        >
                          <Icon
                            size={17}
                            className="shrink-0 text-purple-700"
                          />
                          {section.title}
                        </a>
                      );
                    })}
                  </nav>
                </div>

                <div className="mt-5 rounded-[30px] bg-purple-950 p-6 text-white">
                  <Mail size={24} className="text-yellow-300" />

                  <h2 className="mt-4 text-lg font-black">
                    Privacy-related question?
                  </h2>

                  <p className="mt-3 text-sm leading-7 text-purple-100">
                    Contact the centre if you want to review, correct or request
                    deletion of information submitted through this website.
                  </p>

                  <a
                    href={`mailto:${site.email}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-black text-yellow-300"
                  >
                    Email the centre
                    <ArrowRight size={16} />
                  </a>
                </div>
              </aside>

              {/* Main Article */}
              <article className="min-w-0">
                <div className="rounded-[34px] border border-purple-100 bg-white p-7 shadow-sm sm:p-9 lg:p-12">
                  <div className="border-b border-purple-100 pb-8">
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
                      <FileText size={26} />
                    </span>

                    <h2 className="mt-6 text-3xl font-black leading-tight text-slate-950">
                      About this privacy policy
                    </h2>

                    <p className="mt-5 text-base leading-8 text-slate-600">
                      This website represents Kidzee Preschool &amp; Daycare,
                      Sector 12, Dwarka. The website allows parents and
                      guardians to learn about our programmes, request
                      information, enquire about admissions and daycare, and
                      contact the centre.
                    </p>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      By submitting information through an enquiry form,
                      WhatsApp link, email or another contact option provided on
                      this website, you acknowledge that the centre may use the
                      information to respond to your request.
                    </p>
                  </div>

                  <section
                    id="information-we-collect"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      1. Information we may collect
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      When you submit an admission, daycare, trial-class or
                      school-visit enquiry, we may collect information such as:
                    </p>

                    <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                      {[
                        "Parent or guardian name",
                        "Phone or WhatsApp number",
                        "Email address",
                        "Child’s name",
                        "Child’s age or date of birth",
                        "Programme preference",
                        "Daycare requirement",
                        "Preferred visit or contact time",
                        "Transport location or locality",
                        "Any message included with the enquiry",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 rounded-2xl bg-[#faf8ff] px-4 py-4"
                        >
                          <CheckCircle2
                            size={18}
                            className="mt-0.5 shrink-0 text-purple-700"
                          />
                          <span className="text-sm font-semibold leading-6 text-slate-700">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <p className="mt-6 text-base leading-8 text-slate-600">
                      The website may also receive basic technical information
                      automatically, such as browser type, device type, pages
                      visited, approximate location, referral source and
                      interaction data. This information may be generated by
                      hosting, security, analytics or advertising services
                      connected to the website.
                    </p>
                  </section>

                  <section
                    id="how-we-use-information"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      2. How we use your information
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Information submitted through the website may be used to:
                    </p>

                    <ul className="mt-5 grid gap-4">
                      {[
                        "Respond to preschool, daycare or admission enquiries.",
                        "Contact parents or guardians by phone, WhatsApp or email.",
                        "Arrange school visits and trial classes.",
                        "Explain programmes, fees, timings, meals and transport availability.",
                        "Follow up on an enquiry or admission request.",
                        "Maintain internal enquiry and admission records.",
                        "Improve the website, advertising and enquiry experience.",
                        "Protect the website from spam, misuse and security threats.",
                        "Meet applicable legal, regulatory or record-keeping obligations.",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-base leading-8 text-slate-600"
                        >
                          <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <div className="mt-7 rounded-[26px] border border-yellow-200 bg-[#fff9e7] p-6">
                      <p className="font-black text-slate-950">
                        We do not sell enquiry information.
                      </p>

                      <p className="mt-2 text-sm leading-7 text-slate-700">
                        Personal information submitted through this website is
                        not sold or rented to unrelated businesses for their
                        independent marketing.
                      </p>
                    </div>
                  </section>

                  <section
                    id="child-information"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      3. Information about children
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      This website is intended primarily for use by parents and
                      legal guardians. Children should not independently submit
                      personal information through the website.
                    </p>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Details about a child, such as name, age, programme
                      requirement or care needs, should be provided only by a
                      parent, legal guardian or another authorised adult.
                    </p>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Please avoid submitting sensitive medical, legal, custody
                      or identification documents through a general website
                      enquiry form. Contact the centre directly if such
                      information is required during the formal admission
                      process.
                    </p>
                  </section>

                  <section
                    id="sharing-information"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      4. Sharing of information
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Information may be accessible to authorised centre staff
                      who need it to respond to an enquiry, arrange a visit or
                      complete an admission-related process.
                    </p>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Limited information may also be processed by service
                      providers supporting the website, including hosting,
                      website forms, email delivery, analytics, security,
                      advertising and communication platforms.
                    </p>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Information may be disclosed where reasonably necessary
                      to comply with applicable law, respond to a lawful request,
                      protect the safety of a child or another person, prevent
                      fraud, or protect the centre’s legal rights.
                    </p>
                  </section>

                  <section
                    id="third-party-services"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      5. Third-party services and links
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      This website may include links, embedded content or
                      buttons connected to third-party services such as:
                    </p>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                      {[
                        "WhatsApp",
                        "Google Maps",
                        "Google services",
                        "Instagram",
                        "Facebook",
                        "YouTube",
                        "Website hosting services",
                        "Analytics or advertising platforms",
                      ].map((item) => (
                        <div
                          key={item}
                          className="flex items-center gap-3 rounded-2xl border border-purple-100 px-4 py-4"
                        >
                          <ExternalLink
                            size={17}
                            className="shrink-0 text-purple-700"
                          />
                          <span className="text-sm font-bold text-slate-700">
                            {item}
                          </span>
                        </div>
                      ))}
                    </div>

                    <p className="mt-6 text-base leading-8 text-slate-600">
                      These services operate under their own privacy policies
                      and terms. The centre does not control how an external
                      platform processes information after you leave this
                      website or interact directly with that service.
                    </p>
                  </section>

                  <section
                    id="cookies"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      Cookies and website technologies
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      The website and connected services may use cookies,
                      pixels, tags or similar technologies to support website
                      functionality, remember preferences, measure visits,
                      understand traffic and evaluate advertising performance.
                    </p>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      You can manage or block cookies through your browser
                      settings. Blocking certain cookies may affect some
                      website features.
                    </p>
                  </section>

                  <section
                    id="data-security"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      Data security
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Reasonable administrative and technical measures are used
                      to protect information against unauthorised access, loss,
                      misuse or disclosure. However, no website, email system or
                      online transmission method can be guaranteed to be
                      completely secure.
                    </p>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Parents should avoid sending passwords, bank details,
                      government identification numbers or highly sensitive
                      documents through ordinary enquiry forms, WhatsApp or
                      unencrypted email unless specifically requested through
                      an appropriate admission process.
                    </p>
                  </section>

                  <section
                    id="data-retention"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      6. Data retention
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Enquiry information may be retained for as long as
                      reasonably required to respond, follow up, manage
                      admission records, resolve concerns, maintain security or
                      meet legal and operational requirements.
                    </p>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      Information that is no longer reasonably required may be
                      deleted, anonymised or securely archived, subject to
                      applicable record-keeping requirements.
                    </p>
                  </section>

                  <section
                    id="your-choices"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      7. Your choices and requests
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      A parent or guardian may contact the centre to:
                    </p>

                    <ul className="mt-5 grid gap-4">
                      {[
                        "Ask what enquiry information is held about them.",
                        "Request correction of inaccurate contact information.",
                        "Withdraw from admission-related marketing follow-ups.",
                        "Request deletion of enquiry information where retention is no longer necessary.",
                        "Raise a concern about how information has been handled.",
                      ].map((item) => (
                        <li
                          key={item}
                          className="flex items-start gap-3 text-base leading-8 text-slate-600"
                        >
                          <CheckCircle2
                            size={19}
                            className="mt-1 shrink-0 text-purple-700"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>

                    <p className="mt-5 text-base leading-8 text-slate-600">
                      Before acting on a request, the centre may ask for
                      reasonable information to verify the identity and
                      authority of the person making the request.
                    </p>
                  </section>

                  <section
                    id="policy-updates"
                    className="scroll-mt-28 border-b border-purple-100 py-9"
                  >
                    <h2 className="text-2xl font-black text-slate-950">
                      Changes to this policy
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      This privacy policy may be updated when the website,
                      enquiry process, service providers or applicable
                      requirements change.
                    </p>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      The latest version will be published on this page with an
                      updated revision date.
                    </p>
                  </section>

                  <section id="contact" className="scroll-mt-28 pt-9">
                    <h2 className="text-2xl font-black text-slate-950">
                      Contact us
                    </h2>

                    <p className="mt-4 text-base leading-8 text-slate-600">
                      For privacy-related questions, corrections or deletion
                      requests, contact Kidzee Preschool &amp; Daycare, Sector
                      12, Dwarka.
                    </p>

                    <div className="mt-7 grid gap-4 sm:grid-cols-2">
                      <a
                        href={`mailto:${site.email}`}
                        className="group rounded-[26px] border border-purple-100 bg-[#faf8ff] p-5 transition hover:bg-purple-50"
                      >
                        <Mail
                          size={22}
                          className="text-purple-700"
                        />

                        <p className="mt-4 text-sm font-black text-slate-950">
                          Email
                        </p>

                        <p className="mt-1 break-all text-sm leading-6 text-slate-600">
                          {site.email}
                        </p>
                      </a>

                      <a
                        href={`tel:${site.phone}`}
                        className="group rounded-[26px] border border-purple-100 bg-[#faf8ff] p-5 transition hover:bg-purple-50"
                      >
                        <Phone
                          size={22}
                          className="text-purple-700"
                        />

                        <p className="mt-4 text-sm font-black text-slate-950">
                          Phone
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-600">
                          {site.phoneDisplay}
                        </p>
                      </a>
                    </div>

                    <div className="mt-7 rounded-[28px] border border-yellow-200 bg-[#fff9e7] p-6">
                      <p className="text-sm font-black uppercase tracking-[0.13em] text-purple-800">
                        Centre address
                      </p>

                      <p className="mt-3 text-base leading-8 text-slate-700">
                        {site.address}
                      </p>
                    </div>
                  </section>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Final Contact Section */}
        <section className="section bg-[#faf8ff]">
          <div className="container">
            <div className="overflow-hidden rounded-[40px] bg-[linear-gradient(135deg,#5b2a86_0%,#3b145f_100%)] px-7 py-10 text-white sm:px-10 sm:py-12 lg:px-14">
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
                <div>
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-yellow-300">
                    Need help with your information?
                  </span>

                  <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight sm:text-4xl">
                    Contact the centre with your privacy request.
                  </h2>

                  <p className="mt-4 max-w-2xl text-base leading-8 text-purple-100">
                    Include the phone number or email address used in your
                    enquiry so that the centre can identify the relevant record.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                  <a
                    href={`mailto:${site.email}?subject=Website%20Privacy%20Request`}
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-yellow-300 px-7 py-3.5 text-sm font-black text-purple-950 transition hover:bg-yellow-200"
                  >
                    <Mail size={17} />
                    Send Privacy Request
                  </a>

                  <a
                    href={`${site.whatsappBase}?text=${encodeURIComponent("Hello Kidzee Sector 12 Dwarka, I have a question about information submitted through your website.")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-7 py-3.5 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    <MessageCircle size={17} />
                    Contact on WhatsApp
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 text-sm font-black text-purple-700 transition hover:text-purple-900"
              >
                Visit the contact page
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
