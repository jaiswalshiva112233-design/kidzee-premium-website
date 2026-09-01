import fs from "node:fs";
import { randomUUID } from "node:crypto";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import pg from "pg";

const { Client } = pg;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = path.join(projectRoot, "prisma", "schema.prisma");

const preserve = (model, purpose, dependencies = [], flags = {}) => ({
  model,
  purpose,
  classification: "PRESERVE",
  preserve: true,
  reset: false,
  systemRequired: Boolean(flags.systemRequired),
  websiteRequired: Boolean(flags.websiteRequired),
  centreSetting: Boolean(flags.centreSetting),
  dependencies,
  safeResetOrder: null,
  rationale: flags.rationale ?? "Required configuration is retained for the clean installation.",
});

const reset = (model, purpose, safeResetOrder, dependencies = [], rationale = "Operational history is removed for a clean installation.") => ({
  model,
  purpose,
  classification: "RESET",
  preserve: false,
  reset: true,
  systemRequired: false,
  websiteRequired: false,
  centreSetting: false,
  dependencies,
  safeResetOrder,
  rationale,
});

const partial = (model, purpose, safeResetOrder, dependencies, flags) => ({
  model,
  purpose,
  classification: "PARTIAL",
  preserve: true,
  reset: true,
  systemRequired: Boolean(flags.systemRequired),
  websiteRequired: Boolean(flags.websiteRequired),
  centreSetting: Boolean(flags.centreSetting),
  dependencies,
  safeResetOrder,
  preserveWhere: flags.preserveWhere,
  resetWhere: flags.resetWhere,
  rationale: flags.rationale,
});

/**
 * Every Prisma model appears exactly once. The order field is also the explicit
 * child-before-parent deletion order used by Stage B.
 */
