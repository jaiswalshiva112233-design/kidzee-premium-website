import { NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { hasAdminPermissionRequirement } from "@/lib/admin/permissions";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server/safeLogging";

type Result = {
  id: string;
  category: "STUDENT" | "ADMISSION" | "BILL" | "RECEIPT" | "CAREER";
  title: string;
  subtitle: string;
  href: string;
  badges: string[];
};

function fullName(person: { firstName: string; middleName?: string | null; lastName?: string | null }) {
  return [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ");
}

function can(session: Awaited<ReturnType<typeof requireAdmin>>, permission: string | readonly string[]) {
  return hasAdminPermissionRequirement(session, permission);
}

export async function GET(request: Request) {
  try {
    const session = await requireAdmin();
    const url = new URL(request.url);
    const query = (url.searchParams.get("q") ?? "").trim().slice(0, 80);

    if (query.length < 2) {
      return NextResponse.json({ success: true, results: [] });
    }

    const canSeeStudents = can(session, ["students.manage", "fees.collect", "attendance.manage"]);
    const canSeeAdmissions = can(session, ["enquiries.manage", "admissions.manage"]);
    const canSeeFinance = can(session, ["fees.collect", "receipts.view"]);
    const canSeeCareers = can(session, "staff.view");

    const [students, admissions, invoices, receipts, careers] = await Promise.all([
      canSeeStudents
        ? prisma.student.findMany({
            where: {
              OR: [
                { firstName: { contains: query, mode: "insensitive" } },
                { middleName: { contains: query, mode: "insensitive" } },
                { lastName: { contains: query, mode: "insensitive" } },
                { studentNumber: { contains: query, mode: "insensitive" } },
                { guardians: { some: { name: { contains: query, mode: "insensitive" } } } },
                { guardians: { some: { phone: { contains: query } } } },
                { programmeDefinition: { is: { name: { contains: query, mode: "insensitive" } } } },
              ],
            },
            select: {
              id: true,
              studentNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              status: true,
              programmeDefinition: { select: { name: true } },
              guardians: { where: { isPrimary: true }, take: 1, select: { name: true, phone: true } },
              enrollmentContract: { select: { preschoolEnabled: true, daycareEnabled: true, mealsEnabled: true, status: true } },
              feeInvoices: { where: { status: { in: ["DUE", "PARTIALLY_PAID", "OVERDUE"] } }, select: { id: true }, take: 1 },
            },
            orderBy: { updatedAt: "desc" },
            take: 8,
          })
        : Promise.resolve([]),
      canSeeAdmissions
        ? prisma.admission.findMany({
            where: {
              studentId: null,
              OR: [
                { admissionNumber: { contains: query, mode: "insensitive" } },
                { enquiry: { is: { parentName: { contains: query, mode: "insensitive" } } } },
                { enquiry: { is: { childName: { contains: query, mode: "insensitive" } } } },
                { enquiry: { is: { phone: { contains: query } } } },
              ],
            },
            select: { id: true, admissionNumber: true, status: true, enquiry: { select: { enquiryNumber: true, parentName: true, childName: true, phone: true } } },
            orderBy: { updatedAt: "desc" },
            take: 6,
          })
        : Promise.resolve([]),
      canSeeFinance
        ? prisma.feeInvoice.findMany({
            where: {
              invoiceNumber: { contains: query, mode: "insensitive" },
            },
            select: { id: true, invoiceNumber: true, status: true, pendingAmount: true, student: { select: { id: true, studentNumber: true, firstName: true, middleName: true, lastName: true } } },
            orderBy: { issueDate: "desc" },
            take: 6,
          })
        : Promise.resolve([]),
      canSeeFinance
        ? prisma.receipt.findMany({
            where: {
              receiptNumber: { contains: query, mode: "insensitive" },
            },
            select: { id: true, receiptNumber: true, status: true, student: { select: { studentNumber: true, firstName: true, middleName: true, lastName: true } } },
            orderBy: { issuedAt: "desc" },
            take: 6,
          })
        : Promise.resolve([]),
      canSeeCareers
        ? prisma.careerApplication.findMany({
            where: {
              OR: [
                { applicationNumber: { contains: query, mode: "insensitive" } },
                { name: { contains: query, mode: "insensitive" } },
                { phone: { contains: query } },
                { email: { contains: query, mode: "insensitive" } },
                { position: { contains: query, mode: "insensitive" } },
              ],
            },
            select: { id: true, applicationNumber: true, name: true, phone: true, position: true, status: true },
            orderBy: { createdAt: "desc" },
            take: 6,
          })
        : Promise.resolve([]),
    ]);

    const results: Result[] = [
      ...students.map((student) => {
        const guardian = student.guardians[0];
        const contract = student.enrollmentContract;
        const badges = [
          contract?.preschoolEnabled ? "Preschool" : null,
          contract?.daycareEnabled ? "Daycare" : null,
          contract?.mealsEnabled ? "Meals" : null,
          student.feeInvoices.length ? "Fee Pending" : null,
          contract?.status === "DRAFT" ? "Admission Started" : null,
        ].filter((value): value is string => Boolean(value));
        return {
          id: student.id,
          category: "STUDENT" as const,
          title: fullName(student),
          subtitle: `${student.studentNumber} · ${student.programmeDefinition?.name ?? "No programme"}${guardian ? ` · ${guardian.name} · ${guardian.phone}` : ""}`,
          href: `/admin/students/${student.id}`,
          badges: badges.length ? badges : [student.status.replaceAll("_", " ")],
        };
      }),
      ...admissions.map((admission) => ({
        id: admission.id,
        category: "ADMISSION" as const,
        title: admission.enquiry?.childName || admission.enquiry?.parentName || admission.admissionNumber,
        subtitle: `${admission.admissionNumber}${admission.enquiry ? ` · ${admission.enquiry.parentName} · ${admission.enquiry.phone}` : ""}`,
        href: `/admin/admissions?search=${encodeURIComponent(admission.admissionNumber)}`,
        badges: [admission.status.replaceAll("_", " ")],
      })),
      ...invoices.map((invoice) => ({
        id: invoice.id,
        category: "BILL" as const,
        title: invoice.invoiceNumber,
        subtitle: `${fullName(invoice.student)} · ${invoice.student.studentNumber} · Balance ₹${Number(invoice.pendingAmount).toLocaleString("en-IN")}`,
        href: `/admin/fees?studentId=${encodeURIComponent(invoice.student.id)}`,
        badges: [invoice.status.replaceAll("_", " ")],
      })),
      ...receipts.map((receipt) => ({
        id: receipt.id,
        category: "RECEIPT" as const,
        title: receipt.receiptNumber,
        subtitle: `${fullName(receipt.student)} · ${receipt.student.studentNumber}`,
        href: `/admin/receipts/${receipt.id}`,
        badges: [receipt.status.replaceAll("_", " ")],
      })),
      ...careers.map((career) => ({
        id: career.id,
        category: "CAREER" as const,
        title: career.name,
        subtitle: `${career.applicationNumber} · ${career.position} · ${career.phone}`,
        href: `/admin/careers?search=${encodeURIComponent(career.applicationNumber)}`,
        badges: ["Career Applicant", career.status.replaceAll("_", " ")],
      })),
    ].slice(0, 24);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHENTICATED") {
      return NextResponse.json({ success: false, message: "Please sign in again." }, { status: 401 });
    }
    logServerError("Admin global search failed.", error);
    return NextResponse.json({ success: false, message: "Search is temporarily unavailable." }, { status: 500 });
  }
}
