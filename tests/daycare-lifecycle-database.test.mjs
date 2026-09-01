import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { PGlite } from "@electric-sql/pglite";

import {
  daycareLifecycleStopAt,
  daycareServiceEndAt,
} from "../lib/admin/daycare-rules.ts";

const database = new PGlite();
const migrationsRoot = path.join(process.cwd(), "prisma", "migrations");

test.before(async () => {
  const migrations = fs
    .readdirSync(migrationsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .sort((left, right) => left.name.localeCompare(right.name));

  for (const migration of migrations) {
    const sql = fs.readFileSync(
      path.join(migrationsRoot, migration.name, "migration.sql"),
      "utf8",
    );
    await database.exec(sql);
  }
});

test.after(async () => {
  await database.close();
});

async function insertStudent(id, number) {
  await database.query(
    `INSERT INTO "Student"
      ("id", "studentNumber", "firstName", "dateOfBirth", "programme", "joiningDate", "createdAt", "updatedAt")
     VALUES ($1, $2, 'Lifecycle Test', '2022-01-01T00:00:00.000Z', 'DAYCARE', '2026-08-01T00:00:00.000Z', now(), now())`,
    [id, number],
  );
}

async function insertPlan({ id, studentId, effectiveFrom, active = true }) {
  await database.query(
    `INSERT INTO "StudentDaycarePlan"
      ("id", "studentId", "title", "planType", "billingMode", "scheduledWeekdays",
       "foodRequired", "foodOption", "monthlyFeeOverride", "effectiveFrom", "active",
       "lifecycleStatus", "createdAt", "updatedAt")
     VALUES ($1, $2, 'Database lifecycle plan', 'MONTHLY_DAYCARE_ONLY', 'FULL_DAY', ARRAY[1,2],
       true, 'BOTH', 6000, $3, $4, $5, now(), now())`,
    [id, studentId, effectiveFrom, active, active ? "ACTIVE" : "INACTIVE"],
  );
}

async function insertSession(id, number, studentId, planId, sessionDate) {
  await database.query(
    `INSERT INTO "DaycareSession"
      ("id", "sessionNumber", "studentId", "planId", "sessionDate", "billingMode",
       "baseAmount", "totalAmount", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 'FULL_DAY', 400, 400, now(), now())`,
    [id, number, studentId, planId, sessionDate],
  );
}

test("the migrated database rejects the old archive payload and accepts the corrected lifecycle stop", async () => {
  const studentId = "db-lifecycle-student-1";
  const planId = "db-lifecycle-plan-1";
  const effectiveFrom = new Date("2026-08-31T00:00:00.000Z");
  const actionAt = new Date("2026-08-27T00:00:00.000Z");
  await insertStudent(studentId, "DB-LIFE-001");
  await insertPlan({ id: planId, studentId, effectiveFrom });

  await assert.rejects(
    database.query(
      `UPDATE "StudentDaycarePlan"
       SET "lifecycleStatus" = 'ARCHIVED', "active" = false,
           "billingStoppedAt" = $2, "updatedAt" = now()
       WHERE "id" = $1`,
      [planId, actionAt],
    ),
    /StudentDaycarePlan_catalogue_values_check/,
  );

  const lifecycleStop = daycareLifecycleStopAt(effectiveFrom, actionAt);
  await database.query(
    `UPDATE "StudentDaycarePlan"
     SET "lifecycleStatus" = 'ARCHIVED', "active" = false,
         "billingStoppedAt" = $2, "updatedAt" = now()
     WHERE "id" = $1`,
    [planId, lifecycleStop],
  );
  const saved = await database.query(
    `SELECT "lifecycleStatus", "active", "billingStoppedAt", "effectiveFrom",
            "planType", "billingMode", "foodOption", "monthlyFeeOverride"
     FROM "StudentDaycarePlan" WHERE "id" = $1`,
    [planId],
  );
  assert.equal(saved.rows[0].lifecycleStatus, "ARCHIVED");
  assert.equal(saved.rows[0].active, false);
  assert.equal(
    new Date(saved.rows[0].billingStoppedAt).toISOString(),
    new Date(saved.rows[0].effectiveFrom).toISOString(),
  );
  assert.equal(saved.rows[0].planType, "MONTHLY_DAYCARE_ONLY");
  assert.equal(saved.rows[0].billingMode, "FULL_DAY");
  assert.equal(saved.rows[0].foodOption, "BOTH");
  assert.equal(Number(saved.rows[0].monthlyFeeOverride), 6000);
});

test("future and already-started plans use valid archive and deactivate dates", async () => {
  const actionAt = new Date("2026-08-27T12:00:00.000Z");
  const cases = [
    {
      suffix: "future-deactivate",
      target: "INACTIVE",
      effectiveFrom: new Date("2026-09-03T00:00:00.000Z"),
      expected: new Date("2026-09-03T00:00:00.000Z"),
    },
    {
      suffix: "started-archive",
      target: "ARCHIVED",
      effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
      expected: actionAt,
    },
    {
      suffix: "started-deactivate",
      target: "INACTIVE",
      effectiveFrom: new Date("2026-08-02T00:00:00.000Z"),
      expected: actionAt,
    },
  ];

  for (const entry of cases) {
    const studentId = `db-lifecycle-student-${entry.suffix}`;
    const planId = `db-lifecycle-plan-${entry.suffix}`;
    await insertStudent(studentId, `DB-${entry.suffix.toUpperCase()}`);
    await insertPlan({
      id: planId,
      studentId,
      effectiveFrom: entry.effectiveFrom,
    });
    const stoppedAt = daycareLifecycleStopAt(entry.effectiveFrom, actionAt);
    await database.query(
      `UPDATE "StudentDaycarePlan"
       SET "lifecycleStatus" = $2, "active" = false,
           "billingStoppedAt" = $3, "updatedAt" = now()
       WHERE "id" = $1`,
      [planId, entry.target, stoppedAt],
    );
    const saved = await database.query(
      `SELECT "lifecycleStatus", "active", "billingStoppedAt"
       FROM "StudentDaycarePlan" WHERE "id" = $1`,
      [planId],
    );
    const databaseExpected = await database.query(
      `SELECT $1::timestamp AS value`,
      [entry.expected],
    );
    assert.equal(saved.rows[0].lifecycleStatus, entry.target);
    assert.equal(saved.rows[0].active, false);
    assert.equal(
      new Date(saved.rows[0].billingStoppedAt).toISOString(),
      new Date(databaseExpected.rows[0].value).toISOString(),
    );
  }
});

test("lifecycle updates preserve attendance and finance history and keep linked service dates valid", async () => {
  const studentId = "db-lifecycle-student-history";
  const planId = "db-lifecycle-plan-history";
  const contractId = "db-lifecycle-contract-history";
  const serviceId = "db-lifecycle-service-history";
  const effectiveFrom = new Date("2026-08-01T00:00:00.000Z");
  const actionAt = new Date("2026-08-27T12:00:00.000Z");
  await insertStudent(studentId, "DB-LIFE-HISTORY");
  await database.query(
    `INSERT INTO "StudentEnrollmentContract"
      ("id", "contractNumber", "studentId", "academicSession", "status", "startDate",
       "daycareEnabled", "createdAt", "updatedAt")
     VALUES ($1, 'DB-CONTRACT-HISTORY', $2, '2026-27', 'ACTIVE', $3, true, now(), now())`,
    [contractId, studentId, effectiveFrom],
  );
  await database.query(
    `INSERT INTO "ContractService"
      ("id", "contractId", "serviceType", "category", "label", "amountSnapshot",
       "taxableValue", "total", "recurring", "frequency", "effectiveFrom", "status",
       "createdAt", "updatedAt")
     VALUES ($1, $2, 'DAYCARE', 'DAYCARE_FEE', 'History plan', 6000, 6000, 6000,
       true, 'MONTHLY', $3, 'ACTIVE', now(), now())`,
    [serviceId, contractId, effectiveFrom],
  );
  await insertPlan({ id: planId, studentId, effectiveFrom });
  await database.query(
    `UPDATE "StudentDaycarePlan"
     SET "enrollmentContractId" = $2, "contractServiceId" = $3
     WHERE "id" = $1`,
    [planId, contractId, serviceId],
  );
  await insertSession(
    "db-lifecycle-session-history",
    "DB-LIFE-SESSION-HISTORY",
    studentId,
    planId,
    new Date("2026-08-20T00:00:00.000Z"),
  );
  await database.query(
    `INSERT INTO "FeeInvoice"
      ("id", "invoiceNumber", "billingKey", "studentId", "enrollmentContractId",
       "category", "feePeriodLabel", "dueDate", "amountBeforeTax", "totalAmount",
       "pendingAmount", "createdAt", "updatedAt")
     VALUES ('db-lifecycle-invoice-history', 'DB-LIFE-INV-HISTORY', 'db-life-bill-history',
       $1, $2, 'DAYCARE_FEE', 'August 2026', '2026-08-05T00:00:00.000Z',
       6000, 6000, 6000, now(), now())`,
    [studentId, contractId],
  );
  await database.query(
    `INSERT INTO "FeeInvoiceItem"
      ("id", "invoiceId", "contractServiceId", "category", "title", "unitAmount",
       "amount", "taxableAmount", "totalAmount", "chargeKey", "sourceType", "sourceId",
       "createdAt", "updatedAt")
     VALUES ('db-lifecycle-item-history', 'db-lifecycle-invoice-history', $2,
       'DAYCARE_FEE', 'History plan', 6000, 6000, 6000, 6000,
       'db-life-charge-history', 'StudentDaycarePlan', $1, now(), now())`,
    [planId, serviceId],
  );
  await database.query(
    `INSERT INTO "StudentCharge"
      ("id", "chargeNumber", "chargeKey", "studentId", "enrollmentContractId",
       "contractServiceId", "category", "title", "chargeDate", "amount",
       "createdAt", "updatedAt")
     VALUES ('db-lifecycle-charge-history', 'DB-LIFE-CHG-HISTORY',
       'db-life-ledger-history', $1, $2, $3, 'DAYCARE_FEE', 'History plan',
       '2026-08-01T00:00:00.000Z', 6000, now(), now())`,
    [studentId, contractId, serviceId],
  );
  await database.query(
    `INSERT INTO "ActivityLog"
      ("id", "action", "entityType", "entityId", "description", "createdAt")
     VALUES ('db-lifecycle-log-before', 'CREATED', 'StudentDaycarePlan', $1,
       'Plan created', now())`,
    [planId],
  );

  const serviceEnd = daycareServiceEndAt(effectiveFrom, null, actionAt);
  await database.transaction(async (transaction) => {
    await transaction.query(
      `UPDATE "StudentDaycarePlan"
       SET "lifecycleStatus" = 'ARCHIVED', "active" = false,
           "billingStoppedAt" = $2, "updatedAt" = now()
       WHERE "id" = $1`,
      [planId, daycareLifecycleStopAt(effectiveFrom, actionAt)],
    );
    await transaction.query(
      `UPDATE "ContractService"
       SET "status" = 'ENDED', "effectiveTo" = $2, "updatedAt" = now()
       WHERE "id" = $1`,
      [serviceId, serviceEnd],
    );
    await transaction.query(
      `INSERT INTO "ActivityLog"
        ("id", "action", "entityType", "entityId", "description", "createdAt")
       VALUES ('db-lifecycle-log-after', 'UPDATED', 'StudentDaycarePlan', $1,
         'Plan archived', now())`,
      [planId],
    );
  });

  const retained = await database.query(
    `SELECT
       (SELECT count(*)::int FROM "DaycareSession" WHERE "planId" = $1) AS sessions,
       (SELECT count(*)::int FROM "FeeInvoiceItem" WHERE "sourceId" = $1) AS invoice_items,
       (SELECT count(*)::int FROM "StudentCharge" WHERE "contractServiceId" = $2) AS charges,
       (SELECT count(*)::int FROM "ActivityLog" WHERE "entityType" = 'StudentDaycarePlan' AND "entityId" = $1) AS audit_logs,
       (SELECT "status" FROM "ContractService" WHERE "id" = $2) AS service_status,
       (SELECT "effectiveTo" FROM "ContractService" WHERE "id" = $2) AS service_end`,
    [planId, serviceId],
  );
  const databaseServiceEnd = await database.query(
    `SELECT $1::timestamp AS value`,
    [serviceEnd],
  );
  assert.deepEqual(
    {
      sessions: retained.rows[0].sessions,
      invoiceItems: retained.rows[0].invoice_items,
      charges: retained.rows[0].charges,
      auditLogs: retained.rows[0].audit_logs,
      serviceStatus: retained.rows[0].service_status,
      serviceEnd: new Date(retained.rows[0].service_end).toISOString(),
    },
    {
      sessions: 1,
      invoiceItems: 1,
      charges: 1,
      auditLogs: 2,
      serviceStatus: "ENDED",
      serviceEnd: new Date(databaseServiceEnd.rows[0].value).toISOString(),
    },
  );
});

test("a stale delete review cannot remove a plan after attendance arrives", async () => {
  const studentId = "db-lifecycle-student-2";
  const planId = "db-lifecycle-plan-2";
  await insertStudent(studentId, "DB-LIFE-002");
  await insertPlan({
    id: planId,
    studentId,
    effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
    active: false,
  });

  const preview = await database.query(
    `SELECT count(*)::int AS count FROM "DaycareSession" WHERE "planId" = $1`,
    [planId],
  );
  assert.equal(preview.rows[0].count, 0);

  await insertSession(
    "db-lifecycle-session-2",
    "DB-LIFE-SESSION-002",
    studentId,
    planId,
    new Date("2026-08-20T00:00:00.000Z"),
  );
  const removed = await database.query(
    `DELETE FROM "StudentDaycarePlan" AS plan
     WHERE plan."id" = $1
       AND plan."active" = false
       AND NOT EXISTS (
         SELECT 1 FROM "DaycareSession" AS session WHERE session."planId" = plan."id"
       )
     RETURNING plan."id"`,
    [planId],
  );
  assert.equal(removed.rows.length, 0);
  const retained = await database.query(
    `SELECT
       (SELECT count(*)::int FROM "StudentDaycarePlan" WHERE "id" = $1) AS plans,
       (SELECT count(*)::int FROM "DaycareSession" WHERE "planId" = $1) AS sessions`,
    [planId],
  );
  assert.deepEqual(retained.rows[0], { plans: 1, sessions: 1 });
});

test("a failed destructive transaction restores the plan and its attendance and billing links", async () => {
  const studentId = "db-lifecycle-student-3";
  const planId = "db-lifecycle-plan-3";
  await insertStudent(studentId, "DB-LIFE-003");
  await insertPlan({
    id: planId,
    studentId,
    effectiveFrom: new Date("2026-08-01T00:00:00.000Z"),
    active: false,
  });
  await insertSession(
    "db-lifecycle-session-3",
    "DB-LIFE-SESSION-003",
    studentId,
    planId,
    new Date("2026-08-21T00:00:00.000Z"),
  );
  await database.query(
    `INSERT INTO "FeeInvoice"
      ("id", "invoiceNumber", "billingKey", "studentId", "category", "feePeriodLabel",
       "dueDate", "amountBeforeTax", "totalAmount", "pendingAmount", "createdAt", "updatedAt")
     VALUES ('db-lifecycle-invoice-3', 'DB-LIFE-INV-003', 'db-life-bill-003', $1,
       'DAYCARE_FEE', 'Database lifecycle test', '2026-08-05T00:00:00.000Z', 6000, 6000, 6000, now(), now())`,
    [studentId],
  );
  await database.query(
    `INSERT INTO "FeeInvoiceItem"
      ("id", "invoiceId", "category", "title", "unitAmount", "amount", "taxableAmount",
       "totalAmount", "chargeKey", "sourceType", "sourceId", "createdAt", "updatedAt")
     VALUES ('db-lifecycle-item-3', 'db-lifecycle-invoice-3', 'DAYCARE_FEE',
       'Database lifecycle plan', 6000, 6000, 6000, 6000, 'db-life-charge-003',
       'StudentDaycarePlan', $1, now(), now())`,
    [planId],
  );

  await assert.rejects(
    database.transaction(async (transaction) => {
      await transaction.query(
        `DELETE FROM "StudentDaycarePlan" WHERE "id" = $1`,
        [planId],
      );
      throw new Error("simulated linked cleanup failure");
    }),
    /simulated linked cleanup failure/,
  );

  const retained = await database.query(
    `SELECT
       (SELECT count(*)::int FROM "StudentDaycarePlan" WHERE "id" = $1) AS plans,
       (SELECT count(*)::int FROM "DaycareSession" WHERE "planId" = $1) AS sessions,
       (SELECT count(*)::int FROM "FeeInvoiceItem" WHERE "sourceId" = $1) AS invoice_items`,
    [planId],
  );
  assert.deepEqual(retained.rows[0], {
    plans: 1,
    sessions: 1,
    invoice_items: 1,
  });
});

test("local migrated database has no incompatible rows behind unvalidated checks", async (context) => {
  const constraints = await database.query(`
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
  assert.ok(
    constraints.rows.length >= 20,
    "expected the migrated local database to retain the audited NOT VALID checks",
  );

  const report = [];
  for (const constraint of constraints.rows) {
    const schemaName = `"${constraint.schema_name.replaceAll('"', '""')}"`;
    const tableName = `"${constraint.table_name.replaceAll('"', '""')}"`;
    const count = await database.query(
      `SELECT count(*)::int AS incompatible_rows
       FROM ${schemaName}.${tableName}
       WHERE (${constraint.check_expression}) IS FALSE`,
    );
    report.push({
      constraint: constraint.constraint_name,
      table: constraint.table_name,
      incompatibleRows: Number(count.rows[0].incompatible_rows),
    });
  }

  assert.deepEqual(
    report.filter((entry) => entry.incompatibleRows > 0),
    [],
  );
  context.diagnostic(
    `Local read-only constraint audit: ${report.length} constraints, 0 incompatible rows.`,
  );
});
