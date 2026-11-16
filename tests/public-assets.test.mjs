import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { copyPublicToStandalone } from "../scripts/copy-public-to-standalone.mjs";

async function fixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "kidzee-public-assets-"));
  t.after(async () => {
    const target = path.resolve(root);
    assert.equal(path.dirname(target), path.resolve(tmpdir()));
    assert.ok(path.basename(target).startsWith("kidzee-public-assets-"));
    await rm(target, { recursive: true, force: true });
  });
  await mkdir(path.join(root, "public", "images", "programmes"), { recursive: true });
  await mkdir(path.join(root, "public", "images", "landing"), { recursive: true });
  await writeFile(path.join(root, "public", "images", "programmes", "playgroup.jpg"), Buffer.from([255, 216, 255, 1, 2]));
  await writeFile(path.join(root, "public", "images", "landing", "classroom.webp"), "RIFF-test-photo");
  await writeFile(path.join(root, "public", "firebase-messaging-sw.js"), "// existing public worker");
  return root;
}

test("complete public assets are merged when a partial standalone public directory already exists", async t => {
  const root = await fixture(t);
  const destination = path.join(root, ".next", "standalone");
  await mkdir(path.join(destination, "public", "images"), { recursive: true });
  await writeFile(path.join(destination, "server.js"), "// standalone server");
  await writeFile(path.join(destination, "public", "images", "receipt-logo.png"), "keep traced logo");
  assert.deepEqual(await copyPublicToStandalone(root), { files: 3 });
  assert.deepEqual(await readFile(path.join(destination, "public", "images", "programmes", "playgroup.jpg")), Buffer.from([255, 216, 255, 1, 2]));
  assert.equal(await readFile(path.join(destination, "public", "images", "receipt-logo.png"), "utf8"), "keep traced logo");
  assert.equal(await readFile(path.join(destination, "public", "firebase-messaging-sw.js"), "utf8"), "// existing public worker");
});

test("repeated public-asset packaging preserves source bytes and replaces stale copies", async t => {
  const root = await fixture(t);
  const destination = path.join(root, ".next", "standalone");
  await mkdir(destination, { recursive: true });
  await writeFile(path.join(destination, "server.js"), "// standalone server");
  await copyPublicToStandalone(root);
  await writeFile(path.join(destination, "public", "images", "programmes", "playgroup.jpg"), "stale");
  await copyPublicToStandalone(root);
  assert.deepEqual(await readFile(path.join(destination, "public", "images", "programmes", "playgroup.jpg")), Buffer.from([255, 216, 255, 1, 2]));
});

test("packaging fails rather than reporting success without a standalone server", async t => {
  const root = await fixture(t);
  await assert.rejects(copyPublicToStandalone(root), /ENOENT/);
});
