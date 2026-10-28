import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { Pool } from "pg";
import sharp from "sharp";
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

// A running legacy experiment must not be attributed to the new fixed campaign.
await pool.query(
  'INSERT INTO "GrowthExperiment" ("id","landingPageId","name","status","updatedAt") VALUES ($1,$2,$3,$4,NOW())',
  ["admissions_browser_experiment", "admissions_browser_page", "Previous template experiment", "RUNNING"],
);
await pool.query(
  'INSERT INTO "GrowthExperimentVariant" ("id","experimentId","variantId","allocation") VALUES ($1,$2,$3,$4)',
  ["admissions_browser_experiment_variant", "admissions_browser_experiment", "admissions_browser_variant", 100],
);

// A different managed page must retain its content and variant attribution.
await pool.query(
  'INSERT INTO "LandingPage" ("id","slug","name","pageType","status","seoTitle","metaDescription","content","updatedAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())',
  ["managed_control_page", "browser-managed-control", "Managed control", "ADMISSION", "PUBLISHED", "Managed control", "Managed control", JSON.stringify({ heading: "Managed control heading" })],
);
await pool.query(
  'INSERT INTO "LandingPageVariant" ("id","landingPageId","variantKey","name","content","updatedAt") VALUES ($1,$2,$3,$4,$5,NOW())',
  ["managed_control_variant", "managed_control_page", "A", "Control variant", JSON.stringify({ heading: "Managed variant still works" })],
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
      await page.addInitScript(() => {
        window.__admissionsEvents = [];
        window.addEventListener("kidzee:website-event", (event) => window.__admissionsEvents.push(event.detail));
      });
      const errors = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(origin + route + "?utm_source=google&utm_medium=cpc&utm_campaign=admissions_2027_28&gclid=synthetic_browser_click", { waitUntil: "networkidle" });
      assert.equal(await page.getByRole("heading", { level: 1 }).count(), 1);
      assert.match(await page.title(), /2027–28/);
      assert.match(await page.title(), /Preschool & Nursery Admissions/);
      assert.match(await page.getByRole("heading", { level: 1 }).innerText(), /Preschool Admissions in Dwarka Sector 12/s);
      assert.equal(await page.getByText("Old 2026–27 headline", { exact: true }).count(), 0);
      assert.equal(await page.getByText("Old 2026–27 variant", { exact: true }).count(), 0);
      assert.ok(await page.locator("section[aria-labelledby=\"admissions-heading\"]").getByText("30% off annual charges", { exact: true }).isVisible());
      assert.equal(await page.locator("#admission-enquiry").count(), 1);
      assert.equal(await page.locator("main").count(), 1);
      assert.ok(await page.getByText("1:8 teacher–child ratio in Playgroup & Nursery", { exact: true }).isVisible());
      assert.equal(await page.locator('form #childName:visible').count(), 0);
      assert.equal(await page.locator('form #preferredVisitDate:visible').count(), 0);
      assert.equal(await page.locator('form a[href="/privacy-policy"]').count(), 1);
      assert.equal(await page.getByRole("button", { name: "Ask MIRA, Kidzee Admissions Assistant", exact: true }).count(), 1);
      assert.equal(await page.locator("video[src]").count(), 0, "Parent video must not load before selection");
      const mislabeledViews = await page.evaluate(() => window.__admissionsEvents.filter((event) => event.eventType === "LANDING_VARIANT_VIEW"));
      assert.equal(mislabeledViews.length, 0, "Fixed campaign must not emit legacy A/B variant views");
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
        const screenshot = await page.screenshot();
        const image = await sharp(screenshot).resize({ width: width === 1440 ? 900 : 270 }).jpeg({ quality: 40 }).toBuffer();
        console.log("ADMISSIONS_PREVIEW_" + width + ":" + image.toString("base64") + ":END_PREVIEW");
      }
      if (route.includes("landing") && width === 1440) {
        const fullPreview = await sharp(await page.screenshot({ fullPage: true })).resize({ width: 300 }).jpeg({ quality: 35 }).toBuffer();
        console.log("ADMISSIONS_PREVIEW_FULL:" + fullPreview.toString("base64") + ":END_PREVIEW");
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
      window.__admissionsPopupCount = 0;
      window.addEventListener("kidzee:website-event", (event) => window.__admissionsEvents.push(event.detail));
      window.open = () => { window.__admissionsPopupCount++; return ({
        opener: null, closed: false,
        document: { title: "", body: { innerHTML: "" } },
        location: { replace() {} },
        close() { this.closed = true; },
      }); };
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
    assert.equal(response.status(), 201, JSON.stringify(body));
    assert.equal(body.success, true);
    assert.ok(body.enquiryNumber);
    await page.getByRole("heading", { name: "Thank you. We have your enquiry." }).waitFor();
    assert.equal(posts, 1);
    assert.equal(await page.evaluate(() => window.__admissionsPopupCount), 0, "Saving an enquiry must not force a WhatsApp popup");
    assert.equal(submittedBody.gclid, "synthetic_browser_click");
    assert.equal(submittedBody.utmCampaign, "admissions_2027_28");
    assert.ok(submittedBody.submissionId);
    if (route.includes("landing")) {
      assert.equal(submittedBody.landingPageId, "admissions_browser_page");
      assert.equal(submittedBody.landingVariantId, "");
      assert.equal(submittedBody.growthExperimentId, "");
    } else {
      assert.equal(submittedBody.landingPageId, "");
    }
    const events = await page.evaluate(() => window.__admissionsEvents.filter((event) => event.eventType === "FORM_SUBMITTED"));
    assert.equal(events.length, 1);
    assert.equal(events[0].enquiryNumber, body.enquiryNumber);
    assert.equal(await page.evaluate(() => window.__admissionsEvents.filter((event) => event.eventType === "WHATSAPP_CLICK").length), 0);
    const continuation = page.getByRole("link", { name: "Continue on WhatsApp" });
    assert.ok((await continuation.getAttribute("href")).includes(encodeURIComponent(body.enquiryNumber)));
    // Prevent external navigation while checking the optional handoff event.
    await continuation.evaluate((link) => link.addEventListener("click", (event) => event.preventDefault()));
    await continuation.click();
    assert.equal(await page.evaluate(() => window.__admissionsEvents.filter((event) => event.eventType === "FORM_SUBMITTED").length), 1);
    const handoff = await page.evaluate(() => window.__admissionsEvents.filter((event) => event.eventType === "WHATSAPP_CLICK"));
    assert.equal(handoff.length, 1);
    assert.equal(handoff[0].enquiryNumber, body.enquiryNumber);
    const retry = await context.request.post(origin + "/api/website/enquiry", { data: submittedBody });
    const retryBody = await retry.json();
    assert.equal(retry.status(), 200, JSON.stringify(retryBody));
    assert.equal(retryBody.enquiryNumber, body.enquiryNumber, "Retry must preserve enquiry identity");
    const count = await pool.query('SELECT COUNT(*)::int AS count FROM "WebsiteLeadSubmission" WHERE "submissionId"=$1', [submittedBody.submissionId]);
    assert.equal(count.rows[0].count, 1, "Retry must not create another lead submission");
    results.push({ route, validation: "pass", centreos: "pass", attribution: "pass", retryDeduplication: "pass" });
    await context.close();
  }
  {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const page = await context.newPage();
    await page.goto(origin + "/admissions?enquiry=FEES", { waitUntil: "networkidle" });
    assert.ok(await page.getByRole("button", { name: "Request Fee Details", exact: true }).isVisible());
    await page.getByText("Add a visit date or other details (optional)", { exact: true }).click();
    assert.ok(await page.locator("#childName").isVisible());
    assert.ok(await page.locator("#preferredVisitDate").isVisible());
    await page.locator("#enquiryType").selectOption("SCHOOL_VISIT");
    assert.ok(await page.getByRole("heading", { name: "Book a School Visit", exact: true }).isVisible());
    const feeButton = page.getByRole("button", { name: "Request Fee Details", exact: true });
    assert.equal(await feeButton.count(), 0);
    await page.getByRole("button", { name: "Watch a parent story" }).click();
    assert.equal(await page.locator('video[controls][playsinline]').count(), 1);
    try {
      await page.waitForFunction(() => document.querySelector("video")?.readyState >= 1, null, { timeout: 15000 });
    } catch (error) {
      console.log("ADMISSIONS_VIDEO_DIAGNOSTICS:" + JSON.stringify(await page.locator("video").evaluate((video) => ({ src: video.currentSrc, error: video.error?.message, code: video.error?.code, networkState: video.networkState, readyState: video.readyState, mp4: video.canPlayType('video/mp4; codecs="avc1.42E01E"') }))));
      throw error;
    }
    assert.ok(await page.locator("video").evaluate((video) => video.videoWidth > 0));
    assert.ok(await page.getByText(/including families completing admission in December 2026/).count() > 0);
    await context.close();
    results.push({ expandedDetails: "pass", feesIntent: "pass", optionalVideo: "pass", decemberEligibility: "pass" });
  }
  {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      window.__admissionsEvents = [];
      window.addEventListener("kidzee:website-event", (event) => window.__admissionsEvents.push(event.detail));
    });
    await page.goto(origin + "/landing/browser-managed-control", { waitUntil: "networkidle" });
    assert.match(await page.getByRole("heading", { level: 1 }).innerText(), /Managed variant still works/);
    const views = await page.evaluate(() => window.__admissionsEvents.filter((event) => event.eventType === "LANDING_VARIANT_VIEW"));
    assert.ok(views.some((event) => event.landingVariantId === "managed_control_variant"));
    assert.ok(await page.locator("#childName").isVisible(), "Other pages retain the full form");
    await context.close();
    results.push({ otherManagedContent: "pass", otherManagedVariantAttribution: "pass", otherFullForm: "pass" });
  }
  await writeFile(output + "/verification.json", JSON.stringify(results, null, 2));
  console.log("Admissions browser verification passed: 8 responsive layouts, image loading, visit links, form validation, CentreOS persistence, attribution and retry deduplication.");
} catch (error) {
  console.error("ADMISSIONS_BROWSER_ERROR: " + (error?.stack || error));
  console.error("ADMISSIONS_TEST_SERVER: " + logs.slice(-8000));
  throw error;
} finally {
  await writeFile(output + "/server.log", logs);
  await browser?.close();
  app.kill("SIGTERM");
  await pool.end();
}
