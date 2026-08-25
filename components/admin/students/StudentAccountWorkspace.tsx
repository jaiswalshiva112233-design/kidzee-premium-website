"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState } from "react";
import {
  BadgeIndianRupee,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  MessageCircleMore,
  Plus,
  ReceiptText,
  Sparkles,
} from "lucide-react";

type Invoice = {
  id: string;
  invoiceNumber: string;
  feePeriodLabel: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  status: string;
  items: Array<{ id: string; title: string; detail: string | null; totalAmount: number }>;
};

type DaycarePlan = {
  id: string;
  title: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  dailyHours: number | null;
  scheduledWeekdays: number[];
  monthlyFee: number;
  mealFee: number;
  mealName: string;
  planName: string;
  separateInvoice: boolean;
};

type Session = {
  id: string;
  sessionNumber: string;
  sessionDate: string;
  billableHours: number | null;
  baseAmount: number;
  foodCharge: number;
  totalAmount: number;
  approved: boolean;
  invoiceStatus: string;
  feeInvoiceId: string | null;
  notes: string | null;
  meals: string[];
};

type LedgerCharge = {
  id: string;
  chargeNumber: string;
  title: string;
  category: string;
  chargeDate: string;
  academicYear: string | null;
  amount: number;
  status: string;
  approved: boolean;
  feeInvoiceId: string | null;
  notes: string | null;
};

type Definition = {
  id: string;
  name: string;
  category: string;
  defaultAmount: number | null;
};

type CataloguePlan = {
  id: string;
  name: string;
  billingType: string;
  hoursIncluded: number | null;
  mealRule: string;
  price: number;
};

type MealCombination = { id: string; name: string; price: number };
type Meal = { id: string; name: string; price: number };
type Communication = { id: string; type: string; status: string; createdAt: string };
type EnrollmentContract = {
  contractNumber: string;
  academicSession: string;
  status: string;
  startDate: string;
  endDate: string | null;
  services: Array<{
    id: string;
    serviceType: string;
    label: string;
    detail: string | null;
    total: number;
    recurring: boolean;
    frequency: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    status: string;
    gstApplicable: boolean;
  }>;
};

type Props = {
  studentId: string;
  studentName: string;
  isOwner: boolean;
  contract: EnrollmentContract | null;
  programme: { name: string; monthlyFee: number; annualFee: number; kitFee: number; combineAnnualAndKit: boolean; startDate: string; status: string } | null;
  plans: DaycarePlan[];
  invoices: Invoice[];
  sessions: Session[];
  charges: LedgerCharge[];
  definitions: Definition[];
  planDefinitions: CataloguePlan[];
  mealCombinations: MealCombination[];
  meals: Meal[];
  communications: Communication[];
};

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());

