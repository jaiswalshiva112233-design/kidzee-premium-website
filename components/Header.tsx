"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, MessageCircle, Phone, X } from "lucide-react";
import { useEffect, useId, useState } from "react";

import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Programmes", href: "/programmes" },
  { label: "Daycare", href: "/daycare" },
  { label: "Admissions", href: "/admissions" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
];

export default function Header() {
  const pathname = usePathname();
  const menuId = useId();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setIsScrolled(window.scrollY > 14);
    }

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
          isScrolled
            ? "border-[#5B2A86]/10 bg-white/95 shadow-[0_14px_40px_rgba(53,25,68,0.08)] backdrop-blur-xl"
            : "border-transparent bg-white/90 backdrop-blur-lg"
        }`}
      >
        <Container
          className={`flex items-center justify-between gap-5 transition-[height] duration-300 ${
            isScrolled ? "h-[72px]" : "h-[82px]"
          }`}
        >
          <Link
            href="/"
            aria-label="Kidzee Sector 12 Dwarka home"
            className="group flex shrink-0 items-center gap-3"
          >
            <Image
              src="/images/kidzee-logo.png"
              alt="Kidzee Preschool and Daycare"
              width={146}
              height={72}
              priority
              className={`w-auto object-contain transition-all duration-300 ${
                isScrolled ? "h-[48px]" : "h-[54px]"
              }`}
            />

            <span
              aria-hidden="true"
              className="hidden h-9 w-px bg-[#5B2A86]/15 sm:block"
            />

            <span className="hidden text-[13px] font-black leading-[1.25] tracking-[-0.01em] text-[#5B2A86] sm:block">
              Sector 12
              <br />
              Dwarka
            </span>
          </Link>

          <nav
            aria-label="Primary navigation"
            className="hidden items-center rounded-full border border-[#5B2A86]/10 bg-white/75 p-1.5 shadow-[0_8px_30px_rgba(48,22,62,0.05)] backdrop-blur lg:flex"
          >
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3.5 py-2 text-[13px] font-black transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45 ${
                    active
                      ? "bg-[#5B2A86] text-white shadow-[0_8px_20px_rgba(91,42,134,0.18)]"
                      : "text-[#4B3C50] hover:bg-[#5B2A86]/[0.07] hover:text-[#5B2A86]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 lg:flex">
            <a
              href={`tel:${site.phone}`}
              aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full border border-[#5B2A86]/15 bg-white px-4 text-sm font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(48,22,62,0.05)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#5B2A86]/25 hover:shadow-[0_12px_28px_rgba(48,22,62,0.1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            >
              <Phone
                aria-hidden="true"
                size={17}
                strokeWidth={2.2}
              />
              Call
            </a>

            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Book a school visit with Kidzee Sector 12 Dwarka on WhatsApp"
              className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-5 text-sm font-black text-white shadow-[0_14px_32px_rgba(91,42,134,0.22)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#4F2376] hover:shadow-[0_18px_38px_rgba(91,42,134,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            >
              <MessageCircle
                aria-hidden="true"
                size={17}
                strokeWidth={2.2}
              />
              Book a Visit
            </a>
          </div>

          <button
            type="button"
            aria-label={
              isMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#5B2A86]/15 bg-white text-[#5B2A86] shadow-[0_8px_24px_rgba(48,22,62,0.08)] transition-colors hover:bg-[#5B2A86]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45 lg:hidden"
          >
            {isMenuOpen ? (
              <X aria-hidden="true" size={22} />
            ) : (
              <Menu aria-hidden="true" size={22} />
            )}
          </button>
        </Container>
      </header>

      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={() => setIsMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-[#25132D]/35 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isMenuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
      />

      <div
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation"
        className={`fixed inset-x-3 top-[88px] z-50 max-h-[calc(100dvh-108px)] overflow-y-auto rounded-[28px] border border-white/80 bg-white shadow-[0_30px_80px_rgba(39,18,49,0.22)] transition-all duration-300 lg:hidden ${
          isMenuOpen
            ? "translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <div className="p-3">
          <nav
            aria-label="Mobile navigation"
            className="flex flex-col"
          >
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-[50px] items-center rounded-2xl px-4 text-[15px] font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45 ${
                    active
                      ? "bg-[#5B2A86] text-white"
                      : "text-[#3F3145] hover:bg-[#5B2A86]/[0.06] hover:text-[#5B2A86]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-[#5B2A86]/10 pt-3">
            <a
              href={`tel:${site.phone}`}
              aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl border border-[#5B2A86]/15 bg-white px-4 text-sm font-black text-[#5B2A86] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            >
              <Phone aria-hidden="true" size={17} />
              Call
            </a>

            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with Kidzee Sector 12 Dwarka on WhatsApp"
              className="inline-flex min-h-[50px] items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-4 text-sm font-black text-white shadow-[0_12px_28px_rgba(91,42,134,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            >
              <MessageCircle aria-hidden="true" size={17} />
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </>
  );
}