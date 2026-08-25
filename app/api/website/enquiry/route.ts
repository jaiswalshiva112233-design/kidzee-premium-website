import type { $Enums, Prisma } from "@/generated/prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createAdminNotification } from "@/lib/admin/notifications";
import { safeFirestoreMirror } from "@/lib/firebase/firestoreRest";
import { classifyWebsiteRequest } from "@/lib/marketing/internalTraffic";
import {
  enqueueLeadConversions,
  processAdmissionConversionQueue,
} from "@/lib/marketing/admissionConversions";
import {
  consumeDistributedRateLimit,
  requestIp,
} from "@/lib/server/distributedRateLimit";
import { logServerError } from "@/lib/server/safeLogging";
import { getWebsiteContactSettings } from "@/lib/sanity/contactSettings";
import { buildSiteContact } from "@/lib/siteContact";
import { queueWhatsAppAutomation } from "@/lib/whatsapp/automation";

const PROGRAMMES = [
  "PLAYGROUP",
  "NURSERY",
  "JUNIOR_KG",
  "SENIOR_KG",
  "DAYCARE",
] as const;

const ENQUIRY_TYPES = [
  "ADMISSION",
  "SCHOOL_VISIT",
  "TRIAL",
  "DAYCARE",
  "FEES",
  "CALLBACK",
] as const;

const TERMINAL_STATUSES = [
  "CLOSED",
  "NOT_INTERESTED",
] as const;

type ProgrammeValue = (typeof PROGRAMMES)[number];
type EnquiryTypeValue = (typeof ENQUIRY_TYPES)[number];

type WebsiteEnquiryBody = {
  parentName?: unknown;
  phone?: unknown;
  childName?: unknown;
  childAge?: unknown;
  programme?: unknown;
  enquiryType?: unknown;
  preferredVisitDate?: unknown;
  message?: unknown;

  pageUrl?: unknown;
  landingPage?: unknown;
  referrer?: unknown;

  utmSource?: unknown;
  utmMedium?: unknown;
  utmCampaign?: unknown;
  utmContent?: unknown;
  utmTerm?: unknown;

  gclid?: unknown;
  gbraid?: unknown;
  wbraid?: unknown;
  fbclid?: unknown;

  submissionId?: unknown;
  marketingConsent?: unknown;
  fbc?: unknown;
  fbp?: unknown;
  firstTouch?: unknown;
  lastTouch?: unknown;
  landingPageId?: unknown;
  landingVariantId?: unknown;
  growthExperimentId?: unknown;

  // Hidden spam field
  website?: unknown;
};

function cleanText(
  value: unknown,
  maximumLength = 200,
) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(
      /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g,
      "",
    )
    .trim()
    .slice(0, maximumLength);
}

function optionalText(
  value: unknown,
  maximumLength = 200,
) {
  const cleaned = cleanText(value, maximumLength);

  return cleaned || null;
}

function normaliseIndianPhone(value: unknown) {
  const digits = cleanText(value, 30).replace(
    /\D/g,
    "",
  );

  const lastTenDigits = digits.slice(-10);

  if (!/^[6-9]\d{9}$/.test(lastTenDigits)) {
    return null;
  }

  return {
    stored: "+91" + lastTenDigits,
    matchKey: lastTenDigits,
  };
}

function isProgramme(
  value: string,
): value is ProgrammeValue {
  return PROGRAMMES.includes(
    value as ProgrammeValue,
  );
}

function isEnquiryType(
  value: string,
): value is EnquiryTypeValue {
  return ENQUIRY_TYPES.includes(
    value as EnquiryTypeValue,
  );
}

function parsePreferredDate(value: unknown) {
  const dateText = cleanText(value, 10);

  if (!dateText) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    return null;
  }

  const parsed = new Date(
    dateText + "T12:00:00.000Z",
  );

  return Number.isNaN(parsed.getTime())
    ? null
    : parsed;
}

function createEnquiryNumber() {
  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 7)
    .toUpperCase();

  return "ENQ-" + timestamp + "-" + randomPart;
}

