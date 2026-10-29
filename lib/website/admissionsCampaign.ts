export const ADMISSIONS_CAMPAIGN_SLUG = "preschool-admissions-dwarka-sector-12";
export const ADMISSIONS_CAMPAIGN_TITLE = "Preschool & Daycare 2027–28 | Kidzee Dwarka Sector 12";
export const ADMISSIONS_CAMPAIGN_DESCRIPTION = "Preschool admissions 2027–28 at Kidzee Dwarka Sector 12. Daycare from 12:30 PM. Book a visit. 30% Off Annual Charges, Tuition Begins in March, Summer Camp Included. Terms apply.";
export const ADMISSIONS_CAMPAIGN_IMAGE = "/images/landing/kidzee-creative-learning.jpg";

export function campaignPortraitUrl(source: string) {
  if (!source.startsWith("https://cdn.sanity.io/images/")) return source;
  const url = new URL(source);
  url.searchParams.set("w", "640");
  url.searchParams.set("fit", "max");
  url.searchParams.set("auto", "format");
  url.searchParams.set("q", "80");
  return url.toString();
}

export function getAdmissionsEnquiry(query: Record<string, string | string[] | undefined>) {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] ?? "" : value ?? "").toUpperCase();
  const programme = first(query.programme);
  const enquiry = first(query.enquiry);
  const programmes = new Set(["PLAYGROUP", "NURSERY", "JUNIOR_KG", "SENIOR_KG", "DAYCARE"]);
  const enquiries = new Set(["ADMISSION", "SCHOOL_VISIT", "TRIAL", "DAYCARE", "CALLBACK"]);
  return { initialProgramme: programmes.has(programme) ? programme : "", initialEnquiryType: enquiry === "FEES" ? "CALLBACK" : enquiries.has(enquiry) ? enquiry : programme === "DAYCARE" ? "DAYCARE" : "SCHOOL_VISIT" };
}

export const admissionsCampaignFaqs = [
  { question: "How do I enquire about nursery or play school admission?", answer: "Send your name and mobile number or call Kidzee Sector 12B, Dwarka. Our centre team will discuss your child's age, explain Playgroup, Nursery or KG placement and arrange a school visit. Sending an enquiry does not reserve a seat; admission and availability are confirmed by the centre." },
  { question: "How does the January start work?", answer: "For eligible children joining in January 2027, including families completing admission in December 2026, January and February are a settling-in attendance period. Your child gets to know the teachers, friends and preschool routine. Tuition Begins in March. Ask the admissions team to explain the approved offer terms before enrolling." },
  { question: "What is the Early Start Advantage?", answer: "Eligible 2027–28 preschool enrolments can receive 30% Off Annual Charges, January settling-in with Tuition Begins in March, and Summer Camp Included. The admissions team will explain eligibility and the approved terms during your conversation or school visit." },
  { question: "Which enrolments include summer camp?", answer: "Summer Camp Included applies to eligible 2027–28 preschool enrolments under the approved offer. The centre will confirm eligibility and share the camp dates and timings when the schedule is ready." },
  { question: "Can we visit before taking admission?", answer: "Yes. Send the short enquiry form and add a preferred date if you wish. Our team will call to confirm a convenient time so you can see the classrooms and play spaces, meet the team and discuss your child's needs." },
  { question: "Which class would suit my child?", answer: "Playgroup is generally for ages 2–3, Nursery for 3–4, Junior KG for 4–5 and Senior KG for 5–6. We also consider readiness and previous preschool experience. If you are unsure, leave the optional programme field at 'Please guide me'." },
  { question: "Which days do preschool classes run?", answer: "Preschool classes run Monday to Friday. Our team will confirm the timings for your selected programme and your child's settling-in routine." },
  { question: "What time does daycare start?", answer: "Daycare runs from 12:30 PM to 7:00 PM, Monday to Saturday. Families can discuss after-preschool, selected-day, occasional or after-school care. The centre confirms age suitability, the routine and current availability." },
  { question: "Can we discuss meals and transport?", answer: "Vegetarian preschool breakfast is included. Talk to the admissions team about daycare lunch and evening snacks. Preschool transport is available on selected routes, subject to confirmation. Daycare transport is not available." },
  { question: "Who can collect my child from daycare?", answer: "Children are handed over to adults approved by the parent. Inform the centre in advance if a different approved adult will collect your child, and discuss the pickup process during your visit." },
  { question: "How can I discuss detailed programme information?", answer: "Contact the admissions team by phone or WhatsApp, or book a school visit. We will discuss your child's needs, programme options and the details relevant to your family directly." },
] as const;

