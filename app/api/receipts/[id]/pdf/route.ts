import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

import { formatCentreAddress } from "@/lib/centreAddress";
import { prisma } from "@/lib/prisma";
import { site } from "@/lib/site";
import { verifyReceiptDocumentSignature } from "@/lib/whatsapp/receiptLink";

type RouteContext = { params: Promise<{ id: string }> };

type SchoolProfile = {
  schoolName: string;
  centreName: string;
  schoolCode: string;
  address: string;
  phone: string;
  email: string;
  gstNumber: string;
  logoUrl: string;
  stampUrl: string;
  signatureUrl: string;
  receiptTerms: string[];
};

const defaultSchoolProfile: SchoolProfile = {
  schoolName: "Kidzee Preschool & Daycare",
  centreName: "Kidzee Sector 12, Dwarka",
  schoolCode: "7206",
  address: site.address,
  phone: "9667038673",
  email: "kidzeepreschoolsector12@gmail.com",
  gstNumber: "07CIHPV5007K1ZW",
  logoUrl: "https://cdn.sanity.io/images/4pj1t073/production/e48729ca91847165641a71fcd6cc0ff824bac1d3-1558x482.png",
  stampUrl: "https://cdn.sanity.io/images/4pj1t073/production/896a8e18da82f7e9c53940b0fdfe1b44112cf830-1254x1254.jpg",
  signatureUrl: "https://cdn.sanity.io/images/4pj1t073/production/9ce98a2b564932905467d58927e791f2b406b667-1600x666.jpg",
  receiptTerms: [
    "The monthly fee is payable on or before the 5th of every month.",
    "A late fee of Rs. 50 per day may apply after the due date.",
    "Fees once paid are non-refundable and non-transferable.",
    "Late pickup charges may apply according to the centre's current policy.",
    "Emergency daycare must be requested in advance and is subject to availability.",
    "Please retain this receipt for future reference.",
  ],
};

function cleanText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normaliseSchoolProfile(value: unknown): SchoolProfile {
  if (!isRecord(value)) return defaultSchoolProfile;
  const terms = Array.isArray(value.receiptTerms)
    ? value.receiptTerms.map((t) => cleanText(t).replace(/₹/g, "Rs. ")).filter(Boolean)
    : defaultSchoolProfile.receiptTerms;

  return {
    schoolName: cleanText(value.schoolName) || defaultSchoolProfile.schoolName,
    centreName: cleanText(value.centreName) || defaultSchoolProfile.centreName,
    schoolCode: cleanText(value.schoolCode) || defaultSchoolProfile.schoolCode,
    address: (isRecord(value) ? formatCentreAddress(value) : "") || defaultSchoolProfile.address,
    phone: cleanText(value.phone) || defaultSchoolProfile.phone,
    email: cleanText(value.email) || defaultSchoolProfile.email,
    gstNumber: cleanText(value.gstNumber) || defaultSchoolProfile.gstNumber,
    logoUrl: cleanText(value.logoUrl) || defaultSchoolProfile.logoUrl,
    stampUrl: cleanText(value.stampUrl) || defaultSchoolProfile.stampUrl,
    signatureUrl: cleanText(value.signatureUrl) || defaultSchoolProfile.signatureUrl,
    receiptTerms: terms.length > 0 ? terms : defaultSchoolProfile.receiptTerms,
  };
}

