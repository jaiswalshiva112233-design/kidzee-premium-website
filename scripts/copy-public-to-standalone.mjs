import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { cp, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function publicAssetFiles(directory, relative = "") {
  const files = [];
  for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), `Public assets must not link outside the bundle: ${entry.name}`);
    const name = path.join(relative, entry.name);
    if (entry.isDirectory()) files.push(...await publicAssetFiles(directory, name));
    else if (entry.isFile()) files.push(name);
  }
  return files.sort();
}

export function assetDigest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export async function copyPublicToStandalone(root) {
  const project = path.resolve(root);
  const source = path.join(project, "public");
  const standalone = path.join(project, ".next", "standalone");
  assert.ok((await stat(path.join(standalone, "server.js"))).isFile(), "Standalone server must exist before packaging public assets");
  const files = await publicAssetFiles(source);
  assert.ok(files.length > 0, "Refusing a public-asset bundle with no files");
  // Firebase's adapter can skip public/ when server file tracing already put
  // only the receipt logo there. Merge the complete directory, never skip it.
  const destination = path.join(standalone, "public");
  await cp(source, destination, { recursive: true, force: true });
  for (const file of files) {
    const [original, copied] = await Promise.all([
      readFile(path.join(source, file)), readFile(path.join(destination, file)),
    ]);
    assert.equal(assetDigest(copied), assetDigest(original), `Public asset differs in standalone bundle: ${file}`);
  }
  return { files: files.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const result = await copyPublicToStandalone(root);
  console.log(`Standalone public assets packaged and verified: ${result.files} files.`);
}
