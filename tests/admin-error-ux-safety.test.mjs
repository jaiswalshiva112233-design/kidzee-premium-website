import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { publicPersistenceError } from "../lib/admin/public-persistence-error.ts";

const projectRoot = process.cwd();

function adminRouteSources() {
  const root = path.join(projectRoot, "app", "api", "admin");
  const files = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      else if (entry.isFile() && entry.name === "route.ts") files.push(absolute);
    }
  };
  visit(root);
  return files.map((file) => ({ file, source: fs.readFileSync(file, "utf8") }));
}

test("admin API user messages no longer instruct Centre Head users to inspect a server terminal", () => {
  const offenders = adminRouteSources()
    .filter(({ source }) => /server terminal|check the terminal|terminal for/i.test(source))
    .map(({ file }) => path.relative(projectRoot, file));
  assert.deepEqual(offenders, []);
});

test("Gallery and Website Team do not expose internal configuration names", () => {
  for (const file of [
    "app/api/admin/gallery/route.ts",
    "app/api/admin/website-team/route.ts",
  ]) {
    const route = fs.readFileSync(path.join(projectRoot, file), "utf8");
    assert.doesNotMatch(route, /SANITY_API_WRITE_TOKEN/);
    assert.doesNotMatch(route, /NEXT_PUBLIC_SANITY_DATASET/);
    assert.match(route, /contact the Owner/i);
  }
});

for (const databaseCode of [
  "P2002",
  "P2003",
  "P2004",
  "P2025",
  "P2034",
  "23503",
  "23505",
  "23514",
]) {
  test(`persistence error ${databaseCode} produces operational wording only`, () => {
    const translated = publicPersistenceError(
      {
        code: databaseCode.startsWith("P") ? databaseCode : "UNKNOWN",
        message: `Prisma SQLSTATE ${databaseCode} constraint secret DATABASE_URL C:\\private\\file.ts`,
        stack: "private stack trace",
      },
      "Something prevented this change from saving. Please try again. If it happens again, contact the Owner.",
    );
    assert.ok(translated.status >= 400 && translated.status < 600);
    assert.doesNotMatch(
      translated.message,
      /Prisma|SQLSTATE|constraint|DATABASE_URL|secret|stack|\.ts/i,
    );
    assert.match(
      translated.message,
      /refresh|review|try|contact|archive|record/i,
    );
  });
}

test("unexpected persistence errors return only the supplied safe fallback", () => {
  const fallback =
    "Something prevented this change from saving. Please try again. If it happens again, contact the Owner.";
  const translated = publicPersistenceError(
    new Error("Prisma password=hidden SQLSTATE 99999"),
    fallback,
  );
  assert.equal(translated.status, 500);
  assert.equal(translated.message, fallback);
});
