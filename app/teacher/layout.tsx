"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  CalendarCheck2,
  Clock3,
  GraduationCap,
  Home,
  LogOut,
  MessageSquare,
  Sparkles,
  UsersRound,
} from "lucide-react";

type TeacherSession = {
  id: string;
  name: string;
  email: string | null;
  role: string;
  staffId?: string | null;
};

export default function TeacherLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<TeacherSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/session");
        const data = await res.json();
        if (res.status === 401 || !data.success || !data.user) {
          router.replace("/admin/login");
          return;
        }
        setUser(data.user);
      } catch {
        router.replace("/admin/login");
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  async function handleLogout() {
    try {
      await fetch("/api/admin/session", { method: "DELETE" });
    } catch {
      // ignore
    }
    router.replace("/admin/login");
  }

  const navItems = [
    { label: "Dashboard", href: "/teacher", icon: Home },
    { label: "Attendance", href: "/teacher/attendance", icon: CalendarCheck2 },
    { label: "Students", href: "/teacher/students", icon: UsersRound },
    { label: "Activities", href: "/teacher/activities", icon: Sparkles },
    { label: "Leaves", href: "/teacher/leaves", icon: Clock3 },
    { label: "Messages", href: "/teacher/messages", icon: MessageSquare },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F9F7FA]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#5B2A86] border-t-transparent" />
          <p className="text-sm font-semibold text-[#5B2A86]">Loading Teacher Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#F9F7FA] text-[#2D1736]">
      {/* Top Header */}
      <header className="sticky top-0 z-40 border-b border-[#EAE2EF] bg-white/95 px-4 py-3 shadow-xs backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5B2A86] text-[#FFD34E] shadow-xs">
              <GraduationCap size={22} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-[#5B2A86]">Kidzee Sector 12</span>
                <span className="rounded-md bg-[#F3EAF8] px-2 py-0.5 text-[10px] font-black uppercase text-[#5B2A86]">Teacher</span>
              </div>
              <p className="text-sm font-black text-[#2D1736] sm:text-base">{user?.name || "Teacher Portal"}</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href === "/teacher"
                ? pathname === "/teacher"
                : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${
                    active
                      ? "bg-[#5B2A86] text-white shadow-xs"
                      : "text-[#6B5A72] hover:bg-[#F3EAF8] hover:text-[#5B2A86]"
                  }`}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#E0D5E6] bg-white px-3 py-2 text-xs font-bold text-[#8A3B3B] transition hover:bg-[#FFF5F5]"
              title="Sign Out"
            >
              <LogOut size={15} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 sm:py-7 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#EAE2EF] bg-white/95 px-2 py-2 shadow-lg backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.href === "/teacher"
              ? pathname === "/teacher"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 text-[10px] font-bold transition ${
                  active
                    ? "bg-[#5B2A86] text-[#FFD34E]"
                    : "text-[#7B6D82] hover:text-[#5B2A86]"
                }`}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
