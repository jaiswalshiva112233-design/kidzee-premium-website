import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type WithdrawalBody = {
  leavingDate?: unknown;
  reason?: unknown;
  feeTreatment?: unknown;
  finalAdjustment?: unknown;
  pendingFeeAction?: unknown;
  remarks?: unknown;
};

const ALLOWED_FEE_TREATMENTS = [
  "STOP_FROM_CURRENT_MONTH",
  "CHARGE_FULL_CURRENT_MONTH",
  "CHARGE_UP_TO_LEAVING_DATE",
  "MANUAL_ADJUSTMENT",
] as const;

const ALLOWED_PENDING_ACTIONS = [
  "KEEP_PENDING",
  "MARK_WAIVED",
  "REVIEW_LATER",
] as const;

type FeeTreatment =
  (typeof ALLOWED_FEE_TREATMENTS)[number];

type PendingFeeAction =
  (typeof ALLOWED_PENDING_ACTIONS)[number];

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseDate(value: unknown) {
  const cleaned = cleanText(value);

  if (!cleaned) {
    return null;
  }

  const date = new Date(`${cleaned}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseMoney(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  const cleaned = cleanText(value).replace(
    /,/g,
    "",
  );

  if (!cleaned) {
    return 0;
  }

  const parsed = Number(cleaned);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function isFeeTreatment(
  value: string,
): value is FeeTreatment {
  return ALLOWED_FEE_TREATMENTS.includes(
    value as FeeTreatment,
  );
}

function isPendingFeeAction(
  value: string,
): value is PendingFeeAction {
  return ALLOWED_PENDING_ACTIONS.includes(
    value as PendingFeeAction,
  );
}

function formatFeeTreatment(
  value: FeeTreatment,
) {
  const labels: Record<FeeTreatment, string> = {
    STOP_FROM_CURRENT_MONTH:
      "Stop fees from current month",
    CHARGE_FULL_CURRENT_MONTH:
      "Charge full current month",
    CHARGE_UP_TO_LEAVING_DATE:
      "Charge fees up to leaving date",
    MANUAL_ADJUSTMENT:
      "Manual final adjustment",
  };

  return labels[value];
}

function formatPendingAction(
  value: PendingFeeAction,
) {
  const labels: Record<
    PendingFeeAction,
    string
  > = {
    KEEP_PENDING:
      "Keep existing pending balance",
    MARK_WAIVED:
      "Pending balance to be waived",
    REVIEW_LATER:
      "Pending balance to be reviewed later",
  };

  return labels[value];
}

function buildWithdrawalNote({
  existingNotes,
  leavingDate,
  reason,
  feeTreatment,
  finalAdjustment,
  pendingFeeAction,
  remarks,
}: {
  existingNotes: string | null;
  leavingDate: Date;
  reason: string;
  feeTreatment: FeeTreatment;
  finalAdjustment: number;
  pendingFeeAction: PendingFeeAction;
  remarks: string;
}) {
  const dateText =
    new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Kolkata",
    }).format(leavingDate);

  const lines = [
    "STUDENT WITHDRAWAL",
    `Leaving date: ${dateText}`,
    `Reason: ${reason}`,
    `Fee treatment: ${formatFeeTreatment(
      feeTreatment,
    )}`,
    `Pending fee action: ${formatPendingAction(
      pendingFeeAction,
    )}`,
  ];

  if (
    feeTreatment === "MANUAL_ADJUSTMENT"
  ) {
    lines.push(
      `Final adjustment: ₹${finalAdjustment.toFixed(
        2,
      )}`,
    );
  }

  if (remarks) {
    lines.push(`Remarks: ${remarks}`);
  }

  lines.push(
    `Recorded at: ${new Intl.DateTimeFormat(
      "en-IN",
      {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
      },
    ).format(new Date())}`,
  );

  const withdrawalEntry = lines.join("\n");

  if (!existingNotes?.trim()) {
    return withdrawalEntry;
  }

  return `${existingNotes.trim()}\n\n${withdrawalEntry}`;
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await getAdminSession();

    if (!session) {
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

    const { id } = await context.params;

    let body: WithdrawalBody;

    try {
      body =
        (await request.json()) as WithdrawalBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid withdrawal request.",
        },
        {
          status: 400,
        },
      );
    }

    const leavingDateKey = cleanText(body.leavingDate);
    const leavingDate = parseDate(leavingDateKey);

    const reason = cleanText(body.reason);

    const feeTreatmentValue = cleanText(
      body.feeTreatment,
    );

    const pendingFeeActionValue = cleanText(
      body.pendingFeeAction,
    );

    const finalAdjustment = parseMoney(
      body.finalAdjustment,
    );

    const remarks = cleanText(body.remarks);

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student ID is missing.",
        },
        {
          status: 400,
        },
      );
    }

    if (!leavingDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid leaving date.",
        },
        {
          status: 400,
        },
      );
    }

    const todayKey = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());

    if (leavingDateKey > todayKey) {
      return NextResponse.json(
        {
          success: false,
          message:
            "A future leaving date cannot be applied as an immediate withdrawal.",
        },
        { status: 400 },
      );
    }

    if (!reason) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter the reason for withdrawal.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isFeeTreatment(
        feeTreatmentValue,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select how the final month fee should be handled.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      !isPendingFeeAction(
        pendingFeeActionValue,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select how existing pending fees should be handled.",
        },
        {
          status: 400,
        },
      );
    }

    if (finalAdjustment < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Final adjustment cannot be negative.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      feeTreatmentValue ===
        "MANUAL_ADJUSTMENT" &&
      finalAdjustment <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter the final adjustment amount.",
        },
        {
          status: 400,
        },
      );
    }

    const student =
      await prisma.student.findUnique({
        where: {
          id,
        },

        select: {
          id: true,
          studentNumber: true,
          firstName: true,
          middleName: true,
          lastName: true,
          status: true,
          joiningDate: true,
          notes: true,
        },
      });

    if (!student) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Student record was not found.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      student.status === "WITHDRAWN"
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This student is already withdrawn.",
        },
        {
          status: 409,
        },
      );
    }

    if (
      leavingDate <
      student.joiningDate
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Leaving date cannot be before the joining date.",
        },
        {
          status: 400,
        },
      );
    }

    const updatedNotes =
      buildWithdrawalNote({
        existingNotes: student.notes,
        leavingDate,
        reason,
        feeTreatment:
          feeTreatmentValue,
        finalAdjustment,
        pendingFeeAction:
          pendingFeeActionValue,
        remarks,
      });

    const result =
      await prisma.$transaction(
        async (transaction) => {
          const leavingDayEnd = new Date(
            `${leavingDateKey}T23:59:59.999+05:30`,
          );
          const updatedStudent =
            await transaction.student.update({
              where: {
                id,
              },

              data: {
                status: "WITHDRAWN",
                leavingDate,
                notes: updatedNotes,
              },
            });

          /*
           * Stops this student’s active fee
           * structures from being used for future
           * monthly invoice generation.
           *
           * Existing payments and receipts remain
           * unchanged.
           */
          await transaction.studentFeeAccount.updateMany(
            {
              where: {
                studentId: id,
                active: true,
              },

              data: {
                active: false,
                endDate: leavingDate,
              },
            },
          );

          const activeDaycarePlans =
            await transaction.studentDaycarePlan.findMany({
              where: {
                studentId: id,
                active: true,
              },
              select: {
                id: true,
                effectiveFrom: true,
              },
            });

          for (const plan of activeDaycarePlans) {
            const billingStoppedAt =
              leavingDate < plan.effectiveFrom
                ? plan.effectiveFrom
                : leavingDate;
            await transaction.studentDaycarePlan.update({
              where: { id: plan.id },
              data: {
                active: false,
                lifecycleStatus: "INACTIVE",
                billingStoppedAt,
                effectiveTo:
                  plan.effectiveFrom > leavingDayEnd
                    ? plan.effectiveFrom
                    : leavingDayEnd,
              },
            });
          }

          await transaction.daycareSession.updateMany({
            where: {
              studentId: id,
              sessionDate: { gt: leavingDayEnd },
              feeInvoiceId: null,
              status: { not: "CANCELLED" },
            },
            data: { status: "CANCELLED" },
          });

          await transaction.activityLog.create({
            data: {
              adminUserId: session.userId,
              action: "UPDATED",
              entityType: "Student",
              entityId: id,
              description: `Student ${student.studentNumber} was withdrawn effective ${leavingDate.toISOString()}.`,
              previousData: {
                status: student.status,
                leavingDate: null,
              },
              newData: {
                status: "WITHDRAWN",
                leavingDate:
                  leavingDate.toISOString(),
                reason,
                feeTreatment:
                  feeTreatmentValue,
                finalAdjustment,
                pendingFeeAction:
                  pendingFeeActionValue,
                remarks,
              },
            },
          });

          return updatedStudent;
        },
      );

    const fullName = [
      student.firstName,
      student.middleName,
      student.lastName,
    ]
      .filter(Boolean)
      .join(" ");

    return NextResponse.json({
      success: true,

      message: `${fullName} has been withdrawn successfully. Future attendance and monthly fee generation will stop.`,

      student: {
        id: result.id,
        studentNumber:
          result.studentNumber,
        status: result.status,
        leavingDate:
          result.leavingDate,
      },

      withdrawal: {
        reason,
        feeTreatment:
          feeTreatmentValue,
        pendingFeeAction:
          pendingFeeActionValue,
        finalAdjustment,
        remarks,
      },
    });
  } catch (error) {
    console.error(
      "Unable to withdraw student:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The student could not be withdrawn. Please try again. If the problem continues, contact the Owner.",
      },
      {
        status: 500,
      },
    );
  }
}
