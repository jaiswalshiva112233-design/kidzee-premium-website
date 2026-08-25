import type { $Enums } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin/auth";
import { prisma } from "@/lib/prisma";

type CreateStaffBody = {
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
    return 0;
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

function createStaffNumber() {
  const year = new Date().getFullYear();

  const timestamp = Date.now()
    .toString(36)
    .toUpperCase();

  const randomPart = Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase();

  return `STF-${year}-${timestamp}-${randomPart}`;
}

function formatDateForExport(value: Date | null) {
  return value
    ? value.toISOString().slice(0, 10)
    : "";
}

function protectCsvValue(value: unknown) {
  const text =
    value === null || value === undefined
      ? ""
      : String(value);

  const protectedText = /^[=+\-@]/.test(text)
    ? `'${text}`
    : text;

  return `"${protectedText.replaceAll('"', '""')}"`;
}

function createStaffCsv(
  staffRecords: Awaited<
    ReturnType<typeof prisma.staff.findMany>
  >,
) {
  const headers = [
    "Staff Number",
    "Name",
    "Designation",
    "Status",
    "Primary Phone",
    "Alternate Phone",
    "Email",
    "Joining Date",
    "Leaving Date",
    "Monthly Salary",
    "Paid Leave Cycle",
    "Paid Leave Allowance (Days)",
    "Address",
    "Emergency Contact",
    "Notes",
    "Created At",
    "Updated At",
  ];

  const rows = staffRecords.map((staff) => [
    staff.staffNumber,
    staff.name,
    staff.designation,
    staff.status,
    staff.phone,
    staff.alternatePhone,
    staff.email,
    formatDateForExport(staff.joiningDate),
    formatDateForExport(staff.leavingDate),
    staff.monthlySalary?.toString() ?? "",
    staff.paidLeaveCycle,
    staff.paidLeaveAllowance.toString(),
    staff.address,
    staff.emergencyContact,
    staff.notes,
    staff.createdAt.toISOString(),
    staff.updatedAt.toISOString(),
  ]);

  return [
    headers.map(protectCsvValue).join(","),
    ...rows.map((row) =>
      row.map(protectCsvValue).join(","),
    ),
  ].join("\r\n");
}

export async function GET(request: Request) {
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

    const url = new URL(request.url);
    const requestedStatus =
      url.searchParams.get("status") ?? "";
    const format =
      url.searchParams.get("format") ?? "";

    const status = isStaffStatus(requestedStatus)
      ? requestedStatus
      : null;

    const staffRecords =
      await prisma.staff.findMany({
        where: status
          ? {
              status,
            }
          : undefined,

        orderBy: [
          {
            status: "asc",
          },
          {
            name: "asc",
          },
        ],
      });

    if (format.toLowerCase() === "csv") {
      const csv = createStaffCsv(staffRecords);

      return new NextResponse(`\uFEFF${csv}`, {
        status: 200,
        headers: {
          "Content-Type":
            "text/csv; charset=utf-8",
          "Content-Disposition":
            'attachment; filename="kidzee-staff-register.csv"',
          "Cache-Control": "no-store",
        },
      });
    }

    return NextResponse.json({
      success: true,
      staff: staffRecords,
      total: staffRecords.length,
    });
  } catch (error) {
    console.error(
      "Unable to load staff records:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load the staff register.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
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

    const body =
      (await request.json()) as CreateStaffBody;

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
    const status = isStaffStatus(
      requestedStatus,
    )
      ? requestedStatus
      : "ACTIVE";
    const monthlySalary = parseSalary(
      body.monthlySalary,
    );
    const requestedPaidLeaveCycle =
      cleanText(
        body.paidLeaveCycle,
      ).toUpperCase();
    const paidLeaveCycle =
      isPaidLeaveCycle(
        requestedPaidLeaveCycle,
      )
        ? requestedPaidLeaveCycle
        : "NONE";
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

    if (
      paidLeaveCycle !== "NONE" &&
      parsedLeaveAllowance <= 0
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
        : parsedLeaveAllowance;

    const leavingDate =
      status === "LEFT"
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

    const existingStaff =
      await prisma.staff.findFirst({
        where: {
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

    if (existingStaff) {
      return NextResponse.json(
        {
          success: false,
          message: `${existingStaff.name} already uses this phone number (${existingStaff.staffNumber}).`,
          existingStaff,
        },
        {
          status: 409,
        },
      );
    }

    const staff = await prisma.$transaction(
      async (transaction) => {
        const createdStaff =
          await transaction.staff.create({
            data: {
              staffNumber: createStaffNumber(),
              name,
              phone,
              alternatePhone:
                alternatePhone || null,
              email: email || null,
              designation,
              joiningDate,
              leavingDate,
              status,
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
            action: "CREATED",
            entityType: "Staff",
            entityId: createdStaff.id,
            description: `Staff record ${createdStaff.staffNumber} created for ${createdStaff.name}.`,
            newData: {
              staffNumber:
                createdStaff.staffNumber,
              name: createdStaff.name,
              designation:
                createdStaff.designation,
              status: createdStaff.status,
              paidLeaveCycle:
                createdStaff.paidLeaveCycle,
              paidLeaveAllowance:
                createdStaff.paidLeaveAllowance.toString(),
            },
          },
        });

        return createdStaff;
      },
    );

    return NextResponse.json(
      {
        success: true,
        message: `${staff.name} has been added to the staff register.`,
        staff,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Unable to create staff record:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "The staff record could not be saved.",
      },
      {
        status: 500,
      },
    );
  }
}