function money(value: unknown): string {
  return `INR ${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function numberToWords(value: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function belowHundred(n: number) {
    if (n < 20) return ones[n];
    const t = Math.floor(n / 10);
    const rem = n % 10;
    return `${tens[t]}${rem ? ` ${ones[rem]}` : ""}`;
  }

  function belowThousand(n: number) {
    if (n < 100) return belowHundred(n);
    const h = Math.floor(n / 100);
    const rem = n % 100;
    return `${ones[h]} Hundred${rem ? ` ${belowHundred(rem)}` : ""}`;
  }

  const rounded = Math.round(value);
  if (rounded === 0) return "Zero Rupees Only";

  let remaining = rounded;
  const parts: string[] = [];

  const crore = Math.floor(remaining / 10000000);
  if (crore > 0) {
    parts.push(`${belowThousand(crore)} Crore`);
    remaining %= 10000000;
  }
  const lakh = Math.floor(remaining / 100000);
  if (lakh > 0) {
    parts.push(`${belowThousand(lakh)} Lakh`);
    remaining %= 100000;
  }
  const thousand = Math.floor(remaining / 1000);
  if (thousand > 0) {
    parts.push(`${belowThousand(thousand)} Thousand`);
    remaining %= 1000;
  }
  if (remaining > 0) {
    parts.push(belowThousand(remaining));
  }

  return `${parts.join(" ")} Rupees Only`;
}

async function fetchImageBuffer(url: string | null | undefined): Promise<Buffer | null> {
  if (!url) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch {
    return null;
  }
}

function formatProgramme(programme: string | null | undefined, name?: string | null): string {
  if (name?.trim()) return name.trim();
  switch (programme) {
    case "PLAYGROUP": return "Playgroup";
    case "NURSERY": return "Nursery";
    case "JUNIOR_KG": return "Junior KG";
    case "SENIOR_KG": return "Senior KG";
    case "DAYCARE": return "Daycare";
    default: return programme ?? "Playgroup";
  }
}

async function pdfBuffer(
  receipt: NonNullable<Awaited<ReturnType<typeof loadReceipt>>>,
  schoolProfile: SchoolProfile,
) {
  const doc = new PDFDocument({
    size: "A4",
    margin: 24,
    info: { Title: `Fee Receipt ${receipt.receiptNumber}` },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  // Pre-fetch images
  const [logoBuf, stampBuf, sigBuf] = await Promise.all([
    fetchImageBuffer(schoolProfile.logoUrl),
    fetchImageBuffer(schoolProfile.stampUrl),
    fetchImageBuffer(schoolProfile.signatureUrl),
  ]);

  const purpleDark = "#25163E";
  const purpleRibbon = "#2D154B";
  const yellowGold = "#F7C934";
  const bluePillBg = "#F0F6FC";
  const boxBorder = "#25163E";

  const studentName = [receipt.student.firstName, receipt.student.middleName, receipt.student.lastName]
    .filter(Boolean)
    .join(" ");
  const admissionNo = receipt.student.admission?.admissionNumber || receipt.student.studentNumber;
  const className = formatProgramme(receipt.student.programme, receipt.student.programmeDefinition?.name);
  const rollNo = receipt.student.studentNumber;

  const primaryGuardian =
    receipt.student.guardians.find((g) => g.isPrimary) ?? receipt.student.guardians[0] ?? null;
  const parentName = primaryGuardian?.name || "Parent / Guardian";
  const contactNo = primaryGuardian?.phone ? `+91 ${primaryGuardian.phone.replace(/^\+?91/, "")}` : `+91 ${schoolProfile.phone}`;
  const paymentMonth = receipt.payment.feePeriodLabel || receipt.payment.paymentDate.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
  const academicYear =
    receipt.payment.invoice?.enrollmentContract?.academicSession ||
    receipt.student.enrollmentContract?.academicSession ||
    "2026-27";

  const amountReceived = Number(receipt.payment.amountReceived);
  const totalAmount = Number(receipt.payment.totalAmount);
  const pendingAmount = Number(receipt.payment.pendingAmount);

  // 1. Outer Border
  doc.roundedRect(24, 24, 547, 794, 14).lineWidth(1.2).strokeColor(boxBorder).stroke();

  // 2. Top-Left Hanging Ribbon
  doc.save();
  doc.polygon([28, 24], [112, 24], [112, 94], [70, 80], [28, 94]).fillColor(purpleRibbon).fill();
  doc.polygon([32, 27], [108, 27], [108, 89], [70, 76], [32, 89]).lineWidth(1).dash(3, { space: 2 }).strokeColor("#FFDE59").stroke();
  doc.undash();
  doc.fillColor("#FFFFFF").fontSize(7.5).font("Helvetica-Bold")
     .text("WHERE KIDS", 32, 36, { width: 76, align: "center" })
     .fillColor("#FFDE59")
     .text("LOVE TO LEARN", 32, 47, { width: 76, align: "center" })
     .fillColor("#FFFFFF")
     .text("AND GROW!", 32, 58, { width: 76, align: "center" });
  doc.restore();

  // Top Left Doodles: Stars & Paper Plane
  doc.save();
  doc.polygon([122, 38], [124, 43], [129, 44], [124, 46], [122, 51], [120, 46], [115, 44], [120, 43]).fillColor(yellowGold).fill();
  doc.moveTo(118, 62).lineTo(136, 52).lineTo(124, 70).lineTo(123, 64).lineTo(118, 62).lineWidth(1).strokeColor(purpleDark).stroke();
  doc.moveTo(123, 64).lineTo(136, 52).stroke();
  doc.restore();

  // 3. Top-Right Box + Smiley
  doc.save();
  doc.circle(360, 48, 11).lineWidth(1.2).strokeColor("#E11D48").stroke();
  doc.circle(356, 46, 1.2).fillColor("#E11D48").fill();
  doc.circle(364, 46, 1.2).fillColor("#E11D48").fill();
  doc.moveTo(356, 51).quadraticCurveTo(360, 55, 364, 51).lineWidth(1.2).strokeColor("#E11D48").stroke();
  doc.restore();

  doc.roundedRect(385, 32, 175, 46, 7).lineWidth(1).strokeColor(boxBorder).stroke();
  doc.fontSize(8.5).fillColor(purpleDark).font("Helvetica-Bold")
     .text("Receipt No. :", 393, 41)
     .font("Helvetica").text(receipt.receiptNumber, 460, 41)
     .font("Helvetica-Bold").text("Receipt Date :", 393, 57)
     .font("Helvetica").text((receipt.payment?.paymentDate || receipt.issuedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }), 460, 57);

  // 4. Center Kidzee Header
  if (logoBuf) {
    doc.image(logoBuf, 210, 30, { fit: [160, 40], align: "center" });
  } else {
    doc.fontSize(22).fillColor(purpleDark).font("Helvetica-Bold").text("KIDZEE", 150, 32, { align: "center", width: 220 });
    doc.fontSize(7.5).font("Helvetica-Bold").fillColor("#5B2A86").text("N U R T U R I N G   G E N - N E X T", 150, 54, { align: "center", width: 220 });
  }

  // Golden Banner
  doc.save();
  doc.rect(185, 74, 160, 18).fillColor(yellowGold).fill();
  doc.fillColor(purpleDark).fontSize(9.5).font("Helvetica-Bold").text("FEE RECEIPT", 185, 78, { align: "center", width: 160 });
  doc.restore();

  // Centre Title
  doc.fontSize(11).font("Helvetica-Bold").fillColor(purpleDark).text(schoolProfile.centreName.toUpperCase(), 100, 96, { align: "center", width: 345 });

  // 5. Contact Pill
  const pillY = 114;
  const pillH = 38;
  doc.save();
  doc.roundedRect(36, pillY, 523, pillH, 8).fillColor(bluePillBg).strokeColor(boxBorder).lineWidth(0.8).fillAndStroke();

  // Dividers
  doc.moveTo(270, pillY + 4).lineTo(270, pillY + 25).lineWidth(0.5).strokeColor("#B8C6DA").stroke();
  doc.moveTo(375, pillY + 4).lineTo(375, pillY + 25).lineWidth(0.5).strokeColor("#B8C6DA").stroke();

  // Address (left)
  doc.fontSize(6.5).fillColor(purpleDark).font("Helvetica")
     .text(schoolProfile.address, 42, pillY + 4, { width: 224, lineGap: 0.8 });

  // Phone (middle)
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(purpleDark)
     .text(`+91 ${schoolProfile.phone}`, 274, pillY + 10, { width: 98, align: "center" });

  // Email (right)
  doc.fontSize(6.8).font("Helvetica").fillColor(purpleDark)
     .text(schoolProfile.email, 378, pillY + 10, { width: 176, align: "center" });

  // Divider line before statutory codes
  doc.moveTo(44, pillY + 27).lineTo(550, pillY + 27).lineWidth(0.5).strokeColor("#D5E0ED").stroke();

  // Statutory line (bottom)
  doc.fontSize(6.5).font("Helvetica-Bold").fillColor("#4B3B68")
     .text(`Centre Code: ${schoolProfile.schoolCode}   ·   GSTIN: ${schoolProfile.gstNumber}`, 44, pillY + 29, { width: 507, align: "center" });
  doc.restore();

  // 6. Student & Parent Particulars (2 columns)
  const partTop = 158;
  const partHeight = 98;
  doc.roundedRect(36, partTop, 523, partHeight, 8).lineWidth(0.8).strokeColor(boxBorder).stroke();
  doc.moveTo(297, partTop).lineTo(297, partTop + partHeight).dash(3, { space: 2 }).strokeColor(boxBorder).stroke();
  doc.undash();

  const leftFields = [
    { label: "Student Name", value: studentName },
    { label: "Admission No.", value: admissionNo },
    { label: "Class / Program", value: className },
    { label: "Roll No.", value: rollNo },
  ];

  const rightFields = [
    { label: "Parent / Guardian Name", value: parentName },
    { label: "Contact No.", value: contactNo },
    { label: "Payment Month", value: paymentMonth },
    { label: "Academic Year", value: academicYear },
  ];

  leftFields.forEach((f, i) => {
    const y = partTop + 10 + i * 21;
    doc.fontSize(7.8).font("Helvetica-Bold").fillColor(purpleDark).text(f.label, 46, y);
    doc.text(":", 130, y);
    doc.font("Helvetica").text(f.value, 138, y);
    doc.moveTo(136, y + 10).lineTo(287, y + 10).lineWidth(0.5).strokeColor("#C5BED0").stroke();
  });

  rightFields.forEach((f, i) => {
    const y = partTop + 10 + i * 21;
    doc.fontSize(7.8).font("Helvetica-Bold").fillColor(purpleDark).text(f.label, 307, y);
    doc.text(":", 410, y);
    doc.font("Helvetica").text(f.value, 418, y);
    doc.moveTo(416, y + 10).lineTo(547, y + 10).lineWidth(0.5).strokeColor("#C5BED0").stroke();
  });

  // 7. Fee Breakdown Section
  const feeTop = 264;
  const invoiceItems = receipt.payment.invoice?.items ?? [];
  doc.roundedRect(36, feeTop, 523, 76, 6).lineWidth(0.6).strokeColor("#D0C6D8").stroke();
  doc.rect(36, feeTop, 523, 18).fillColor("#F5EEF8").fill();
  doc.fontSize(7.8).font("Helvetica-Bold").fillColor(purpleDark)
     .text("Fee Particulars", 46, feeTop + 5)
     .text("Amount", 480, feeTop + 5, { align: "right", width: 65 });

  let curY = feeTop + 23;
  if (invoiceItems.length > 0) {
    for (const item of invoiceItems.slice(0, 2)) {
      doc.fontSize(7.5).font("Helvetica").fillColor("#2C1F3A")
         .text(`${item.title}${item.gstApplicable ? " (GST inclusive)" : ""}`, 46, curY, { width: 400 })
         .font("Helvetica-Bold").text(money(item.totalAmount), 480, curY, { align: "right", width: 65 });
      curY += 12;
    }
  } else {
    doc.fontSize(7.5).font("Helvetica").fillColor("#2C1F3A")
       .text(`Fee Payment (${className}) (GST inclusive)`, 46, curY, { width: 400 })
       .font("Helvetica-Bold").text(money(totalAmount), 480, curY, { align: "right", width: 65 });
  }

  doc.moveTo(36, feeTop + 48).lineTo(559, feeTop + 48).lineWidth(0.5).strokeColor("#E0D8E6").stroke();
  doc.fontSize(7.5).font("Helvetica-Bold").fillColor(purpleDark)
     .text("Total Payable", 46, feeTop + 52)
     .text(money(totalAmount), 480, feeTop + 52, { align: "right", width: 65 });

  doc.fontSize(6.5).font("Helvetica-Oblique").fillColor("#6A5D75")
     .text("Inclusive of GST. The amounts above are the final parent-facing amounts.", 46, feeTop + 64);

  // 8. Total Amount Received Bar
  const totTop = 348;
  doc.save();
  doc.roundedRect(36, totTop, 523, 34, 6).fillColor("#EBE4F0").strokeColor(boxBorder).lineWidth(0.8).fillAndStroke();
  doc.fontSize(8.5).font("Helvetica-Bold").fillColor(purpleDark)
     .text("TOTAL AMOUNT RECEIVED (INR) :", 46, totTop + 7)
     .fontSize(11).text(money(amountReceived), 225, totTop + 5)
     .fontSize(7.5).font("Helvetica").fillColor("#362A48")
     .text(`Amount in words: ${numberToWords(amountReceived)}`, 46, totTop + 21);
  doc.restore();

  // 9. Payment Mode & Received By Row
  const payTop = 390;
  const payHeight = 64;
  doc.roundedRect(36, payTop, 523, payHeight, 6).lineWidth(0.8).strokeColor(boxBorder).stroke();
  doc.moveTo(335, payTop).lineTo(335, payTop + payHeight).lineWidth(0.6).strokeColor("#C5BED0").stroke();

  // Payment Mode
  doc.fontSize(8).font("Helvetica-Bold").fillColor(purpleDark).text("PAYMENT MODE :", 46, payTop + 8);
  const currentMethod = receipt.payment.paymentMethod;
  const modes = [
    { label: "Cash", checked: currentMethod === "CASH" },
    { label: "UPI", checked: currentMethod === "UPI" },
    { label: "Cheque", checked: currentMethod === "CHEQUE" },
    { label: "Bank Transfer", checked: currentMethod === "BANK_TRANSFER" },
  ];
  modes.forEach((m, idx) => {
    const mx = 46 + idx * 70;
    const my = payTop + 28;
    doc.rect(mx, my, 10, 10).lineWidth(0.8).strokeColor(boxBorder).stroke();
    if (m.checked) {
      doc.rect(mx, my, 10, 10).fillColor(purpleDark).fill();
      doc.save();
      doc.moveTo(mx + 2, my + 5).lineTo(mx + 4.5, my + 8).lineTo(mx + 8.5, my + 2.5).lineWidth(1.2).strokeColor("#FFFFFF").stroke();
      doc.restore();
    }
    doc.fontSize(7.8).font(m.checked ? "Helvetica-Bold" : "Helvetica").fillColor(purpleDark).text(m.label, mx + 13, my + 1);
  });

  // Received By
  doc.fontSize(8).font("Helvetica-Bold").fillColor(purpleDark).text("RECEIVED BY :", 345, payTop + 8);
  if (stampBuf) {
    doc.image(stampBuf, 370, payTop + 14, { fit: [42, 42] });
  }
  if (sigBuf) {
    doc.image(sigBuf, 425, payTop + 16, { fit: [75, 36] });
  }
  doc.fontSize(7.5).font("Helvetica-Oblique").fillColor("#5B2A86").text("Authorised Signature", 345, payTop + 52, { align: "right", width: 200 });

  // 10. Terms & Conditions
  const termsTop = 462;
  doc.save();
  doc.roundedRect(36, termsTop, 523, 86, 6).fillColor("#FAFAFC").strokeColor("#D8D0DF").lineWidth(0.6).fillAndStroke();
  doc.fontSize(7.8).font("Helvetica-Bold").fillColor("#5B2A86").text("TERMS & CONDITIONS", 44, termsTop + 6);
  schoolProfile.receiptTerms.slice(0, 6).forEach((t, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const tx = col === 0 ? 44 : 295;
    const ty = termsTop + 20 + row * 20;
    doc.fontSize(6.8).font("Helvetica").fillColor("#554A62").text(`${i + 1}. ${t.replace(/^[0-9]+\.\s*/, "")}`, tx, ty, { width: 245 });
  });
  doc.restore();

  // 11. Bottom Wavy Footer
  const footTop = 760;
  doc.save();
  doc.rect(24, footTop, 547, 58).fillColor("#221037").fill();
  doc.rect(24, footTop, 547, 3).fillColor(yellowGold).fill();
  doc.fillColor("#FFFFFF").fontSize(7).font("Helvetica-Bold")
     .text("SAFE ENVIRONMENT", 36, footTop + 16)
     .fillColor(yellowGold)
     .text("SECURE FUTURE", 36, footTop + 26);

  doc.fontSize(11).font("Helvetica-BoldOblique").fillColor(yellowGold)
     .text("Thank You!", 195, footTop + 14, { align: "center", width: 195 })
     .fontSize(7).font("Helvetica-Bold").fillColor("#FFFFFF")
     .text("FOR YOUR TRUST IN KIDZEE", 195, footTop + 28, { align: "center", width: 195 });

  doc.fillColor("#FFFFFF").fontSize(7).font("Helvetica-Bold")
     .text("NURTURING YOUNG MINDS", 415, footTop + 16, { align: "right", width: 145 })
     .fillColor(yellowGold)
     .text("BUILDING BRIGHT FUTURES", 415, footTop + 26, { align: "right", width: 145 });
  doc.restore();

  doc.end();
  return completed;
}

function loadReceipt(id: string) {
  return prisma.receipt.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          admission: true,
          programmeDefinition: true,
          enrollmentContract: true,
          guardians: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
        },
      },
      payment: {
        include: {
          invoice: {
            include: {
              enrollmentContract: true,
              items: { orderBy: { sortOrder: "asc" } },
            },
          },
        },
      },
    },
  });
}

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const url = new URL(request.url);
  try {
    if (!verifyReceiptDocumentSignature(id, url.searchParams.get("expires"), url.searchParams.get("signature"))) {
      return new NextResponse("Invalid or expired receipt link.", { status: 401 });
    }
    const [receipt, schoolSetting] = await Promise.all([
      loadReceipt(id),
      prisma.centreSetting.findUnique({ where: { key: "SCHOOL_PROFILE" } }),
    ]);
    if (!receipt || receipt.status !== "ISSUED") return new NextResponse("Receipt not found.", { status: 404 });
    const profile = normaliseSchoolProfile(schoolSetting?.value ?? null);
    const buffer = await pdfBuffer(receipt, profile);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${receipt.receiptNumber}.pdf"`,
        "Cache-Control": "private, no-store, max-age=0",
        "X-Robots-Tag": "noindex, nofollow, noarchive",
      },
    });
  } catch {
    return new NextResponse("Receipt is unavailable.", { status: 503 });
  }
}

