import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  History,
  IndianRupee,
  Plus,
  Save,
  Settings2,
  ShieldCheck,
  Tag,
  XCircle,
} from "lucide-react";

import AdminLayout from "@/components/admin/AdminLayout";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type FeeSettingsPageProps = {
  searchParams: Promise<{
    success?: string;
    error?: string;
  }>;
};

const programmes = [
  {
    value: "PLAYGROUP",
    label: "Playgroup",
  },
  {
    value: "NURSERY",
    label: "Nursery",
  },
  {
    value: "JUNIOR_KG",
    label: "Junior KG",
  },
  {
    value: "SENIOR_KG",
    label: "Senior KG",
  },
  {
    value: "DAYCARE",
    label: "Daycare",
  },
] as const;

const feeCategories = [
  {
    value: "MONTHLY_PRESCHOOL_FEE",
    label: "Monthly Preschool Fee",
  },
  {
    value: "DAYCARE_FEE",
    label: "Daycare Hourly Fee",
  },
  {
    value: "DAYCARE_LUNCH_FEE",
    label: "Daycare Lunch Plan",
  },
  {
    value: "DAYCARE_EVENING_SNACK_FEE",
    label: "Daycare Evening Snack Plan",
  },
  {
    value: "DAYCARE_MEAL_COMBO_FEE",
    label: "Daycare Lunch + Evening Snack Plan",
  },
  {
    value: "ANNUAL_FEE",
    label: "Annual Fee",
  },
  {
    value: "ADMISSION_FEE",
    label: "Admission Fee",
  },
  {
    value: "ACTIVITY_FEE",
    label: "Activity Fee",
  },
  {
    value: "KIT_FEE",
    label: "Kit Fee",
  },
  {
    value: "OTHER",
    label: "Other",
  },
] as const;

const lateFeeTypes = [
  {
    value: "PER_DAY",
    label: "Per day",
  },
  {
    value: "FIXED",
    label: "Fixed amount",
  },
] as const;

type ProgrammeValue =
  (typeof programmes)[number]["value"];

type FeeCategoryValue =
  (typeof feeCategories)[number]["value"];

type LateFeeType =
  (typeof lateFeeTypes)[number]["value"];

const programmeLabels = Object.fromEntries(
  programmes.map((programme) => [
    programme.value,
    programme.label,
  ]),
) as Record<string, string>;

const categoryLabels = Object.fromEntries(
  feeCategories.map((category) => [
    category.value,
    category.label,
  ]),
) as Record<string, string>;

const inputClassName =
  "mt-2 min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white px-4 text-sm font-semibold text-[#2D1736] outline-none transition placeholder:text-[#A89FAB] focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10";

function cleanText(value: FormDataEntryValue | null) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseMoney(value: FormDataEntryValue | null) {
  const cleaned = cleanText(value).replace(
    /,/g,
    "",
  );

  if (!cleaned) {
    return 0;
  }

  const parsed = Number(cleaned);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function parseInteger(
  value: FormDataEntryValue | null,
) {
  const parsed = Number.parseInt(
    cleanText(value),
    10,
  );

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function parseDate(
  value: FormDataEntryValue | null,
) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return null;
  }

  const date = new Date(
    `${cleaned}T00:00:00.000+05:30`,
  );

  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function isProgramme(
  value: string,
): value is ProgrammeValue {
  return programmes.some(
    (programme) =>
      programme.value === value,
  );
}

function isFeeCategory(
  value: string,
): value is FeeCategoryValue {
  return feeCategories.some(
    (category) =>
      category.value === value,
  );
}

function isLateFeeType(
  value: string,
): value is LateFeeType {
  return lateFeeTypes.some(
    (type) => type.value === value,
  );
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "No end date";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function getTodayInputValue() {
  return new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date());
}

async function requireFeeSettingsAccess() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  if (
    session.role !== "OWNER"
  ) {
    redirect("/admin?access=denied");
  }

  return session;
}

