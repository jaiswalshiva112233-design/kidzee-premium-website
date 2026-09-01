import type { $Enums, Prisma } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";
import { getNextSequence } from "@/lib/numbering";

class LedgerRequestError extends Error {
  constructor(message: string, readonly status = 400) {
    super(message);
  }
}

const ALLOWED_CATEGORIES = new Set<$Enums.FeeCategory>([
  "ANNUAL_FEE",
  "ACTIVITY_FEE",
  "KIT_FEE",
  "FOOD_FEE",
  "DAYCARE_FEE",
  "OTHER",
]);

function cleanText(value: unknown, maximum = 500) {
  return typeof value === "string" ? value.trim().slice(0, maximum) : "";
}

function parseDate(value: unknown) {
  const text = cleanText(value, 30);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const date = new Date(`${text}T00:00:00.000+05:30`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function money(value: unknown) {
  const amount = Number(value);
  return Number.isFinite(amount) ? Math.round((amount + Number.EPSILON) * 100) / 100 : Number.NaN;
}

function normaliseAcademicYear(value: unknown) {
  const raw = cleanText(value, 20);
  const match = /^(\d{4})-(\d{2}|\d{4})$/.exec(raw);
  if (!match) return null;
  const startYear = Number(match[1]);
  const expectedEndYear = startYear + 1;
  const suppliedEndYear = match[2].length === 2
    ? Number(`${String(startYear).slice(0, 2)}${match[2]}`)
    : Number(match[2]);
  return suppliedEndYear === expectedEndYear
    ? `${startYear}-${String(expectedEndYear).slice(-2)}`
    : null;
}

function isOwner(session: Awaited<ReturnType<typeof getAdminSession>>) {
  return Boolean(session && (session.role === "OWNER" || session.permissions.includes("*")));
}

function serialise<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, item) => {
      if (typeof item === "object" && item && "toNumber" in item && typeof item.toNumber === "function") {
        return item.toNumber();
      }
      return item;
    }),
  ) as T;
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "You are not authorised." }, { status: 401 });
  }
  const studentId = cleanText(new URL(request.url).searchParams.get("studentId"), 100);
  if (!studentId) {
    return NextResponse.json({ success: false, message: "Choose a student." }, { status: 400 });
  }
  const [definitions, charges] = await Promise.all([
    prisma.chargeDefinition.findMany({
      where: { active: true },
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    }),
    prisma.studentCharge.findMany({
      where: { studentId },
      include: {
        definition: { select: { name: true } },
        feeInvoice: { select: { id: true, invoiceNumber: true, status: true } },
        createdBy: { select: { name: true } },
        approvedBy: { select: { name: true } },
      },
      orderBy: [{ chargeDate: "desc" }, { createdAt: "desc" }],
      take: 250,
    }),
  ]);
  return NextResponse.json({
    success: true,
    canApprove: isOwner(session),
    definitions: serialise(definitions),
    charges: serialise(charges),
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "You are not authorised." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = cleanText(body.action, 40);

    if (action === "create") {
      const studentId = cleanText(body.studentId, 100);
      const definitionId = cleanText(body.definitionId, 100);
      const chargeDate = parseDate(body.chargeDate);
      const amountOverride = cleanText(body.amount, 40);
      const academicYear = cleanText(body.academicYear, 20)
        ? normaliseAcademicYear(body.academicYear)
        : null;
      const idempotencyKey = cleanText(body.idempotencyKey, 100);
      if (!studentId || !definitionId || !chargeDate || !idempotencyKey) {
        throw new LedgerRequestError("Choose the student, charge type and charge date.");
      }

      const [student, definition] = await Promise.all([
        prisma.student.findUnique({
          where: { id: studentId },
          select: {
            id: true,
            studentNumber: true,
            status: true,
            enrollmentContract: { select: { id: true } },
          },
        }),
        prisma.chargeDefinition.findFirst({ where: { id: definitionId, active: true } }),
      ]);
      if (!student || student.status !== "ACTIVE") throw new LedgerRequestError("Choose an active student.", 404);
      if (!definition || !ALLOWED_CATEGORIES.has(definition.category)) throw new LedgerRequestError("The selected charge type is no longer available.", 409);

      const amount = amountOverride ? money(amountOverride) : money(definition.defaultAmount);
      if (!Number.isFinite(amount) || amount <= 0) throw new LedgerRequestError("Enter a charge amount greater than zero.");
      if (["ANNUAL_FEE", "KIT_FEE"].includes(definition.category) && !academicYear) {
        throw new LedgerRequestError("Enter the academic year for annual or kit charges.");
      }
      const chargeKey = ["ANNUAL_FEE", "KIT_FEE"].includes(definition.category)
        ? `${definition.category.toLowerCase()}:${studentId}:${academicYear}`
        : `manual:${studentId}:${idempotencyKey}`;

      const result = await prisma.$transaction(async (tx) => {
        if (["ANNUAL_FEE", "KIT_FEE"].includes(definition.category) && academicYear) {
          const existingSessionCharge = await tx.studentCharge.findFirst({
            where: {
              studentId,
              category: definition.category,
              academicYear,
              status: { notIn: ["WAIVED", "CANCELLED"] },
            },
            orderBy: { createdAt: "asc" },
          });
          if (existingSessionCharge) return { charge: existingSessionCharge, replayed: true };
        }
        const existing = await tx.studentCharge.findUnique({ where: { chargeKey } });
        if (existing) return { charge: existing, replayed: true };
        if (["ANNUAL_FEE", "KIT_FEE"].includes(definition.category) && academicYear) {
          const automaticPrefixes = definition.category === "ANNUAL_FEE"
            ? ["programme-annual:", "programme-annual-kit:"]
            : ["programme-kit:", "programme-annual-kit:"];
          const alreadyBilled = await tx.feeInvoiceItem.findFirst({
            where: {
              category: { in: ["ANNUAL_FEE", "KIT_FEE"] },
              invoice: { studentId },
              OR: automaticPrefixes.map((prefix) => ({
                chargeKey: {
                  startsWith: `${prefix}${studentId}:`,
                  endsWith: `:${academicYear.slice(0, 4)}`,
                },
              })),
            },
            select: { id: true },
          });
          if (alreadyBilled) {
            throw new LedgerRequestError(
              `The ${definition.category === "KIT_FEE" ? "kit" : "annual"} fee for ${academicYear} is already on this child's financial history.`,
              409,
            );
          }
        }
        const sequence = await getNextSequence(tx, { key: "STUDENT_CHARGE", prefix: "KZ-CHG", minimumWidth: 4 });
        const ownerApproved = isOwner(session);
        const charge = await tx.studentCharge.create({
          data: {
            chargeNumber: sequence.formattedNumber,
            chargeKey,
            studentId,
            enrollmentContractId: student.enrollmentContract?.id ?? null,
            definitionId: definition.id,
            category: definition.category,
            title: definition.name,
            detail: definition.description,
            chargeDate,
            academicYear,
            amount,
            gstApplicable: definition.gstApplicable,
            gstRate: definition.gstApplicable ? definition.gstRate : null,
            priceType: definition.priceType,
            status: "PENDING",
            approved: ownerApproved,
            approvedAt: ownerApproved ? new Date() : null,
            approvedById: ownerApproved ? session.userId : null,
            createdById: session.userId,
            notes: cleanText(body.notes, 2000) || null,
          },
        });
        await tx.activityLog.create({
          data: {
            adminUserId: session.userId,
            action: "CREATED",
            entityType: "StudentCharge",
            entityId: charge.id,
            description: `${charge.chargeNumber} added to ${student.studentNumber}'s pending ledger.`,
            newData: { studentId, category: charge.category, amount, chargeDate: chargeDate.toISOString(), academicYear, approved: ownerApproved },
          },
        });
        return { charge, replayed: false };
      }, { isolationLevel: "Serializable" });

      return NextResponse.json({
        success: true,
        replayed: result.replayed,
        message: result.replayed
          ? "This charge was already saved; no duplicate was created."
          : result.charge.approved
            ? "Charge saved and approved for the next combined bill."
            : "Charge saved for Owner approval.",
        charge: serialise(result.charge),
      });
    }

    if (!["approve", "waive", "cancel"].includes(action) || !isOwner(session)) {
      throw new LedgerRequestError("Only the Owner can approve, waive or cancel a charge.", 403);
    }
    const chargeId = cleanText(body.chargeId, 100);
    const reason = cleanText(body.reason, 1000);
    if (!chargeId) throw new LedgerRequestError("Choose a ledger charge.");
    if (["waive", "cancel"].includes(action) && reason.length < 3) {
      throw new LedgerRequestError("Enter the reason for this financial change.");
    }

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.studentCharge.findUnique({ where: { id: chargeId } });
      if (!existing) throw new LedgerRequestError("The ledger charge was not found.", 404);
      if (existing.feeInvoiceId || ["BILLED", "PAID"].includes(existing.status)) {
        throw new LedgerRequestError("An invoiced charge cannot be changed. Use the invoice adjustment or reversal workflow.", 409);
      }
      const data: Prisma.StudentChargeUpdateInput = action === "approve"
        ? { approved: true, approvedAt: new Date(), approvedBy: { connect: { id: session.userId } }, status: "PENDING" }
        : action === "waive"
          ? { approved: false, approvedAt: null, approvedBy: { disconnect: true }, status: "WAIVED", cancellationReason: reason }
          : { approved: false, approvedAt: null, approvedBy: { disconnect: true }, status: "CANCELLED", cancellationReason: reason };
      const charge = await tx.studentCharge.update({ where: { id: existing.id }, data });
      await tx.activityLog.create({
        data: {
          adminUserId: session.userId,
          action: "UPDATED",
          entityType: "StudentCharge",
          entityId: existing.id,
          description: `${existing.chargeNumber} was ${action === "approve" ? "approved" : action === "waive" ? "waived" : "cancelled"}.`,
          previousData: { status: existing.status, approved: existing.approved },
          newData: { status: charge.status, approved: charge.approved, reason: reason || null },
        },
      });
      return charge;
    });
    return NextResponse.json({ success: true, message: `Charge ${action === "approve" ? "approved" : action === "waive" ? "waived" : "cancelled"}.`, charge: serialise(updated) });
  } catch (error) {
    if (error instanceof LedgerRequestError) {
      return NextResponse.json({ success: false, message: error.message }, { status: error.status });
    }
    if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
      return NextResponse.json({ success: false, message: "This charge already exists; no duplicate was created." }, { status: 409 });
    }
    return NextResponse.json({ success: false, message: "The student ledger could not be updated. Please try again. If the problem continues, contact the Owner." }, { status: 500 });
  }
}
