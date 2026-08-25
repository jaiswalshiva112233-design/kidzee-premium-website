import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { buildOwnerIntelligence } from "@/lib/admin/owner-intelligence";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Report = { title: string; period: string; columns: string[]; rows: string[][]; notes: string[] };
const operational: Record<string, string> = { revenue: "total-fees", expenses: "expenses", "profit-loss": "net-income", gst: "gst-summary", outstanding: "pending-fees", receipts: "receipt-register", admissions: "admission-register", students: "student-register", attendance: "attendance-register", payroll: "payroll-register" };
const clean = (value: string | null) => (value || "").trim().slice(0, 200);
const html = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
const csv = (value: string) => `"${value.replaceAll('"', '""')}"`;
const number = (value: unknown) => Number(value ?? 0);
const money = (value: unknown) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(number(value));

function indiaDate(value: string, end = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T${end ? "23:59:59.999" : "00:00:00.000"}+05:30`);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function defaultPeriod() {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const [year, month] = today.split("-");
  return { from: new Date(`${year}-${month}-01T00:00:00.000+05:30`), to: new Date(`${today}T23:59:59.999+05:30`) };
}

function sourceName(row: { trafficChannel: string | null; source: string; utmSource: string | null }) {
  if (row.trafficChannel === "ORGANIC_SEARCH") return "Organic";
  if (row.trafficChannel === "GOOGLE_ADS" || row.source === "GOOGLE_ADS") return "Google Ads";
  if (row.trafficChannel === "META_ADS" || row.source === "META_ADS") return "Meta Ads";
  if (row.source === "REFERRAL") return "Referral";
  if (row.source === "WALK_IN") return "Walk-in";
  if (row.source === "PHONE_CALL") return "Phone";
  if (row.source === "WHATSAPP") return "WhatsApp";
  return row.utmSource || "Direct / Website";
}

function csvReport(report: Report) {
  const rows = [[report.title], ["Period", report.period], [], report.columns, ...report.rows, ...(report.notes.length ? [[], ["Notes"], ...report.notes.map((note) => [note])] : [])];
  return `\uFEFF${rows.map((row) => row.map((cell) => csv(String(cell))).join(",")).join("\r\n")}`;
}

function excelReport(report: Report) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial}table{border-collapse:collapse}th,td{border:1px solid #bbb;padding:6px}th{background:#5b2a86;color:#fff}</style></head><body><h1>${html(report.title)}</h1><p><strong>Period:</strong> ${html(report.period)}</p><table><tr>${report.columns.map((cell) => `<th>${html(cell)}</th>`).join("")}</tr>${report.rows.map((row) => `<tr>${row.map((cell) => `<td>${html(cell)}</td>`).join("")}</tr>`).join("")}</table>${report.notes.length ? `<h2>Notes</h2><ul>${report.notes.map((note) => `<li>${html(note)}</li>`).join("")}</ul>` : ""}</body></html>`;
}

async function pdfReport(report: Report) {
  const document = new PDFDocument({ size: "A4", layout: "landscape", margin: 36, bufferPages: true, info: { Title: report.title, Creator: "Kidzee CentreOS" } });
  const chunks: Buffer[] = []; const completed = new Promise<Buffer>((resolve, reject) => { document.on("data", (chunk: Buffer) => chunks.push(Buffer.from(chunk))); document.on("end", () => resolve(Buffer.concat(chunks))); document.on("error", reject); });
  document.fillColor("#2D1736").font("Helvetica-Bold").fontSize(20).text(report.title).font("Helvetica").fontSize(9).fillColor("#6D6170").text(`Period: ${report.period}`).moveDown();
  const widths = report.columns.map(() => (document.page.width - 72) / Math.max(1, report.columns.length)); let y = document.y;
  const header = () => { let x = 36; document.font("Helvetica-Bold").fontSize(7); report.columns.forEach((column, index) => { document.rect(x, y, widths[index], 24).fillAndStroke("#5B2A86", "#5B2A86"); document.fillColor("#FFFFFF").text(column, x + 4, y + 7, { width: widths[index] - 8 }); x += widths[index]; }); y += 24; };
  header(); document.font("Helvetica").fontSize(6.5);
  for (const row of report.rows) { if (y > document.page.height - 68) { document.addPage(); y = 36; header(); } let x = 36; row.forEach((cell, index) => { document.rect(x, y, widths[index], 28).fillAndStroke("#FFFFFF", "#E7DFEA"); document.fillColor("#3B2D42").text(cell.slice(0, 90), x + 4, y + 5, { width: widths[index] - 8, height: 20, ellipsis: true }); x += widths[index]; }); y += 28; }
  if (!report.rows.length) document.fillColor("#6D6170").fontSize(10).text("No records matched the selected filters.", 36, y + 16);
  document.end(); return completed;
}

