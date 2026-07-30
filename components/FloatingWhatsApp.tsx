"use client";

import { motion } from "framer-motion";
import { MessageCircle, Phone } from "lucide-react";
import { site } from "@/lib/site";

export default function FloatingWhatsApp() {
  return (
    <>
      {/* Desktop Floating WhatsApp */}
      <motion.a
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Kidzee Sector 12 Dwarka on WhatsApp"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{
          duration: 0.35,
          ease: "easeOut",
        }}
        className="group fixed bottom-6 right-6 z-[60] hidden h-16 w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_18px_45px_rgba(37,211,102,0.35)] transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:shadow-[0_22px_55px_rgba(37,211,102,0.45)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 md:flex"
      >
        <MessageCircle
          size={30}
          strokeWidth={2.2}
        />

        <span className="pointer-events-none absolute right-[74px] whitespace-nowrap rounded-full bg-[#2C1735] px-4 py-2 text-sm font-bold text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
          Chat with us
        </span>
      </motion.a>

      {/* Mobile Bottom Bar */}
      <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-[#E8DDF1] bg-white/95 px-3 py-3 backdrop-blur-md shadow-[0_-8px_30px_rgba(52,20,68,0.08)] md:hidden">
        <div className="grid grid-cols-2 gap-3">
          <a
            href={`tel:${site.phone}`}
            aria-label={`Call Kidzee Sector 12 Dwarka on ${site.phoneDisplay}`}
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full border border-[#DCCEE5] bg-white text-sm font-bold text-[#5B2A86] transition-all duration-200 hover:bg-[#F8F3FC] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/50"
          >
            <Phone size={18} />
            Call Now
          </a>

          <a
            href={site.whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with Kidzee Sector 12 Dwarka on WhatsApp"
            className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-full bg-[#25D366] text-sm font-bold text-white shadow-lg transition-all duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40"
          >
            <MessageCircle size={18} />
            WhatsApp
          </a>
        </div>
      </div>
    </>
  );
}