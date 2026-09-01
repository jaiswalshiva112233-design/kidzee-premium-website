import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

const PROGRAMMES = [
  "PLAYGROUP",
  "NURSERY",
  "JUNIOR_KG",
  "SENIOR_KG",
  "DAYCARE",
] as const;

const ENQUIRY_SOURCES = [
  "WEBSITE",
  "FORMSPREE",
  "GOOGLE_ADS",
  "META_ADS",
  "WHATSAPP",
  "PHONE_CALL",
  "WALK_IN",
  "REFERRAL",
  "OTHER",
] as const;

const ENQUIRY_STATUSES = [
  "NEW",
  "CONTACTED",
  "NO_ANSWER",
  "VISIT_SCHEDULED",
  "TRIAL_SCHEDULED",
  "INTERESTED",
  "FOLLOW_UP",
  "ADMITTED",
  "NOT_INTERESTED",
  "CLOSED",
] as const;

type ProgrammeValue = (typeof PROGRAMMES)[number];
type EnquirySourceValue = (typeof ENQUIRY_SOURCES)[number];
type EnquiryStatusValue = (typeof ENQUIRY_STATUSES)[number];

type CreateEnquiryBody = {
  parentName?: unknown;
  childName?: unknown;
  childDateOfBirth?: unknown;
  phone?: unknown;
  alternatePhone?: unknown;
  email?: unknown;
  programme?: unknown;
  source?: unknown;
  status?: unknown;
  message?: unknown;
  notes?: unknown;
  preferredVisitDate?: unknown;
  trialDate?: unknown;
  nextFollowUpAt?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function cleanOptionalText(value: unknown) {
  const cleaned = cleanText(value);
  return cleaned.length > 0 ? cleaned : null;
}

function normalisePhone(value: unknown) {
  return cleanText(value).replace(/[^\d+]/g, "");
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseOptionalDate(value: unknown) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const parsedDate = new Date(text);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

function calculateAgeText(dateOfBirth: Date) {
  const today = new Date();

  let years =
    today.getFullYear() - dateOfBirth.getFullYear();

  let months =
    today.getMonth() - dateOfBirth.getMonth();

  if (today.getDate() < dateOfBirth.getDate()) {
    months -= 1;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  if (years < 0) {
    return null;
  }

  const yearText =
    years === 1 ? "1 year" : `${years} years`;

  const monthText =
    months === 1 ? "1 month" : `${months} months`;

  if (years === 0) {
    return monthText;
  }

  if (months === 0) {
    return yearText;
  }

  return `${yearText} ${monthText}`;
}

function isProgramme(
  value: string,
): value is ProgrammeValue {
  return PROGRAMMES.includes(value as ProgrammeValue);
}

function isEnquirySource(
  value: string,
): value is EnquirySourceValue {
  return ENQUIRY_SOURCES.includes(
    value as EnquirySourceValue,
  );
}

function isEnquiryStatus(
  value: string,
): value is EnquiryStatusValue {
  return ENQUIRY_STATUSES.includes(
    value as EnquiryStatusValue,
  );
}

function createEnquiryNumber() {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase();

  return `ENQ-${timestamp}-${randomPart}`;
}

function formatExportDate(
  value: Date | null,
) {
  return value ? value.toISOString() : "";
}

function formatExportLabel(
  value: string | null,
) {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function escapeCsvCell(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  const protectedText = /^[=+\-@]/.test(text)
    ? `'${text}`
    : text;

  return `"${protectedText.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    const url = new URL(request.url);

    const search = cleanText(
      url.searchParams.get("search"),
    );

    const requestedStatus = cleanText(
      url.searchParams.get("status"),
    );

    const requestedSource = cleanText(
      url.searchParams.get("source"),
    );

    const status = isEnquiryStatus(requestedStatus)
      ? requestedStatus
      : undefined;

    const source = isEnquirySource(requestedSource)
      ? requestedSource
      : undefined;

        const exportRequested =
      url.searchParams.get("format") === "csv";

    const enquiries = await prisma.enquiry.findMany({
      where: {
        ...(status ? { status } : {}),
        ...(source ? { source } : {}),
        ...(search
          ? {
              OR: [
                {
                  parentName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  childName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  phone: {
                    contains: search,
                  },
                },
                {
                  alternatePhone: {
                    contains: search,
                  },
                },
                {
                  enquiryNumber: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        followUps: {
          orderBy: {
            dueAt: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      ...(exportRequested
        ? {}
        : {
            take: 250,
          }),
    });

    if (exportRequested) {
      const headers = [
        "Enquiry Database ID",
        "Enquiry Number",
        "Parent Name",
        "Child Name",
        "Child Date of Birth",
        "Child Age",
        "Parent Phone",
        "Alternate Phone",
        "Email",
        "Programme",
        "Source",
        "Enquiry Status",
        "Parent Message",
        "Internal Notes",
        "Preferred Visit Date",
        "Trial Date",
        "Next Follow-up Date",
        "Admitted At",
        "Latest Website Submission At",
        "Website Submission Count",
        "Latest Page URL",
        "Latest Landing Page",
        "Latest Referrer",
        "Latest UTM Source",
        "Latest UTM Medium",
        "Latest UTM Campaign",
        "Latest UTM Content",
        "Latest UTM Term",
        "Latest Google Click ID",
        "Latest Meta Click ID",
        "Enquiry Created At",
        "Enquiry Updated At",
        "Follow-up Count",
        "Follow-up ID",
        "Follow-up Title",
        "Follow-up Notes",
        "Follow-up Due At",
        "Follow-up Status",
        "Follow-up Completed At",
        "Follow-up Created At",
        "Follow-up Updated At",
      ];

      const rows: unknown[][] = enquiries.flatMap(
        (enquiry) => {
          const enquiryColumns: unknown[] = [
            enquiry.id,
            enquiry.enquiryNumber,
            enquiry.parentName,
            enquiry.childName,
            formatExportDate(
              enquiry.childDateOfBirth,
            ),
            enquiry.childAgeText,
            enquiry.phone
              ? `'${enquiry.phone}`
              : "",
            enquiry.alternatePhone
              ? `'${enquiry.alternatePhone}`
              : "",
            enquiry.email,
            formatExportLabel(enquiry.programme),
            formatExportLabel(enquiry.source),
            formatExportLabel(enquiry.status),
            enquiry.message,
            enquiry.notes,
            formatExportDate(
              enquiry.preferredVisitDate,
            ),
            formatExportDate(enquiry.trialDate),
            formatExportDate(
              enquiry.nextFollowUpAt,
            ),
            formatExportDate(enquiry.admittedAt),
            formatExportDate(
              enquiry.lastWebsiteSubmissionAt,
            ),
            enquiry.websiteSubmissionCount,
            enquiry.latestPageUrl,
            enquiry.latestLandingPage,
            enquiry.latestReferrer,
            enquiry.latestUtmSource,
            enquiry.latestUtmMedium,
            enquiry.latestUtmCampaign,
            enquiry.latestUtmContent,
            enquiry.latestUtmTerm,
            enquiry.latestGclid,
            enquiry.latestFbclid,
            formatExportDate(enquiry.createdAt),
            formatExportDate(enquiry.updatedAt),
            enquiry.followUps.length,
          ];

          if (enquiry.followUps.length === 0) {
            return [
              [
                ...enquiryColumns,
                "",
                "",
                "",
                "",
                "",
                "",
                "",
                "",
              ],
            ];
          }

          return enquiry.followUps.map(
            (followUp) => [
              ...enquiryColumns,
              followUp.id,
              followUp.title,
              followUp.notes,
              formatExportDate(followUp.dueAt),
              formatExportLabel(followUp.status),
              formatExportDate(
                followUp.completedAt,
              ),
              formatExportDate(
                followUp.createdAt,
              ),
              formatExportDate(
                followUp.updatedAt,
              ),
            ],
          );
        },
      );

      const csv = [headers, ...rows]
        .map((row) =>
          row.map(escapeCsvCell).join(","),
        )
        .join("\r\n");

      const exportDate = new Date()
        .toISOString()
        .slice(0, 10);

      return new Response(`\uFEFF${csv}`, {
        status: 200,
        headers: {
          "Content-Type":
            "text/csv; charset=utf-8",
          "Content-Disposition":
            `attachment; filename="centreos-enquiries-${exportDate}.csv"`,
          "Cache-Control": "no-store",
        },
      });
    }

    const [
      totalEnquiries,
      newEnquiries,
      visitsScheduled,
      admittedEnquiries,
      pendingFollowUps,
    ] = await Promise.all([
      prisma.enquiry.count(),
      prisma.enquiry.count({
        where: {
          status: "NEW",
        },
      }),
      prisma.enquiry.count({
        where: {
          status: "VISIT_SCHEDULED",
        },
      }),
      prisma.enquiry.count({
        where: {
          status: "ADMITTED",
        },
      }),
      prisma.followUp.count({
        where: {
          status: "PENDING",
          dueAt: {
            lte: new Date(),
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      enquiries,
      summary: {
        totalEnquiries,
        newEnquiries,
        visitsScheduled,
        admittedEnquiries,
        pendingFollowUps,
      },
    });
  } catch (error) {
    console.error("Unable to load enquiries:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load enquiries. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
  try {
    const authenticated =
      await isAdminAuthenticated();

    if (!authenticated) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authorised.",
        },
        {
          status: 401,
        },
      );
    }

    let body: CreateEnquiryBody;

    try {
      body =
        (await request.json()) as CreateEnquiryBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid enquiry request.",
        },
        {
          status: 400,
        },
      );
    }

    const parentName = cleanText(body.parentName);
    const childName = cleanOptionalText(body.childName);
    const phone = normalisePhone(body.phone);

    const alternatePhone =
      normalisePhone(body.alternatePhone) || null;

    const email = cleanOptionalText(body.email);

    const programmeValue = cleanText(body.programme);
    const sourceValue = cleanText(body.source);
    const statusValue = cleanText(body.status);

    if (parentName.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message: "Please enter the parent’s name.",
        },
        {
          status: 400,
        },
      );
    }

    if (phone.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid parent phone number.",
        },
        {
          status: 400,
        },
      );
    }

    if (email && !isValidEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid email address.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      programmeValue &&
      !isProgramme(programmeValue)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid programme.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      sourceValue &&
      !isEnquirySource(sourceValue)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid enquiry source.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      statusValue &&
      !isEnquiryStatus(statusValue)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid enquiry status.",
        },
        {
          status: 400,
        },
      );
    }

            const phoneMatchKey = phone
      .replace(/\D/g, "")
      .slice(-10);

    const existingEnquiry =
      await prisma.enquiry.findFirst({
        where: {
          OR: [
            {
              phone: {
                endsWith: phoneMatchKey,
              },
            },
            {
              alternatePhone: {
                endsWith: phoneMatchKey,
              },
            },
          ],
        },
        select: {
          id: true,
          enquiryNumber: true,
          parentName: true,
          childName: true,
          status: true,
          nextFollowUpAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

    if (existingEnquiry) {
      const needsReopening =
        existingEnquiry.status === "CLOSED" ||
        existingEnquiry.status === "NOT_INTERESTED";

      return NextResponse.json(
        {
          success: false,
          duplicate: true,
          message: needsReopening
            ? `Enquiry ${existingEnquiry.enquiryNumber} already exists. Open it and use Reopen instead of creating another enquiry.`
            : `Enquiry ${existingEnquiry.enquiryNumber} already exists. Its existing record has been opened so you can continue the follow-up there.`,
          enquiry: existingEnquiry,
        },
        {
          status: 409,
        },
      );
    }

    const childDateOfBirth = parseOptionalDate(
      body.childDateOfBirth,
    );

    const preferredVisitDate = parseOptionalDate(
      body.preferredVisitDate,
    );

    const trialDate = parseOptionalDate(
      body.trialDate,
    );

    const nextFollowUpAt = parseOptionalDate(
      body.nextFollowUpAt,
    );

    const childAgeText = childDateOfBirth
      ? calculateAgeText(childDateOfBirth)
      : null;

    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryNumber: createEnquiryNumber(),
        parentName,
        childName,
        childDateOfBirth,
        childAgeText,
        phone,
        alternatePhone,
        email,
        programme: programmeValue
  ? (programmeValue as $Enums.Programme)
  : null,
        source: sourceValue
  ? (sourceValue as $Enums.EnquirySource)
  : ("OTHER" as $Enums.EnquirySource),
        status: statusValue
  ? (statusValue as $Enums.EnquiryStatus)
  : ("NEW" as $Enums.EnquiryStatus),
        message: cleanOptionalText(body.message),
        notes: cleanOptionalText(body.notes),
        preferredVisitDate,
        trialDate,
        nextFollowUpAt,
      },
      include: {
        followUps: true,
      },
    });

    if (nextFollowUpAt) {
      await prisma.followUp.create({
        data: {
          enquiryId: enquiry.id,
          title: `Follow up with ${parentName}`,
          notes:
            cleanOptionalText(body.notes) ??
            "Follow up regarding the preschool enquiry.",
          dueAt: nextFollowUpAt,
          status: "PENDING",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Enquiry added successfully.",
        enquiry,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Unable to create enquiry:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "The enquiry could not be saved. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}
