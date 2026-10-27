import type { Metadata } from "next";
import { notFound } from "next/navigation";

import LandingPageExperience from "@/components/growth/LandingPageExperience";
import { ADMISSIONS_CAMPAIGN_SLUG, ADMISSIONS_CAMPAIGN_TITLE, ADMISSIONS_CAMPAIGN_DESCRIPTION, ADMISSIONS_CAMPAIGN_IMAGE } from "@/lib/website/admissionsCampaign";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

async function pageData(slug: string) {
  return prisma.landingPage.findFirst({ where: { slug, status: "PUBLISHED" }, include: { variants: { where: { active: true }, orderBy: { variantKey: "asc" } }, experiments: { where: { status: "RUNNING" }, include: { variants: { include: { variant: true } } }, orderBy: { startedAt: "desc" }, take: 1 } } });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await pageData(slug);
  if (!page) return {};
  if (slug === ADMISSIONS_CAMPAIGN_SLUG) {
    return {
      title: { absolute: ADMISSIONS_CAMPAIGN_TITLE },
      description: ADMISSIONS_CAMPAIGN_DESCRIPTION,
      alternates: { canonical: site.url + "/landing/" + page.slug },
      robots: { index: false, follow: true },
      openGraph: { title: ADMISSIONS_CAMPAIGN_TITLE, description: ADMISSIONS_CAMPAIGN_DESCRIPTION, url: site.url + "/landing/" + page.slug, images: [{ url: ADMISSIONS_CAMPAIGN_IMAGE, width: 1200, height: 630 }] },
      twitter: { card: "summary_large_image", title: ADMISSIONS_CAMPAIGN_TITLE, description: ADMISSIONS_CAMPAIGN_DESCRIPTION, images: [ADMISSIONS_CAMPAIGN_IMAGE] },
    };
  }
  const content = page.content as { indexable?: boolean };
  const indexable = content.indexable === true;
  return { title: page.seoTitle, description: page.metaDescription, alternates: { canonical: `${site.url}/landing/${page.slug}` }, robots: { index: indexable, follow: indexable } };
}

export default async function ManagedLandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await pageData(slug);
  if (!page) notFound();
  return (
    <LandingPageExperience
      page={{
        id: page.id,
        slug: page.slug,
        name: page.name,
        pageType: page.pageType,
        content: page.content as Record<string, unknown>,
      }}
      variants={page.variants.map((item) => ({
        id: item.id,
        variantKey: item.variantKey,
        name: item.name,
        content: item.content as Record<string, unknown>,
        allocation: item.allocation,
      }))}
      experiment={
        page.experiments[0]
          ? {
              id: page.experiments[0].id,
              variants: page.experiments[0].variants.map((item) => ({
                allocation: item.allocation,
                variant: {
                  id: item.variant.id,
                  variantKey: item.variant.variantKey,
                  name: item.variant.name,
                  content: item.variant.content as Record<string, unknown>,
                  allocation: item.variant.allocation,
                },
              })),
            }
          : null
      }
    />
  );
}
