import type { ReactNode } from "react";
import { Megaphone } from "lucide-react";

import MarketingControlNav from "@/components/admin/marketing/MarketingControlNav";

export default function MarketingPageFrame({
  current,
  eyebrow,
  title,
  description,
  children,
}: {
  current: string;
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <section className="rounded-[30px] bg-[#2D1736] px-6 py-7 text-white shadow-lg">
        <div className="flex items-start gap-4">
          <span className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
            <Megaphone size={24} />
          </span>
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B]">
              {eyebrow}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/75">
              {description}
            </p>
          </div>
        </div>
      </section>
      <MarketingControlNav current={current} />
      {children}
    </div>
  );
}
