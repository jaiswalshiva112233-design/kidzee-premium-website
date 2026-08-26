"use client";

import Image from "next/image";
import { Film, Play } from "lucide-react";
import { useState } from "react";

type Props = {
  provider: "INSTAGRAM" | "YOUTUBE";
  embedUrl: string;
  publicUrl: string;
  poster?: string;
  title: string;
};

export default function ExternalMediaEmbed({ provider, embedUrl, publicUrl, poster, title }: Props) {
  const [active, setActive] = useState(false);
  const Icon = Film;

  if (active) {
    return (
      <div className={provider === "INSTAGRAM" ? "aspect-[9/16]" : "aspect-video"}>
        <iframe
          src={embedUrl}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className="h-full w-full border-0 bg-[#170B1E]"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActive(true)}
      className="group relative block aspect-[9/16] w-full overflow-hidden bg-[#25102F] text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#F6C84B]"
      aria-label={`Load ${provider === "INSTAGRAM" ? "Instagram Reel" : "YouTube video"}: ${title}`}
    >
      {poster ? (
        <Image src={poster} alt="" fill sizes="(max-width: 640px) 82vw, 340px" className="object-cover opacity-90 transition duration-500 group-hover:scale-[1.025]" />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-[#5B2A86] to-[#25102F]" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-black/20" />
      <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-black/55 px-3 py-2 text-[0.66rem] font-black uppercase tracking-[0.08em] backdrop-blur">
        <Icon aria-hidden="true" size={15} /> {provider === "INSTAGRAM" ? "Instagram" : "YouTube"}
      </span>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full border border-white/70 bg-white/92 text-[#5B2A86] shadow-xl transition group-hover:scale-105">
          <Play aria-hidden="true" size={25} fill="currentColor" className="ml-1" />
        </span>
      </span>
      <span className="absolute inset-x-4 bottom-4 text-left text-sm font-black leading-5">Tap to load from {provider === "INSTAGRAM" ? "Instagram" : "YouTube"}</span>
      <span className="sr-only">External link: {publicUrl}</span>
    </button>
  );
}
