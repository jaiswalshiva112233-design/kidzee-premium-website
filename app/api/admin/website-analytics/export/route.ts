import type { Prisma } from "@/generated/prisma/client";
import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

import {
  hasAdminPermission,
  isAdminAuthenticated,
} from "@/lib/admin/auth";
import { formatCentreAddress } from "@/lib/centreAddress";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";
import { site } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type AnalyticsEventData = {
  eventType?: string;
  visitorId?: string;
  sessionId?: string;
  pagePath?: string;
  targetText?: string;
  referrer?: string;
  utmSource?: string;
  utmCampaign?: string;
  hasGoogleClickId?: boolean;
  hasMetaClickId?: boolean;
  deviceType?: string;
  eventScope?: string;
  leadType?: string;
  trafficClass?: string;
  isInternal?: boolean;
  isTest?: boolean;
  isBot?: boolean;
};

type PagePerformance = {
  pagePath: string;
  views: number;
  visitors: Set<string>;
  enquiryClicks: number;
  callClicks: number;
  whatsappClicks: number;
};

type ReportRange = "7d" | "30d" | "90d" | "all";

type ReportPeriod = {
  range: ReportRange;
  label: string;
  fromDate?: Date;
};

type CentreProfile = {
  schoolName: string;
  centreName: string;
  address: string;
  phone: string;
  email: string;
};

type SummaryItem = {
  label: string;
  value: string;
  note: string;
  colour: string;
};

type TableColumn = {
  label: string;
  weight: number;
  align?: "left" | "center" | "right";
};

const websiteEnquirySources = [
  "WEBSITE",
  "FORMSPREE",
  "GOOGLE_ADS",
  "META_ADS",
] as const;

const enquirySourceLabels: Record<string, string> = {
  WEBSITE: "Website",
  FORMSPREE: "Older website form",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
};

const eventLabels: Record<string, string> = {
  CTA_CLICK: "Enquiry button",
  PHONE_CLICK: "Call click",
  WHATSAPP_CLICK: "WhatsApp click",
  MAP_CLICK: "Directions click",
  FORM_STARTED: "Form started",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function readEventData(value: Prisma.JsonValue | null) {
  if (!isRecord(value)) {
    return {} as AnalyticsEventData;
  }

  return value as AnalyticsEventData;
}

function getJsonText(value: Record<string, unknown>, key: string) {
  const item = value[key];

  return typeof item === "string" ? item.trim() : "";
}

function safePdfText(value: unknown) {
  return String(value ?? "")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[^\x20-\x7E]/g, "?");
}

