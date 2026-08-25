import PDFDocument from "pdfkit";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { verifyReceiptDocumentSignature } from "@/lib/whatsapp/receiptLink";

type RouteContext = { params: Promise<{ id: string }> };

function money(value: unknown) {
  return `INR ${Number(value ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

async function pdfBuffer(receipt: NonNullable<Awaited<ReturnType<typeof loadReceipt>>>) {
  const document = new PDFDocument({ size: "A4", margin: 48, info: { Title: `Fee Receipt ${receipt.receiptNumber}` } });
  const chunks: Buffer[] = [];
  document.on("data", (chunk: Buffer) => chunks.push(chunk));
  const completed = new Promise<Buffer>((resolve, reject) => {
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);
  });
  document.fontSize(20).fillColor("#2D1736").text("Kidzee Preschool & Daycare", { align: "center" });
  document.fontSize(11).fillColor("#5B2A86").text("Sector 12B, Dwarka · Fee Receipt", { align: "center" });
  document.moveDown(1.5).strokeColor("#E5DCE9").moveTo(48, document.y).lineTo(547, document.y).stroke();
  document.moveDown().fontSize(11).fillColor("#2D1736");
  document.text(`Receipt: ${receipt.receiptNumber}`);
  document.text(`Issued: ${receipt.issuedAt.toLocaleDateString("en-IN")}`);
  document.text(`Student: ${[receipt.student.firstName, receipt.student.middleName, receipt.student.lastName].filter(Boolean).join(" ")}`);
  document.text(`Student number: ${receipt.student.studentNumber}`);
  document.text(`Invoice: ${receipt.payment.invoice?.invoiceNumber ?? "—"}`);
  document.moveDown();
  for (const item of receipt.payment.invoice?.items ?? []) {
    document.text(`${item.title}  ${money(item.totalAmount)}`, { continued: false });
  }
  document.moveDown().fontSize(13).text(`Amount received: ${money(receipt.payment.amountReceived)}`, { align: "right" });
  if (Number(receipt.payment.pendingAmount) > 0) document.fontSize(11).text(`Balance pending: ${money(receipt.payment.pendingAmount)}`, { align: "right" });
  document.moveDown(2).fontSize(10).fillColor("#625768").text("Inclusive of GST. This computer-generated receipt does not require a signature.", { align: "center" });
  document.end();
  return completed;
}

function loadReceipt(id: string) {
  return prisma.receipt.findUnique({
    where: { id },
    include: {
      student: { select: { studentNumber: true, firstName: true, middleName: true, lastName: true } },
      payment: { include: { invoice: { include: { items: { orderBy: { createdAt: "asc" } } } } } },
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
    const receipt = await loadReceipt(id);
    if (!receipt || receipt.status !== "ISSUED") return new NextResponse("Receipt not found.", { status: 404 });
    const buffer = await pdfBuffer(receipt);
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
