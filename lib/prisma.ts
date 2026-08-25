import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL is missing. Add the Prisma ORM connection string to the root .env file.",
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function supportsCurrentSchema(
  client: PrismaClient | undefined,
) {
  return (
    typeof client?.adminCredential?.findUnique ===
      "function" &&
    typeof client?.staff?.findMany === "function" &&
    typeof client?.staffAttendance?.findMany ===
      "function" &&
    typeof client?.staffLeaveRequest?.findMany ===
      "function" &&
    typeof client?.staffExtraDuty?.findMany ===
      "function" &&
    typeof client?.staffPayroll?.findMany ===
      "function" &&
    typeof client?.daycareRateSetting?.findMany ===
      "function" &&
    typeof client?.studentDaycarePlan?.findMany ===
      "function" &&
    typeof client?.daycareSession?.findMany ===
      "function" &&
    typeof client?.academicCalendarDocument?.findMany ===
      "function" &&
    typeof client?.academicCalendarEvent?.findMany ===
      "function" &&
    typeof client?.websiteLeadSubmission?.findMany ===
      "function" &&
    typeof client?.marketingConversionJob?.findMany ===
      "function" &&
    typeof client?.rateLimitBucket?.findUnique ===
      "function"
  );
}

const cachedPrisma = globalForPrisma.prisma;

function createPrismaClient() {
  const configuredDatabaseUrl = databaseUrl as string;
  if (configuredDatabaseUrl.startsWith("prisma+postgres://") || configuredDatabaseUrl.startsWith("prisma://")) {
    return new PrismaClient({
      accelerateUrl: configuredDatabaseUrl,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: configuredDatabaseUrl }),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = supportsCurrentSchema(
  cachedPrisma,
)
  ? (cachedPrisma as PrismaClient)
  : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma;
