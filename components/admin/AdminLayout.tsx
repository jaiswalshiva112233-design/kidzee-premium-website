"use client";

import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import type { ReactNode } from "react";
import {
  Suspense,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ChevronRight,
  KeyRound,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";

import AdminSidebar, { type AdminSessionUser } from "./AdminSidebar";
import AdminGlobalSearch from "./AdminGlobalSearch";
import AdminBrowserControls from "./AdminBrowserControls";
import CentreHeadGuide from "./CentreHeadGuide";
import NotificationBell from "./notifications/NotificationBell";
import {
  exactAdminNavigationRoutes,
  visibleAdminNavigation,
} from "./adminNavigation";

type AdminLayoutProps = {
  children: ReactNode;
};

type SearchParamsLike = {
  get: (name: string) => string | null;
};

type SessionResponse = {
  success?: boolean;
  message?: string;
  user?: AdminSessionUser;
};

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

function AdminLayoutContent({
  children,
}: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentQuery = searchParams?.toString() ?? "";

  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [user, setUser] = useState<
    AdminSessionUser | null | undefined
  >(undefined);

  useEffect(() => {
    const controller = new AbortController();

    async function loadSession() {
      try {
        const response = await fetch(
          "/api/admin/session",
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const result =
          (await response.json()) as SessionResponse;

        if (response.status === 401) {
          setUser(null);
          router.replace("/admin/login");
          return;
        }

        if (
          !response.ok ||
          !result.success ||
          !result.user
        ) {
          return;
        }

        setUser(result.user);
      } catch (error) {
        if (
          error instanceof DOMException &&
          error.name === "AbortError"
        ) {
          return;
        }
      }
    }

    void loadSession();

    return () => {
      controller.abort();
    };
  }, [router]);

  useEffect(() => {
    // Route changes must close the temporary mobile navigation drawer.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileMenuOpen(false);
  }, [pathname, currentQuery]);

  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const visibleMobileNavigation = useMemo(
    () =>
      visibleAdminNavigation(user),
    [user],
  );

  const displayName =
    user?.name ||
    (user?.role === "CENTRE_HEAD"
      ? "Centre Head"
      : "Owner");

  const roleLabel =
    user?.role === "CENTRE_HEAD"
      ? "Centre Head"
      : "Owner";

  const roleDescription =
    user?.role === "CENTRE_HEAD"
      ? "Assigned centre access"
      : "Full centre control";

  return (
    <div className="min-h-screen bg-[#F4F6FB]">
      <div className="flex min-h-screen">
        <AdminSidebar user={user} />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-40 border-b border-[#E7EAF3] bg-white/95 backdrop-blur">
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-5 lg:px-8">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setMobileMenuOpen(true)
                  }
                  aria-label="Open admin menu"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#E6DCEB] bg-white text-[#5B2A86] shadow-sm transition hover:bg-[#F6F1F8] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#5B2A86]/15 lg:hidden"
                >
                  <Menu
                    aria-hidden="true"
                    size={22}
                  />
                </button>

                <div className="min-w-0">
                  <h1 className="truncate text-lg font-black tracking-[-0.025em] text-[#2D1736] sm:text-xl">
                    Kidzee CentreOS
                  </h1>

                  <p className="truncate text-xs font-semibold text-[#817684] sm:text-sm">
                    Sector 12, Dwarka
                  </p>
                </div>

                <div className="hidden sm:flex items-center ml-2">
                  <AdminBrowserControls />
                </div>
              </div>

              <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
                <AdminGlobalSearch />
                <NotificationBell />
                <Link
                  href="/admin/settings/security"
                  className="group flex shrink-0 items-center gap-2 rounded-2xl p-1.5 transition hover:bg-[#F7F2FA] sm:gap-3"
                >
                <div className="hidden text-right sm:block">
                  <p className="max-w-44 truncate text-sm font-black text-[#2D1736]">
                    {displayName}
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-[#6A328F]">
                    {roleLabel}
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5B2A86] text-sm font-black text-white shadow-[0_8px_20px_rgba(91,42,134,0.2)] sm:h-11 sm:w-11 sm:text-base">
                  {getInitials(displayName)}
                </div>
                </Link>
              </div>
            </div>
          </header>

          {user?.mustChangePassword &&
          pathname !== "/admin/settings/security" ? (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-5 lg:px-8">
              <div className="mx-auto flex w-full max-w-[1700px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <KeyRound
                    aria-hidden="true"
                    size={19}
                    className="mt-0.5 shrink-0 text-amber-700"
                  />

                  <p className="text-sm font-bold leading-6 text-amber-900">
                    For security, change your temporary
                    password before continuing.
                  </p>
                </div>

                <Link
                  href="/admin/settings/security?passwordChange=required"
                  className="inline-flex min-h-10 items-center justify-center rounded-xl bg-amber-700 px-4 text-xs font-black text-white transition hover:bg-amber-800"
                >
                  Change Password
                </Link>
              </div>
            </div>
          ) : null}

          <main className="min-w-0">
            <div className="mx-auto w-full max-w-[1700px] p-4 sm:p-5 lg:p-8">
              {children}
            </div>
          </main>
        </div>
      </div>

      <CentreHeadGuide />

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <button
            type="button"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            aria-label="Close admin menu"
            className="absolute inset-0 bg-[#1F1027]/55 backdrop-blur-sm"
          />

          <aside className="absolute inset-y-0 left-0 flex w-[88%] max-w-[350px] flex-col bg-white shadow-[20px_0_60px_rgba(31,16,39,0.22)]">
            <div className="flex items-center justify-between border-b border-[#EEE8F1] px-5 py-5">
              <Link
                href="/admin"
                className="flex min-w-0 items-center gap-3"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#5B2A86] text-lg font-black text-white">
                  K
                </div>

                <div className="min-w-0">
                  <p className="truncate text-base font-black text-[#2D1736]">
                    Kidzee CentreOS
                  </p>

                  <p className="truncate text-xs font-semibold text-[#817684]">
                    Sector 12, Dwarka
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                aria-label="Close menu"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4EEF7] text-[#5B2A86] transition hover:bg-[#EDE2F2]"
              >
                <X
                  aria-hidden="true"
                  size={20}
                />
              </button>
            </div>

            <nav
              aria-label="Mobile admin navigation"
              className="flex-1 overflow-y-auto px-4 py-5"
            >
              {visibleMobileNavigation.map((section) => (
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
                            "flex min-h-13 items-center justify-between gap-3 rounded-2xl px-3.5 py-3 transition",
                            active
                              ? "bg-[#5B2A86] text-white shadow-[0_10px_28px_rgba(91,42,134,0.18)]"
                              : "text-[#625768] hover:bg-[#F6F1F8]",
                          ].join(" ")}
                        >
                          <span className="flex min-w-0 items-center gap-3">
                            <span
                              className={[
                                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                                active
                                  ? "bg-white/15 text-white"
                                  : "bg-[#F6F1F8] text-[#6A328F]",
                              ].join(" ")}
                            >
                              <Icon
                                aria-hidden="true"
                                size={19}
                              />
                            </span>

                            <span className="truncate text-sm font-black">
                              {item.label}
                            </span>
                          </span>

                          <ChevronRight
                            aria-hidden="true"
                            size={16}
                            className={
                              active
                                ? "text-white"
                                : "text-[#B2A8B6]"
                            }
                          />
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

                    <p className="truncate text-xs font-bold text-[#5B2A86]">
                      {roleLabel}
                    </p>

                    <p className="truncate text-xs font-semibold text-[#817684]">
                      {roleDescription}
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin/settings/security"
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#5B2A86]/15 bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F1E8F6]"
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
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-[#5B2A86]/15 bg-white px-4 text-sm font-black text-[#5B2A86] transition hover:bg-[#F1E8F6]"
                  >
                    Log Out
                  </button>
                </form>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  return (
    <Suspense fallback={null}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </Suspense>
  );
}
