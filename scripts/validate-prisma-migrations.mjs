import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const schema = fs.readFileSync(path.join(root, "prisma", "schema.prisma"), "utf8");
const migrationsRoot = path.join(root, "prisma", "migrations");
const migrationSql = fs.readdirSync(migrationsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .sort((a, b) => a.name.localeCompare(b.name))
  .map((entry) => fs.readFileSync(path.join(migrationsRoot, entry.name, "migration.sql"), "utf8"))
  .join("\n");

const models = [...schema.matchAll(/^model\s+(\w+)\s*\{/gm)].map((match) => match[1]);
const missingModels = models.filter((model) =>
  !new RegExp(`CREATE TABLE(?: IF NOT EXISTS)? "${model}"`, "m").test(migrationSql),
);
const enums = [...schema.matchAll(/^enum\s+(\w+)\s*\{/gm)].map((match) => match[1]);
const missingEnums = enums.filter((name) =>
  !new RegExp(`(?:CREATE TYPE\\s+|typname\\s*=\\s*)['"]?${name}`, "m").test(migrationSql),
);

if (missingModels.length || missingEnums.length) {
  if (missingModels.length) console.error(`Models missing from migrations: ${missingModels.join(", ")}`);
  if (missingEnums.length) console.error(`Enums missing from migrations: ${missingEnums.join(", ")}`);
  process.exit(1);
}
if (!migrationSql.includes('MarketingConversionJob_deduplicationKey_key')) {
  throw new Error("Marketing conversion idempotency migration is missing.");
}
if (!migrationSql.includes('RateLimitBucket_bucketKey_key')) {
  throw new Error("Distributed rate-limit uniqueness migration is missing.");
}
if (/\b(?:DROP\s+TABLE|DROP\s+COLUMN|TRUNCATE|DELETE\s+FROM)\b/i.test(migrationSql)) {
  throw new Error("Migration history contains a destructive data operation.");
}
console.log(`Migration coverage is complete for ${models.length} models and ${enums.length} enums.`);
