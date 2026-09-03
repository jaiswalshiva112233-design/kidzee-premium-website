"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";

export default function AdminBrowserControls() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleBack = () => {
    if (typeof window !== "undefined") {
      window.history.back();
    }
  };

  const handleForward = () => {
    if (typeof window !== "undefined") {
      window.history.forward();
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="flex items-center gap-0.5 rounded-xl border border-[#E3D8EB] bg-[#FAF6FD] p-1 shadow-xs">
      <button
        type="button"
        onClick={handleBack}
        title="Go Back"
        aria-label="Go Back in panel"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#62536B] transition hover:bg-white hover:text-[#5B2A86] hover:shadow-xs active:scale-95 focus:outline-none"
      >
        <ArrowLeft size={16} />
      </button>

      <button
        type="button"
        onClick={handleForward}
        title="Go Forward"
        aria-label="Go Forward in panel"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#62536B] transition hover:bg-white hover:text-[#5B2A86] hover:shadow-xs active:scale-95 focus:outline-none"
      >
        <ArrowRight size={16} />
      </button>

      <div className="h-4 w-px bg-[#E2D5EA] mx-0.5" />

      <button
        type="button"
        onClick={handleRefresh}
        title="Refresh Current Page"
        aria-label="Refresh Page"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#62536B] transition hover:bg-white hover:text-[#5B2A86] hover:shadow-xs active:scale-95 focus:outline-none"
      >
        <RotateCw
          size={15}
          className={isRefreshing ? "animate-spin text-[#5B2A86]" : ""}
        />
      </button>
    </div>
  );
}
