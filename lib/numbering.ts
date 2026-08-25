import type { Prisma } from "@/generated/prisma/client";

type TransactionClient = Prisma.TransactionClient;

type NumberSequenceKey =
  | "RECEIPT"
  | "INVOICE"
  | "STUDENT"
  | "ENQUIRY"
  | "PAYMENT"
  | "EXPENSE"
  | "STAFF"
  | "STUDENT_CHARGE"
  | "FINANCIAL_CORRECTION";

type NextSequenceOptions = {
  key: NumberSequenceKey;
  prefix?: string;
  minimumWidth?: number;
};

export type GeneratedSequence = {
  serial: number;
  serialText: string;
  formattedNumber: string;
};

function normalisePrefix(
  prefix: string | undefined,
) {
  const cleaned = prefix?.trim();

  return cleaned ? cleaned : null;
}

export async function getNextSequence(
  transaction: TransactionClient,
  options: NextSequenceOptions,
): Promise<GeneratedSequence> {
  const minimumWidth = Math.max(
    Math.floor(options.minimumWidth ?? 2),
    1,
  );

  const prefix = normalisePrefix(
    options.prefix,
  );

  const sequence =
    await transaction.numberSequence.upsert({
      where: {
        key: options.key,
      },

      create: {
        key: options.key,
        prefix,
        currentValue: 1,
        minimumWidth,
        resetPolicy: "NEVER",
      },

      update: {
        currentValue: {
          increment: 1,
        },

        ...(prefix
          ? {
              prefix,
            }
          : {}),

        minimumWidth,
        resetPolicy: "NEVER",
      },

      select: {
        currentValue: true,
        prefix: true,
        minimumWidth: true,
      },
    });

  const serialText = String(
    sequence.currentValue,
  ).padStart(
    sequence.minimumWidth,
    "0",
  );

  const formattedNumber = sequence.prefix
    ? `${sequence.prefix}-${serialText}`
    : serialText;

  return {
    serial: sequence.currentValue,
    serialText,
    formattedNumber,
  };
}

export async function setSequenceStartingPoint(
  transaction: TransactionClient,
  options: {
    key: NumberSequenceKey;
    currentValue: number;
    prefix?: string;
    minimumWidth?: number;
  },
) {
  const currentValue = Math.max(
    Math.floor(options.currentValue),
    0,
  );

  const minimumWidth = Math.max(
    Math.floor(options.minimumWidth ?? 2),
    1,
  );

  return transaction.numberSequence.upsert({
    where: {
      key: options.key,
    },

    create: {
      key: options.key,
      prefix: normalisePrefix(
        options.prefix,
      ),
      currentValue,
      minimumWidth,
      resetPolicy: "NEVER",
    },

    update: {
      prefix: normalisePrefix(
        options.prefix,
      ),
      currentValue,
      minimumWidth,
      resetPolicy: "NEVER",
    },
  });
}
