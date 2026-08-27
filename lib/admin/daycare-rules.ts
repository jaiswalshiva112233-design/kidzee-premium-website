export type EffectiveRange = {
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

export type DaycarePlanDependencySummary = {
  activeAssignments: number;
  attendanceRecords: number;
  invoiceItems: number;
  ledgerCharges: number;
  contractLinks: number;
  auditRecords: number;
};

/**
 * StudentDaycarePlan_catalogue_values_check requires a billing stop timestamp
 * to be on or after the plan start. Future-dated plans therefore stop at their
 * effective start, while plans that have already begun stop at the action time.
 */
export function daycareLifecycleStopAt(effectiveFrom: Date, actionAt: Date) {
  return actionAt < effectiveFrom ? effectiveFrom : actionAt;
}

export function daycareServiceEndAt(
  effectiveFrom: Date,
  configuredEnd: Date | null,
  actionAt: Date,
) {
  const lifecycleEnd = daycareLifecycleStopAt(effectiveFrom, actionAt);
  return configuredEnd && configuredEnd < lifecycleEnd
    ? configuredEnd
    : lifecycleEnd;
}

export function daycarePlanHistoricalDependencyCount(
  dependencies: DaycarePlanDependencySummary,
) {
  return (
    dependencies.attendanceRecords +
    dependencies.invoiceItems +
    dependencies.ledgerCharges
  );
}

export function canPermanentlyDeleteDaycarePlan(
  dependencies: DaycarePlanDependencySummary,
) {
  return (
    dependencies.activeAssignments === 0 &&
    daycarePlanHistoricalDependencyCount(dependencies) === 0
  );
}

export function effectiveRangesOverlap(
  left: EffectiveRange,
  right: EffectiveRange,
) {
  const leftEnd = left.effectiveTo?.getTime() ?? Number.POSITIVE_INFINITY;
  const rightEnd = right.effectiveTo?.getTime() ?? Number.POSITIVE_INFINITY;

  return (
    left.effectiveFrom.getTime() <= rightEnd &&
    right.effectiveFrom.getTime() <= leftEnd
  );
}

export function dateIsWithinEffectiveRange(
  date: Date,
  range: EffectiveRange,
) {
  const timestamp = date.getTime();

  return (
    timestamp >= range.effectiveFrom.getTime() &&
    (range.effectiveTo == null || timestamp <= range.effectiveTo.getTime())
  );
}

export function getIndiaMonthRange(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const start = new Date(
    `${year}-${String(month).padStart(2, "0")}-01T00:00:00.000+05:30`,
  );
  const end = new Date(
    new Date(
      `${nextYear}-${String(nextMonth).padStart(2, "0")}-01T00:00:00.000+05:30`,
    ).getTime() - 1,
  );

  return { start, end };
}
