"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck2, Menu, Phone, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { useSiteContact } from "@/components/SiteContactProvider";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Programmes", href: "/programmes" },
  { label: "Daycare", href: "/daycare" },
  { label: "Admissions", href: "/admissions" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
] as const;

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export default function Header() {
  const site = useSiteContact();
  const pathname = usePathname();
  const menuId = useId();

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
    const frame = window.requestAnimationFrame(() => {
      setIsMenuOpen(false);
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) {
      document.body.style.overflow = "";
      delete document.body.dataset.mobileMenuOpen;
      return;
    }

    document.body.style.overflow = "hidden";
    document.body.dataset.mobileMenuOpen = "true";

    const menu = mobileMenuRef.current;
    const firstFocusable = menu?.querySelector<HTMLElement>(focusableSelector);

    window.requestAnimationFrame(() => {
      firstFocusable?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);

        window.requestAnimationFrame(() => {
          menuButtonRef.current?.focus();
        });

        return;
      }

      if (event.key !== "Tab" || !menu) {
        return;
      }

      const focusableElements = Array.from(
        menu.querySelectorAll<HTMLElement>(focusableSelector),
      ).filter((element) => !element.hasAttribute("disabled"));

      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      if (event.shiftKey && activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      delete document.body.dataset.mobileMenuOpen;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  function isActive(href: string) {
    if (href === "/") {
      return pathname === "/";
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function closeMobileMenu() {
    setIsMenuOpen(false);
  }

  function handleMobileMenuKeyDown(
    event: ReactKeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Escape") {
      closeMobileMenu();
      menuButtonRef.current?.focus();
    }
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
          className={`flex items-center justify-between gap-4 transition-[height] duration-300 ${
            isScrolled ? "h-[72px]" : "h-[82px]"
          }`}
        >
          <Link
            href="/"
            aria-label="Kidzee Sector 12 Dwarka homepage"
            onClick={closeMobileMenu}
            className="group flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
          >
            <Image
              src="/images/kidzee-logo.png"
              alt="Kidzee"
              width={146}
              height={72}
              priority
              loading="eager"
              className={`w-auto object-contain transition-all duration-300 ${
                isScrolled ? "h-[47px]" : "h-[53px]"
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
            className="hidden items-center rounded-full border border-[#5B2A86]/10 bg-white/80 p-1 shadow-[0_8px_30px_rgba(48,22,62,0.05)] backdrop-blur-xl xl:flex"
          >
            {navItems.map((item) => {
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-full px-3 py-2 text-[13px] font-black transition-all duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45 ${
                    active
                      ? "bg-[#5B2A86] text-white shadow-[0_8px_20px_rgba(91,42,134,0.18)]"
                      : "text-[#4B3E50] hover:bg-[#5B2A86]/[0.07] hover:text-[#5B2A86]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="hidden items-center gap-2 xl:flex">
            <Button
              href={`tel:${site.phone}`}
              variant="secondary"
              size="sm"
              leftIcon={<Phone size={16} strokeWidth={2.3} />}
              aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
            >
              Call
            </Button>

            <Button
              href="/admissions?enquiry=SCHOOL_VISIT#admission-enquiry"
              variant="primary"
              size="sm"
              leftIcon={<CalendarCheck2 size={16} strokeWidth={2.3} />}
              aria-label="Book a school visit at Kidzee Sector 12 Dwarka"
            >
              Book a Visit
            </Button>
          </div>

          <button
            ref={menuButtonRef}
            type="button"
            aria-label={
              isMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={isMenuOpen}
            aria-controls={menuId}
            onClick={() => setIsMenuOpen((current) => !current)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#5B2A86]/15 bg-white text-[#5B2A86] shadow-[0_8px_24px_rgba(48,22,62,0.08)] transition-colors hover:bg-[#5B2A86]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45 xl:hidden"
          >
            {isMenuOpen ? (
              <X aria-hidden="true" size={22} />
            ) : (
              <Menu aria-hidden="true" size={22} />
            )}
          </button>
        </Container>
      </header>

      {isMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            onClick={() => {
              closeMobileMenu();
              menuButtonRef.current?.focus();
            }}
            className="fixed inset-0 z-40 bg-[#25132D]/40 backdrop-blur-sm xl:hidden"
          />

          <div
            ref={mobileMenuRef}
            id={menuId}
            role="dialog"
            aria-modal="true"
            aria-label="Mobile navigation"
            onKeyDown={handleMobileMenuKeyDown}
            className="fixed inset-x-3 top-[88px] z-50 max-h-[calc(100dvh-108px)] overflow-y-auto rounded-[28px] border border-white/80 bg-white shadow-[0_30px_80px_rgba(39,18,49,0.22)] xl:hidden"
          >
            <div className="p-3">
              <div className="px-3 pb-3 pt-1">
                <div>
                  <p className="text-sm font-black text-[#2D1736]">
                    Kidzee Sector 12, Dwarka
                  </p>

                  <p className="mt-1 text-xs font-bold text-[#6F6474]">
                    Preschool and daycare
                  </p>
                </div>
              </div>

              <nav aria-label="Mobile navigation" className="flex flex-col">
                {navItems.map((item) => {
                  const active = isActive(item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      onClick={closeMobileMenu}
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
                <Button
                  href={`tel:${site.phone}`}
                  variant="secondary"
                  size="md"
                  fullWidth
                  leftIcon={<Phone size={17} />}
                  aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
                >
                  Call
                </Button>

                <Button
                  href="/admissions?enquiry=SCHOOL_VISIT#admission-enquiry"
                  variant="primary"
                  size="md"
                  fullWidth
                  leftIcon={<CalendarCheck2 size={17} />}
                  aria-label="Book a school visit at Kidzee Sector 12 Dwarka"
                >
                  Book a Visit
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : null}
    </>
  );
}
