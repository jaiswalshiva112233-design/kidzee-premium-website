import Link from "next/link";
import { ArrowLeft, Home, MessageCircle } from "lucide-react";

import Button from "@/components/ui/Button";
import Container from "@/components/ui/Container";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildSiteContact } from "@/lib/siteContact";

export default async function NotFound() {
  const site = buildSiteContact(await getWebsiteContactSettings());
  return (
    <main className="relative flex min-h-[calc(100vh-82px)] items-center overflow-hidden bg-[#FAF7FC] py-20 sm:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-12 h-80 w-80 rounded-full bg-[#EADDF1] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl"
      />

      <Container size="narrow" className="relative text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-[30px] border border-[#5B2A86]/10 bg-white shadow-[0_18px_50px_rgba(52,20,68,0.08)]">
          <span className="text-4xl font-black tracking-[-0.06em] text-[#5B2A86]">
            404
          </span>
        </div>

        <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-[#8A6A9D]">
          Page not found
        </p>

        <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-black leading-tight tracking-[-0.035em] text-[#2D1736] sm:text-5xl">
          We could not find the page you were looking for.
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#6F6474] sm:text-lg">
          The link may be incorrect, or the page may have been moved. You can
          return to the homepage or contact our centre for help.
        </p>

        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
          <Button
            href="/"
            variant="primary"
            size="lg"
            leftIcon={<Home size={18} />}
          >
            Go to Homepage
          </Button>

          <Button
            href={site.whatsappVisit}
            external
            variant="secondary"
            size="lg"
            leftIcon={<MessageCircle size={18} />}
          >
            Contact on WhatsApp
          </Button>
        </div>

        <Link
          href="/programmes"
          className="mt-8 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-[#5B2A86] transition-colors hover:bg-[#5B2A86]/[0.06] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
        >
          <ArrowLeft aria-hidden="true" size={16} />
          View our programmes
        </Link>
      </Container>
    </main>
  );
}
