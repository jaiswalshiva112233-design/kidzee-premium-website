import Image from "next/image";
import Link from "next/link";
import {
  Check,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
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

const trustPoints = [
  "3-day trial available",
  "Daycare until 7:00 PM",
  "Playgroup to Senior KG",
] as const;

const footerLinkClass =
  "w-fit rounded-sm text-[15px] font-semibold text-white/75 transition-colors hover:text-[#F6C84B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C84B] focus-visible:ring-offset-4 focus-visible:ring-offset-[#281034]";

const socialLinkClass =
  "group inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white shadow-[0_10px_28px_rgba(0,0,0,0.14)] transition duration-200 hover:-translate-y-0.5 hover:border-[#F6C84B]/50 hover:bg-[#5B2A86] hover:shadow-[0_14px_34px_rgba(0,0,0,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45";

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      className="transition-transform duration-200 group-hover:scale-105"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.9"
      />

      <circle
        cx="12"
        cy="12"
        r="4"
        stroke="currentColor"
        strokeWidth="1.9"
      />

      <circle cx="17.4" cy="6.7" r="1.1" fill="currentColor" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      className="transition-transform duration-200 group-hover:scale-105"
    >
      <path
        d="M20.5 11.7a8.45 8.45 0 0 1-12.56 7.37L3.5 20.5l1.45-4.3A8.47 8.47 0 1 1 20.5 11.7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8.4 7.65c.2-.46.42-.47.73-.48h.62c.2 0 .4.07.52.4l.78 1.88c.1.25.06.45-.08.65l-.62.82c-.14.18-.14.35-.02.55.62 1.06 1.52 1.92 2.62 2.48.2.1.38.08.53-.1l.78-.95c.17-.2.37-.24.62-.14l1.8.85c.28.13.43.28.45.5.02.22-.08 1.32-.63 1.83-.54.5-1.24.75-2.08.62-1.05-.16-2.26-.56-3.74-1.65-1.16-.85-2.25-1.99-3.02-3.22-.63-1-.93-1.91-.83-2.7.07-.57.33-.98.56-1.38Z"
        fill="currentColor"
      />
    </svg>
  );
}

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

            <h2 className="mt-6 max-w-sm text-2xl font-black leading-tight text-white">
              {site.shortName}
            </h2>

            <p className="mt-4 max-w-md text-[15px] leading-7 text-white/75">
              Kidzee Sector 12, Dwarka offers play-based preschool and daycare
              for children aged 2–6 years in a safe, caring and engaging
              learning environment.
            </p>

            <ul className="mt-6 space-y-3">
              {trustPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-center gap-3 text-sm font-semibold text-white/75"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F6C84B] text-[#281034]">
                    <Check
                      aria-hidden="true"
                      size={14}
                      strokeWidth={3}
                    />
                  </span>

                  {point}
                </li>
              ))}
            </ul>

            <div className="mt-7 flex flex-wrap gap-3">
              {site.instagram && (
                <a
                  href={site.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Kidzee Sector 12 Dwarka on Instagram"
                  className={socialLinkClass}
                >
                  <InstagramIcon />
                </a>
              )}

              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Contact Kidzee Sector 12 Dwarka on WhatsApp"
                className={socialLinkClass}
              >
                <WhatsAppIcon />
              </a>

              <a
                href={site.googleReviews}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Read Kidzee Sector 12 Dwarka Google Reviews"
                className={socialLinkClass}
              >
                <Star
                  size={20}
                  className="fill-[#F6C84B] text-[#F6C84B] transition-transform duration-200 group-hover:scale-105"
                />
              </a>
            </div>

            <p className="mt-4 text-sm font-semibold text-white/70">
              ⭐ Read what local parents say on Google
            </p>
          </div>
                    <div>
            <h2 className="mb-5 !text-lg !font-black !text-white">
              Explore
            </h2>

            <nav aria-label="Footer navigation" className="grid gap-3">
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
  Parent Blog
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

                <div className="space-y-2 leading-7">
                  <p className="!text-white/75">
                    <span className="font-semibold text-white">
                      Playgroup &amp; Nursery:
                    </span>
                    <br />
                    9:30 AM – 12:30 PM
                  </p>

                  <p className="!text-white/75">
                    <span className="font-semibold text-white">
                      Junior KG &amp; Senior KG:
                    </span>
                    <br />
                    9:30 AM – 1:00 PM
                  </p>

                  <p className="!text-white/75">
                    <span className="font-semibold text-white">
                      Daycare:
                    </span>
                    <br />
                    12:30 PM – 7:00 PM
                  </p>

                  <p className="!text-white/75">
                    <span className="font-semibold text-white">
                      Office Hours:
                    </span>
                    <br />
                    8:30 AM – 5:00 PM
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                href={site.whatsappVisit}
                external
                variant="yellow"
                size="sm"
                leftIcon={<MessageCircle size={17} />}
              >
                Book a Visit
              </Button>

              <a
                href={`tel:${site.phone}`}
                aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:border-[#F6C84B]/70 hover:bg-white/15 hover:text-[#F6C84B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
              >
                <Phone aria-hidden="true" size={17} />
                Call Now
              </a>
            </div>
          </div>
        </div>
      </Container>

      <div className="relative border-t border-white/10">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 py-5 text-center text-sm text-white/60 md:flex-row md:text-left">
            <p className="!text-white/60">
  © {new Date().getFullYear()} {site.shortName}. All rights reserved.
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