import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assetDigest, publicAssetFiles } from "./copy-public-to-standalone.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const source = path.join(root, "public");
const urlIndex = process.argv.indexOf("--url");
const reportIndex = process.argv.indexOf("--report");
const live = urlIndex >= 0;
const origin = live ? new URL(process.argv[urlIndex + 1]).origin : "http://127.0.0.1:3101";
if (live) assert.equal(new URL(origin).protocol, "https:", "Live asset checks require HTTPS");
let app;
let logs = "";
try {
  if (!live) {
    app = spawn(process.execPath, [path.join(root, ".next", "standalone", "server.js")], {
      cwd: path.join(root, ".next", "standalone"),
      env: { ...process.env, HOSTNAME: "127.0.0.1", PORT: "3101" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    app.stdout.on("data", chunk => { logs += String(chunk); });
    app.stderr.on("data", chunk => { logs += String(chunk); });
    let ready = false;
    for (let attempt = 0; attempt < 60; attempt++) {
      try {
        const response = await fetch(origin + "/images/kidzee-logo.png", { signal: AbortSignal.timeout(2000) });
        if (response.ok) { await response.arrayBuffer(); ready = true; break; }
      } catch {}
      if (app.exitCode !== null) break;
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    assert.ok(ready, "Standalone server did not serve its public logo: " + logs.slice(-1200));
  }
  const files = (await publicAssetFiles(source)).filter(file => /\.(?:png|jpe?g|webp|avif|svg|ico)$/i.test(file));
  const results = [];
  for (let offset = 0; offset < files.length; offset += 6) {
    results.push(...await Promise.all(files.slice(offset, offset + 6).map(async file => {
      const urlPath = "/" + file.split(path.sep).map(encodeURIComponent).join("/");
      const response = await fetch(origin + urlPath, { headers: { "Cache-Control": "no-cache" }, signal: AbortSignal.timeout(30000) });
      const bytes = new Uint8Array(await response.arrayBuffer());
      const expected = await readFile(path.join(source, file));
      const type = response.headers.get("content-type") || "";
      const valid = response.status === 200 && type.startsWith("image/") && assetDigest(bytes) === assetDigest(expected);
      return { path: urlPath, status: response.status, type, bytes: bytes.length, matchesSource: valid };
    })));
  }
  const report = { checkedAt: new Date().toISOString(), origin, scope: "Image GETs only; no JavaScript, forms or conversion events", total: results.length, failures: results.filter(result => !result.matchesSource), results };
  if (reportIndex >= 0) await writeFile(path.resolve(process.argv[reportIndex + 1]), JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report, null, 2));
  assert.deepEqual(report.failures, [], "Every deployed public image must return its original bytes, not a 404 page or stale copy");
} finally {
  if (app) {
    app.kill("SIGTERM");
    await new Promise(resolve => {
      if (app.exitCode !== null) return resolve();
      const timeout = setTimeout(() => { app.kill("SIGKILL"); resolve(); }, 5000);
      app.once("exit", () => { clearTimeout(timeout); resolve(); });
    });
  }
}
