import process from "node:process";
import { pathToFileURL } from "node:url";

import { Client } from "pg";

const ACTION_BY_TABLE = {
  StudentDaycarePlan: "Edit, pause, archive, resume or remove a child plan",
  DaycareRateSetting: "Save or end a daycare rate version",
  DaycarePlanDefinition: "Edit, archive or replace a daycare catalogue plan",
  DaycarePlanPriceVersion: "Save or end a daycare plan price version",
  DaycareSession: "Complete, approve or edit a daycare visit",
  DaycareSessionMeal: "Save or edit meals for a daycare visit",
  MealPriceVersion: "Save or end a meal price version",
  MealCombinationPriceVersion: "Save or end a meal-combination price version",
  ProgrammeDefinition: "Edit or replace a preschool programme",
  ProgrammeFeeVersion: "Save or end a programme fee version",
  FeeInvoice: "Create, pay, adjust or cancel an invoice",
  FeeInvoiceItem: "Create or adjust an invoice line",
  FeePayment: "Record or correct a payment",
  StudentCharge: "Create, approve, invoice or cancel a student charge",
  ChargeDefinition: "Edit or archive an additional-charge definition",
};

export function isLocalAuditUrl(value) {
  try {
    const url = new URL(value);
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      ["localhost", "127.0.0.1", "::1", "[::1]"].includes(url.hostname)
    );
  } catch {
    return false;
  }
}

export function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

export function normalUserActionForTable(tableName) {
  return ACTION_BY_TABLE[tableName] ?? "Update an existing record in this table";
}

export async function auditLocalLegacyConstraints(connectionString) {
  if (!isLocalAuditUrl(connectionString)) {
    throw new Error(
      "Set LOCAL_LEGACY_AUDIT_DATABASE_URL to an isolated local PostgreSQL database. Remote and production hosts are blocked.",
    );
  }

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5_000,
    query_timeout: 15_000,
    statement_timeout: 15_000,
    application_name: "centreos-read-only-legacy-constraint-audit",
  });

  await client.connect();
  try {
    await client.query(
      "BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE",
    );
    await client.query("SET LOCAL statement_timeout = '15s'");
    const constraints = await client.query(`
      SELECT
        namespace.nspname AS schema_name,
        relation.relname AS table_name,
        constraint_record.conname AS constraint_name,
        pg_get_expr(constraint_record.conbin, constraint_record.conrelid) AS check_expression
      FROM pg_constraint AS constraint_record
      JOIN pg_class AS relation
        ON relation.oid = constraint_record.conrelid
      JOIN pg_namespace AS namespace
        ON namespace.oid = relation.relnamespace
      WHERE constraint_record.contype = 'c'
        AND NOT constraint_record.convalidated
        AND namespace.nspname = current_schema()
      ORDER BY relation.relname, constraint_record.conname
    `);

    const report = [];
    for (const constraint of constraints.rows) {
      const schemaName = quoteIdentifier(constraint.schema_name);
      const tableName = quoteIdentifier(constraint.table_name);
      const result = await client.query(
        `SELECT count(*)::int AS incompatible_rows
         FROM ${schemaName}.${tableName}
         WHERE (${constraint.check_expression}) IS FALSE`,
      );
      report.push({
        constraint: constraint.constraint_name,
        table: constraint.table_name,
        incompatibleRows: Number(result.rows[0]?.incompatible_rows ?? 0),
        normalUserAction: normalUserActionForTable(constraint.table_name),
      });
    }
    await client.query("ROLLBACK");
    return report;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  const connectionString = process.env.LOCAL_LEGACY_AUDIT_DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "LOCAL_LEGACY_AUDIT_DATABASE_URL is required. Use an isolated local PostgreSQL database; the production URL is intentionally not read.",
    );
  }
  const report = await auditLocalLegacyConstraints(connectionString);
  console.table(report);
  const incompatibleRows = report.reduce(
    (total, item) => total + item.incompatibleRows,
    0,
  );
  console.log(
    `Audited ${report.length} unvalidated CHECK constraints in a read-only transaction; ${incompatibleRows} incompatible rows found.`,
  );
}

if (
  process.argv[1] &&
  pathToFileURL(process.argv[1]).href === import.meta.url
) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
