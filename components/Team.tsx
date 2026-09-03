import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  HeartHandshake,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";

import type { WebsiteTeamMember } from "@/lib/sanity/team";

type TeamProps = {
  members: WebsiteTeamMember[];
};

export default function Team({ members }: TeamProps) {
  if (members.length === 0) {
    return null;
  }

  return (
    <section
      id="team"
      aria-labelledby="team-heading"
      className="relative overflow-hidden bg-[#FBF8FC] py-18 sm:py-22 lg:py-24"
    >
      <div
        aria-hidden="true"
        className="absolute -left-28 top-16 h-72 w-72 rounded-full bg-purple-100/65 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-yellow-100/75 blur-3xl"
      />

      <div className="relative mx-auto max-w-[1480px] px-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#DED0E5] bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#6A328F] shadow-sm">
            <UsersRound aria-hidden="true" size={16} />
            Meet our centre team
          </div>

          <h2
            id="team-heading"
            className="mt-6 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#281036] sm:text-4xl lg:text-5xl"
          >
            Caring educators who help every child feel known
          </h2>

          <p className="mx-auto mt-5 max-w-3xl text-base font-semibold leading-8 text-[#6F6474] sm:text-lg">
            Familiar faces, patient guidance and consistent routines help
            children feel secure enough to participate, communicate and grow.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member) => (
            <article
              key={member._id}
              className="group overflow-hidden rounded-[30px] border border-[#E5D9EA] bg-white shadow-[0_16px_48px_rgba(45,23,54,0.075)] transition duration-300 hover:-translate-y-1 hover:border-[#D3BEDD] hover:shadow-[0_24px_64px_rgba(45,23,54,0.13)]"
            >
              <div className="relative aspect-[4/5] overflow-hidden bg-[#EEE6F2]">
                {member.imageUrl ? (
                  <Image
                    src={member.imageUrl}
                    alt={member.photoAlt || `${member.name}, ${member.role}`}
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-700 motion-reduce:transition-none group-hover:scale-[1.018] motion-reduce:group-hover:scale-100"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-[#F6F0F8] to-[#E7DAEB] text-[#765087]">
                    <div className="text-center">
                      <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-white/85 shadow-sm">
                        <UserRound aria-hidden="true" size={44} />
                      </span>
                      <p className="mt-4 text-xs font-black uppercase tracking-[0.12em]">
                        Photo coming soon
                      </p>
                    </div>
                  </div>
                )}

                <div
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#281036]/45 to-transparent"
                />

                <span className="absolute bottom-4 left-4 rounded-full border border-white/35 bg-white/92 px-3 py-2 text-[0.68rem] font-black uppercase tracking-[0.1em] text-[#5B2A86] shadow-lg backdrop-blur">
                  {member.role}
                </span>
              </div>

              <div className="p-5 sm:p-6">
                <h3 className="text-xl font-black tracking-[-0.025em] text-[#281036]">
                  {member.name}
                </h3>
                {member.programme ||
                member.qualification ||
                member.experience ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[member.programme, member.qualification, member.experience]
                      .filter(Boolean)
                      .map((detail) => (
                        <span
                          key={detail}
                          className="rounded-full bg-[#F4EDF7] px-3 py-1.5 text-[0.68rem] font-black text-[#654074]"
                        >
                          {detail}
                        </span>
                      ))}
                  </div>
                ) : null}
                <p className="mt-3 text-sm font-semibold leading-7 text-[#6F6474]">
                  {member.introduction}
                </p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-5 rounded-[28px] bg-[#2D1736] p-6 text-white shadow-[0_20px_58px_rgba(45,23,54,0.18)] sm:p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#281036]">
              <HeartHandshake aria-hidden="true" size={22} />
            </span>
            <div>
              <h3 className="text-xl font-black">
                Meet the team before making your decision
              </h3>
              <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/72">
                A school visit lets you understand the classroom routine,
                speak with our team and see how children are supported each
                day.
              </p>
            </div>
          </div>

          <Link
            href="/admissions?enquiry=SCHOOL_VISIT#admission-enquiry"
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#F6C84B] px-6 text-sm font-black text-[#281036] transition hover:-translate-y-0.5 hover:bg-[#FFD65F] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/35"
          >
            Book a School Visit
            <ArrowRight aria-hidden="true" size={17} />
          </Link>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-xs font-bold text-[#7B7080]">
          <ShieldCheck aria-hidden="true" size={15} className="text-[#5B2A86]" />
          Team photographs are published with permission and can be updated by
          the centre.
        </p>
      </div>
    </section>
  );
}
