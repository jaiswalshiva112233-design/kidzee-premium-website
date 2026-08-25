import { NextResponse } from "next/server";

import { requireOwner } from "@/lib/admin/auth";
import {
  DataControlBlockedError,
  executeDataControlAction,
  getDataControlSnapshot,
  type DataControlAction,
  type DataControlSection,
} from "@/lib/admin/dataControl";

type DataControlRequest = {
  action?: unknown;
  id?: unknown;
  confirmation?: unknown;
  sections?: unknown;
  backupConfirmed?: unknown;
  testDataConfirmed?: unknown;
};

const ACTIONS = new Set<DataControlAction>([
  "deleteEnquiry",
  "deleteStudent",
  "deleteInvoice",
  "deletePayment",
  "deleteExpense",
  "deleteSelected",
]);

const SECTIONS = new Set<DataControlSection>([
  "enquiries",
  "students",
  "fees",
  "expenses",
  "websiteLeadHistory",
  "activityHistory",
  "preschoolCatalogue",
  "daycareCatalogue",
  "mealCatalogue",
  "otherChargeCatalogue",
  "legacyFeeSettings",
]);

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "";

  if (message === "UNAUTHENTICATED") {
    return NextResponse.json(
      {
        success: false,
        message: "Your session has expired. Please sign in again.",
      },
      {
        status: 401,
      },
    );
  }

  if (message === "FORBIDDEN") {
    return NextResponse.json(
      {
        success: false,
        message: "Only the owner can permanently remove centre data.",
      },
      {
        status: 403,
      },
    );
  }

  if (
    message === "CONFIRMATION_REQUIRED" ||
    message === "NO_SECTIONS_SELECTED" ||
    message === "TEST_DATA_CONFIRMATION_REQUIRED"
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          message === "NO_SECTIONS_SELECTED"
            ? "Select at least one section to clean."
            : message === "TEST_DATA_CONFIRMATION_REQUIRED"
              ? "Confirm that the selected records are pre-launch test or sample data. Nothing was deleted."
            : "The safety confirmation did not match. Nothing was deleted.",
      },
      {
        status: 400,
      },
    );
  }

  if (message === "RECORD_NOT_FOUND") {
    return NextResponse.json(
      {
        success: false,
        message: "This record no longer exists. Refresh the page and try again.",
      },
      {
        status: 404,
      },
    );
  }

  if (
    message === "LINKED_STUDENT" ||
    message === "LINKED_PAYROLL"
  ) {
    return NextResponse.json(
      {
        success: false,
        message:
          message === "LINKED_STUDENT"
            ? "This enquiry is linked to a student. Remove the test student bundle instead so the admission cannot be orphaned."
            : "This salary expense is linked to payroll and cannot be deleted separately.",
      },
      { status: 409 },
    );
  }

  if (error instanceof DataControlBlockedError) {
    console.error("Safe Launch Cleanup blocked:", {
      code: error.message,
      details: error.details,
    });
    return NextResponse.json(
      { success: false, message: error.safeMessage, blocking: error.details },
      { status: 409 },
    );
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2003"
  ) {
    const metadata = "meta" in error && typeof error.meta === "object" && error.meta
      ? (error.meta as Record<string, unknown>)
      : {};
    const model = typeof metadata.modelName === "string"
      ? metadata.modelName
      : "a protected module";
    const relation = typeof metadata.constraint === "string"
      ? metadata.constraint
      : typeof metadata.field_name === "string"
        ? metadata.field_name
        : "a linked record";
    console.error("Safe Launch Cleanup dependency blocked:", {
      code: "P2003",
      model,
      relation,
    });
    return NextResponse.json(
      {
        success: false,
        message: `Cleanup is blocked by ${model}: ${relation}. Delete the linked pre-launch test record first, or archive/cancel it if it is genuine centre history. Nothing was deleted.`,
      },
      { status: 409 },
    );
  }

  console.error("Unable to manage CentreOS data:", error);

  return NextResponse.json(
    {
      success: false,
      message:
        "The data change could not be completed. No partial deletion was kept.",
    },
    {
      status: 500,
    },
  );
}

export async function GET() {
  try {
    await requireOwner();

    return NextResponse.json({
      success: true,
      snapshot: await getDataControlSnapshot(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireOwner();
    let body: DataControlRequest;

    try {
      body = (await request.json()) as DataControlRequest;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: "The deletion request was not valid.",
        },
        {
          status: 400,
        },
      );
    }

    const action = textValue(body.action) as DataControlAction;

    if (!ACTIONS.has(action)) {
      return NextResponse.json(
        {
          success: false,
          message: "Choose a valid data action.",
        },
        {
          status: 400,
        },
      );
    }

    const sections = Array.isArray(body.sections)
      ? body.sections.filter(
          (section): section is DataControlSection =>
            typeof section === "string" &&
            SECTIONS.has(section as DataControlSection),
        )
      : [];

    const result = await executeDataControlAction({
      action,
      id: textValue(body.id),
      confirmation: textValue(body.confirmation),
      sections,
      backupConfirmed: body.backupConfirmed === true,
      testDataConfirmed: body.testDataConfirmed === true,
      adminUserId: session.userId,
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      ...("summary" in result && result.summary
        ? { summary: result.summary }
        : {}),
      ...("blockers" in result && result.blockers
        ? { blockers: result.blockers }
        : {}),
      snapshot: await getDataControlSnapshot(),
    });
  } catch (error) {
    return errorResponse(error);
  }
}
