import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Star,
} from "lucide-react";

import Container from "@/components/ui/Container";
import { site } from "@/lib/site";

const highlights = [
  "3-day trial available",
  "Nutritious meals",
  "Pick-up & drop available",
];

export default function Hero() {
  return (
    <section
      aria-labelledby="hero-heading"
      className="relative isolate overflow-hidden bg-[radial-gradient(circle_at_8%_12%,rgba(246,200,75,0.17),transparent_29%),radial-gradient(circle_at_90%_34%,rgba(91,42,134,0.10),transparent_32%),linear-gradient(135deg,#fffdf8_0%,#fcf8fc_52%,#f8f1fb_100%)] pt-[74px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
      >
        <div className="absolute left-[7%] top-[22%] h-24 w-24 rounded-full border border-[#5B2A86]/10" />

        <div className="absolute right-[5%] top-[16%] h-16 w-16 rounded-full bg-[#F6C84B]/15 blur-xl" />

        <div className="absolute bottom-[8%] left-[45%] h-28 w-28 rounded-full bg-[#7D42A8]/10 blur-3xl" />
      </div>

      <Container className="grid min-h-[650px] items-center gap-12 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-14 lg:py-10">
        <div className="relative z-10 max-w-[665px]">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#5B2A86]/10 bg-white/75 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#5B2A86] shadow-[0_8px_24px_rgba(48,22,62,0.05)] backdrop-blur">
            <MapPin aria-hidden="true" size={15} />
            Sector 12B, Dwarka
          </div>

          <h1
            id="hero-heading"
            className="mt-5 max-w-[650px] text-balance text-[clamp(3rem,5.3vw,5.05rem)] font-black leading-[0.98] tracking-[-0.045em] text-[#2C1735]"
          >
            Where curious children grow into confident learners.
          </h1>

          <p className="mt-6 max-w-[610px] text-[1.06rem] leading-8 text-[#665A6B] lg:text-[1.15rem]">
            Give your child a joyful start in a warm, caring environment where
            every day builds confidence, friendships and a genuine love for
            learning.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Book a school visit with Kidzee Sector 12 Dwarka on WhatsApp"
              className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-full bg-[#5B2A86] px-7 text-sm font-black text-white shadow-[0_16px_36px_rgba(91,42,134,0.22)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#4F2376] hover:shadow-[0_20px_42px_rgba(91,42,134,0.28)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            >
              Book a school visit
              <ArrowRight aria-hidden="true" size={18} />
            </a>

            <Link
              href="/programmes"
              className="inline-flex min-h-[56px] items-center justify-center rounded-full border border-[#5B2A86]/15 bg-white/70 px-7 text-sm font-black text-[#5B2A86] shadow-[0_8px_24px_rgba(48,22,62,0.05)] backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-[#5B2A86]/25 hover:bg-white hover:shadow-[0_14px_32px_rgba(53,28,67,0.1)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
            >
              Explore programmes
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-[#534658]">
            {highlights.map((highlight) => (
              <span
                key={highlight}
                className="flex items-center gap-2"
              >
                <CheckCircle2
                  aria-hidden="true"
                  size={18}
                  strokeWidth={2.2}
                  className="shrink-0 text-[#5B2A86]"
                />

                {highlight}
              </span>
            ))}
          </div>

          <div className="mt-8 flex items-start gap-3 border-t border-[#5B2A86]/10 pt-6 text-sm leading-6 text-[#675B6B]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5B2A86]/[0.08] text-[#5B2A86]">
              <MessageCircle
                aria-hidden="true"
                size={19}
              />
            </div>

            <p>
              Have questions about admissions?{" "}
              <a
                href={site.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#5B2A86] underline decoration-[#5B2A86]/25 underline-offset-4 transition-colors hover:decoration-[#5B2A86] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6C84B]"
              >
                Chat with us on WhatsApp
              </a>
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[700px] lg:pl-2">
          <div
            aria-hidden="true"
            className="absolute -left-8 top-10 h-40 w-40 rounded-full bg-[#F6C84B]/25 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="absolute -right-10 bottom-4 h-52 w-52 rounded-full bg-[#7D42A8]/15 blur-3xl"
          />

          <div className="relative overflow-hidden rounded-[36px] border-[7px] border-white bg-white shadow-[0_34px_100px_rgba(58,21,76,0.20)] sm:rounded-[44px] sm:border-[9px]">
            <Image
              src="/images/hero-main.jpg"
              alt="Children enjoying a classroom activity with their teacher at Kidzee Sector 12 Dwarka"
              width={1100}
              height={950}
              priority
              sizes="(max-width: 1024px) 100vw, 53vw"
              className="h-[440px] w-full object-cover object-center sm:h-[560px] lg:h-[600px]"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#2B1538]/10 via-transparent to-transparent"
            />
          </div>

          <div className="absolute -bottom-6 left-3 flex min-w-[270px] items-center gap-4 rounded-[26px] border border-white/80 bg-white/95 p-4 shadow-[0_20px_55px_rgba(48,22,62,0.16)] backdrop-blur sm:-left-5 sm:min-w-[280px] sm:p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#F6C84B]/25">
              <Star
                aria-hidden="true"
                size={27}
                className="fill-[#F6C84B] text-[#D9A600]"
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <strong className="text-xl text-[#2E1837]">
                  4.8★
                </strong>

                <span className="rounded-full bg-[#5B2A86]/[0.08] px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-[#5B2A86]">
                  Google rating
                </span>
              </div>

              <p className="mt-1 text-sm text-[#6F6474]">
                Based on 33+ parent reviews
              </p>
            </div>
          </div>

          <div className="absolute right-3 top-4 hidden rounded-full border border-white/80 bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#5B2A86] shadow-[0_12px_30px_rgba(48,22,62,0.10)] backdrop-blur sm:block">
            Preschool &amp; Daycare
          </div>
        </div>
      </Container>
    </section>
  );
}