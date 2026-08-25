import { spawn } from "node:child_process";
import path from "node:path";

import pg from "pg";

const connectionString = String(process.env.DIRECT_URL || "").trim();
if (!/^postgres(?:ql)?:\/\//.test(connectionString)) {
  throw new Error("DIRECT_URL must be configured before preparing Prisma migrations.");
}

const legacyMigrations = [
  {
    name: "20260801184025_initial_centreos",
    tables: [
      "AdminUser", "Enquiry", "FollowUp", "Admission", "Student", "Guardian",
      "StudentFeeAccount", "FeePayment", "Receipt", "Expense", "Staff", "ActivityLog",
      "CentreSetting",
    ],
  },
  { name: "20260801211937_add_number_sequences", tables: ["NumberSequence"] },
  { name: "20260802070858_add_student_attendance", tables: ["StudentAttendance"] },
  {
    name: "20260802114821_add_programme_fee_settings",
    tables: ["ProgrammeFeeSetting", "LateFeeSetting"],
  },
  { name: "20260803134116_add_admin_credentials", tables: ["AdminCredential"] },
];

function prismaResolve(name) {
  return new Promise((resolve, reject) => {
    const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
    const child = spawn(process.execPath, [prismaCli, "migrate", "resolve", "--applied", name], {
      cwd: process.cwd(),
      env: { ...process.env, JITI_CACHE: "false" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += String(chunk); });
    child.stderr.on("data", (chunk) => { output += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Could not baseline migration ${name}: ${output}`));
    });
  });
}

const client = new pg.Client({ connectionString, connectionTimeoutMillis: 15_000 });
const migrationsToAdopt = [];
await client.connect();
try {
  const tableRows = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
  `);
  const existingTables = new Set(tableRows.rows.map((row) => row.table_name));
  const migrationTableExists = existingTables.has("_prisma_migrations");
  const applied = new Set();
  if (migrationTableExists) {
    const rows = await client.query(`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
    `);
    for (const row of rows.rows) applied.add(row.migration_name);
  }

  for (const migration of legacyMigrations) {
    if (applied.has(migration.name)) continue;
    const present = migration.tables.filter((table) => existingTables.has(table));
    if (present.length === 0) continue;
    if (present.length !== migration.tables.length) {
      throw new Error(
        `Cannot safely baseline ${migration.name}: only ${present.length} of ${migration.tables.length} expected tables exist.`,
      );
    }
    migrationsToAdopt.push(migration.name);
  }
} finally {
  await client.end();
}

for (const migration of migrationsToAdopt) {
  await prismaResolve(migration);
  console.log(`Adopted existing schema objects for ${migration}.`);
}

console.log("Existing database migration history is safe for prisma migrate deploy.");
