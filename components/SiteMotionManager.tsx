"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function SiteMotionManager() {
  const pathname = usePathname();
  const initialPath = useRef(pathname);
  const popstateNavigation = useRef(false);

  useEffect(() => {
    const markPopstate = () => {
      popstateNavigation.current = true;
    };

    window.addEventListener("popstate", markPopstate);
    return () => window.removeEventListener("popstate", markPopstate);
  }, []);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      return;
    }

    const isInitialRender = initialPath.current === pathname;
    initialPath.current = pathname;

    if (!isInitialRender && !popstateNavigation.current) {
      const hash = window.location.hash;

      window.requestAnimationFrame(() => {
        if (hash) {
          document
            .getElementById(decodeURIComponent(hash.slice(1)))
            ?.scrollIntoView({ block: "start" });
        } else {
          window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        }
      });
    }

    popstateNavigation.current = false;
  }, [pathname]);

  useEffect(() => {
    if (pathname.startsWith("/admin")) {
      return;
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const sections = Array.from(
      document.querySelectorAll<HTMLElement>("[data-site-page] section"),
    );

    if (reducedMotion || !("IntersectionObserver" in window)) {
      sections.forEach((section) => {
        section.dataset.siteReveal = "visible";
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          (entry.target as HTMLElement).dataset.siteReveal = "visible";
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.08,
        rootMargin: "0px 0px -7% 0px",
      },
    );

    sections.forEach((section, index) => {
      section.dataset.siteReveal =
        index === 0 ? "visible" : "pending";
      if (index > 0) observer.observe(section);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
