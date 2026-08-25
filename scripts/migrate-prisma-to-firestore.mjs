import "dotenv/config";
import { createHash, createSign } from "node:crypto";
import pg from "pg";

const execute = process.argv.includes("--execute");
if (execute && process.env.MIGRATION_CONFIRM !== "copy-prisma-to-firestore") {
  throw new Error("Set MIGRATION_CONFIRM=copy-prisma-to-firestore before an executing migration.");
}
const databaseUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const projectId = process.env.FIREBASE_PROJECT_ID;
if (!databaseUrl) throw new Error("DATABASE_URL or DIRECT_URL is required.");
if (!projectId) throw new Error("FIREBASE_PROJECT_ID is required.");

const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");
async function accessToken() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is required for local migration.");
  const account = JSON.parse(raw);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: "RS256", typ: "JWT" })}.${encode({ iss: account.client_email, sub: account.client_email, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600, scope: "https://www.googleapis.com/auth/datastore" })}`;
  const signer = createSign("RSA-SHA256"); signer.update(unsigned); signer.end();
  const assertion = `${unsigned}.${signer.sign(account.private_key, "base64url")}`;
  const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  if (!response.ok) throw new Error(`Google authentication failed (${response.status}).`);
  return (await response.json()).access_token;
}

function value(input) {
  if (input === null || input === undefined) return { nullValue: null };
  if (input instanceof Date) return { timestampValue: input.toISOString() };
  if (Buffer.isBuffer(input)) return { bytesValue: input.toString("base64") };
  if (typeof input === "bigint") return { integerValue: String(input) };
  if (typeof input === "boolean") return { booleanValue: input };
  if (typeof input === "number") return Number.isInteger(input) ? { integerValue: String(input) } : { doubleValue: input };
  if (typeof input === "string") return { stringValue: input };
  if (Array.isArray(input)) return { arrayValue: { values: input.map(value) } };
  if (typeof input === "object") return { mapValue: { fields: fields(input) } };
  return { stringValue: String(input) };
}
const fields = (object) => Object.fromEntries(Object.entries(object).map(([key, item]) => [key, value(item)]));
const quote = (name) => `"${name.replaceAll('"', '""')}"`;
const safeId = (raw) => encodeURIComponent(String(raw).replaceAll("/", "_").slice(0, 500));

const client = new pg.Client({ connectionString: databaseUrl });
await client.connect();
try {
  const tablesResult = await client.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name");
  const tableNames = tablesResult.rows.map((row) => row.table_name).filter((name) => name !== "_prisma_migrations");
  console.log(`${execute ? "EXECUTE" : "DRY RUN"}: ${tableNames.length} operational tables discovered.`);
  const token = execute ? await accessToken() : "";
  let total = 0;
  for (const table of tableNames) {
    const pkResult = await client.query("SELECT kcu.column_name FROM information_schema.table_constraints tc JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema WHERE tc.table_schema = 'public' AND tc.table_name = $1 AND tc.constraint_type = 'PRIMARY KEY' ORDER BY kcu.ordinal_position", [table]);
    const pkColumns = pkResult.rows.map((row) => row.column_name);
    let offset = 0;
    let tableCount = 0;
    for (;;) {
      const rows = (await client.query(`SELECT * FROM ${quote(table)} ORDER BY ${pkColumns.length ? pkColumns.map(quote).join(", ") : "ctid"} LIMIT 100 OFFSET $1`, [offset])).rows;
      if (rows.length === 0) break;
      if (execute) {
        const writes = rows.map((row) => {
          const identity = pkColumns.length ? pkColumns.map((column) => row[column]).join("__") : createHash("sha256").update(JSON.stringify(row)).digest("hex");
          const collection = `operational_${table.replace(/[^A-Za-z0-9_]/g, "_").toLowerCase()}`;
          return { update: { name: `projects/${projectId}/databases/(default)/documents/${collection}/${safeId(identity)}`, fields: fields({ ...row, _migration: { source: "prisma-postgres", sourceTable: table, migratedAt: new Date() } }) } };
        });
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:commit`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ writes }) });
        if (!response.ok) throw new Error(`Firestore commit failed for ${table} (${response.status}): ${(await response.text()).slice(0, 400)}`);
      }
      offset += rows.length; tableCount += rows.length; total += rows.length;
    }
    console.log(`${table}: ${tableCount} records ${execute ? "copied" : "ready"}.`);
  }
  console.log(`${execute ? "Migration complete" : "Dry run complete"}: ${total} records; no source records deleted.`);
} finally {
  await client.end();
}
