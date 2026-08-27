"use client";

import Image from "next/image";
import { HeartHandshake, UserRound } from "lucide-react";
import type { CSSProperties } from "react";

import type {
  WebsiteTeamMember,
  WebsiteTeamMovementSpeed,
} from "@/lib/sanity/team";

type HomeTeamCarouselProps = {
  members: WebsiteTeamMember[];
  movementSpeed: WebsiteTeamMovementSpeed;
};

const DESKTOP_PAGE_SIZE = 3;
const speedDurations: Record<WebsiteTeamMovementSpeed, string> = {
  SLOW: "48s",
  NORMAL: "34s",
  FAST: "24s",
};

function TeamCard({ member }: { member: WebsiteTeamMember }) {
  return (
    <article className="group relative w-full overflow-hidden rounded-[28px] bg-[#EEE7F2] shadow-[0_16px_45px_rgba(45,23,54,0.12)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_22px_58px_rgba(45,23,54,0.16)] motion-reduce:transform-none motion-reduce:transition-none">
      <div className="relative aspect-[4/5]">
        {member.imageUrl ? (
          <Image
            src={member.imageUrl}
            alt={member.photoAlt || `${member.name}, ${member.role}`}
            fill
            sizes="(max-width: 640px) 72vw, (max-width: 1024px) 42vw, 22vw"
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

export default function HomeTeamCarousel({
  members,
  movementSpeed,
}: HomeTeamCarouselProps) {
  const moving = members.length > DESKTOP_PAGE_SIZE;

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

  const repeatedMembers = [...members, ...members];
  const marqueeStyle = {
    "--team-marquee-duration": speedDurations[movementSpeed],
  } as CSSProperties;

  return (
    <div
      className="team-marquee"
      style={marqueeStyle}
      role="region"
      aria-label="Featured centre team"
    >
      <div className="team-marquee-track">
        {repeatedMembers.map((member, index) => (
          <div
            key={`${member._id}-${index}`}
            className="team-marquee-card"
            aria-hidden={index >= members.length}
          >
            <TeamCard member={member} />
          </div>
        ))}
      </div>
    </div>
  );
}