async function saveProgrammeFeeSetting(
  formData: FormData,
) {
  "use server";

  await requireFeeSettingsAccess();

  const programme = cleanText(
    formData.get("programme"),
  );

  const category = cleanText(
    formData.get("category"),
  );

  const title = cleanText(
    formData.get("title"),
  );

  const amount = parseMoney(
    formData.get("amount"),
  );

  const gstApplicable =
    formData.get("gstApplicable") === "on";

  const gstRate = gstApplicable
    ? parseMoney(formData.get("gstRate"))
    : 0;

  const effectiveFrom = parseDate(
    formData.get("effectiveFrom"),
  );

  if (!isProgramme(programme)) {
    redirect(
      "/admin/settings/fees?error=Please+select+a+valid+programme",
    );
  }

  if (!isFeeCategory(category)) {
    redirect(
      "/admin/settings/fees?error=Please+select+a+valid+fee+category",
    );
  }

  if (!title) {
    redirect(
      "/admin/settings/fees?error=Please+enter+a+fee+title",
    );
  }

  if (amount <= 0) {
    redirect(
      "/admin/settings/fees?error=Fee+amount+must+be+greater+than+zero",
    );
  }

  if (!effectiveFrom) {
    redirect(
      "/admin/settings/fees?error=Please+enter+a+valid+effective+date",
    );
  }

  if (
    gstApplicable &&
    (gstRate <= 0 || gstRate > 100)
  ) {
    redirect(
      "/admin/settings/fees?error=Please+enter+a+valid+GST+rate",
    );
  }

  const previousEndDate = new Date(
    effectiveFrom.getTime() - 1,
  );

  await prisma.$transaction(
    async (transaction) => {
      const existingSettings =
        await transaction.programmeFeeSetting.findMany({
          where: {
            programme,
            category,
            active: true,
          },
          select: {
            id: true,
            effectiveFrom: true,
            effectiveTo: true,
          },
        });

      for (const setting of existingSettings) {
        if (
          setting.effectiveFrom.getTime() >=
          effectiveFrom.getTime()
        ) {
          await transaction.programmeFeeSetting.update({
            where: { id: setting.id },
            data: { active: false },
          });
          continue;
        }

        if (
          setting.effectiveTo === null ||
          setting.effectiveTo.getTime() >=
            effectiveFrom.getTime()
        ) {
          await transaction.programmeFeeSetting.update({
            where: { id: setting.id },
            data: {
              effectiveTo: previousEndDate,
            },
          });
        }
      }

      await transaction.programmeFeeSetting.create({
        data: {
          programme,
          category,
          title,
          amount,
          gstApplicable,
          gstRate: gstApplicable
            ? gstRate
            : null,
          effectiveFrom,
          effectiveTo: null,
          active: true,
        },
      });
    },
  );

  revalidatePath("/admin/settings/fees");
  revalidatePath("/admin/fees");

  redirect(
    "/admin/settings/fees?success=Programme+fee+setting+saved",
  );
}

async function deactivateProgrammeFeeSetting(
  formData: FormData,
) {
  "use server";

  await requireFeeSettingsAccess();

  const id = cleanText(
    formData.get("id"),
  );

  if (!id) {
    redirect(
      "/admin/settings/fees?error=Fee+setting+ID+is+missing",
    );
  }

  const setting =
    await prisma.programmeFeeSetting.findUnique({
      where: { id },
      select: { effectiveFrom: true },
    });

  if (!setting) {
    redirect(
      "/admin/settings/fees?error=Fee+setting+was+not+found",
    );
  }

  const now = new Date();

  await prisma.programmeFeeSetting.update({
    where: { id },
    data: {
      active: false,
      effectiveTo:
        now < setting.effectiveFrom
          ? setting.effectiveFrom
          : now,
    },
  });

  revalidatePath("/admin/settings/fees");

  redirect(
    "/admin/settings/fees?success=Fee+setting+deactivated",
  );
}