const weekdayOptions = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function idempotencyKey() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function StudentAccountWorkspace(props: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [planDefinitionId, setPlanDefinitionId] = useState("");
  const [mealCombinationId, setMealCombinationId] = useState("");
  const [planStart, setPlanStart] = useState(today);
  const [scheduledWeekdays, setScheduledWeekdays] = useState<number[]>([]);
  const [sessionDate, setSessionDate] = useState(today);
  const [hours, setHours] = useState("1");
  const [mealIds, setMealIds] = useState<string[]>([]);
  const [sessionNotes, setSessionNotes] = useState("");
  const [definitionId, setDefinitionId] = useState("");
  const [chargeAmount, setChargeAmount] = useState("");
  const [chargeDate, setChargeDate] = useState(today);
  const [academicYear, setAcademicYear] = useState("");
  const [chargeNotes, setChargeNotes] = useState("");

  const activePlan = props.plans[0] ?? null;
  const openInvoices = props.invoices.filter((invoice) => !["PAID", "CANCELLED", "WAIVED"].includes(invoice.status));
  const outstanding = openInvoices.reduce((sum, invoice) => sum + invoice.pendingAmount, 0);
  const pendingAdditional = props.charges.filter((charge) => charge.status === "PENDING").reduce((sum, charge) => sum + charge.amount, 0)
    + props.sessions.filter((session) => !session.feeInvoiceId && !["NOT_BILLABLE", "CONTRACT_COVERED"].includes(session.invoiceStatus)).reduce((sum, session) => sum + session.totalAmount, 0);
  const recurring = props.contract
    ? props.contract.services
        .filter(
          (service) =>
            service.recurring && ["ACTIVE", "DRAFT"].includes(service.status),
        )
        .reduce((sum, service) => sum + service.total, 0)
    : (props.programme?.monthlyFee ?? 0) +
      props.plans.reduce(
        (sum, plan) => sum + plan.monthlyFee + plan.mealFee,
        0,
      );
  const lastPaymentInvoice = props.invoices.find((invoice) => invoice.paidAmount > 0) ?? null;
  const upcomingInvoice = openInvoices[0] ?? null;
  const selectedDefinition = props.definitions.find((item) => item.id === definitionId) ?? null;
  const selectedPlan = props.planDefinitions.find((item) => item.id === planDefinitionId) ?? null;
  const currentMonth = today.slice(0, 7);
  const additionalThisMonth = useMemo(
    () => props.sessions.filter((entry) => entry.sessionDate.slice(0, 7) === currentMonth && entry.invoiceStatus !== "CONTRACT_COVERED").reduce((sum, entry) => sum + entry.totalAmount, 0)
      + props.charges.filter((entry) => entry.chargeDate.slice(0, 7) === currentMonth && !["CANCELLED", "WAIVED"].includes(entry.status)).reduce((sum, entry) => sum + entry.amount, 0),
    [currentMonth, props.charges, props.sessions],
  );

  async function post(url: string, body: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { success?: boolean; message?: string };
      if (!response.ok || !result.success) throw new Error(result.message ?? "The change could not be saved.");
      setMessage(result.message ?? "Saved.");
      router.refresh();
      return true;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The change could not be saved.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function assignPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedPlan) return setError("Choose a daycare plan.");
    const saved = await post("/api/admin/daycare", {
      action: "save-plan",
      studentId: props.studentId,
      planDefinitionId: selectedPlan.id,
      mealCombinationId: mealCombinationId || null,
      foodOption: mealCombinationId ? "BOTH" : "NONE",
      planEffectiveFrom: planStart,
      planEffectiveTo: "",
      recurring: true,
      separateInvoice: false,
      scheduledWeekdays,
      notes: `Assigned from ${props.studentName}'s student profile.`,
    });
    if (saved) {
      setPlanDefinitionId("");
      setMealCombinationId("");
      setScheduledWeekdays([]);
    }
  }

  async function addEmergencyCare(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const saved = await post("/api/admin/daycare", {
      action: "record-session",
      studentId: props.studentId,
      planId: "",
      sessionDate,
      billingMode: "HOURLY",
      billableHours: hours,
      mealIds,
      foodOption: mealIds.length ? "BOTH" : "NONE",
      reason: "Additional daycare",
      notes: sessionNotes,
      sessionStatus: "COMPLETED",
    });
    if (saved) {
      setHours("1");
      setMealIds([]);
      setSessionNotes("");
    }
  }

  async function addCharge(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedDefinition) return setError("Choose a charge type.");
    const saved = await post("/api/admin/student-ledger", {
      action: "create",
      studentId: props.studentId,
      definitionId: selectedDefinition.id,
      amount: chargeAmount || selectedDefinition.defaultAmount,
      chargeDate,
      academicYear,
      notes: chargeNotes,
      idempotencyKey: idempotencyKey(),
    });
    if (saved) {
      setDefinitionId("");
      setChargeAmount("");
      setAcademicYear("");
      setChargeNotes("");
    }
  }

  async function approveCharge(chargeId: string) {
    await post("/api/admin/student-ledger", { action: "approve", chargeId });
  }

  return (
    <div className="space-y-6">
      {message ? <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-black text-green-800"><CheckCircle2 size={18} />{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-black text-red-800">{error}</div> : null}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric icon={CalendarClock} label="Recurring monthly" value={formatMoney(recurring)} note="Preschool + daycare + meal plans" />
        <Metric icon={Plus} label="Additional this month" value={formatMoney(additionalThisMonth)} note="Pending and billed add-ons" />
        <Metric icon={CircleDollarSign} label="Outstanding" value={formatMoney(outstanding)} note={`${openInvoices.length} open invoice${openInvoices.length === 1 ? "" : "s"}`} />
        <Metric icon={CalendarClock} label="Upcoming bill" value={upcomingInvoice ? formatMoney(upcomingInvoice.pendingAmount) : "Not generated"} note={upcomingInvoice?.feePeriodLabel ?? "Refresh dues when ready"} />
        <Metric icon={ReceiptText} label="Last payment" value={lastPaymentInvoice ? formatMoney(lastPaymentInvoice.paidAmount) : "No payment"} note={lastPaymentInvoice?.invoiceNumber ?? "Payment history is empty"} />
      </section>

      <Panel
        icon={ReceiptText}
        title="Enrollment contract"
        subtitle="One child, one contract, one combined financial history."
      >
        {props.contract ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4">
              <Value label="Contract" value={props.contract.contractNumber} />
              <Value label="Academic session" value={props.contract.academicSession} />
              <Value label="Status" value={props.contract.status} />
              <Value label="Started" value={formatDate(props.contract.startDate)} />
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {props.contract.services.map((service) => (
                <article
                  key={service.id}
                  className="rounded-2xl border border-[#E5DCE9] bg-[#FBF9FC] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#7A459C]">
                        {service.serviceType}
                      </p>
                      <p className="mt-1 font-black text-[#2D1736]">{service.label}</p>
                    </div>
                    <strong className="text-[#5B2A86]">{formatMoney(service.total)}</strong>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-[#817684]">
                    {service.recurring ? `${service.frequency} recurring` : "One-time"} · {service.gstApplicable ? "GST included/applicable" : "No GST"} · {service.status}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-[#817684]">
                    {formatDate(service.effectiveFrom)}{service.effectiveTo ? ` to ${formatDate(service.effectiveTo)}` : " onward"}
                  </p>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <Empty text="This is a legacy student record. Create or migrate an enrollment contract before adding new recurring services." />
        )}
      </Panel>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel icon={BadgeIndianRupee} title="Preschool service" subtitle="Attendance never changes this recurring fee.">
          {props.programme ? <div className="grid gap-3 sm:grid-cols-2"><Value label="Programme" value={props.programme.name} /><Value label="Monthly fee" value={formatMoney(props.programme.monthlyFee)} /><Value label={props.programme.combineAnnualAndKit ? "Annual + kit package" : "Annual fee"} value={formatMoney(props.programme.annualFee + (props.programme.combineAnnualAndKit ? props.programme.kitFee : 0))} />{!props.programme.combineAnnualAndKit ? <Value label="Kit fee" value={formatMoney(props.programme.kitFee)} /> : null}<Value label="From" value={formatDate(props.programme.startDate)} /></div> : <Empty text="Preschool is not enabled for this child." />}
        </Panel>

        <Panel icon={Clock3} title="Daycare and meal plan" subtitle="The current plan stays separate from additional daycare usage.">
          {activePlan ? <div className="grid gap-3 sm:grid-cols-2"><Value label="Plan" value={activePlan.planName} /><Value label="Weekly schedule" value={activePlan.scheduledWeekdays.length ? activePlan.scheduledWeekdays.map((day) => weekdayOptions.find((item) => item.value === day)?.short).filter(Boolean).join(", ") : "Every service day / as configured"} /><Value label="Hours" value={activePlan.dailyHours ? `${activePlan.dailyHours} hours` : "As configured"} /><Value label="Monthly prepaid daycare" value={formatMoney(activePlan.monthlyFee)} /><Value label="Meal plan" value={`${activePlan.mealName} · ${formatMoney(activePlan.mealFee)}`} /><Value label="Effective from" value={formatDate(activePlan.effectiveFrom)} /><Value label="Invoice" value={activePlan.separateInvoice ? "Separate by Owner choice" : "Combined monthly bill"} /></div> : <Empty text="No active daycare plan is assigned." />}
          {props.plans.length > 1 ? (
            <div className="mt-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">Additional active daycare services</p>
              {props.plans.slice(1).map((plan) => (
                <article key={plan.id} className="rounded-2xl border border-[#E5DCE9] bg-[#FBF9FC] p-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Value label="Plan" value={plan.planName} />
                    <Value label="Monthly prepaid daycare" value={formatMoney(plan.monthlyFee)} />
                    <Value label="Weekly schedule" value={plan.scheduledWeekdays.length ? plan.scheduledWeekdays.map((day) => weekdayOptions.find((item) => item.value === day)?.short).filter(Boolean).join(", ") : "Every service day / as configured"} />
                    <Value label="Hours" value={plan.dailyHours ? `${plan.dailyHours} hours` : "As configured"} />
                    <Value label="Meal plan" value={`${plan.mealName} · ${formatMoney(plan.mealFee)}`} />
                    <Value label="Next bill" value={plan.separateInvoice ? "Separate by Owner choice" : "Combined child bill"} />
                  </div>
                </article>
              ))}
            </div>
          ) : null}
          {props.isOwner ? <details className="mt-4 rounded-2xl border border-[#E5DCE9] bg-[#FBF9FC] p-4">
            <summary className="cursor-pointer text-sm font-black text-[#5B2A86]">Assign another daycare plan</summary>
            <form onSubmit={assignPlan} className="mt-4 grid gap-3 sm:grid-cols-2">
              <SelectField label="Daycare plan" value={planDefinitionId} onChange={setPlanDefinitionId} options={props.planDefinitions.map((item) => ({ value: item.id, label: `${item.name} · ${formatMoney(item.price)}` }))} />
              <SelectField label="Meal combination" value={mealCombinationId} onChange={setMealCombinationId} options={props.mealCombinations.map((item) => ({ value: item.id, label: `${item.name} · ${formatMoney(item.price)}` }))} empty="No monthly meal plan" />
              <InputField label="Effective from" type="date" value={planStart} onChange={setPlanStart} />
              {selectedPlan?.billingType === "WEEKLY" ? <fieldset className="rounded-2xl border border-[#DED3E4] p-4 sm:col-span-2"><legend className="px-2 text-xs font-black uppercase tracking-[0.1em] text-[#817684]">Contracted weekdays</legend><div className="flex flex-wrap gap-2">{weekdayOptions.map((day) => <label key={day.value} className={`flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-black ${scheduledWeekdays.includes(day.value) ? "border-[#5B2A86] bg-[#F2EAF7] text-[#5B2A86]" : "border-[#DED3E4] bg-white text-[#5F5364]"}`}><input type="checkbox" checked={scheduledWeekdays.includes(day.value)} onChange={(event) => setScheduledWeekdays(event.target.checked ? [...scheduledWeekdays, day.value].sort() : scheduledWeekdays.filter((value) => value !== day.value))} />{day.label}</label>)}</div></fieldset> : null}
              <button disabled={busy} className="min-h-12 self-end rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white disabled:opacity-50">{busy ? "Saving…" : "Assign plan"}</button>
            </form>
          </details> : null}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <Panel icon={Clock3} title="Quick additional daycare" subtitle="Date, hours, meals and notes; CentreOS snapshots the configured rates.">
          <form onSubmit={addEmergencyCare} className="grid gap-3 sm:grid-cols-2">
            <InputField label="Date" type="date" value={sessionDate} onChange={setSessionDate} />
            <InputField label="Additional hours" type="number" value={hours} onChange={setHours} />
            <fieldset className="rounded-2xl border border-[#DED3E4] p-4 sm:col-span-2"><legend className="px-2 text-xs font-black uppercase tracking-[0.1em] text-[#817684]">Meals provided</legend><div className="flex flex-wrap gap-2">{props.meals.map((meal) => <label key={meal.id} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 text-sm font-bold"><input type="checkbox" checked={mealIds.includes(meal.id)} onChange={(event) => setMealIds(event.target.checked ? [...mealIds, meal.id] : mealIds.filter((id) => id !== meal.id))} />{meal.name} · {formatMoney(meal.price)}</label>)}</div></fieldset>
            <label className="sm:col-span-2"><span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">Notes</span><textarea rows={2} value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} className="w-full rounded-2xl border border-[#DED3E4] px-4 py-3 font-semibold" /></label>
            <button disabled={busy} className="min-h-12 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white sm:col-span-2 disabled:opacity-50">{busy ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Save additional daycare"}</button>
          </form>
        </Panel>

        <Panel icon={Plus} title="Add pending charge" subtitle="Choose a configured charge once; it enters the next combined bill automatically.">
          {props.definitions.length ? <form onSubmit={addCharge} className="grid gap-3 sm:grid-cols-2">
            <SelectField label="Charge type" value={definitionId} onChange={(value) => { setDefinitionId(value); const selected = props.definitions.find((item) => item.id === value); setChargeAmount(selected?.defaultAmount == null ? "" : String(selected.defaultAmount)); }} options={props.definitions.map((item) => ({ value: item.id, label: item.name }))} />
            <InputField label="Amount" type="number" value={chargeAmount} onChange={setChargeAmount} />
            <InputField label="Charge date" type="date" value={chargeDate} onChange={setChargeDate} />
            <InputField label="Academic year (annual/kit)" value={academicYear} onChange={setAcademicYear} placeholder="2026-27" />
            <label className="sm:col-span-2"><span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">Notes</span><textarea rows={2} value={chargeNotes} onChange={(event) => setChargeNotes(event.target.value)} className="w-full rounded-2xl border border-[#DED3E4] px-4 py-3 font-semibold" /></label>
            <button disabled={busy} className="min-h-12 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white sm:col-span-2 disabled:opacity-50">Save to pending ledger</button>
          </form> : <Empty text="The Owner must create charge types in Billing Catalogue before staff can add them." />}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Panel icon={ReceiptText} title="Invoices and payments" subtitle="One financial history for every service used by this child.">
          {props.invoices.length ? <div className="space-y-3">{props.invoices.map((invoice) => <a key={invoice.id} href={`/admin/fees?studentId=${encodeURIComponent(props.studentId)}&invoiceId=${encodeURIComponent(invoice.id)}`} className="block rounded-2xl border border-[#E8E1EB] bg-[#FBF9FC] p-4 transition hover:border-[#A980BE]"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-black text-[#2D1736]">{invoice.invoiceNumber} · {invoice.feePeriodLabel}</p><p className="mt-1 text-xs font-semibold text-[#817684]">Due {formatDate(invoice.dueDate)} · {invoice.items.map((item) => item.title).join(" + ")}</p></div><span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#5B2A86]">{invoice.status.replaceAll("_", " ")}</span></div><div className="mt-3 grid grid-cols-3 gap-2"><Value label="Total" value={formatMoney(invoice.totalAmount)} /><Value label="Paid" value={formatMoney(invoice.paidAmount)} /><Value label="Balance" value={formatMoney(invoice.pendingAmount)} /></div></a>)}</div> : <Empty text="No invoice has been generated yet." />}
        </Panel>

        <Panel icon={Sparkles} title="AI insights (read-only)" subtitle="Operational guidance only; AI never calculates bills or balances.">
          <ul className="space-y-3 text-sm font-semibold leading-6 text-[#5F5364]">
            <li className="rounded-2xl bg-[#F8F3FA] p-4">{outstanding > 0 ? `${formatMoney(outstanding)} is currently outstanding across ${openInvoices.length} invoice(s).` : "No outstanding invoice balance is visible."}</li>
            <li className="rounded-2xl bg-[#F8F3FA] p-4">{pendingAdditional > 0 ? `${formatMoney(pendingAdditional)} in additional care or charges is waiting for approval/billing.` : "No unbilled additional charges are waiting."}</li>
            <li className="rounded-2xl bg-[#F8F3FA] p-4">{activePlan ? `${activePlan.planName} is the current daycare arrangement.` : "No active daycare plan is assigned."}</li>
          </ul>
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel icon={Clock3} title="Emergency daycare history" subtitle="Each date is one immutable source entry.">
          {props.sessions.length ? <HistoryList items={props.sessions.map((entry) => ({ id: entry.id, title: `${entry.sessionNumber} · ${entry.billableHours ?? "Full day"}${entry.billableHours ? " hours" : ""}`, meta: `${formatDate(entry.sessionDate)} · ${formatMoney(entry.totalAmount)} · ${entry.invoiceStatus.replaceAll("_", " ")}` }))} /> : <Empty text="No emergency daycare history." />}
        </Panel>
        <Panel icon={BadgeIndianRupee} title="Other and annual charges" subtitle="Pending, billed, paid, waived and cancelled remain traceable.">
          {props.charges.length ? <div className="space-y-2">{props.charges.map((charge) => <article key={charge.id} className="rounded-2xl bg-[#FBF9FC] p-3"><div className="flex justify-between gap-2"><div><p className="text-sm font-black text-[#2D1736]">{charge.title}</p><p className="mt-1 text-xs font-semibold text-[#817684]">{charge.chargeNumber} · {formatDate(charge.chargeDate)} · {charge.status}</p></div><strong className="text-sm text-[#5B2A86]">{formatMoney(charge.amount)}</strong></div>{props.isOwner && charge.status === "PENDING" && !charge.approved ? <button type="button" disabled={busy} onClick={() => void approveCharge(charge.id)} className="mt-3 min-h-10 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white">Approve for billing</button> : null}</article>)}</div> : <Empty text="No other, kit or annual ledger charges." />}
        </Panel>
        <Panel icon={MessageCircleMore} title="Communication history" subtitle="Receipt and parent-message delivery status.">
          {props.communications.length ? <HistoryList items={props.communications.map((entry) => ({ id: entry.id, title: entry.type.replaceAll("_", " "), meta: `${formatDate(entry.createdAt)} · ${entry.status}` }))} /> : <Empty text="No WhatsApp communication has been recorded." />}
        </Panel>
      </section>
    </div>
  );
}

function Panel({ icon: Icon, title, subtitle, children }: { icon: typeof CircleDollarSign; title: string; subtitle: string; children: React.ReactNode }) {
  return <section className="rounded-[26px] border border-[#E8E1EB] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.05)]"><div className="flex items-start gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F2EAF7] text-[#5B2A86]"><Icon size={20} /></span><div><h2 className="text-lg font-black text-[#2D1736]">{title}</h2><p className="mt-1 text-xs font-semibold leading-5 text-[#817684]">{subtitle}</p></div></div><div className="mt-5">{children}</div></section>;
}
function Metric({ icon: Icon, label, value, note }: { icon: typeof CircleDollarSign; label: string; value: string; note: string }) { return <article className="rounded-[22px] border border-[#E8E1EB] bg-white p-4"><Icon className="text-[#6A328F]" size={20} /><p className="mt-3 text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">{label}</p><p className="mt-1 text-xl font-black text-[#2D1736]">{value}</p><p className="mt-1 text-xs font-semibold text-[#817684]">{note}</p></article>; }
function Value({ label, value }: { label: string; value: string }) { return <div className="rounded-xl bg-white p-3"><p className="text-[9px] font-black uppercase tracking-[0.08em] text-[#8B808F]">{label}</p><p className="mt-1 text-sm font-black text-[#2D1736]">{value}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-2xl border border-dashed border-[#DCCFE3] bg-[#FBF9FC] p-5 text-center text-sm font-bold text-[#817684]">{text}</p>; }
function InputField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string }) { return <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">{label}</span><input type={type} min={type === "number" ? "0.25" : undefined} step={type === "number" ? "0.25" : undefined} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="min-h-12 w-full rounded-2xl border border-[#DED3E4] bg-white px-4 font-bold text-[#2D1736]" /></label>; }
function SelectField({ label, value, onChange, options, empty = "Choose" }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; empty?: string }) { return <label><span className="mb-2 block text-xs font-black uppercase tracking-[0.1em] text-[#817684]">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="min-h-12 w-full rounded-2xl border border-[#DED3E4] bg-white px-4 font-bold text-[#2D1736]"><option value="">{empty}</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function HistoryList({ items }: { items: Array<{ id: string; title: string; meta: string }> }) { return <div className="space-y-2">{items.map((item) => <article key={item.id} className="rounded-2xl bg-[#FBF9FC] p-3"><p className="text-sm font-black text-[#2D1736]">{item.title}</p><p className="mt-1 text-xs font-semibold text-[#817684]">{item.meta}</p></article>)}</div>; }
