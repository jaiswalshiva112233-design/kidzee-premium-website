import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildSiteContact } from "@/lib/siteContact";
import {
  BadgeCheck,
  MessageCircleMore,
  ShieldCheck,
  Star,
  UsersRound,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getProgrammeRatioSettings } from "@/lib/sanity/programmeSettings";

export default async function TrustBar() {
  const [contactSettings, ratioSettings] = await Promise.all([
    getWebsiteContactSettings(),
    getProgrammeRatioSettings(),
  ]);
  const site = buildSiteContact(contactSettings);
  const visitChecks = [
    {
      icon: BadgeCheck,
      title: "Meet the people",
      text: "Speak with the centre team who will support your child.",
    },
    {
      icon: UsersRound,
      title: "Small groups, closer attention",
      text: `1:${ratioSettings.youngGroupChildrenPerTeacher} in Playgroup and Nursery; 1:${ratioSettings.kindergartenChildrenPerTeacher} in Junior KG and Senior KG.`,
    },
    {
      icon: ShieldCheck,
      title: "Ask what matters",
      text: "Discuss supervision, meals, communication and authorised handover.",
    },
    {
      icon: MessageCircleMore,
      title: "Choose without pressure",
      text: "Get clear answers before deciding on the right programme.",
    },
  ] as const;

  return (
    <section
      aria-labelledby="trust-heading"
      className="relative overflow-hidden bg-[#281034] py-10 text-white sm:py-12 lg:py-14"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-0 h-72 w-72 rounded-full bg-[#5B2A86]/45 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-28 bottom-0 h-64 w-64 rounded-full bg-[#F6C84B]/10 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-7 xl:grid-cols-[0.72fr_1.28fr] xl:items-center xl:gap-12">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#F6C84B]">
              <Star
                aria-hidden="true"
                size={15}
                className="fill-[#F6C84B]"
              />

              Visit before you decide
            </div>

            <h2
              id="trust-heading"
              className="mt-5 text-balance text-3xl font-black leading-tight tracking-[-0.035em] text-white sm:text-4xl"
            >
              A preschool decision should feel clear, not rushed.
            </h2>

            <p className="mt-4 max-w-lg text-base leading-7 text-white/75">
              We welcome families to see the centre, understand the day
              and ask practical questions before making an admission
              decision.
            </p>

            <div className="mt-6">
              <Button
                href={site.googleReviews}
                external
                variant="yellow"
                size="md"
                leftIcon={<Star size={17} />}
                ariaLabel="Read parent reviews for Kidzee Sector 12 Dwarka on Google"
              >
                Read Parent Reviews
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[28px] border border-white/10 bg-white/10">
            {visitChecks.map(({ icon: Icon, title, text }) => (
              <article
                key={title}
                className="bg-[#32163F]/90 p-4 sm:p-6"
              >
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-[#F6C84B]">
                    <Icon
                      aria-hidden="true"
                      size={20}
                      strokeWidth={2.2}
                    />
                  </span>

                  <div>
                    <h3 className="text-base font-black leading-6 text-white">
                      {title}
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-white/[0.68]">
                      {text}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
