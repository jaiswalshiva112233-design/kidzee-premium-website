import Image from "next/image";
import Link from "next/link";
import { Clock3, Mail, MapPin, Phone } from "lucide-react";

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
        <div className="grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-[1.2fr_0.9fr_0.9fr_1fr]">
          <div>
            <Link
              href="/"
              aria-label="Kidzee Sector 12 Dwarka home"
              className="inline-block"
            >
              <Image
                src="/images/kidzee-logo.png"
                alt="Kidzee Preschool and Daycare Sector 12 Dwarka"
                width={145}
                height={78}
                className="h-auto w-auto rounded-xl bg-white p-2"
              />
            </Link>

            <h2 className="mt-5 text-2xl font-black">
              Kidzee Sector 12, Dwarka
            </h2>

            <p className="mt-4 max-w-md leading-7 text-white/70">
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
              className="mt-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-[#5B2A86] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/40"
            >
              <InstagramIcon />
            </a>
          </div>

          <div>
            <h2 className="mb-5 text-xl font-black">
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
                  className="w-fit text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div>
            <h2 className="mb-5 text-xl font-black">
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
                  className="w-fit text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
                >
                  {programme.title}
                </Link>
              ))}

              <Link
                href="/daycare"
                className="w-fit text-white/70 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
              >
                Daycare till 7:00 PM
              </Link>
            </nav>
          </div>

          <div>
            <h2 className="mb-5 text-xl font-black">
              Visit Us
            </h2>

            <div className="space-y-5 text-sm text-white/75">
              <div className="flex items-start gap-3">
                <MapPin
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={19}
                />

                <address className="not-italic leading-6">
                  {site.address}
                </address>
              </div>

              <a
                href={`tel:${site.phone}`}
                aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
                className="flex w-fit items-center gap-3 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
              >
                <Phone
                  aria-hidden="true"
                  className="shrink-0"
                  size={18}
                />

                <span>{site.phoneDisplay}</span>
              </a>

              <a
                href={`mailto:${site.email}`}
                aria-label={`Email Kidzee Sector 12 Dwarka at ${site.email}`}
                className="flex items-start gap-3 break-all transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
              >
                <Mail
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={18}
                />

                <span>{site.email}</span>
              </a>

              <div className="flex items-start gap-3">
                <Clock3
                  aria-hidden="true"
                  className="mt-0.5 shrink-0"
                  size={18}
                />

                <div className="leading-6">
                  <p>Preschool: 8:30 AM–1:00 PM</p>

                  <p className="mt-1">
                    Daycare: 12:30 PM–7:00 PM
                  </p>

                  <p className="mt-1">
                    Saturday daycare is subject to the current
                    schedule.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>

      <div className="border-t border-white/10">
        <Container>
          <div className="flex flex-col items-center justify-between gap-3 py-5 text-center text-sm text-white/55 md:flex-row">
            <p>
              © {new Date().getFullYear()} Kidzee Sector 12,
              Dwarka. All rights reserved.
            </p>

            <nav
              aria-label="Legal links"
              className="flex flex-wrap items-center justify-center gap-5"
            >
              <Link
                href="/privacy-policy"
                className="transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms"
                className="transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
              >
                Terms &amp; Conditions
              </Link>

              <a
                href="/sitemap.xml"
                className="transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
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