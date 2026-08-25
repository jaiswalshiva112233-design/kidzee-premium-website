import { redirect } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";

import BillingCatalogueManager from "@/components/admin/settings/BillingCatalogueManager";
import { getAdminSession } from "@/lib/admin/auth";

export default async function BillingCataloguePage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login?next=%2Fadmin%2Fsettings%2Fbilling");
  if (session.role !== "OWNER" && !session.permissions.includes("*")) redirect("/admin/settings");

  return <main className="min-h-screen bg-[#F6F3F8] px-4 py-6 md:px-8 md:py-8">
    <div className="mx-auto max-w-[1500px]">
      <header className="mb-7 rounded-[30px] bg-[#2D1736] p-6 text-white shadow-xl md:p-8">
        <div className="flex items-start gap-4"><div className="rounded-2xl bg-white/10 p-3 text-[#FFD529]"><SlidersHorizontal size={26} /></div><div><p className="text-xs font-black uppercase tracking-[0.2em] text-[#FFD529]">Owner controls</p><h1 className="mt-2 text-3xl font-black tracking-[-0.03em] md:text-4xl">Billing catalogue</h1><p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-white/75">Programmes, daycare plans, meals, price versions, invoice behaviour and receipt terms are controlled here. Existing invoices always keep their saved values.</p></div></div>
      </header>
      <BillingCatalogueManager />
    </div>
  </main>;
}