function truncateText(value: unknown, maximumLength = 110) {
  const text = safePdfText(value);

  return text.length > maximumLength
    ? `${text.slice(0, maximumLength - 3)}...`
    : text;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

function formatPercentage(value: number) {
  return `${value.toFixed(value >= 10 ? 0 : 1)}%`;
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function startOfLocalDay(date: Date) {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);

  return localDate;
}

function getReportPeriod(searchParams: URLSearchParams): ReportPeriod {
  const rangeValue = searchParams.get("range");

  const range: ReportRange = ["7d", "30d", "90d", "all"].includes(
    rangeValue ?? "",
  )
    ? (rangeValue as ReportRange)
    : "30d";

  if (range === "all") {
    return {
      range,
      label: "All recorded website activity",
    };
  }

  const days = range === "7d" ? 7 : range === "90d" ? 90 : 30;
  const fromDate = startOfLocalDay(
    new Date(Date.now() - (days - 1) * 24 * 60 * 60 * 1_000),
  );

  return {
    range,
    label: `${formatDate(fromDate)} to ${formatDate(new Date())}`,
    fromDate,
  };
}

async function getCentreProfile(): Promise<CentreProfile> {
  const setting = await prisma.centreSetting.findUnique({
    where: {
      key: "SCHOOL_PROFILE",
    },
  });

  const value = isRecord(setting?.value) ? setting.value : {};

  const address = formatCentreAddress(value);

  return {
    schoolName:
      getJsonText(value, "schoolName") ||
      "Kidzee Preschool & Daycare",
    centreName:
      getJsonText(value, "centreName") ||
      "Kidzee Sector 12, Dwarka",
    address:
      address ||
      site.address,
    phone: getJsonText(value, "phone") || "9667038673",
    email:
      getJsonText(value, "email") ||
      "kidzeepreschoolsector12@gmail.com",
  };
}

function getTrafficSource(data: AnalyticsEventData) {
  if (data.utmSource?.trim()) {
    return data.utmSource.trim();
  }

  if (data.hasGoogleClickId) {
    return "Google Ads";
  }

  if (data.hasMetaClickId) {
    return "Meta Ads";
  }

  if (data.referrer?.trim()) {
    try {
      return new URL(data.referrer).hostname.replace(/^www\./, "");
    } catch {
      return "Referral";
    }
  }

  return "Direct / unknown";
}

function friendlyPagePath(pagePath: string) {
  const path = pagePath.split("?")[0] || "/";

  if (path === "/") {
    return "Homepage";
  }

  return path
    .split("/")
    .filter(Boolean)
    .map((part) =>
      part
        .replace(/-/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
    )
    .join(" / ");
}

function drawPageHeader(
  document: PDFKit.PDFDocument,
  profile: CentreProfile,
  periodLabel: string,
) {
  const pageWidth = document.page.width;

  document.rect(0, 0, pageWidth, 104).fill("#2D1736");

  document
    .fillColor("#F6C84B")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(safePdfText(profile.schoolName.toUpperCase()), 36, 22, {
      width: pageWidth * 0.52,
    });

  document
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(19)
    .text("Website Analytics Report", 36, 40, {
      width: pageWidth * 0.55,
    });

  document
    .fillColor("#D8CDDC")
    .font("Helvetica")
    .fontSize(8)
    .text(safePdfText(profile.centreName), 36, 68, {
      width: pageWidth * 0.55,
    });

  document
    .fillColor("#F6C84B")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("REPORTING PERIOD", pageWidth - 300, 27, {
      width: 264,
      align: "right",
    });

  document
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(11)
    .text(safePdfText(periodLabel), pageWidth - 300, 43, {
      width: 264,
      align: "right",
    });

  document
    .fillColor("#D8CDDC")
    .font("Helvetica")
    .fontSize(7.5)
    .text(
      safePdfText(`Generated ${formatDateTime(new Date())}`),
      pageWidth - 300,
      67,
      {
        width: 264,
        align: "right",
      },
    );

  return 124;
}

function addReportPage(
  document: PDFKit.PDFDocument,
  profile: CentreProfile,
  periodLabel: string,
) {
  document.addPage();

  return drawPageHeader(document, profile, periodLabel);
}

function pageBottom(document: PDFKit.PDFDocument) {
  return document.page.height - 48;
}

function ensureSpace(
  document: PDFKit.PDFDocument,
  profile: CentreProfile,
  periodLabel: string,
  y: number,
  requiredHeight: number,
) {
  if (y + requiredHeight <= pageBottom(document)) {
    return y;
  }

  return addReportPage(document, profile, periodLabel);
}

function drawSummaryCards(
  document: PDFKit.PDFDocument,
  profile: CentreProfile,
  periodLabel: string,
  items: SummaryItem[],
  startingY: number,
) {
  const gap = 10;
  const cardsPerRow = 3;
  const availableWidth =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right;
  const cardWidth =
    (availableWidth - gap * (cardsPerRow - 1)) / cardsPerRow;
  const cardHeight = 66;

  let y = startingY;

  items.forEach((item, index) => {
    if (index > 0 && index % cardsPerRow === 0) {
      y += cardHeight + gap;
    }

    if (index % cardsPerRow === 0) {
      y = ensureSpace(
        document,
        profile,
        periodLabel,
        y,
        cardHeight,
      );
    }

    const column = index % cardsPerRow;
    const x = document.page.margins.left + column * (cardWidth + gap);

    document.roundedRect(x, y, cardWidth, cardHeight, 9).fill("#F8F5FA");
    document.rect(x, y, 5, cardHeight).fill(item.colour);

    document
      .fillColor("#736679")
      .font("Helvetica-Bold")
      .fontSize(7.5)
      .text(safePdfText(item.label.toUpperCase()), x + 16, y + 11, {
        width: cardWidth - 28,
      });

    document
      .fillColor("#2D1736")
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(safePdfText(item.value), x + 16, y + 25, {
        width: cardWidth - 28,
      });

    document
      .fillColor("#817684")
      .font("Helvetica")
      .fontSize(7)
      .text(truncateText(item.note, 70), x + 16, y + 50, {
        width: cardWidth - 28,
      });
  });

  const numberOfRows = Math.ceil(items.length / cardsPerRow);

  return startingY + numberOfRows * cardHeight + (numberOfRows - 1) * gap;
}

function drawSectionTitle(
  document: PDFKit.PDFDocument,
  profile: CentreProfile,
  periodLabel: string,
  title: string,
  description: string,
  startingY: number,
) {
  const y = ensureSpace(
    document,
    profile,
    periodLabel,
    startingY,
    50,
  );

  document
    .fillColor("#7A459C")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("CENTREOS WEBSITE REPORT", document.page.margins.left, y);

  document
    .fillColor("#2D1736")
    .font("Helvetica-Bold")
    .fontSize(15)
    .text(safePdfText(title), document.page.margins.left, y + 13);

  document
    .fillColor("#817684")
    .font("Helvetica")
    .fontSize(8)
    .text(safePdfText(description), document.page.margins.left, y + 33, {
      width:
        document.page.width -
        document.page.margins.left -
        document.page.margins.right,
    });

  return y + 53;
}

function drawTable(
  document: PDFKit.PDFDocument,
  profile: CentreProfile,
  periodLabel: string,
  columns: TableColumn[],
  rows: string[][],
  startingY: number,
) {
  const left = document.page.margins.left;
  const availableWidth =
    document.page.width -
    document.page.margins.left -
    document.page.margins.right;
  const totalWeight = columns.reduce(
    (total, column) => total + column.weight,
    0,
  );
  const widths = columns.map(
    (column) => (availableWidth * column.weight) / totalWeight,
  );
  const headerHeight = 24;

  let y = startingY;

  function drawHeader() {
    y = ensureSpace(
      document,
      profile,
      periodLabel,
      y,
      headerHeight + 24,
    );

    document.rect(left, y, availableWidth, headerHeight).fill("#5B2A86");

    let x = left;

    columns.forEach((column, index) => {
      document
        .fillColor("#FFFFFF")
        .font("Helvetica-Bold")
        .fontSize(7)
        .text(safePdfText(column.label.toUpperCase()), x + 6, y + 8, {
          width: widths[index] - 12,
          align: column.align ?? "left",
        });

      x += widths[index];
    });

    y += headerHeight;
  }

  if (rows.length === 0) {
    y = ensureSpace(
      document,
      profile,
      periodLabel,
      y,
      42,
    );

    document.roundedRect(left, y, availableWidth, 36, 7).fill("#F8F5FA");

    document
      .fillColor("#817684")
      .font("Helvetica")
      .fontSize(8.5)
      .text("No records were found for this reporting period.", left + 12, y + 13, {
        width: availableWidth - 24,
        align: "center",
      });

    return y + 42;
  }

  drawHeader();

  rows.forEach((row, rowIndex) => {
    const rowHeight = 25;

    if (y + rowHeight > pageBottom(document)) {
      y = addReportPage(document, profile, periodLabel);
      drawHeader();
    }

    document
      .rect(left, y, availableWidth, rowHeight)
      .fill(rowIndex % 2 === 0 ? "#FFFFFF" : "#FAF8FC");

    let x = left;

    columns.forEach((column, columnIndex) => {
      document
        .fillColor("#46374C")
        .font(columnIndex === 0 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(7.2)
        .text(truncateText(row[columnIndex] ?? "", 90), x + 6, y + 8, {
          width: widths[columnIndex] - 12,
          height: rowHeight - 10,
          ellipsis: true,
          align: column.align ?? "left",
        });

      x += widths[columnIndex];
    });

    document
      .moveTo(left, y + rowHeight)
      .lineTo(left + availableWidth, y + rowHeight)
      .strokeColor("#EEE8F1")
      .lineWidth(0.5)
      .stroke();

    y += rowHeight;
  });

  return y + 12;
}

function addPageFooters(document: PDFKit.PDFDocument) {
  const pageRange = document.bufferedPageRange();

  for (let index = 0; index < pageRange.count; index += 1) {
    document.switchToPage(pageRange.start + index);

    document
      .fillColor("#8B808F")
      .font("Helvetica")
      .fontSize(6.5)
      .text(
        "Private CentreOS report - website activity is anonymous until a parent submits an enquiry.",
        36,
        document.page.height - 29,
        {
          width: document.page.width - 150,
        },
      );

    document
      .fillColor("#5B2A86")
      .font("Helvetica-Bold")
      .fontSize(6.5)
      .text(
        `Page ${index + 1} of ${pageRange.count}`,
        document.page.width - 120,
        document.page.height - 29,
        {
          width: 84,
          align: "right",
        },
      );
  }
}

async function createPdf(
  profile: CentreProfile,
  period: ReportPeriod,
  summaries: SummaryItem[],
  pageRows: string[][],
  trafficRows: string[][],
  campaignRows: string[][],
  leadSourceRows: string[][],
  enquiryRows: string[][],
  contactRows: string[][],
) {
  const document = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: {
      top: 36,
      right: 36,
      bottom: 48,
      left: 36,
    },
    bufferPages: true,
    info: {
      Title: "Website Analytics Report",
      Author: profile.centreName,
      Subject:
        "Website visits, contact intent, advertising attribution and submitted enquiries",
      Creator: "Kidzee CentreOS",
    },
  });

  const chunks: Buffer[] = [];

  const completedPdf = new Promise<Buffer>((resolve, reject) => {
    document.on("data", (chunk: Buffer) => {
      chunks.push(Buffer.from(chunk));
    });

    document.on("end", () => {
      resolve(Buffer.concat(chunks));
    });

    document.on("error", reject);
  });

  let y = drawPageHeader(document, profile, period.label);

  y = drawSummaryCards(document, profile, period.label, summaries, y);

  y = drawSectionTitle(
    document,
    profile,
    period.label,
    "Page performance",
    "Public website pages grouped without advertising query parameters.",
    y + 18,
  );

  y = drawTable(
    document,
    profile,
    period.label,
    [
      { label: "Page", weight: 3.4 },
      { label: "Views", weight: 0.8, align: "right" },
      { label: "Visitors", weight: 0.9, align: "right" },
      { label: "Enquiry clicks", weight: 1.2, align: "right" },
      { label: "Call clicks", weight: 1, align: "right" },
      { label: "WhatsApp", weight: 1, align: "right" },
    ],
    pageRows,
    y,
  );

  y = drawSectionTitle(
    document,
    profile,
    period.label,
    "Traffic sources",
    "Anonymous browsing sessions grouped by the first recorded source.",
    y + 8,
  );

  y = drawTable(
    document,
    profile,
    period.label,
    [
      { label: "Source", weight: 5 },
      { label: "Sessions", weight: 1, align: "right" },
    ],
    trafficRows,
    y,
  );

  y = drawSectionTitle(
    document,
    profile,
    period.label,
    "Advertising campaigns",
    "Sessions grouped by the UTM campaign name used in Google or Meta links.",
    y + 8,
  );

  y = drawTable(
    document,
    profile,
    period.label,
    [
      { label: "Campaign", weight: 5 },
      { label: "Sessions", weight: 1, align: "right" },
    ],
    campaignRows,
    y,
  );

  y = drawSectionTitle(
    document,
    profile,
    period.label,
    "Actual lead sources",
    "Only successfully saved CentreOS enquiry records are counted here.",
    y + 8,
  );

  y = drawTable(
    document,
    profile,
    period.label,
    [
      { label: "Enquiry source", weight: 5 },
      { label: "Enquiries", weight: 1, align: "right" },
    ],
    leadSourceRows,
    y,
  );

  y = drawSectionTitle(
    document,
    profile,
    period.label,
    "Confirmed website enquiries",
    "Parents who submitted details and received an enquiry record in CentreOS.",
    y + 8,
  );

  y = drawTable(
    document,
    profile,
    period.label,
    [
      { label: "Reference", weight: 1.5 },
      { label: "Parent", weight: 2 },
      { label: "Programme", weight: 1.3 },
      { label: "Source", weight: 1.2 },
      { label: "Status", weight: 1.3 },
      { label: "Created", weight: 1.7 },
    ],
    enquiryRows,
    y,
  );

  y = drawSectionTitle(
    document,
    profile,
    period.label,
    "Contact-interest activity",
    "Clicks show intent only; they do not prove that a call connected or a WhatsApp message was sent.",
    y + 8,
  );

  drawTable(
    document,
    profile,
    period.label,
    [
      { label: "Time", weight: 1.7 },
      { label: "Action", weight: 1.3 },
      { label: "Page", weight: 1.8 },
      { label: "Button or item", weight: 2.5 },
      { label: "Device", weight: 0.8 },
      { label: "Source", weight: 1.2 },
    ],
    contactRows,
    y,
  );

  addPageFooters(document);
  document.end();

  return completedPdf;
}

function createFilename(range: ReportRange) {
  const fileDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
  }).format(new Date());

  return `website-analytics-${range}-${fileDate}.pdf`;
}

