import { redirect } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import NotificationCentre from "@/components/admin/notifications/NotificationCentre";
import { getAdminSession } from "@/lib/admin/auth";
export const dynamic="force-dynamic";
export default async function NotificationsPage(){if(!(await getAdminSession()))redirect("/admin/login");return <AdminLayout><section className="mb-6"><p className="text-xs font-black uppercase tracking-[0.16em] text-[#6D3692]">CentreOS alerts</p><h1 className="mt-2 text-3xl font-black tracking-tight text-[#2D1736]">Notification Centre</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#756978]">Operational reminders for admissions, fees, daycare, attendance, WhatsApp and recruitment—routed by your role and permissions.</p></section><NotificationCentre/></AdminLayout>}
