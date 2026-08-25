"use client";

import Link from "next/link";
import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type SearchResult = {
  id: string;
  category: "STUDENT" | "ADMISSION" | "BILL" | "RECEIPT" | "CAREER";
  title: string;
  subtitle: string;
  href: string;
  badges: string[];
};

type SearchResponse = {
  success?: boolean;
  message?: string;
  results?: SearchResult[];
};

const categoryLabels: Record<SearchResult["category"], string> = {
  STUDENT: "Student / Parent",
  ADMISSION: "Admission",
  BILL: "Bill",
  RECEIPT: "Receipt",
  CAREER: "Career Applicant",
};

export default function AdminGlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const needle = query.trim();
    if (needle.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/search?q=${encodeURIComponent(needle)}`,
          { cache: "no-store", signal: controller.signal },
        );
        const body = (await response.json()) as SearchResponse;
        if (!response.ok || !body.success) {
          throw new Error(body.message || "Search is temporarily unavailable.");
        }
        setResults(body.results ?? []);
        setMessage((body.results ?? []).length ? "" : "No matching CentreOS record was found.");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setResults([]);
        setMessage(error instanceof Error ? error.message : "Search is temporarily unavailable.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults([]);
    setMessage("");
  }

  function updateQuery(value: string) {
    setQuery(value);
    if (value.trim().length < 2) {
      setResults([]);
      setMessage("");
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search CentreOS"
        className="flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border border-[#E6DCEB] bg-white px-3 text-sm font-black text-[#5B2A86] shadow-sm transition hover:bg-[#F7F2FA] md:px-4"
      >
        <Search aria-hidden="true" size={18} />
        <span className="hidden xl:inline">Search CentreOS</span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[130] flex items-start justify-center bg-[#211028]/55 p-3 pt-[10vh] backdrop-blur-sm sm:p-6 sm:pt-[12vh]">
          <button type="button" aria-label="Close search" onClick={close} className="absolute inset-0" />
          <section role="dialog" aria-modal="true" aria-label="Search CentreOS" className="relative w-full max-w-2xl overflow-hidden rounded-[26px] border border-[#E2D8E7] bg-white shadow-[0_30px_90px_rgba(31,16,39,0.28)]">
            <div className="flex items-center gap-3 border-b border-[#EEE8F1] p-3 sm:p-4">
              <Search aria-hidden="true" size={20} className="shrink-0 text-[#5B2A86]" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => updateQuery(event.target.value)}
                placeholder="Child, parent, phone, student ID, bill or receipt"
                className="min-h-12 min-w-0 flex-1 bg-transparent text-base font-bold text-[#2D1736] outline-none placeholder:text-[#9B8FA0]"
              />
              {loading ? <LoaderCircle aria-label="Searching" size={20} className="shrink-0 animate-spin text-[#5B2A86]" /> : null}
              <button type="button" onClick={close} aria-label="Close search" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4EEF7] text-[#5B2A86]">
                <X aria-hidden="true" size={19} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-3 sm:p-4">
              {query.trim().length < 2 ? (
                <p className="rounded-2xl bg-[#F8F5FA] p-5 text-sm font-semibold leading-6 text-[#746879]">Enter at least two characters. Results are grouped without creating duplicate student profiles.</p>
              ) : message ? (
                <p className="rounded-2xl border border-dashed border-[#DCCFE4] p-6 text-center text-sm font-bold text-[#746879]">{message}</p>
              ) : (
                <div className="space-y-2">
                  {results.map((result) => (
                    <Link
                      key={`${result.category}-${result.id}`}
                      href={result.href}
                      onClick={close}
                      className="block min-h-16 rounded-2xl border border-[#E9E2ED] p-4 transition hover:border-[#B999CB] hover:bg-[#FAF7FC]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#7A459C]">{categoryLabels[result.category]}</p>
                          <p className="mt-1 truncate text-sm font-black text-[#2D1736]">{result.title}</p>
                          <p className="mt-1 truncate text-xs font-semibold text-[#817684]">{result.subtitle}</p>
                        </div>
                        <div className="flex max-w-[45%] flex-wrap justify-end gap-1.5">
                          {result.badges.map((badge) => <span key={badge} className="rounded-full bg-[#F1E8F6] px-2 py-1 text-[9px] font-black uppercase text-[#5B2A86]">{badge}</span>)}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
