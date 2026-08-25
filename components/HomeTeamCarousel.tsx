"use client";

import Image from "next/image";
import { ChevronRight, HeartHandshake, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import type { WebsiteTeamMember } from "@/lib/sanity/team";

type HomeTeamCarouselProps = {
  members: WebsiteTeamMember[];
};

const DESKTOP_PAGE_SIZE = 3;
const AUTOPLAY_DELAY_MS = 6200;

function TeamCard({ member }: { member: WebsiteTeamMember }) {
  return (
    <article className="group relative w-full overflow-hidden rounded-[28px] bg-[#EEE7F2] shadow-[0_16px_45px_rgba(45,23,54,0.12)]">
      <div className="relative aspect-[4/5]">
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={member.photoAlt || `${member.name}, ${member.role}`}
            fill
            sizes="(max-width: 1024px) 82vw, 22vw"
            className="object-cover transition-transform duration-700 motion-reduce:transition-none group-hover:scale-[1.018] motion-reduce:group-hover:scale-100"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#F6F0F8] to-[#E8DCEC] text-[#765087]">
            <div className="text-center">
              <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/85 shadow-sm">
                <UserRound aria-hidden="true" size={38} />
              </span>
              <p className="mt-3 text-xs font-black uppercase tracking-[0.12em]">
                Photo coming soon
              </p>
            </div>
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#1E0B27]/92 via-[#1E0B27]/5 to-transparent"
        />
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <HeartHandshake
            aria-hidden="true"
            size={18}
            className="text-[#F6C84B]"
          />
          <h3 className="mt-2 text-lg font-black tracking-[-0.02em]">
            {member.name}
          </h3>
          <p className="mt-1 text-xs font-black uppercase tracking-[0.11em] text-[#F6C84B]">
            {member.role}
          </p>
          {member.programme ? (
            <p className="mt-1 text-xs font-bold text-white/78">
              {member.programme}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function chunkMembers(members: WebsiteTeamMember[]) {
  const pages: WebsiteTeamMember[][] = [];

  for (let index = 0; index < members.length; index += DESKTOP_PAGE_SIZE) {
    pages.push(members.slice(index, index + DESKTOP_PAGE_SIZE));
  }

  return pages;
}

export default function HomeTeamCarousel({
  members,
}: HomeTeamCarouselProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [transitionEnabled, setTransitionEnabled] = useState(true);
  const pages = useMemo(() => chunkMembers(members), [members]);
  const moving = members.length > DESKTOP_PAGE_SIZE;
  const desktopSlides = moving && pages[0] ? [...pages, pages[0]] : pages;

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  useEffect(() => {
    if (!moving || paused || reducedMotion) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setTransitionEnabled(true);
      setPageIndex((current) => current + 1);
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(intervalId);
  }, [moving, paused, reducedMotion]);

  if (!moving) {
    return (
      <div
        className={`grid gap-4 ${
          members.length === 1
            ? "mx-auto max-w-[310px]"
            : members.length === 2
              ? "sm:grid-cols-2"
              : "sm:grid-cols-2 lg:grid-cols-3"
        }`}
      >
        {members.map((member) => (
          <TeamCard key={member._id} member={member} />
        ))}
      </div>
    );
  }

  const slideCount = desktopSlides.length;
  const activePage = pageIndex % pages.length;

  function handleTransitionEnd() {
    if (pageIndex !== pages.length) {
      return;
    }

    setTransitionEnabled(false);
    setPageIndex(0);
    window.setTimeout(() => setTransitionEnabled(true), 50);
  }

  function showNextPage() {
    setTransitionEnabled(true);
    setPageIndex((current) => (current >= pages.length ? 1 : current + 1));
  }

  return (
    <div>
      <div
        aria-label="Featured centre team. Swipe to see more profiles."
        className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-3 no-scrollbar sm:-mx-6 sm:px-6 lg:hidden"
      >
        {members.map((member) => (
          <div
            key={member._id}
            className="w-[82vw] max-w-[310px] shrink-0 snap-start"
          >
            <TeamCard member={member} />
          </div>
        ))}
      </div>

      <div
        className="hidden lg:block"
        role="region"
        aria-roledescription="carousel"
        aria-label="Featured centre team"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocusCapture={() => setPaused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setPaused(false);
          }
        }}
      >
        <div className="overflow-hidden rounded-[30px]">
          <div
            className={
              transitionEnabled
                ? "flex transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                : "flex"
            }
            style={{
              width: `${slideCount * 100}%`,
              transform: `translate3d(-${pageIndex * (100 / slideCount)}%, 0, 0)`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            {desktopSlides.map((page, slideIndex) => (
              <div
                key={`${slideIndex}-${page.map((member) => member._id).join("-")}`}
                className="flex justify-center gap-4"
                style={{ width: `${100 / slideCount}%` }}
                aria-hidden={slideIndex !== activePage}
              >
                {page.map((member) => (
                  <div
                    key={member._id}
                    style={{ flex: "0 0 calc((100% - 2rem) / 3)" }}
                  >
                    <TeamCard member={member} />
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div
            className="flex items-center gap-2"
            aria-label={`Team page ${activePage + 1} of ${pages.length}`}
          >
            {pages.map((page, index) => (
              <span
                key={page[0]?._id ?? index}
                aria-hidden="true"
                className={`h-2 rounded-full transition-[width,background-color] duration-300 motion-reduce:transition-none ${
                  index === activePage
                    ? "w-7 bg-[#5B2A86]"
                    : "w-2 bg-[#D9CBE0]"
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={showNextPage}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#DCCFE4] bg-white px-4 text-xs font-black text-[#5B2A86] shadow-sm transition hover:border-[#BFA8CB] hover:bg-[#FAF7FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            aria-label="Show the next team profiles"
          >
            Next profiles
            <ChevronRight aria-hidden="true" size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
