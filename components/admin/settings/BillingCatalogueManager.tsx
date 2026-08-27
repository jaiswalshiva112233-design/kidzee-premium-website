"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Plus,
  Save,
  Tags,
  Utensils,
} from "lucide-react";

type PriceType = "GST_INCLUSIVE" | "GST_EXCLUSIVE";
type CatalogueStatus = "ACTIVE" | "INACTIVE" | "ARCHIVED" | "DELETED";
type Version = {
  id: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  active: boolean;
  price?: number;
  admissionFee?: number;
  annualFee?: number;
  kitFee?: number;
  combineAnnualAndKit?: boolean;
  monthlyFee?: number;
  gstApplicable: boolean;
  gstRate: number | null;
  priceType?: PriceType;
  admissionGstApplicable?: boolean;
  admissionGstRate?: number | null;
  admissionPriceType?: PriceType;
  annualGstApplicable?: boolean;
  annualGstRate?: number | null;
  annualPriceType?: PriceType;
  kitGstApplicable?: boolean;
  kitGstRate?: number | null;
  kitPriceType?: PriceType;
  monthlyGstApplicable?: boolean;
  monthlyGstRate?: number | null;
  monthlyPriceType?: PriceType;
};
type Programme = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  ageMinimumMonths: number | null;
  ageMaximumMonths: number | null;
  colour: string;
  capacity: number | null;
  status: CatalogueStatus;
  displayOrder: number;
  feeVersions: Version[];
};
type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  billingType: string;
  hoursIncluded: number | null;
  timeWindowStart: string | null;
  timeWindowEnd: string | null;
  mealRule: string;
  recurring: boolean;
  maximumVisits: number | null;
  allowConcurrent: boolean;
  active: boolean;
  status: CatalogueStatus;
  displayOrder: number;
  priceVersions: Version[];
};
type Meal = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: CatalogueStatus;
  displayOrder: number;
  priceVersions: Version[];
};
type Combination = Meal & {
  items: Array<{ mealId: string; meal: Meal }>;
  priceVersions: Version[];
};
type ChargeDefinition = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: string;
  defaultAmount: number | null;
  gstApplicable: boolean;
  gstRate: number | null;
  priceType: PriceType;
  active: boolean;
  status: CatalogueStatus;
  displayOrder: number;
};
type BillingSettings = {
  dueDay: number;
  invoicePrefix: string;
  receiptPrefix: string;
  paymentTerms: string;
  academicYearStartMonth: number;
  academicChargePolicy: string;
  defaultInvoiceMode: string;
  additionalDaycareDisplayMode: string;
  automaticMonthlyBilling: boolean;
  daycareCapacity: number | null;
};
type Catalogue = {
  programmes: Programme[];
  daycarePlans: Plan[];
  meals: Meal[];
  mealCombinations: Combination[];
  chargeDefinitions: ChargeDefinition[];
  settings: BillingSettings;
};
type PlanReplacementPreview = {
  oldPlan: { id: string; name: string };
  newPlan: { id: string; name: string; price: number; billingType: string };
  affectedPlans: Array<{
    studentPlanId: string;
    studentNumber: string;
    studentName: string;
    contractNumber?: string;
    currentAmount: number;
    historicalSessions: number;
  }>;
};

const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Kolkata",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const blankProgramme = {
  id: "",
  code: "",
  name: "",
  description: "",
  ageMinimumMonths: "",
  ageMaximumMonths: "",
  colour: "#5B2A86",
  capacity: "",
  active: true,
  displayOrder: "0",
  admissionFee: "0",
  annualFee: "0",
  kitFee: "0",
  combineAnnualAndKit: false,
  monthlyFee: "0",
  admissionGstApplicable: false,
  admissionGstRate: "",
  admissionPriceType: "GST_INCLUSIVE" as PriceType,
  annualGstApplicable: false,
  annualGstRate: "",
  annualPriceType: "GST_INCLUSIVE" as PriceType,
  kitGstApplicable: false,
  kitGstRate: "",
  kitPriceType: "GST_INCLUSIVE" as PriceType,
  monthlyGstApplicable: false,
  monthlyGstRate: "",
  monthlyPriceType: "GST_INCLUSIVE" as PriceType,
  effectiveFrom: today,
};
const blankPlan = {
  id: "",
  code: "",
  name: "",
  description: "",
  billingType: "MONTHLY",
  hoursIncluded: "",
  timeWindowStart: "",
  timeWindowEnd: "",
  mealRule: "OPTIONAL",
  recurring: true,
  maximumVisits: "",
  allowConcurrent: false,
  active: true,
  displayOrder: "0",
  price: "0",
  gstApplicable: false,
  gstRate: "",
  priceType: "GST_INCLUSIVE" as PriceType,
  effectiveFrom: today,
};
const blankMeal = {
  id: "",
  code: "",
  name: "",
  description: "",
  active: true,
  displayOrder: "0",
  price: "0",
  gstApplicable: false,
  gstRate: "",
  priceType: "GST_INCLUSIVE" as PriceType,
  effectiveFrom: today,
};
const blankCombo = { ...blankMeal, mealIds: [] as string[] };
const blankCharge = {
  id: "",
  code: "",
  name: "",
  description: "",
  category: "OTHER",
  defaultAmount: "",
  gstApplicable: false,
  gstRate: "",
  priceType: "GST_INCLUSIVE" as PriceType,
  active: true,
  displayOrder: "0",
};

function currentVersion<T extends Version>(versions: T[]) {
  const now = Date.now();
  return (
    versions.find(
      (version) =>
        new Date(version.effectiveFrom).getTime() <= now &&
        (!version.effectiveTo ||
          new Date(version.effectiveTo).getTime() >= now),
    ) ?? versions[0]
  );
}

function dateInput(value: string | null | undefined) {
  return value
    ? new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(value))
    : today;
}

