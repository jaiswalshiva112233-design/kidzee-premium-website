import Link from "next/link";
import { ArrowRight, UsersRound } from "lucide-react";

import HomeTeamCarousel from "@/components/HomeTeamCarousel";
import type {
  WebsiteTeamMember,
  WebsiteTeamMovementSpeed,
} from "@/lib/sanity/team";

type HomeTeamPreviewProps = {
  members: WebsiteTeamMember[];
  movementSpeed: WebsiteTeamMovementSpeed;
};

export default function HomeTeamPreview({
  members,
  movementSpeed,
}: HomeTeamPreviewProps) {
  if (members.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="home-team-heading"
      className="bg-white py-16 sm:py-20"
    >
      <div className="mx-auto grid max-w-[1480px] gap-8 px-4 sm:px-6 lg:grid-cols-[0.38fr_0.62fr] lg:items-center lg:px-8 xl:px-10">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E1D5E7] bg-[#FAF7FC] px-4 py-2 text-xs font-black uppercase tracking-[0.15em] text-[#6A328F]">
            <UsersRound aria-hidden="true" size={16} />
            Familiar faces
          </div>

          <h2
            id="home-team-heading"
            className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#281036] sm:text-4xl lg:text-[2.7rem]"
          >
            Caring educators who know every child
          </h2>

          <p className="mt-5 max-w-xl text-base font-semibold leading-8 text-[#6F6474]">
            Children settle more comfortably when the adults around them are
            patient, familiar and attentive to their individual pace.
          </p>

          <Link
            href="/about#team"
            className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-6 text-sm font-black text-white shadow-[0_14px_34px_rgba(91,42,134,0.2)] transition hover:-translate-y-0.5 hover:bg-[#4B206F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
          >
            Meet Our Team
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        <div data-nosnippet="true">
          <HomeTeamCarousel
            members={members}
            movementSpeed={movementSpeed}
          />
        </div>
      </div>
    </section>
  );
}