async function marketingReport(kind: string, from: Date, to: Date, campaign: string, landingPage: string): Promise<Report> {
  const rows = await prisma.websiteLeadSubmission.findMany({ where: { receivedAt: { gte: from, lte: to }, leadType: "admission", trafficClass: "GENUINE", isInternal: false, isTest: false, isBot: false, ...(campaign ? { utmCampaign: { contains: campaign, mode: "insensitive" } } : {}), ...(landingPage ? { landingPage: { contains: landingPage, mode: "insensitive" } } : {}) }, select: { receivedAt: true, source: true, trafficChannel: true, utmSource: true, utmCampaign: true, landingPage: true, enquiry: { select: { status: true, admission: { select: { status: true } } } } }, orderBy: { receivedAt: "desc" } });
  const filtered = rows.filter((row) => { const source = sourceName(row); if (kind === "organic") return source === "Organic"; if (kind === "google-ads") return source === "Google Ads"; if (kind === "meta") return source === "Meta Ads"; if (kind === "blogs") return (row.landingPage || "").includes("/blog/"); return true; });
  return { title: `${kind.replaceAll("-", " ").replace(/\b\w/g, (part) => part.toUpperCase())} Intelligence`, period: `${from.toLocaleDateString("en-IN")} to ${to.toLocaleDateString("en-IN")}`, columns: ["Date", "Source", "Campaign", "Landing Page", "Lead Status", "Admission"], rows: filtered.map((row) => [row.receivedAt.toLocaleDateString("en-IN"), sourceName(row), row.utmCampaign || "—", row.landingPage || "/", row.enquiry.status, row.enquiry.admission?.status || "—"]), notes: ["Only genuine, non-test lead submissions are included.", campaign ? `Campaign filter: ${campaign}` : "All campaigns", landingPage ? `Landing page filter: ${landingPage}` : "All landing pages"] };
}

async function programmeReport(from: Date, to: Date, programme: string): Promise<Report> {
  const rows = await prisma.feePayment.findMany({ where: { paymentDate: { gte: from, lte: to }, status: { in: ["PAID", "PARTIALLY_PAID"] }, ...(programme ? { student: { programmeDefinition: { name: { contains: programme, mode: "insensitive" } } } } : {}) }, select: { paymentDate: true, amountReceived: true, student: { select: { studentNumber: true, firstName: true, lastName: true, programme: true, programmeDefinition: { select: { name: true } } } } }, orderBy: { paymentDate: "desc" } });
  return { title: "Programme Revenue", period: `${from.toLocaleDateString("en-IN")} to ${to.toLocaleDateString("en-IN")}`, columns: ["Date", "Programme", "Student", "Student No.", "Collected"], rows: rows.map((row) => [row.paymentDate.toLocaleDateString("en-IN"), row.student.programmeDefinition?.name || row.student.programme.replaceAll("_", " "), `${row.student.firstName} ${row.student.lastName || ""}`.trim(), row.student.studentNumber, money(row.amountReceived)]), notes: [programme ? `Programme filter: ${programme}` : "All programmes"] };
}

async function teacherReport(from: Date, to: Date, teacher: string): Promise<Report> {
  const rows = await prisma.staffAttendance.findMany({ where: { attendanceDate: { gte: from, lte: to }, ...(teacher ? { staff: { name: { contains: teacher, mode: "insensitive" } } } : {}) }, select: { attendanceDate: true, status: true, checkInAt: true, checkOutAt: true, isSandwichDay: true, staff: { select: { staffNumber: true, name: true, designation: true } } }, orderBy: [{ attendanceDate: "desc" }, { staff: { name: "asc" } }] });
  return { title: "Teacher Attendance", period: `${from.toLocaleDateString("en-IN")} to ${to.toLocaleDateString("en-IN")}`, columns: ["Date", "Staff No.", "Teacher", "Designation", "Status", "Check In", "Check Out", "Sandwich"], rows: rows.map((row) => [row.attendanceDate.toLocaleDateString("en-IN"), row.staff.staffNumber, row.staff.name, row.staff.designation, row.status, row.checkInAt?.toLocaleTimeString("en-IN") || "—", row.checkOutAt?.toLocaleTimeString("en-IN") || "—", row.isSandwichDay ? "Yes" : "No"]), notes: [teacher ? `Teacher filter: ${teacher}` : "All teachers"] };
}

