"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { X } from "lucide-react";

import MiraPanel from "@/components/mira/MiraPanel";

export default function MiraLauncher() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {open ? <MiraPanel onClose={() => setOpen(false)} /> : null}
      <div className="fixed bottom-[5.4rem] right-3 z-[85] flex flex-col items-center md:bottom-[5.75rem] md:right-6">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Close MIRA" : "Ask MIRA, Kidzee Admissions Assistant"}
          title={open ? "Close MIRA" : "Ask MIRA"}
          className="inline-flex h-[52px] w-[52px] items-center justify-center rounded-full border-2 border-white bg-[#2D1736] p-0.5 text-white shadow-[0_12px_28px_rgba(45,23,54,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(45,23,54,0.3)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]/45"
        >
          {open ? (
            <X aria-hidden="true" size={19} />
          ) : (
            <Image
              src="/images/mira/mira-centre-guide.png"
              alt=""
              width={48}
              height={48}
              sizes="48px"
              className="h-full w-full rounded-full object-cover"
            />
          )}
          <span className="sr-only">{open ? "Close" : "Ask MIRA"}</span>
        </button>

        {!open ? (
          <span className="mt-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-black leading-none text-[#4C285C] shadow-[0_4px_12px_rgba(45,23,54,0.12)]">
            Ask MIRA
          </span>
        ) : null}
      </div>
    </>
  );
}
