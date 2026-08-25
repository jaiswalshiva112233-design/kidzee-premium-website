import type { Prisma } from "@/generated/prisma/client";
import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type SchoolProfile = {
  schoolName: string;
  centreName: string;
  address: string;
  phone: string;
  email: string;
  centreHeadName: string;
};

const payrollInclude = {
  staff: {
    select: {
      id: true,
      staffNumber: true,
      name: true,
      designation: true,
      joiningDate: true,
      leavingDate: true,
      monthlySalary: true,
    },
  },
  generatedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      name: true,
    },
  },
  paidBy: {
    select: {
      id: true,
      name: true,
    },
  },
  extraDuties: {
    select: {
      id: true,
      dutyNumber: true,
      dutyDate: true,
      hours: true,
      hourlyRate: true,
      amount: true,
      status: true,
    },
    orderBy: [
      { dutyDate: "asc" },
      { createdAt: "asc" },
    ],
  },
} satisfies Prisma.StaffPayrollInclude;

type PayrollWithRelations =
  Prisma.StaffPayrollGetPayload<{
    include: typeof payrollInclude;
  }>;

const STATUS_LABELS = {
  DRAFT: "DRAFT - NOT APPROVED",
  APPROVED: "APPROVED",
  PAID: "PAID",
  CANCELLED: "CANCELLED",
} as const;

const PAYMENT_METHOD_LABELS = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  CARD: "Card",
  CHEQUE: "Cheque",
  OTHER: "Other",
} as const;

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function getJsonText(
  value: Record<string, unknown>,
  key: string,
) {
  const item = value[key];
  return typeof item === "string"
    ? item.trim()
    : "";
}

function formatMoney(value: {
  toString(): string;
}) {
  const number = Number(value.toString());

  return `Rs. ${new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0)}`;
}

function formatNumber(value: {
  toString(): string;
}) {
  const number = Number(value.toString());

  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 2,
  }).format(Number.isFinite(number) ? number : 0);
}

function formatDate(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatMonth(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function formatDateTime(value: Date | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  }).format(value);
}

function createFilename(payroll: PayrollWithRelations) {
  const staffName = payroll.staffNameSnapshot
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const month = [
    payroll.payrollMonth.getUTCFullYear(),
    String(
      payroll.payrollMonth.getUTCMonth() + 1,
    ).padStart(2, "0"),
  ].join("-");

  return `salary-slip-${staffName || payroll.staffNumberSnapshot}-${month}.pdf`;
}

async function getSchoolProfile():
  Promise<SchoolProfile> {
  const setting =
    await prisma.centreSetting.findUnique({
      where: {
        key: "SCHOOL_PROFILE",
      },
    });
  const value = isRecord(setting?.value)
    ? setting.value
    : {};
  const address = [
    getJsonText(value, "addressLine1"),
    getJsonText(value, "addressLine2"),
    getJsonText(value, "locality"),
    getJsonText(value, "city"),
    getJsonText(value, "state"),
    getJsonText(value, "postalCode"),
  ]
    .filter(Boolean)
    .join(", ");

  return {
    schoolName:
      getJsonText(value, "schoolName") ||
      "Kidzee Preschool & Daycare",
    centreName:
      getJsonText(value, "centreName") ||
      "Kidzee Sector 12, Dwarka",
    address:
      address ||
      "Plot No. 19, Block B, Sector 12B, Dwarka, New Delhi",
    phone:
      getJsonText(value, "phone") ||
      "9667038673",
    email:
      getJsonText(value, "email") ||
      "kidzeepreschoolsector12@gmail.com",
    centreHeadName: getJsonText(
      value,
      "centreHeadName",
    ),
  };
}

