import Image from "next/image";
import Link from "next/link";
import {
  Clock3,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";

import Container from "@/components/ui/Container";
import { programmes, site } from "@/lib/site";

const quickLinks = [
  {
    href: "/about",
    label: "About Us",
  },
  {
    href: "/programmes",
    label: "Programmes",
  },
  {
    href: "/daycare",
    label: "Daycare",
  },
  {
    href: "/admissions",
    label: "Admissions",
  },
  {
    href: "/gallery",
    label: "Gallery",
  },
  {
    href: "/blog",
    label: "Parent Resources",
  },
  {
    href: "/contact",
    label: "Contact",
  },
];

const instagramUrl =
  "https://www.instagram.com/kidz.eedwarka";

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="19"
      height="19"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="5"
        ry="5"
      />

      <circle cx="12" cy="12" r="4" />

      <circle
        cx="17.5"
        cy="6.5"
        r="1"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#281032] text-white">
      <Container>
        <div className="grid gap-12 py-14 md:grid-cols-2 md:py-16 lg:grid-cols-[1.2fr_0.85fr_0.9fr_1.15fr] lg:gap-10">
          {/* Brand */}
          <div>
            <Link
              href="/"
              aria-label="Kidzee Sector 12 Dwarka home"
              className="inline-block rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/40"
            >
              <Image
                src="/images/kidzee-logo.png"
                alt="Kidzee Preschool and Daycare Sector 12 Dwarka"
                width={145}
                height={78}
                className="h-auto w-auto rounded-xl bg-white p-2"
              />
            </Link>

            <h2 className="mt-5 !text-2xl !font-black !leading-tight !text-white">
              Kidzee Sector 12, Dwarka
            </h2>

            <p className="mt-4 max-w-md text-[15px] leading-7 text-[#EEE5F2]">
              A warm preschool and dependable daycare in Sector
              12B, Dwarka, offering Playgroup, Nursery, Junior KG,
              Senior KG and daycare in a child-friendly learning
              environment.
            </p>

            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Follow Kidzee Sector 12 Dwarka on Instagram"
              className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#5B2A86] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/40"
            >
              <InstagramIcon />
            </a>
          </div>

          {/* Quick links */}
          <div>
            <h2 className="mb-5 !text-xl !font-black !leading-tight !text-white">
              Quick Links
            </h2>

            <nav
              aria-label="Footer quick links"
              className="grid gap-3"
            >
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="w-fit text-[15px] font-medium text-[#EEE5F2] transition-colors hover:text-[#F6C84B] focus-visible:outline-none focus-visible:text-[#F6C84B]"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Programmes */}
          <div>
            <h2 className="mb-5 !text-xl !font-black !leading-tight !text-white">
              Our Programmes
            </h2>

            <nav
              aria-label="Footer programme links"
              className="grid gap-3"
            >
              {programmes.map((programme) => (
                <Link
                  key={programme.slug}
                  href={`/programmes/${programme.slug}`}
                  className="w-fit text-[15px] font-medium text-[#EEE5F2] transition-colors hover:text-[#F6C84B] focus-visible:outline-none focus-visible:text-[#F6C84B]"
                >
                  {programme.title}
                </Link>
              ))}

              <Link
                href="/daycare"
                className="w-fit text-[15px] font-medium text-[#EEE5F2] transition-colors hover:text-[#F6C84B] focus-visible:outline-none focus-visible:text-[#F6C84B]"
              >
                Daycare till 7:00 PM
              </Link>
            </nav>
          </div>

          {/* Visit */}
          <div>
            <h2 className="mb-5 !text-xl !font-black !leading-tight !text-white">
              Visit Us
            </h2>

            <div className="space-y-5 text-[15px] text-[#EEE5F2]">
              <div className="flex items-start gap-3">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[#F6C84B]"
                  size={19}
                />

                <address className="not-italic leading-6">
                  {site.address}
                </address>
              </div>

              <a
                href={`tel:${site.phone}`}
                aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
                className="flex w-fit items-center gap-3 font-medium text-[#EEE5F2] transition-colors hover:text-[#F6C84B] focus-visible:outline-none focus-visible:text-[#F6C84B]"
              >
                <Phone
                  aria-hidden="true"
                  className="shrink-0 text-[#F6C84B]"
                  size={18}
                />

                <span>{site.phoneDisplay}</span>
              </a>

              <a
                href={`mailto:${site.email}`}
                aria-label={`Email Kidzee Sector 12 Dwarka at ${site.email}`}
                className="flex items-start gap-3 break-all font-medium text-[#EEE5F2] transition-colors hover:text-[#F6C84B] focus-visible:outline-none focus-visible:text-[#F6C84B]"
              >
                <Mail
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[#F6C84B]"
                  size={18}
                />

                <span>{site.email}</span>
              </a>

              <div className="flex items-start gap-3">
                <Clock3
                  aria-hidden="true"
                  className="mt-0.5 shrink-0 text-[#F6C84B]"
                  size={18}
                />

                <div className="leading-6">
                  <p className="!text-[#EEE5F2]">
                    Preschool: 8:30 AM–1:00 PM
                  </p>

                  <p className="mt-1 !text-[#EEE5F2]">
                    Daycare: 12:30 PM–7:00 PM
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/15">
        <Container>
          <div className="flex flex-col items-center justify-between gap-4 py-5 text-center text-sm text-[#DCCFE2] md:flex-row md:text-left">
            <p className="!text-[#DCCFE2]">
              © {new Date().getFullYear()} Kidzee Sector 12,
              Dwarka. All rights reserved.
            </p>

            <nav
              aria-label="Legal links"
              className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
            >
              <Link
                href="/privacy-policy"
                className="font-medium text-[#DCCFE2] transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
              >
                Privacy Policy
              </Link>

              <a
                href="/sitemap.xml"
                className="font-medium text-[#DCCFE2] transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
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