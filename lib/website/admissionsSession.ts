/** Public admissions information confirmed by the centre for the coming session. */
export const ADMISSIONS_SESSION = "2027–28";
export const ADMISSIONS_SESSION_UPDATED_AT = "2026-11-19T00:00:00+05:30";

export const preschoolProgrammeHours = {
  playgroup: "9:30 AM–12:30 PM",
  nursery: "9:30 AM–12:30 PM",
  juniorKg: "9:30 AM–1:00 PM",
  seniorKg: "9:30 AM–1:00 PM",
} as const;

export const preschoolHoursSummary =
  "Playgroup & Nursery: 9:30 AM–12:30 PM · Junior & Senior KG: 9:30 AM–1:00 PM";

export const earlyStartOffer = {
  title: "A gentle start. More time to settle in.",
  introduction:
    "Explore the Early Start Advantage for eligible 2027–28 preschool admissions. Meet our team, understand the programme and confirm the offer details before enrolling.",
  benefits: [
    {
      title: "30% Off Annual Charges",
      description: "An early-bird benefit for eligible preschool admissions to the 2027–28 session.",
    },
    {
      title: "January settling-in",
      description: "Time to get to know the teachers, classmates and daily routine. Tuition Begins in March.",
    },
    {
      title: "Summer Camp Included",
      description: "Included for eligible preschool enrolments. Our centre will share the camp dates and timings.",
    },
  ],
  terms: [
    "30% Off Annual Charges applies to eligible 2027–28 preschool admissions at this centre. The admissions team will explain the approved terms before enrolment.",
    "January and February are a settling-in attendance period for eligible children joining in January 2027, including families completing admission in December 2026. Tuition Begins in March. Attendance follows the centre's working days and agreed routine.",
    "Summer Camp Included applies to eligible 2027–28 preschool enrolments. Dates and timings follow the centre's camp schedule.",
    "The offer is for eligible preschool enrolments; it does not automatically apply to daycare or transport. The centre confirms programme suitability, availability and eligibility.",
  ],
} as const;
