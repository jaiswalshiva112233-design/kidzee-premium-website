import type { Metadata } from "next";
import { getPublishedWebsiteTeamMembers } from "@/lib/sanity/team";
import AdmissionsCampaign from "@/components/admissions/AdmissionsCampaign";
import {
  ADMISSIONS_CAMPAIGN_TITLE,
  ADMISSIONS_CAMPAIGN_DESCRIPTION,
  ADMISSIONS_CAMPAIGN_IMAGE,
  admissionsCampaignFaqs,
  getAdmissionsEnquiry,
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

export default async function AdmissionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [query, teamMembers] = await Promise.all([searchParams, getPublishedWebsiteTeamMembers()]);
  const enquiry = getAdmissionsEnquiry(query);
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
        teamMembers={teamMembers}
        {...enquiry}
      />
    </>
  );
}

