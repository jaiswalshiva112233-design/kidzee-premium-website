import { redirect } from "next/navigation";
import { MessageCircleMore } from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import WhatsAppDeliveryManager from "@/components/admin/whatsapp/WhatsAppDeliveryManager";
import { getAdminSession } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export default async function WhatsAppDeliveryPage() {
  if (!(await getAdminSession())) redirect("/admin/login");

  return (
    <AdminLayout>
      <div className="space-y-6">
        <section className="rounded-[30px] bg-[#2D1736] px-6 py-8 text-white">
          <div className="flex items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#25D366] text-white"><MessageCircleMore size={27} /></span>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.17em] text-[#F6C84B]">Automated parent communication</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">WhatsApp deliveries</h1>
              <p className="mt-2 text-sm font-semibold text-white/70">Track reminders, confirmations, fee receipts and delivery failures in one place.</p>
            </div>
          </div>
        </section>
        <WhatsAppDeliveryManager />
      </div>
    </AdminLayout>
  );
}
