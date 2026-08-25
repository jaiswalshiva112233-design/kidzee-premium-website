import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildSiteContact } from "@/lib/siteContact";
import {
  Clock3,
  MapPin,
  Navigation,
  Phone,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";


export default async function Location() {
  const site = buildSiteContact(
    await getWebsiteContactSettings(),
  );
  const timings = [
    { label: "Preschool", value: site.preschoolHours.display },
    { label: "Daycare", value: site.daycareHours.display },
  ];
  return (
    <section
      id="location"
      aria-labelledby="location-heading"
      className="relative overflow-hidden bg-white py-14 sm:py-16 lg:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-[#EADDF1]/65 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 bottom-10 h-96 w-96 rounded-full bg-[#F6C84B]/15 blur-3xl"
      />

      <Container className="relative">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end lg:gap-12">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#E4D8EA] bg-[#F8F4FC] px-4 py-2 text-[13px] font-black text-[#5B2A86]">
              <MapPin aria-hidden="true" size={16} />
              Visit our centre
            </div>

            <h2
              id="location-heading"
              className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
            >
              Kidzee Preschool in Sector 12B, Dwarka.
            </h2>
          </div>

          <p className="max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg lg:justify-self-end">
            Plan a visit to see the classrooms and indoor play spaces,
            meet the centre team and discuss the right preschool or
            daycare routine for your child.
          </p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-[34px] border border-[#E4D8EA] bg-white shadow-[0_24px_70px_rgba(52,20,68,0.1)] lg:grid-cols-[0.82fr_1.18fr]">
          <div className="bg-[#281034] p-6 text-white sm:p-8 lg:p-10">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#F6C84B]">
              <MapPin aria-hidden="true" size={23} />
            </span>

            <p className="mt-6 text-xs font-black uppercase tracking-[0.14em] text-[#F6C84B]">
              Complete address
            </p>

            <address className="mt-2 not-italic text-xl font-black leading-8 text-white">
              {site.address}
            </address>

            <div className="mt-7 border-t border-white/12 pt-7">
              <div className="flex items-center gap-2.5">
                <Clock3
                  aria-hidden="true"
                  size={19}
                  className="text-[#F6C84B]"
                />

                <h3 className="font-black text-white">
                  Monday to Friday timings
                </h3>
              </div>

              <dl className="mt-4 space-y-3">
                {timings.map((timing) => (
                  <div
                    key={timing.label}
                    className="flex flex-col justify-between gap-1 rounded-2xl bg-white/[0.07] px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                  >
                    <dt className="text-sm font-bold text-white/70">
                      {timing.label}
                    </dt>

                    <dd className="text-sm font-black text-white">
                      {timing.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button
                href={site.map}
                external
                variant="yellow"
                size="md"
                leftIcon={<Navigation size={18} />}
                className="w-full sm:w-auto"
                ariaLabel="Get directions to Kidzee Sector 12 Dwarka"
              >
                Get Directions
              </Button>

              <Button
                href={"tel:" + site.phone}
                variant="secondary"
                size="md"
                leftIcon={<Phone size={18} />}
                className="w-full border-white/20 bg-white/10 text-white hover:border-white/30 hover:bg-white/15 hover:text-white sm:w-auto"
                ariaLabel={
                  "Call admissions at " + site.phoneDisplay
                }
              >
                Call Admissions
              </Button>
            </div>
          </div>

          <div className="relative min-h-[430px] bg-[#F3EAF8] lg:min-h-[600px]">
            <iframe
              title="Map showing Kidzee Preschool and Daycare Sector 12B Dwarka"
              src={site.mapEmbed}
              className="absolute inset-0 h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