export const prismaResetMatrix = [
  partial("AdminUser", "Owner and Centre Head identities", 61, [], {
    systemRequired: true,
    centreSetting: true,
    preserveWhere: `"role" = 'OWNER'`,
    resetWhere: `"role" <> 'OWNER'`,
    rationale: "Owner access is preserved; operational Centre Head accounts are reset.",
  }),
  preserve("AdminCredential", "Legacy primary Owner credential", [], { systemRequired: true, centreSetting: true }),
  reset("Enquiry", "CRM enquiries", 45, ["LeadFamily", "AdminUser"]),
  reset("LeadFamily", "CRM family grouping", 46, []),
  reset("LeadActivity", "Lead activity history", 9, ["Enquiry", "AdminUser"]),
  reset("LeadAppointment", "Visits, trials and callbacks", 10, ["Enquiry", "AdminUser"]),
  reset("WebsiteLeadSubmission", "Website form submission and attribution history", 8, ["Enquiry"]),
  reset("CareerApplication", "Operational recruitment applications", 50, []),
  reset("AiSeoRevision", "Generated SEO revision history", 49, []),
  reset("FollowUp", "Lead follow-up tasks", 11, ["Enquiry", "AdminUser"]),
  reset("Admission", "Admission workflow records", 43, ["Enquiry", "Student"]),
  reset("Student", "Student master records", 44, ["ProgrammeDefinition"]),
  reset("StudentEnrollmentContract", "Student service contracts", 42, ["Student", "Admission", "Enquiry", "ProgrammeDefinition"]),
  reset("ContractService", "Contracted preschool/daycare services", 41, ["StudentEnrollmentContract"]),
  reset("StudentDocument", "Private student documents", 21, ["Student", "StoredFile", "AdminUser"]),
  partial("StoredFile", "Firebase/Sanity media inventory", 48, ["StudentDocument"], {
    systemRequired: true,
    websiteRequired: true,
    preserveWhere: `"module" IN ('WEBSITE_GALLERY', 'WEBSITE_TEAM')`,
    resetWhere: `"module" NOT IN ('WEBSITE_GALLERY', 'WEBSITE_TEAM')`,
    rationale: "Public website Gallery/Team inventory is preserved; operational/private inventory is reset after external-object verification.",
  }),
  preserve("MediaSafetySetting", "Media and privacy safety controls", [], { systemRequired: true, websiteRequired: true, centreSetting: true }),
  reset("BackupExport", "Operational backup/export audit jobs", 52, []),
  reset("ProgrammeFeeSetting", "Pre-launch legacy programme fee catalogue", 64, [], "All current fee catalogue rows are Owner-confirmed pre-launch test data."),
  reset("ProgrammeDefinition", "Pre-launch CentreOS programme catalogue", 63, [], "Public website programme content is stored independently in Sanity and is preserved; current CentreOS catalogue rows are test data."),
  reset("ProgrammeFeeVersion", "Pre-launch programme price versions", 62, ["ProgrammeDefinition"], "All current programme price versions are Owner-confirmed pre-launch test data."),
  reset("DaycarePlanDefinition", "Pre-launch daycare plan catalogue", 66, [], "All current daycare plan catalogue rows are Owner-confirmed pre-launch test data."),
  reset("DaycarePlanPriceVersion", "Pre-launch daycare plan prices", 65, ["DaycarePlanDefinition"], "All current daycare price versions are Owner-confirmed pre-launch test data."),
  reset("MealDefinition", "Pre-launch meal catalogue", 71, [], "All current meal catalogue rows are Owner-confirmed pre-launch test data."),
  reset("MealPriceVersion", "Pre-launch meal price versions", 70, ["MealDefinition"], "All current meal price versions are Owner-confirmed pre-launch test data."),
  reset("MealCombination", "Pre-launch meal combinations", 69, [], "All current meal combinations are Owner-confirmed pre-launch test data."),
  reset("MealCombinationItem", "Pre-launch meal combination items", 67, ["MealCombination", "MealDefinition"], "All current meal combination items are Owner-confirmed pre-launch test data."),
  reset("MealCombinationPriceVersion", "Pre-launch meal-combination prices", 68, ["MealCombination"], "All current combination price versions are Owner-confirmed pre-launch test data."),
  reset("ChargeDefinition", "Pre-launch other-charge catalogue", 72, [], "All current charge definitions are Owner-confirmed pre-launch test data."),
  reset("DaycareRateSetting", "Pre-launch legacy daycare rate catalogue", 73, [], "All current legacy daycare rates are Owner-confirmed pre-launch test data."),
  preserve("LateFeeSetting", "Owner-configured due date and late fee policy", [], { systemRequired: true, centreSetting: true }),
  reset("Guardian", "Student guardian records", 22, ["Student"]),
  reset("StudentFeeAccount", "Student fee account assignments", 23, ["Student"]),
  reset("FeeInvoice", "Student invoices", 38, ["Student", "StudentEnrollmentContract", "AdminUser"]),
  reset("FeeInvoiceItem", "Invoice line items", 27, ["FeeInvoice", "ContractService"]),
  reset("StudentDaycarePlan", "Child-specific daycare assignments", 40, ["Student", "StudentEnrollmentContract", "ContractService", "DaycarePlanDefinition", "DaycarePlanPriceVersion", "MealCombination"]),
  reset("DaycareSession", "Daycare attendance and emergency ledger sessions", 31, ["Student", "StudentDaycarePlan", "DaycareRateSetting", "FeeInvoice", "AdminUser"]),
  reset("DaycareSessionMeal", "Meals recorded against daycare sessions", 18, ["DaycareSession", "MealDefinition"]),
  reset("StudentCharge", "Additional and emergency student charges", 32, ["Student", "StudentEnrollmentContract", "ContractService", "ChargeDefinition", "FeeInvoice", "AdminUser"]),
  reset("FeePayment", "Fee collections", 36, ["FeeInvoice", "Student", "AdminUser"]),
  reset("Receipt", "Fee receipts", 35, ["FeePayment", "Student"]),
  reset("FinancialCorrection", "Refund, reversal and correction ledger", 28, ["Student", "FeeInvoice", "FeePayment", "Receipt"]),
  reset("Expense", "Expense and accounting records", 53, ["AdminUser"]),
  reset("Staff", "Operational staff master records", 60, []),
  reset("StudentAttendance", "Student attendance", 20, ["Student", "AdminUser"]),
  reset("StaffAttendance", "Staff attendance", 54, ["Staff", "AdminUser", "StaffLeaveRequest"]),
  reset("StaffLeaveRequest", "Staff leave history", 56, ["Staff", "AdminUser"]),
  reset("StaffExtraDuty", "Staff extra-duty history", 55, ["Staff", "StaffPayroll", "AdminUser"]),
  reset("StaffPayroll", "Payroll and salary history", 57, ["Staff", "AdminUser"]),
  reset("ActivityLog", "Operational audit history", 58, ["AdminUser"]),
  preserve("CentreSetting", "Centre details and application settings", [], { systemRequired: true, websiteRequired: true, centreSetting: true }),
  preserve("AcademicCalendarDocument", "Owner-uploaded academic calendar source", [], { systemRequired: true, centreSetting: true }),
  preserve("AcademicCalendarEvent", "Centre academic/holiday calendar", ["AcademicCalendarDocument"], { systemRequired: true, websiteRequired: true, centreSetting: true }),
  reset("NumberSequence", "Operational invoice/receipt/student counters", 51, [], "Counters restart on demand after operational records are cleared."),
  reset("MarketingConversionJob", "Google/Meta conversion delivery queue", 7, ["Enquiry"]),
  reset("GrowthRecommendation", "Operational AI growth recommendations", 47, ["AdminUser"]),
  preserve("AiModelRoute", "Owner-configured AI feature/provider routing", [], { systemRequired: true, centreSetting: true }),
  reset("GrowthDataSnapshot", "Operational growth data snapshots", 12, []),
  reset("GrowthAnalysisRun", "Operational AI analysis runs", 13, []),
  preserve("LandingPage", "Owner-managed website landing-page content", [], { websiteRequired: true, centreSetting: true }),
  preserve("LandingPageVariant", "Published/draft website landing-page variants", ["LandingPage"], { websiteRequired: true, centreSetting: true }),
  preserve("LandingPageVersion", "Website landing-page rollback history", ["LandingPage"], { websiteRequired: true, centreSetting: true }),
  reset("GrowthExperiment", "Operational A/B experiment state", 16, ["LandingPage"]),
  reset("GrowthExperimentVariant", "Operational experiment allocations", 15, ["GrowthExperiment", "LandingPageVariant"]),
  preserve("InternalTrafficIdentity", "Owner-configured internal traffic exclusions", [], { systemRequired: true, websiteRequired: true, centreSetting: true }),
  preserve("CampaignUrl", "Owner-created website campaign URL configuration", ["LandingPage", "AdminUser"], { websiteRequired: true, centreSetting: true }),
  reset("AdminNotification", "Operational panel notifications", 4, ["AdminUser"]),
  reset("PushDevice", "Registered browser push devices", 6, ["AdminUser"]),
  partial("NotificationPreference", "Per-user notification preferences", 59, ["AdminUser"], {
    systemRequired: true,
    centreSetting: true,
    preserveWhere: `EXISTS (SELECT 1 FROM "AdminUser" u WHERE u."id" = "NotificationPreference"."adminUserId" AND u."role" = 'OWNER')`,
    resetWhere: `EXISTS (SELECT 1 FROM "AdminUser" u WHERE u."id" = "NotificationPreference"."adminUserId" AND u."role" <> 'OWNER')`,
    rationale: "Owner preferences remain; preferences belonging to reset Centre Head accounts are removed.",
  }),
  reset("PushNotificationDelivery", "Push delivery history", 3, ["AdminNotification", "PushDevice"]),
  reset("WhatsAppAutomationMessage", "WhatsApp operational queue and delivery history", 2, ["Enquiry", "Student", "FeeInvoice", "Receipt"]),
  reset("RateLimitBucket", "Distributed request-rate counters", 1, []),
  reset("BusinessIntelligenceSnapshot", "Operational owner intelligence snapshots", 14, []),
  reset("SystemHealthCheck", "Operational health-check history", 17, []),
  reset("ScheduledJobHeartbeat", "Scheduler heartbeat history", 19, []),
];

