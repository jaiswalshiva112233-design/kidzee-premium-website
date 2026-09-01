import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const functionsEntry = path.join(root, "functions", "src", "index.js");

test("disabled optional integrations do not export scheduled Firebase jobs", () => {
  const script = `
    const functions = require(${JSON.stringify(functionsEntry)});
    process.stdout.write(JSON.stringify(Object.keys(functions).sort()));
  `;
  const env = { ...process.env };
  env.GCLOUD_PROJECT = "centreos-test";
  env.FIREBASE_CONFIG = JSON.stringify({
    projectId: "centreos-test",
    storageBucket: "centreos-test.appspot.com",
  });
  for (const flag of [
    "GROWTH_SUMMARY_SCHEDULER_ENABLED",
    "MARKETING_SCHEDULER_ENABLED",
    "GROWTH_SCHEDULER_ENABLED",
    "WHATSAPP_SCHEDULER_ENABLED",
    "NOTIFICATION_SCHEDULER_ENABLED",
    "OWNER_INTELLIGENCE_SCHEDULER_ENABLED",
  ]) {
    env[flag] = "false";
  }
  const exportsFound = JSON.parse(
    execFileSync(process.execPath, ["-e", script], {
      cwd: root,
      env,
      encoding: "utf8",
    }),
  );
  assert.deepEqual(exportsFound, ["generateMonthlyCentreInvoices", "processGalleryUpload"]);
});
