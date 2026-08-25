import {
  FileText,
  HandCoins,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { redirect } from "next/navigation";

import AdminLayout from "@/components/admin/AdminLayout";
import ExpenseWorkspace, {
  type ExpenseWorkspaceRecord,
} from "@/components/admin/expenses/ExpenseWorkspace";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminExpensesPage() {
  const authenticated =
    await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const expenseRecords =
    await prisma.expense.findMany({
      orderBy: [
        {
          expenseDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  const initialExpenses: ExpenseWorkspaceRecord[] =
    expenseRecords.map((expense) => ({
      id: expense.id,
      expenseNumber:
        expense.expenseNumber,
      category: expense.category,
      title: expense.title,
      vendorName: expense.vendorName,
      expenseDate:
        expense.expenseDate.toISOString(),
      amountBeforeTax:
        expense.amountBeforeTax.toString(),
      gstApplicable:
        expense.gstApplicable,
      gstRate:
        expense.gstRate?.toString() ?? null,
      cgstAmount:
        expense.cgstAmount.toString(),
      sgstAmount:
        expense.sgstAmount.toString(),
      totalAmount:
        expense.totalAmount.toString(),
      paymentMethod:
        expense.paymentMethod,
      transactionReference:
        expense.transactionReference,
      invoiceNumber:
        expense.invoiceNumber,
      invoiceFileUrl:
        expense.invoiceFileUrl,
      notes: expense.notes,
      createdAt:
        expense.createdAt.toISOString(),
      updatedAt:
        expense.updatedAt.toISOString(),
    }));

  return (
    <AdminLayout>
      <div className="space-y-7">
        <section className="overflow-hidden rounded-[32px] bg-[#2D1736] text-white shadow-[0_26px_80px_rgba(45,23,54,0.22)]">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div
              aria-hidden="true"
              className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-[#FFD34E]/15 blur-3xl"
            />

            <div
              aria-hidden="true"
              className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-[#A96DD1]/20 blur-3xl"
            />

            <div className="relative grid gap-8 xl:grid-cols-[1fr_auto] xl:items-end">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#FFD34E]">
                  <HandCoins
                    aria-hidden="true"
                    size={16}
                  />
                  CentreOS Accounts
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-[-0.045em] !text-white sm:text-4xl lg:text-5xl">
                  Track every centre expense with
                  clarity.
                </h1>

                <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                  Record rent, salaries, utilities,
                  food, classroom materials and
                  operational spending with automatic
                  GST calculations and invoice
                  references.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
                    <FileText
                      aria-hidden="true"
                      size={18}
                      className="text-[#FFD34E]"
                    />
                    {initialExpenses.length} expense
                    records
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
                    <ShieldCheck
                      aria-hidden="true"
                      size={18}
                      className="text-[#FFD34E]"
                    />
                    Audit history enabled
                  </span>

                  <span className="inline-flex items-center gap-2 rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white/85">
                    <Sparkles
                      aria-hidden="true"
                      size={18}
                      className="text-[#FFD34E]"
                    />
                    Automatic GST totals
                  </span>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/15 bg-white/10 p-5 backdrop-blur xl:w-[300px]">
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#FFD34E]">
                  Accounts ready
                </p>

                <p className="mt-3 text-sm font-bold leading-6 text-white/85">
                  Every saved expense can be edited,
                  exported and reviewed later without
                  deleting its audit history.
                </p>
              </div>
            </div>
          </div>
        </section>

        <ExpenseWorkspace
          initialExpenses={initialExpenses}
        />
      </div>
    </AdminLayout>
  );
}