export async function GET(request: Request) {
  try {
    const authenticated = await isAdminAuthenticated();

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

    const canExportWebsiteAnalytics =
      await hasAdminPermission("website.manage");

    if (!canExportWebsiteAnalytics) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to export website analytics.",
        },
        {
          status: 403,
        },
      );
    }

    const url = new URL(request.url);
    const period = getReportPeriod(url.searchParams);

    const [profile, eventLogs, websiteEnquiries] = await Promise.all([
      getCentreProfile(),

      prisma.activityLog.findMany({
        where: {
          entityType: "WEBSITE_ANALYTICS_EVENT",
          createdAt: period.fromDate
            ? {
                gte: period.fromDate,
              }
            : undefined,
        },
        select: {
          id: true,
          newData: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.enquiry.findMany({
        where: {
          source: {
            in: [...websiteEnquirySources],
          },
          createdAt: period.fromDate
            ? {
                gte: period.fromDate,
              }
            : undefined,
        },
        select: {
          enquiryNumber: true,
          parentName: true,
          programme: true,
          source: true,
          status: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

    const events = eventLogs
      .map((log) => ({ ...log, data: readEventData(log.newData) }))
      .filter(
        (event) =>
          (!event.data.trafficClass || event.data.trafficClass === "GENUINE") &&
          event.data.eventScope !== "RECRUITMENT" &&
          event.data.leadType !== "recruitment" &&
          event.data.isInternal !== true &&
          event.data.isTest !== true &&
          event.data.isBot !== true,
      );

    const visitors = new Set(
      events
        .map((event) => event.data.visitorId)
        .filter((value): value is string => Boolean(value)),
    );

    const sessions = new Set(
      events
        .map((event) => event.data.sessionId)
        .filter((value): value is string => Boolean(value)),
    );

    const submittedFormVisitors = new Set(
      events
        .filter(
          (event) =>
            event.data.eventType === "FORM_SUBMITTED" &&
            (event.data.eventScope === "ADMISSION" ||
              event.data.leadType === "admission"),
        )
        .map((event) => event.data.visitorId)
        .filter((value): value is string => Boolean(value)),
    );

    const contactIntentVisitors = new Set(
      events
        .filter((event) =>
          [
            "CTA_CLICK",
            "PHONE_CLICK",
            "WHATSAPP_CLICK",
            "FORM_STARTED",
          ].includes(event.data.eventType ?? ""),
        )
        .map((event) => event.data.visitorId)
        .filter((value): value is string => Boolean(value)),
    );

    const countEvent = (eventType: string) =>
      events.filter((event) => event.data.eventType === eventType).length;

    const pageViews = countEvent("PAGE_VIEW");
    const phoneClicks = countEvent("PHONE_CLICK");
    const whatsappClicks = countEvent("WHATSAPP_CLICK");

    const conversionRate =
      visitors.size > 0
        ? (submittedFormVisitors.size / visitors.size) * 100
        : 0;

    const contactIntentRate =
      visitors.size > 0
        ? (contactIntentVisitors.size / visitors.size) * 100
        : 0;

    const pageMap = new Map<string, PagePerformance>();

    for (const event of events) {
      const pagePath =
        (event.data.pagePath?.trim() || "/").split("?")[0] || "/";
      const current = pageMap.get(pagePath) ?? {
        pagePath,
        views: 0,
        visitors: new Set<string>(),
        enquiryClicks: 0,
        callClicks: 0,
        whatsappClicks: 0,
      };

      if (event.data.eventType === "PAGE_VIEW") {
        current.views += 1;
      }

      if (event.data.visitorId) {
        current.visitors.add(event.data.visitorId);
      }

      if (event.data.eventType === "CTA_CLICK") {
        current.enquiryClicks += 1;
      }

      if (event.data.eventType === "PHONE_CLICK") {
        current.callClicks += 1;
      }

      if (event.data.eventType === "WHATSAPP_CLICK") {
        current.whatsappClicks += 1;
      }

      pageMap.set(pagePath, current);
    }

    const pageRows = Array.from(pageMap.values())
      .filter((page) => page.views > 0)
      .sort((left, right) => right.views - left.views)
      .map((page) => [
        `${friendlyPagePath(page.pagePath)} (${page.pagePath})`,
        formatNumber(page.views),
        formatNumber(page.visitors.size),
        formatNumber(page.enquiryClicks),
        formatNumber(page.callClicks),
        formatNumber(page.whatsappClicks),
      ]);

    const sourceSessions = new Map<string, Set<string>>();
    const campaignSessions = new Map<string, Set<string>>();

    for (const event of events) {
      if (!event.data.sessionId) {
        continue;
      }

      const source = getTrafficSource(event.data);
      const sourceSet = sourceSessions.get(source) ?? new Set<string>();
      sourceSet.add(event.data.sessionId);
      sourceSessions.set(source, sourceSet);

      const campaign = event.data.utmCampaign?.trim();

      if (campaign) {
        const campaignSet =
          campaignSessions.get(campaign) ?? new Set<string>();
        campaignSet.add(event.data.sessionId);
        campaignSessions.set(campaign, campaignSet);
      }
    }

    const trafficRows = Array.from(sourceSessions.entries())
      .map(([label, value]) => [label, formatNumber(value.size)])
      .sort((left, right) => Number(right[1].replace(/,/g, "")) - Number(left[1].replace(/,/g, "")));

    const campaignRows = Array.from(campaignSessions.entries())
      .map(([label, value]) => [label, formatNumber(value.size)])
      .sort((left, right) => Number(right[1].replace(/,/g, "")) - Number(left[1].replace(/,/g, "")));

    const leadSourceCounts = new Map<string, number>();

    for (const enquiry of websiteEnquiries) {
      const label = enquirySourceLabels[enquiry.source] ?? enquiry.source;
      leadSourceCounts.set(label, (leadSourceCounts.get(label) ?? 0) + 1);
    }

    const leadSourceRows = Array.from(leadSourceCounts.entries())
      .sort((left, right) => right[1] - left[1])
      .map(([label, value]) => [label, formatNumber(value)]);

    const enquiryRows = websiteEnquiries.map((enquiry) => [
      enquiry.enquiryNumber,
      enquiry.parentName,
      enquiry.programme?.replace(/_/g, " ") ?? "Not selected",
      enquirySourceLabels[enquiry.source] ?? enquiry.source,
      enquiry.status.replace(/_/g, " "),
      formatDateTime(enquiry.createdAt),
    ]);

    const contactRows = events
      .filter((event) =>
        [
          "CTA_CLICK",
          "PHONE_CLICK",
          "WHATSAPP_CLICK",
          "MAP_CLICK",
          "FORM_STARTED",
        ].includes(event.data.eventType ?? ""),
      )
      .map((event) => [
        formatDateTime(event.createdAt),
        eventLabels[event.data.eventType ?? ""] ?? "Website action",
        event.data.pagePath || "/",
        event.data.targetText || "-",
        event.data.deviceType || "Unknown",
        getTrafficSource(event.data),
      ]);

    const summaries: SummaryItem[] = [
      {
        label: "Unique visitors",
        value: formatNumber(visitors.size),
        note: `${formatNumber(sessions.size)} browsing sessions`,
        colour: "#5B2A86",
      },
      {
        label: "Page views",
        value: formatNumber(pageViews),
        note: "Public website pages opened",
        colour: "#2765A4",
      },
      {
        label: "Website enquiries",
        value: formatNumber(websiteEnquiries.length),
        note: `${formatPercentage(conversionRate)} visitor conversion rate`,
        colour: "#28755D",
      },
      {
        label: "WhatsApp clicks",
        value: formatNumber(whatsappClicks),
        note: "Contact intent, not confirmed messages",
        colour: "#14753C",
      },
      {
        label: "Call clicks",
        value: formatNumber(phoneClicks),
        note: "Contact intent, not confirmed calls",
        colour: "#A65325",
      },
      {
        label: "Contact intent",
        value: formatPercentage(contactIntentRate),
        note: `${formatNumber(contactIntentVisitors.size)} interested visitors`,
        colour: "#876000",
      },
    ];

    const pdf = await createPdf(
      profile,
      period,
      summaries,
      pageRows,
      trafficRows,
      campaignRows,
      leadSourceRows,
      enquiryRows,
      contactRows,
    );

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${createFilename(
          period.range,
        )}"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    logServerError("Unable to export the website analytics report.", error);

    return NextResponse.json(
      {
        success: false,
        message:
          "The website analytics PDF could not be generated. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}
