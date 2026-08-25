import type { ComponentType } from "react";
import {
  BarChart3,
  BrainCircuit,
  BriefcaseBusiness,
  CalendarCheck2,
  CalendarClock,
  CalendarDays,
  CircleDollarSign,
  DatabaseBackup,
  FileClock,
  Gauge,
  Globe2,
  GraduationCap,
  HandCoins,
  KeyRound,
  LayoutDashboard,
  MessageCircleMore,
  MessageSquareText,
  PlugZap,
  ReceiptText,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

import { canAccessAdminPath } from "@/lib/admin/permissions";

import type { AdminSessionUser } from "./AdminSidebar";

export type AdminNavigationItem = {
  label: string;
  href: string;
  icon: ComponentType<{
    size?: number;
    className?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }>;
  ownerOnly?: boolean;
};

export type AdminNavigationSection = {
  title: string;
  items: AdminNavigationItem[];
};

export const adminNavigationSections: AdminNavigationSection[] = [
  {
    title: "Daily Work",
    items: [
      { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { label: "Admissions", href: "/admin/admissions", icon: UserRoundCheck },
      { label: "Leads & Follow-ups", href: "/admin/enquiries", icon: MessageSquareText },
      { label: "Students", href: "/admin/students", icon: UsersRound },
      { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck2 },
      { label: "Daycare", href: "/admin/daycare", icon: CalendarClock },
      { label: "Fees & Payments", href: "/admin/fees", icon: CircleDollarSign },
      { label: "Receipts", href: "/admin/receipts", icon: ReceiptText },
    ],
  },
  {
    title: "Centre",
    items: [
      { label: "WhatsApp", href: "/admin/whatsapp", icon: MessageCircleMore },
      { label: "Centre Calendar", href: "/admin/calendar", icon: CalendarDays },
      { label: "Staff & Payroll", href: "/admin/staff", icon: GraduationCap },
      { label: "Expenses", href: "/admin/expenses", icon: HandCoins },
      { label: "Careers", href: "/admin/careers", icon: BriefcaseBusiness },
      { label: "Reports", href: "/admin/reports", icon: BarChart3 },
    ],
  },
  {
    title: "Website & Setup",
    items: [
      { label: "Website Manager", href: "/admin/website", icon: Globe2 },
      { label: "Settings", href: "/admin/settings", icon: Settings },
      { label: "My Security", href: "/admin/settings/security", icon: KeyRound },
    ],
  },
  {
    title: "Owner Advanced",
    items: [
      { label: "Owner Intelligence", href: "/admin/intelligence", icon: Gauge, ownerOnly: true },
      { label: "Marketing Control", href: "/admin/marketing", icon: SlidersHorizontal, ownerOnly: true },
      { label: "AI Growth Analyst", href: "/admin/growth", icon: BrainCircuit, ownerOnly: true },
      { label: "Billing Catalogue", href: "/admin/settings/billing", icon: CircleDollarSign, ownerOnly: true },
      { label: "User Permissions", href: "/admin/settings/access", icon: ShieldCheck, ownerOnly: true },
      { label: "Integrations", href: "/admin/settings/integrations", icon: PlugZap, ownerOnly: true },
      { label: "Data & History", href: "/admin/settings/data", icon: DatabaseBackup, ownerOnly: true },
      { label: "Legacy Compatibility", href: "/admin/settings/fees", icon: FileClock, ownerOnly: true },
    ],
  },
];

export const exactAdminNavigationRoutes = [
  "/admin",
  "/admin/website",
  "/admin/reports",
  "/admin/staff",
  "/admin/settings",
  "/admin/careers",
  "/admin/growth",
  "/admin/marketing",
  "/admin/whatsapp",
  "/admin/intelligence",
];

export function canShowAdminNavigationItem(
  item: AdminNavigationItem,
  user?: AdminSessionUser | null,
) {
  if (!user) return false;
  if (item.ownerOnly && user.role !== "OWNER") return false;
  if (user.role === "OWNER") return true;
  return canAccessAdminPath(item.href.split("?")[0], user);
}

export function visibleAdminNavigation(
  user?: AdminSessionUser | null,
) {
  return adminNavigationSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        canShowAdminNavigationItem(item, user),
      ),
    }))
    .filter((section) => section.items.length > 0);
}