export const externalResetMatrix = [
  { source: "Sanity: websiteContentSettings", purpose: "Homepage/About content", classification: "PRESERVE", dependencies: ["Sanity assets"] },
  { source: "Sanity: websiteContactSettings", purpose: "Public phone, email and contact content", classification: "PRESERVE", dependencies: [] },
  { source: "Sanity: websiteMediaSlot", purpose: "Public page photographs/reels assigned to slots", classification: "PRESERVE", dependencies: ["Sanity assets"] },
  { source: "Sanity: websiteTeamMember", purpose: "Public teacher/Centre Head presentation", classification: "PRESERVE", dependencies: ["Sanity assets", "StoredFile WEBSITE_TEAM"] },
  { source: "Sanity: websiteTeamSettings", purpose: "Team movement speed and presentation", classification: "PRESERVE", dependencies: [] },
  { source: "Sanity: websiteGalleryAlbum", purpose: "Public gallery albums", classification: "PRESERVE", dependencies: ["websiteGalleryMedia"] },
  { source: "Sanity: websiteGalleryMedia", purpose: "Public gallery photos and Reels", classification: "PRESERVE", dependencies: ["Sanity assets", "StoredFile WEBSITE_GALLERY"] },
  { source: "Sanity: websiteTrackingSettings", purpose: "Website analytics/ad integration configuration", classification: "PRESERVE", dependencies: [] },
  { source: "Sanity: websiteProgrammeRatioSettings", purpose: "Public programme ratio presentation", classification: "PRESERVE", dependencies: [] },
  { source: "Sanity: websiteBlogPost", purpose: "Public articles and SEO content", classification: "PRESERVE", dependencies: ["Sanity assets"] },
  { source: "Sanity: websiteSeoSettings + websiteSeoPage", purpose: "Public metadata and sharing images", classification: "PRESERVE", dependencies: ["Sanity assets"] },
  { source: "Sanity: referenced image/file assets", purpose: "Public website and official document assets", classification: "PRESERVE", dependencies: ["referencing Sanity documents", "CentreSetting SCHOOL_PROFILE"] },
  { source: "Firestore: websiteEvents", purpose: "Anonymous operational website analytics", classification: "RESET", dependencies: [] },
  { source: "Firestore: leadSubmissions + leads", purpose: "Website lead mirrors", classification: "RESET", dependencies: ["Prisma Enquiry"] },
  { source: "Firestore: careerApplications", purpose: "Career application mirror", classification: "RESET", dependencies: ["Prisma CareerApplication"] },
  { source: "Firestore: aiRevisionHistory", purpose: "AI SEO revision mirror", classification: "RESET", dependencies: ["Prisma AiSeoRevision"] },
  { source: "Firestore: whatsappInbound + whatsappMessageStatus + whatsappMessages", purpose: "WhatsApp operational history", classification: "RESET", dependencies: ["Prisma WhatsAppAutomationMessage"] },
  { source: "Firestore: operational_feeinvoice + operational_feepayment + operational_receipt", purpose: "Financial read mirrors", classification: "RESET", dependencies: ["Prisma finance records"] },
  { source: "Firestore: adminSummaries + mediaProcessingJobs + operational_*", purpose: "Operational summaries, jobs and copied tables", classification: "RESET", dependencies: [] },
  { source: "Firebase Storage: public/website/**", purpose: "Public Gallery and Team assets", classification: "PRESERVE", dependencies: ["Sanity website documents", "StoredFile website inventory"] },
  { source: "Firebase Storage: private/students/**", purpose: "Private student documents", classification: "RESET", dependencies: ["StudentDocument", "StoredFile"] },
  { source: "Firebase configuration/rules/secrets", purpose: "Application startup and integration configuration", classification: "PRESERVE", dependencies: [] },
];

