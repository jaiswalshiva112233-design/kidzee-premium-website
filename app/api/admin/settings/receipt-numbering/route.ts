import { NextResponse } from "next/server";

import { isAdminAuthenticated } from "@/lib/admin/auth";
import {
  setSequenceStartingPoint,
} from "@/lib/numbering";
import { prisma } from "@/lib/prisma";

type UpdateReceiptSequenceBody = {
  currentValue?: unknown;
  prefix?: unknown;
  minimumWidth?: unknown;
};

function cleanText(value: unknown) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function parseInteger(value: unknown) {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return Math.floor(value);
  }

  const text = cleanText(value);

  if (!text) {
    return null;
  }

  const parsed = Number(text);

  if (!Number.isInteger(parsed)) {
    return null;
  }

  return parsed;
}

function buildPreview(
  prefix: string | null,
  currentValue: number,
  minimumWidth: number,
) {
  const nextValue = currentValue + 1;

  const serialText = String(nextValue).padStart(
    minimumWidth,
    "0",
  );

  return prefix
    ? `${prefix}-${serialText}`
    : serialText;
}

export async function GET() {
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

    const sequence =
      await prisma.numberSequence.findUnique({
        where: {
          key: "RECEIPT",
        },
      });

    const currentValue =
      sequence?.currentValue ?? 0;

    const prefix =
      sequence?.prefix ?? "KZ-RCP";

    const minimumWidth =
      sequence?.minimumWidth ?? 2;

    return NextResponse.json({
      success: true,

      settings: {
        key: "RECEIPT",
        currentValue,
        prefix,
        minimumWidth,
        resetPolicy:
          sequence?.resetPolicy ?? "NEVER",

        nextValue: currentValue + 1,

        preview: buildPreview(
          prefix,
          currentValue,
          minimumWidth,
        ),
      },
    });
  } catch (error) {
    console.error(
      "Unable to load receipt numbering settings:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to load receipt numbering settings.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(request: Request) {
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

    let body: UpdateReceiptSequenceBody;

    try {
      body =
        (await request.json()) as UpdateReceiptSequenceBody;
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid receipt-numbering request.",
        },
        {
          status: 400,
        },
      );
    }

    const currentValue = parseInteger(
      body.currentValue,
    );

    const minimumWidth =
      parseInteger(body.minimumWidth) ?? 2;

    const prefixText = cleanText(body.prefix);

    const prefix =
      prefixText.length > 0
        ? prefixText
        : undefined;

    if (
      currentValue === null ||
      currentValue < 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Current receipt number must be zero or greater.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      minimumWidth < 1 ||
      minimumWidth > 10
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Minimum width must be between 1 and 10.",
        },
        {
          status: 400,
        },
      );
    }

    if (
      prefix &&
      prefix.length > 30
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Receipt prefix cannot exceed 30 characters.",
        },
        {
          status: 400,
        },
      );
    }

    const sequence =
      await prisma.$transaction(
        async (transaction) => {
          return setSequenceStartingPoint(
            transaction,
            {
              key: "RECEIPT",
              currentValue,
              prefix,
              minimumWidth,
            },
          );
        },
      );

    return NextResponse.json({
      success: true,

      message:
        "Receipt numbering settings saved successfully.",

      settings: {
        key: sequence.key,
        currentValue:
          sequence.currentValue,
        prefix: sequence.prefix,
        minimumWidth:
          sequence.minimumWidth,
        resetPolicy:
          sequence.resetPolicy,

        nextValue:
          sequence.currentValue + 1,

        preview: buildPreview(
          sequence.prefix,
          sequence.currentValue,
          sequence.minimumWidth,
        ),
      },
    });
  } catch (error) {
    console.error(
      "Unable to update receipt numbering settings:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to save receipt numbering settings.",
      },
      {
        status: 500,
      },
    );
  }
}