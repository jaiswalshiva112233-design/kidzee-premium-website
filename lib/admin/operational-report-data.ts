import type { Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";

export const OPERATIONAL_REPORT_TYPES = [
  "student-register",
  "admission-register",
  "enquiry-register",
  "attendance-register",
  "staff-register",
  "staff-attendance-register",
  "staff-leave-register",
  "staff-extra-duty-register",
  "payroll-register",
] as const;

export type OperationalReportType =
  (typeof OPERATIONAL_REPORT_TYPES)[number];

type DateFilter = {
  gte?: Date;
  lte?: Date;
};

type SummaryItem = {
  label: string;
  value: string;

  tone?:
    | "purple"
    | "green"
    | "red"
    | "amber"
    | "blue";
};

type TableColumn = {
  label: string;
  weight: number;
  align?: "left" | "center" | "right";
};

export type OperationalReportData = {
  title: string;
  description: string;
  periodLabel: string;
  columns: TableColumn[];
  rows: string[][];
  summaries: SummaryItem[];
  notes?: string[];
};

const labelOverrides: Record<
  string,
  string
> = {
  JUNIOR_KG: "Junior KG",
  SENIOR_KG: "Senior KG",
  HALF_DAY: "Half Day",
  NO_ANSWER: "No Answer",
  VISIT_SCHEDULED:
    "Visit Scheduled",
  TRIAL_SCHEDULED:
    "Trial Scheduled",
  NOT_INTERESTED:
    "Not Interested",
  DOCUMENTS_PENDING:
    "Documents Pending",
  PHONE_CALL: "Phone Call",
  WALK_IN: "Walk In",
  GOOGLE_ADS: "Google Ads",
  META_ADS: "Meta Ads",
};

export function isOperationalReportType(
  value: string,
): value is OperationalReportType {
  return (
    OPERATIONAL_REPORT_TYPES as readonly string[]
  ).includes(value);
}

function formatLabel(
  value: string | null | undefined,
) {
  if (!value) {
    return "";
  }

  if (labelOverrides[value]) {
    return labelOverrides[value];
  }

  return value
    .toLowerCase()
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1),
    )
    .join(" ");
}

function formatDate(
  value: Date | null | undefined,
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  ).format(value);
}

function formatTime(
  value: Date | null | undefined,
) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    },
  ).format(value);
}

function formatMoney(value: unknown) {
  const amount = Number(value ?? 0);

  return new Intl.NumberFormat(
    "en-IN",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  ).format(
    Number.isFinite(amount)
      ? amount
      : 0,
  );
}

function getStudentName(student: {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
}) {
  return [
    student.firstName,
    student.middleName,
    student.lastName,
  ]
    .filter(Boolean)
    .join(" ");
}

function combineText(
  values: Array<
    string | null | undefined
  >,
  separator = " | ",
) {
  return values
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(separator);
}