function drawTextPair(
  document: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
) {
  document
    .fillColor("#827787")
    .font("Helvetica-Bold")
    .fontSize(7)
    .text(label.toUpperCase(), x, y, {
      width,
      characterSpacing: 0.5,
    });

  document
    .fillColor("#2D1736")
    .font("Helvetica-Bold")
    .fontSize(10)
    .text(value || "-", x, y + 13, {
      width,
      lineGap: 1,
    });
}

function drawSectionTitle(
  document: PDFKit.PDFDocument,
  title: string,
  x: number,
  y: number,
  width: number,
) {
  document
    .fillColor("#5B2A86")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text(title.toUpperCase(), x, y, {
      width,
      characterSpacing: 0.8,
    });

  document
    .moveTo(x, y + 16)
    .lineTo(x + width, y + 16)
    .lineWidth(1)
    .strokeColor("#E7DFEB")
    .stroke();
}

function drawAmountRow(
  document: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  options: {
    bold?: boolean;
    tone?: "normal" | "positive" | "negative";
  } = {},
) {
  const color =
    options.tone === "positive"
      ? "#087A55"
      : options.tone === "negative"
        ? "#B42318"
        : "#2D1736";

  document
    .fillColor(options.bold ? "#2D1736" : "#655A69")
    .font(
      options.bold
        ? "Helvetica-Bold"
        : "Helvetica",
    )
    .fontSize(options.bold ? 9 : 8.5)
    .text(label, x, y, {
      width: width * 0.63,
    });

  document
    .fillColor(color)
    .font("Helvetica-Bold")
    .fontSize(options.bold ? 9.5 : 8.5)
    .text(value, x + width * 0.63, y, {
      width: width * 0.37,
      align: "right",
    });
}

function drawAttendanceMetric(
  document: PDFKit.PDFDocument,
  label: string,
  value: string,
  x: number,
  y: number,
  width: number,
  fill: string,
) {
  document
    .roundedRect(x, y, width, 48, 10)
    .fill(fill);

  document
    .fillColor("#756A79")
    .font("Helvetica-Bold")
    .fontSize(6.5)
    .text(label.toUpperCase(), x + 8, y + 9, {
      width: width - 16,
      align: "center",
      characterSpacing: 0.3,
    });

  document
    .fillColor("#2D1736")
    .font("Helvetica-Bold")
    .fontSize(13)
    .text(value, x + 8, y + 25, {
      width: width - 16,
      align: "center",
    });
}

