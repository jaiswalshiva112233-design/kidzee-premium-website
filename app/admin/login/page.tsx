import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import AdminLoginForm from "@/components/admin/AdminLoginForm";
import { isAdminAuthenticated } from "@/lib/admin/auth";

export default async function AdminLoginPage() {
  const authenticated = await isAdminAuthenticated();

  if (authenticated) {
    redirect("/admin");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F7F3FA] px-4 py-10 sm:px-6">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-[#E8D8F1] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full bg-[#F6C84B]/20 blur-3xl"
      />

      <section className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-[#5B2A86]/10 bg-white p-7 shadow-[0_28px_90px_rgba(45,23,54,0.14)] sm:p-9">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#5B2A86] text-white shadow-[0_12px_30px_rgba(91,42,134,0.22)]">
          <ShieldCheck aria-hidden="true" size={27} />
        </div>

        <p className="mt-6 text-sm font-black uppercase tracking-[0.15em] text-[#7A459C]">
          Kidzee Sector 12, Dwarka
        </p>

        <h1 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#2D1736]">
          Admin panel
        </h1>

        <p className="mt-3 text-base leading-7 text-[#6F6474]">
          Sign in to manage website photographs, enquiries and
          centre operations.
        </p>

        <AdminLoginForm />

        <p className="mt-6 text-center text-xs leading-5 text-[#8A7F8D]">
          Access is restricted to authorised school management.
        </p>
      </section>
    </main>
  );
}