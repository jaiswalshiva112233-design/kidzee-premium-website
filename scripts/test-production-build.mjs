import { spawn } from "node:child_process";
import path from "node:path";

import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";

const database = new PGlite();
const port = 55441;
const server = new PGLiteSocketServer({ db: database, port, host: "127.0.0.1", maxConnections: 20 });
const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres?sslmode=disable`;

function run(args, extraEnvironment = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: databaseUrl,
        DIRECT_URL: databaseUrl,
        JITI_CACHE: "false",
        NEXT_TELEMETRY_DISABLED: "1",
        NEXT_PUBLIC_SITE_URL: "https://kidzeedwarka.com",
        NEXT_PUBLIC_SANITY_PROJECT_ID: "phase1build",
        NEXT_PUBLIC_SANITY_DATASET: "production",
        NEXT_PUBLIC_SANITY_API_VERSION: "2026-08-01",
        ADMIN_SESSION_SECRET: "phase1-build-session-secret-with-32-characters",
        INTERNAL_DEVICE_SECRET: "phase1-build-device-secret-with-32-characters",
        ADMIN_PANEL_PASSWORD: "Phase1BuildPassword!",
        ADMIN_OWNER_EMAIL: "owner@example.com",
        ADMIN_OWNER_NAME: "Owner",
        ...extraEnvironment,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let output = "";
    child.stdout.on("data", (chunk) => { output += String(chunk); });
    child.stderr.on("data", (chunk) => { output += String(chunk); });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`Production build verification failed with exit ${code}:\n${output}`));
    });
  });
}

try {
  await server.start();
  const prismaCli = path.join(process.cwd(), "node_modules", "prisma", "build", "index.js");
  await run([prismaCli, "migrate", "deploy"]);
  const nextCli = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
  await run([nextCli, "build", "--webpack"]);
  console.log("Production Next.js build passed against a fully migrated database.");
} finally {
  await server.stop().catch(() => undefined);
  await database.close();
}