async function buildStudentRegister(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  const where:
    Prisma.StudentWhereInput =
    dateFilter
      ? {
          joiningDate: dateFilter,
        }
      : {};

  const students =
    await prisma.student.findMany({
      where,

      include: {
        guardians: {
          orderBy: [
            {
              isPrimary: "desc",
            },
            {
              createdAt: "asc",
            },
          ],
        },
      },

      orderBy: [
        {
          programme: "asc",
        },
        {
          firstName: "asc",
        },
      ],
    });

  const activeStudents =
    students.filter(
      (student) =>
        student.status === "ACTIVE",
    ).length;

  const daycareStudents =
    students.filter(
      (student) =>
        student.programme ===
        "DAYCARE",
    ).length;

  const preschoolStudents =
    students.length -
    daycareStudents;

  return {
    title: "Student Register",

    description:
      "Student profiles, programme placement, guardian contact and joining information.",

    periodLabel,

    summaries: [
      {
        label: "Student Records",
        value: students.length.toString(),
        tone: "purple",
      },
      {
        label: "Active Students",
        value:
          activeStudents.toString(),
        tone: "green",
      },
      {
        label: "Preschool",
        value:
          preschoolStudents.toString(),
        tone: "blue",
      },
      {
        label: "Daycare",
        value:
          daycareStudents.toString(),
        tone: "amber",
      },
    ],

    columns: [
      {
        label: "Student No.",
        weight: 0.9,
      },
      {
        label: "Student Name",
        weight: 1.35,
      },
      {
        label: "Date of Birth",
        weight: 0.8,
      },
      {
        label: "Programme",
        weight: 0.85,
      },
      {
        label: "Status",
        weight: 0.75,
      },
      {
        label: "Joining Date",
        weight: 0.8,
      },
      {
        label: "Guardian",
        weight: 1.2,
      },
      {
        label: "Phone",
        weight: 0.9,
      },
      {
        label: "City / Locality",
        weight: 1.1,
      },
      {
        label: "Medical / Allergies",
        weight: 1.5,
      },
    ],

    rows: students.map((student) => {
      const primaryGuardian =
        student.guardians.find(
          (guardian) =>
            guardian.isPrimary,
        ) ?? student.guardians[0];

      const location = combineText(
        [
          student.locality,
          student.city,
        ],
        ", ",
      );

      const medicalInformation =
        combineText([
          student.allergies
            ? `Allergies: ${student.allergies}`
            : "",
          student.medicalNotes
            ? `Medical: ${student.medicalNotes}`
            : "",
        ]);

      return [
        student.studentNumber,
        getStudentName(student),
        formatDate(student.dateOfBirth),
        formatLabel(student.programme),
        formatLabel(student.status),
        formatDate(student.joiningDate),
        primaryGuardian
          ? `${primaryGuardian.name} (${formatLabel(
              primaryGuardian.relationship,
            )})`
          : "Not recorded",
        primaryGuardian?.phone ??
          "Not recorded",
        location || "Not recorded",
        medicalInformation ||
          "None recorded",
      ];
    }),

    notes: [
      "The reporting period filters students by their joining date.",
      "Sensitive student information must be shared only with authorised persons.",
    ],
  };
}

