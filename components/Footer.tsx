import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { programmes, site } from "@/lib/site";

const quickLinks = [
  { href: "/about", label: "About" },
  { href: "/programmes", label: "Programmes" },
  { href: "/daycare", label: "Daycare" },
  { href: "/admissions", label: "Admissions" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
] as const;

const legalLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Use" },
] as const;

const footerLinkClass =
  "w-fit rounded-sm text-[15px] font-semibold text-white/75 transition-colors hover:text-[#F6C84B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C84B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#281034]";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#281034] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-28 top-16 h-72 w-72 rounded-full bg-[#5B2A86]/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-[#F6C84B]/10 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-12 py-14 sm:py-16 lg:grid-cols-[1.25fr_0.75fr_0.9fr_1.2fr] lg:gap-10 lg:py-20">
          <div>
            <Link
              href="/"
              aria-label="Kidzee Sector 12 Dwarka homepage"
              className="inline-flex rounded-2xl bg-white p-3 shadow-[0_14px_34px_rgba(0,0,0,0.16)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            >
              <Image
                src="/images/kidzee-logo.png"
                alt="Kidzee"
                width={150}
                height={72}
                className="h-[58px] w-auto object-contain"
              />
            </Link>

            <h2 className="mt-6 max-w-sm !text-2xl !font-black !leading-tight !text-white">
              Kidzee Sector 12, Dwarka
            </h2>

            <p className="mt-4 max-w-md text-[15px] leading-7 text-white/75">
              Preschool programmes for children aged 2–6 years, with
              daycare available until 7:00 PM at our Sector 12B,
              Dwarka centre.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href={site.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visit Kidzee Sector 12 Dwarka on Instagram"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:border-[#F6C84B]/40 hover:bg-[#5B2A86] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
              >
                <span aria-hidden="true" className="text-sm font-black">
  IG
</span>
              </a>

              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact Kidzee Sector 12 Dwarka on WhatsApp"
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:-translate-y-0.5 hover:border-[#F6C84B]/40 hover:bg-[#5B2A86] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
              >
                <MessageCircle aria-hidden="true" size={19} />
              </a>
            </div>
          </div>

          <div>
            <h2 className="mb-5 !text-lg !font-black !text-white">
              Explore
            </h2>

            <nav
              aria-label="Footer navigation"
              className="grid gap-3"
            >
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={footerLinkClass}
                >
                  {link.label}
                </Link>
              ))}

              <Link href="/blog" className={footerLinkClass}>
                Parent Resources
              </Link>
            </nav>
          </div>

          <div>
            <h2 className="mb-5 !text-lg !font-black !text-white">
              Programmes
            </h2>

            <nav
              aria-label="Preschool programme links"
              className="grid gap-3"
            >
              {programmes.map((programme) => (
                <Link
                  key={programme.slug}
                  href={`/programmes/${programme.slug}`}
                  className={footerLinkClass}
                >
                  {programme.title}
                  <span className="ml-1 text-xs text-white/50">
                    ({programme.age})
                  </span>
                </Link>
              ))}

              <Link href="/daycare" className={footerLinkClass}>
                Daycare until 7:00 PM
              </Link>
            </nav>
          </div>

          <div>
            <h2 className="mb-5 !text-lg !font-black !text-white">
              Contact
            </h2>

            <div className="space-y-5 text-[15px] text-white/75">
              <a
                href={site.map}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C84B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#281034]"
              >
                <MapPin
                  aria-hidden="true"
                  size={19}
                  className="mt-1 shrink-0 text-[#F6C84B]"
                />

                <address className="not-italic leading-7 transition-colors group-hover:text-white">
                  {site.addressShort}
                </address>
              </a>

              <a
                href={`tel:${site.phone}`}
                aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
                className="flex w-fit items-center gap-3 rounded-lg font-semibold transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C84B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#281034]"
              >
                <Phone
                  aria-hidden="true"
                  size={18}
                  className="shrink-0 text-[#F6C84B]"
                />
                {site.phoneDisplay}
              </a>

              <a
                href={`mailto:${site.email}`}
                aria-label={`Email Kidzee Sector 12 Dwarka at ${site.email}`}
                className="flex items-start gap-3 rounded-lg font-semibold transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C84B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#281034]"
              >
                <Mail
                  aria-hidden="true"
                  size={18}
                  className="mt-1 shrink-0 text-[#F6C84B]"
                />

                <span className="break-all">{site.email}</span>
              </a>

              <div className="flex items-start gap-3">
                <Clock3
                  aria-hidden="true"
                  size={18}
                  className="mt-1 shrink-0 text-[#F6C84B]"
                />

                <div className="leading-7">
                  <p className="!text-white/75">
                    Preschool: {site.preschoolHours.display}
                  </p>
                  <p className="!text-white/75">
                    Daycare: {site.daycareHours.display}
                  </p>
                </div>
              </div>
            </div>

            <Button
              href={site.whatsappVisit}
              external
              variant="yellow"
              size="sm"
              className="mt-7"
              leftIcon={<MessageCircle size={17} />}
            >
              Book a Visit
            </Button>
          </div>
        </div>
      </Container>

      <div className="relative border-t border-white/10">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 py-5 text-center text-sm text-white/60 md:flex-row md:text-left">
            <p className="!text-white/60">
              © {new Date().getFullYear()} Kidzee Sector 12, Dwarka.
              All rights reserved.
            </p>

            <nav
              aria-label="Legal links"
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            >
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-sm font-semibold text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C84B]"
                >
                  {link.label}
                </Link>
              ))}

              <a
                href="/sitemap.xml"
                className="rounded-sm font-semibold text-white/60 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C84B]"
              >
                Sitemap
              </a>
            </nav>
          </div>
        </Container>
      </div>
    </footer>
  );
}