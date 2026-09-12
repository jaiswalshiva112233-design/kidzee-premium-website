import type { $Enums } from "@/generated/prisma/client";

export const DEFAULT_PROGRAMME_CAPACITIES: Record<$Enums.Programme, number> = {
  PLAYGROUP: 8,
  NURSERY: 8,
  JUNIOR_KG: 10,
  SENIOR_KG: 10,
  DAYCARE: 12,
};

export type CapacityWarning = {
  exceeded: boolean;
  nearCapacity: boolean;
  activeCount: number;
  capacity: number;
  occupancyRate: number;
  message: string | null;
};

export function evaluateBatchCapacity(
  programme: $Enums.Programme,
  activeCount: number,
  customCapacity?: number | null,
): CapacityWarning {
  const capacity = customCapacity && customCapacity > 0
    ? customCapacity
    : DEFAULT_PROGRAMME_CAPACITIES[programme] ?? 10;

  const occupancyRate = Math.round((activeCount / capacity) * 100);
  const exceeded = activeCount > capacity;
  const nearCapacity = activeCount === capacity || occupancyRate >= 90;

  let message: string | null = null;
  if (exceeded) {
    message = `Teacher-to-student capacity exceeded (${activeCount}/${capacity} enrolled, ${occupancyRate}%). Recommend adding an assistant teacher or opening an additional section.`;
  } else if (nearCapacity) {
    message = `Section is at or near maximum capacity (${activeCount}/${capacity} enrolled, ${occupancyRate}%).`;
  }

  return {
    exceeded,
    nearCapacity,
    activeCount,
    capacity,
    occupancyRate,
    message,
  };
}

export const ALLOWED_OBSERVATION_TRANSITIONS: Record<
  $Enums.ObservationReportStatus,
  ReadonlyArray<$Enums.ObservationReportStatus>
> = {
  DRAFT: ["SUBMITTED"],
  SUBMITTED: ["CHANGES_REQUESTED", "APPROVED"],
  CHANGES_REQUESTED: ["DRAFT", "SUBMITTED"],
  APPROVED: [],
};

export function canTransitionObservation(
  currentStatus: $Enums.ObservationReportStatus,
  targetStatus: $Enums.ObservationReportStatus,
  role: "OWNER" | "CENTRE_HEAD" | "TEACHER",
): boolean {
  const allowed = ALLOWED_OBSERVATION_TRANSITIONS[currentStatus];
  if (!allowed || !allowed.includes(targetStatus)) {
    return false;
  }

  // Teachers can submit drafts or resubmit after changes requested
  if (role === "TEACHER") {
    return targetStatus === "SUBMITTED" || targetStatus === "DRAFT";
  }

  // Centre Head / Owner can approve, request changes, or submit
  return true;
}
