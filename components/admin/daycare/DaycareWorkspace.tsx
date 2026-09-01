"use client";

import {
  AlertTriangle,
  BadgeIndianRupee,
  CheckCircle2,
  Clock3,
  CreditCard,
  IndianRupee,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  RefreshCcw,
  Save,
  Sparkles,
  Trash2,
  Utensils,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type BillingMode = "HOURLY" | "FULL_DAY";
type PlanType =
  | "OCCASIONAL"
  | "FLEXIBLE_DAYS"
  | "MONTHLY_DAYCARE_ONLY"
  | "MONTHLY_PRESCHOOL_DAYCARE";
type FoodOption = "NONE" | "LUNCH" | "EVENING_SNACK" | "BOTH";
type SessionStatus = "BOOKED" | "COMPLETED" | "BILLED" | "CANCELLED";
type PriceType = "GST_INCLUSIVE" | "GST_EXCLUSIVE";

type Student = {
  id: string;
  studentNumber: string;
  name: string;
  programme: string;
};

type RateSetting = {
  id: string;
  title: string;
  hourlyRate: number;
  foodCharge: number;
  lunchCharge: number;
  eveningSnackCharge: number;
  mealComboCharge: number;
  fullDayRate: number;
  fullDayFoodIncluded: boolean;
  monthlyDaycareOnlyRate: number | null;
  monthlyPreschoolAddonRate: number | null;
  monthlySixHourRate: number | null;
  monthlySixHalfHourRate: number | null;
  gstApplicable: boolean;
  gstRate: number | null;
  priceType: PriceType;
  foodGstApplicable: boolean;
  foodGstRate: number | null;
  foodPriceType: PriceType;
  effectiveFrom: string;
  effectiveTo: string | null;
  active: boolean;
};

type DaycarePlan = {
  id: string;
  studentId: string;
  planDefinitionId: string | null;
  priceVersionId: string | null;
  mealCombinationId: string | null;
  studentName: string;
  studentNumber: string;
  programme: string;
  title: string;
  planType: PlanType;
  billingMode: BillingMode;
  scheduledWeekdays: number[];
  foodRequired: boolean;
  foodOption: FoodOption;
  dailyHours: number | null;
  includedDays: number | null;
  monthlyFeeOverride: number | null;
  monthlyFoodFeeOverride: number | null;
  hourlyRateOverride: number | null;
  foodChargeOverride: number | null;
  fullDayRateOverride: number | null;
  fullDayFoodIncluded: boolean | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  active: boolean;
  lifecycleStatus: "ACTIVE" | "INACTIVE" | "ARCHIVED" | "DELETED";
  recurring: boolean;
  maximumVisitsOverride: number | null;
  billingStoppedAt: string | null;
  separateInvoice: boolean;
  notes: string | null;
  canEdit: boolean;
  planDefinition: {
    id: string;
    name: string;
    billingType: string;
    hoursIncluded: number | null;
    maximumVisits: number | null;
    allowConcurrent: boolean;
  } | null;
  priceVersion: {
    id: string;
    price: number;
    gstApplicable: boolean;
    gstRate: number | null;
    priceType: PriceType;
  } | null;
  mealCombination: { id: string; name: string } | null;
};

type PlanLifecyclePreview = {
  planId: string;
  studentId: string;
  title: string;
  lifecycleStatus: DaycarePlan["lifecycleStatus"];
  dependencies: {
    activeAssignments: number;
    attendanceRecords: number;
    invoiceItems: number;
    ledgerCharges: number;
    contractLinks: number;
    auditRecords: number;
  };
  historicalRecords: number;
  canPermanentDelete: boolean;
  recommendation: "DEACTIVATE" | "ARCHIVE" | "PERMANENT_DELETE";
};

type DaycareSession = {
  id: string;
  sessionNumber: string;
  studentId: string;
  studentName: string;
  studentNumber: string;
  programme: string;
  planId: string | null;
  sessionDate: string;
  billingMode: BillingMode;
  checkInAt: string | null;
  checkOutAt: string | null;
  billableHours: number | null;
  foodProvided: boolean;
  foodOption: FoodOption;
  hourlyRate: number | null;
  foodCharge: number;
  fullDayRate: number | null;
  baseAmount: number;
  totalAmount: number;
  gstApplicable: boolean;
  gstRate: number | null;
  status: SessionStatus;
  reason: string | null;
  pickupPerson: string | null;
  approved: boolean;
  approvedAt: string | null;
  invoiceStatus: string;
  emergencyCare: boolean;
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
    authorisedPickup: boolean;
    isPrimary: boolean;
  }>;
  meals: Array<{
    id: string;
    mealId: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    meal: { name: string };
  }>;
  notes: string | null;
  feeInvoice: {
    id: string;
    invoiceNumber: string;
    status: string;
    pendingAmount: number;
  } | null;
};

type DaycareResponse = {
  success: boolean;
  message?: string;
  canManageRates?: boolean;
  canManageContracts?: boolean;
  canApproveLedger?: boolean;
  canManageLifecycle?: boolean;
  activeRate?: RateSetting | null;
  rateHistory?: RateSetting[];
  students?: Student[];
  plans?: DaycarePlan[];
  sessions?: DaycareSession[];
  planDefinitions?: CataloguePlan[];
  mealDefinitions?: CatalogueMeal[];
  mealCombinations?: CatalogueCombination[];
  dashboard?: DaycareDashboard;
  planLifecyclePreview?: PlanLifecyclePreview;
};

type DaycareDashboard = {
  todayChildren: number;
  expectedPickups: number;
  latePickups: number;
  emergencyToday: number;
  mealsToday: number;
  billedRevenue: number;
  outstanding: number;
  monthlyForecast: number;
  occupancy: number | null;
  unusedCapacity: number | null;
  peakHour: string | null;
  popularPlan: string | null;
  topMeal: string | null;
  estimatedProfitAfterFood: number;
  activePlans: number;
  preschoolDaycareStudents: number;
  daycareOnlyStudents: number;
  pendingAdditionalAmount: number;
  suggestions: string[];
};

type CatalogueVersion = {
  id: string;
  price: number;
  gstApplicable: boolean;
  gstRate: number | null;
  priceType: PriceType;
  effectiveFrom: string;
  effectiveTo: string | null;
  active: boolean;
};
type CataloguePlan = {
  id: string;
  name: string;
  billingType: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "CUSTOM";
  hoursIncluded: number | null;
  mealRule: string;
  recurring: boolean;
  maximumVisits: number | null;
  allowConcurrent: boolean;
  priceVersions: CatalogueVersion[];
};
type CatalogueMeal = {
  id: string;
  name: string;
  priceVersions: CatalogueVersion[];
};
type CatalogueCombination = {
  id: string;
  name: string;
  items: Array<{ mealId: string; meal: { name: string } }>;
  priceVersions: CatalogueVersion[];
};

type PlanForm = {
  planId: string;
  studentId: string;
  planDefinitionId: string;
  mealCombinationId: string;
  title: string;
  planType: PlanType;
  billingMode: BillingMode;
  scheduledWeekdays: number[];
  foodOption: FoodOption;
  dailyHours: string;
  includedDays: string;
  monthlyFeeOverride: string;
  monthlyFoodFeeOverride: string;
  hourlyRateOverride: string;
  foodChargeOverride: string;
  fullDayRateOverride: string;
  planFullDayFoodIncluded: boolean | null;
  planEffectiveFrom: string;
  planEffectiveTo: string;
  notes: string;
  recurring: boolean;
  maximumVisitsOverride: string;
  separateInvoice: boolean;
};

type SessionForm = {
  studentId: string;
  planId: string;
  sessionDate: string;
  billingMode: BillingMode;
  checkInAt: string;
  checkOutAt: string;
  billableHours: string;
  foodOption: FoodOption;
  mealIds: string[];
  reason: string;
  pickupPerson: string;
  notes: string;
  sessionStatus: "BOOKED" | "COMPLETED";
};

const weekdays = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

