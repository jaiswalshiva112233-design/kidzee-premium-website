import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
const { chromium } = await import(process.env.ADMISSIONS_PLAYWRIGHT_MODULE || "playwright");

const origin = "http://127.0.0.1:3100";
const output = "work/admissions-browser";
await mkdir(output, { recursive: true });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const slug = "preschool-admissions-dwarka-sector-12";
await pool.query(
  'INSERT INTO "LandingPage" ("id","slug","name","pageType","status","seoTitle","metaDescription","content","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())',
  ["admissions_browser_page", slug, "Browser-only admissions fixture", "ADMISSION", "PUBLISHED", "Old 2026–27 test title", "Old 2026–27 test description", JSON.stringify({ heading: "Old 2026–27 headline" })],
);
await pool.query(
  'INSERT INTO "LandingPageVariant" ("id","landingPageId","variantKey","name","content","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())',
  ["admissions_browser_variant", "admissions_browser_page", "A", "Original test variant", JSON.stringify({ heading: "Old 2026–27 variant" })],
);

let logs = "";
const app = spawn(process.execPath, [path.join("node_modules","next","dist","bin","next"), "start", "-p", "3100"], {
  env: { ...process.env, WEBSITE_ANALYTICS_ENABLED: "false", WEBSITE_ADVERTISING_ENABLED: "false", WEBSITE_META_PIXEL_ENABLED: "false" },
  stdio: ["ignore", "pipe", "pipe"],
});
app.stdout.on("data", (chunk) => { logs += String(chunk); });
app.stderr.on("data", (chunk) => { logs += String(chunk); });
let browser;
const results = [];
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(origin + "/icon-48.png", { signal: AbortSignal.timeout(2000) });
      if (response.ok) { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(ready, "Next.js did not start: " + logs.slice(-5000));
  browser = await chromium.launch();
  const routes = ["/admissions", "/landing/" + slug];

  for (const route of routes) {
    for (const width of [320, 390, 768, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(origin + route + "?utm_source=google&utm_medium=cpc&utm_campaign=admissions_2027_28&gclid=synthetic_browser_click", { waitUntil: "networkidle" });
      assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
      assert.match(await page.title(), /2027–28/);
      assert.match(await page.getByRole("heading", { level: 1 }).innerText(), /preschool start.*Sector 12, Dwarka/s);
      assert.equal(await page.getByText("Old 2026–27 headline", { exact: true }).count(), 0);
      assert.equal(await page.getByText("Old 2026–27 variant", { exact: true }).count(), 0);
      assert.ok(await page.getByText("30% off annual charges for 2027–28", { exact: true }).isVisible());
      assert.equal(await page.locator("#admission-enquiry").count(), 1);
      assert.equal(await page.locator("main").count(), 1);
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      assert.equal(hasOverflow, false, "Horizontal overflow at " + route + " width " + width);
      await page.evaluate(async () => {
        document.querySelectorAll("img").forEach((image) => { image.loading = "eager"; });
        await Promise.all([...document.images].map((image) => image.decode().catch(() => {})));
      });
      const brokenImages = await page.locator("img").evaluateAll((images) => images.filter((image) => !image.complete || image.naturalWidth === 0).map((image) => image.src));
      assert.deepEqual(brokenImages, [], "Broken images");
      await page.screenshot({ path: output + "/" + (route.includes("landing") ? "ads" : "admissions") + "-" + width + ".png", fullPage: true });
      if (route.includes("landing") && (width === 390 || width === 1440)) {
        const image = await page.screenshot({ type: "jpeg", quality: 38 });
        console.log("ADMISSIONS_PREVIEW_" + width + ":" + image.toString("base64") + ":END_PREVIEW");
      }
      const visit = page.locator('header a[href="#admission-enquiry"]');
      if (width >= 768) await visit.click();
      else await page.locator('nav[aria-label="Contact admissions"] a[href="#admission-enquiry"]').click();
      await page.waitForTimeout(400);
      assert.ok(await page.locator("#parentName").isVisible());
      await page.getByText("How does the January start work?", { exact: true }).click();
      assert.ok(await page.getByText(/There is no monthly tuition charge for January or February/).isVisible());
      assert.deepEqual(errors, [], "Browser errors at " + route);
      results.push({ route, width, layout: "pass", images: "pass", navigation: "pass" });
      await context.close();
    }
  }

  for (const [index, route] of routes.entries()) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__admissionsEvents = [];
      window.addEventListener("kidzee:website-event", (event) => window.__admissionsEvents.push(event.detail));
      window.open = () => ({
        opener: null, closed: false,
        document: { title: "", body: { innerHTML: "" } },
        location: { replace() {} },
        close() { this.closed = true; },
      });
    });
    let submittedBody;
    let posts = 0;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/website/enquiry") && request.method() === "POST") {
        posts++;
        submittedBody = request.postDataJSON();
      }
    });
    await page.goto(origin + route + "?utm_source=google&utm_medium=cpc&utm_campaign=admissions_2027_28&gclid=synthetic_browser_click", { waitUntil: "networkidle" });
    const button = page.getByRole("button", { name: "Request a School Visit", exact: true });
    await button.click();
    assert.equal(posts, 0, "Invalid forms must not submit");
    assert.ok(await page.getByText("Please enter the parent's name.", { exact: true }).isVisible());
    await page.locator("#parentName").fill("Browser Test Parent " + index);
    await page.locator("#phone").fill("900000000" + index);
    await page.locator("#programme").selectOption("NURSERY");
    const responsePromise = page.waitForResponse((response) => response.url().endsWith("/api/website/enquiry") && response.request().method() === "POST");
    await button.click();
    const response = await responsePromise;
    const body = await response.json();
    assert.equal(response.status(), 200, JSON.stringify(body));
    assert.equal(body.success, true);
    assert.ok(body.enquiryNumber);
    await page.getByRole("heading", { name: "Thank you. We have your enquiry." }).waitFor();
    assert.equal(posts, 1);
    assert.equal(submittedBody.gclid, "synthetic_browser_click");
    assert.equal(submittedBody.utmCampaign, "admissions_2027_28");
    assert.ok(submittedBody.submissionId);
    if (route.includes("landing")) {
      assert.equal(submittedBody.landingPageId, "admissions_browser_page");
      assert.equal(submittedBody.landingVariantId, "admissions_browser_variant");
    } else {
      assert.equal(submittedBody.landingPageId, "");
    }
    const events = await page.evaluate(() => window.__admissionsEvents.filter((event) => event.eventType === "FORM_SUBMITTED"));
    assert.equal(events.length, 1);
    assert.equal(events[0].enquiryNumber, body.enquiryNumber);
    const retry = await context.request.post(origin + "/api/website/enquiry", { data: submittedBody });
    const retryBody = await retry.json();
    assert.equal(retry.status(), 200, JSON.stringify(retryBody));
    assert.equal(retryBody.enquiryNumber, body.enquiryNumber, "Retry must preserve enquiry identity");
    const count = await pool.query('SELECT COUNT(*)::int AS count FROM "WebsiteLeadSubmission" WHERE "submissionId"=$1', [submittedBody.submissionId]);
    assert.equal(count.rows[0].count, 1, "Retry must not create another lead submission");
    results.push({ route, validation: "pass", centreos: "pass", attribution: "pass", retryDeduplication: "pass" });
    await context.close();
  }
  await writeFile(output + "/verification.json", JSON.stringify(results, null, 2));
  console.log("Admissions browser verification passed: 8 responsive layouts, image loading, visit links, form validation, CentreOS persistence, attribution and retry deduplication.");
} finally {
  await writeFile(output + "/server.log", logs);
  await browser?.close();
  app.kill("SIGTERM");
  await pool.end();
}
