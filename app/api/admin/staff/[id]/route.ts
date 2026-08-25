import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type UpdateStaffBody = {
  name?: unknown;
  phone?: unknown;
  alternatePhone?: unknown;
  email?: unknown;
  designation?: unknown;
  joiningDate?: unknown;
  leavingDate?: unknown;
  status?: unknown;
  monthlySalary?: unknown;
  paidLeaveCycle?: unknown;
  paidLeaveAllowance?: unknown;
  address?: unknown;
  emergencyContact?: unknown;
  notes?: unknown;
};

const STAFF_STATUSES = [
  "ACTIVE",
  "INACTIVE",
  "LEFT",
] as const;

const PAID_LEAVE_CYCLES = [
  "NONE",
  "MONTHLY",
  "YEARLY",
] as const;

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function cleanOptionalText(value: unknown) {
  const text = cleanText(value);
  return text || null;
}

function cleanPhone(value: unknown) {
  return cleanText(value).replace(/\D/g, "");
}

function isValidPhone(value: string) {
  return value.length >= 10 && value.length <= 15;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isStaffStatus(
  value: string,
): value is $Enums.StaffStatus {
  return STAFF_STATUSES.includes(
    value as $Enums.StaffStatus,
  );
}

function isPaidLeaveCycle(
  value: string,
): value is $Enums.StaffPaidLeaveCycle {
  return PAID_LEAVE_CYCLES.includes(
    value as $Enums.StaffPaidLeaveCycle,
  );
}

function parseDate(value: unknown) {
  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const date = new Date(`${text}T00:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function parseSalary(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const amount =
    typeof value === "number"
      ? value
      : Number(cleanText(value).replace(/,/g, ""));

  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 10000000
  ) {
    return undefined;
  }

  return Math.round(amount * 100) / 100;
}

function parseLeaveAllowance(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return undefined;
  }

  const amount =
    typeof value === "number"
      ? value
      : Number(cleanText(value));

  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    amount > 366
  ) {
    return null;
  }

  return Math.round(amount * 100) / 100;
}

function staffAuditData(staff: {
  staffNumber: string;
  name: string;
  phone: string;
  alternatePhone: string | null;
  email: string | null;
  designation: string;
  joiningDate: Date;
  leavingDate: Date | null;
  status: $Enums.StaffStatus;
  monthlySalary: {
    toString(): string;
  } | null;
  paidLeaveCycle: $Enums.StaffPaidLeaveCycle;
  paidLeaveAllowance: {
    toString(): string;
  };
  address: string | null;
  emergencyContact: string | null;
  notes: string | null;
}) {
  return {
    staffNumber: staff.staffNumber,
    name: staff.name,
    phone: staff.phone,
    alternatePhone: staff.alternatePhone,
    email: staff.email,
    designation: staff.designation,
    joiningDate:
      staff.joiningDate.toISOString(),
    leavingDate:
      staff.leavingDate?.toISOString() ?? null,
    status: staff.status,
    monthlySalary:
      staff.monthlySalary?.toString() ?? null,
    paidLeaveCycle:
      staff.paidLeaveCycle,
    paidLeaveAllowance:
      staff.paidLeaveAllowance.toString(),
    address: staff.address,
    emergencyContact:
      staff.emergencyContact,
    notes: staff.notes,
  };
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const staff =
      await prisma.staff.findUnique({
        where: {
          id,
        },
      });

    if (!staff) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff record not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      staff,
    });
  } catch (error) {
    console.error(
      "Unable to load staff record:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load this staff record.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
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

    const { id } = await context.params;

    const existingStaff =
      await prisma.staff.findUnique({
        where: {
          id,
        },
      });

    if (!existingStaff) {
      return NextResponse.json(
        {
          success: false,
          message: "Staff record not found.",
        },
        {
          status: 404,
        },
      );
    }

    const body =
      (await request.json()) as UpdateStaffBody;

    const name = cleanText(body.name);
    const phone = cleanPhone(body.phone);
    const alternatePhone = cleanPhone(
      body.alternatePhone,
    );
    const email = cleanText(
      body.email,
    ).toLowerCase();
    const designation = cleanText(
      body.designation,
    );
    const joiningDate = parseDate(
      body.joiningDate,
    );
    const requestedLeavingDate = parseDate(
      body.leavingDate,
    );
    const requestedStatus = cleanText(
      body.status,
    ).toUpperCase();
    const monthlySalary = parseSalary(
      body.monthlySalary,
    );
    const requestedPaidLeaveCycle =
      cleanText(
        body.paidLeaveCycle,
      ).toUpperCase();
    const paidLeaveCycle =
      requestedPaidLeaveCycle
        ? isPaidLeaveCycle(
            requestedPaidLeaveCycle,
          )
          ? requestedPaidLeaveCycle
          : null
        : existingStaff.paidLeaveCycle;
    const parsedLeaveAllowance =
      parseLeaveAllowance(
        body.paidLeaveAllowance,
      );

    if (name.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter the staff member’s full name.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid primary phone number.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      alternatePhone &&
      !isValidPhone(alternatePhone)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid alternate phone number.",
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

    if (designation.length < 2) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter the staff designation.",
        },
        {
          status: 400,
        },
      );
    }

    if (!joiningDate) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid joining date.",
        },
        {
          status: 400,
        },
      );
    }

    if (!isStaffStatus(requestedStatus)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid staff status.",
        },
        {
          status: 400,
        },
      );
    }

    if (monthlySalary === undefined) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please enter a valid monthly salary.",
        },
        {
          status: 400,
        },
      );
    }

    if (paidLeaveCycle === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Please select a valid paid-leave cycle.",
        },
        {
          status: 400,
        },
      );
    }

    if (parsedLeaveAllowance === null) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Paid-leave allowance must be between 0 and 366 days.",
        },
        {
          status: 400,
        },
      );
    }

    const requestedAllowance =
      parsedLeaveAllowance === undefined
        ? Number(
            existingStaff.paidLeaveAllowance.toString(),
          )
        : parsedLeaveAllowance;

    if (
      paidLeaveCycle !== "NONE" &&
      requestedAllowance <= 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Enter the number of paid-leave days allowed for this employee.",
        },
        {
          status: 400,
        },
      );
    }

    const paidLeaveAllowance =
      paidLeaveCycle === "NONE"
        ? 0
        : requestedAllowance;

    const leavingDate =
      requestedStatus === "LEFT"
        ? requestedLeavingDate ?? new Date()
        : requestedLeavingDate;

    if (
      leavingDate &&
      leavingDate < joiningDate
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

    const duplicatePhone =
      await prisma.staff.findFirst({
        where: {
          id: {
            not: id,
          },
          phone,
          status: {
            in: ["ACTIVE", "INACTIVE"],
          },
        },

        select: {
          id: true,
          staffNumber: true,
          name: true,
        },
      });

    if (duplicatePhone) {
      return NextResponse.json(
        {
          success: false,
          message: `${duplicatePhone.name} already uses this phone number (${duplicatePhone.staffNumber}).`,
          existingStaff: duplicatePhone,
        },
        {
          status: 409,
        },
      );
    }

    const staff = await prisma.$transaction(
      async (transaction) => {
        const updatedStaff =
          await transaction.staff.update({
            where: {
              id,
            },

            data: {
              name,
              phone,
              alternatePhone:
                alternatePhone || null,
              email: email || null,
              designation,
              joiningDate,
              leavingDate,
              status: requestedStatus,
              monthlySalary,
              paidLeaveCycle,
              paidLeaveAllowance,
              address: cleanOptionalText(
                body.address,
              ),
              emergencyContact:
                cleanOptionalText(
                  body.emergencyContact,
                ),
              notes: cleanOptionalText(
                body.notes,
              ),
            },
          });

        await transaction.activityLog.create({
          data: {
            action: "UPDATED",
            entityType: "Staff",
            entityId: updatedStaff.id,
            description: `Staff record ${updatedStaff.staffNumber} updated for ${updatedStaff.name}.`,
            previousData:
              staffAuditData(existingStaff),
            newData:
              staffAuditData(updatedStaff),
          },
        });

        return updatedStaff;
      },
    );

    return NextResponse.json({
      success: true,
      message: `${staff.name} has been updated successfully.`,
      staff,
    });
  } catch (error) {
    console.error(
      "Unable to update staff record:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The staff record could not be updated.",
      },
      {
        status: 500,
      },
    );
  }
}