function indiaDateKey(value = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

function currentMonthKey() {
  return indiaDateKey().slice(0, 7);
}

function emptyPlanForm(): PlanForm {
  return {
    planId: "",
    studentId: "",
    planDefinitionId: "",
    mealCombinationId: "",
    title: "Occasional Selected-Day Daycare",
    planType: "OCCASIONAL",
    billingMode: "FULL_DAY",
    scheduledWeekdays: [],
    foodOption: "BOTH",
    dailyHours: "",
    includedDays: "",
    monthlyFeeOverride: "",
    monthlyFoodFeeOverride: "",
    hourlyRateOverride: "",
    foodChargeOverride: "",
    fullDayRateOverride: "",
    planFullDayFoodIncluded: true,
    planEffectiveFrom: indiaDateKey(),
    planEffectiveTo: "",
    notes: "",
    recurring: true,
    maximumVisitsOverride: "",
    separateInvoice: false,
  };
}

function emptySessionForm(): SessionForm {
  return {
    studentId: "",
    planId: "",
    sessionDate: indiaDateKey(),
    billingMode: "HOURLY",
    checkInAt: "",
    checkOutAt: "",
    billableHours: "1",
    foodOption: "NONE",
    mealIds: [],
    reason: "",
    pickupPerson: "",
    notes: "",
    sessionStatus: "COMPLETED",
  };
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function formatTime(value: string | null) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

function programmeLabel(value: string) {
  return value
    .replace("JUNIOR_KG", "Junior KG")
    .replace("SENIOR_KG", "Senior KG")
    .replace("PLAYGROUP", "Playgroup")
    .replace("NURSERY", "Nursery")
    .replace("DAYCARE", "Daycare");
}

function foodOptionLabel(value: FoodOption) {
  if (value === "LUNCH") return "Lunch";
  if (value === "EVENING_SNACK") return "Evening snack";
  if (value === "BOTH") return "Lunch + evening snack";
  return "No food";
}

function planTypeLabel(value: PlanType) {
  if (value === "FLEXIBLE_DAYS") return "Flexible days package";
  if (value === "MONTHLY_DAYCARE_ONLY") return "Monthly daycare only";
  if (value === "MONTHLY_PRESCHOOL_DAYCARE") {
    return "Preschool + monthly daycare";
  }
  return "Occasional selected days";
}

function statusStyle(status: SessionStatus) {
  if (status === "BILLED") return "border-green-200 bg-green-50 text-green-700";
  if (status === "BOOKED") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "CANCELLED") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function DaycareWorkspace() {
  const [month, setMonth] = useState(currentMonthKey());
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<DaycarePlan[]>([]);
  const [sessions, setSessions] = useState<DaycareSession[]>([]);
  const [activeRate, setActiveRate] = useState<RateSetting | null>(null);
  const [rateHistory, setRateHistory] = useState<RateSetting[]>([]);
  const [canManageRates, setCanManageRates] = useState(false);
  const [canManageContracts, setCanManageContracts] = useState(false);
  const [canApproveLedger, setCanApproveLedger] = useState(false);
  const [canManageLifecycle, setCanManageLifecycle] = useState(false);
  const [planDefinitions, setPlanDefinitions] = useState<CataloguePlan[]>([]);
  const [mealDefinitions, setMealDefinitions] = useState<CatalogueMeal[]>([]);
  const [mealCombinations, setMealCombinations] = useState<
    CatalogueCombination[]
  >([]);
  const [dashboard, setDashboard] = useState<DaycareDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const planSavingRef = useRef(false);
  const lifecycleSavingRef = useRef(false);
  const deleteReviewLoadingRef = useRef(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [openActionsPlanId, setOpenActionsPlanId] = useState<string | null>(
    null,
  );
  const [deleteReview, setDeleteReview] = useState<{
    plan: DaycarePlan;
    preview: PlanLifecyclePreview | null;
  } | null>(null);
  const [deleteReviewLoading, setDeleteReviewLoading] = useState(false);
  const [deleteReviewReason, setDeleteReviewReason] = useState("");
  const [deleteReviewConfirmation, setDeleteReviewConfirmation] = useState("");
  const [deleteReviewError, setDeleteReviewError] = useState("");
  const [activeTab, setActiveTab] = useState<"sessions" | "plans" | "rates">(
    "sessions",
  );
  const [planForm, setPlanForm] = useState<PlanForm>(emptyPlanForm);
  const [sessionForm, setSessionForm] = useState<SessionForm>(emptySessionForm);
  const [rateForm, setRateForm] = useState({
    hourlyRate: "",
    foodCharge: "",
    lunchCharge: "",
    eveningSnackCharge: "",
    mealComboCharge: "",
    fullDayRate: "",
    fullDayFoodIncluded: false,
    monthlyDaycareOnlyRate: "",
    monthlyPreschoolAddonRate: "",
    monthlySixHourRate: "",
    monthlySixHalfHourRate: "",
    gstApplicable: false,
    gstRate: "",
    priceType: "GST_INCLUSIVE" as PriceType,
    foodGstApplicable: false,
    foodGstRate: "",
    foodPriceType: "GST_INCLUSIVE" as PriceType,
    effectiveFrom: indiaDateKey(),
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/daycare?month=${encodeURIComponent(month)}`,
        {
          cache: "no-store",
        },
      );
      const result = (await response.json()) as DaycareResponse;

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ?? "The daycare register could not be loaded.",
        );
      }

      setStudents(result.students ?? []);
      setPlans(result.plans ?? []);
      setSessions(result.sessions ?? []);
      setActiveRate(result.activeRate ?? null);
      setRateHistory(result.rateHistory ?? []);
      setCanManageRates(Boolean(result.canManageRates));
      setCanManageContracts(Boolean(result.canManageContracts));
      setCanApproveLedger(Boolean(result.canApproveLedger));
      setCanManageLifecycle(Boolean(result.canManageLifecycle));
      setPlanDefinitions(result.planDefinitions ?? []);
      setMealDefinitions(result.mealDefinitions ?? []);
      setMealCombinations(result.mealCombinations ?? []);
      setDashboard(result.dashboard ?? null);

      if (result.activeRate) {
        setRateForm({
          hourlyRate: String(result.activeRate.hourlyRate),
          foodCharge: String(result.activeRate.foodCharge),
          lunchCharge: String(result.activeRate.lunchCharge),
          eveningSnackCharge: String(result.activeRate.eveningSnackCharge),
          mealComboCharge: String(result.activeRate.mealComboCharge),
          fullDayRate: String(result.activeRate.fullDayRate),
          fullDayFoodIncluded: result.activeRate.fullDayFoodIncluded,
          monthlyDaycareOnlyRate: String(
            result.activeRate.monthlyDaycareOnlyRate ?? "",
          ),
          monthlyPreschoolAddonRate: String(
            result.activeRate.monthlyPreschoolAddonRate ?? "",
          ),
          monthlySixHourRate: String(
            result.activeRate.monthlySixHourRate ?? "",
          ),
          monthlySixHalfHourRate: String(
            result.activeRate.monthlySixHalfHourRate ?? "",
          ),
          gstApplicable: result.activeRate.gstApplicable,
          gstRate: String(result.activeRate.gstRate ?? ""),
          priceType: result.activeRate.priceType,
          foodGstApplicable: result.activeRate.foodGstApplicable,
          foodGstRate: String(result.activeRate.foodGstRate ?? ""),
          foodPriceType: result.activeRate.foodPriceType,
          effectiveFrom: indiaDateKey(),
        });
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "The daycare register could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    // The workspace must load the selected month's live register after mounting.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, [loadData]);

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.active),
    [plans],
  );
  const managedPlans = useMemo(
    () => plans.filter((plan) => plan.lifecycleStatus !== "DELETED"),
    [plans],
  );
  const studentPlans = useMemo(
    () =>
      activePlans.filter((plan) => plan.studentId === sessionForm.studentId),
    [activePlans, sessionForm.studentId],
  );
  const selectedPlan = useMemo(
    () => activePlans.find((plan) => plan.id === sessionForm.planId) ?? null,
    [activePlans, sessionForm.planId],
  );
  const selectedStudent = useMemo(
    () =>
      students.find((student) => student.id === sessionForm.studentId) ?? null,
    [students, sessionForm.studentId],
  );
  const queuesOnMonthlyPreschoolBill =
    sessionForm.sessionStatus === "COMPLETED" &&
    selectedStudent?.programme !== "DAYCARE" &&
    (!selectedPlan || selectedPlan.planType === "OCCASIONAL");

  const estimatedTotal = useMemo(() => {
    const hourlyRate =
      selectedPlan?.hourlyRateOverride ?? activeRate?.hourlyRate ?? 100;
    const fallbackFoodRate =
      selectedPlan?.foodChargeOverride ?? activeRate?.foodCharge ?? 50;
    const lunchRate =
      selectedPlan?.foodChargeOverride ??
      activeRate?.lunchCharge ??
      fallbackFoodRate;
    const snackRate =
      selectedPlan?.foodChargeOverride ??
      activeRate?.eveningSnackCharge ??
      fallbackFoodRate;
    const comboRate =
      selectedPlan?.foodChargeOverride != null
        ? selectedPlan.foodChargeOverride * 2
        : (activeRate?.mealComboCharge ?? lunchRate + snackRate);
    const fullDayRate =
      selectedPlan?.fullDayRateOverride ?? activeRate?.fullDayRate ?? 400;
    const foodIncluded =
      selectedPlan?.fullDayFoodIncluded ??
      activeRate?.fullDayFoodIncluded ??
      true;
    const hours = Math.max(0, Number(sessionForm.billableHours) || 0);
    const base =
      sessionForm.billingMode === "HOURLY" ? hours * hourlyRate : fullDayRate;
    const selectedFoodRate =
      sessionForm.foodOption === "LUNCH"
        ? lunchRate
        : sessionForm.foodOption === "EVENING_SNACK"
          ? snackRate
          : sessionForm.foodOption === "BOTH"
            ? comboRate
            : 0;
    const catalogueMealRate = sessionForm.mealIds.reduce(
      (sum, mealId) =>
        sum +
        (mealDefinitions.find((meal) => meal.id === mealId)?.priceVersions[0]
          ?.price ?? 0),
      0,
    );
    const food =
      (sessionForm.foodOption !== "NONE" || sessionForm.mealIds.length > 0) &&
      !(sessionForm.billingMode === "FULL_DAY" && foodIncluded)
        ? sessionForm.mealIds.length > 0
          ? catalogueMealRate
          : selectedFoodRate
        : 0;
    return Math.round((base + food + Number.EPSILON) * 100) / 100;
  }, [
    activeRate,
    mealDefinitions,
    selectedPlan,
    sessionForm.billableHours,
    sessionForm.billingMode,
    sessionForm.foodOption,
    sessionForm.mealIds,
  ]);

  async function postAction(payload: Record<string, unknown>) {
    const response = await fetch("/api/admin/daycare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = (await response.json()) as DaycareResponse;

    if (!response.ok || !result.success) {
      throw new Error(
        result.message ?? "The daycare record could not be saved.",
      );
    }

    return result;
  }

  async function saveRates(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await postAction({ action: "save-rates", ...rateForm });
      setMessage(result.message ?? "Daycare rates saved.");
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Daycare rates could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (planSavingRef.current) return;
    planSavingRef.current = true;
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await postAction({ action: "save-plan", ...planForm });
      setMessage(result.message ?? "Daycare plan saved.");
      setPlanForm(emptyPlanForm());
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The daycare plan could not be saved.",
      );
    } finally {
      planSavingRef.current = false;
      setSaving(false);
    }
  }

  async function saveSession(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await postAction({
        action: "record-session",
        ...sessionForm,
      });
      setMessage(result.message ?? "Daycare session saved.");
      setSessionForm(emptySessionForm());
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The daycare session could not be saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function completeSession(session: DaycareSession) {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await postAction({
        action: "complete-session",
        sessionId: session.id,
      });
      setMessage(result.message ?? "Daycare session completed.");
      await loadData();
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "The booking could not be completed.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function approveSession(session: DaycareSession) {
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await postAction({
        action: "approve-session",
        sessionId: session.id,
      });
      setMessage(result.message ?? "Emergency daycare approved for billing.");
      await loadData();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The ledger entry could not be approved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function editLedger(session: DaycareSession) {
    const hoursText = window.prompt(
      "Billable hours (leave blank for full-day care)",
      session.billableHours == null ? "" : String(session.billableHours),
    );
    if (hoursText === null) return;
    const baseText = window.prompt(
      "Daycare charge",
      String(session.baseAmount),
    );
    if (baseText === null) return;
    const mealText = window.prompt("Meal charge", String(session.foodCharge));
    if (mealText === null) return;
    const reason = window.prompt(
      "Reason for the extra care",
      session.reason ?? "",
    );
    if (reason === null) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const result = await postAction({
        action: "update-ledger",
        sessionId: session.id,
        billableHours: hoursText.trim() || null,
        baseAmount: baseText,
        foodCharge: mealText,
        reason,
        notes: session.notes,
      });
      setMessage(result.message ?? "Emergency daycare ledger updated.");
      await loadData();
    } catch (reasonValue) {
      setError(
        reasonValue instanceof Error
          ? reasonValue.message
          : "The ledger entry could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeRecord(id: string) {
    if (!window.confirm("Cancel this unbilled daycare booking?")) return;

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        `/api/admin/daycare?sessionId=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      const result = (await response.json()) as DaycareResponse;
      if (!response.ok || !result.success)
        throw new Error(result.message ?? "The record could not be updated.");
      setMessage(result.message ?? "Daycare record updated.");
      await loadData();
    } catch (removeError) {
      setError(
        removeError instanceof Error
          ? removeError.message
          : "The record could not be updated.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function submitPlanLifecycle(
    plan: DaycarePlan,
    operation: "ACTIVATE" | "DEACTIVATE" | "ARCHIVE" | "PERMANENT_DELETE",
    reason = "",
    confirmation = "",
  ) {
    if (lifecycleSavingRef.current) return false;
    lifecycleSavingRef.current = true;
    setSaving(true);
    setError("");
    setMessage("");
    setDeleteReviewError("");
    try {
      const result = await postAction({
        action: "plan-lifecycle",
        planId: plan.id,
        operation,
        reason,
        confirmation,
      });
      setMessage(result.message ?? "Child plan lifecycle updated.");
      await loadData();
      setOpenActionsPlanId(null);
      return true;
    } catch (reasonValue) {
      const friendlyMessage =
        reasonValue instanceof Error
          ? reasonValue.message
          : "The child plan could not be updated.";
      setError(friendlyMessage);
      setDeleteReviewError(friendlyMessage);
      return false;
    } finally {
      lifecycleSavingRef.current = false;
      setSaving(false);
    }
  }

  async function changePlanLifecycle(
    plan: DaycarePlan,
    operation: "ACTIVATE" | "DEACTIVATE",
  ) {
    const prompt =
      operation === "ACTIVATE"
        ? `Reactivate ${plan.title}? It will become available for this child again.`
        : `Pause ${plan.title}? New attendance and recurring billing will stop until the Owner resumes it.`;
    if (!window.confirm(prompt)) return;
    await submitPlanLifecycle(plan, operation);
  }

  async function openDeleteReview(plan: DaycarePlan) {
    if (deleteReviewLoadingRef.current || lifecycleSavingRef.current) return;
    deleteReviewLoadingRef.current = true;
    setDeleteReview({ plan, preview: null });
    setDeleteReviewLoading(true);
    setDeleteReviewReason("No longer used");
    setDeleteReviewConfirmation("");
    setDeleteReviewError("");
    setError("");
    try {
      const result = await postAction({
        action: "plan-delete-preview",
        planId: plan.id,
      });
      if (!result.planLifecyclePreview) {
        throw new Error("The plan’s safe deletion review could not be loaded.");
      }
      setDeleteReview({ plan, preview: result.planLifecyclePreview });
    } catch (previewError) {
      const friendlyMessage =
        previewError instanceof Error
          ? previewError.message
          : "The plan’s safe deletion review could not be loaded.";
      setDeleteReviewError(friendlyMessage);
    } finally {
      deleteReviewLoadingRef.current = false;
      setDeleteReviewLoading(false);
    }
  }

  async function finishDeleteReview(
    operation: "DEACTIVATE" | "ARCHIVE" | "PERMANENT_DELETE",
  ) {
    if (!deleteReview) return;
    const completed = await submitPlanLifecycle(
      deleteReview.plan,
      operation,
      operation === "DEACTIVATE" ? "" : deleteReviewReason,
      operation === "PERMANENT_DELETE" ? deleteReviewConfirmation : "",
    );
    if (completed) setDeleteReview(null);
  }

  function duplicatePlan(plan: DaycarePlan) {
    editPlan(plan);
    setPlanForm((current) => ({
      ...current,
      planId: "",
      title: `${plan.title} Copy`,
    }));
    setMessage(
      "A duplicate draft is ready. Review dates and save it as a new contract.",
    );
  }

  function chooseStudent(studentId: string) {
    const firstPlan =
      activePlans.find((plan) => plan.studentId === studentId) ?? null;
    setSessionForm((current) => ({
      ...current,
      studentId,
      planId: firstPlan?.id ?? "",
      billingMode: firstPlan?.billingMode ?? "HOURLY",
      foodOption: firstPlan?.foodOption ?? "NONE",
      mealIds: [],
    }));
  }

  function choosePlan(planId: string) {
    const plan = activePlans.find((item) => item.id === planId) ?? null;
    setSessionForm((current) => ({
      ...current,
      planId,
      billingMode: plan?.billingMode ?? current.billingMode,
      foodOption: plan?.foodOption ?? current.foodOption,
      mealIds: [],
    }));
  }

  function chooseCataloguePlan(planDefinitionId: string) {
    const definition =
      planDefinitions.find((item) => item.id === planDefinitionId) ?? null;
    if (!definition)
      return setPlanForm((current) => ({ ...current, planDefinitionId: "" }));
    const student =
      students.find((item) => item.id === planForm.studentId) ?? null;
    const planType: PlanType =
      definition.billingType === "HOURLY" || definition.billingType === "DAILY"
        ? "OCCASIONAL"
        : definition.billingType === "MONTHLY"
          ? student?.programme === "DAYCARE"
            ? "MONTHLY_DAYCARE_ONLY"
            : "MONTHLY_PRESCHOOL_DAYCARE"
          : "FLEXIBLE_DAYS";
    setPlanForm((current) => ({
      ...current,
      planDefinitionId,
      title: definition.name,
      planType,
      billingMode: definition.billingType === "HOURLY" ? "HOURLY" : "FULL_DAY",
      dailyHours: definition.hoursIncluded?.toString() ?? "",
      includedDays: definition.maximumVisits?.toString() ?? "",
      monthlyFeeOverride: "",
      recurring: definition.recurring,
      maximumVisitsOverride: "",
    }));
  }

  function editPlan(plan: DaycarePlan) {
    setPlanForm({
      planId: plan.id,
      studentId: plan.studentId,
      planDefinitionId: plan.planDefinitionId ?? "",
      mealCombinationId: plan.mealCombinationId ?? "",
      title: plan.title,
      planType: plan.planType,
      billingMode: plan.billingMode,
      scheduledWeekdays: plan.scheduledWeekdays,
      foodOption: plan.foodOption,
      dailyHours: plan.dailyHours == null ? "" : String(plan.dailyHours),
      includedDays: plan.includedDays == null ? "" : String(plan.includedDays),
      monthlyFeeOverride:
        plan.monthlyFeeOverride == null ? "" : String(plan.monthlyFeeOverride),
      monthlyFoodFeeOverride:
        plan.monthlyFoodFeeOverride == null
          ? ""
          : String(plan.monthlyFoodFeeOverride),
      hourlyRateOverride:
        plan.hourlyRateOverride == null ? "" : String(plan.hourlyRateOverride),
      foodChargeOverride:
        plan.foodChargeOverride == null ? "" : String(plan.foodChargeOverride),
      fullDayRateOverride:
        plan.fullDayRateOverride == null
          ? ""
          : String(plan.fullDayRateOverride),
      planFullDayFoodIncluded: plan.fullDayFoodIncluded,
      planEffectiveFrom: indiaDateKey(new Date(plan.effectiveFrom)),
      planEffectiveTo: plan.effectiveTo
        ? indiaDateKey(new Date(plan.effectiveTo))
        : "",
      notes: plan.notes ?? "",
      recurring: plan.recurring,
      maximumVisitsOverride: plan.maximumVisitsOverride?.toString() ?? "",
      separateInvoice: plan.separateInvoice,
    });
    setActiveTab("plans");
    document
      .getElementById("daycare-plan-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (loading && students.length === 0) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-[30px] border border-[#E7DEEB] bg-white text-[#5B2A86]">
        <LoaderCircle aria-hidden="true" size={34} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <style jsx global>{`
        .input-style {
          min-height: 3rem;
          width: 100%;
          border: 1px solid #dccfe4;
          border-radius: 1rem;
          background: #fff;
          padding-left: 1rem;
          padding-right: 1rem;
          color: #2d1736;
          font-size: 0.875rem;
          font-weight: 600;
          outline: none;
        }
        .input-style:focus {
          border-color: #6a328f;
          box-shadow: 0 0 0 4px rgba(106, 50, 143, 0.1);
        }
        .input-style:disabled {
          cursor: not-allowed;
          background: #f5f2f6;
          color: #8f8394;
        }
      `}</style>
      {error ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700"
        >
          {error}
        </div>
      ) : null}
      {message ? (
        <div
          role="status"
          className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm font-bold text-green-700"
        >
          <CheckCircle2
            aria-hidden="true"
            size={19}
            className="mt-0.5 shrink-0"
          />
          {message}
        </div>
      ) : null}

      {dashboard ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              icon={UsersRound}
              label="Preschool + daycare"
              value={String(dashboard.preschoolDaycareStudents)}
              note="active children counted in both services"
            />
            <SummaryCard
              icon={UsersRound}
              label="Daycare only"
              value={String(dashboard.daycareOnlyStudents)}
              note="active daycare-only children"
            />
            <SummaryCard
              icon={IndianRupee}
              label="Pending add-ons"
              value={formatMoney(dashboard.pendingAdditionalAmount)}
              note="approved additional daycare awaiting billing"
            />
            <SummaryCard
              icon={UsersRound}
              label="Today’s children"
              value={String(dashboard.todayChildren)}
              note={`${dashboard.expectedPickups} pickup(s) pending`}
            />
            <SummaryCard
              icon={Clock3}
              label="Late / emergency"
              value={`${dashboard.latePickups} / ${dashboard.emergencyToday}`}
              note="late pickups and emergency care today"
            />
            <SummaryCard
              icon={Utensils}
              label="Meals today"
              value={String(dashboard.mealsToday)}
              note={
                dashboard.topMeal
                  ? `Most requested: ${dashboard.topMeal}`
                  : "Record exact meals for demand insight"
              }
            />
            <SummaryCard
              icon={Sparkles}
              label="Occupancy"
              value={
                dashboard.occupancy == null
                  ? "Set capacity"
                  : `${dashboard.occupancy}%`
              }
              note={
                dashboard.unusedCapacity == null
                  ? "Configure capacity in Billing Catalogue"
                  : `${dashboard.unusedCapacity} place(s) unused`
              }
            />
            <SummaryCard
              icon={IndianRupee}
              label="Month billed"
              value={formatMoney(dashboard.billedRevenue)}
              note={`Outstanding ${formatMoney(dashboard.outstanding)}`}
            />
            <SummaryCard
              icon={CreditCard}
              label="Recurring forecast"
              value={formatMoney(dashboard.monthlyForecast)}
              note={`${dashboard.activePlans} active plan(s)`}
            />
            <SummaryCard
              icon={Clock3}
              label="Peak check-in"
              value={dashboard.peakHour ?? "Not enough data"}
              note={
                dashboard.popularPlan
                  ? `Popular: ${dashboard.popularPlan}`
                  : "Record visits to identify peaks"
              }
            />
            <SummaryCard
              icon={IndianRupee}
              label="After food cost"
              value={formatMoney(dashboard.estimatedProfitAfterFood)}
              note="Billed daycare less FOOD expenses"
            />
          </section>
          <section className="rounded-[26px] border border-[#E7DEEB] bg-[#FBF8FD] p-5">
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#7A459C]">
              CentreOS daycare insights
            </p>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
              {dashboard.suggestions.map((suggestion) => (
                <p
                  key={suggestion}
                  className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-[#55475B]"
                >
                  {suggestion}
                </p>
              ))}
            </div>
          </section>
        </>
      ) : null}

      {canManageContracts || canManageRates ? (
        <>
      {planDefinitions.length > 0 || mealDefinitions.length > 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {planDefinitions.map((definition) => (
            <SummaryCard
              key={definition.id}
              icon={definition.billingType === "HOURLY" ? Clock3 : CreditCard}
              label={definition.name}
              value={
                definition.priceVersions[0]
                  ? formatMoney(definition.priceVersions[0].price)
                  : "Price not set"
              }
              note={`${definition.billingType.toLowerCase()}${definition.hoursIncluded != null ? ` · ${definition.hoursIncluded} hours` : ""}`}
            />
          ))}
          {mealDefinitions.map((meal) => (
            <SummaryCard
              key={meal.id}
              icon={Utensils}
              label={meal.name}
              value={
                meal.priceVersions[0]
                  ? formatMoney(meal.priceVersions[0].price)
                  : "Price not set"
              }
              note="Owner-managed meal price"
            />
          ))}
        </section>
      ) : null}

      {planDefinitions.length === 0 ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SummaryCard
            icon={Clock3}
            label="Emergency hourly"
            value={
              activeRate
                ? formatMoney(activeRate.hourlyRate)
                : "Set in Billing Catalogue"
            }
            note="charged for one occasional visit"
          />
          <SummaryCard
            icon={Sparkles}
            label="Occasional full day"
            value={
              activeRate
                ? formatMoney(activeRate.fullDayRate)
                : "Set in Billing Catalogue"
            }
            note={
              activeRate?.fullDayFoodIncluded
                ? "one day · food included"
                : "one day · food charged separately"
            }
          />
          <SummaryCard
            icon={CreditCard}
            label="Monthly daycare · 6 hours"
            value={
              activeRate?.monthlySixHourRate == null
                ? "Set monthly rate"
                : formatMoney(activeRate.monthlySixHourRate)
            }
            note="daycare-only recurring plan"
          />
          <SummaryCard
            icon={CreditCard}
            label="Monthly daycare · 6.5 hours"
            value={
              activeRate?.monthlySixHalfHourRate == null
                ? "Set monthly rate"
                : formatMoney(activeRate.monthlySixHalfHourRate)
            }
            note="daycare-only recurring plan"
          />
          <SummaryCard
            icon={IndianRupee}
            label="Preschool + daycare month"
            value={
              activeRate?.monthlyPreschoolAddonRate == null
                ? "Set monthly rate"
                : formatMoney(activeRate.monthlyPreschoolAddonRate)
            }
            note="daycare added to the preschool bill"
          />
          <SummaryCard
            icon={Utensils}
            label="Occasional lunch"
            value={
              activeRate
                ? formatMoney(activeRate.lunchCharge)
                : "Set in Billing Catalogue"
            }
            note="single-visit food add-on"
          />
          <SummaryCard
            icon={Utensils}
            label="Occasional evening snack"
            value={
              activeRate
                ? formatMoney(activeRate.eveningSnackCharge)
                : "Set in Billing Catalogue"
            }
            note="single-visit food add-on"
          />
        </section>
      ) : null}

      <section className="rounded-[30px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.05)] sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
          Four simple billing paths
        </p>
        <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
          Choose how this child uses daycare
        </h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <PlanGuide
            title="Occasional days"
            text="For a child attending only selected days, such as twice in a month."
          />
          <PlanGuide
            title="Monthly daycare only"
            text="For a non-preschool child attending daycare on a fixed monthly plan."
          />
          <PlanGuide
            title="Preschool + daycare"
            text="Adds monthly daycare and meals to the same preschool invoice."
          />
          <PlanGuide
            title="Emergency care"
            text="Preschool children carry the charge to their next monthly bill. Daycare-only children receive a visit invoice."
          />
        </div>
      </section>
        </>
      ) : null}

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#E5DDE9] bg-white p-2">
        {(
          [
            ["sessions", "Occasional / Daily Entry"],
            ...(canManageContracts
              ? ([["plans", "Contract Plan Adjustments"]] as const)
              : []),
            ...(canManageRates
              ? ([["rates", "Legacy Daycare Rates"]] as const)
              : []),
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setActiveTab(value)}
            className={`min-h-11 rounded-xl px-5 text-sm font-black transition ${activeTab === value ? "bg-[#5B2A86] text-white shadow-[0_8px_20px_rgba(91,42,134,0.18)]" : "text-[#65596A] hover:bg-[#F5EFF8]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "sessions" ? (
        <div className="space-y-6">
          {students.length === 0 ? (
            <EmptyState text="No active daycare students yet. Add daycare from Student Contract during admission or from the student profile." />
          ) : null}
          <form
            onSubmit={saveSession}
            className="rounded-[30px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                  Quick daycare entry
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
                  Book care or record a completed visit
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                  For preschool children, an occasional visit is added to the
                  next monthly bill. Daycare-only visits create their own
                  invoice. Monthly-plan sessions never create a duplicate daily
                  charge.
                </p>
              </div>
              <div className="rounded-2xl bg-[#2D1736] px-5 py-4 text-white lg:min-w-52">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#F6C84B]">
                  Estimated total
                </p>
                <p className="mt-1 text-3xl font-black">
                  {formatMoney(estimatedTotal)}
                </p>
                <p className="mt-1 text-xs font-semibold text-white/65">
                  GST follows the saved charge configuration
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Field label="Student *">
                <select
                  value={sessionForm.studentId}
                  onChange={(event) => chooseStudent(event.target.value)}
                  required
                  className="input-style"
                >
                  <option value="">Choose student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} · {programmeLabel(student.programme)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Saved plan">
                <select
                  value={sessionForm.planId}
                  onChange={(event) => choosePlan(event.target.value)}
                  className="input-style"
                  disabled={!sessionForm.studentId}
                >
                  <option value="">Use standard rates</option>
                  {studentPlans.map((plan) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Session date *">
                <input
                  type="date"
                  value={sessionForm.sessionDate}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      sessionDate: event.target.value,
                    }))
                  }
                  required
                  className="input-style"
                />
              </Field>
              <Field label="Billing type *">
                <select
                  value={sessionForm.billingMode}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      billingMode: event.target.value as BillingMode,
                    }))
                  }
                  className="input-style"
                >
                  <option value="HOURLY">Hourly care</option>
                  <option value="FULL_DAY">Full-day care</option>
                </select>
              </Field>
              {sessionForm.billingMode === "HOURLY" ? (
                <>
                  <Field label="Billable hours *">
                    <input
                      type="number"
                      min="0.25"
                      max="24"
                      step="0.25"
                      value={sessionForm.billableHours}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          billableHours: event.target.value,
                        }))
                      }
                      required
                      className="input-style"
                    />
                  </Field>
                  <Field label="Check-in time">
                    <input
                      type="time"
                      value={sessionForm.checkInAt}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          checkInAt: event.target.value,
                        }))
                      }
                      className="input-style"
                    />
                  </Field>
                  <Field label="Check-out time">
                    <input
                      type="time"
                      value={sessionForm.checkOutAt}
                      onChange={(event) =>
                        setSessionForm((current) => ({
                          ...current,
                          checkOutAt: event.target.value,
                        }))
                      }
                      className="input-style"
                    />
                  </Field>
                </>
              ) : null}
              <Field label="Save as *">
                <select
                  value={sessionForm.sessionStatus}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      sessionStatus: event.target
                        .value as SessionForm["sessionStatus"],
                    }))
                  }
                  className="input-style"
                >
                  <option value="COMPLETED">
                    {selectedPlan && selectedPlan.planType !== "OCCASIONAL"
                      ? "Completed · Covered by monthly plan"
                      : selectedStudent?.programme === "DAYCARE"
                        ? "Completed · Create visit invoice"
                        : "Completed · Add to next preschool bill"}
                  </option>
                  <option value="BOOKED">Booked · Invoice later</option>
                </select>
              </Field>
              <Field label="Food taken">
                <select
                  value={sessionForm.foodOption}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      foodOption: event.target.value as FoodOption,
                    }))
                  }
                  className="input-style"
                >
                  <option value="NONE">No food</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="EVENING_SNACK">Evening snack</option>
                  <option value="BOTH">Lunch + evening snack</option>
                </select>
              </Field>
              <div className="rounded-2xl border border-[#DCCFE4] bg-[#FAF8FC] p-4 md:col-span-2 xl:col-span-3">
                <p className="text-xs font-black uppercase tracking-[0.1em] text-[#817684]">
                  Exact meals from catalogue
                </p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {mealDefinitions.map((meal) => (
                    <label
                      key={meal.id}
                      className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-bold text-[#4E3B54]"
                    >
                      <input
                        type="checkbox"
                        checked={sessionForm.mealIds.includes(meal.id)}
                        onChange={(event) =>
                          setSessionForm((current) => ({
                            ...current,
                            mealIds: event.target.checked
                              ? [...current.mealIds, meal.id]
                              : current.mealIds.filter((id) => id !== meal.id),
                            foodOption: "NONE",
                          }))
                        }
                        className="accent-[#5B2A86]"
                      />
                      {meal.name} ·{" "}
                      {formatMoney(meal.priceVersions[0]?.price ?? 0)}
                    </label>
                  ))}
                </div>
              </div>
              <Field
                label="Reason for emergency / extra care"
                className="md:col-span-2"
              >
                <input
                  value={sessionForm.reason}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      reason: event.target.value,
                    }))
                  }
                  className="input-style"
                  placeholder="Late pickup, temporary care, holiday care…"
                />
              </Field>
              <Field label="Pickup person" className="md:col-span-2">
                <input
                  value={sessionForm.pickupPerson}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      pickupPerson: event.target.value,
                    }))
                  }
                  className="input-style"
                  placeholder="Name of the person collecting the child"
                />
              </Field>
              <Field label="Care, nap, homework or parent update notes" className="md:col-span-2 xl:col-span-4">
                <textarea
                  rows={2}
                  value={sessionForm.notes}
                  onChange={(event) =>
                    setSessionForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="input-style py-3"
                  placeholder="Nap/rest, homework, wellbeing, pickup or parent update"
                />
              </Field>
            </div>

            <button
              type="submit"
              disabled={saving || (!activeRate && !selectedPlan?.priceVersion)}
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-6 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  aria-hidden="true"
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <CreditCard aria-hidden="true" size={18} />
              )}
              {sessionForm.sessionStatus === "COMPLETED"
                ? selectedPlan && selectedPlan.planType !== "OCCASIONAL"
                  ? "Save Monthly-Plan Session"
                  : queuesOnMonthlyPreschoolBill
                    ? "Save for Next Monthly Bill"
                    : "Save & Create Visit Invoice"
                : "Save Booking"}
            </button>
            {!activeRate && !selectedPlan?.priceVersion ? (
              <p className="mt-3 text-sm font-bold text-amber-700">
                Choose a catalogue-priced plan or save a standard rate version
                before recording this visit.
              </p>
            ) : null}
          </form>

          <section className="rounded-[30px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                  Daycare register
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
                  Today&apos;s care and visit history
                </h2>
              </div>
              <div className="flex gap-2">
                <input
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                  className="min-h-11 rounded-xl border border-[#DDD2E2] bg-white px-4 text-sm font-black text-[#5B2A86]"
                />
                <button
                  type="button"
                  onClick={() => void loadData()}
                  className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#DDD2E2] px-4 text-xs font-black text-[#5B2A86]"
                >
                  <RefreshCcw aria-hidden="true" size={15} />
                  Refresh
                </button>
              </div>
            </div>

            {sessions.length === 0 ? (
              <EmptyState text="No daycare sessions are recorded for this month." />
            ) : (
              <div className="mt-6 grid gap-4 xl:grid-cols-2">
                {sessions.map((session) => (
                  <article
                    key={session.id}
                    className="rounded-[24px] border border-[#E8E1EB] bg-[#FCFBFD] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.1em] text-[#7A459C]">
                          {session.sessionNumber}
                        </p>
                        <h3 className="mt-1 text-lg font-black text-[#2D1736]">
                          {session.studentName}
                        </h3>
                        <p className="mt-1 text-xs font-semibold text-[#817684]">
                          {programmeLabel(session.programme)} ·{" "}
                          {session.studentNumber}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusStyle(session.status)}`}
                      >
                        {session.status}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4">
                      <MiniDetail
                        label="Date"
                        value={formatDate(session.sessionDate)}
                      />
                      <MiniDetail
                        label="Charge"
                        value={formatMoney(session.totalAmount)}
                      />
                      <MiniDetail
                        label="Type"
                        value={
                          session.billingMode === "HOURLY"
                            ? `${session.billableHours ?? 0} hour(s)`
                            : "Full day"
                        }
                      />
                      <MiniDetail
                        label="Food"
                        value={
                          session.foodOption !== "NONE"
                            ? `${foodOptionLabel(session.foodOption)}${session.foodCharge > 0 ? ` · ${formatMoney(session.foodCharge)}` : " · Included"}`
                            : "No food"
                        }
                      />
                    </div>
                    {session.checkInAt || session.checkOutAt ? (
                      <p className="mt-3 flex items-center gap-2 text-xs font-bold text-[#817684]">
                        <Clock3 aria-hidden="true" size={14} />
                        {formatTime(session.checkInAt)}
                        {session.checkOutAt
                          ? ` – ${formatTime(session.checkOutAt)}`
                          : ""}
                      </p>
                    ) : null}
                    {session.emergencyContacts.length > 0 ? (
                      <div className="mt-3 rounded-2xl border border-[#E8E1EB] bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#817684]">
                          Emergency contact & pickup
                        </p>
                        {session.emergencyContacts.map((contact) => (
                          <p
                            key={`${contact.phone}-${contact.name}`}
                            className="mt-1 text-xs font-bold text-[#4E3B54]"
                          >
                            {contact.name} ·{" "}
                            {contact.relationship.replaceAll("_", " ")} ·{" "}
                            <a
                              className="text-[#5B2A86] underline"
                              href={`tel:${contact.phone}`}
                            >
                              {contact.phone}
                            </a>
                            {contact.authorisedPickup
                              ? " · Authorised pickup"
                              : ""}
                          </p>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-white p-3">
                      <MiniDetail
                        label="Ledger approval"
                        value={session.approved ? "Approved" : "Pending Owner"}
                      />
                      <MiniDetail
                        label="Invoice status"
                        value={session.invoiceStatus.replaceAll("_", " ")}
                      />
                      {session.pickupPerson ? (
                        <div className="col-span-2">
                          <MiniDetail
                            label="Pickup person"
                            value={session.pickupPerson}
                          />
                        </div>
                      ) : null}
                      {session.reason ? (
                        <div className="col-span-2">
                          <MiniDetail label="Reason" value={session.reason} />
                        </div>
                      ) : null}
                      {session.meals.length > 0 ? (
                        <div className="col-span-2">
                          <MiniDetail
                            label="Meals"
                            value={session.meals
                              .map((entry) => entry.meal.name)
                              .join(", ")}
                          />
                        </div>
                      ) : null}
                    </div>
                    {session.status === "COMPLETED" &&
                    !session.feeInvoice &&
                    canApproveLedger ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void editLedger(session)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D9CCE1] bg-white px-4 text-xs font-black text-[#5B2A86]"
                        >
                          Edit Ledger
                        </button>
                        {!session.approved ? (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => void approveSession(session)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-amber-600 px-4 text-xs font-black text-white"
                          >
                            <CheckCircle2 size={15} />
                            Approve for Billing
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    {session.feeInvoice ? (
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.08em] text-green-700">
                            Invoice ready
                          </p>
                          <p className="text-sm font-black text-green-900">
                            {session.feeInvoice.invoiceNumber}
                          </p>
                        </div>
                        <Link
                          href="/admin/fees"
                          className="rounded-xl bg-green-700 px-4 py-2 text-xs font-black text-white"
                        >
                          Open Fees
                        </Link>
                      </div>
                    ) : null}
                    {session.status === "BOOKED" ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void completeSession(session)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white"
                        >
                          <CheckCircle2 aria-hidden="true" size={15} />
                          Complete Session
                        </button>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() =>
                            void removeRecord(session.id)
                          }
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-xs font-black text-red-700"
                        >
                          <Trash2 aria-hidden="true" size={15} />
                          Cancel
                        </button>
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "plans" ? (
        <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <form
            id="daycare-plan-form"
            onSubmit={savePlan}
            className="scroll-mt-24 rounded-[30px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                  Child-specific plan
                </p>
                <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
                  {planForm.planId
                    ? "Edit daycare plan"
                    : "Create a daycare plan"}
                </h2>
              </div>
              {planForm.planId ? (
                <button
                  type="button"
                  onClick={() => setPlanForm(emptyPlanForm())}
                  className="rounded-xl border border-[#DDD2E2] px-3 py-2 text-xs font-black text-[#5B2A86]"
                >
                  Cancel edit
                </button>
              ) : null}
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Student *" className="sm:col-span-2">
                <select
                  value={planForm.studentId}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      studentId: event.target.value,
                    }))
                  }
                  required
                  className="input-style"
                >
                  <option value="">Choose student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.name} · {programmeLabel(student.programme)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Daycare plan from Owner catalogue *"
                className="sm:col-span-2"
              >
                <select
                  value={planForm.planDefinitionId}
                  onChange={(event) => chooseCataloguePlan(event.target.value)}
                  required
                  className="input-style"
                >
                  <option value="">Choose a plan</option>
                  {planDefinitions.map((definition) => {
                    const version = definition.priceVersions[0];
                    return (
                      <option key={definition.id} value={definition.id}>
                        {definition.name} · {definition.billingType} ·{" "}
                        {formatMoney(version?.price ?? 0)}
                      </option>
                    );
                  })}
                </select>
              </Field>
              <Field label="Plan title" className="sm:col-span-2">
                <input
                  value={planForm.title}
                  readOnly
                  className="input-style bg-[#F8F5FA]"
                />
              </Field>
              {planForm.planType === "OCCASIONAL" ? (
                <Field label="Visit billing type *">
                  <select
                    value={planForm.billingMode}
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        billingMode: event.target.value as BillingMode,
                      }))
                    }
                    className="input-style"
                  >
                    <option value="HOURLY">Hourly care</option>
                    <option value="FULL_DAY">Full-day care</option>
                  </select>
                </Field>
              ) : planForm.planType === "FLEXIBLE_DAYS" ? (
                <>
                  <Field label="Number of daycare days *">
                    <input
                      type="number"
                      min="1"
                      max="31"
                      step="1"
                      value={planForm.includedDays}
                      onChange={(event) =>
                        setPlanForm((current) => ({
                          ...current,
                          includedDays: event.target.value,
                          monthlyFeeOverride: "",
                        }))
                      }
                      required
                      className="input-style"
                    />
                  </Field>
                  <div className="rounded-2xl border border-[#E3D8E8] bg-[#FAF8FC] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
                      Daycare amount
                    </p>
                    <p className="mt-1 text-lg font-black text-[#2D1736]">
                      {formatMoney(
                        (Number(planForm.includedDays) || 0) *
                          (activeRate?.fullDayRate ?? 400),
                      )}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#817684]">
                      {planForm.includedDays || 0} days ×{" "}
                      {formatMoney(activeRate?.fullDayRate ?? 400)}. Meal
                      package is added separately.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Field label="Daily daycare hours *">
                    <input
                      type="number"
                      min="0.25"
                      max="24"
                      step="0.25"
                      value={planForm.dailyHours}
                      onChange={(event) =>
                        setPlanForm((current) => ({
                          ...current,
                          dailyHours: event.target.value,
                        }))
                      }
                      required
                      className="input-style"
                    />
                  </Field>
                  <Field
                    label={
                      planForm.planType === "MONTHLY_DAYCARE_ONLY"
                        ? "Full-month daycare fee (₹) *"
                        : "Monthly daycare add-on (₹) *"
                    }
                  >
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={planForm.monthlyFeeOverride}
                      onChange={(event) =>
                        setPlanForm((current) => ({
                          ...current,
                          monthlyFeeOverride: event.target.value,
                        }))
                      }
                      placeholder={String(
                        planForm.planType === "MONTHLY_DAYCARE_ONLY"
                          ? (activeRate?.monthlyDaycareOnlyRate ??
                              "Enter the full-month amount")
                          : (activeRate?.monthlyPreschoolAddonRate ??
                              "Enter the monthly add-on"),
                      )}
                      required={
                        planForm.planType === "MONTHLY_DAYCARE_ONLY"
                          ? activeRate?.monthlyDaycareOnlyRate == null
                          : activeRate?.monthlyPreschoolAddonRate == null
                      }
                      className="input-style"
                    />
                  </Field>
                </>
              )}
              <Field label="Food plan *">
                <select
                  value={planForm.foodOption}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      foodOption: event.target.value as FoodOption,
                    }))
                  }
                  className="input-style"
                >
                  <option value="NONE">No food</option>
                  <option value="LUNCH">Lunch</option>
                  <option value="EVENING_SNACK">Evening snack</option>
                  <option value="BOTH">Lunch + evening snack</option>
                </select>
              </Field>
              <Field label="Meal combination from catalogue">
                <select
                  value={planForm.mealCombinationId}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      mealCombinationId: event.target.value,
                      foodOption: event.target.value
                        ? "BOTH"
                        : current.foodOption,
                    }))
                  }
                  className="input-style"
                >
                  <option value="">No combination</option>
                  {mealCombinations.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ·{" "}
                      {item.items.map((entry) => entry.meal.name).join(" + ")} ·{" "}
                      {formatMoney(item.priceVersions[0]?.price ?? 0)}
                    </option>
                  ))}
                </select>
              </Field>
              {planForm.planType !== "OCCASIONAL" &&
              planForm.foodOption !== "NONE" ? (
                <Field label="Monthly food package override">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={planForm.monthlyFoodFeeOverride}
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        monthlyFoodFeeOverride: event.target.value,
                      }))
                    }
                    placeholder={
                      planForm.foodOption === "BOTH"
                        ? "Default ₹2,000"
                        : "Default ₹1,200"
                    }
                    className="input-style"
                  />
                </Field>
              ) : null}
              <div className="sm:col-span-2">
                <p className="text-sm font-black text-[#35243E]">
                  Usual weekdays (optional)
                </p>
                <p className="mt-1 text-xs font-semibold text-[#817684]">
                  Choose fixed weekdays when known, or leave this blank for a
                  child who comes only on a few ad-hoc days each month.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {weekdays.map((day) => {
                    const selected = planForm.scheduledWeekdays.includes(
                      day.value,
                    );
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() =>
                          setPlanForm((current) => ({
                            ...current,
                            scheduledWeekdays: selected
                              ? current.scheduledWeekdays.filter(
                                  (value) => value !== day.value,
                                )
                              : [
                                  ...current.scheduledWeekdays,
                                  day.value,
                                ].sort(),
                          }))
                        }
                        className={`rounded-full border px-4 py-2 text-xs font-black ${selected ? "border-[#5B2A86] bg-[#5B2A86] text-white" : "border-[#DDD2E2] text-[#65596A]"}`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Start date *">
                <input
                  type="date"
                  value={planForm.planEffectiveFrom}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      planEffectiveFrom: event.target.value,
                    }))
                  }
                  required
                  className="input-style"
                />
              </Field>
              <Field label="End date">
                <input
                  type="date"
                  min={planForm.planEffectiveFrom}
                  value={planForm.planEffectiveTo}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      planEffectiveTo: event.target.value,
                    }))
                  }
                  className="input-style"
                />
              </Field>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCCFE4] bg-[#FAF8FC] px-4">
                <input
                  type="checkbox"
                  checked={planForm.recurring}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      recurring: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#5B2A86]"
                />
                <span className="text-sm font-black text-[#35243E]">
                  Generate every month until stopped
                </span>
              </label>
              <Field label="Maximum visits override">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={planForm.maximumVisitsOverride}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      maximumVisitsOverride: event.target.value,
                    }))
                  }
                  placeholder="Use catalogue limit"
                  className="input-style"
                />
              </Field>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCCFE4] bg-[#FAF8FC] px-4 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={planForm.separateInvoice}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      separateInvoice: event.target.checked,
                    }))
                  }
                  className="h-4 w-4 accent-[#5B2A86]"
                />
                <span className="text-sm font-black text-[#35243E]">
                  Owner explicitly wants a separate daycare invoice for this
                  plan
                </span>
              </label>
              <div className="rounded-2xl bg-[#F8F3FA] p-4 text-xs font-semibold leading-5 text-[#6E6173] sm:col-span-2">
                Available individual meals:{" "}
                {mealDefinitions.map((item) => item.name).join(", ") ||
                  "Create meals in Billing Catalogue"}
                . Emergency visits can record the exact meals taken.
              </div>
              {planForm.planType === "OCCASIONAL" ? (
                <>
                  {planForm.billingMode === "HOURLY" ? (
                    <Field label="Hourly rate override">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={planForm.hourlyRateOverride}
                        onChange={(event) =>
                          setPlanForm((current) => ({
                            ...current,
                            hourlyRateOverride: event.target.value,
                          }))
                        }
                        placeholder={String(activeRate?.hourlyRate ?? 100)}
                        className="input-style"
                      />
                    </Field>
                  ) : (
                    <Field label="Full-day rate override">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={planForm.fullDayRateOverride}
                        onChange={(event) =>
                          setPlanForm((current) => ({
                            ...current,
                            fullDayRateOverride: event.target.value,
                          }))
                        }
                        placeholder={String(activeRate?.fullDayRate ?? 400)}
                        className="input-style"
                      />
                    </Field>
                  )}
                  <Field label="Per-meal charge override">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={planForm.foodChargeOverride}
                      onChange={(event) =>
                        setPlanForm((current) => ({
                          ...current,
                          foodChargeOverride: event.target.value,
                        }))
                      }
                      placeholder={String(activeRate?.foodCharge ?? 50)}
                      className="input-style"
                    />
                  </Field>
                  {planForm.billingMode === "FULL_DAY" ? (
                    <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCCFE4] bg-[#FAF8FC] px-4 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={
                          planForm.planFullDayFoodIncluded ??
                          activeRate?.fullDayFoodIncluded ??
                          true
                        }
                        onChange={(event) =>
                          setPlanForm((current) => ({
                            ...current,
                            planFullDayFoodIncluded: event.target.checked,
                          }))
                        }
                        className="h-4 w-4 accent-[#5B2A86]"
                      />
                      <span className="text-sm font-black text-[#35243E]">
                        Full-day rate includes the selected food
                      </span>
                    </label>
                  ) : null}
                </>
              ) : null}
              <Field label="Notes" className="sm:col-span-2">
                <textarea
                  rows={3}
                  value={planForm.notes}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  className="input-style py-3"
                />
              </Field>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  aria-hidden="true"
                  size={18}
                  className="animate-spin"
                />
              ) : (
                <Save aria-hidden="true" size={18} />
              )}
              {planForm.planId ? "Save Plan Changes" : "Create Daycare Plan"}
            </button>
          </form>

          <section className="rounded-[30px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Child-plan administration
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
              Every child’s daycare arrangement
            </h2>
            {managedPlans.length === 0 ? (
              <EmptyState text="No child-specific daycare plan has been added." />
            ) : (
              <div className="mt-6 space-y-4">
                {managedPlans.map((plan) => (
                  <article
                    key={plan.id}
                    className="rounded-[24px] border border-[#E8E1EB] bg-[#FCFBFD] p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-black text-[#2D1736]">
                          {plan.studentName}
                        </h3>
                        <p className="mt-1 text-sm font-bold text-[#6A328F]">
                          {plan.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#817684]">
                          {programmeLabel(plan.programme)} ·{" "}
                          {plan.studentNumber}
                        </p>
                      </div>
                      <span
                        className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase ${plan.lifecycleStatus === "ACTIVE" ? "border-green-200 bg-green-50 text-green-700" : plan.lifecycleStatus === "ARCHIVED" ? "border-amber-200 bg-amber-50 text-amber-800" : "border-slate-200 bg-slate-50 text-slate-700"}`}
                      >
                        {plan.lifecycleStatus}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[#2D1736] px-3 py-1 text-xs font-black text-white">
                        {planTypeLabel(plan.planType)}
                      </span>
                      {plan.scheduledWeekdays.length > 0 ? (
                        plan.scheduledWeekdays.map((value) => (
                          <span
                            key={value}
                            className="rounded-full bg-[#F0E7F5] px-3 py-1 text-xs font-black text-[#5B2A86]"
                          >
                            {weekdays.find((day) => day.value === value)?.label}
                          </span>
                        ))
                      ) : (
                        <span className="rounded-full bg-[#F0E7F5] px-3 py-1 text-xs font-black text-[#5B2A86]">
                          As needed
                        </span>
                      )}
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-3 rounded-2xl bg-white p-4">
                      <MiniDetail
                        label="Billing"
                        value={
                          plan.planType === "OCCASIONAL"
                            ? plan.billingMode === "HOURLY"
                              ? "Per hour"
                              : "Per full day"
                            : "Monthly · one invoice"
                        }
                      />
                      <MiniDetail
                        label="Rate"
                        value={formatMoney(
                          plan.planType === "OCCASIONAL"
                            ? plan.billingMode === "HOURLY"
                              ? (plan.hourlyRateOverride ??
                                activeRate?.hourlyRate ??
                                100)
                              : (plan.fullDayRateOverride ??
                                activeRate?.fullDayRate ??
                                400)
                            : (plan.monthlyFeeOverride ??
                                (plan.planType === "MONTHLY_DAYCARE_ONLY"
                                  ? Number(plan.dailyHours ?? 0) <= 6.25
                                    ? (activeRate?.monthlySixHourRate ??
                                      activeRate?.monthlyDaycareOnlyRate)
                                    : (activeRate?.monthlySixHalfHourRate ??
                                      activeRate?.monthlyDaycareOnlyRate)
                                  : activeRate?.monthlyPreschoolAddonRate) ??
                                0),
                        )}
                      />
                      <MiniDetail
                        label="Food"
                        value={foodOptionLabel(plan.foodOption)}
                      />
                      <MiniDetail
                        label="Daily hours"
                        value={
                          plan.dailyHours == null
                            ? "As needed"
                            : `${plan.dailyHours} hours`
                        }
                      />
                      <MiniDetail
                        label="From"
                        value={formatDate(plan.effectiveFrom)}
                      />
                    </div>
                    {canManageContracts ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {plan.canEdit ? (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => editPlan(plan)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white disabled:opacity-60"
                          >
                            <Pencil aria-hidden="true" size={14} />
                            Edit
                          </button>
                        ) : null}
                        {!plan.canEdit &&
                        plan.planDefinitionId &&
                        (plan.lifecycleStatus === "ACTIVE" ||
                          plan.lifecycleStatus === "INACTIVE") ? (
                          <Link
                            href={`/admin/settings/billing?oldPlanId=${encodeURIComponent(plan.planDefinitionId)}#daycare-plan-replacement`}
                            className="inline-flex min-h-10 items-center rounded-xl bg-[#5B2A86] px-4 text-xs font-black text-white"
                          >
                            Replace plan
                          </Link>
                        ) : null}
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => duplicatePlan(plan)}
                          className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D9CCE1] px-4 text-xs font-black text-[#5B2A86] disabled:opacity-60"
                        >
                          Duplicate
                        </button>
                        {canManageLifecycle ? (
                          <button
                            type="button"
                            disabled={saving}
                            aria-expanded={openActionsPlanId === plan.id}
                            onClick={() =>
                              setOpenActionsPlanId((current) =>
                                current === plan.id ? null : plan.id,
                              )
                            }
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-[#D9CCE1] px-4 text-xs font-black text-[#5B2A86] disabled:opacity-60"
                          >
                            <MoreHorizontal aria-hidden="true" size={15} />
                            More actions
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                    {canManageLifecycle && openActionsPlanId === plan.id ? (
                      <div className="mt-3 rounded-2xl border border-[#E2D6E7] bg-white p-3">
                        <p className="px-1 text-[10px] font-black uppercase tracking-[0.1em] text-[#817684]">
                          Owner actions
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {plan.lifecycleStatus === "ACTIVE" ? (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                void changePlanLifecycle(plan, "DEACTIVATE")
                              }
                              className="min-h-10 rounded-xl border border-slate-200 px-4 text-xs font-black text-slate-700 disabled:opacity-60"
                            >
                              Pause
                            </button>
                          ) : plan.lifecycleStatus === "INACTIVE" ? (
                            <button
                              type="button"
                              disabled={saving}
                              onClick={() =>
                                void changePlanLifecycle(plan, "ACTIVATE")
                              }
                              className="min-h-10 rounded-xl bg-green-100 px-4 text-xs font-black text-green-800 disabled:opacity-60"
                            >
                              Resume
                            </button>
                          ) : null}
                          <button
                            type="button"
                            disabled={saving || deleteReviewLoading}
                            onClick={() => void openDeleteReview(plan)}
                            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-rose-50 px-4 text-xs font-black text-rose-700 disabled:opacity-60"
                          >
                            <Trash2 aria-hidden="true" size={14} />
                            Remove
                          </button>
                        </div>
                        {plan.lifecycleStatus === "ARCHIVED" ? (
                          <p className="mt-2 px-1 text-xs font-semibold leading-5 text-[#817684]">
                            Archived plans stay available in history. Duplicate
                            this plan if it should be used again.
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {activeTab === "rates" ? (
        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <form
            onSubmit={saveRates}
            className="rounded-[30px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7"
          >
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Editable pricing
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
              Daycare rates &amp; configurable GST
            </h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
              Change any amount, GST rule or price type whenever needed.
              Previous sessions keep their original rate snapshot for correct
              records.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Hourly rate (₹) *">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={rateForm.hourlyRate}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      hourlyRate: event.target.value,
                    }))
                  }
                  required
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <Field label="Emergency lunch (₹) *">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateForm.lunchCharge}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      lunchCharge: event.target.value,
                      foodCharge: event.target.value,
                    }))
                  }
                  required
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <Field label="Emergency evening snack (₹) *">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateForm.eveningSnackCharge}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      eveningSnackCharge: event.target.value,
                    }))
                  }
                  required
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <Field label="Emergency lunch + snack (₹) *">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateForm.mealComboCharge}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      mealComboCharge: event.target.value,
                    }))
                  }
                  required
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <Field label="Full-day rate (₹) *">
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={rateForm.fullDayRate}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      fullDayRate: event.target.value,
                    }))
                  }
                  required
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <Field label="Monthly daycare-only · 6 hours (₹)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateForm.monthlySixHourRate}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      monthlySixHourRate: event.target.value,
                    }))
                  }
                  placeholder="6000"
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <Field label="Monthly daycare-only · 6.5 hours (₹)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateForm.monthlySixHalfHourRate}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      monthlySixHalfHourRate: event.target.value,
                    }))
                  }
                  placeholder="6500"
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <Field label="Fallback daycare-only monthly rate (₹)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateForm.monthlyDaycareOnlyRate}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      monthlyDaycareOnlyRate: event.target.value,
                    }))
                  }
                  placeholder="For other daily hours"
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <Field label="Preschool + monthly daycare rate (₹)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={rateForm.monthlyPreschoolAddonRate}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      monthlyPreschoolAddonRate: event.target.value,
                    }))
                  }
                  placeholder="Monthly daycare add-on"
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <Field label="Effective from *">
                <input
                  type="date"
                  value={rateForm.effectiveFrom}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      effectiveFrom: event.target.value,
                    }))
                  }
                  required
                  disabled={!canManageRates}
                  className="input-style"
                />
              </Field>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCCFE4] bg-[#FAF8FC] px-4 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={rateForm.fullDayFoodIncluded}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      fullDayFoodIncluded: event.target.checked,
                    }))
                  }
                  disabled={!canManageRates}
                  className="h-4 w-4 accent-[#5B2A86]"
                />
                <span className="text-sm font-black text-[#35243E]">
                  Full-day rate includes food
                </span>
              </label>
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCCFE4] bg-[#FAF8FC] px-4">
                <input
                  type="checkbox"
                  checked={rateForm.gstApplicable}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      gstApplicable: event.target.checked,
                    }))
                  }
                  disabled={!canManageRates}
                  className="h-4 w-4 accent-[#5B2A86]"
                />
                <span className="text-sm font-black text-[#35243E]">
                  GST applicable
                </span>
              </label>
              <Field label="Daycare GST %">
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={rateForm.gstRate}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      gstRate: event.target.value,
                    }))
                  }
                  required={rateForm.gstApplicable}
                  disabled={!canManageRates || !rateForm.gstApplicable}
                  className="input-style"
                />
              </Field>
              {rateForm.gstApplicable ? (
                <Field label="Daycare price type">
                  <select
                    value={rateForm.priceType}
                    onChange={(event) =>
                      setRateForm((current) => ({
                        ...current,
                        priceType: event.target.value as PriceType,
                      }))
                    }
                    disabled={!canManageRates}
                    className="input-style"
                  >
                    <option value="GST_INCLUSIVE">GST inclusive</option>
                    <option value="GST_EXCLUSIVE">GST exclusive</option>
                  </select>
                </Field>
              ) : null}
              <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-[#DCCFE4] bg-[#FAF8FC] px-4">
                <input
                  type="checkbox"
                  checked={rateForm.foodGstApplicable}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      foodGstApplicable: event.target.checked,
                    }))
                  }
                  disabled={!canManageRates}
                  className="h-4 w-4 accent-[#5B2A86]"
                />
                <span className="text-sm font-black text-[#35243E]">
                  Food GST applicable
                </span>
              </label>
              <Field label="Food GST %">
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={rateForm.foodGstRate}
                  onChange={(event) =>
                    setRateForm((current) => ({
                      ...current,
                      foodGstRate: event.target.value,
                    }))
                  }
                  required={rateForm.foodGstApplicable}
                  disabled={!canManageRates || !rateForm.foodGstApplicable}
                  className="input-style"
                />
              </Field>
              {rateForm.foodGstApplicable ? (
                <Field label="Food price type">
                  <select
                    value={rateForm.foodPriceType}
                    onChange={(event) =>
                      setRateForm((current) => ({
                        ...current,
                        foodPriceType: event.target.value as PriceType,
                      }))
                    }
                    disabled={!canManageRates}
                    className="input-style"
                  >
                    <option value="GST_INCLUSIVE">GST inclusive</option>
                    <option value="GST_EXCLUSIVE">GST exclusive</option>
                  </select>
                </Field>
              ) : null}
            </div>
            {canManageRates ? (
              <button
                type="submit"
                disabled={saving}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#5B2A86] px-5 text-sm font-black text-white disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle
                    aria-hidden="true"
                    size={18}
                    className="animate-spin"
                  />
                ) : (
                  <Save aria-hidden="true" size={18} />
                )}
                Save New Rate Version
              </button>
            ) : (
              <p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold text-amber-800">
                You can use daycare billing, but only a user with Fee Settings
                permission can change rates.
              </p>
            )}
          </form>

          <section className="rounded-[30px] border border-[#E7DEEB] bg-white p-5 shadow-[0_16px_45px_rgba(45,23,54,0.06)] sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
              Audit history
            </p>
            <h2 className="mt-2 text-2xl font-black text-[#2D1736]">
              Previous daycare rates
            </h2>
            <p className="mt-2 text-sm font-semibold text-[#817684]">
              Nothing is overwritten; every price change remains visible.
            </p>
            {rateHistory.length === 0 ? (
              <EmptyState text="Save the starting daycare rates to begin billing." />
            ) : (
              <div className="mt-6 space-y-3">
                {rateHistory.map((rate) => (
                  <article
                    key={rate.id}
                    className={`rounded-[22px] border p-5 ${rate.active ? "border-green-200 bg-green-50/60" : "border-[#E8E1EB] bg-[#FCFBFD]"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-[#2D1736]">
                          {rate.title}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-[#817684]">
                          From {formatDate(rate.effectiveFrom)}
                          {rate.effectiveTo
                            ? ` to ${formatDate(rate.effectiveTo)}`
                            : ""}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${rate.active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600"}`}
                      >
                        {rate.active ? "Active" : "Previous"}
                      </span>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
                      <MiniDetail
                        label="Hourly"
                        value={formatMoney(rate.hourlyRate)}
                      />
                      <MiniDetail
                        label="Lunch"
                        value={formatMoney(rate.lunchCharge)}
                      />
                      <MiniDetail
                        label="Snack"
                        value={formatMoney(rate.eveningSnackCharge)}
                      />
                      <MiniDetail
                        label="Both meals"
                        value={formatMoney(rate.mealComboCharge)}
                      />
                      <MiniDetail
                        label="Full day"
                        value={formatMoney(rate.fullDayRate)}
                      />
                      <MiniDetail
                        label="Monthly · 6 hours"
                        value={
                          rate.monthlySixHourRate == null
                            ? "Set per child"
                            : formatMoney(rate.monthlySixHourRate)
                        }
                      />
                      <MiniDetail
                        label="Monthly · 6.5 hours"
                        value={
                          rate.monthlySixHalfHourRate == null
                            ? "Set per child"
                            : formatMoney(rate.monthlySixHalfHourRate)
                        }
                      />
                      <MiniDetail
                        label="Preschool add-on"
                        value={
                          rate.monthlyPreschoolAddonRate == null
                            ? "Set per child"
                            : formatMoney(rate.monthlyPreschoolAddonRate)
                        }
                      />
                    </div>
                    <p className="mt-3 text-xs font-bold text-[#817684]">
                      Daycare{" "}
                      {rate.gstApplicable
                        ? `${rate.gstRate ?? 0}% GST ${rate.priceType === "GST_EXCLUSIVE" ? "exclusive" : "inclusive"}`
                        : "GST not applicable"}{" "}
                      · Food{" "}
                      {rate.foodGstApplicable
                        ? `${rate.foodGstRate ?? 0}% GST ${rate.foodPriceType === "GST_EXCLUSIVE" ? "exclusive" : "inclusive"}`
                        : "GST not applicable"}{" "}
                      · Full-day food{" "}
                      {rate.fullDayFoodIncluded ? "included" : "separate"}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}

      {deleteReview ? (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-center bg-[#1F1228]/55 p-3 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="daycare-delete-title"
        >
          <section className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-[28px] border border-[#E5DAE9] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.13em] text-[#7A459C]">
                  Safe plan review
                </p>
                <h2
                  id="daycare-delete-title"
                  className="mt-2 text-2xl font-black text-[#2D1736]"
                >
                  {deleteReviewLoading
                    ? "Checking this plan…"
                    : deleteReview.preview?.dependencies.activeAssignments
                      ? "This plan is active for a child"
                      : deleteReview.preview?.historicalRecords
                        ? "This plan has centre history"
                        : "Delete this unused plan permanently?"}
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-[#817684]">
                  {deleteReview.plan.studentName} · {deleteReview.plan.title}
                </p>
              </div>
              <button
                type="button"
                disabled={saving}
                onClick={() => setDeleteReview(null)}
                aria-label="Close plan review"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3EDF6] text-[#5B2A86] disabled:opacity-60"
              >
                <X aria-hidden="true" size={18} />
              </button>
            </div>

            {deleteReviewLoading ? (
              <div className="mt-8 flex items-center gap-3 rounded-2xl bg-[#FAF8FC] p-5 text-sm font-bold text-[#5B2A86]">
                <LoaderCircle
                  aria-hidden="true"
                  size={20}
                  className="animate-spin"
                />
                Checking attendance, billing and contract links…
              </div>
            ) : deleteReview.preview ? (
              <>
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle
                      aria-hidden="true"
                      size={20}
                      className="mt-0.5 shrink-0 text-amber-700"
                    />
                    <p className="text-sm font-bold leading-6 text-amber-900">
                      {deleteReview.preview.dependencies.activeAssignments > 0
                        ? "This daycare arrangement is currently active. It cannot be permanently deleted while it is assigned to the child."
                        : deleteReview.preview.historicalRecords > 0
                          ? "This plan has attendance or billing history. It cannot be permanently deleted because those records must remain available. Archive it instead from this window."
                          : deleteReview.preview.dependencies.contractLinks > 0
                            ? "This plan has never been used for attendance or billing. Its unused contract link will be removed safely with the plan."
                            : "This plan has never been used for attendance or billing. Permanent deletion is available to the Owner."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniDetail
                    label="Attendance"
                    value={String(
                      deleteReview.preview.dependencies.attendanceRecords,
                    )}
                  />
                  <MiniDetail
                    label="Invoice items"
                    value={String(deleteReview.preview.dependencies.invoiceItems)}
                  />
                  <MiniDetail
                    label="Ledger charges"
                    value={String(
                      deleteReview.preview.dependencies.ledgerCharges,
                    )}
                  />
                  <MiniDetail
                    label="Contract link"
                    value={
                      deleteReview.preview.dependencies.contractLinks
                        ? "Yes"
                        : "No"
                    }
                  />
                </div>

                {deleteReview.preview.dependencies.activeAssignments >
                0 ? null : deleteReview.preview.historicalRecords > 0 ? (
                  <Field label="Reason for the audited action" className="mt-5">
                    <input
                      value={deleteReviewReason}
                      onChange={(event) =>
                        setDeleteReviewReason(event.target.value)
                      }
                      maxLength={500}
                      className="input-style"
                      placeholder="For example: Plan ended"
                    />
                  </Field>
                ) : (
                  <div className="mt-5 space-y-4">
                    <Field label="Reason for permanent deletion">
                      <input
                        value={deleteReviewReason}
                        onChange={(event) =>
                          setDeleteReviewReason(event.target.value)
                        }
                        maxLength={500}
                        className="input-style"
                        placeholder="For example: Created by mistake"
                      />
                    </Field>
                    <Field label="Type PERMANENT DELETE to confirm">
                      <input
                        value={deleteReviewConfirmation}
                        onChange={(event) =>
                          setDeleteReviewConfirmation(event.target.value)
                        }
                        autoComplete="off"
                        className="input-style"
                      />
                    </Field>
                  </div>
                )}

                {deleteReviewError ? (
                  <p
                    role="alert"
                    className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700"
                  >
                    {deleteReviewError}
                  </p>
                ) : null}

                <div className="mt-6 flex flex-wrap justify-end gap-3">
                  {deleteReview.preview.dependencies.activeAssignments > 0 ? (
                    <>
                      <Link
                        href={`/admin/students/${deleteReview.plan.studentId}`}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-[#D9CCE1] px-4 text-sm font-black text-[#5B2A86]"
                      >
                        View child profile
                      </Link>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void finishDeleteReview("DEACTIVATE")}
                        className="min-h-11 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-700 disabled:opacity-60"
                      >
                        Pause plan
                      </button>
                    </>
                  ) : deleteReview.preview.historicalRecords > 0 ? (
                    deleteReview.plan.lifecycleStatus === "ARCHIVED" ? (
                      <span className="rounded-xl bg-[#F3EDF6] px-4 py-3 text-sm font-black text-[#5B2A86]">
                        Already archived safely
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={saving || deleteReviewReason.trim().length < 4}
                        onClick={() => void finishDeleteReview("ARCHIVE")}
                        className="min-h-11 rounded-xl bg-amber-100 px-4 text-sm font-black text-amber-900 disabled:opacity-50"
                      >
                        Archive plan
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={
                        saving ||
                        deleteReviewReason.trim().length < 8 ||
                        deleteReviewConfirmation !== "PERMANENT DELETE"
                      }
                      onClick={() =>
                        void finishDeleteReview("PERMANENT_DELETE")
                      }
                      className="min-h-11 rounded-xl bg-red-600 px-4 text-sm font-black text-white disabled:opacity-50"
                    >
                      Delete permanently
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setDeleteReview(null)}
                    className="min-h-11 rounded-xl border border-[#D9CCE1] px-4 text-sm font-black text-[#5B2A86] disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold leading-6 text-red-700">
                {deleteReviewError ||
                  "The plan’s safe deletion review could not be loaded."}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  note,
}: {
  icon: typeof IndianRupee;
  label: string;
  value: string;
  note: string;
}) {
  return (
    <article className="rounded-[26px] border border-[#E7DFEB] bg-white p-5 shadow-[0_12px_35px_rgba(45,23,54,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.11em] text-[#817684]">
            {label}
          </p>
          <p className="mt-2 text-2xl font-black text-[#2D1736]">{value}</p>
          <p className="mt-1 text-xs font-semibold text-[#817684]">{note}</p>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F1E7F6] text-[#5B2A86]">
          <Icon aria-hidden="true" size={20} />
        </span>
      </div>
    </article>
  );
}

function PlanGuide({ title, text }: { title: string; text: string }) {
  return (
    <article className="rounded-2xl border border-[#E8DFEC] bg-[#FAF8FC] p-4">
      <p className="text-sm font-black text-[#2D1736]">{title}</p>
      <p className="mt-2 text-xs font-semibold leading-5 text-[#817684]">
        {text}
      </p>
    </article>
  );
}

function Field({
  label,
  className = "",
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm font-black text-[#35243E]">{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function MiniDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-black uppercase tracking-[0.08em] text-[#9A8D9F]">
        {label}
      </p>
      <p className="mt-1 text-sm font-black text-[#35243E]">{value}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-6 rounded-2xl bg-[#FAF8FC] p-8 text-center">
      <BadgeIndianRupee
        aria-hidden="true"
        size={30}
        className="mx-auto text-[#A08DA8]"
      />
      <p className="mt-3 text-sm font-bold text-[#817684]">{text}</p>
    </div>
  );
}
