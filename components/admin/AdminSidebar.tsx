"use client";

import Link from "next/link";
import {
  usePathname,
  useSearchParams,
} from "next/navigation";
import {
  ChevronRight,
  ShieldCheck,
} from "lucide-react";

import {
  adminNavigationSections,
  canShowAdminNavigationItem,
  exactAdminNavigationRoutes,
  visibleAdminNavigation,
} from "./adminNavigation";

export type AdminSessionUser = {
  id: string;
  name: string;
  email: string | null;
  role: "OWNER" | "CENTRE_HEAD";
  permissions: string[];
  mustChangePassword: boolean;
};

type SearchParamsLike = {
  get: (name: string) => string | null;
};

type AdminSidebarProps = {
  user?: AdminSessionUser | null;
};

export function canAccessAdminHref(
  href: string,
  user?: AdminSessionUser | null,
) {
  const configuredItem = adminNavigationSections
    .flatMap((section) => section.items)
    .find((item) => item.href === href);

  return canShowAdminNavigationItem(
    configuredItem ?? { label: href, href, icon: ChevronRight },
    user,
  );
}

function isActiveRoute(
  pathname: string,
  searchParams: SearchParamsLike,
  href: string,
) {
  const [hrefPath, queryString] = href.split("?");

  if (queryString) {
    if (pathname !== hrefPath) {
      return false;
    }

    const expectedParams =
      new URLSearchParams(queryString);

    return Array.from(
      expectedParams.entries(),
    ).every(
      ([key, value]) =>
        searchParams.get(key) === value,
    );
  }

  if (
    hrefPath === "/admin/enquiries" &&
    searchParams.get("view") === "follow-ups"
  ) {
    return false;
  }

  if (exactAdminNavigationRoutes.includes(hrefPath)) {
    return pathname === hrefPath;
  }

  return (
    pathname === hrefPath ||
    pathname.startsWith(`${hrefPath}/`)
  );
}

function getInitials(name: string) {
  const initials = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return initials || "A";
}

export default function AdminSidebar({
  user,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const displayName =
    user?.name ||
    (user?.role === "CENTRE_HEAD"
      ? "Centre Head"
      : "Owner");

  const roleLabel =
    user?.role === "CENTRE_HEAD"
      ? "Centre Head Access"
      : "Owner Access";

  const roleDescription =
    user?.role === "CENTRE_HEAD"
      ? "Assigned centre controls"
      : "Full centre control";

  const visibleSections = visibleAdminNavigation(user);

  return (
    <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 flex-col border-r border-[#E9E3ED] bg-white lg:flex">
      <div className="border-b border-[#EEE8F1] px-6 py-6">
        <Link
          href="/admin"
          className="group flex items-center gap-3 rounded-2xl outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/15"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#5B2A86] text-xl font-black text-white shadow-[0_12px_28px_rgba(91,42,134,0.22)] transition duration-200 group-hover:-translate-y-0.5">
            K
          </div>

          <div className="min-w-0">
            <p className="truncate text-lg font-black tracking-[-0.025em] text-[#2D1736]">
              Kidzee CentreOS
            </p>

            <p className="mt-0.5 truncate text-xs font-semibold text-[#847889]">
              Sector 12, Dwarka
            </p>
          </div>
        </Link>
      </div>

      <nav
        aria-label="Admin navigation"
        className="flex-1 overflow-y-auto px-4 py-5"
      >
        {visibleSections.map((section) => (
          <div
            key={section.title}
            className="mb-7 last:mb-2"
          >
            <p className="mb-2 px-3 text-[11px] font-black uppercase tracking-[0.16em] text-[#9A8D9F]">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;

                const active = isActiveRoute(
                  pathname,
                  searchParams,
                  item.href,
                );

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={
                      active ? "page" : undefined
                    }
                    className={[
                      "group flex min-h-12 items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 outline-none transition duration-200",
                      active
                        ? "bg-[#5B2A86] text-white shadow-[0_10px_28px_rgba(91,42,134,0.18)]"
                        : "text-[#625768] hover:bg-[#F6F1F8] hover:text-[#4D2367]",
                      "focus-visible:ring-4 focus-visible:ring-[#5B2A86]/15",
                    ].join(" ")}
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span
                        className={[
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition duration-200",
                          active
                            ? "bg-white/14 text-white"
                            : "bg-[#F6F1F8] text-[#6A328F] group-hover:bg-white",
                        ].join(" ")}
                      >
                        <Icon
                          aria-hidden="true"
                          size={18}
                          className="shrink-0"
                        />
                      </span>

                      <span className="truncate text-sm font-bold">
                        {item.label}
                      </span>
                    </span>

                    <span className="flex shrink-0 items-center gap-2">
                      <ChevronRight
                        aria-hidden="true"
                        size={15}
                        className={[
                          "transition duration-200",
                          active
                            ? "translate-x-0 text-white"
                            : "text-[#B2A8B6] group-hover:translate-x-0.5 group-hover:text-[#6A328F]",
                        ].join(" ")}
                      />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-[#EEE8F1] p-4">
        <div className="rounded-[22px] bg-[#F7F2FA] p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#5B2A86] text-sm font-black text-white">
              {getInitials(displayName)}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-black text-[#2D1736]">
                {displayName}
              </p>

              <p className="mt-0.5 truncate text-xs font-bold text-[#5B2A86]">
                {roleLabel}
              </p>

              <p className="mt-0.5 truncate text-xs font-semibold text-[#7F7383]">
                {roleDescription}
              </p>
            </div>
          </div>

          <Link
            href="/admin/settings/security"
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#5B2A86]/15 bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:border-[#5B2A86]/25 hover:bg-[#F1E8F6]"
          >
            <ShieldCheck
              aria-hidden="true"
              size={16}
            />
            My Security
          </Link>

          <form
            action="/api/admin/logout"
            method="post"
            className="mt-2"
          >
            <button
              type="submit"
              className="inline-flex min-h-10 w-full items-center justify-center rounded-xl border border-[#5B2A86]/15 bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:border-[#5B2A86]/25 hover:bg-[#F1E8F6] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/15"
            >
              Log Out
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