function parseArgs(argv) {
  const args = new Map();
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      args.set(item, next);
      index += 1;
    } else {
      args.set(item, true);
    }
  }
  return args;
}

function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const values = {};
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (!match) continue;
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    values[match[1]] = value;
  }
  return values;
}

export function schemaModelNames(schema = fs.readFileSync(schemaPath, "utf8")) {
  return [...schema.matchAll(/^model\s+([A-Za-z][A-Za-z0-9_]*)\s*\{/gm)].map((match) => match[1]);
}

export function validateResetMatrix(models = schemaModelNames()) {
  const names = prismaResetMatrix.map((entry) => entry.model);
  const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
  const missing = models.filter((name) => !names.includes(name));
  const unknown = names.filter((name) => !models.includes(name));
  const resetOrders = prismaResetMatrix.filter((entry) => entry.reset).map((entry) => entry.safeResetOrder);
  const duplicateOrders = resetOrders.filter((order, index) => resetOrders.indexOf(order) !== index);
  if (duplicates.length || missing.length || unknown.length || duplicateOrders.length) {
    throw new Error(`Reset matrix coverage failed (duplicates=${duplicates.join(",") || "none"}; missing=${missing.join(",") || "none"}; unknown=${unknown.join(",") || "none"}; duplicateOrders=${duplicateOrders.join(",") || "none"}).`);
  }
  return { totalModels: models.length, preserveModels: names.filter((name) => prismaResetMatrix.find((entry) => entry.model === name)?.preserve).length, resetModels: names.filter((name) => prismaResetMatrix.find((entry) => entry.model === name)?.reset).length };
}

function connectionConfiguration() {
  const env = {
    ...readEnvFile(path.join(projectRoot, ".env")),
    ...readEnvFile(path.join(projectRoot, ".env.local")),
    ...process.env,
  };
  const connectionString = env.DIRECT_URL || env.DATABASE_URL;
  if (!connectionString || connectionString.startsWith("prisma+") || connectionString.startsWith("prisma://")) {
    throw new Error("A direct PostgreSQL URL is required for the reset dry run. No credential was printed.");
  }
  return connectionString;
}

function quoteTable(name) {
  return `"${name.replaceAll('"', '""')}"`;
}

async function countMatrix(client) {
  const rows = [];
  for (const entry of prismaResetMatrix) {
    const table = quoteTable(entry.model);
    const count = async (where) => Number((await client.query(`SELECT COUNT(*)::bigint AS count FROM ${table}${where ? ` WHERE ${where}` : ""}`)).rows[0].count);
    if (entry.classification === "PARTIAL") {
      rows.push({ ...entry, preserveCount: await count(entry.preserveWhere), resetCount: await count(entry.resetWhere) });
    } else {
      const total = await count("");
      rows.push({ ...entry, preserveCount: entry.preserve ? total : 0, resetCount: entry.reset ? total : 0 });
    }
  }
  return rows;
}

function displayDryRun(rows, coverage) {
  console.log("CENTREOS CLEAN-SLATE RESET — STAGE A DRY RUN");
  console.log("No records were changed.");
  console.log(`Prisma models classified: ${coverage.totalModels}`);
  console.log(`Models with preserved data: ${coverage.preserveModels}`);
  console.log(`Models with reset candidates: ${coverage.resetModels}`);
  console.log("");
  for (const row of rows) {
    console.log(`${String(row.safeResetOrder ?? "-").padStart(2, " ")}  ${row.model.padEnd(32)} ${row.classification.padEnd(8)} preserve=${row.preserveCount} reset=${row.resetCount}`);
  }
  console.log("");
  console.log("External sources:");
  for (const entry of externalResetMatrix) console.log(`- ${entry.classification.padEnd(8)} ${entry.source}`);
  console.log("");
  console.log("STAGE B was NOT executed. External Firestore/Storage counts must be inventoried and backed up before Owner approval.");
}

async function executeDatabaseReset(client, rows, args) {
  const requiredPhrase = "RESET CENTREOS OPERATIONAL DATA";
  if (args.get("--confirmation") !== requiredPhrase) throw new Error(`Stage B refused. Supply the exact confirmation phrase: ${requiredPhrase}`);
  if (!args.get("--owner-email")) throw new Error("Stage B refused. An active Owner email must be supplied.");
  if (!args.get("--backup-verified")) throw new Error("Stage B refused. A verified external backup is required.");
  if (!args.get("--external-reset-verified")) throw new Error("Stage B refused. Firestore/private-storage reset verification is required to prevent a partial reset.");
  const productionLike = !["localhost", "127.0.0.1", "::1"].includes(new URL(connectionConfiguration()).hostname.toLowerCase());
  if (productionLike && !args.get("--allow-production")) throw new Error("Stage B refused on a managed/remote database without --allow-production.");
  const ownerResult = await client.query(`SELECT "id" FROM "AdminUser" WHERE "role" = 'OWNER' AND "active" = true AND lower("email") = lower($1)`, [args.get("--owner-email")]);
  if (ownerResult.rowCount !== 1) throw new Error("Stage B refused because the supplied active Owner identity did not match exactly once.");
  const unknownStoredModules = await client.query(`SELECT "module", COUNT(*)::int AS count FROM "StoredFile" WHERE "module" NOT IN ('WEBSITE_GALLERY', 'WEBSITE_TEAM', 'STUDENT_DOCUMENTS') GROUP BY "module" ORDER BY "module"`);
  if (unknownStoredModules.rowCount > 0) throw new Error("Stage B refused because unclassified StoredFile modules exist. Review the dry-run inventory first.");

  await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
  try {
    for (const entry of [...prismaResetMatrix].filter((item) => item.reset).sort((a, b) => a.safeResetOrder - b.safeResetOrder)) {
      const expected = rows.find((row) => row.model === entry.model)?.resetCount ?? 0;
      const where = entry.classification === "PARTIAL" ? ` WHERE ${entry.resetWhere}` : "";
      const result = await client.query(`DELETE FROM ${quoteTable(entry.model)}${where}`);
      if (result.rowCount !== expected) throw new Error(`Concurrent-change safety stop for ${entry.model}: expected ${expected}, matched ${result.rowCount}.`);
    }
    const resetReference = `prelaunch-reset-${new Date().toISOString()}`;
    const resetCounts = Object.fromEntries(
      rows
        .filter((row) => row.reset)
        .map((row) => [row.model, row.resetCount]),
    );
    await client.query(
      `INSERT INTO "ActivityLog" ("id", "adminUserId", "action", "entityType", "entityId", "description", "newData")
       VALUES ($1, $2, 'CREATED', 'SYSTEM_RESET', $3, 'PRE-LAUNCH TEST DATA HARD RESET COMPLETED', $4::jsonb)`,
      [randomUUID(), ownerResult.rows[0].id, resetReference, JSON.stringify({ resetReference, counts: resetCounts })],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function run(argv = process.argv.slice(2)) {
  const args = parseArgs(argv);
  const coverage = validateResetMatrix();
  if (args.get("--matrix-only")) {
    displayDryRun(prismaResetMatrix.map((entry) => ({ ...entry, preserveCount: "not queried", resetCount: "not queried" })), coverage);
    return;
  }
  const client = new Client({ connectionString: connectionConfiguration(), connectionTimeoutMillis: 20_000, query_timeout: 60_000, statement_timeout: 60_000, application_name: "centreos-clean-slate-reset" });
  await client.connect();
  try {
    await client.query("BEGIN READ ONLY");
    const rows = await countMatrix(client);
    await client.query("ROLLBACK");
    displayDryRun(rows, coverage);
    if (args.get("--execute")) {
      await executeDatabaseReset(client, rows, args);
      console.log("STAGE B database reset completed inside the explicitly authorised target database.");
    }
  } finally {
    await client.end();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : "Clean-slate reset failed safely.");
    process.exitCode = 1;
  });
}
