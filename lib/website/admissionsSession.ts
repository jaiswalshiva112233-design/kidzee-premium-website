/** Public admissions information confirmed by the centre for the coming session. */
export const ADMISSIONS_SESSION = "2027–28";
export const ADMISSIONS_SESSION_UPDATED_AT = "2026-11-21T00:00:00+05:30";

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
    "Our early-bird offer is available for a limited number of 2027–28 preschool places. Visit us to meet the teachers and find out whether the offer applies to your child.",
  benefits: [
    {
      title: "30% Off Annual Charges",
      description: "An early-bird benefit for eligible preschool admissions to the 2027–28 session.",
    },
    {
      title: "January settling-in",
      description: "January and February give your child time to settle in. Tuition begins in March.",
    },
    {
      title: "Summer Camp Included",
      description: "Included for eligible preschool enrolments. Our centre will share the camp dates and timings.",
    },
  ],
  disclaimer: "Terms and conditions apply.",
} as const;
