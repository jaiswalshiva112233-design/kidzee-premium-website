export type EffectiveRange = {
  effectiveFrom: Date;
  effectiveTo: Date | null;
};

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
