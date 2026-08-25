import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

function run(executable, args, databaseUrl, label) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        DIRECT_URL: databaseUrl,
        JITI_CACHE: "false",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += String(chunk); });
    child.stderr.on("data", (chunk) => { output += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${label} failed with exit ${code}:\n${output}`));
    });
  });
}

function prisma(databaseUrl, ...args) {
  const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  return run(process.execPath, [prismaCli, ...args], databaseUrl, `prisma ${args.join(" ")}`);
}

async function withDatabase(port, action) {
  const database = new PGlite();
  const server = new PGLiteSocketServer({
    db: database,
    port,
    host: "127.0.0.1",
    maxConnections: 10,
  });
  const url = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable`;
  try {
    await server.start();
    await action(database, url);
  } finally {
    await server.stop().catch(() => undefined);
    await database.close();
  }
}

await withDatabase(55439, async (database, databaseUrl) => {
  await prisma(databaseUrl, "migrate", "deploy");
  const status = await prisma(databaseUrl, "migrate", "status");
  if (!/up to date|Database schema is up to date/i.test(status)) {
    throw new Error(`Prisma migration status did not confirm a clean deployment:\n${status}`);
  }
  for (let index = 0; index < 5; index += 1) {
    await database.query(
      `INSERT INTO "RateLimitBucket"
        ("id", "bucketKey", "scope", "windowStart", "windowEnd", "count", "updatedAt")
       VALUES ($1, 'phase1-rate-key', 'phase1', now(), now() + interval '1 minute', 1, now())
       ON CONFLICT ("bucketKey") DO UPDATE SET "count" = "RateLimitBucket"."count" + 1`,
      [`phase1-rate-${index}`],
    );
  }
  const rateBucket = await database.query(
    `SELECT "count" FROM "RateLimitBucket" WHERE "bucketKey" = 'phase1-rate-key'`,
  );
  if (rateBucket.rows[0]?.count !== 5) {
    throw new Error("Distributed rate-limit increments are not atomic.");
  }
  console.log("prisma migrate deploy passed against a fresh PostgreSQL-compatible database.");
});

await withDatabase(55440, async (database, databaseUrl) => {
  const legacy = [
    "20260801184025_initial_centreos",
    "20260801211937_add_number_sequences",
    "20260802070858_add_student_attendance",
    "20260802114821_add_programme_fee_settings",
    "20260803134116_add_admin_credentials",
  ];
  for (const name of legacy) {
    const sql = fs.readFileSync(path.join(process.cwd(), "prisma", "migrations", name, "migration.sql"), "utf8");
    await database.exec(sql);
  }
  await database.exec(`
    INSERT INTO "NumberSequence" ("id", "key", "currentValue", "updatedAt")
    VALUES ('phase1-preserve', 'PHASE1', 37, CURRENT_TIMESTAMP)
  `);
  await database.exec(`
    CREATE TABLE "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);
  for (const name of legacy) {
    const sql = fs.readFileSync(path.join(process.cwd(), "prisma", "migrations", name, "migration.sql"), "utf8");
    const checksum = createHash("sha256").update(sql).digest("hex");
    await database.query(
      `INSERT INTO "_prisma_migrations"
        ("id", "checksum", "finished_at", "migration_name", "started_at", "applied_steps_count")
       VALUES ($1, $2, now(), $3, now(), 1)`,
      [randomUUID(), checksum, name],
    );
  }
  await prisma(databaseUrl, "migrate", "deploy");
  const preserved = await database.query(`
    SELECT "currentValue" FROM "NumberSequence" WHERE "id" = 'phase1-preserve'
  `);
  if (preserved.rows[0]?.currentValue !== 37) {
    throw new Error("Existing data changed while adopting the migration history.");
  }
  const queue = await database.query(`SELECT to_regclass('public."MarketingConversionJob"') AS table_name`);
  if (!queue.rows[0]?.table_name) throw new Error("Upgrade deployment did not create the marketing queue.");
  console.log("Existing production data was preserved while the remaining migrations deployed.");
});
