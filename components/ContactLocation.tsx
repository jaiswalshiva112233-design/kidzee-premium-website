"use client";

import { motion } from "framer-motion";
import {
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  School,
} from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const contactDetails = [
  {
    icon: MapPin,
    label: "School address",
    value: site.address,
  },
  {
    icon: Phone,
    label: "Call us",
    value: site.phoneDisplay,
    href: `tel:${site.phone}`,
  },
  {
    icon: Mail,
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
  },
];

const quickInformation = [
  {
    title: "Easy to reach",
    description: "Conveniently located in Sector 12B, Dwarka.",
  },
  {
    title: "School visits",
    description: "A prior appointment helps us give you a proper walkthrough.",
  },
  {
    title: "Quick assistance",
    description: "Call or WhatsApp our admissions team for guidance.",
  },
];

function createWhatsAppLink(message: string) {
  const phoneNumber = site.phone.replace(/\D/g, "");

  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}

export default function ContactLocation() {
  const visitLink = createWhatsAppLink(
    "Hello Kidzee Sector 12, Dwarka. I would like to schedule a visit to the preschool."
  );

  return (
    <section
      id="contact-location"
      aria-labelledby="contact-location-heading"
      className="relative overflow-hidden bg-white py-20 sm:py-24 lg:py-28"
    >
      <div
        aria-hidden="true"
        className="absolute -left-36 top-16 h-96 w-96 rounded-full bg-[#F2E8F8] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="absolute -right-32 bottom-8 h-96 w-96 rounded-full bg-[#FFF0B8] blur-3xl"
      />

      <Container className="relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E5D6EE] bg-[#F8F3FC] px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#5B2A86]">
            <MapPin aria-hidden="true" size={16} />
            Contact and location
          </div>

          <h2
            id="contact-location-heading"
            className="mt-6 text-balance text-4xl font-black leading-[1.08] tracking-[-0.04em] text-[#2C1735] sm:text-5xl lg:text-[56px]"
          >
            Visit Kidzee{" "}
            <span className="block text-[#5B2A86]">
              Sector 12B, Dwarka
            </span>
          </h2>

          <p className="mt-5 text-base leading-8 text-[#5F5F6D] sm:text-lg">
            Meet our team, explore the learning spaces and understand which
            preschool or daycare option is most suitable for your child.
          </p>
        </motion.div>

        <div className="mt-14 grid overflow-hidden rounded-[38px] border border-[#EADFF0] bg-[#FFF9F1] shadow-[0_30px_80px_rgba(52,20,68,0.12)] lg:grid-cols-[0.88fr_1.12fr]">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="p-7 sm:p-10 lg:p-12"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#5B2A86] text-white shadow-[0_12px_30px_rgba(91,42,134,0.24)]">
              <School aria-hidden="true" size={26} />
            </div>

            <h3 className="mt-6 text-3xl font-black tracking-[-0.03em] text-[#2C1735]">
              We would love to welcome you
            </h3>

            <p className="mt-4 leading-7 text-[#5F5F6D]">
              Schedule a visit to explore our classrooms, play areas, daycare
              facilities and thoughtfully designed early-learning environment.
            </p>

            <div className="mt-8 space-y-4">
              {contactDetails.map((item) => {
                const Icon = item.icon;

                const card = (
                  <div className="group flex items-start gap-4 rounded-[24px] border border-[#EADFF0] bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#D8C4E3] hover:shadow-[0_14px_36px_rgba(52,20,68,0.08)]">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#5B2A86] transition-colors duration-200 group-hover:bg-[#5B2A86] group-hover:text-white">
                      <Icon aria-hidden="true" size={21} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.15em] text-[#5B2A86]">
                        {item.label}
                      </p>

                      <p className="mt-1.5 break-words font-bold leading-6 text-[#2C1735]">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );

                if (item.href) {
                  return (
                    <a
                      key={item.label}
                      href={item.href}
                      className="block rounded-[24px] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/60 focus-visible:ring-offset-2"
                    >
                      {card}
                    </a>
                  );
                }

                return <div key={item.label}>{card}</div>;
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-[#EADFF0] bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2E8F8] text-[#5B2A86]">
                  <Clock3 aria-hidden="true" size={21} />
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-[#5B2A86]">
                    School timings
                  </p>

                  <div className="mt-2 space-y-2 text-sm leading-6 text-[#5F5F6D]">
                    <p>
                      <strong className="text-[#2C1735]">
                        Preschool:
                      </strong>{" "}
                      Monday–Friday, 8:30 AM–1:00 PM
                    </p>

                    <p>
                      <strong className="text-[#2C1735]">
                        Daycare:
                      </strong>{" "}
                      Monday–Saturday, 12:30 PM–7:00 PM
                    </p>

                    <p>
                      School visits are best scheduled in advance so our team
                      can give you enough time and attention.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Button
                href={site.map}
                external
                ariaLabel="Get directions to Kidzee Sector 12 Dwarka on Google Maps"
              >
                <Navigation aria-hidden="true" size={17} />
                Get Directions
              </Button>

              <Button
                href={visitLink}
                external
                variant="secondary"
                ariaLabel="Schedule a school visit with Kidzee Sector 12 Dwarka on WhatsApp"
              >
                <MessageCircle aria-hidden="true" size={17} />
                WhatsApp Us
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="min-h-[480px] bg-[#F8F3FC] lg:min-h-full"
          >
            <iframe
              title="Google Maps location of Kidzee Sector 12B Dwarka"
              src={site.mapEmbed}
              width="100%"
              height="100%"
              loading="lazy"
              allowFullScreen
              referrerPolicy="no-referrer-when-downgrade"
              className="min-h-[480px] w-full border-0 lg:h-full lg:min-h-[720px]"
            />
          </motion.div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {quickInformation.map((item) => (
            <div
              key={item.title}
              className="rounded-[24px] border border-[#EADFF0] bg-white p-5 text-center shadow-[0_10px_30px_rgba(52,20,68,0.05)]"
            >
              <p className="text-sm font-black text-[#2C1735]">
                {item.title}
              </p>

              <p className="mt-2 text-sm leading-6 text-[#5F5F6D]">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}