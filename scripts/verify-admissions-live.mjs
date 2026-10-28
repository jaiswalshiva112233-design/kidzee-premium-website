import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const { chromium } = await import(process.env.ADMISSIONS_PLAYWRIGHT_MODULE);
const origin = "https://kidzeedwarka.com";
const paths = ["/admissions", "/landing/preschool-admissions-dwarka-sector-12"];
const output = "work/admissions-live";
await mkdir(output, { recursive: true });
const states = [];
let ready = false;
for (let attempt = 0; attempt < 24; attempt++) {
  const checks = [];
  for (const path of paths) {
    try {
      const response = await fetch(origin + path, {
        headers: { "user-agent": "Kidzee-Release-Verification-Bot/1.0", "cache-control": "no-cache" },
        signal: AbortSignal.timeout(20000),
      });
      const html = await response.text();
      const current = response.ok && html.includes("Preschool Admissions in") && html.includes("Dwarka Sector 12.") && html.includes("2027–28") && html.includes("Add a visit date or other details");
      checks.push({ path, status: response.status, current, title: html.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "", heading: html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1]?.replace(/<[^>]*>/g, "") ?? "" });
    } catch (error) {
      checks.push({ path, error: error.message, current: false });
    }
  }
  console.log("LIVE_ROLLOUT_CHECK " + JSON.stringify({ attempt, checks }));
  states.push(...checks);
  await writeFile(output + "/rollout.json", JSON.stringify(states, null, 2));
  if (checks.every((check) => check.current)) { ready = true; break; }
  await new Promise((resolve) => setTimeout(resolve, 20000));
}
assert.ok(ready, "The approved admissions version is not yet confirmed on both public URLs.");
const browser = await chromium.launch();
const results = [];
try {
  for (const path of paths) {
    for (const width of [390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      await context.addInitScript(() => {
        localStorage.setItem("kidzee-cookie-consent-v1", JSON.stringify({ version: 1, analytics: false, marketing: false, decidedAt: new Date().toISOString() }));
      });
      // Read-only release verification: no analytics records, parent enquiries,
      // marketing tags or outbound contact handoffs are allowed from this check.
      await context.route("**/*", async (route) => {
        const request = route.request();
        const url = new URL(request.url());
        if (/google-analytics\.com|googletagmanager\.com|googleadservices\.com|doubleclick\.net|facebook\.com|facebook\.net|wa\.me/.test(url.hostname)) return route.abort();
        if (url.pathname === "/api/website/analytics") return route.fulfill({ status: 200, contentType: "application/json", body: '{"success":true}' });
        if (request.method() !== "GET" && request.method() !== "HEAD") return route.abort();
        return route.continue();
      });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const response = await page.goto(origin + path, { waitUntil: "networkidle", timeout: 60000 });
      assert.equal(response.status(), 200);
      assert.match(await page.title(), /Preschool & Nursery Admissions 2027–28/);
      assert.match(await page.getByRole("heading", { level: 1 }).innerText(), /Preschool Admissions in Dwarka Sector 12/);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.equal(await page.locator("#admission-enquiry").count(), 1);
      assert.ok(await page.locator("#parentName").isVisible());
      assert.ok(await page.locator("#phone").isVisible());
      assert.equal(await page.locator("#childName:visible").count(), 0);
      assert.equal(await page.locator('form a[href="/privacy-policy"]').count(), 1);
      await page.evaluate(async () => {
        document.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
        await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
      });
      const broken = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
      assert.deepEqual(broken, []);
      await page.getByRole("button", { name: "Request a School Visit", exact: true }).click();
      assert.ok(await page.getByText("Please enter the parent's name.", { exact: true }).isVisible());
      await page.getByText("Add a visit date or other details (optional)", { exact: true }).click();
      assert.ok(await page.locator("#preferredVisitDate").isVisible());
      await page.getByText("How does the January start work?", { exact: true }).click();
      assert.ok(await page.getByText(/For children joining in January 2027, including families completing admission in December 2026,/).first().isVisible());
      await page.locator('nav[aria-label="Contact admissions"] a[href="#admission-enquiry"]').count();
      assert.deepEqual(errors, []);
      await page.screenshot({ path: output + "/" + (path.includes("landing") ? "ads" : "admissions") + "-" + width + ".png", fullPage: true });
      results.push({ path, width, http: 200, layout: "pass", images: "pass", formValidation: "pass", offer: "pass" });
      await context.close();
    }
  }
  await writeFile(output + "/verification.json", JSON.stringify(results, null, 2));
  console.log("LIVE_ADMISSIONS_VERIFIED " + JSON.stringify(results));
} finally {
  await browser.close();
}
