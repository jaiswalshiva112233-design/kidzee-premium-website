import { programmes, preschoolMealPlan, site } from "@/lib/site";

export function miraKnowledge() {
  return {
    centre: site.shortName,
    location: site.address,
    phone: site.phoneDisplay,
    preschoolHours: site.preschoolHours.display,
    daycareHours: site.daycareHours.display,
    programmes: programmes.map(({ title, age, time, intro }) => ({ title, age, time, intro })),
    trial: site.trial.display,
    meals: {
      preschool: preschoolMealPlan.description,
      note: preschoolMealPlan.note,
    },
    rules: [
      "Do not quote fees. Offer Get Fee Details or Request a Call.",
      "Preschool cab service is available only on selected confirmed routes. Daycare cab service is not available.",
      "Do not claim seat availability, transport availability or services that are not confirmed.",
      "Never access or discuss student, applicant, fee, admin or analytics records.",
    ],
  };
}
