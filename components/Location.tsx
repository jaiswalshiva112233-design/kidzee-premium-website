import {
  Clock3,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

export default function Location() {
  const mapEmbedUrl =
    "https://www.google.com/maps?q=Kidzee%20Sector%2012%20Dwarka%20Building%20No.%2019%20Block%20B%20Sector%2012B%20Dwarka%20Delhi&output=embed";

  return (
    <section
      id="location"
      aria-labelledby="location-heading"
      className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24"
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
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-[#FAF7FC] px-4 py-2 text-[13px] font-black text-[#5B2A86]">
            <MapPin aria-hidden="true" size={15} />
            Visit our preschool
          </div>

          <h2
            id="location-heading"
            className="mt-5 text-balance text-3xl font-black leading-[1.08] tracking-[-0.04em] text-[#2D1736] sm:text-4xl lg:text-[46px]"
          >
            Conveniently located in Sector 12B, Dwarka.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[#6F6474] sm:text-lg">
            Visit the centre, meet our teachers and explore the classrooms,
            learning spaces and daycare facilities before admission.
          </p>
        </div>

        <div className="mt-10 grid overflow-hidden rounded-[34px] border border-[#5B2A86]/10 bg-white shadow-[0_24px_70px_rgba(52,20,68,0.1)] lg:mt-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="flex flex-col justify-center bg-[#2D1736] p-7 text-white sm:p-9 lg:p-11">
            <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-white/10 text-[#F6C84B]">
              <MapPin aria-hidden="true" size={25} />
            </div>

            <p className="mt-6 text-sm font-black uppercase tracking-[0.12em] text-[#F6C84B]">
              Kidzee Sector 12, Dwarka
            </p>

            <h3 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
              Preschool and daycare close to your home.
            </h3>

            <address className="mt-5 not-italic text-base leading-7 text-white/75">
              {site.addressShort}
            </address>

            <div className="mt-7 space-y-5 border-t border-white/10 pt-7">
              <div className="flex items-start gap-3">
                <Clock3
                  aria-hidden="true"
                  size={19}
                  className="mt-1 shrink-0 text-[#F6C84B]"
                />

                <div className="space-y-2 text-sm leading-6 text-white/75">
                  <p>
                    <span className="font-bold text-white">
                      Playgroup &amp; Nursery:
                    </span>
                    <br />
                    9:30 AM – 12:30 PM
                  </p>

                  <p>
                    <span className="font-bold text-white">
                      Junior KG &amp; Senior KG:
                    </span>
                    <br />
                    9:30 AM – 1:00 PM
                  </p>

                  <p>
                    <span className="font-bold text-white">Daycare:</span>
                    <br />
                    12:30 PM – 7:00 PM
                  </p>

                  <p>
                    <span className="font-bold text-white">Office Hours:</span>
                    <br />
                    8:30 AM – 5:00 PM
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                href={site.map}
                external
                variant="yellow"
                size="md"
                leftIcon={<Navigation aria-hidden="true" size={18} />}
              >
                Get Directions
              </Button>

              <a
                href={`tel:${site.phone}`}
                aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 text-sm font-bold text-white transition duration-200 hover:-translate-y-0.5 hover:border-[#F6C84B]/70 hover:bg-white/15 hover:text-[#F6C84B] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/40"
              >
                <Phone aria-hidden="true" size={18} />
                Call Now
              </a>
            </div>

            <a
              href={site.whatsappVisit}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex w-fit items-center gap-2 rounded-md text-sm font-bold text-white/75 transition-colors hover:text-[#F6C84B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C84B]"
            >
              <MessageCircle aria-hidden="true" size={17} />
              Book a school visit on WhatsApp
            </a>
          </div>

          <div className="relative min-h-[430px] bg-[#F3EAF8] lg:min-h-[590px]">
            <iframe
              title="Kidzee Preschool and Daycare Sector 12B Dwarka location"
              src={mapEmbedUrl}
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