async function saveLateFeeSetting(
  formData: FormData,
) {
  "use server";

  await requireFeeSettingsAccess();

  const dueDay = parseInteger(
    formData.get("dueDay"),
  );

  const gracePeriodDays = parseInteger(
    formData.get("gracePeriodDays"),
  );

  const calculationType = cleanText(
    formData.get("calculationType"),
  );

  const amount = parseMoney(
    formData.get("amount"),
  );

  const maximumAmountText = cleanText(
    formData.get("maximumAmount"),
  );

  const maximumAmount = maximumAmountText
    ? parseMoney(
        formData.get("maximumAmount"),
      )
    : null;

  const effectiveFrom = parseDate(
    formData.get("effectiveFrom"),
  );

  if (dueDay < 1 || dueDay > 28) {
    redirect(
      "/admin/settings/fees?error=Due+day+must+be+between+1+and+28",
    );
  }

  if (
    gracePeriodDays < 0 ||
    gracePeriodDays > 31
  ) {
    redirect(
      "/admin/settings/fees?error=Grace+period+must+be+between+0+and+31+days",
    );
  }

  if (!isLateFeeType(calculationType)) {
    redirect(
      "/admin/settings/fees?error=Please+select+a+valid+late+fee+type",
    );
  }

  if (amount < 0) {
    redirect(
      "/admin/settings/fees?error=Late+fee+amount+cannot+be+negative",
    );
  }

  if (
    maximumAmount !== null &&
    maximumAmount < 0
  ) {
    redirect(
      "/admin/settings/fees?error=Maximum+late+fee+cannot+be+negative",
    );
  }

  if (!effectiveFrom) {
    redirect(
      "/admin/settings/fees?error=Please+enter+a+valid+effective+date",
    );
  }

  const previousEndDate = new Date(
    effectiveFrom.getTime() - 1,
  );

  await prisma.$transaction(
    async (transaction) => {
      const existingSettings =
        await transaction.lateFeeSetting.findMany({
          where: {
            active: true,
          },
          select: {
            id: true,
            effectiveFrom: true,
            effectiveTo: true,
          },
        });

      for (const setting of existingSettings) {
        if (
          setting.effectiveFrom.getTime() >=
          effectiveFrom.getTime()
        ) {
          await transaction.lateFeeSetting.update({
            where: { id: setting.id },
            data: { active: false },
          });
          continue;
        }

        if (
          setting.effectiveTo === null ||
          setting.effectiveTo.getTime() >=
            effectiveFrom.getTime()
        ) {
          await transaction.lateFeeSetting.update({
            where: { id: setting.id },
            data: {
              effectiveTo: previousEndDate,
            },
          });
        }
      }

      await transaction.lateFeeSetting.create({
        data: {
          dueDay,
          gracePeriodDays,
          calculationType,
          amount,
          maximumAmount,
          effectiveFrom,
          effectiveTo: null,
          active: true,
        },
      });
    },
  );

  revalidatePath("/admin/settings/fees");
  revalidatePath("/admin/fees");

  redirect(
    "/admin/settings/fees?success=Late+fee+rule+saved",
  );
}

async function deactivateLateFeeSetting(
  formData: FormData,
) {
  "use server";

  await requireFeeSettingsAccess();

  const id = cleanText(
    formData.get("id"),
  );

  if (!id) {
    redirect(
      "/admin/settings/fees?error=Late+fee+setting+ID+is+missing",
    );
  }

  const setting =
    await prisma.lateFeeSetting.findUnique({
      where: { id },
      select: { effectiveFrom: true },
    });

  if (!setting) {
    redirect(
      "/admin/settings/fees?error=Late+fee+setting+was+not+found",
    );
  }

  const now = new Date();

  await prisma.lateFeeSetting.update({
    where: { id },
    data: {
      active: false,
      effectiveTo:
        now < setting.effectiveFrom
          ? setting.effectiveFrom
          : now,
    },
  });

  revalidatePath("/admin/settings/fees");

  redirect(
    "/admin/settings/fees?success=Late+fee+rule+deactivated",
  );
}

export const dynamic = "force-dynamic";