async function createSalarySlipPdf(
  payroll: PayrollWithRelations,
  profile: SchoolProfile,
) {
  const document = new PDFDocument({
    size: "A4",
    margins: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    },
    bufferPages: true,
    info: {
      Title: `Salary Slip - ${payroll.staffNameSnapshot} - ${formatMonth(
        payroll.payrollMonth,
      )}`,
      Author: profile.centreName,
      Subject: "Staff salary slip",
      Creator: "Kidzee CentreOS",
    },
  });
  const chunks: Buffer[] = [];
  const completedPdf = new Promise<Buffer>(
    (resolve, reject) => {
      document.on("data", (chunk: Buffer) => {
        chunks.push(Buffer.from(chunk));
      });
      document.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
      document.on("error", reject);
    },
  );
  const pageWidth = document.page.width;
  const pageHeight = document.page.height;
  const margin = 38;
  const contentWidth = pageWidth - margin * 2;

  document.rect(0, 0, pageWidth, 132).fill("#2D1736");
  document.rect(0, 132, pageWidth, 5).fill("#FFD34E");

  document
    .fillColor("#FFD34E")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("KIDZEE CENTREOS", margin, 25, {
      width: contentWidth * 0.6,
      characterSpacing: 1.4,
    });

  document
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(21)
    .text(profile.schoolName, margin, 43, {
      width: contentWidth * 0.66,
    });

  document
    .fillColor("#D9D0DE")
    .font("Helvetica")
    .fontSize(8)
    .text(profile.centreName, margin, 72, {
      width: contentWidth * 0.66,
    })
    .text(profile.address, margin, 86, {
      width: contentWidth * 0.66,
      height: 24,
      lineGap: 2,
    });

  document
    .fillColor("#FFD34E")
    .font("Helvetica-Bold")
    .fontSize(9)
    .text("SALARY SLIP", pageWidth - margin - 180, 28, {
      width: 180,
      align: "right",
      characterSpacing: 1,
    });

  document
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(17)
    .text(
      formatMonth(payroll.payrollMonth),
      pageWidth - margin - 180,
      48,
      {
        width: 180,
        align: "right",
      },
    );

  const statusColor =
    payroll.status === "PAID"
      ? "#45D39B"
      : payroll.status === "APPROVED"
        ? "#7DD3FC"
        : payroll.status === "CANCELLED"
          ? "#FDA4AF"
          : "#FCD34D";

  document
    .fillColor(statusColor)
    .font("Helvetica-Bold")
    .fontSize(8)
    .text(
      STATUS_LABELS[payroll.status],
      pageWidth - margin - 180,
      78,
      {
        width: 180,
        align: "right",
        characterSpacing: 0.6,
      },
    );

  document
    .fillColor("#D9D0DE")
    .font("Helvetica")
    .fontSize(7)
    .text(
      payroll.payrollNumber,
      pageWidth - margin - 220,
      97,
      {
        width: 220,
        align: "right",
      },
    );

  const employeeY = 158;

  document
    .roundedRect(margin, employeeY, contentWidth, 78, 14)
    .fillAndStroke("#FAF8FB", "#E7DFEB");

  drawTextPair(
    document,
    "Employee",
    payroll.staffNameSnapshot,
    margin + 16,
    employeeY + 15,
    150,
  );
  drawTextPair(
    document,
    "Staff Number",
    payroll.staffNumberSnapshot,
    margin + 178,
    employeeY + 15,
    115,
  );
  drawTextPair(
    document,
    "Designation",
    payroll.designationSnapshot,
    margin + 305,
    employeeY + 15,
    120,
  );
  drawTextPair(
    document,
    "Salary Period",
    `${formatDate(payroll.periodStart)} - ${formatDate(
      payroll.periodEnd,
    )}`,
    margin + 437,
    employeeY + 15,
    contentWidth - 453,
  );

  const tableY = 260;
  const columnGap = 22;
  const columnWidth =
    (contentWidth - columnGap) / 2;
  const leftX = margin;
  const rightX = margin + columnWidth + columnGap;

  drawSectionTitle(
    document,
    "Earnings",
    leftX,
    tableY,
    columnWidth,
  );
  drawSectionTitle(
    document,
    "Deductions",
    rightX,
    tableY,
    columnWidth,
  );

  drawAmountRow(
    document,
    "Base salary earned",
    formatMoney(payroll.baseSalary),
    leftX,
    tableY + 31,
    columnWidth,
  );
  drawAmountRow(
    document,
    `Approved extra duty (${formatNumber(
      payroll.extraDutyHours,
    )} hrs)`,
    formatMoney(payroll.extraDutyAmount),
    leftX,
    tableY + 55,
    columnWidth,
    { tone: "positive" },
  );
  drawAmountRow(
    document,
    "Manual addition",
    formatMoney(payroll.manualAddition),
    leftX,
    tableY + 79,
    columnWidth,
    { tone: "positive" },
  );

  document
    .moveTo(leftX, tableY + 108)
    .lineTo(leftX + columnWidth, tableY + 108)
    .strokeColor("#DCD2E1")
    .stroke();

  drawAmountRow(
    document,
    "Gross earnings",
    formatMoney(payroll.grossEarnings),
    leftX,
    tableY + 120,
    columnWidth,
    { bold: true },
  );

  drawAmountRow(
    document,
    `Unpaid leave (${formatNumber(
      payroll.unpaidLeaveDays,
    )} days)`,
    formatMoney(payroll.leaveDeduction),
    rightX,
    tableY + 31,
    columnWidth,
    { tone: "negative" },
  );
  drawAmountRow(
    document,
    `Attendance deduction (${formatNumber(
      payroll.absentDays,
    )} absent)`,
    formatMoney(payroll.absenceDeduction),
    rightX,
    tableY + 55,
    columnWidth,
    { tone: "negative" },
  );
  drawAmountRow(
    document,
    "Manual deduction",
    formatMoney(payroll.manualDeduction),
    rightX,
    tableY + 79,
    columnWidth,
    { tone: "negative" },
  );

  document
    .moveTo(rightX, tableY + 108)
    .lineTo(rightX + columnWidth, tableY + 108)
    .strokeColor("#DCD2E1")
    .stroke();

  drawAmountRow(
    document,
    "Total deductions",
    formatMoney(payroll.totalDeductions),
    rightX,
    tableY + 120,
    columnWidth,
    { bold: true, tone: "negative" },
  );

  const attendanceY = 426;

  drawSectionTitle(
    document,
    "Attendance & Leave Summary",
    margin,
    attendanceY,
    contentWidth,
  );

  const attendanceGap = 7;
  const attendanceWidth =
    (contentWidth - attendanceGap * 5) / 6;
  const attendanceValues = [
    {
      label: "Present",
      value: formatNumber(payroll.presentDays),
      fill: "#EAF8F2",
    },
    {
      label: "Late",
      value: formatNumber(payroll.lateDays),
      fill: "#FFF7E6",
    },
    {
      label: "Half Day",
      value: formatNumber(payroll.halfDays),
      fill: "#FFF1E8",
    },
    {
      label: "Paid Leave",
      value: formatNumber(payroll.paidLeaveDays),
      fill: "#EAF5FF",
    },
    {
      label: "Unpaid Leave",
      value: formatNumber(payroll.unpaidLeaveDays),
      fill: "#FFF0F1",
    },
    {
      label: "Absent",
      value: formatNumber(payroll.absentDays),
      fill: "#FCECED",
    },
  ];

  attendanceValues.forEach((item, index) => {
    drawAttendanceMetric(
      document,
      item.label,
      item.value,
      margin +
        index * (attendanceWidth + attendanceGap),
      attendanceY + 29,
      attendanceWidth,
      item.fill,
    );
  });

  const payableY = 520;

  document
    .roundedRect(margin, payableY, contentWidth, 82, 16)
    .fill("#2D1736");

  document
    .fillColor("#FFD34E")
    .font("Helvetica-Bold")
    .fontSize(8)
    .text("NET SALARY PAYABLE", margin + 18, payableY + 17, {
      width: contentWidth * 0.5,
      characterSpacing: 0.9,
    });

  document
    .fillColor("#FFFFFF")
    .font("Helvetica-Bold")
    .fontSize(26)
    .text(
      formatMoney(payroll.netPayable),
      margin + 18,
      payableY + 35,
      {
        width: contentWidth * 0.53,
      },
    );

  document
    .fillColor("#D9D0DE")
    .font("Helvetica-Bold")
    .fontSize(7)
    .text(
      `Daily rate: ${formatMoney(
        payroll.dailyRate,
      )}\nWorking days divisor: ${payroll.workingDaysInMonth}`,
      margin + contentWidth * 0.58,
      payableY + 20,
      {
        width: contentWidth * 0.38,
        align: "right",
        lineGap: 5,
      },
    );

  const detailY = 626;
  const paymentMethod = payroll.paymentMethod
    ? PAYMENT_METHOD_LABELS[payroll.paymentMethod]
    : "-";

  drawTextPair(
    document,
    "Payment Status",
    STATUS_LABELS[payroll.status],
    margin,
    detailY,
    130,
  );
  drawTextPair(
    document,
    "Payment Method",
    paymentMethod,
    margin + 145,
    detailY,
    115,
  );
  drawTextPair(
    document,
    "Payment Reference",
    payroll.paymentReference || "-",
    margin + 275,
    detailY,
    125,
  );
  drawTextPair(
    document,
    "Paid On",
    formatDateTime(payroll.paidAt),
    margin + 415,
    detailY,
    contentWidth - 415,
  );

  const notes = [
    payroll.manualAdjustmentNotes
      ? `Adjustment: ${payroll.manualAdjustmentNotes}`
      : "",
    payroll.notes
      ? `Payroll note: ${payroll.notes}`
      : "",
  ]
    .filter(Boolean)
    .join("  |  ");

  if (notes) {
    document
      .roundedRect(margin, 690, contentWidth, 45, 10)
      .fill("#FAF8FB");
    document
      .fillColor("#655A69")
      .font("Helvetica")
      .fontSize(7.5)
      .text(notes, margin + 12, 702, {
        width: contentWidth - 24,
        height: 25,
        lineGap: 2,
      });
  }

  const signatureY = notes ? 752 : 712;

  document
    .fillColor("#807584")
    .font("Helvetica")
    .fontSize(7)
    .text(
      `Generated by: ${payroll.generatedBy?.name ?? "CentreOS"}`,
      margin,
      signatureY,
      { width: 170 },
    )
    .text(
      `Approved by: ${payroll.approvedBy?.name ?? "Pending"}`,
      margin + 180,
      signatureY,
      { width: 170 },
    )
    .text(
      `Paid by: ${payroll.paidBy?.name ?? "Pending"}`,
      margin + 360,
      signatureY,
      { width: contentWidth - 360, align: "right" },
    );

  document
    .moveTo(margin, pageHeight - 42)
    .lineTo(pageWidth - margin, pageHeight - 42)
    .strokeColor("#E7DFEB")
    .stroke();

  document
    .fillColor("#887D8B")
    .font("Helvetica")
    .fontSize(6.5)
    .text(
      `Computer-generated salary slip from Kidzee CentreOS. Contact: ${profile.phone} | ${profile.email}`,
      margin,
      pageHeight - 31,
      {
        width: contentWidth,
        align: "center",
      },
    );

  document.end();
  return completedPdf;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    const canViewPayroll =
      session.role === "OWNER" ||
      session.permissions.includes("*") ||
      session.permissions.includes("payroll.manage");

    if (!canViewPayroll) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You do not have permission to download salary slips.",
        },
        { status: 403 },
      );
    }

    const { id } = await context.params;
    const payrollId = cleanText(id);

    if (!payrollId) {
      return NextResponse.json(
        {
          success: false,
          message: "Payroll record is required.",
        },
        { status: 400 },
      );
    }

    const [payroll, profile] = await Promise.all([
      prisma.staffPayroll.findUnique({
        where: { id: payrollId },
        include: payrollInclude,
      }),
      getSchoolProfile(),
    ]);

    if (!payroll) {
      return NextResponse.json(
        {
          success: false,
          message: "Payroll record was not found.",
        },
        { status: 404 },
      );
    }

    const pdf = await createSalarySlipPdf(
      payroll,
      profile,
    );

    await prisma.activityLog.create({
      data: {
        adminUserId: session.userId,
        action: "EXPORTED",
        entityType: "StaffPayroll",
        entityId: payroll.id,
        description: `${payroll.payrollNumber} salary slip downloaded for ${payroll.staffNameSnapshot}.`,
        newData: {
          payrollNumber: payroll.payrollNumber,
          staffId: payroll.staffId,
          payrollMonth: formatMonth(
            payroll.payrollMonth,
          ),
          status: payroll.status,
        },
      },
    });

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${createFilename(
          payroll,
        )}"`,
        "Cache-Control":
          "private, no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error(
      "Unable to generate salary slip:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The salary slip could not be generated. Check the server terminal.",
      },
      { status: 500 },
    );
  }
}