function createSubmissionId(value: unknown) {
  const supplied = cleanText(value, 100);

  if (/^[A-Za-z0-9_-]{12,100}$/.test(supplied)) {
    return supplied;
  }

  return crypto.randomUUID();
}

function detectTrafficChannel(body: WebsiteEnquiryBody) {
  const utmSource = cleanText(
    body.utmSource,
    100,
  ).toLowerCase();

  const utmMedium = cleanText(
    body.utmMedium,
    100,
  ).toLowerCase();

  const hasGoogleClickId = Boolean(
    cleanText(body.gclid, 200) ||
      cleanText(body.gbraid, 200) ||
      cleanText(body.wbraid, 200),
  );

  const hasMetaClickId = Boolean(
    cleanText(body.fbclid, 200),
  );

  if (
    hasGoogleClickId ||
    (utmSource.includes("google") &&
      /cpc|ppc|paid|display|remarketing/.test(utmMedium))
  ) {
    return "GOOGLE_ADS";
  }

  if (
    hasMetaClickId ||
    ((utmSource.includes("facebook") ||
      utmSource.includes("instagram") ||
      utmSource.includes("meta")) &&
      /cpc|ppc|paid|social|display|remarketing/.test(utmMedium))
  ) {
    return "META_ADS";
  }

  if (utmMedium === "organic") {
    return "ORGANIC_SEARCH";
  }

  const referrer = cleanText(body.referrer, 500);

  try {
    const hostname = new URL(referrer).hostname.toLowerCase();

    if (/google\.|bing\.|yahoo\.|duckduckgo\./.test(hostname)) {
      return "ORGANIC_SEARCH";
    }

    if (hostname && !hostname.includes("kidzeedwarka.com")) {
      return "REFERRAL";
    }
  } catch {
    // Missing and malformed referrers are treated as direct visits.
  }

  return utmSource ? "CAMPAIGN_OTHER" : "DIRECT";
}

function detectSource(trafficChannel: string) {
  if (trafficChannel === "GOOGLE_ADS") {
    return "GOOGLE_ADS" as $Enums.EnquirySource;
  }

  if (trafficChannel === "META_ADS") {
    return "META_ADS" as $Enums.EnquirySource;
  }

  return "WEBSITE" as $Enums.EnquirySource;
}

function collectAttributionFields(
  body: WebsiteEnquiryBody,
) {
  return {
    pageUrl: optionalText(body.pageUrl, 500),
    landingPage: optionalText(
      body.landingPage,
      500,
    ),
    referrer: optionalText(body.referrer, 500),
    utmSource: optionalText(body.utmSource, 100),
    utmMedium: optionalText(body.utmMedium, 100),
    utmCampaign: optionalText(
      body.utmCampaign,
      150,
    ),
    utmContent: optionalText(body.utmContent, 150),
    utmTerm: optionalText(body.utmTerm, 150),
    gclid: optionalText(body.gclid, 200),
    gbraid: optionalText(body.gbraid, 200),
    wbraid: optionalText(body.wbraid, 200),
    fbclid: optionalText(body.fbclid, 200),
  };
}

function collectGrowthContext(body: WebsiteEnquiryBody) {
  const safeId = (value: unknown) => {
    const result = cleanText(value, 100);
    return /^[A-Za-z0-9_-]{1,100}$/.test(result) ? result : null;
  };
  return {
    landingPageId: safeId(body.landingPageId),
    landingVariantId: safeId(body.landingVariantId),
    growthExperimentId: safeId(body.growthExperimentId),
  };
}

