"use client";

import Image from "next/image";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";
import { useEffect, useState } from "react";

export type HeroSlide = {
  id: string;
  src: string;
  alt: string;
};

type HeroSlideshowProps = {
  slides: HeroSlide[];
  autoRotate: boolean;
  rotationIntervalSeconds: number;
};

function shouldSkipImageOptimisation(source: string) {
  return (
    source.startsWith("http") &&
    !source.includes("cdn.sanity.io")
  );
}

export default function HeroSlideshow({
  slides,
  autoRotate,
  rotationIntervalSeconds,
}: HeroSlideshowProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] =
    useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const hasMultipleSlides = slides.length > 1;
  const autoplayPaused =
    !autoRotate || userPaused || interactionPaused || reducedMotion;
  const visibleIndex = slides.length > 0 ? activeIndex % slides.length : 0;

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );

    const updatePreference = () => {
      setReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  useEffect(() => {
    if (!hasMultipleSlides || autoplayPaused) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveIndex((current) =>
        (current + 1) % slides.length,
      );
    }, rotationIntervalSeconds * 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [
    autoplayPaused,
    hasMultipleSlides,
    rotationIntervalSeconds,
    slides.length,
  ]);

  function showPrevious() {
    setActiveIndex((current) =>
      current % slides.length === 0 ? slides.length - 1 : (current % slides.length) - 1,
    );
  }

  function showNext() {
    setActiveIndex((current) =>
      (current + 1) % slides.length,
    );
  }

  if (slides.length === 0) {
    return null;
  }

  return (
    <div
      className="group relative overflow-hidden rounded-[30px] border-[8px] border-white bg-[#EEE7F1] shadow-[0_30px_80px_rgba(40,16,52,0.17)] sm:rounded-[36px] sm:border-[10px]"
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocusCapture={() => setInteractionPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setInteractionPaused(false);
        }
      }}
      aria-roledescription="carousel"
      aria-label="Life at Kidzee Sector 12, Dwarka"
    >
      <div className="relative aspect-[5/4] w-full sm:aspect-[16/10] lg:aspect-[4/3]">
        {slides.map((slide, index) => {
          const active = index === visibleIndex;

          return (
            <div
              key={slide.id}
              className={[
                "absolute inset-0 transition-opacity duration-500 ease-out",
                active ? "z-10 opacity-100" : "z-0 opacity-0",
              ].join(" ")}
              aria-hidden={!active}
            >
              <Image
                src={slide.src}
                alt={active ? slide.alt : ""}
                fill
                preload={index === 0}
                unoptimized={shouldSkipImageOptimisation(slide.src)}
                sizes="(max-width: 640px) 92vw, (max-width: 1024px) 88vw, 52vw"
                className="object-cover object-center"
              />
            </div>
          );
        })}

        {hasMultipleSlides ? (
          <>
            <button
              type="button"
              onClick={showPrevious}
              className="absolute left-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-[#281036]/45 text-white opacity-0 shadow-md backdrop-blur-sm transition hover:bg-[#281036]/70 group-hover:opacity-70 focus-visible:flex focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
              aria-label="Show previous photograph"
            >
              <ChevronLeft aria-hidden="true" size={17} />
            </button>

            <button
              type="button"
              onClick={showNext}
              className="absolute right-3 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/35 bg-[#281036]/45 text-white opacity-0 shadow-md backdrop-blur-sm transition hover:bg-[#281036]/70 group-hover:opacity-70 focus-visible:flex focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:flex"
              aria-label="Show next photograph"
            >
              <ChevronRight aria-hidden="true" size={17} />
            </button>

            <div className="absolute inset-x-0 bottom-2.5 z-20 flex items-center justify-center px-3 sm:bottom-3">
              <div className="flex items-center gap-1 rounded-full border border-white/20 bg-[#281036]/35 px-2 py-1 text-white opacity-50 shadow-sm backdrop-blur-sm transition hover:opacity-95 group-focus-within:opacity-100 group-hover:opacity-80">
                <div
                  className="flex items-center gap-1"
                  aria-label={`Photograph ${visibleIndex + 1} of ${slides.length}`}
                >
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => setActiveIndex(index)}
                      className={[
                        "h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                        index === visibleIndex
                          ? "w-4 bg-[#F6C84B]"
                          : "w-1.5 bg-white/65 hover:bg-white",
                      ].join(" ")}
                      aria-label={`Show photograph ${index + 1}`}
                      aria-current={
                        index === visibleIndex ? "true" : undefined
                      }
                    />
                  ))}
                </div>

                {autoRotate ? (
                  <button
                    type="button"
                    onClick={() => setUserPaused((current) => !current)}
                    className="ml-0.5 flex h-5 w-5 items-center justify-center rounded-full opacity-45 transition hover:bg-white/15 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                    aria-label={
                      userPaused
                        ? "Resume automatic photographs"
                        : "Pause automatic photographs"
                    }
                  >
                    {userPaused ? (
                      <Play aria-hidden="true" size={10} />
                    ) : (
                      <Pause aria-hidden="true" size={10} />
                    )}
                  </button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