async function buildAdmissionRegister(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  const where:
    Prisma.AdmissionWhereInput =
    dateFilter
      ? {
          createdAt: dateFilter,
        }
      : {};

  const admissions =
    await prisma.admission.findMany({
      where,

      include: {
        enquiry: {
          select: {
            enquiryNumber: true,
            parentName: true,
            childName: true,
            phone: true,
          },
        },

        student: {
          select: {
            studentNumber: true,
            firstName: true,
            middleName: true,
            lastName: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const confirmed =
    admissions.filter(
      (admission) =>
        admission.status ===
        "CONFIRMED",
    ).length;

  const documentsPending =
    admissions.filter(
      (admission) =>
        admission.status ===
        "DOCUMENTS_PENDING",
    ).length;

  const cancelled =
    admissions.filter(
      (admission) =>
        admission.status ===
        "CANCELLED",
    ).length;

  return {
    title: "Admission Register",

    description:
      "Admission applications, programme placement, document status and joining information.",

    periodLabel,

    summaries: [
      {
        label: "Admission Records",
        value:
          admissions.length.toString(),
        tone: "purple",
      },
      {
        label: "Confirmed",
        value: confirmed.toString(),
        tone: "green",
      },
      {
        label: "Documents Pending",
        value:
          documentsPending.toString(),
        tone: "amber",
      },
      {
        label: "Cancelled",
        value: cancelled.toString(),
        tone: "red",
      },
    ],

    columns: [
      {
        label: "Admission No.",
        weight: 1,
      },
      {
        label: "Created",
        weight: 0.8,
      },
      {
        label: "Child / Student",
        weight: 1.35,
      },
      {
        label: "Parent",
        weight: 1.15,
      },
      {
        label: "Phone",
        weight: 0.9,
      },
      {
        label: "Programme",
        weight: 0.9,
      },
      {
        label: "Admission Date",
        weight: 0.85,
      },
      {
        label: "Joining Date",
        weight: 0.85,
      },
      {
        label: "Status",
        weight: 1,
      },
      {
        label: "Documents",
        weight: 0.85,
      },
    ],

    rows: admissions.map(
      (admission) => {
        const childName =
          admission.student
            ? getStudentName(
                admission.student,
              )
            : admission.enquiry
                ?.childName ||
              "Not recorded";

        const studentReference =
          admission.student
            ?.studentNumber ||
          admission.enquiry
            ?.enquiryNumber ||
          "";

        return [
          admission.admissionNumber,
          formatDate(
            admission.createdAt,
          ),
          `${childName}${
            studentReference
              ? ` (${studentReference})`
              : ""
          }`,
          admission.enquiry
            ?.parentName ??
            "Direct admission",
          admission.enquiry?.phone ??
            "Not recorded",
          formatLabel(
            admission.programme,
          ),
          formatDate(
            admission.admissionDate,
          ) || "Not confirmed",
          formatDate(
            admission.joiningDate,
          ) || "Not recorded",
          formatLabel(admission.status),
          admission.documentsComplete
            ? "Complete"
            : "Pending",
        ];
      },
    ),

    notes: [
      "The reporting period filters admissions by the date the admission record was created.",
    ],
  };
}

async function buildEnquiryRegister(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  const where:
    Prisma.EnquiryWhereInput =
    dateFilter
      ? {
          createdAt: dateFilter,
        }
      : {};

  const enquiries =
    await prisma.enquiry.findMany({
      where,

      include: {
        followUps: {
          where: {
            status: "PENDING",
          },

          orderBy: {
            dueAt: "asc",
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  const activeStatuses = [
    "NEW",
    "CONTACTED",
    "NO_ANSWER",
    "VISIT_SCHEDULED",
    "TRIAL_SCHEDULED",
    "INTERESTED",
    "FOLLOW_UP",
  ];

  const activeEnquiries =
    enquiries.filter((enquiry) =>
      activeStatuses.includes(
        enquiry.status,
      ),
    ).length;

  const admitted =
    enquiries.filter(
      (enquiry) =>
        enquiry.status === "ADMITTED",
    ).length;

  const pendingFollowUps =
    enquiries.reduce(
      (total, enquiry) =>
        total +
        enquiry.followUps.length,
      0,
    );

  return {
    title: "Enquiry Register",

    description:
      "Parent enquiries, programme interest, source, status and next follow-up.",

    periodLabel,

    summaries: [
      {
        label: "Enquiry Records",
        value:
          enquiries.length.toString(),
        tone: "purple",
      },
      {
        label: "Active Enquiries",
        value:
          activeEnquiries.toString(),
        tone: "green",
      },
      {
        label: "Pending Follow-ups",
        value:
          pendingFollowUps.toString(),
        tone: "amber",
      },
      {
        label: "Admitted",
        value: admitted.toString(),
        tone: "blue",
      },
    ],

    columns: [
      {
        label: "Enquiry No.",
        weight: 1,
      },
      {
        label: "Received",
        weight: 0.8,
      },
      {
        label: "Parent",
        weight: 1.15,
      },
      {
        label: "Child",
        weight: 1.1,
      },
      {
        label: "Phone",
        weight: 0.9,
      },
      {
        label: "Programme",
        weight: 0.9,
      },
      {
        label: "Source",
        weight: 0.85,
      },
      {
        label: "Status",
        weight: 1,
      },
      {
        label: "Next Follow-up",
        weight: 1.1,
      },
      {
        label: "Notes",
        weight: 1.45,
      },
    ],

    rows: enquiries.map(
      (enquiry) => {
        const nextFollowUp =
          enquiry.followUps[0]
            ?.dueAt ??
          enquiry.nextFollowUpAt;

        return [
          enquiry.enquiryNumber,
          formatDate(enquiry.createdAt),
          enquiry.parentName,
          enquiry.childName ??
            "Not recorded",
          enquiry.phone,
          formatLabel(
            enquiry.programme,
          ) || "Not selected",
          formatLabel(enquiry.source),
          formatLabel(enquiry.status),
          formatDate(nextFollowUp) ||
            "Not scheduled",
          combineText([
            enquiry.message,
            enquiry.notes,
          ]) || "No notes",
        ];
      },
    ),

    notes: [
      "The enquiry register keeps one enquiry record per parent enquiry with its current status.",
      "Detailed follow-up history remains available inside the enquiry profile.",
    ],
  };
}

async function buildAttendanceRegister(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  const where:
    Prisma.StudentAttendanceWhereInput =
    dateFilter
      ? {
          attendanceDate:
            dateFilter,
        }
      : {};

  const attendanceRecords =
    await prisma.studentAttendance.findMany(
      {
        where,

        include: {
          student: {
            select: {
              studentNumber: true,
              firstName: true,
              middleName: true,
              lastName: true,
              programme: true,
            },
          },

          markedBy: {
            select: {
              name: true,
            },
          },
        },

        orderBy: [
          {
            attendanceDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
      },
    );

  const presentRecords =
    attendanceRecords.filter(
      (record) =>
        record.status === "PRESENT" ||
        record.status === "LATE" ||
        record.status === "HALF_DAY",
    ).length;

  const absentRecords =
    attendanceRecords.filter(
      (record) =>
        record.status === "ABSENT",
    ).length;

  const lateRecords =
    attendanceRecords.filter(
      (record) =>
        record.status === "LATE",
    ).length;

  const attendanceRate =
    attendanceRecords.length > 0
      ? (presentRecords /
          attendanceRecords.length) *
        100
      : 0;

  return {
    title: "Student Attendance Register",

    description:
      "Daily student attendance, check-in, check-out and attendance status.",

    periodLabel,

    summaries: [
      {
        label: "Attendance Entries",
        value:
          attendanceRecords.length.toString(),
        tone: "purple",
      },
      {
        label: "Attendance Rate",
        value: `${attendanceRate.toFixed(
          1,
        )}%`,
        tone: "green",
      },
      {
        label: "Absent",
        value:
          absentRecords.toString(),
        tone: "red",
      },
      {
        label: "Late",
        value: lateRecords.toString(),
        tone: "amber",
      },
    ],

    columns: [
      {
        label: "Date",
        weight: 0.85,
      },
      {
        label: "Student No.",
        weight: 0.95,
      },
      {
        label: "Student Name",
        weight: 1.45,
      },
      {
        label: "Programme",
        weight: 1,
      },
      {
        label: "Status",
        weight: 0.9,
      },
      {
        label: "Check-in",
        weight: 0.8,
      },
      {
        label: "Check-out",
        weight: 0.8,
      },
      {
        label: "Marked By",
        weight: 1,
      },
      {
        label: "Notes",
        weight: 1.8,
      },
    ],

    rows: attendanceRecords.map(
      (record) => [
        formatDate(
          record.attendanceDate,
        ),
        record.student.studentNumber,
        getStudentName(record.student),
        formatLabel(
          record.student.programme,
        ),
        formatLabel(record.status),
        formatTime(record.checkInAt) ||
          "-",
        formatTime(record.checkOutAt) ||
          "-",
        record.markedBy?.name ??
          "Owner",
        record.notes ?? "-",
      ],
    ),

    notes: [
      "Present, late and half-day entries are included when calculating the attendance rate.",
    ],
  };
}

async function buildStaffRegister(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  const where:
    Prisma.StaffWhereInput =
    dateFilter
      ? {
          joiningDate: dateFilter,
        }
      : {};

  const staffMembers =
    await prisma.staff.findMany({
      where,

      orderBy: [
        {
          status: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  const activeStaff =
    staffMembers.filter(
      (staffMember) =>
        staffMember.status ===
        "ACTIVE",
    ).length;

  const inactiveStaff =
    staffMembers.filter(
      (staffMember) =>
        staffMember.status ===
        "INACTIVE",
    ).length;

  const salaryTotal =
    staffMembers.reduce(
      (total, staffMember) =>
        total +
        Number(
          staffMember.monthlySalary ??
            0,
        ),
      0,
    );

  return {
    title: "Staff Register",

    description:
      "Staff contact, designation, employment status, joining date and salary register.",

    periodLabel,

    summaries: [
      {
        label: "Staff Records",
        value:
          staffMembers.length.toString(),
        tone: "purple",
      },
      {
        label: "Active Staff",
        value:
          activeStaff.toString(),
        tone: "green",
      },
      {
        label: "Inactive Staff",
        value:
          inactiveStaff.toString(),
        tone: "amber",
      },
      {
        label: "Monthly Salary Total",
        value: `INR ${formatMoney(
          salaryTotal,
        )}`,
        tone: "blue",
      },
    ],

    columns: [
      {
        label: "Staff No.",
        weight: 0.9,
      },
      {
        label: "Name",
        weight: 1.35,
      },
      {
        label: "Designation",
        weight: 1.15,
      },
      {
        label: "Phone",
        weight: 0.95,
      },
      {
        label: "Email",
        weight: 1.35,
      },
      {
        label: "Joining Date",
        weight: 0.85,
      },
      {
        label: "Leaving Date",
        weight: 0.85,
      },
      {
        label: "Status",
        weight: 0.8,
      },
      {
        label: "Monthly Salary",
        weight: 0.95,
        align: "right",
      },
      {
        label: "Emergency Contact",
        weight: 1.1,
      },
    ],

    rows: staffMembers.map(
      (staffMember) => [
        staffMember.staffNumber,
        staffMember.name,
        staffMember.designation,
        staffMember.phone,
        staffMember.email ??
          "Not recorded",
        formatDate(
          staffMember.joiningDate,
        ),
        formatDate(
          staffMember.leavingDate,
        ) || "-",
        formatLabel(
          staffMember.status,
        ),
        staffMember.monthlySalary
          ? formatMoney(
              staffMember.monthlySalary,
            )
          : "-",
        staffMember.emergencyContact ??
          "Not recorded",
      ],
    ),

    notes: [
      "The reporting period filters staff members by their joining date.",
      "Salary information is confidential and should be shared only with authorised persons.",
    ],
  };
}

async function buildStaffAttendanceRegister(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  const where:
    Prisma.StaffAttendanceWhereInput =
    dateFilter
      ? {
          attendanceDate: dateFilter,
        }
      : {};

  const attendanceRecords =
    await prisma.staffAttendance.findMany({
      where,

      include: {
        staff: {
          select: {
            staffNumber: true,
            name: true,
            designation: true,
          },
        },

        markedBy: {
          select: {
            name: true,
          },
        },

        leaveRequest: {
          select: {
            leaveNumber: true,
            leaveType: true,
          },
        },
      },

      orderBy: [
        {
          attendanceDate: "desc",
        },
        {
          staff: {
            name: "asc",
          },
        },
      ],
    });

  const workingDayRecords =
    attendanceRecords.filter(
      (record) => record.status !== "HOLIDAY",
    );

  const attendedRecords =
    workingDayRecords.filter(
      (record) =>
        record.status === "PRESENT" ||
        record.status === "LATE" ||
        record.status === "HALF_DAY",
    ).length;

  const absentRecords =
    attendanceRecords.filter(
      (record) => record.status === "ABSENT",
    ).length;

  const sandwichRecords =
    attendanceRecords.filter(
      (record) => record.isSandwichDay,
    ).length;

  const attendanceRate =
    workingDayRecords.length > 0
      ? (attendedRecords /
          workingDayRecords.length) *
        100
      : 0;

  return {
    title: "Staff Attendance Register",

    description:
      "Daily staff attendance, time records, leave links and sandwich-rule entries.",

    periodLabel,

    summaries: [
      {
        label: "Attendance Entries",
        value:
          attendanceRecords.length.toString(),
        tone: "purple",
      },
      {
        label: "Working-Day Attendance",
        value: `${attendanceRate.toFixed(1)}%`,
        tone: "green",
      },
      {
        label: "Absent Entries",
        value: absentRecords.toString(),
        tone: "red",
      },
      {
        label: "Sandwich Days",
        value: sandwichRecords.toString(),
        tone: "amber",
      },
    ],

    columns: [
      {
        label: "Date",
        weight: 0.82,
      },
      {
        label: "Staff No.",
        weight: 0.82,
      },
      {
        label: "Staff",
        weight: 1.25,
      },
      {
        label: "Status",
        weight: 0.78,
      },
      {
        label: "Check-in",
        weight: 0.72,
      },
      {
        label: "Check-out",
        weight: 0.72,
      },
      {
        label: "Leave Record",
        weight: 1.1,
      },
      {
        label: "Sandwich",
        weight: 0.68,
      },
      {
        label: "Marked By",
        weight: 0.95,
      },
      {
        label: "Notes",
        weight: 1.45,
      },
    ],

    rows: attendanceRecords.map((record) => [
      formatDate(record.attendanceDate),
      record.staff.staffNumber,
      combineText(
        [
          record.staff.name,
          record.staff.designation,
        ],
        " - ",
      ),
      formatLabel(record.status),
      formatTime(record.checkInAt) || "-",
      formatTime(record.checkOutAt) || "-",
      record.leaveRequest
        ? combineText(
            [
              record.leaveRequest.leaveNumber,
              formatLabel(
                record.leaveRequest.leaveType,
              ),
            ],
            " - ",
          )
        : "-",
      record.isSandwichDay ? "Yes" : "No",
      record.markedBy?.name ?? "System / Owner",
      record.notes ?? "-",
    ]),

    notes: [
      "Working-day attendance excludes records marked Holiday from the percentage denominator.",
      "Present, Late and Half Day are treated as attended entries for the attendance percentage.",
      "Sandwich days remain separately identified for leave and payroll review.",
    ],
  };
}

async function buildStaffLeaveRegister(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  const where:
    Prisma.StaffLeaveRequestWhereInput =
    dateFilter
      ? {
          startDate: dateFilter.lte
            ? {
                lte: dateFilter.lte,
              }
            : undefined,
          endDate: dateFilter.gte
            ? {
                gte: dateFilter.gte,
              }
            : undefined,
        }
      : {};

  const leaveRequests =
    await prisma.staffLeaveRequest.findMany({
      where,

      include: {
        staff: {
          select: {
            staffNumber: true,
            name: true,
            designation: true,
          },
        },

        createdBy: {
          select: {
            name: true,
          },
        },

        approvedBy: {
          select: {
            name: true,
          },
        },
      },

      orderBy: [
        {
          startDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  const pendingRequests =
    leaveRequests.filter(
      (request) => request.status === "PENDING",
    ).length;

  const approvedRequests =
    leaveRequests.filter(
      (request) => request.status === "APPROVED",
    ).length;

  const chargedDays = leaveRequests.reduce(
    (total, request) =>
      total + Number(request.chargedDays),
    0,
  );

  const unpaidDays = leaveRequests.reduce(
    (total, request) =>
      total + Number(request.unpaidDays),
    0,
  );

  return {
    title: "Staff Leave Register",

    description:
      "Staff leave requests, paid and unpaid allocation, sandwich days and approval status.",

    periodLabel,

    summaries: [
      {
        label: "Leave Requests",
        value: leaveRequests.length.toString(),
        tone: "purple",
      },
      {
        label: "Approved",
        value: approvedRequests.toString(),
        tone: "green",
      },
      {
        label: "Pending",
        value: pendingRequests.toString(),
        tone: "amber",
      },
      {
        label: "Unpaid Days",
        value: formatMoney(unpaidDays),
        tone: "red",
      },
    ],

    columns: [
      {
        label: "Leave No.",
        weight: 0.9,
      },
      {
        label: "Staff",
        weight: 1.25,
      },
      {
        label: "Leave Period",
        weight: 1.15,
      },
      {
        label: "Type",
        weight: 0.85,
      },
      {
        label: "Status",
        weight: 0.78,
      },
      {
        label: "Requested",
        weight: 0.72,
        align: "right",
      },
      {
        label: "Sandwich",
        weight: 0.72,
        align: "right",
      },
      {
        label: "Charged",
        weight: 0.72,
        align: "right",
      },
      {
        label: "Paid",
        weight: 0.62,
        align: "right",
      },
      {
        label: "Unpaid",
        weight: 0.68,
        align: "right",
      },
      {
        label: "Approval",
        weight: 1.1,
      },
      {
        label: "Reason / Notes",
        weight: 1.5,
      },
    ],

    rows: leaveRequests.map((request) => [
      request.leaveNumber,
      combineText(
        [
          `${request.staff.name} (${request.staff.staffNumber})`,
          request.staff.designation,
        ],
        " - ",
      ),
      `${formatDate(request.startDate)} - ${formatDate(request.endDate)}`,
      formatLabel(request.leaveType),
      formatLabel(request.status),
      formatMoney(request.requestedDays),
      formatMoney(request.sandwichDays),
      formatMoney(request.chargedDays),
      formatMoney(request.paidDays),
      formatMoney(request.unpaidDays),
      request.approvedBy
        ? combineText(
            [
              request.approvedBy.name,
              request.approvedAt
                ? formatDate(request.approvedAt)
                : "",
            ],
            " - ",
          )
        : request.createdBy?.name
          ? `Created by ${request.createdBy.name}`
          : "Pending review",
      combineText([
        request.reason,
        request.notes,
      ]) || "-",
    ]),

    notes: [
      `The selected period includes leave requests that overlap the period. Total charged days across these records: ${formatMoney(chargedDays)}.`,
      "Sandwich days are displayed separately and are included in charged days according to the saved leave rule.",
      "Rejected and Cancelled records remain visible for audit purposes.",
    ],
  };
}

async function buildStaffExtraDutyRegister(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  const where:
    Prisma.StaffExtraDutyWhereInput =
    dateFilter
      ? {
          dutyDate: dateFilter,
        }
      : {};

  const dutyRecords =
    await prisma.staffExtraDuty.findMany({
      where,

      include: {
        coveringStaff: {
          select: {
            staffNumber: true,
            name: true,
            designation: true,
          },
        },

        absentStaff: {
          select: {
            staffNumber: true,
            name: true,
          },
        },

        approvedBy: {
          select: {
            name: true,
          },
        },

        payroll: {
          select: {
            payrollNumber: true,
          },
        },
      },

      orderBy: [
        {
          dutyDate: "desc",
        },
        {
          startAt: "desc",
        },
      ],
    });

  const approvedOrPaidRecords =
    dutyRecords.filter(
      (record) =>
        record.status === "APPROVED" ||
        record.status === "PAID",
    );

  const pendingRecords = dutyRecords.filter(
    (record) => record.status === "PENDING",
  ).length;

  const payableHours =
    approvedOrPaidRecords.reduce(
      (total, record) =>
        total + Number(record.hours),
      0,
    );

  const payableAmount =
    approvedOrPaidRecords.reduce(
      (total, record) =>
        total + Number(record.amount),
      0,
    );

  return {
    title: "Staff Extra-Duty Register",

    description:
      "Additional staff duty hours, leave-cover assignments, approval and payroll linkage.",

    periodLabel,

    summaries: [
      {
        label: "Duty Records",
        value: dutyRecords.length.toString(),
        tone: "purple",
      },
      {
        label: "Approved / Paid",
        value:
          approvedOrPaidRecords.length.toString(),
        tone: "green",
      },
      {
        label: "Pending",
        value: pendingRecords.toString(),
        tone: "amber",
      },
      {
        label: "Payable Amount",
        value: `INR ${formatMoney(payableAmount)}`,
        tone: "blue",
      },
    ],

    columns: [
      {
        label: "Duty No.",
        weight: 0.88,
      },
      {
        label: "Date",
        weight: 0.78,
      },
      {
        label: "Covering Staff",
        weight: 1.2,
      },
      {
        label: "Covering For",
        weight: 1.05,
      },
      {
        label: "Duty Time",
        weight: 1,
      },
      {
        label: "Hours",
        weight: 0.62,
        align: "right",
      },
      {
        label: "Hourly Rate",
        weight: 0.78,
        align: "right",
      },
      {
        label: "Amount",
        weight: 0.78,
        align: "right",
      },
      {
        label: "Status",
        weight: 0.72,
      },
      {
        label: "Payroll",
        weight: 0.9,
      },
      {
        label: "Reason / Approval",
        weight: 1.45,
      },
    ],

    rows: dutyRecords.map((record) => [
      record.dutyNumber,
      formatDate(record.dutyDate),
      combineText(
        [
          `${record.coveringStaff.name} (${record.coveringStaff.staffNumber})`,
          record.coveringStaff.designation,
        ],
        " - ",
      ),
      record.absentStaff
        ? `${record.absentStaff.name} (${record.absentStaff.staffNumber})`
        : "General duty",
      `${formatTime(record.startAt)} - ${formatTime(record.endAt)}`,
      formatMoney(record.hours),
      formatMoney(record.hourlyRate),
      formatMoney(record.amount),
      formatLabel(record.status),
      record.payroll?.payrollNumber ??
        (record.status === "PAID"
          ? "Paid"
          : "Not linked"),
      combineText([
        formatLabel(record.reason),
        record.approvedBy?.name
          ? `Approved by ${record.approvedBy.name}`
          : "",
        record.notes,
      ]) || "-",
    ]),

    notes: [
      `Approved and Paid duties total ${formatMoney(payableHours)} hours for INR ${formatMoney(payableAmount)}.`,
      "Pending duties are excluded from the payable totals until approved.",
      "Paid duties show their linked payroll number when available.",
    ],
  };
}

async function buildPayrollRegister(
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  const where: Prisma.StaffPayrollWhereInput =
    dateFilter
      ? {
          payrollMonth: dateFilter,
        }
      : {};

  const payrollRecords =
    await prisma.staffPayroll.findMany({
      where,

      include: {
        paidBy: {
          select: {
            name: true,
          },
        },
      },

      orderBy: [
        {
          payrollMonth: "desc",
        },
        {
          staffNameSnapshot: "asc",
        },
      ],
    });

  const activePayrollRecords =
    payrollRecords.filter(
      (payroll) =>
        payroll.status !== "CANCELLED",
    );

  const paidPayrollRecords =
    payrollRecords.filter(
      (payroll) =>
        payroll.status === "PAID",
    );

  const pendingPayrollRecords =
    payrollRecords.filter(
      (payroll) =>
        payroll.status === "DRAFT" ||
        payroll.status === "APPROVED",
    );

  const paidAmount = paidPayrollRecords.reduce(
    (total, payroll) =>
      total + Number(payroll.netPayable),
    0,
  );

  const pendingAmount =
    pendingPayrollRecords.reduce(
      (total, payroll) =>
        total + Number(payroll.netPayable),
      0,
    );

  const totalDeductions =
    activePayrollRecords.reduce(
      (total, payroll) =>
        total + Number(payroll.totalDeductions),
      0,
    );

  return {
    title: "Staff Payroll Register",

    description:
      "Month-wise staff salary, attendance deductions, extra-duty pay and payment audit register.",

    periodLabel,

    summaries: [
      {
        label: "Payroll Records",
        value: payrollRecords.length.toString(),
        tone: "purple",
      },
      {
        label: "Paid Salaries",
        value: `INR ${formatMoney(paidAmount)}`,
        tone: "green",
      },
      {
        label: "Pending Payable",
        value: `INR ${formatMoney(pendingAmount)}`,
        tone: "amber",
      },
      {
        label: "Total Deductions",
        value: `INR ${formatMoney(totalDeductions)}`,
        tone: "red",
      },
    ],

    columns: [
      {
        label: "Payroll No.",
        weight: 0.9,
      },
      {
        label: "Salary Month",
        weight: 0.85,
      },
      {
        label: "Staff",
        weight: 1.25,
      },
      {
        label: "Status",
        weight: 0.72,
      },
      {
        label: "Base Salary",
        weight: 0.85,
        align: "right",
      },
      {
        label: "Extra Duty",
        weight: 0.78,
        align: "right",
      },
      {
        label: "Additions",
        weight: 0.75,
        align: "right",
      },
      {
        label: "Deductions",
        weight: 0.82,
        align: "right",
      },
      {
        label: "Net Payable",
        weight: 0.88,
        align: "right",
      },
      {
        label: "Payment",
        weight: 1.15,
      },
    ],

    rows: payrollRecords.map((payroll) => {
      const paymentDetails =
        payroll.status === "PAID"
          ? combineText([
              formatLabel(payroll.paymentMethod),
              payroll.paymentReference
                ? `Ref: ${payroll.paymentReference}`
                : "",
              payroll.paidAt
                ? `Paid ${formatDate(payroll.paidAt)}`
                : "",
              payroll.paidBy?.name
                ? `By ${payroll.paidBy.name}`
                : "",
            ])
          : "Not paid";

      return [
        payroll.payrollNumber,
        formatDate(payroll.payrollMonth),
        combineText(
          [
            payroll.staffNameSnapshot,
            payroll.designationSnapshot,
          ],
          " - ",
        ),
        formatLabel(payroll.status),
        formatMoney(payroll.baseSalary),
        formatMoney(payroll.extraDutyAmount),
        formatMoney(payroll.manualAddition),
        formatMoney(payroll.totalDeductions),
        formatMoney(payroll.netPayable),
        paymentDetails,
      ];
    }),

    notes: [
      "Only payroll records marked Paid should be treated as salary cash outflow in accounts.",
      "Draft and Approved records are shown as pending payable; Cancelled records remain visible for audit.",
      "Salary information is confidential and should be shared only with authorised persons.",
    ],
  };
}

export async function buildOperationalReport(
  reportType: OperationalReportType,
  dateFilter: DateFilter | undefined,
  periodLabel: string,
): Promise<OperationalReportData> {
  switch (reportType) {
    case "student-register":
      return buildStudentRegister(
        dateFilter,
        periodLabel,
      );

    case "admission-register":
      return buildAdmissionRegister(
        dateFilter,
        periodLabel,
      );

    case "enquiry-register":
      return buildEnquiryRegister(
        dateFilter,
        periodLabel,
      );

    case "attendance-register":
      return buildAttendanceRegister(
        dateFilter,
        periodLabel,
      );

    case "staff-register":
      return buildStaffRegister(
        dateFilter,
        periodLabel,
      );

    case "staff-attendance-register":
      return buildStaffAttendanceRegister(
        dateFilter,
        periodLabel,
      );

    case "staff-leave-register":
      return buildStaffLeaveRegister(
        dateFilter,
        periodLabel,
      );

    case "staff-extra-duty-register":
      return buildStaffExtraDutyRegister(
        dateFilter,
        periodLabel,
      );

    case "payroll-register":
      return buildPayrollRegister(
        dateFilter,
        periodLabel,
      );
  }
}
