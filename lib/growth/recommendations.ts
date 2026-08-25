import "server-only";

import { createHash } from "node:crypto";

import type { GrowthFinding } from "@/lib/growth/analysis";
import { prisma } from "@/lib/prisma";

function category(finding: GrowthFinding) {
  const value = `${finding.finding} ${finding.action}`.toLowerCase();
  if (value.includes("google") || value.includes("keyword")) return "GOOGLE_ADS";
  if (value.includes("meta") || value.includes("audience") || value.includes("creative")) return "META_ADS";
  if (value.includes("search console") || value.includes("seo")) return "SEO";
  if (value.includes("blog")) return "BLOG";
  if (value.includes("gallery")) return "GALLERY";
  if (value.includes("review")) return "PARENT_REVIEWS";
  if (value.includes("vital") || value.includes("performance") || value.includes("slow")) return "PERFORMANCE";
  if (value.includes("form") || value.includes("cta") || value.includes("landing")) return "CONVERSION";
  return "GROWTH_FUNNEL";
}

function fingerprint(finding: GrowthFinding) {
  return createHash("sha256")
    .update(`${category(finding)}|${finding.finding}|${finding.action}`)
    .digest("hex");
}

export async function persistGrowthFindings(
  findings: GrowthFinding[],
  actorId: string | null,
) {
  const records = [];
  for (const finding of findings) {
    const modules =
      finding.canAiApply === "Developer review required"
        ? ["Website code", "Tracking or performance infrastructure"]
        : finding.canAiApply === "Preview required"
          ? ["Website Manager", "Public website preview"]
          : ["CentreOS operations"];
    records.push(
      await prisma.growthRecommendation.upsert({
        where: { fingerprint: fingerprint(finding) },
        create: {
          fingerprint: fingerprint(finding),
          category: category(finding),
          title: finding.finding,
          reason: `${finding.evidence} ${finding.whyItMatters}`,
          expectedImpact: finding.expectedGoal,
          risk: finding.risk,
          preview: { proposedAction: finding.action, confidence: finding.confidence },
          affectedModules: modules,
          evidence: { dataSufficiency: finding.dataSufficiency, type: finding.type, evidence: finding.evidence },
          rollbackPlan: "Restore the previous approved setting or content version from CentreOS history, then verify the original conversion baseline.",
          createdById: actorId,
        },
        update: {
          reason: `${finding.evidence} ${finding.whyItMatters}`,
          expectedImpact: finding.expectedGoal,
          risk: finding.risk,
          preview: { proposedAction: finding.action, confidence: finding.confidence },
          affectedModules: modules,
          evidence: { dataSufficiency: finding.dataSufficiency, type: finding.type, evidence: finding.evidence },
        },
      }),
    );
  }
  return records;
}
