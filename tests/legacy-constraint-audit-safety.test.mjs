import assert from "node:assert/strict";
import test from "node:test";

import { PGlite } from "@electric-sql/pglite";

import {
  isLocalAuditUrl,
  normalUserActionForTable,
  quoteIdentifier,
} from "../scripts/audit-local-legacy-constraints.mjs";

test("legacy constraint audit accepts isolated local PostgreSQL only", () => {
  assert.equal(
    isLocalAuditUrl("postgresql://audit:secret@localhost:5432/centreos_audit"),
    true,
  );
  assert.equal(
    isLocalAuditUrl("postgresql://audit:secret@127.0.0.1:5432/centreos_audit"),
    true,
  );
  assert.equal(
    isLocalAuditUrl("postgresql://audit:secret@[::1]:5432/centreos_audit"),
    true,
  );
  assert.equal(
    isLocalAuditUrl("postgresql://audit:secret@db.prisma.io:5432/postgres"),
    false,
  );
  assert.equal(isLocalAuditUrl("not-a-url"), false);
});

test("legacy constraint audit safely quotes catalogue identifiers", () => {
  assert.equal(quoteIdentifier("StudentDaycarePlan"), '"StudentDaycarePlan"');
  assert.equal(quoteIdentifier('name"with-quote'), '"name""with-quote"');
});

test("legacy constraint report explains normal daycare and finance actions", () => {
  assert.match(normalUserActionForTable("StudentDaycarePlan"), /pause/);
  assert.match(normalUserActionForTable("DaycareSession"), /daycare visit/);
  assert.match(normalUserActionForTable("FeeInvoice"), /invoice/);
});

test("read-only audit transaction uses a valid serializable deferrable mode", async () => {
  const database = new PGlite();
  try {
    await database.query(
      "BEGIN ISOLATION LEVEL SERIALIZABLE READ ONLY DEFERRABLE",
    );
    const result = await database.query("SELECT 1::int AS value");
    assert.equal(result.rows[0].value, 1);
    await database.query("ROLLBACK");
  } finally {
    await database.close();
  }
});
