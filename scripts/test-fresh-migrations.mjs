import fs from "node:fs";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";

const root = process.cwd();
const migrationsRoot = path.join(root, "prisma", "migrations");
const migrations = fs.readdirSync(migrationsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name));

const database = new PGlite();
try {
  for (const migration of migrations) {
    const file = path.join(migrationsRoot, migration.name, "migration.sql");
    if (!fs.existsSync(file)) throw new Error(`Migration ${migration.name} has no migration.sql file.`);
    const sql = fs.readFileSync(file, "utf8").trim();
    if (!sql) throw new Error(`Migration ${migration.name} is empty.`);
    try {
      await database.exec(sql);
    } catch (error) {
      throw new Error(`Fresh database failed at migration ${migration.name}.`, { cause: error });
    }
  }
  const rows = await database.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  const tables = new Set(rows.rows.map((row) => row.table_name));
  for (const required of [
    "Enquiry", "Student", "FeeInvoice", "StudentDaycarePlan", "StaffPayroll",
    "MarketingConversionJob", "RateLimitBucket",
  ]) {
    if (!tables.has(required)) throw new Error(`Fresh database is missing ${required}.`);
  }
  console.log(`Fresh PostgreSQL migration test passed (${migrations.length} migrations, ${tables.size} tables).`);
} finally {
  await database.close();
}