function money(value: number | undefined) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export default function BillingCatalogueManager() {
  const [catalogue, setCatalogue] = useState<Catalogue | null>(null);
  const [tab, setTab] = useState<
    "programmes" | "plans" | "meals" | "charges" | "settings"
  >("programmes");
  const [programme, setProgramme] = useState(blankProgramme);
  const [plan, setPlan] = useState(blankPlan);
  const [meal, setMeal] = useState(blankMeal);
  const [combo, setCombo] = useState(blankCombo);
  const [charge, setCharge] = useState(blankCharge);
  const [settings, setSettings] = useState<BillingSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [replacement, setReplacement] = useState({
    oldPlanId: "",
    newPlanId: "",
    effectiveFrom: today,
  });
  const [replacementPreview, setReplacementPreview] =
    useState<PlanReplacementPreview | null>(null);
  const [selectedReplacementPlans, setSelectedReplacementPlans] = useState<
    string[]
  >([]);

  useEffect(() => {
    const requestedPlanId = new URLSearchParams(window.location.search).get(
      "oldPlanId",
    );
    if (!requestedPlanId) return;
    setReplacement((current) => ({
      ...current,
      oldPlanId: requestedPlanId,
    }));
  }, []);

  async function load() {
    const response = await fetch("/api/admin/billing-catalog", {
      cache: "no-store",
    });
    const payload = (await response.json()) as Catalogue & {
      success: boolean;
      message?: string;
    };
    if (!response.ok || !payload.success)
      throw new Error(
        payload.message || "Billing catalogue could not be loaded.",
      );
    setCatalogue(payload);
    setSettings(payload.settings);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch((reason) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Billing catalogue could not be loaded.",
        ),
      );
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function save(payload: Record<string, unknown>) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/billing-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as Catalogue & {
        success: boolean;
        message?: string;
      };
      if (!response.ok || !result.success)
        throw new Error(
          result.message || "The catalogue change could not be saved.",
        );
      setCatalogue(result);
      setSettings(result.settings);
      setMessage(result.message || "Saved.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The catalogue change could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function replacePlans(apply: boolean) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/billing-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: apply ? "replace-plan-apply" : "replace-plan-preview",
          ...replacement,
          studentPlanIds: selectedReplacementPlans,
        }),
      });
      const result = (await response.json()) as PlanReplacementPreview & {
        success: boolean;
        message?: string;
      };
      if (!response.ok || !result.success) {
        throw new Error(result.message || "The plan replacement could not be prepared.");
      }
      if (apply) {
        setMessage(result.message || "Selected child contracts were updated.");
        setReplacementPreview(null);
        setSelectedReplacementPlans([]);
        await load();
      } else {
        setReplacementPreview(result);
        setSelectedReplacementPlans(
          result.affectedPlans.map((item) => item.studentPlanId),
        );
        setMessage(
          result.affectedPlans.length
            ? "Preview ready. Review every child before applying."
            : "No active child contracts use this plan on the selected date.",
        );
      }
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The plan replacement could not be prepared.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function lifecycle(
    entityType:
      "PROGRAMME" | "DAYCARE_PLAN" | "MEAL" | "MEAL_COMBINATION" | "CHARGE",
    id: string,
    operation:
      "ACTIVATE" | "DEACTIVATE" | "ARCHIVE" | "DELETE" | "PERMANENT_DELETE",
  ) {
    if (!id) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const checkResponse = await fetch("/api/admin/billing-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "catalogue-dependency-check",
          entityType,
          id,
        }),
      });
      const check = (await checkResponse.json()) as {
        success?: boolean;
        message?: string;
        name?: string;
        totalDependencies?: number;
        dependencies?: Record<string, number>;
        recommendation?: string;
      };
      if (!checkResponse.ok || !check.success)
        throw new Error(check.message || "Dependencies could not be checked.");
      if (
        operation === "PERMANENT_DELETE" &&
        (check.totalDependencies ?? 0) > 0
      )
        throw new Error(
          `${check.name} has ${check.totalDependencies} dependent or historical records. Archive is required to preserve history.`,
        );
      const destructive = ["ARCHIVE", "DELETE", "PERMANENT_DELETE"].includes(
        operation,
      );
      const dependencyText = Object.entries(check.dependencies ?? {})
        .filter(([, count]) => count > 0)
        .map(([name, count]) => `${name}: ${count}`)
        .join(", ");
      if (
        destructive &&
        !window.confirm(
          `${operation.replaceAll("_", " ")} ${check.name}?${dependencyText ? `\nDependencies: ${dependencyText}\nHistorical records will remain unchanged.` : ""}`,
        )
      )
        return;
      const reason = destructive
        ? (window
            .prompt(
              "Reason for this audited change:",
              operation === "ARCHIVE"
                ? "No longer offered"
                : "Owner catalogue cleanup",
            )
            ?.trim() ?? "")
        : "";
      if (destructive && reason.length < 4)
        throw new Error("Enter a clear reason for this audited change.");
      const confirmation =
        operation === "PERMANENT_DELETE"
          ? (window.prompt("Type PERMANENT DELETE to confirm:")?.trim() ?? "")
          : "";
      const response = await fetch("/api/admin/billing-catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "catalogue-lifecycle",
          entityType,
          id,
          operation,
          reason,
          confirmation,
        }),
      });
      const result = (await response.json()) as Catalogue & {
        success?: boolean;
        message?: string;
      };
      if (!response.ok || !result.success)
        throw new Error(
          result.message || "The catalogue action could not be completed.",
        );
      setCatalogue(result);
      setSettings(result.settings);
      setMessage(result.message || "Catalogue lifecycle updated.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The catalogue action could not be completed.",
      );
    } finally {
      setSaving(false);
    }
  }

  const activeCount = useMemo(
    () => ({
      programmes:
        catalogue?.programmes.filter((item) => item.status === "ACTIVE")
          .length ?? 0,
      plans:
        catalogue?.daycarePlans.filter((item) => item.status === "ACTIVE")
          .length ?? 0,
      meals:
        (catalogue?.meals.filter((item) => item.status === "ACTIVE").length ??
          0) +
        (catalogue?.mealCombinations.filter((item) => item.status === "ACTIVE")
          .length ?? 0),
      charges:
        catalogue?.chargeDefinitions.filter((item) => item.status === "ACTIVE")
          .length ?? 0,
    }),
    [catalogue],
  );

  if (!catalogue || !settings)
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-[30px] border border-[#E8E1EB] bg-white">
        <Loader2 className="animate-spin text-[#6A328F]" />
        <span className="ml-3 font-bold text-[#5B4A61]">
          Loading billing catalogue…
        </span>
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            key: "programmes",
            label: "Programmes",
            value: activeCount.programmes,
          },
          { key: "plans", label: "Daycare plans", value: activeCount.plans },
          { key: "meals", label: "Meals & combos", value: activeCount.meals },
          {
            key: "charges",
            label: "Other charges",
            value: activeCount.charges,
          },
          {
            key: "settings",
            label: "Invoice settings",
            value:
              settings.defaultInvoiceMode === "COMBINED" ? "Combined" : "Split",
          },
        ].map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key as typeof tab)}
            className={`rounded-[22px] border p-4 text-left transition ${tab === item.key ? "border-[#6A328F] bg-[#6A328F] text-white shadow-lg" : "border-[#E8E1EB] bg-white text-[#2D1736] hover:border-[#CDB8D8]"}`}
          >
            <span className="block text-xs font-black uppercase tracking-[0.15em] opacity-70">
              {item.label}
            </span>
            <strong className="mt-2 block text-2xl font-black">
              {item.value}
            </strong>
          </button>
        ))}
      </div>
      {message ? (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 p-4 font-bold text-green-800">
          <CheckCircle2 size={18} />
          {message}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">
          {error}
        </div>
      ) : null}

      {tab === "programmes" ? (
        <Section
          title="Preschool programmes"
          subtitle="Create any programme and add future fee versions without changing old invoices."
          icon={<CircleDollarSign />}
        >
          <SelectEditor
            label="Edit an existing programme"
            value={programme.id}
            onChange={(id) => {
              const item = catalogue.programmes.find(
                (entry) => entry.id === id,
              );
              if (!item) return setProgramme(blankProgramme);
              const version = currentVersion(item.feeVersions);
              setProgramme({
                id: item.id,
                code: item.code,
                name: item.name,
                description: item.description ?? "",
                ageMinimumMonths: item.ageMinimumMonths?.toString() ?? "",
                ageMaximumMonths: item.ageMaximumMonths?.toString() ?? "",
                colour: item.colour,
                capacity: item.capacity?.toString() ?? "",
                active: item.status === "ACTIVE",
                displayOrder: item.displayOrder.toString(),
                admissionFee: String(version?.admissionFee ?? 0),
                annualFee: String(version?.annualFee ?? 0),
                kitFee: String(version?.kitFee ?? 0),
                combineAnnualAndKit: version?.combineAnnualAndKit ?? false,
                monthlyFee: String(version?.monthlyFee ?? 0),
                admissionGstApplicable:
                  version?.admissionGstApplicable ?? false,
                admissionGstRate: version?.admissionGstRate?.toString() ?? "",
                admissionPriceType:
                  version?.admissionPriceType ?? "GST_INCLUSIVE",
                annualGstApplicable: version?.annualGstApplicable ?? false,
                annualGstRate: version?.annualGstRate?.toString() ?? "",
                annualPriceType: version?.annualPriceType ?? "GST_INCLUSIVE",
                kitGstApplicable: version?.kitGstApplicable ?? false,
                kitGstRate: version?.kitGstRate?.toString() ?? "",
                kitPriceType: version?.kitPriceType ?? "GST_INCLUSIVE",
                monthlyGstApplicable:
                  version?.monthlyGstApplicable ??
                  version?.gstApplicable ??
                  false,
                monthlyGstRate:
                  version?.monthlyGstRate?.toString() ??
                  version?.gstRate?.toString() ??
                  "",
                monthlyPriceType: version?.monthlyPriceType ?? "GST_INCLUSIVE",
                effectiveFrom: dateInput(version?.effectiveFrom),
              });
            }}
            options={catalogue.programmes.map((item) => ({
              value: item.id,
              label: item.name,
            }))}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Programme name *"
              value={programme.name}
              onChange={(value) => setProgramme({ ...programme, name: value })}
            />
            <Input
              label="Code"
              value={programme.code}
              onChange={(value) => setProgramme({ ...programme, code: value })}
              placeholder="Auto from name"
            />
            <Input
              label="Minimum age (months)"
              type="number"
              value={programme.ageMinimumMonths}
              onChange={(value) =>
                setProgramme({ ...programme, ageMinimumMonths: value })
              }
            />
            <Input
              label="Maximum age (months)"
              type="number"
              value={programme.ageMaximumMonths}
              onChange={(value) =>
                setProgramme({ ...programme, ageMaximumMonths: value })
              }
            />
            <Input
              label="Capacity"
              type="number"
              value={programme.capacity}
              onChange={(value) =>
                setProgramme({ ...programme, capacity: value })
              }
            />
            <Input
              label="Display order"
              type="number"
              value={programme.displayOrder}
              onChange={(value) =>
                setProgramme({ ...programme, displayOrder: value })
              }
            />
            <Input
              label="Colour"
              type="color"
              value={programme.colour}
              onChange={(value) =>
                setProgramme({ ...programme, colour: value })
              }
            />
            <Toggle
              label="Active"
              checked={programme.active}
              onChange={(value) =>
                setProgramme({ ...programme, active: value })
              }
            />
          </div>
          <TextArea
            label="Description"
            value={programme.description}
            onChange={(value) =>
              setProgramme({ ...programme, description: value })
            }
          />
          <VersionBox title="Fee version">
            <ProgrammeCharge
              label="Admission fee"
              amount={programme.admissionFee}
              gstApplicable={programme.admissionGstApplicable}
              gstRate={programme.admissionGstRate}
              priceType={programme.admissionPriceType}
              onChange={(patch) =>
                setProgramme({
                  ...programme,
                  ...prefixTaxPatch("admission", patch),
                  ...(patch.amount == null
                    ? {}
                    : { admissionFee: patch.amount }),
                })
              }
            />
            <ProgrammeCharge
              label="Annual fee"
              amount={programme.annualFee}
              gstApplicable={programme.annualGstApplicable}
              gstRate={programme.annualGstRate}
              priceType={programme.annualPriceType}
              onChange={(patch) =>
                setProgramme({
                  ...programme,
                  ...prefixTaxPatch("annual", patch),
                  ...(patch.amount == null ? {} : { annualFee: patch.amount }),
                })
              }
            />
            <ProgrammeCharge
              label="Kit fee"
              amount={programme.kitFee}
              gstApplicable={programme.kitGstApplicable}
              gstRate={programme.kitGstRate}
              priceType={programme.kitPriceType}
              onChange={(patch) =>
                setProgramme({
                  ...programme,
                  ...prefixTaxPatch("kit", patch),
                  ...(patch.amount == null ? {} : { kitFee: patch.amount }),
                })
              }
            />
            <ProgrammeCharge
              label="Monthly preschool fee"
              amount={programme.monthlyFee}
              gstApplicable={programme.monthlyGstApplicable}
              gstRate={programme.monthlyGstRate}
              priceType={programme.monthlyPriceType}
              onChange={(patch) =>
                setProgramme({
                  ...programme,
                  ...prefixTaxPatch("monthly", patch),
                  ...(patch.amount == null ? {} : { monthlyFee: patch.amount }),
                })
              }
            />
            <Input
              label="Effective from *"
              type="date"
              value={programme.effectiveFrom}
              onChange={(value) =>
                setProgramme({ ...programme, effectiveFrom: value })
              }
            />
            <Toggle
              label="Show annual + kit as one package"
              checked={programme.combineAnnualAndKit}
              onChange={(value) =>
                setProgramme({ ...programme, combineAnnualAndKit: value })
              }
            />
          </VersionBox>
          <SaveRow
            saving={saving}
            isEdit={Boolean(programme.id)}
            onNew={() => setProgramme(blankProgramme)}
            onSave={() => void save({ action: "save-programme", ...programme })}
          />
          {programme.id ? (
            <CatalogueActions
              status={
                catalogue.programmes.find((item) => item.id === programme.id)
                  ?.status ?? "INACTIVE"
              }
              busy={saving}
              onDuplicate={() =>
                setProgramme({
                  ...programme,
                  id: "",
                  name: `${programme.name} Copy`,
                  code: `${programme.code}_COPY_${Date.now().toString().slice(-5)}`,
                })
              }
              onAction={(operation) =>
                void lifecycle("PROGRAMME", programme.id, operation)
              }
            />
          ) : null}
          <HistoryCards
            items={catalogue.programmes.map((item) => ({
              id: item.id,
              title: item.name,
              status: item.status,
              detail:
                item.description ||
                `${item.ageMinimumMonths ?? "–"}–${item.ageMaximumMonths ?? "–"} months`,
              version: currentVersion(item.feeVersions)
                ? `Monthly ${money(currentVersion(item.feeVersions)?.monthlyFee)}`
                : "No fee version",
            }))}
          />
        </Section>
      ) : null}

      {tab === "plans" ? (
        <Section
          title="Unlimited daycare plans"
          subtitle="Hourly, daily, weekly, monthly and custom plans use versioned prices."
          icon={<CalendarClock />}
        >
          <SelectEditor
            label="Edit an existing plan"
            value={plan.id}
            onChange={(id) => {
              const item = catalogue.daycarePlans.find(
                (entry) => entry.id === id,
              );
              if (!item) return setPlan(blankPlan);
              const version = currentVersion(item.priceVersions);
              setPlan({
                id: item.id,
                code: item.code,
                name: item.name,
                description: item.description ?? "",
                billingType: item.billingType,
                hoursIncluded: item.hoursIncluded?.toString() ?? "",
                timeWindowStart: item.timeWindowStart ?? "",
                timeWindowEnd: item.timeWindowEnd ?? "",
                mealRule: item.mealRule,
                recurring: item.recurring,
                maximumVisits: item.maximumVisits?.toString() ?? "",
                allowConcurrent: item.allowConcurrent,
                active: item.active,
                displayOrder: item.displayOrder.toString(),
                price: String(version?.price ?? 0),
                gstApplicable: version?.gstApplicable ?? false,
                gstRate: version?.gstRate?.toString() ?? "",
                priceType: version?.priceType ?? "GST_INCLUSIVE",
                effectiveFrom: dateInput(version?.effectiveFrom),
              });
            }}
            options={catalogue.daycarePlans.map((item) => ({
              value: item.id,
              label: `${item.name} · ${item.billingType}`,
            }))}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Plan name *"
              value={plan.name}
              onChange={(value) => setPlan({ ...plan, name: value })}
            />
            <Input
              label="Code"
              value={plan.code}
              onChange={(value) => setPlan({ ...plan, code: value })}
              placeholder="Auto from name"
            />
            <Select
              label="Billing type *"
              value={plan.billingType}
              onChange={(value) => setPlan({ ...plan, billingType: value })}
              options={["HOURLY", "DAILY", "WEEKLY", "MONTHLY", "CUSTOM"]}
            />
            <Input
              label="Hours included"
              type="number"
              value={plan.hoursIncluded}
              onChange={(value) => setPlan({ ...plan, hoursIncluded: value })}
            />
            <Input
              label="Time window start"
              type="time"
              value={plan.timeWindowStart}
              onChange={(value) => setPlan({ ...plan, timeWindowStart: value })}
            />
            <Input
              label="Time window end"
              type="time"
              value={plan.timeWindowEnd}
              onChange={(value) => setPlan({ ...plan, timeWindowEnd: value })}
            />
            <Input
              label="Maximum visits"
              type="number"
              value={plan.maximumVisits}
              onChange={(value) => setPlan({ ...plan, maximumVisits: value })}
            />
            <Select
              label="Meal rule"
              value={plan.mealRule}
              onChange={(value) => setPlan({ ...plan, mealRule: value })}
              options={["NOT_AVAILABLE", "OPTIONAL", "REQUIRED", "INCLUDED"]}
            />
            <Toggle
              label="Recurring"
              checked={plan.recurring}
              onChange={(value) => setPlan({ ...plan, recurring: value })}
            />
            <Toggle
              label="Allow with another plan"
              checked={plan.allowConcurrent}
              onChange={(value) => setPlan({ ...plan, allowConcurrent: value })}
            />
            <Toggle
              label="Active"
              checked={plan.active}
              onChange={(value) => setPlan({ ...plan, active: value })}
            />
            <Input
              label="Display order"
              type="number"
              value={plan.displayOrder}
              onChange={(value) => setPlan({ ...plan, displayOrder: value })}
            />
          </div>
          <TextArea
            label="Description"
            value={plan.description}
            onChange={(value) => setPlan({ ...plan, description: value })}
          />
          <VersionBox title="Price version">
            <Input
              label="Price *"
              type="number"
              value={plan.price}
              onChange={(value) => setPlan({ ...plan, price: value })}
            />
            <Input
              label="Effective from *"
              type="date"
              value={plan.effectiveFrom}
              onChange={(value) => setPlan({ ...plan, effectiveFrom: value })}
            />
            <Toggle
              label="GST applicable"
              checked={plan.gstApplicable}
              onChange={(value) => setPlan({ ...plan, gstApplicable: value })}
            />
            {plan.gstApplicable ? (
              <>
                <Input
                  label="GST rate"
                  type="number"
                  value={plan.gstRate}
                  onChange={(value) => setPlan({ ...plan, gstRate: value })}
                />
                <PriceTypeField
                  value={plan.priceType}
                  onChange={(value) => setPlan({ ...plan, priceType: value })}
                />
              </>
            ) : null}
          </VersionBox>
          <SaveRow
            saving={saving}
            isEdit={Boolean(plan.id)}
            onNew={() => setPlan(blankPlan)}
            onSave={() => void save({ action: "save-daycare-plan", ...plan })}
          />
          {plan.id ? (
            <CatalogueActions
              status={
                catalogue.daycarePlans.find((item) => item.id === plan.id)
                  ?.status ?? "INACTIVE"
              }
              busy={saving}
              onDuplicate={() =>
                setPlan({
                  ...plan,
                  id: "",
                  name: `${plan.name} Copy`,
                  code: `${plan.code}_COPY_${Date.now().toString().slice(-5)}`,
                })
              }
              onAction={(operation) =>
                void lifecycle("DAYCARE_PLAN", plan.id, operation)
              }
            />
          ) : null}
          <div
            id="daycare-plan-replacement"
            className="scroll-mt-28 rounded-[26px] border border-[#DCCDE5] bg-[#FBF8FD] p-5 md:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
                  Enrollment contracts
                </p>
                <h3 className="mt-1 text-xl font-black text-[#2D1736]">
                  Replace a plan safely
                </h3>
                <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-[#6F6472]">
                  Preview every affected child before applying. CentreOS ends the
                  old contract service on the chosen date and creates a new
                  price snapshot; attendance and historical invoices remain unchanged.
                </p>
              </div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <SelectEditor
                label="Current plan *"
                value={replacement.oldPlanId}
                onChange={(value) => {
                  setReplacement({ ...replacement, oldPlanId: value });
                  setReplacementPreview(null);
                }}
                options={catalogue.daycarePlans.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
              <SelectEditor
                label="Replacement plan *"
                value={replacement.newPlanId}
                onChange={(value) => {
                  setReplacement({ ...replacement, newPlanId: value });
                  setReplacementPreview(null);
                }}
                options={catalogue.daycarePlans
                  .filter(
                    (item) =>
                      item.status === "ACTIVE" &&
                      item.id !== replacement.oldPlanId,
                  )
                  .map((item) => ({ value: item.id, label: item.name }))}
              />
              <Input
                label="Effective from *"
                type="date"
                value={replacement.effectiveFrom}
                onChange={(value) => {
                  setReplacement({ ...replacement, effectiveFrom: value });
                  setReplacementPreview(null);
                }}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={
                  saving ||
                  !replacement.oldPlanId ||
                  !replacement.newPlanId
                }
                onClick={() => void replacePlans(false)}
                className="rounded-2xl border border-[#6A328F] bg-white px-5 py-3 text-sm font-black text-[#6A328F] disabled:opacity-50"
              >
                Preview affected children
              </button>
            </div>
            {replacementPreview ? (
              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#2D1736]">
                    {replacementPreview.affectedPlans.length} active child
                    contract{replacementPreview.affectedPlans.length === 1
                      ? ""
                      : "s"}
                  </p>
                  {replacementPreview.affectedPlans.length ? (
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedReplacementPlans(
                          selectedReplacementPlans.length ===
                            replacementPreview.affectedPlans.length
                            ? []
                            : replacementPreview.affectedPlans.map(
                                (item) => item.studentPlanId,
                              ),
                        )
                      }
                      className="text-xs font-black text-[#6A328F]"
                    >
                      {selectedReplacementPlans.length ===
                      replacementPreview.affectedPlans.length
                        ? "Clear all"
                        : "Select all"}
                    </button>
                  ) : null}
                </div>
                {replacementPreview.affectedPlans.map((item) => (
                  <label
                    key={item.studentPlanId}
                    className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E8E1EB] bg-white p-4"
                  >
                    <input
                      type="checkbox"
                      checked={selectedReplacementPlans.includes(
                        item.studentPlanId,
                      )}
                      onChange={(event) =>
                        setSelectedReplacementPlans((current) =>
                          event.target.checked
                            ? [...current, item.studentPlanId]
                            : current.filter((id) => id !== item.studentPlanId),
                        )
                      }
                      className="mt-1 h-4 w-4 accent-[#6A328F]"
                    />
                    <span className="min-w-0 flex-1">
                      <strong className="block text-sm text-[#2D1736]">
                        {item.studentName} · {item.studentNumber}
                      </strong>
                      <span className="mt-1 block text-xs font-semibold text-[#817684]">
                        Contract {item.contractNumber || "—"} · Current {money(item.currentAmount)} · {item.historicalSessions} historical session{item.historicalSessions === 1 ? "" : "s"}
                      </span>
                    </span>
                  </label>
                ))}
                {replacementPreview.affectedPlans.length ? (
                  <button
                    type="button"
                    disabled={saving || selectedReplacementPlans.length === 0}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Replace the selected plan for ${selectedReplacementPlans.length} child contract${selectedReplacementPlans.length === 1 ? "" : "s"}? Historical invoices will remain unchanged.`,
                        )
                      )
                        void replacePlans(true);
                    }}
                    className="rounded-2xl bg-[#6A328F] px-5 py-3 text-sm font-black text-white disabled:opacity-50"
                  >
                    Apply to selected contracts
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
          <HistoryCards
            items={catalogue.daycarePlans.map((item) => ({
              id: item.id,
              title: item.name,
              status: item.status,
              detail: `${item.billingType} · ${item.hoursIncluded ?? "Flexible"} hours`,
              version: currentVersion(item.priceVersions)
                ? money(currentVersion(item.priceVersions)?.price)
                : "No price version",
            }))}
          />
        </Section>
      ) : null}

      {tab === "meals" ? (
        <Section
          title="Meals and combinations"
          subtitle="Create any meal and group meals into a separately priced package."
          icon={<Utensils />}
        >
          <div className="grid gap-6 xl:grid-cols-2">
            <div className="rounded-[24px] border border-[#E8E1EB] p-5">
              <h3 className="text-lg font-black text-[#2D1736]">
                Individual meal
              </h3>
              <SelectEditor
                label="Edit meal"
                value={meal.id}
                onChange={(id) => {
                  const item = catalogue.meals.find((entry) => entry.id === id);
                  if (!item) return setMeal(blankMeal);
                  const version = currentVersion(item.priceVersions);
                  setMeal({
                    id: item.id,
                    code: item.code,
                    name: item.name,
                    description: item.description ?? "",
                    active: item.status === "ACTIVE",
                    displayOrder: item.displayOrder.toString(),
                    price: String(version?.price ?? 0),
                    gstApplicable: version?.gstApplicable ?? false,
                    gstRate: version?.gstRate?.toString() ?? "",
                    priceType: version?.priceType ?? "GST_INCLUSIVE",
                    effectiveFrom: dateInput(version?.effectiveFrom),
                  });
                }}
                options={catalogue.meals.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
              <Input
                label="Meal name *"
                value={meal.name}
                onChange={(value) => setMeal({ ...meal, name: value })}
              />
              <Input
                label="Code"
                value={meal.code}
                onChange={(value) => setMeal({ ...meal, code: value })}
              />
              <TextArea
                label="Description"
                value={meal.description}
                onChange={(value) => setMeal({ ...meal, description: value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price"
                  type="number"
                  value={meal.price}
                  onChange={(value) => setMeal({ ...meal, price: value })}
                />
                <Input
                  label="Effective from"
                  type="date"
                  value={meal.effectiveFrom}
                  onChange={(value) =>
                    setMeal({ ...meal, effectiveFrom: value })
                  }
                />
                <Input
                  label="Display order"
                  type="number"
                  value={meal.displayOrder}
                  onChange={(value) =>
                    setMeal({ ...meal, displayOrder: value })
                  }
                />
                <Toggle
                  label="Active"
                  checked={meal.active}
                  onChange={(value) => setMeal({ ...meal, active: value })}
                />
                <Toggle
                  label="GST applicable"
                  checked={meal.gstApplicable}
                  onChange={(value) =>
                    setMeal({ ...meal, gstApplicable: value })
                  }
                />
                {meal.gstApplicable ? (
                  <>
                    <Input
                      label="GST rate"
                      type="number"
                      value={meal.gstRate}
                      onChange={(value) => setMeal({ ...meal, gstRate: value })}
                    />
                    <PriceTypeField
                      value={meal.priceType}
                      onChange={(value) =>
                        setMeal({ ...meal, priceType: value })
                      }
                    />
                  </>
                ) : null}
              </div>
              <SaveRow
                saving={saving}
                isEdit={Boolean(meal.id)}
                onNew={() => setMeal(blankMeal)}
                onSave={() => void save({ action: "save-meal", ...meal })}
              />
              {meal.id ? (
                <CatalogueActions
                  status={
                    catalogue.meals.find((item) => item.id === meal.id)
                      ?.status ?? "INACTIVE"
                  }
                  busy={saving}
                  onDuplicate={() =>
                    setMeal({
                      ...meal,
                      id: "",
                      name: `${meal.name} Copy`,
                      code: `${meal.code}_COPY_${Date.now().toString().slice(-5)}`,
                    })
                  }
                  onAction={(operation) =>
                    void lifecycle("MEAL", meal.id, operation)
                  }
                />
              ) : null}
            </div>
            <div className="rounded-[24px] border border-[#E8E1EB] p-5">
              <h3 className="text-lg font-black text-[#2D1736]">
                Meal combination
              </h3>
              <SelectEditor
                label="Edit combination"
                value={combo.id}
                onChange={(id) => {
                  const item = catalogue.mealCombinations.find(
                    (entry) => entry.id === id,
                  );
                  if (!item) return setCombo(blankCombo);
                  const version = currentVersion(item.priceVersions);
                  setCombo({
                    id: item.id,
                    code: item.code,
                    name: item.name,
                    description: item.description ?? "",
                    active: item.status === "ACTIVE",
                    displayOrder: item.displayOrder.toString(),
                    price: String(version?.price ?? 0),
                    gstApplicable: version?.gstApplicable ?? false,
                    gstRate: version?.gstRate?.toString() ?? "",
                    priceType: version?.priceType ?? "GST_INCLUSIVE",
                    effectiveFrom: dateInput(version?.effectiveFrom),
                    mealIds: item.items.map((entry) => entry.mealId),
                  });
                }}
                options={catalogue.mealCombinations.map((item) => ({
                  value: item.id,
                  label: item.name,
                }))}
              />
              <Input
                label="Combination name *"
                value={combo.name}
                onChange={(value) => setCombo({ ...combo, name: value })}
              />
              <Input
                label="Code"
                value={combo.code}
                onChange={(value) => setCombo({ ...combo, code: value })}
              />
              <TextArea
                label="Description"
                value={combo.description}
                onChange={(value) => setCombo({ ...combo, description: value })}
              />
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-[0.12em] text-[#817684]">
                  Meals in this combination
                </span>
                {catalogue.meals.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-center gap-2 text-sm font-bold text-[#4E3B54]"
                  >
                    <input
                      type="checkbox"
                      checked={combo.mealIds.includes(item.id)}
                      onChange={(event) =>
                        setCombo({
                          ...combo,
                          mealIds: event.target.checked
                            ? [...combo.mealIds, item.id]
                            : combo.mealIds.filter((id) => id !== item.id),
                        })
                      }
                    />
                    {item.name}
                  </label>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Input
                  label="Combination price"
                  type="number"
                  value={combo.price}
                  onChange={(value) => setCombo({ ...combo, price: value })}
                />
                <Input
                  label="Effective from"
                  type="date"
                  value={combo.effectiveFrom}
                  onChange={(value) =>
                    setCombo({ ...combo, effectiveFrom: value })
                  }
                />
                <Toggle
                  label="Active"
                  checked={combo.active}
                  onChange={(value) => setCombo({ ...combo, active: value })}
                />
                <Toggle
                  label="GST applicable"
                  checked={combo.gstApplicable}
                  onChange={(value) =>
                    setCombo({ ...combo, gstApplicable: value })
                  }
                />
                {combo.gstApplicable ? (
                  <>
                    <Input
                      label="GST rate"
                      type="number"
                      value={combo.gstRate}
                      onChange={(value) =>
                        setCombo({ ...combo, gstRate: value })
                      }
                    />
                    <PriceTypeField
                      value={combo.priceType}
                      onChange={(value) =>
                        setCombo({ ...combo, priceType: value })
                      }
                    />
                  </>
                ) : null}
              </div>
              <SaveRow
                saving={saving}
                isEdit={Boolean(combo.id)}
                onNew={() => setCombo(blankCombo)}
                onSave={() =>
                  void save({ action: "save-meal-combination", ...combo })
                }
              />
              {combo.id ? (
                <CatalogueActions
                  status={
                    catalogue.mealCombinations.find(
                      (item) => item.id === combo.id,
                    )?.status ?? "INACTIVE"
                  }
                  busy={saving}
                  onDuplicate={() =>
                    setCombo({
                      ...combo,
                      id: "",
                      name: `${combo.name} Copy`,
                      code: `${combo.code}_COPY_${Date.now().toString().slice(-5)}`,
                    })
                  }
                  onAction={(operation) =>
                    void lifecycle("MEAL_COMBINATION", combo.id, operation)
                  }
                />
              ) : null}
            </div>
          </div>
        </Section>
      ) : null}

      {tab === "charges" ? (
        <Section
          title="Other, annual and kit charges"
          subtitle="Create each charge type once. Staff can then add it to a child's pending ledger without re-entering it on Fees."
          icon={<Tags />}
        >
          <SelectEditor
            label="Edit an existing charge type"
            value={charge.id}
            onChange={(id) => {
              const item = catalogue.chargeDefinitions.find(
                (entry) => entry.id === id,
              );
              if (!item) return setCharge(blankCharge);
              setCharge({
                id: item.id,
                code: item.code,
                name: item.name,
                description: item.description ?? "",
                category: item.category,
                defaultAmount:
                  item.defaultAmount == null ? "" : String(item.defaultAmount),
                gstApplicable: item.gstApplicable,
                gstRate: item.gstRate == null ? "" : String(item.gstRate),
                priceType: item.priceType ?? "GST_INCLUSIVE",
                active: item.active,
                displayOrder: String(item.displayOrder),
              });
            }}
            options={catalogue.chargeDefinitions.map((item) => ({
              value: item.id,
              label: `${item.name} · ${item.category.replaceAll("_", " ")}`,
            }))}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Charge name *"
              value={charge.name}
              onChange={(value) => setCharge({ ...charge, name: value })}
            />
            <Input
              label="Code"
              value={charge.code}
              onChange={(value) => setCharge({ ...charge, code: value })}
              placeholder="Auto from name"
            />
            <Select
              label="Category *"
              value={charge.category}
              onChange={(value) => setCharge({ ...charge, category: value })}
              options={[
                "ANNUAL_FEE",
                "KIT_FEE",
                "ACTIVITY_FEE",
                "FOOD_FEE",
                "DAYCARE_FEE",
                "OTHER",
              ]}
            />
            <Input
              label="Default amount"
              type="number"
              value={charge.defaultAmount}
              onChange={(value) =>
                setCharge({ ...charge, defaultAmount: value })
              }
            />
            <Input
              label="Display order"
              type="number"
              value={charge.displayOrder}
              onChange={(value) =>
                setCharge({ ...charge, displayOrder: value })
              }
            />
            <Toggle
              label="Active"
              checked={charge.active}
              onChange={(value) => setCharge({ ...charge, active: value })}
            />
            <Toggle
              label="GST applicable"
              checked={charge.gstApplicable}
              onChange={(value) =>
                setCharge({ ...charge, gstApplicable: value })
              }
            />
            {charge.gstApplicable ? (
              <>
                <Input
                  label="GST rate"
                  type="number"
                  value={charge.gstRate}
                  onChange={(value) => setCharge({ ...charge, gstRate: value })}
                />
                <PriceTypeField
                  value={charge.priceType}
                  onChange={(value) =>
                    setCharge({ ...charge, priceType: value })
                  }
                />
              </>
            ) : null}
          </div>
          <TextArea
            label="Description"
            value={charge.description}
            onChange={(value) => setCharge({ ...charge, description: value })}
          />
          <SaveRow
            saving={saving}
            isEdit={Boolean(charge.id)}
            onNew={() => setCharge(blankCharge)}
            onSave={() =>
              void save({ action: "save-charge-definition", ...charge })
            }
          />
          {charge.id ? (
            <CatalogueActions
              status={
                catalogue.chargeDefinitions.find(
                  (item) => item.id === charge.id,
                )?.status ?? "INACTIVE"
              }
              busy={saving}
              onDuplicate={() =>
                setCharge({
                  ...charge,
                  id: "",
                  name: `${charge.name} Copy`,
                  code: `${charge.code}_COPY_${Date.now().toString().slice(-5)}`,
                })
              }
              onAction={(operation) =>
                void lifecycle("CHARGE", charge.id, operation)
              }
            />
          ) : null}
          <HistoryCards
            items={catalogue.chargeDefinitions.map((item) => ({
              id: item.id,
              title: item.name,
              status: item.status,
              detail: item.category.replaceAll("_", " "),
              version:
                item.defaultAmount == null
                  ? "Amount entered when used"
                  : money(item.defaultAmount),
            }))}
          />
        </Section>
      ) : null}

      {tab === "settings" ? (
        <Section
          title="Billing and receipt settings"
          subtitle="These values drive recurring invoices and receipt numbering."
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Input
              label="Due day"
              type="number"
              value={String(settings.dueDay)}
              onChange={(value) =>
                setSettings({ ...settings, dueDay: Number(value) })
              }
            />
            <Input
              label="Academic year starts (month)"
              type="number"
              value={String(settings.academicYearStartMonth)}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  academicYearStartMonth: Number(value),
                })
              }
            />
            <Select
              label="Annual and kit charging policy"
              value={settings.academicChargePolicy}
              onChange={(value) =>
                setSettings({ ...settings, academicChargePolicy: value })
              }
              options={["ACADEMIC_SESSION", "ROLLING_12_MONTHS", "MANUAL_ONLY"]}
            />
            <Input
              label="Daycare capacity"
              type="number"
              value={
                settings.daycareCapacity == null
                  ? ""
                  : String(settings.daycareCapacity)
              }
              onChange={(value) =>
                setSettings({
                  ...settings,
                  daycareCapacity: value ? Number(value) : null,
                })
              }
            />
            <Input
              label="Invoice prefix"
              value={settings.invoicePrefix}
              onChange={(value) =>
                setSettings({ ...settings, invoicePrefix: value })
              }
            />
            <Input
              label="Receipt prefix"
              value={settings.receiptPrefix}
              onChange={(value) =>
                setSettings({ ...settings, receiptPrefix: value })
              }
            />
            <Select
              label="Default invoice behaviour"
              value={settings.defaultInvoiceMode}
              onChange={(value) =>
                setSettings({ ...settings, defaultInvoiceMode: value })
              }
              options={["COMBINED", "SPLIT_DAYCARE"]}
            />
            <Select
              label="Additional daycare on parent bill"
              value={settings.additionalDaycareDisplayMode}
              onChange={(value) =>
                setSettings({
                  ...settings,
                  additionalDaycareDisplayMode: value,
                })
              }
              options={["DETAILED", "MERGED", "HIDDEN_DETAIL"]}
            />
            <Toggle
              label="Automatic monthly billing"
              checked={settings.automaticMonthlyBilling}
              onChange={(value) =>
                setSettings({ ...settings, automaticMonthlyBilling: value })
              }
            />
          </div>
          <TextArea
            label="Payment terms"
            value={settings.paymentTerms}
            onChange={(value) =>
              setSettings({ ...settings, paymentTerms: value })
            }
          />
          <button
            type="button"
            disabled={saving}
            onClick={() => void save({ action: "save-settings", ...settings })}
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#6A328F] px-6 font-black text-white disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            Save billing settings
          </button>
        </Section>
      ) : null}
    </div>
  );
}

function prefixTaxPatch(
  prefix: "admission" | "annual" | "kit" | "monthly",
  patch: { gstApplicable?: boolean; gstRate?: string; priceType?: PriceType },
) {
  const result: Record<string, boolean | string> = {};
  if (patch.gstApplicable != null)
    result[`${prefix}GstApplicable`] = patch.gstApplicable;
  if (patch.gstRate != null) result[`${prefix}GstRate`] = patch.gstRate;
  if (patch.priceType != null) result[`${prefix}PriceType`] = patch.priceType;
  return result;
}

function PriceTypeField({
  value,
  onChange,
}: {
  value: PriceType;
  onChange: (value: PriceType) => void;
}) {
  return (
    <Select
      label="Price type"
      value={value}
      onChange={(next) => onChange(next as PriceType)}
      options={["GST_INCLUSIVE", "GST_EXCLUSIVE"]}
    />
  );
}

function ProgrammeCharge({
  label,
  amount,
  gstApplicable,
  gstRate,
  priceType,
  onChange,
}: {
  label: string;
  amount: string;
  gstApplicable: boolean;
  gstRate: string;
  priceType: PriceType;
  onChange: (patch: {
    amount?: string;
    gstApplicable?: boolean;
    gstRate?: string;
    priceType?: PriceType;
  }) => void;
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[#E3D6E8] bg-white p-4">
      <Input
        label={label}
        type="number"
        value={amount}
        onChange={(value) => onChange({ amount: value })}
      />
      <Toggle
        label="GST applicable"
        checked={gstApplicable}
        onChange={(value) => onChange({ gstApplicable: value })}
      />
      {gstApplicable ? (
        <>
          <Input
            label="GST rate"
            type="number"
            value={gstRate}
            onChange={(value) => onChange({ gstRate: value })}
          />
          <PriceTypeField
            value={priceType}
            onChange={(value) => onChange({ priceType: value })}
          />
        </>
      ) : null}
    </div>
  );
}

function Section({
  title,
  subtitle,
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-[#E8E1EB] bg-white p-5 shadow-[0_18px_50px_rgba(45,23,54,0.07)] md:p-7">
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-2xl bg-[#F2EAF7] p-3 text-[#6A328F]">
          {icon ?? <Save />}
        </div>
        <div>
          <h2 className="text-2xl font-black text-[#2D1736]">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-[#817684]">
            {subtitle}
          </p>
        </div>
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
function Input({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#817684]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "0.01" : undefined}
        className="min-h-12 w-full rounded-2xl border border-[#DED3E4] bg-white px-4 font-bold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
      />
    </label>
  );
}
function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#817684]">
        {label}
      </span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="w-full rounded-2xl border border-[#DED3E4] bg-white px-4 py-3 font-semibold text-[#2D1736] outline-none focus:border-[#6A328F]"
      />
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#817684]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-[#DED3E4] bg-white px-4 font-bold text-[#2D1736]"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option.replaceAll("_", " ")}
          </option>
        ))}
      </select>
    </label>
  );
}
function SelectEditor({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block max-w-xl">
      <span className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-[#817684]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-12 w-full rounded-2xl border border-[#DED3E4] bg-[#FBF8FD] px-4 font-bold text-[#2D1736]"
      >
        <option value="">Create new</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DED3E4] px-4">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-5 w-5 accent-[#6A328F]"
      />
      <span className="font-bold text-[#4E3B54]">{label}</span>
    </label>
  );
}
function VersionBox({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[24px] bg-[#F8F3FA] p-5">
      <h3 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-[#6A328F]">
        {title}
      </h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">{children}</div>
    </div>
  );
}
function SaveRow({
  saving,
  isEdit,
  onNew,
  onSave,
}: {
  saving: boolean;
  isEdit: boolean;
  onNew: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        disabled={saving}
        onClick={onSave}
        className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[#6A328F] px-6 font-black text-white disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <Save size={18} />
        )}
        {isEdit ? "Save changes / new price version" : "Create"}
      </button>
      {isEdit ? (
        <button
          type="button"
          onClick={onNew}
          className="inline-flex min-h-12 items-center gap-2 rounded-2xl border border-[#D8C9DF] px-5 font-black text-[#5B2A86]"
        >
          <Plus size={18} />
          Create another
        </button>
      ) : null}
    </div>
  );
}
function CatalogueActions({
  status,
  busy,
  onDuplicate,
  onAction,
}: {
  status: CatalogueStatus;
  busy: boolean;
  onDuplicate: () => void;
  onAction: (
    operation:
      "ACTIVATE" | "DEACTIVATE" | "ARCHIVE" | "DELETE" | "PERMANENT_DELETE",
  ) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#E8E1EB] bg-[#FCFBFD] p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-[#817684]">
        Owner lifecycle controls / current: {status}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={onDuplicate}
          className="rounded-xl border border-[#D8C9DF] bg-white px-4 py-2 text-xs font-black text-[#5B2A86]"
        >
          Duplicate
        </button>
        {status !== "ACTIVE" ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction("ACTIVATE")}
            className="rounded-xl bg-green-100 px-4 py-2 text-xs font-black text-green-800"
          >
            Activate
          </button>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => onAction("DEACTIVATE")}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-700"
          >
            Deactivate
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("ARCHIVE")}
          className="rounded-xl bg-amber-100 px-4 py-2 text-xs font-black text-amber-800"
        >
          Archive
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("DELETE")}
          className="rounded-xl bg-rose-100 px-4 py-2 text-xs font-black text-rose-800"
        >
          Delete
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => onAction("PERMANENT_DELETE")}
          className="rounded-xl border border-red-300 bg-white px-4 py-2 text-xs font-black text-red-700"
        >
          Permanent Delete
        </button>
      </div>
      <p className="mt-3 text-[11px] font-semibold text-[#817684]">
        CentreOS checks students, plans, sessions and historical invoices before
        deletion. Used items must be archived.
      </p>
    </div>
  );
}
function HistoryCards({
  items,
}: {
  items: Array<{
    id: string;
    title: string;
    status: string;
    detail: string;
    version: string;
  }>;
}) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article
          key={item.id}
          className="rounded-2xl border border-[#ECE5EF] bg-[#FCFBFD] p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <strong className="text-[#2D1736]">{item.title}</strong>
            <span
              className={`rounded-full px-2 py-1 text-[10px] font-black ${item.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}
            >
              {item.status}
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold text-[#817684]">
            {item.detail}
          </p>
          <p className="mt-3 font-black text-[#6A328F]">{item.version}</p>
        </article>
      ))}
    </div>
  );
}