function collectAttributionTouch(value: unknown, marketingConsent: boolean) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  const capturedAtText = cleanText(source.capturedAt, 40);
  const capturedAt = new Date(capturedAtText);
  const touch: Prisma.InputJsonObject = {
    pageUrl: cleanText(source.pageUrl, 500),
    landingPage: cleanText(source.landingPage, 500),
    referrer: cleanText(source.referrer, 500),
    utmSource: cleanText(source.utmSource, 100),
    utmMedium: cleanText(source.utmMedium, 100),
    utmCampaign: cleanText(source.utmCampaign, 150),
    utmContent: cleanText(source.utmContent, 150),
    utmTerm: cleanText(source.utmTerm, 150),
    adGroup: cleanText(source.adGroup, 150),
    adSet: cleanText(source.adSet, 150),
    adId: cleanText(source.adId, 150),
    device: cleanText(source.device, 80),
    gclid: cleanText(source.gclid, 200),
    gbraid: cleanText(source.gbraid, 200),
    wbraid: cleanText(source.wbraid, 200),
    fbclid: cleanText(source.fbclid, 200),
    fbc: marketingConsent ? cleanText(source.fbc, 250) : "",
    fbp: marketingConsent ? cleanText(source.fbp, 250) : "",
    campaignTrackingKey: cleanText(source.campaignTrackingKey, 100),
    capturedAt: Number.isNaN(capturedAt.getTime())
      ? new Date().toISOString()
      : capturedAt.toISOString(),
  };
  return touch;
}

function formatEnquiryType(
  value: EnquiryTypeValue,
) {
  const labels: Record<
    EnquiryTypeValue,
    string
  > = {
    ADMISSION: "Admission enquiry",
    SCHOOL_VISIT: "School visit request",
    TRIAL: "Three-day trial enquiry",
    DAYCARE: "Daycare enquiry",
    FEES: "Fees and availability enquiry",
    CALLBACK: "Callback request",
  };

  return labels[value];
}

function attributionNote(
  body: WebsiteEnquiryBody,
  enquiryType: EnquiryTypeValue,
) {
  return [
    "Website submission received " +
      new Date().toISOString(),

    "Enquiry type: " +
      formatEnquiryType(enquiryType),

    "Page: " +
      (cleanText(body.pageUrl, 500) ||
        "Not supplied"),

    "Landing page: " +
      (cleanText(body.landingPage, 500) ||
        "Not supplied"),

    "Referrer: " +
      (cleanText(body.referrer, 500) ||
        "Direct or unavailable"),

    "UTM source: " +
      (cleanText(body.utmSource, 100) ||
        "Not supplied"),

    "UTM medium: " +
      (cleanText(body.utmMedium, 100) ||
        "Not supplied"),

    "UTM campaign: " +
      (cleanText(body.utmCampaign, 150) ||
        "Not supplied"),

    "UTM content: " +
      (cleanText(body.utmContent, 150) ||
        "Not supplied"),

    "UTM term: " +
      (cleanText(body.utmTerm, 150) ||
        "Not supplied"),

    "Google click ID: " +
      (cleanText(body.gclid, 200) ||
        "Not supplied"),

    "Google app click ID: " +
      (cleanText(body.gbraid, 200) ||
        cleanText(body.wbraid, 200) ||
        "Not supplied"),

    "Meta click ID: " +
      (cleanText(body.fbclid, 200) ||
        "Not supplied"),
  ].join("\n");
}

function appendText(
  existing: string | null,
  addition: string,
  maximumLength = 12000,
) {
  const combined = existing
    ? existing + "\n\n---\n\n" + addition
    : addition;

  return combined.slice(-maximumLength);
}

