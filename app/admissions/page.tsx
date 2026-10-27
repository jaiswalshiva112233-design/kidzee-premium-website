import type { Metadata } from "next";
import AdmissionsCampaign from "@/components/admissions/AdmissionsCampaign";
import {
  ADMISSIONS_CAMPAIGN_TITLE,
  ADMISSIONS_CAMPAIGN_DESCRIPTION,
  ADMISSIONS_CAMPAIGN_IMAGE,
  admissionsCampaignFaqs,
} from "@/lib/website/admissionsCampaign";

export const metadata: Metadata = {
  title: { absolute: ADMISSIONS_CAMPAIGN_TITLE },
  description: ADMISSIONS_CAMPAIGN_DESCRIPTION,
  alternates: { canonical: "/admissions" },
  openGraph: {
    title: ADMISSIONS_CAMPAIGN_TITLE,
    description: ADMISSIONS_CAMPAIGN_DESCRIPTION,
    url: "/admissions",
    images: [{ url: ADMISSIONS_CAMPAIGN_IMAGE, width: 1200, height: 630, alt: "Kidzee preschool in Sector 12 Dwarka" }],
  },
  twitter: { card: "summary_large_image", title: ADMISSIONS_CAMPAIGN_TITLE, description: ADMISSIONS_CAMPAIGN_DESCRIPTION, images: [ADMISSIONS_CAMPAIGN_IMAGE] },
};

const programmes = new Set(["PLAYGROUP", "NURSERY", "JUNIOR_KG", "SENIOR_KG", "DAYCARE"]);
const enquiryTypes = new Set(["ADMISSION", "SCHOOL_VISIT", "TRIAL", "DAYCARE", "FEES", "CALLBACK"]);

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] ?? "" : value ?? "").toUpperCase();
}

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const programme = first(query.programme);
  const enquiry = first(query.enquiry);
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: admissionsCampaignFaqs.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq).replace(/</g, "\\u003c") }} />
      <AdmissionsCampaign
        initialProgramme={programmes.has(programme) ? programme : ""}
        initialEnquiryType={enquiryTypes.has(enquiry) ? enquiry : "SCHOOL_VISIT"}
      />
    </>
  );
}