export default async function FeeSettingsPage({
  searchParams,
}: FeeSettingsPageProps) {
  await requireFeeSettingsAccess();

  const resolvedSearchParams =
    await searchParams;

  const [feeSettings, lateFeeSettings] =
    await Promise.all([
      prisma.programmeFeeSetting.findMany({
        orderBy: [
          {
            active: "desc",
          },
          {
            programme: "asc",
          },
          {
            category: "asc",
          },
          {
            effectiveFrom: "desc",
          },
        ],
      }),

      prisma.lateFeeSetting.findMany({
        orderBy: [
          {
            active: "desc",
          },
          {
            effectiveFrom: "desc",
          },
        ],
      }),
    ]);

  const activeFeeSettings =
    feeSettings.filter(
      (setting) => setting.active,
    );

  const activeLateFeeSetting =
    lateFeeSettings.find(
      (setting) => setting.active,
    ) ?? null;

  return (
    <AdminLayout>
      <div className="space-y-8">
        <section className="overflow-hidden rounded-[30px] bg-[#2D1736] px-5 py-7 text-white shadow-[0_22px_65px_rgba(45,23,54,0.18)] sm:px-7 lg:px-9 lg:py-9">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F6C84B] text-[#2D1736]">
                  <Settings2
                    aria-hidden="true"
                    size={23}
                  />
                </span>

                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#F6C84B]">
                  Owner-only legacy compatibility
                </p>
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-[-0.04em] sm:text-4xl lg:text-5xl">
                Legacy Fee & Late-Fee Settings
              </h1>

              <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
                Use Billing Catalogue for all new programme, daycare, meal and
                charge configuration. This protected page remains available only
                for legacy fee records and late-fee compatibility.
              </p>
            </div>

            <div className="rounded-[22px] border border-white/15 bg-white/10 px-5 py-4">
              <p className="text-xs font-bold text-white/60">
                Active fee structures
              </p>

              <p className="mt-1 text-3xl font-black text-[#F6C84B]">
                {activeFeeSettings.length}
              </p>
            </div>
          </div>
        </section>

        {resolvedSearchParams.success ? (
          <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-4">
            <CheckCircle2
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-green-700"
            />

            <p className="text-sm font-black text-green-800">
              {resolvedSearchParams.success}
            </p>
          </div>
        ) : null}

        {resolvedSearchParams.error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4">
            <XCircle
              aria-hidden="true"
              size={20}
              className="mt-0.5 shrink-0 text-red-700"
            />

            <p className="text-sm font-black text-red-800">
              {resolvedSearchParams.error}
            </p>
          </div>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-6">
            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F3EAF8] text-[#5B2A86]">
                  <Plus
                    aria-hidden="true"
                    size={22}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                    New fee version
                  </p>

                                   <h2 className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl">
                    Add or update a programme fee
                  </h2>

                  <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                    Set the fee amount, GST rate and effective date here.
                    Daycare uses an hourly rate, while Lunch, Evening Snack
                    and the combined meal plan use monthly package prices.
                    New versions never change old receipts.
                  </p>
                </div>
              </div>

              <form
                action={saveProgrammeFeeSetting}
                className="mt-7"
              >
                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block">
                    <span className="text-sm font-black text-[#35243E]">
                      Programme *
                    </span>

                    <select
                      name="programme"
                      required
                      defaultValue="PLAYGROUP"
                      className={inputClassName}
                    >
                      {programmes.map(
                        (programme) => (
                          <option
                            key={programme.value}
                            value={programme.value}
                          >
                            {programme.label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-[#35243E]">
                      Fee category *
                    </span>

                    <select
                      name="category"
                      required
                      defaultValue="MONTHLY_PRESCHOOL_FEE"
                      className={inputClassName}
                    >
                      {feeCategories.map(
                        (category) => (
                          <option
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </option>
                        ),
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-[#35243E]">
                      Fee title *
                    </span>

                    <input
                      type="text"
                      name="title"
                      required
                      placeholder="Example: Monthly Preschool Fee"
                      className={inputClassName}
                    />
                  </label>

                                    <label className="block">
                    <span className="text-sm font-black text-[#35243E]">
                      Standard amount / package price *
                    </span>

                    <div className="relative mt-2">
                      <IndianRupee
                        aria-hidden="true"
                        size={17}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#958A99]"
                      />

                      <input
                        type="number"
                        name="amount"
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="0"
                        className="min-h-12 w-full rounded-2xl border border-[#DCCFE4] bg-white py-3 pl-11 pr-4 text-sm font-semibold text-[#2D1736] outline-none focus:border-[#6A328F] focus:ring-4 focus:ring-[#6A328F]/10"
                      />
                    </div>

                    <p className="mt-2 text-xs font-semibold leading-5 text-[#817684]">
                      For Daycare Fee, enter the price for one hour. For
                      Lunch, Evening Snack or Lunch + Evening Snack, enter
                      the complete monthly package price. When GST is enabled,
                      this is the final GST-inclusive amount.
                    </p>
                  </label>
                                      <label className="block">
                    <span className="text-sm font-black text-[#35243E]">
                      Effective from *
                    </span>

                    <input
                      type="date"
                      name="effectiveFrom"
                      required
                      defaultValue={getTodayInputValue()}
                      className={inputClassName}
                    />
                  </label>

                  <label className="flex items-start gap-3 rounded-2xl border border-[#E5DCE9] bg-[#FAF8FC] p-4">
                    <input
                      type="checkbox"
                      name="gstApplicable"
                      className="mt-1 h-4 w-4 accent-[#5B2A86]"
                    />

                    <span>
                      <span className="block text-sm font-black text-[#2D1736]">
                                                GST included in this fee
                      </span>

                      <span className="mt-1 block text-xs font-semibold leading-5 text-[#817684]">
                                                GST will be extracted from the
                        amount above and will not be
                        added to the parent’s bill.
                      </span>
                    </span>
                  </label>

                  <label className="block">
                    <span className="text-sm font-black text-[#35243E]">
                      GST rate (%)
                    </span>

                    <input
                      type="number"
                      name="gstRate"
                      min="0"
                      max="100"
                      step="0.01"
                                            placeholder="Example: 18"
                      className={inputClassName}
                    />
                  </label>
                </div>

                <button
                  type="submit"
                  className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white transition hover:bg-[#4B206F]"
                >
                  <Save
                    aria-hidden="true"
                    size={17}
                  />
                  Save Fee Structure
                </button>
              </form>
            </section>

            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E9F8F2] text-[#28755D]">
                  <CircleDollarSign
                    aria-hidden="true"
                    size={22}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.13em] text-[#28755D]">
                    Current fees
                  </p>

                  <h2 className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl">
                    Active programme fee structure
                  </h2>
                </div>
              </div>

              {activeFeeSettings.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-[#DCCFE3] bg-[#FBF9FC] px-5 py-10 text-center">
                  <p className="text-sm font-bold text-[#817684]">
                    No active programme fee structure
                    has been created.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  {activeFeeSettings.map(
                    (setting) => (
                      <article
                        key={setting.id}
                        className="rounded-[22px] border border-[#E9E2ED] bg-[#FAF8FC] p-5"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="rounded-full bg-[#F3EAF8] px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-[#5B2A86]">
                              {programmeLabels[
                                setting.programme
                              ] ??
                                setting.programme}
                            </span>

                            <h3 className="mt-3 text-base font-black text-[#2D1736]">
                              {setting.title}
                            </h3>

                            <p className="mt-1 text-xs font-semibold text-[#817684]">
                              {categoryLabels[
                                setting.category
                              ] ??
                                setting.category}
                            </p>
                          </div>

                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em] text-green-700">
                            Active
                          </span>
                        </div>

                        <p className="mt-5 text-3xl font-black tracking-[-0.04em] text-[#5B2A86]">
                          {formatCurrency(
                            Number(setting.amount),
                          )}
                        </p>

                        <div className="mt-4 space-y-2 text-xs font-semibold text-[#817684]">
                          <p className="flex items-center gap-2">
                            <CalendarDays
                              aria-hidden="true"
                              size={15}
                            />

                            Effective from{" "}
                            {formatDate(
                              setting.effectiveFrom,
                            )}
                          </p>

                          <p className="flex items-center gap-2">
                            <ShieldCheck
                              aria-hidden="true"
                              size={15}
                            />

                            {setting.gstApplicable
                              ? `GST ${Number(
                                  setting.gstRate ??
                                    0,
                                )}%`
                              : "GST not applicable"}
                          </p>
                        </div>

                        <form
                          action={
                            deactivateProgrammeFeeSetting
                          }
                          className="mt-5"
                        >
                          <input
                            type="hidden"
                            name="id"
                            value={setting.id}
                          />

                          <button
                            type="submit"
                            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100"
                          >
                            <XCircle
                              aria-hidden="true"
                              size={15}
                            />
                            Deactivate
                          </button>
                        </form>
                      </article>
                    ),
                  )}
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFF3D5] text-[#8A6100]">
                  <Clock3
                    aria-hidden="true"
                    size={20}
                  />
                </span>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-[#8A6100]">
                    Late fee
                  </p>

                  <h2 className="text-lg font-black text-[#2D1736]">
                    Late-fee rules
                  </h2>
                </div>
              </div>

              {activeLateFeeSetting ? (
                <div className="mt-5 rounded-[20px] bg-[#FFF9EA] p-4">
                  <p className="text-xs font-black uppercase tracking-[0.08em] text-[#8A6100]">
                    Current active rule
                  </p>

                  <p className="mt-3 text-2xl font-black text-[#2D1736]">
                    {formatCurrency(
                      Number(
                        activeLateFeeSetting.amount,
                      ),
                    )}
                    {activeLateFeeSetting.calculationType ===
                    "PER_DAY"
                      ? " / day"
                      : " fixed"}
                  </p>

                  <div className="mt-4 space-y-2 text-xs font-semibold text-[#817684]">
                    <p>
                      Due date: Day{" "}
                      {activeLateFeeSetting.dueDay}
                    </p>

                    <p>
                      Grace period:{" "}
                      {
                        activeLateFeeSetting.gracePeriodDays
                      }{" "}
                      day(s)
                    </p>

                    <p>
                      Maximum:{" "}
                      {activeLateFeeSetting.maximumAmount
                        ? formatCurrency(
                            Number(
                              activeLateFeeSetting.maximumAmount,
                            ),
                          )
                        : "No maximum"}
                    </p>

                    <p>
                      Effective from:{" "}
                      {formatDate(
                        activeLateFeeSetting.effectiveFrom,
                      )}
                    </p>
                  </div>

                  <form
                    action={
                      deactivateLateFeeSetting
                    }
                    className="mt-4"
                  >
                    <input
                      type="hidden"
                      name="id"
                      value={
                        activeLateFeeSetting.id
                      }
                    />

                    <button
                      type="submit"
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-xs font-black text-red-700"
                    >
                      <XCircle
                        aria-hidden="true"
                        size={15}
                      />
                      Deactivate
                    </button>
                  </form>
                </div>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-[#E4D39C] bg-[#FFF9EA] px-4 py-6 text-center">
                  <p className="text-sm font-bold text-[#8A6100]">
                    No active late-fee rule.
                  </p>
                </div>
              )}

              <form
                action={saveLateFeeSetting}
                className="mt-6 space-y-5 border-t border-[#EEE8F1] pt-6"
              >
                <label className="block">
                  <span className="text-sm font-black text-[#35243E]">
                    Monthly due day *
                  </span>

                  <input
                    type="number"
                    name="dueDay"
                    required
                    min="1"
                    max="28"
                    defaultValue="5"
                    className={inputClassName}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#35243E]">
                    Grace-period days
                  </span>

                  <input
                    type="number"
                    name="gracePeriodDays"
                    min="0"
                    max="31"
                    defaultValue="0"
                    className={inputClassName}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#35243E]">
                    Calculation type *
                  </span>

                  <select
                    name="calculationType"
                    required
                    defaultValue="PER_DAY"
                    className={inputClassName}
                  >
                    {lateFeeTypes.map(
                      (type) => (
                        <option
                          key={type.value}
                          value={type.value}
                        >
                          {type.label}
                        </option>
                      ),
                    )}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#35243E]">
                    Late-fee amount *
                  </span>

                  <input
                    type="number"
                    name="amount"
                    required
                    min="0"
                    step="0.01"
                    defaultValue="50"
                    className={inputClassName}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#35243E]">
                    Maximum late fee
                  </span>

                  <input
                    type="number"
                    name="maximumAmount"
                    min="0"
                    step="0.01"
                    placeholder="Leave blank for no limit"
                    className={inputClassName}
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-black text-[#35243E]">
                    Effective from *
                  </span>

                  <input
                    type="date"
                    name="effectiveFrom"
                    required
                    defaultValue={getTodayInputValue()}
                    className={inputClassName}
                  />
                </label>

                <button
                  type="submit"
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#8A6100] px-5 text-sm font-black text-white transition hover:bg-[#6F4E00]"
                >
                  <Save
                    aria-hidden="true"
                    size={17}
                  />
                  Save Late-Fee Rule
                </button>
              </form>
            </section>

            <section className="rounded-[26px] bg-[#2D1736] p-5 text-white shadow-[0_18px_48px_rgba(45,23,54,0.16)] sm:p-6">
              <Tag
                aria-hidden="true"
                size={22}
                className="text-[#F6C84B]"
              />

              <h2 className="mt-4 text-lg font-black">
                How fee increases work
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-white/70">
                Enter the new amount and its effective
                date. CentreOS closes the previous active
                fee and stores the new amount as a separate
                version.
              </p>

              <div className="mt-5 rounded-2xl bg-white/10 p-4 text-xs font-semibold leading-6 text-white/75">
                <p>Example:</p>
                <p>₹6,000 until 31 Dec 2026</p>
                <p>₹6,500 from 1 Jan 2027</p>
              </div>
            </section>
          </aside>
        </section>

        <section className="rounded-[28px] border border-[#E9E2ED] bg-white p-5 shadow-[0_14px_40px_rgba(45,23,54,0.055)] sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E8F4FF] text-[#1769AA]">
              <History
                aria-hidden="true"
                size={22}
              />
            </span>

            <div>
              <p className="text-xs font-black uppercase tracking-[0.13em] text-[#1769AA]">
                Audit history
              </p>

              <h2 className="mt-1 text-xl font-black text-[#2D1736] sm:text-2xl">
                Previous fee structures
              </h2>
            </div>
          </div>

          {feeSettings.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-dashed border-[#DCCFE3] bg-[#FBF9FC] px-5 py-10 text-center">
              <p className="text-sm font-bold text-[#817684]">
                Fee history will appear here after
                saving the first structure.
              </p>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="min-w-[900px] w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left">
                    {[
                      "Programme",
                      "Category",
                      "Title",
                      "Amount",
                      "Effective From",
                      "Effective To",
                      "Status",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 pb-2 text-[10px] font-black uppercase tracking-[0.09em] text-[#8B808F]"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {feeSettings.map(
                    (setting) => (
                      <tr
                        key={setting.id}
                        className="bg-[#FAF8FC]"
                      >
                        <td className="rounded-l-2xl px-4 py-4 text-sm font-black text-[#2D1736]">
                          {programmeLabels[
                            setting.programme
                          ] ??
                            setting.programme}
                        </td>

                        <td className="px-4 py-4 text-xs font-bold text-[#625768]">
                          {categoryLabels[
                            setting.category
                          ] ??
                            setting.category}
                        </td>

                        <td className="px-4 py-4 text-xs font-bold text-[#625768]">
                          {setting.title}
                        </td>

                        <td className="px-4 py-4 text-sm font-black text-[#5B2A86]">
                          {formatCurrency(
                            Number(setting.amount),
                          )}
                        </td>

                        <td className="px-4 py-4 text-xs font-bold text-[#625768]">
                          {formatDate(
                            setting.effectiveFrom,
                          )}
                        </td>

                        <td className="px-4 py-4 text-xs font-bold text-[#625768]">
                          {formatDate(
                            setting.effectiveTo,
                          )}
                        </td>

                        <td className="rounded-r-2xl px-4 py-4">
                          <span
                            className={[
                              "rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.08em]",
                              setting.active
                                ? "border-green-200 bg-green-50 text-green-700"
                                : "border-slate-200 bg-slate-100 text-slate-600",
                            ].join(" ")}
                          >
                            {setting.active
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