function noStoreJson(
  body: Record<string, unknown>,
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return noStoreJson(
        { success: false, message: "Content-Type must be application/json." },
        415,
      );
    }

    const requestUrl = new URL(request.url);
    const origin = request.headers.get("origin");

    if (origin && origin !== requestUrl.origin) {
      return noStoreJson(
        {
          success: false,
          message:
            "This enquiry could not be submitted.",
        },
        403,
      );
    }

    const contentLength = Number(
      request.headers.get("content-length") ?? "0",
    );

    if (contentLength > 25000) {
      return noStoreJson(
        {
          success: false,
          message: "The enquiry is too large.",
        },
        413,
      );
    }

    let body: WebsiteEnquiryBody;

    try {
      body =
        (await request.json()) as WebsiteEnquiryBody;
    } catch {
      return noStoreJson(
        {
          success: false,
          message:
            "Please check the form and try again.",
        },
        400,
      );
    }

    // Bots often fill this hidden field.
    if (cleanText(body.website, 200)) {
      return noStoreJson({
        success: true,
        message: "Thank you.",
      });
    }

    const parentName = cleanText(
      body.parentName,
      120,
    );

    const phone = normaliseIndianPhone(body.phone);

    const childName = optionalText(
      body.childName,
      120,
    );

    const childAge = optionalText(
      body.childAge,
      80,
    );

    const programmeValue = cleanText(
      body.programme,
      30,
    );

    const enquiryTypeValue = cleanText(
      body.enquiryType,
      30,
    );

    const message = optionalText(
      body.message,
      1500,
    );

    const preferredVisitDate =
      parsePreferredDate(
        body.preferredVisitDate,
      );

    if (parentName.length < 2) {
      return noStoreJson(
        {
          success: false,
          field: "parentName",
          message:
            "Please enter the parent's name.",
        },
        400,
      );
    }

    if (!phone) {
      return noStoreJson(
        {
          success: false,
          field: "phone",
          message:
            "Please enter a valid 10-digit Indian mobile number.",
        },
        400,
      );
    }

    if (
      programmeValue &&
      !isProgramme(programmeValue)
    ) {
      return noStoreJson(
        {
          success: false,
          field: "programme",
          message:
            "Please select a valid programme.",
        },
        400,
      );
    }

    if (!isEnquiryType(enquiryTypeValue)) {
      return noStoreJson(
        {
          success: false,
          field: "enquiryType",
          message:
            "Please select how we can help.",
        },
        400,
      );
    }

    const [phoneLimit, ipLimit] = await Promise.all([
      consumeDistributedRateLimit({
        scope: "website_enquiry_phone",
        identifier: phone.matchKey,
        limit: 5,
        windowMs: 30 * 60 * 1000,
      }),
      consumeDistributedRateLimit({
        scope: "website_enquiry_ip",
        identifier: requestIp(request),
        limit: 20,
        windowMs: 30 * 60 * 1000,
      }),
    ]);

    if (!phoneLimit.allowed || !ipLimit.allowed) {
      return noStoreJson(
        {
          success: false,
          message:
            "We already received your details. Please wait for our team to contact you.",
        },
        429,
      );
    }

    const submissionId = createSubmissionId(
      body.submissionId,
    );

    const trafficChannel = detectTrafficChannel(body);
    const requestClassification = classifyWebsiteRequest(request);
    const source = detectSource(trafficChannel);
    const attribution = collectAttributionFields(body);
    const receivedAt = new Date();
    const marketingConsent = body.marketingConsent === true;
    const fbc = marketingConsent
      ? optionalText(body.fbc, 250)
      : null;
    const fbp = marketingConsent
      ? optionalText(body.fbp, 250)
      : null;
    const firstTouch = collectAttributionTouch(body.firstTouch, marketingConsent);
    const lastTouch = collectAttributionTouch(body.lastTouch, marketingConsent);

    const note = attributionNote(
      body,
      enquiryTypeValue,
    );

    const parentMessage = [
      formatEnquiryType(enquiryTypeValue),

      childAge
        ? "Child's age: " + childAge
        : "",

      message ?? "",
    ]
      .filter(Boolean)
      .join("\n");

    const result = await prisma.$transaction(
      async (transaction) => {
        const repeatedSubmission =
          await transaction.websiteLeadSubmission.findUnique({
            where: {
              submissionId,
            },
            select: {
              enquiryId: true,
              source: true,
              enquiry: {
                select: {
                  enquiryNumber: true,
                },
              },
            },
          });

        if (repeatedSubmission) {
          return {
            enquiryId: repeatedSubmission.enquiryId,
            enquiryNumber:
              repeatedSubmission.enquiry.enquiryNumber,
            created: false,
            source: repeatedSubmission.source,
          };
        }

        const existingEnquiry =
          await transaction.enquiry.findFirst({
            where: {
              OR: [
                {
                  phone: {
                    endsWith: phone.matchKey,
                  },
                },
                {
                  alternatePhone: {
                    endsWith: phone.matchKey,
                  },
                },
              ],
            },
            select: {
              id: true,
              enquiryNumber: true,
              childName: true,
              childAgeText: true,
              programme: true,
              preferredVisitDate: true,
              message: true,
              notes: true,
              status: true,
              firstTouchAttribution: true,
            },
            orderBy: {
              createdAt: "desc",
            },
          });

        if (existingEnquiry) {
          const shouldReopen =
            TERMINAL_STATUSES.includes(
              existingEnquiry.status as
                (typeof TERMINAL_STATUSES)[number],
            );

          await transaction.enquiry.update({
            where: {
              id: existingEnquiry.id,
            },
            data: {
              parentName,

              childName:
                childName ??
                existingEnquiry.childName,

              childAgeText:
                childAge ??
                existingEnquiry.childAgeText,

              programme: programmeValue
                ? (programmeValue as $Enums.Programme)
                : existingEnquiry.programme,

              preferredVisitDate:
                preferredVisitDate ??
                existingEnquiry.preferredVisitDate,

              message: appendText(
                existingEnquiry.message,
                parentMessage,
                6000,
              ),

              notes: appendText(
                existingEnquiry.notes,
                note,
              ),

              status: shouldReopen
                ? ("NEW" as $Enums.EnquiryStatus)
                : existingEnquiry.status,
              stageChangedAt: shouldReopen ? receivedAt : undefined,
              closedAt: shouldReopen ? null : undefined,
              lostReason: shouldReopen ? null : undefined,

              source,
              formSubmissionId: submissionId,
              lastWebsiteSubmissionAt: receivedAt,
              websiteSubmissionCount: {
                increment: 1,
              },
              latestPageUrl: attribution.pageUrl,
              latestLandingPage:
                attribution.landingPage,
              latestReferrer: attribution.referrer,
              latestUtmSource: attribution.utmSource,
              latestUtmMedium: attribution.utmMedium,
              latestUtmCampaign:
                attribution.utmCampaign,
              latestUtmContent:
                attribution.utmContent,
              latestUtmTerm: attribution.utmTerm,
              latestGclid: attribution.gclid,
              latestGbraid: attribution.gbraid,
              latestWbraid: attribution.wbraid,
              latestFbclid: attribution.fbclid,
              latestTrafficChannel: trafficChannel,
              latestTrafficClass: requestClassification.trafficClass,
              firstTouchAttribution:
                existingEnquiry.firstTouchAttribution ?? firstTouch ?? undefined,
              lastTouchAttribution: lastTouch ?? undefined,
            },
          });

          await transaction.websiteLeadSubmission.create({
            data: {
              submissionId,
              enquiryId: existingEnquiry.id,
              source,
              enquiryType: enquiryTypeValue,
              leadType: "admission",
              ...attribution,
              trafficChannel,
              trafficClass: requestClassification.trafficClass,
              isInternal: requestClassification.isInternal,
              isTest: requestClassification.isTest,
              isBot: requestClassification.isBot,
              marketingConsent,
              fbc,
              fbp,
              firstTouch: firstTouch ?? undefined,
              lastTouch: lastTouch ?? undefined,
              ...collectGrowthContext(body),
              receivedAt,
            },
          });

          const pendingFollowUp =
            await transaction.followUp.findFirst({
              where: {
                enquiryId: existingEnquiry.id,
                status: "PENDING",
              },
              select: {
                id: true,
              },
            });

          if (!pendingFollowUp) {
            await transaction.followUp.create({
              data: {
                enquiryId: existingEnquiry.id,
                title:
                  "Respond to new website enquiry",

                notes:
                  formatEnquiryType(
                    enquiryTypeValue,
                  ) +
                  " submitted through the website.",

                dueAt: receivedAt,
                status: "PENDING",
              },
            });
          } else {
            await transaction.followUp.update({
              where: {
                id: pendingFollowUp.id,
              },
              data: {
                title:
                  "Respond to new website enquiry",
                notes:
                  formatEnquiryType(
                    enquiryTypeValue,
                  ) +
                  " submitted again through the website.",
                dueAt: receivedAt,
              },
            });
          }

          await transaction.enquiry.update({
            where: {
              id: existingEnquiry.id,
            },
            data: {
              nextFollowUpAt: receivedAt,
            },
          });

          await transaction.leadActivity.create({
            data: {
              enquiryId: existingEnquiry.id,
              type: shouldReopen ? "REOPENED" : "NOTE_ADDED",
              fromStatus: shouldReopen ? existingEnquiry.status : null,
              toStatus: shouldReopen ? "NEW" : null,
              title: shouldReopen
                ? "Lead reopened by a new website enquiry"
                : "Additional website enquiry received",
              notes: formatEnquiryType(enquiryTypeValue),
              occurredAt: receivedAt,
              metadata: { submissionId, trafficChannel },
            },
          });

          return {
            enquiryId: existingEnquiry.id,
            enquiryNumber:
              existingEnquiry.enquiryNumber,
            created: false,
            source,
          };
        }

        const followUpDueAt = receivedAt;

        const enquiry =
          await transaction.enquiry.create({
            data: {
              enquiryNumber:
                createEnquiryNumber(),

              parentName,
              childName,
              childAgeText: childAge,
              phone: phone.stored,

              programme: programmeValue
                ? (programmeValue as $Enums.Programme)
                : null,

              source,

              status:
                "NEW" as $Enums.EnquiryStatus,

              message: parentMessage || null,
              notes: note,
              preferredVisitDate,
              nextFollowUpAt: followUpDueAt,
              formSubmissionId: submissionId,
              lastWebsiteSubmissionAt: receivedAt,
              websiteSubmissionCount: 1,
              latestPageUrl: attribution.pageUrl,
              latestLandingPage:
                attribution.landingPage,
              latestReferrer: attribution.referrer,
              latestUtmSource: attribution.utmSource,
              latestUtmMedium: attribution.utmMedium,
              latestUtmCampaign:
                attribution.utmCampaign,
              latestUtmContent:
                attribution.utmContent,
              latestUtmTerm: attribution.utmTerm,
              latestGclid: attribution.gclid,
              latestGbraid: attribution.gbraid,
              latestWbraid: attribution.wbraid,
              latestFbclid: attribution.fbclid,
              latestTrafficChannel: trafficChannel,
              latestTrafficClass: requestClassification.trafficClass,
              firstTouchAttribution: firstTouch ?? undefined,
              lastTouchAttribution: lastTouch ?? undefined,
            },
            select: {
              id: true,
              enquiryNumber: true,
            },
          });

        await transaction.websiteLeadSubmission.create({
          data: {
            submissionId,
            enquiryId: enquiry.id,
            source,
            enquiryType: enquiryTypeValue,
            leadType: "admission",
            ...attribution,
            trafficChannel,
            trafficClass: requestClassification.trafficClass,
            isInternal: requestClassification.isInternal,
            isTest: requestClassification.isTest,
            isBot: requestClassification.isBot,
            marketingConsent,
            fbc,
            fbp,
            firstTouch: firstTouch ?? undefined,
            lastTouch: lastTouch ?? undefined,
            ...collectGrowthContext(body),
            receivedAt,
          },
        });

        await transaction.followUp.create({
          data: {
            enquiryId: enquiry.id,

            title:
              "Respond to new website enquiry",

            notes:
              formatEnquiryType(
                enquiryTypeValue,
              ) +
              " submitted through the website.",

            dueAt: followUpDueAt,
            status: "PENDING",
          },
        });

        await transaction.leadActivity.create({
          data: {
            enquiryId: enquiry.id,
            type: "CREATED",
            toStatus: "NEW",
            title: "Website lead received",
            notes: formatEnquiryType(enquiryTypeValue),
            occurredAt: receivedAt,
            metadata: { submissionId, trafficChannel, source },
          },
        });

        return {
          enquiryId: enquiry.id,
          enquiryNumber: enquiry.enquiryNumber,
          created: true,
          source,
        };
      },
    );

    await safeFirestoreMirror("leadSubmissions", submissionId, {
      submissionId,
      enquiryNumber: result.enquiryNumber,
      parentName,
      phone: phone.stored,
      childName,
      childAge,
      programme: programmeValue || null,
      enquiryType: enquiryTypeValue,
      leadType: "admission",
      trafficChannel,
      trafficClass: requestClassification.trafficClass,
      attribution,
      firstTouch,
      lastTouch,
      status: "SAVED",
      receivedAt,
    });

    await safeFirestoreMirror("leads", result.enquiryNumber, {
      enquiryNumber: result.enquiryNumber,
      submissionId,
      parentName,
      phone: phone.stored,
      childName,
      childAge,
      programme: programmeValue || null,
      enquiryType: enquiryTypeValue,
      source: result.source,
      trafficChannel,
      trafficClass: requestClassification.trafficClass,
      attribution,
      firstTouch,
      lastTouch,
      latestSubmissionAt: receivedAt,
      status: "NEW",
    });

    await prisma.activityLog.create({
      data: {
        action: "CREATED",
        entityType: "MARKETING_EVENT",
        entityId: submissionId,
        description: "Admission lead submitted from the public website.",
        newData: {
          eventName: "admission_lead_submitted",
          eventScope: "ADMISSION",
          leadType: "admission",
          enquiryId: result.enquiryId,
          enquiryNumber: result.enquiryNumber,
          submissionId,
          trafficClass: requestClassification.trafficClass,
          isInternal: requestClassification.isInternal,
          isTest: requestClassification.isTest,
          landingPage: attribution.landingPage,
          utmSource: attribution.utmSource,
          utmMedium: attribution.utmMedium,
          utmCampaign: attribution.utmCampaign,
        },
      },
    });

    if (result.created && requestClassification.trafficClass === "GENUINE") {
      await createAdminNotification({
        category: "ADMISSION",
        type: "NEW_ADMISSION_LEAD",
        priority: "HIGH",
        title: "New admission lead received",
        body: "A new website admission enquiry is ready for follow-up.",
        href: `/admin/enquiries/${result.enquiryId}`,
        entityType: "ENQUIRY",
        entityId: result.enquiryId,
        eventKey: submissionId,
        important: true,
      }).catch((error) => logServerError("Admission notification could not be queued.", error));
    }

    if (requestClassification.trafficClass === "GENUINE") {
      const centreContact = buildSiteContact(await getWebsiteContactSettings());
      await queueWhatsAppAutomation({
        type: "ENQUIRY_NOTIFICATION",
        deduplicationKey: `ENQUIRY_NOTIFICATION:${submissionId}`,
        recipientPhone: centreContact.phone,
        enquiryId: result.enquiryId,
        messageText: `New website enquiry ${result.enquiryNumber} from ${parentName}.`,
        payload: { parameters: [result.enquiryNumber, parentName, childName || "Child", phone.stored] },
      });
    }

    if (marketingConsent && requestClassification.trafficClass === "GENUINE") {
      await enqueueLeadConversions(result.enquiryId);
      await processAdmissionConversionQueue({ enquiryId: result.enquiryId, limit: 2 });
    }

    return noStoreJson(
      {
        success: true,
        created: result.created,
        source: result.source,
        enquiryNumber: result.enquiryNumber,
        submissionId,

        message: result.created
          ? "Thank you. Your enquiry has been received."
          : "Thank you. Your existing enquiry has been updated.",
      },
      result.created ? 201 : 200,
    );
  } catch (error) {
    logServerError("Unable to save website enquiry.", error);

    return noStoreJson(
      {
        success: false,
        message:
          "Your enquiry could not be saved right now. Please call or WhatsApp the centre.",
      },
      500,
    );
  }
}
