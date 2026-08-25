export type AcademicChargePolicy =
  | "ACADEMIC_SESSION"
  | "ROLLING_12_MONTHS"
  | "MANUAL_ONLY";

export function academicSessionLabel(period: string, startMonth: number) {
  const [year, month] = period.split("-").map(Number);
  const startYear = month >= startMonth ? year : year - 1;
  return `${startYear}-${String(startYear + 1).slice(-2)}`;
}

export function annualChargeReference(input: {
  period: string;
  joiningPeriod: string;
  startMonth: number;
  policy: AcademicChargePolicy;
}) {
  if (input.policy === "MANUAL_ONLY") return null;
  if (input.policy === "ACADEMIC_SESSION") {
    const session = academicSessionLabel(input.period, input.startMonth);
    return {
      reference: session.slice(0, 4),
      label: `Academic session ${session}`,
      manualReference: session,
    };
  }

  const [year, month] = input.period.split("-").map(Number);
  const [joiningYear, joiningMonth] = input.joiningPeriod.split("-").map(Number);
  const elapsedMonths = (year - joiningYear) * 12 + month - joiningMonth;
  if (elapsedMonths < 0) return null;
  const cycle = Math.floor(elapsedMonths / 12);
  const startIndex = joiningMonth - 1 + cycle * 12;
  const cycleYear = joiningYear + Math.floor(startIndex / 12);
  const cycleMonth = (startIndex % 12) + 1;
  const cyclePeriod = `${cycleYear}-${String(cycleMonth).padStart(2, "0")}`;
  return {
    reference: `rolling-${cyclePeriod}`,
    label: `Rolling 12-month cycle from ${cyclePeriod}`,
    manualReference: null,
  };
}

export function prepaidPlanCoversWeekday(
  planType: string | null,
  scheduledWeekdays: number[],
  weekday: number,
) {
  if (!planType || planType === "OCCASIONAL") return false;
  return scheduledWeekdays.length === 0 || scheduledWeekdays.includes(weekday);
}

export function recurringDaycareAmount(input: {
  unitPrice: number;
  monthlyOverride: number | null;
  billingType: string | null;
  weeks: number;
  visits: number;
}) {
  const multiplier = input.monthlyOverride != null
    ? 1
    : input.billingType === "WEEKLY"
      ? Math.max(1, input.weeks)
      : input.billingType === "DAILY"
        ? Math.max(1, input.visits)
        : 1;
  return Math.round((input.unitPrice * multiplier + Number.EPSILON) * 100) / 100;
}