async function snapshotReport(kind: string): Promise<Report> {
  const snapshot = await buildOwnerIntelligence(); const rows: string[][] = [];
  if (kind === "forecast") for (const item of snapshot.forecasts) rows.push([item.label, String(item.forecast), item.confidence, item.historicalBasis, "Estimate, not a guarantee"]);
  else if (kind === "audit") { for (const item of snapshot.health) rows.push([item.service, item.status, item.summary, item.lastChecked]); for (const job of snapshot.metrics.audit.scheduledJobs) rows.push([job.jobName, job.status, job.lastError || "No failure", job.lastSucceededAt?.toISOString() || "Not yet"]); }
  else { const group = kind === "executive" || kind === "conversion-funnel" ? snapshot.metrics.executive : kind === "meals" || kind === "daycare-revenue" ? snapshot.metrics.finance : snapshot.metrics.finance; for (const [key, value] of Object.entries(group)) if (typeof value === "number" || typeof value === "string") rows.push([key.replace(/([a-z])([A-Z])/g, "$1 $2"), typeof value === "number" && /revenue|collection|expense|outstanding|salary|profit|refund|fee/i.test(key) ? money(value) : String(value)]); }
  return { title: kind.replaceAll("-", " ").replace(/\b\w/g, (part) => part.toUpperCase()), period: `${new Date(snapshot.period.start).toLocaleDateString("en-IN")} to ${new Date(snapshot.period.end).toLocaleDateString("en-IN")}`, columns: kind === "forecast" ? ["Forecast", "Estimate", "Confidence", "Historical Basis", "Disclosure"] : kind === "audit" ? ["Service / Job", "Status", "Evidence", "Last Checked / Success"] : ["Metric", "Value"], rows, notes: ["Generated from the latest verified CentreOS records."] };
}

export async function GET(request: Request) {
  try {
    const session = await getAdminSession(); if (!session || session.role !== "OWNER") return NextResponse.json({ success: false, message: "Owner access is required." }, { status: 403 });
    const url = new URL(request.url); const kind = clean(url.searchParams.get("report")) || "executive"; const format = clean(url.searchParams.get("format")).toUpperCase();
    if (operational[kind]) { const target = new URL("/api/admin/reports/ca-export", url.origin); target.searchParams.set("report", operational[kind]); for (const key of ["format", "from", "to"]) { const value = clean(url.searchParams.get(key)); if (value) target.searchParams.set(key, value); } return NextResponse.redirect(target, 307); }
    const fallback = defaultPeriod(); const from = indiaDate(clean(url.searchParams.get("from"))) || fallback.from; const to = indiaDate(clean(url.searchParams.get("to")), true) || fallback.to; if (from > to) return NextResponse.json({ success: false, message: "The starting date cannot be after the ending date." }, { status: 400 });
    const campaign = clean(url.searchParams.get("campaign")); const landingPage = clean(url.searchParams.get("landingPage")); const programme = clean(url.searchParams.get("programme")); const teacher = clean(url.searchParams.get("teacher"));
    let report: Report;
    if (["marketing", "organic", "google-ads", "meta", "landing-pages", "blogs"].includes(kind)) report = await marketingReport(kind, from, to, campaign, landingPage);
    else if (kind === "programme-revenue") report = await programmeReport(from, to, programme);
    else if (kind === "teacher-attendance") report = await teacherReport(from, to, teacher);
    else report = await snapshotReport(kind);
    const slug = report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
    if (format === "CSV") return new NextResponse(csvReport(report), { headers: { ...headers, "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}.csv"` } });
    if (format === "EXCEL") return new NextResponse(excelReport(report), { headers: { ...headers, "Content-Type": "application/vnd.ms-excel; charset=utf-8", "Content-Disposition": `attachment; filename="${slug}.xls"` } });
    const pdf = await pdfReport(report); return new NextResponse(new Uint8Array(pdf), { headers: { ...headers, "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${slug}.pdf"` } });
  } catch (error) { logServerError("Owner intelligence report failed", error); return NextResponse.json({ success: false, message: "The Owner intelligence report could not be generated." }, { status: 500 }); }
}
