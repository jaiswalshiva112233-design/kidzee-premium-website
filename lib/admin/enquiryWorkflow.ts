import type { $Enums } from "@/generated/prisma/client";

export const ACTIVE_ENQUIRY_STATUSES: readonly $Enums.EnquiryStatus[] = [
  "NEW",
  "CONTACTED",
  "NO_ANSWER",
  "FOLLOW_UP",
  "VISIT_SCHEDULED",
  "VISIT_BOOKED",
  "VISIT_COMPLETED",
  "TRIAL_SCHEDULED",
  "TRIAL_COMPLETED",
  "INTERESTED",
  "QUALIFIED",
];

const ALLOWED_TRANSITIONS: Record<
  $Enums.EnquiryStatus,
  readonly $Enums.EnquiryStatus[]
> = {
  NEW: ["CONTACTED", "NO_ANSWER", "FOLLOW_UP"],
  CONTACTED: [
    "NO_ANSWER",
    "FOLLOW_UP",
    "VISIT_BOOKED",
    "VISIT_SCHEDULED",
    "INTERESTED",
    "NOT_INTERESTED",
  ],
  NO_ANSWER: ["CONTACTED", "FOLLOW_UP", "NOT_INTERESTED"],
  FOLLOW_UP: [
    "CONTACTED",
    "NO_ANSWER",
    "VISIT_BOOKED",
    "VISIT_SCHEDULED",
    "INTERESTED",
    "NOT_INTERESTED",
  ],
  VISIT_SCHEDULED: [
    "VISIT_BOOKED",
    "VISIT_COMPLETED",
    "FOLLOW_UP",
    "NOT_INTERESTED",
  ],
  VISIT_BOOKED: [
    "VISIT_COMPLETED",
    "FOLLOW_UP",
    "NOT_INTERESTED",
  ],
  VISIT_COMPLETED: [
    "TRIAL_SCHEDULED",
    "QUALIFIED",
    "FOLLOW_UP",
    "NOT_INTERESTED",
  ],
  TRIAL_SCHEDULED: [
    "TRIAL_COMPLETED",
    "QUALIFIED",
    "FOLLOW_UP",
    "NOT_INTERESTED",
  ],
  TRIAL_COMPLETED: ["QUALIFIED", "FOLLOW_UP", "NOT_INTERESTED"],
  INTERESTED: [
    "VISIT_BOOKED",
    "VISIT_SCHEDULED",
    "TRIAL_SCHEDULED",
    "QUALIFIED",
    "FOLLOW_UP",
    "NOT_INTERESTED",
  ],
  QUALIFIED: ["ADMITTED", "FOLLOW_UP", "NOT_INTERESTED"],
  ADMITTED: [],
  NOT_INTERESTED: [],
  CLOSED: [],
};

export function formatEnquiryStatus(status: $Enums.EnquiryStatus) {
  return status
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function canTransitionEnquiry(
  from: $Enums.EnquiryStatus,
  to: $Enums.EnquiryStatus,
) {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to);
}

export function allowedEnquiryTransitions(status: $Enums.EnquiryStatus) {
  return ALLOWED_TRANSITIONS[status];
}

export function isClosedEnquiryStatus(status: $Enums.EnquiryStatus) {
  return status === "CLOSED" || status === "NOT_INTERESTED";
}

export function leadActivityTypeForStatus(
  status: $Enums.EnquiryStatus,
): $Enums.LeadActivityType {
  if (status === "VISIT_BOOKED" || status === "VISIT_SCHEDULED") {
    return "VISIT_BOOKED";
  }

  if (status === "VISIT_COMPLETED") {
    return "VISIT_COMPLETED";
  }

  if (status === "TRIAL_SCHEDULED") {
    return "TRIAL_SCHEDULED";
  }

  if (status === "TRIAL_COMPLETED") {
    return "TRIAL_COMPLETED";
  }

  if (status === "ADMITTED") {
    return "ADMISSION_CONFIRMED";
  }

  if (isClosedEnquiryStatus(status)) {
    return "CLOSED";
  }

  return "STATUS_CHANGED";
}
