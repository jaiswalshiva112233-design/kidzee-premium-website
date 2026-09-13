import { notFound, redirect } from "next/navigation";

import LandingPageExperience from "@/components/growth/LandingPageExperience";
import PageShell from "@/components/PageShell";
import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LandingPagePreview({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ versionId?: string }>;
}) {
  if (!(await getAdminSession())) redirect("/admin/login");
  const { id } = await params;
  const { versionId } = (await searchParams) ?? {};

  const page = await prisma.landingPage.findUnique({
    where: { id },
    include: {
      variants: { where: { active: true }, orderBy: { variantKey: "asc" } },
      versions: versionId ? { where: { id: versionId }, take: 1 } : false,
      experiments: {
        where: { status: "RUNNING" },
        include: { variants: { include: { variant: true } } },
        orderBy: { startedAt: "desc" },
        take: 1,
      },
    },
  });
  if (!page) notFound();

  const previewVersion = page.versions?.[0];
  const versionSnapshot = previewVersion?.snapshot as
    | { content?: Record<string, unknown> }
    | undefined;
  const effectiveContent = (versionSnapshot?.content || page.content) as Record<
    string,
    unknown
  >;

  return (
    <>
      <div className="sticky top-0 z-[100] flex items-center justify-between bg-[#2D1736] px-4 py-2 text-xs font-black text-white">
        <span>
          Owner preview{" "}
          {previewVersion
            ? `(Version ${previewVersion.versionNumber}: ${previewVersion.status})`
            : "(Current Saved State)"}{" "}
          / not public unless published
        </span>
        <a
          href="/admin/marketing/landing-pages"
          className="rounded-lg bg-white px-3 py-2 text-[#5B2A86]"
        >
          Return to manager
        </a>
      </div>
      <PageShell>
        <LandingPageExperience
          page={{
            id: page.id,
            slug: page.slug,
            name: page.name,
            pageType: page.pageType,
            content: effectiveContent,
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
      </PageShell>
    </>
  );
}
