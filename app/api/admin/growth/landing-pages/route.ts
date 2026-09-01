import type { Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { publicPersistenceError } from "@/lib/admin/public-persistence-error";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

class LandingPageRequestError extends Error {}

const text = (value: unknown, limit: number) =>
  typeof value === "string"
    ? value
        .replace(/[\u0000-\u001F\u007F]/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, limit)
    : "";
const slug = (value: unknown) =>
  text(value, 100)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const PAGE_TYPES = new Set(["ADMISSIONS", "DAYCARE", "RECRUITMENT"]);
const pageType = (value: unknown) => {
  const normalized = text(value, 50).toUpperCase();
  return PAGE_TYPES.has(normalized) ? normalized : "";
};

function landingSlug(value: string | null) {
  if (!value) return "";
  try {
    const path = new URL(value, "https://kidzeedwarka.com").pathname;
    const match = path.match(/^\/landing\/([^/]+)\/?$/);
    return match?.[1]?.toLowerCase() ?? "";
  } catch {
    return "";
  }
}

function content(value: unknown): Prisma.InputJsonObject {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  const bullets = Array.isArray(source.bullets)
    ? source.bullets
        .map((item) => text(item, 160))
        .filter(Boolean)
        .slice(0, 8)
    : [];
  return {
    badge: text(source.badge, 80),
    heading: text(source.heading, 120),
    highlight: text(source.highlight, 80),
    description: text(source.description, 500),
    bullets,
    primaryCta: text(source.primaryCta, 40) || "Book a School Visit",
    secondaryCta: text(source.secondaryCta, 40) || "Call Admissions",
    programme: text(source.programme, 40),
    enquiryType: text(source.enquiryType, 40) || "SCHOOL_VISIT",
    campaignSource: text(source.campaignSource, 80),
    campaignName: text(source.campaignName, 120),
    primaryGoal: text(source.primaryGoal, 80) || "BOOK_VISIT",
    secondaryGoal: text(source.secondaryGoal, 80) || "ENQUIRE_NOW",
    conversionEvents: Array.isArray(source.conversionEvents)
      ? source.conversionEvents.map((item) => text(item, 80)).filter(Boolean).slice(0, 12)
      : ["admission_lead_submitted", "admission_visit_booked"],
    indexable: source.indexable === true,
  };
}

async function pages() {
  const values = await prisma.landingPage.findMany({
    include: {
      variants: { orderBy: { variantKey: "asc" } },
      versions: { orderBy: { versionNumber: "desc" }, take: 20 },
      experiments: {
        include: { variants: { include: { variant: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
  });
  const outcomes = values.length
    ? await prisma.websiteLeadSubmission.findMany({
        where: {
          landingPageId: { in: values.map((item) => item.id) },
          leadType: "admission",
          trafficClass: "GENUINE",
          isInternal: false,
          isTest: false,
          isBot: false,
        },
        select: {
          enquiryId: true,
          enquiryType: true,
          landingPageId: true,
          enquiry: {
            select: { status: true, admission: { select: { status: true } } },
          },
        },
        take: 10_000,
      })
    : [];
  const careerOutcomes = values.some((item) => item.pageType === "RECRUITMENT")
    ? await prisma.careerApplication.findMany({
        where: {
          leadType: "recruitment",
          trafficClass: "GENUINE",
          landingPage: { contains: "/landing/" },
        },
        select: { status: true, landingPage: true },
        take: 10_000,
      })
    : [];
  return values.map((item) => {
    if (item.pageType === "RECRUITMENT") {
      const applications = careerOutcomes.filter(
        (row) => landingSlug(row.landingPage) === item.slug.toLowerCase(),
      );
      const qualified = applications.filter((row) =>
        ["SHORTLISTED", "INTERVIEW", "SELECTED", "JOINED"].includes(row.status),
      ).length;
      const joined = applications.filter((row) => row.status === "JOINED").length;
      return {
        ...item,
        conversionReport: {
          leadType: "recruitment",
          internalTrafficIncluded: false,
          leads: applications.length,
          qualified,
          admissions: joined,
          admissionRate:
            applications.length > 0
              ? Number(((joined / applications.length) * 100).toFixed(1))
              : 0,
        },
      };
    }
    const rows = [
      ...new Map(
        outcomes
          .filter(
            (row) =>
              row.landingPageId === item.id &&
              (item.pageType === "DAYCARE"
                ? row.enquiryType === "DAYCARE"
                : row.enquiryType !== "DAYCARE"),
          )
          .map((row) => [row.enquiryId, row]),
      ).values(),
    ];
    const leads = rows.length;
    const qualified = rows.filter((row) =>
      [
        "INTERESTED",
        "QUALIFIED",
        "VISIT_SCHEDULED",
        "VISIT_BOOKED",
        "VISIT_COMPLETED",
        "ADMITTED",
      ].includes(row.enquiry.status),
    ).length;
    const admissions = rows.filter(
      (row) => row.enquiry.admission?.status === "CONFIRMED",
    ).length;
    return {
      ...item,
      conversionReport: {
        leadType: "admission",
        internalTrafficIncluded: false,
        leads,
        qualified,
        admissions,
        admissionRate:
          leads > 0 ? Number(((admissions / leads) * 100).toFixed(1)) : 0,
      },
    };
  });
}

async function requireOwner() {
  const session = await getAdminSession();
  return session?.role === "OWNER" ? session : null;
}

export async function GET() {
  try {
    const session = await getAdminSession();
    if (!session)
      return NextResponse.json(
        { success: false, message: "You are not authorised." },
        { status: 401 },
      );
    return NextResponse.json({
      success: true,
      canManage: session.role === "OWNER",
      pages: await pages(),
    });
  } catch (error) {
    console.error("Landing-page growth data could not be loaded:", error);
    const persistenceError = publicPersistenceError(
      error,
      "Landing pages could not be loaded. Please refresh or contact the Owner.",
    );
    return NextResponse.json(
      { success: false, message: persistenceError.message },
      { status: persistenceError.status },
    );
  }
}

export async function POST(request: Request) {
  const session = await requireOwner();
  if (!session)
    return NextResponse.json(
      {
        success: false,
        message: "Only the Owner can approve website growth changes.",
      },
      { status: 403 },
    );
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action, 50);
    const pageId = text(body.pageId, 100);

    if (action === "create-page") {
      const pageSlug = slug(body.slug || body.name);
      const requestedPageType = pageType(body.pageType);
      const name = text(body.name, 120);
      const seoTitle = text(body.seoTitle, 70);
      const metaDescription = text(body.metaDescription, 180);
      const pageContent = content(body.content);
      if (
        !pageSlug ||
        !name ||
        !seoTitle ||
        !metaDescription ||
        !pageContent.heading ||
        !requestedPageType
      )
        throw new LandingPageRequestError(
          "Enter the page name, slug, SEO title, description and heading.",
        );
      await prisma.$transaction(async (transaction) => {
        const page = await transaction.landingPage.create({
          data: {
            slug: pageSlug,
            name,
            pageType: requestedPageType,
            seoTitle,
            metaDescription,
            content: pageContent,
            displayOrder: Math.trunc(Number(body.displayOrder) || 0),
            createdById: session.userId,
            updatedById: session.userId,
          },
        });
        await transaction.landingPageVariant.create({
          data: {
            landingPageId: page.id,
            variantKey: "A",
            name: "Original",
            content: pageContent,
            allocation: 100,
          },
        });
        await transaction.landingPageVersion.create({
          data: {
            landingPageId: page.id,
            versionNumber: 1,
            status: "DRAFT",
            snapshot: { seoTitle, metaDescription, content: pageContent },
            reason: text(body.reason, 500) || "Initial landing page",
            expectedImpact:
              text(body.expectedImpact, 500) ||
              `Establish a measurable ${requestedPageType.toLowerCase()} landing page.`,
            filesChanged: [`CentreOS landing page: /landing/${pageSlug}`],
            createdById: session.userId,
          },
        });
        await transaction.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "CREATED",
            entityType: "LandingPage",
            entityId: page.id,
            description: `Draft landing page ${name} was created for preview.`,
          },
        });
      });
    } else if (action === "duplicate-page") {
      const existing = await prisma.landingPage.findUnique({
        where: { id: pageId },
        include: { variants: { orderBy: { variantKey: "asc" } } },
      });
      if (!existing) throw new LandingPageRequestError("Landing page not found.");
      const duplicateSlug = slug(body.slug || `${existing.slug}-copy`);
      const duplicateName = text(body.name, 120) || `${existing.name} Copy`;
      if (!duplicateSlug)
        throw new LandingPageRequestError("Enter a valid URL slug for the duplicate.");
      await prisma.$transaction(async (transaction) => {
        const copy = await transaction.landingPage.create({
          data: {
            slug: duplicateSlug,
            name: duplicateName,
            pageType: existing.pageType,
            seoTitle: existing.seoTitle,
            metaDescription: existing.metaDescription,
            content: existing.content as Prisma.InputJsonValue,
            displayOrder: existing.displayOrder + 1,
            createdById: session.userId,
            updatedById: session.userId,
          },
        });
        const original =
          existing.variants.find((item) => item.variantKey === "A") ??
          existing.variants[0];
        await transaction.landingPageVariant.create({
          data: {
            landingPageId: copy.id,
            variantKey: "A",
            name: "Original",
            content: (original?.content ??
              existing.content) as Prisma.InputJsonValue,
            allocation: 100,
          },
        });
        await transaction.landingPageVersion.create({
          data: {
            landingPageId: copy.id,
            versionNumber: 1,
            status: "DRAFT",
            snapshot: {
              seoTitle: copy.seoTitle,
              metaDescription: copy.metaDescription,
              content: copy.content,
            },
            reason: `Duplicated from ${existing.name}`,
            expectedImpact:
              "Create an independently measurable campaign page without changing the source page.",
            filesChanged: [`CentreOS landing page: /landing/${duplicateSlug}`],
            createdById: session.userId,
          },
        });
        await transaction.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "CREATED",
            entityType: "LandingPage",
            entityId: copy.id,
            description: `${existing.name} was duplicated as ${duplicateName}.`,
            newData: { sourcePageId: existing.id },
          },
        });
      });
    } else if (action === "unpublish-page") {
      const existing = await prisma.landingPage.findUnique({
        where: { id: pageId },
      });
      if (!existing) throw new LandingPageRequestError("Landing page not found.");
      await prisma.$transaction([
        prisma.landingPage.update({
          where: { id: pageId },
          data: { status: "ARCHIVED", updatedById: session.userId },
        }),
        prisma.growthExperiment.updateMany({
          where: { landingPageId: pageId, status: "RUNNING" },
          data: { status: "PAUSED" },
        }),
        prisma.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "UPDATED",
            entityType: "LandingPage",
            entityId: pageId,
            description: `${existing.name} was unpublished. Its version history was preserved.`,
            previousData: { status: existing.status },
            newData: { status: "ARCHIVED" },
          },
        }),
      ]);
    } else if (action === "create-version") {
      const existing = await prisma.landingPage.findUnique({
        where: { id: pageId },
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
      });
      if (!existing) throw new LandingPageRequestError("Landing page not found.");
      const snapshot = {
        seoTitle: text(body.seoTitle, 70) || existing.seoTitle,
        metaDescription:
          text(body.metaDescription, 180) || existing.metaDescription,
        content: content(body.content),
      };
      await prisma.landingPageVersion.create({
        data: {
          landingPageId: pageId,
          versionNumber: (existing.versions[0]?.versionNumber ?? 0) + 1,
          snapshot,
          reason:
            text(body.reason, 500) || "Owner-requested conversion improvement",
          expectedImpact:
            text(body.expectedImpact, 500) ||
            "Improve qualified enquiries and school visits.",
          filesChanged: [`CentreOS landing page: /landing/${existing.slug}`],
          createdById: session.userId,
        },
      });
    } else if (
      action === "approve-version" ||
      action === "apply-version" ||
      action === "rollback-version"
    ) {
      const versionId = text(body.versionId, 100);
      const version = await prisma.landingPageVersion.findUnique({
        where: { id: versionId },
        include: {
          landingPage: {
            include: {
              versions: { orderBy: { versionNumber: "desc" }, take: 50 },
            },
          },
        },
      });
      if (!version || version.landingPageId !== pageId)
        throw new LandingPageRequestError("Landing page version not found.");
      if (action === "approve-version") {
        await prisma.landingPageVersion.update({
          where: { id: version.id },
          data: {
            status: "APPROVED",
            approval: "OWNER_APPROVED",
            approvedById: session.userId,
          },
        });
      } else if (action === "apply-version") {
        if (version.status !== "APPROVED")
          throw new LandingPageRequestError("Approve the preview before applying it.");
        const snapshot = version.snapshot as {
          seoTitle?: unknown;
          metaDescription?: unknown;
          content?: unknown;
        };
        await prisma.$transaction([
          prisma.landingPageVersion.updateMany({
            where: { landingPageId: pageId, status: "APPLIED" },
            data: { status: "ROLLED_BACK", rolledBackAt: new Date() },
          }),
          prisma.landingPage.update({
            where: { id: pageId },
            data: {
              seoTitle: text(snapshot.seoTitle, 70),
              metaDescription: text(snapshot.metaDescription, 180),
              content: content(snapshot.content),
              status: "PUBLISHED",
              publishedAt: new Date(),
              updatedById: session.userId,
            },
          }),
          prisma.landingPageVariant.updateMany({
            where: { landingPageId: pageId, variantKey: "A" },
            data: { content: content(snapshot.content) },
          }),
          prisma.landingPageVersion.update({
            where: { id: version.id },
            data: { status: "APPLIED", appliedAt: new Date() },
          }),
          prisma.activityLog.create({
            data: {
              adminUserId: session.userId,
              action: "UPDATED",
              entityType: "LandingPage",
              entityId: pageId,
              description: `Landing page version ${version.versionNumber} was approved and applied.`,
            },
          }),
        ]);
      } else {
        if (version.status !== "APPLIED")
          throw new LandingPageRequestError(
            "Only the currently applied version can be rolled back.",
          );
        const previous = version.landingPage.versions.find(
          (item) =>
            item.versionNumber < version.versionNumber &&
            item.status !== "DRAFT",
        );
        if (!previous)
          throw new LandingPageRequestError(
            "No earlier applied version is available for rollback.",
          );
        const snapshot = previous.snapshot as {
          seoTitle?: unknown;
          metaDescription?: unknown;
          content?: unknown;
        };
        await prisma.$transaction([
          prisma.landingPage.update({
            where: { id: pageId },
            data: {
              seoTitle: text(snapshot.seoTitle, 70),
              metaDescription: text(snapshot.metaDescription, 180),
              content: content(snapshot.content),
              updatedById: session.userId,
            },
          }),
          prisma.landingPageVariant.updateMany({
            where: { landingPageId: pageId, variantKey: "A" },
            data: { content: content(snapshot.content) },
          }),
          prisma.landingPageVersion.update({
            where: { id: version.id },
            data: { status: "ROLLED_BACK", rolledBackAt: new Date() },
          }),
          prisma.landingPageVersion.update({
            where: { id: previous.id },
            data: {
              status: "APPLIED",
              appliedAt: new Date(),
              rolledBackAt: null,
            },
          }),
          prisma.activityLog.create({
            data: {
              adminUserId: session.userId,
              action: "UPDATED",
              entityType: "LandingPage",
              entityId: pageId,
              description: `Landing page was rolled back from version ${version.versionNumber} to version ${previous.versionNumber}.`,
            },
          }),
        ]);
      }
    } else if (action === "save-variant") {
      const variantKey = text(body.variantKey, 20).toUpperCase();
      const name = text(body.name, 80);
      const allocation = Number(body.allocation);
      if (
        !pageId ||
        !/^[A-Z0-9_-]{1,20}$/.test(variantKey) ||
        !name ||
        !Number.isFinite(allocation) ||
        !Number.isInteger(allocation) ||
        allocation < 0 ||
        allocation > 100
      )
        throw new LandingPageRequestError("Enter a valid variant name, key and allocation.");
      await prisma.landingPageVariant.upsert({
        where: {
          landingPageId_variantKey: { landingPageId: pageId, variantKey },
        },
        create: {
          landingPageId: pageId,
          variantKey,
          name,
          content: content(body.content),
          allocation,
          active: body.active !== false,
        },
        update: {
          name,
          content: content(body.content),
          allocation,
          active: body.active !== false,
        },
      });
    } else if (action === "start-experiment") {
      const variantIds = Array.isArray(body.variantIds)
        ? body.variantIds.map((item) => text(item, 100)).filter(Boolean)
        : [];
      if (!pageId || variantIds.length < 2)
        throw new LandingPageRequestError("Choose at least two variants for an A/B test.");
      const variants = await prisma.landingPageVariant.findMany({
        where: { id: { in: variantIds }, landingPageId: pageId, active: true },
      });
      if (variants.length !== variantIds.length)
        throw new LandingPageRequestError("One selected variant is not available.");
      await prisma.$transaction(async (transaction) => {
        await transaction.growthExperiment.updateMany({
          where: { landingPageId: pageId, status: "RUNNING" },
          data: { status: "COMPLETED", endedAt: new Date() },
        });
        const experiment = await transaction.growthExperiment.create({
          data: {
            landingPageId: pageId,
            name: text(body.name, 120) || "Landing page A/B test",
            status: "RUNNING",
            primaryMetric: text(body.primaryMetric, 40) || "ADMISSION",
            startedAt: new Date(),
            createdById: session.userId,
          },
        });
        const allocation = Math.floor(100 / variants.length);
        await transaction.growthExperimentVariant.createMany({
          data: variants.map((variant, index) => ({
            experimentId: experiment.id,
            variantId: variant.id,
            allocation:
              index === variants.length - 1
                ? 100 - allocation * (variants.length - 1)
                : allocation,
          })),
        });
      });
    } else if (action === "complete-experiment") {
      const experimentId = text(body.experimentId, 100);
      const winnerVariantId = text(body.winnerVariantId, 100) || null;
      await prisma.growthExperiment.update({
        where: { id: experimentId },
        data: { status: "COMPLETED", endedAt: new Date(), winnerVariantId },
      });
    } else {
      return NextResponse.json(
        { success: false, message: "Unknown landing-page action." },
        { status: 400 },
      );
    }
    return NextResponse.json({
      success: true,
      message: "Landing-page growth change saved.",
      pages: await pages(),
      canManage: true,
    });
  } catch (error) {
    if (error instanceof LandingPageRequestError || error instanceof SyntaxError) {
      return NextResponse.json(
        {
          success: false,
          message:
            error instanceof LandingPageRequestError
              ? error.message
              : "The landing-page request could not be read. Refresh and try again.",
        },
        { status: 400 },
      );
    }
    console.error("Landing-page growth change failed:", error);
    const persistenceError = publicPersistenceError(
      error,
      "The landing-page change could not be saved. Please try again or contact the Owner.",
    );
    return NextResponse.json(
      {
        success: false,
        message: persistenceError.message,
      },
      { status: persistenceError.status },
    );
  }
}
