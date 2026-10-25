// CRM outcomes must be recorded; clicks and call duration do not establish qualification.
export const QUALIFIED_LEAD_STATUSES = [
  "QUALIFIED", "VISIT_BOOKED", "VISIT_SCHEDULED", "VISIT_COMPLETED",
  "TRIAL_SCHEDULED", "TRIAL_COMPLETED", "INTERESTED", "ADMITTED",
] as const;

export function isQualifiedLeadStatus(status: string) {
  return (QUALIFIED_LEAD_STATUSES as readonly string[]).includes(status);
}
