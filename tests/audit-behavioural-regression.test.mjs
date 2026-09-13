import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { register } from "node:module";
import test from "node:test";

// Register test loader to handle server-only and extensionless TypeScript resolution under Node test runner
register(new URL("./test-loader.mjs", import.meta.url).href);

// ============================================================================
// Production Module Imports
// ============================================================================
const { persistEnquiryOutboxRecords } = await import("../lib/marketing/enquiryOutbox.ts");
const { evaluateConsentState } = await import("../lib/marketing/consent.ts");
const {
  assertNoDuplicateAnnualOrKitCharge,
  LedgerRequestError,
} = await import("../lib/admin/student-ledger-rules.ts");
const {
  deliverPendingFirestoreMirrors,
  buildFirestoreOutboxWhere,
  FIRESTORE_OUTBOX_MAX_ATTEMPTS,
  firestoreOutboxRetryDelay,
} = await import("../lib/firebase/firestoreRest.ts");
const { enqueuePendingAdmissionConversions } = await import("../lib/marketing/admissionConversions.ts");
const { Prisma } = await import("../generated/prisma/client");

// Set FIREBASE_CONFIG before importing Cloud Functions module to satisfy storage trigger config
process.env.FIREBASE_CONFIG = JSON.stringify({
  storageBucket: "kidzeedwarka.appspot.com",
  projectId: "kidzeedwarka",
});
const functionsModule = await import("../functions/src/index.js");
const handleGalleryUpload = functionsModule.handleGalleryUpload || functionsModule.processGalleryUpload.handleGalleryUpload;
const executeVideoRetry = functionsModule.processGalleryUpload.executeVideoRetry;

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

// ============================================================================
// 1. Saved Enquiry & Durable Post-Commit Queue Behaviour
// ============================================================================
test("1. saved enquiry persists durable queue and outbox records without detached unawaited promises", async () => {
  const activityLogs = [];
  const mockTx = {
    activityLog: {
      create: async ({ data }) => {
        const row = { id: `log-${activityLogs.length + 1}`, ...data };
        activityLogs.push(row);
        return row;
      },
    },
  };

  const adminNotifs = [];
  const waMessages = [];
  const conversionJobs = [];

  const mockDeps = {
    createAdminNotification: async (data, client) => {
      assert.equal(client, mockTx, "Must pass the transaction client to createAdminNotification");
      const row = { id: `notif-${adminNotifs.length + 1}`, ...data };
      adminNotifs.push(row);
      return row;
    },
    queueWhatsAppAutomation: async (data, client) => {
      assert.equal(client, mockTx, "Must pass the transaction client to queueWhatsAppAutomation");
      const row = { id: `wa-${waMessages.length + 1}`, ...data };
      waMessages.push(row);
      return row;
    },
    enqueueLeadConversions: async (enquiryId, client) => {
      assert.equal(client, mockTx, "Must pass the transaction client to enqueueLeadConversions");
      const row = { id: `job-${conversionJobs.length + 1}`, enquiryId, provider: "GOOGLE_ADS" };
      conversionJobs.push(row);
      return { eligible: true, queued: 1 };
    },
    defaultPhone: "918800000000",
  };

  const receivedAt = new Date("2026-09-12T12:00:00Z");
  const submissionId = "sub-test-123";
  const enquiryId = "enq-test-456";
  const enquiryNumber = "KZ-2026-001";

  // Execute real production persistEnquiryOutboxRecords with mock transaction client
  await persistEnquiryOutboxRecords(
    mockTx,
    {
      enquiryId,
      enquiryNumber,
      created: true,
      source: "WEBSITE",
      submissionId,
      parentName: "Priya Sharma",
      phone: { stored: "919876543210" },
      childName: "Aarav",
      childAge: "3",
      programmeValue: "NURSERY",
      enquiryTypeValue: "NEW_ADMISSION",
      trafficChannel: "GOOGLE_ADS",
      requestClassification: {
        trafficClass: "GENUINE",
        isInternal: false,
        isTest: false,
      },
      attribution: {
        landingPage: "/admissions",
        utmSource: "google",
        utmMedium: "cpc",
        utmCampaign: "admissions_2026",
      },
      firstTouch: null,
      lastTouch: null,
      marketingConsent: true,
      receivedAt,
    },
    mockDeps,
  );

  // Assertions on transaction-persisted records
  assert.equal(activityLogs.length, 2, "Must create MARKETING_EVENT and FIRESTORE_MIRROR_OUTBOX in transaction");

  // 1. Audit log
  const auditLog = activityLogs.find((l) => l.entityType === "MARKETING_EVENT");
  assert.ok(auditLog, "Audit log must be created");
  assert.equal(auditLog.action, "CREATED");
  assert.equal(auditLog.entityId, submissionId);
  assert.equal(auditLog.newData.eventName, "admission_lead_submitted");
  assert.equal(auditLog.newData.trafficClass, "GENUINE");

  // 2. Firestore mirror outbox
  const mirrorLog = activityLogs.find((l) => l.entityType === "FIRESTORE_MIRROR_OUTBOX");
  assert.ok(mirrorLog, "Firestore mirror outbox record must be created in ActivityLog");
  assert.equal(mirrorLog.action, "CREATED");
  assert.equal(mirrorLog.entityId, submissionId);
  assert.equal(mirrorLog.newData.status, "PENDING");
  assert.equal(mirrorLog.newData.attempts, 0);
  assert.equal(mirrorLog.newData.enquiryNumber, enquiryNumber);
  assert.ok(mirrorLog.newData.payload.leadSubmission, "Payload must contain leadSubmission data");
  assert.ok(mirrorLog.newData.payload.lead, "Payload must contain lead data");
  assert.equal(mirrorLog.newData.payload.lead.enquiryNumber, enquiryNumber);

  // 3. Admin Notification
  assert.equal(adminNotifs.length, 1);
  assert.equal(adminNotifs[0].entityId, enquiryId);
  assert.equal(adminNotifs[0].eventKey, submissionId);

  // 4. WhatsApp Automation
  assert.equal(waMessages.length, 1);
  assert.equal(waMessages[0].deduplicationKey, `ENQUIRY_NOTIFICATION:${submissionId}`);
  assert.equal(waMessages[0].recipientPhone, "918800000000");

  // 5. Marketing Conversions (consent = true)
  assert.equal(conversionJobs.length, 1);
  assert.equal(conversionJobs[0].enquiryId, enquiryId);

  // Test marketingConsent = false: conversion job must NOT be enqueued
  const noConsentConversionJobs = [];
  await persistEnquiryOutboxRecords(
    mockTx,
    {
      enquiryId: "enq-no-consent",
      enquiryNumber: "KZ-2026-002",
      created: true,
      source: "WEBSITE",
      submissionId: "sub-no-consent",
      parentName: "Amit Kumar",
      phone: { stored: "919876543211" },
      childName: null,
      childAge: null,
      programmeValue: "PLAYGROUP",
      enquiryTypeValue: "NEW_ADMISSION",
      trafficChannel: "DIRECT",
      requestClassification: {
        trafficClass: "GENUINE",
        isInternal: false,
        isTest: false,
      },
      attribution: {},
      firstTouch: null,
      lastTouch: null,
      marketingConsent: false,
      receivedAt,
    },
    {
      ...mockDeps,
      enqueueLeadConversions: async (id) => {
        noConsentConversionJobs.push(id);
      },
    },
  );
  assert.equal(noConsentConversionJobs.length, 0, "No marketing conversions enqueued without consent");

  // Verify route implementation source has no detached promises
  const routeSource = source("app/api/website/enquiry/route.ts");
  assert.doesNotMatch(
    routeSource,
    /void\s*\(\s*async\s*\(\s*\)\s*=>/,
    "Route must not use detached void (async () => ...) promises",
  );
  assert.doesNotMatch(
    routeSource,
    /safeFirestoreMirror\s*\(/,
    "Route must not call safeFirestoreMirror directly before responding",
  );
  assert.doesNotMatch(
    routeSource,
    /Promise\.allSettled\s*\(/,
    "Route must not use post-response Promise.allSettled network work",
  );
});

// ============================================================================
// 2. Analytics-Only, Marketing-Only, Accept-All and Reject-All Consent
// ============================================================================
test("2. consent handling: analytics-only, marketing-only, accept-all, reject-all and GA4 deduplication", () => {
  const baseSettings = {
    googleTagManagerId: "GTM-KIDZEE",
    googleAnalyticsId: "G-6J8P2T8D5W",
    googleAdsId: "AW-17983637151",
    googleAdsConversionLabel: "conv-label-123",
    metaPixelId: "1401314421685368",
    analyticsEnabled: true,
    advertisingEnabled: true,
    metaPixelEnabled: true,
  };

  // Case A: Analytics-only consent
  const analyticsOnly = evaluateConsentState({
    settings: baseSettings,
    consent: { analytics: true, marketing: false, decidedAt: new Date().toISOString(), version: 1 },
    pathname: "/programmes",
  });
  assert.equal(analyticsOnly.loadedGtm, true);
  assert.equal(analyticsOnly.consentMode.analytics_storage, "granted");
  assert.equal(analyticsOnly.consentMode.ad_storage, "denied");
  assert.equal(analyticsOnly.consentMode.ad_user_data, "denied");
  assert.equal(analyticsOnly.consentMode.ad_personalization, "denied");
  assert.equal(analyticsOnly.canEmitGa4Event, true);
  assert.equal(analyticsOnly.loadedGoogleAds, false);
  assert.equal(analyticsOnly.loadedMetaPixel, false);
  assert.equal(analyticsOnly.canEmitGoogleAdsConversion, false);
  assert.equal(analyticsOnly.canEmitMetaLead, false);
  // Crucial GA4 deduplication: when GTM owns GA4, direct GA4 script and direct page views must NOT load
  assert.equal(analyticsOnly.loadedDirectGa4, false);
  assert.equal(analyticsOnly.configuredGa4Direct, false);
  assert.equal(analyticsOnly.canEmitDirectPageView, false);

  // Case B: Marketing-only consent
  const marketingOnly = evaluateConsentState({
    settings: baseSettings,
    consent: { analytics: false, marketing: true, decidedAt: new Date().toISOString(), version: 1 },
    pathname: "/admissions",
  });
  assert.equal(marketingOnly.loadedGtm, true);
  assert.equal(marketingOnly.consentMode.analytics_storage, "denied");
  assert.equal(marketingOnly.consentMode.ad_storage, "granted");
  assert.equal(marketingOnly.consentMode.ad_user_data, "granted");
  assert.equal(marketingOnly.consentMode.ad_personalization, "granted");
  assert.equal(marketingOnly.canEmitGa4Event, false);
  assert.equal(marketingOnly.loadedMetaPixel, true);
  assert.equal(marketingOnly.canEmitGoogleAdsConversion, true);
  assert.equal(marketingOnly.canEmitMetaLead, true);
  assert.equal(marketingOnly.loadedDirectGa4, false);

  // Case C: Accept-all consent
  const acceptAll = evaluateConsentState({
    settings: baseSettings,
    consent: { analytics: true, marketing: true, decidedAt: new Date().toISOString(), version: 1 },
    pathname: "/",
  });
  assert.equal(acceptAll.loadedGtm, true);
  assert.equal(acceptAll.consentMode.analytics_storage, "granted");
  assert.equal(acceptAll.consentMode.ad_storage, "granted");
  assert.equal(acceptAll.canEmitGa4Event, true);
  assert.equal(acceptAll.loadedMetaPixel, true);
  assert.equal(acceptAll.canEmitGoogleAdsConversion, true);
  assert.equal(acceptAll.canEmitMetaLead, true);
  assert.equal(acceptAll.loadedDirectGa4, false); // GTM is present, so direct GA4 stays false

  // Case D: Reject-all consent
  const rejectAll = evaluateConsentState({
    settings: baseSettings,
    consent: { analytics: false, marketing: false, decidedAt: new Date().toISOString(), version: 1 },
    pathname: "/",
  });
  assert.equal(rejectAll.loadedGtm, false);
  assert.equal(rejectAll.consentMode.analytics_storage, "denied");
  assert.equal(rejectAll.consentMode.ad_storage, "denied");
  assert.equal(rejectAll.loadedDirectGa4, false);
  assert.equal(rejectAll.loadedGoogleAds, false);
  assert.equal(rejectAll.loadedMetaPixel, false);
  assert.equal(rejectAll.canEmitGa4Event, false);
  assert.equal(rejectAll.canEmitGoogleAdsConversion, false);
  assert.equal(rejectAll.canEmitMetaLead, false);

  // Case E: Direct GA4 when GTM is NOT configured
  const directGa4Settings = {
    ...baseSettings,
    googleTagManagerId: "",
  };
  const directAnalytics = evaluateConsentState({
    settings: directGa4Settings,
    consent: { analytics: true, marketing: false, decidedAt: new Date().toISOString(), version: 1 },
    pathname: "/",
  });
  assert.equal(directAnalytics.loadedGtm, false);
  assert.equal(directAnalytics.hasGtm, false);
  assert.equal(directAnalytics.loadedDirectGa4, true);
  assert.equal(directAnalytics.configuredGa4Direct, true);
  assert.equal(directAnalytics.canEmitDirectPageView, true);
  assert.equal(directAnalytics.canEmitGa4Event, true);

  // Case F: Google Ads website-call measurement configuration assertions
  const directAdsSettings = {
    ...baseSettings,
    googleTagManagerId: "",
    googleAdsId: "AW-17974378144",
    googleAdsConversionLabel: "Fc3TCOPwkaEcEKD97PpC",
    googleAdsPhoneConversionLabel: "qZFtCLTfkaEcEKD97PpC",
    googleAdsPhoneConversionNumber: "09667038673",
  };
  const directAds = evaluateConsentState({
    settings: directAdsSettings,
    consent: { analytics: false, marketing: true, decidedAt: new Date().toISOString(), version: 1 },
    pathname: "/landing/preschool-admissions-dwarka-sector-12",
  });
  assert.equal(directAds.loadedGoogleAds, true);
  assert.equal(directAds.configuredAdsDirect, true);
  assert.equal(directAds.canEmitGoogleAdsConversion, true);
  assert.equal(directAds.isAdminOrApi, false);
  assert.equal(directAds.isExcluded, false);
});

// ============================================================================
// 3. Complete Admin Tracking Exclusion
// ============================================================================
test("3. complete admin tracking exclusion on /admin and /api routes", () => {
  const baseSettings = {
    googleTagManagerId: "GTM-KIDZEE",
    googleAnalyticsId: "G-6J8P2T8D5W",
    googleAdsId: "AW-17983637151",
    googleAdsConversionLabel: "conv-label-123",
    metaPixelId: "1401314421685368",
    analyticsEnabled: true,
    advertisingEnabled: true,
    metaPixelEnabled: true,
  };
  const fullConsent = { analytics: true, marketing: true, decidedAt: new Date().toISOString(), version: 1 };

  for (const adminRoute of [
    "/admin",
    "/admin/students",
    "/admin/fees",
    "/admin/marketing/snapshot",
    "/admin/daycare",
    "/api/admin/daycare",
    "/api/website/enquiry",
    "/api/internal/growth-sync",
  ]) {
    const result = evaluateConsentState({
      settings: baseSettings,
      consent: fullConsent,
      pathname: adminRoute,
    });
    assert.equal(result.isExcluded, true, `Must be excluded on ${adminRoute}`);
    assert.equal(result.isAdminOrApi, true, `Must be marked admin/api on ${adminRoute}`);
    assert.equal(result.loadedGtm, false, `Must not load GTM on ${adminRoute}`);
    assert.equal(result.loadedDirectGa4, false, `Must not load direct GA4 on ${adminRoute}`);
    assert.equal(result.loadedMetaPixel, false, `Must not load Meta Pixel on ${adminRoute}`);
    assert.equal(result.canEmitGa4Event, false, `Must not emit GA4 event on ${adminRoute}`);
    assert.equal(result.canEmitGoogleAdsConversion, false, `Must not emit Google conversion on ${adminRoute}`);
    assert.equal(result.canEmitMetaLead, false, `Must not emit Meta lead on ${adminRoute}`);
  }

  for (const publicRoute of ["/", "/about", "/admissions", "/programmes", "/daycare", "/contact"]) {
    const result = evaluateConsentState({
      settings: baseSettings,
      consent: fullConsent,
      pathname: publicRoute,
    });
    assert.equal(result.isExcluded, false, `Must NOT be excluded on public route ${publicRoute}`);
    assert.equal(result.isAdminOrApi, false, `Must not be admin/api on ${publicRoute}`);
    assert.equal(result.loadedGtm, true, `Must load GTM on public route ${publicRoute}`);
  }

  // Staff exclusion also blocks public route
  const staffExcluded = evaluateConsentState({
    settings: baseSettings,
    consent: fullConsent,
    pathname: "/admissions",
    staffExcluded: true,
  });
  assert.equal(staffExcluded.isExcluded, true, "Staff device must be excluded on public routes");
  assert.equal(staffExcluded.loadedGtm, false, "Staff device must not load GTM");
});

// ============================================================================
// 4. Annual Fee versus Kit Fee Duplicate Separation
// ============================================================================
test("4. annual fee versus kit fee duplicate separation via assertNoDuplicateAnnualOrKitCharge", async () => {
  // Case A: Mock database where child only has an active KIT_FEE
  const mockTxKitOnly = {
    feeInvoiceItem: {
      findFirst: async ({ where }) => {
        const requestedCategory = where.OR?.[0]?.category;
        if (requestedCategory === "ANNUAL_FEE") return null; // No annual fee exists
        return { id: "inv-kit-1", category: "KIT_FEE", title: "Playgroup Kit" };
      },
    },
  };

  // Charging ANNUAL_FEE when child only has KIT_FEE must succeed without throwing
  await assertNoDuplicateAnnualOrKitCharge(mockTxKitOnly, "ANNUAL_FEE", "student-1", "2026-2027");

  // Case B: Mock database where child only has an active ANNUAL_FEE
  const mockTxAnnualOnly = {
    feeInvoiceItem: {
      findFirst: async ({ where }) => {
        const requestedCategory = where.OR?.[0]?.category;
        if (requestedCategory === "KIT_FEE") return null; // No kit fee exists
        return { id: "inv-annual-1", category: "ANNUAL_FEE", title: "Playgroup Annual" };
      },
    },
  };

  // Charging KIT_FEE when child only has ANNUAL_FEE must succeed without throwing
  await assertNoDuplicateAnnualOrKitCharge(mockTxAnnualOnly, "KIT_FEE", "student-1", "2026-2027");

  // Case C: Duplicate ANNUAL_FEE must throw LedgerRequestError with status 409
  const mockTxDuplicateAnnual = {
    feeInvoiceItem: {
      findFirst: async () => ({
        id: "inv-annual-dup",
        category: "ANNUAL_FEE",
        title: "Existing Annual Fee",
      }),
    },
  };

  await assert.rejects(
    async () => {
      await assertNoDuplicateAnnualOrKitCharge(mockTxDuplicateAnnual, "ANNUAL_FEE", "student-1", "2026-2027");
    },
    (err) => {
      assert.ok(err instanceof LedgerRequestError, "Must be instance of LedgerRequestError");
      assert.equal(err.status, 409);
      assert.match(err.message, /annual fee for 2026-2027 is already on this child's financial history/i);
      return true;
    },
  );

  // Case D: Duplicate KIT_FEE must throw LedgerRequestError with status 409
  const mockTxDuplicateKit = {
    feeInvoiceItem: {
      findFirst: async () => ({
        id: "inv-kit-dup",
        category: "KIT_FEE",
        title: "Existing Kit Fee",
      }),
    },
  };

  await assert.rejects(
    async () => {
      await assertNoDuplicateAnnualOrKitCharge(mockTxDuplicateKit, "KIT_FEE", "student-1", "2026-2027");
    },
    (err) => {
      assert.ok(err instanceof LedgerRequestError, "Must be instance of LedgerRequestError");
      assert.equal(err.status, 409);
      assert.match(err.message, /kit fee for 2026-2027 is already on this child's financial history/i);
      return true;
    },
  );
});

// ============================================================================
// 5. Combined Annual + Kit Package Protection
// ============================================================================
test("5. combined annual + kit package blocks duplicate component charging", async () => {
  // When an invoice item with combinedPrefix ("programme-annual-kit:") exists
  const mockTxCombined = {
    feeInvoiceItem: {
      findFirst: async ({ where }) => {
        const combinedCondition = where.OR?.find((cond) =>
          cond.chargeKey?.startsWith?.startsWith("programme-annual-kit:"),
        );
        assert.ok(combinedCondition, "Query must include combinedPrefix in OR clause");
        return {
          id: "inv-combined-1",
          category: "ANNUAL_FEE",
          title: "Playgroup annual + kit package",
        };
      },
    },
  };

  // Attempting to charge separate Annual Fee must be blocked
  await assert.rejects(
    async () => {
      await assertNoDuplicateAnnualOrKitCharge(mockTxCombined, "ANNUAL_FEE", "student-1", "2026-2027");
    },
    (err) => {
      assert.equal(err.status, 409);
      return true;
    },
  );

  // Attempting to charge separate Kit Fee must be blocked
  await assert.rejects(
    async () => {
      await assertNoDuplicateAnnualOrKitCharge(mockTxCombined, "KIT_FEE", "student-1", "2026-2027");
    },
    (err) => {
      assert.equal(err.status, 409);
      return true;
    },
  );
});

// ============================================================================
// 6. Cancelled-Invoice Rebilling
// ============================================================================
test("6. cancelled invoice items allow controlled rebilling and release chargeKeys", async () => {
  let queriedStatusFilter = null;
  const mockTx = {
    feeInvoiceItem: {
      findFirst: async ({ where }) => {
        queriedStatusFilter = where.invoice?.status;
        // In the database, cancelled invoices do not match status: { not: "CANCELLED" }
        return null;
      },
    },
  };

  // Run duplicate check
  await assertNoDuplicateAnnualOrKitCharge(mockTx, "ANNUAL_FEE", "student-1", "2026-2027");

  // Verify that the query explicitly excluded CANCELLED invoices
  assert.deepEqual(queriedStatusFilter, { not: "CANCELLED" });
});

// ============================================================================
// 7. Google/Meta Provider-Specific Conversion Backfill
// ============================================================================
test("7. provider-specific conversion backfill invokes actual production function and deduplicates per enquiry + eventType + provider", async () => {
  const existingJobs = [
    { enquiryId: "enq-1", provider: "GOOGLE_ADS", eventType: "ADMISSION" },
  ];

  const enquiries = [
    {
      id: "enq-1",
      enquiryNumber: "KZ-ENQ-001",
      parentName: "Parent One",
      phone: "+919876543210",
      email: "p1@example.com",
      status: "ADMITTED",
      createdAt: new Date("2026-09-01T10:00:00Z"),
      qualifiedAt: new Date("2026-09-02T10:00:00Z"),
      admittedAt: new Date("2026-09-03T10:00:00Z"),
      websiteSubmissions: [
        {
          source: "GOOGLE_ADS",
          trafficChannel: "GOOGLE_ADS",
          gclid: "gclid-123",
          gbraid: null,
          wbraid: null,
          fbclid: null,
          fbc: null,
          fbp: null,
          marketingConsent: true,
          leadType: "admission",
          trafficClass: "GENUINE",
          isInternal: false,
          isTest: false,
          isBot: false,
          pageUrl: "https://example.com/admission",
        },
        {
          source: "META_ADS",
          trafficChannel: "META_ADS",
          gclid: null,
          gbraid: null,
          wbraid: null,
          fbclid: "fbclid-456",
          fbc: "fbc-1",
          fbp: "fbp-1",
          marketingConsent: true,
          leadType: "admission",
          trafficClass: "GENUINE",
          isInternal: false,
          isTest: false,
          isBot: false,
          pageUrl: "https://example.com/admission",
        },
      ],
    },
    {
      id: "enq-2",
      enquiryNumber: "KZ-ENQ-002",
      parentName: "Parent Two",
      phone: "+919876543211",
      email: "p2@example.com",
      status: "ADMITTED",
      createdAt: new Date("2026-09-01T10:00:00Z"),
      qualifiedAt: new Date("2026-09-02T10:00:00Z"),
      admittedAt: new Date("2026-09-03T10:00:00Z"),
      websiteSubmissions: [
        {
          source: "GOOGLE_ADS",
          trafficChannel: "GOOGLE_ADS",
          gclid: "gclid-789",
          gbraid: null,
          wbraid: null,
          fbclid: null,
          fbc: null,
          fbp: null,
          marketingConsent: true,
          leadType: "admission",
          trafficClass: "GENUINE",
          isInternal: false,
          isTest: false,
          isBot: false,
          pageUrl: "https://example.com/admission",
        },
      ],
    },
  ];

  const createdJobs = [];
  const updatedJobs = [];
  const existingJobDeduplicationKeys = new Set(["GOOGLE_ADS:ADMISSION:KZ-ENQ-001"]);
  const mockClient = {
    marketingConversionJob: {
      findMany: async () => existingJobs,
      upsert: async ({ where, create, update }) => {
        if (existingJobDeduplicationKeys.has(where.deduplicationKey)) {
          updatedJobs.push(where.deduplicationKey);
          return { id: "job-existing-1", ...create, ...update };
        }
        existingJobDeduplicationKeys.add(where.deduplicationKey);
        createdJobs.push(create);
        return { id: `job-${createdJobs.length}`, ...create };
      },
    },
    enquiry: {
      findMany: async () => enquiries,
      findUnique: async ({ where }) => enquiries.find((e) => e.id === where.id) || null,
    },
  };

  const count = await enqueuePendingAdmissionConversions(100, mockClient);

  assert.equal(count, 2, "Must enqueue 2 conversions across the eligible enquiries");
  const enq1Meta = createdJobs.find((j) => j.enquiryId === "enq-1" && j.provider === "META");
  const enq1Google = createdJobs.find((j) => j.enquiryId === "enq-1" && j.provider === "GOOGLE_ADS");
  const enq2Google = createdJobs.find((j) => j.enquiryId === "enq-2" && j.provider === "GOOGLE_ADS");

  assert.ok(enq1Meta, "Must enqueue META conversion for enq-1");
  assert.equal(enq1Google, undefined, "Must NOT duplicate existing GOOGLE_ADS conversion for enq-1 in created jobs");
  assert.ok(updatedJobs.includes("GOOGLE_ADS:ADMISSION:KZ-ENQ-001"), "Existing GOOGLE_ADS conversion must be updated without recreation");
  assert.ok(enq2Google, "Must enqueue GOOGLE_ADS conversion for enq-2");
});

test("7b. admission backfill pagination: > limit complete admissions do not starve newer missing Google and Meta conversions", async () => {
  const limit = 50;

  // 55 older complete admissions that already have both GOOGLE_ADS and META conversion jobs
  const completedAdmissions = Array.from({ length: 55 }, (_, i) => ({
    id: `enq-comp-${i}`,
    enquiryNumber: `KZ-COMP-${i}`,
    parentName: `Completed Parent ${i}`,
    phone: `+91987654${String(i).padStart(4, "0")}`,
    email: `comp${i}@example.com`,
    status: "ADMITTED",
    createdAt: new Date("2026-08-01T10:00:00Z"),
    qualifiedAt: new Date("2026-08-02T10:00:00Z"),
    admittedAt: new Date("2026-08-01T10:00:00Z"), // All 55 completed admissions share the exact same admittedAt
    websiteSubmissions: [
      {
        source: "GOOGLE_ADS",
        trafficChannel: "GOOGLE_ADS",
        gclid: `gclid-comp-${i}`,
        gbraid: null,
        wbraid: null,
        fbclid: `fbclid-comp-${i}`,
        fbc: `fbc-comp-${i}`,
        fbp: `fbp-comp-${i}`,
        marketingConsent: true,
        leadType: "admission",
        trafficClass: "GENUINE",
        isInternal: false,
        isTest: false,
        isBot: false,
        pageUrl: "https://example.com/admission",
      },
    ],
  }));

  // Pre-existing jobs for the 55 completed admissions
  const existingJobs = [];
  for (const enq of completedAdmissions) {
    existingJobs.push({ enquiryId: enq.id, provider: "GOOGLE_ADS", eventType: "ADMISSION" });
    existingJobs.push({ enquiryId: enq.id, provider: "META", eventType: "ADMISSION" });
  }

  // 1 newer admission with missing Google Ads conversion (shares admittedAt with meta admission)
  const newerGoogleAdmission = {
    id: "enq-newer-google",
    enquiryNumber: "KZ-NEW-GOOGLE",
    parentName: "Newer Google Parent",
    phone: "+919999990001",
    email: "newgoogle@example.com",
    status: "ADMITTED",
    createdAt: new Date("2026-09-01T09:00:00Z"),
    qualifiedAt: new Date("2026-09-01T09:30:00Z"),
    admittedAt: new Date("2026-09-01T10:00:00Z"),
    websiteSubmissions: [
      {
        source: "GOOGLE_ADS",
        trafficChannel: "GOOGLE_ADS",
        gclid: "gclid-newer-123",
        gbraid: null,
        wbraid: null,
        fbclid: null,
        fbc: null,
        fbp: null,
        marketingConsent: true,
        leadType: "admission",
        trafficClass: "GENUINE",
        isInternal: false,
        isTest: false,
        isBot: false,
        pageUrl: "https://example.com/admission",
      },
    ],
  };

  // 1 newer admission with missing Meta conversion (shares exact same admittedAt timestamp)
  const newerMetaAdmission = {
    id: "enq-newer-meta",
    enquiryNumber: "KZ-NEW-META",
    parentName: "Newer Meta Parent",
    phone: "+919999990002",
    email: "newmeta@example.com",
    status: "ADMITTED",
    createdAt: new Date("2026-09-01T09:00:00Z"),
    qualifiedAt: new Date("2026-09-01T09:30:00Z"),
    admittedAt: new Date("2026-09-01T10:00:00Z"),
    websiteSubmissions: [
      {
        source: "META_ADS",
        trafficChannel: "META_ADS",
        gclid: null,
        gbraid: null,
        wbraid: null,
        fbclid: "fbclid-newer-456",
        fbc: "fbc-newer-1",
        fbp: "fbp-newer-1",
        marketingConsent: true,
        leadType: "admission",
        trafficClass: "GENUINE",
        isInternal: false,
        isTest: false,
        isBot: false,
        pageUrl: "https://example.com/admission",
      },
    ],
  };

  const allAdmissions = [...completedAdmissions, newerGoogleAdmission, newerMetaAdmission];
  const createdJobs = [];
  const mockClient = {
    marketingConversionJob: {
      findMany: async () => existingJobs,
      upsert: async ({ where, create, update }) => {
        createdJobs.push(create);
        return { id: `job-${createdJobs.length}`, ...create };
      },
    },
    enquiry: {
      findMany: async ({ skip = 0, take = 50, orderBy } = {}) => {
        assert.deepEqual(
          orderBy,
          [{ admittedAt: "asc" }, { id: "asc" }],
          "Must order deterministically using unique id tie-breaker",
        );
        const sorted = [...allAdmissions].sort((a, b) => {
          const timeA = a.admittedAt ? new Date(a.admittedAt).getTime() : 0;
          const timeB = b.admittedAt ? new Date(b.admittedAt).getTime() : 0;
          if (timeA !== timeB) return timeA - timeB;
          return a.id.localeCompare(b.id);
        });
        return sorted.slice(skip, skip + take);
      },
      findUnique: async ({ where }) => allAdmissions.find((e) => e.id === where.id) || null,
    },
  };

  // Enqueue pending conversions with limit = 50.
  // There are 55 older complete admissions ahead of the 2 newer missing admissions.
  const enqueuedCount = await enqueuePendingAdmissionConversions(limit, mockClient);

  assert.equal(enqueuedCount, 2, "Must paginate past complete admissions and enqueue both missing admissions");
  const enqGoogleJob = createdJobs.find((j) => j.enquiryId === "enq-newer-google" && j.provider === "GOOGLE_ADS");
  const enqMetaJob = createdJobs.find((j) => j.enquiryId === "enq-newer-meta" && j.provider === "META");

  assert.ok(enqGoogleJob, "Must enqueue GOOGLE_ADS conversion for newer admission");
  assert.ok(enqMetaJob, "Must enqueue META conversion for newer admission");
  assert.equal(createdJobs.length, 2, "Only the 2 genuinely missing conversions must be created");
});

// ============================================================================
// 8. Video Worker State Machine: Positive Ack, Timeout, Preserve Existing, Failure
// ============================================================================
test("8. video worker state transitions via handleGalleryUpload: positive ack, timeout, preserve existing, and failure", async () => {
  function makeMockJobRef(initialData = {}) {
    let data = { ...initialData };
    return {
      get: async () => ({
        exists: Boolean(data && Object.keys(data).length > 0),
        get: (field) => data[field],
      }),
      set: async (update, opts) => {
        if (opts?.merge) {
          data = { ...data, ...update };
        } else {
          data = { ...update };
        }
      },
      getData: () => data,
    };
  }

  const validVideoEvent = {
    data: {
      name: "uploads/gallery/test-video.mp4",
      bucket: "kidzeedwarka.appspot.com",
      contentType: "video/mp4",
      size: "20971520", // 20MB
      generation: "gen-1",
    },
  };

  // Case 1: Positive acknowledgement from worker -> PROCESSING_VIDEO
  const jobRef1 = makeMockJobRef();
  const mockClient1 = {
    request: async () => ({ status: 200 }),
  };
  const result1 = await handleGalleryUpload(validVideoEvent, {
    jobRef: jobRef1,
    client: mockClient1,
    workerUrl: "https://mock-worker.run.app",
    FieldValue: { serverTimestamp: () => "MOCK_TIMESTAMP" },
  });
  assert.equal(result1.action, "DISPATCH_ACKNOWLEDGED");
  assert.equal(result1.status, "PROCESSING_VIDEO");
  assert.equal(jobRef1.getData().status, "PROCESSING_VIDEO");
  assert.equal(jobRef1.getData().message, "Video worker acknowledged dispatch and is processing.");

  // Case 2: Timeout error -> must write VIDEO_DISPATCH_TIMEOUT with retryable: true, and THROW error
  const jobRef2 = makeMockJobRef();
  const timeoutError = new Error("timeout of 30000ms exceeded");
  timeoutError.code = "ECONNABORTED";
  const mockClient2 = {
    request: async () => {
      throw timeoutError;
    },
  };

  await assert.rejects(
    async () => {
      await handleGalleryUpload(validVideoEvent, {
        jobRef: jobRef2,
        client: mockClient2,
        workerUrl: "https://mock-worker.run.app",
        FieldValue: { serverTimestamp: () => "MOCK_TIMESTAMP" },
      });
    },
    /timeout of 30000ms exceeded/,
    "Must re-throw timeout error so Cloud Functions event-driven retry triggers",
  );
  assert.equal(jobRef2.getData().status, "VIDEO_DISPATCH_TIMEOUT", "Status must NOT be PROCESSING_VIDEO without positive ack");
  assert.equal(jobRef2.getData().retryable, true);
  assert.match(jobRef2.getData().lastError, /timeout/i);

  // Case 3: Timeout where worker already wrote COMPLETED in Firestore -> preserve COMPLETED
  let callCount = 0;
  const jobRef3 = {
    get: async () => {
      callCount += 1;
      // On the second check after timeout, worker wrote COMPLETED
      if (callCount > 1) {
        return { exists: true, get: (field) => (field === "status" ? "COMPLETED" : null) };
      }
      return { exists: false, get: () => null };
    },
    set: async () => {},
  };
  const result3 = await handleGalleryUpload(validVideoEvent, {
    jobRef: jobRef3,
    client: mockClient2,
    workerUrl: "https://mock-worker.run.app",
    FieldValue: { serverTimestamp: () => "MOCK_TIMESTAMP" },
  });
  assert.equal(result3.action, "PRESERVE_EXISTING_STATUS");
  assert.equal(result3.status, "COMPLETED");

  // Case 4: Non-timeout 500 failure -> writes VIDEO_DISPATCH_FAILED and throws
  const jobRef4 = makeMockJobRef();
  const serverError = new Error("Internal Server Error (500)");
  const mockClient4 = {
    request: async () => {
      throw serverError;
    },
  };
  await assert.rejects(
    async () => {
      await handleGalleryUpload(validVideoEvent, {
        jobRef: jobRef4,
        client: mockClient4,
        workerUrl: "https://mock-worker.run.app",
        FieldValue: { serverTimestamp: () => "MOCK_TIMESTAMP" },
      });
    },
    /Internal Server Error \(500\)/,
  );
  assert.equal(jobRef4.getData().status, "VIDEO_DISPATCH_FAILED");
  assert.equal(jobRef4.getData().retryable, true);

  // Case 5: Idempotent rerun for already completed generation -> returns early
  const completedJobRef = makeMockJobRef({
    status: "COMPLETED",
    generation: "gen-1",
  });
  const result5 = await handleGalleryUpload(validVideoEvent, {
    jobRef: completedJobRef,
    FieldValue: { serverTimestamp: () => "MOCK_TIMESTAMP" },
  });
  assert.equal(result5.action, "RETURN_EARLY_IDEMPOTENT");
  assert.equal(result5.status, "COMPLETED");

  // Case 6: executeVideoRetry handles both VIDEO_DISPATCH_TIMEOUT and VIDEO_DISPATCH_FAILED, and NEVER redispatches COMPLETED
  const mockDocs = [
    {
      id: "job-timeout",
      data: {
        status: "VIDEO_DISPATCH_TIMEOUT",
        retryable: true,
        dispatchAttempts: 1,
        sourcePath: "uploads/gallery/video1.mp4",
      },
    },
    {
      id: "job-failed",
      data: {
        status: "VIDEO_DISPATCH_FAILED",
        retryable: true,
        dispatchAttempts: 2,
        sourcePath: "uploads/gallery/video2.mp4",
      },
    },
    {
      id: "job-completed",
      data: {
        status: "COMPLETED",
        retryable: true,
        dispatchAttempts: 1,
        sourcePath: "uploads/gallery/video3.mp4",
      },
    },
  ];

  for (const d of mockDocs) {
    d.ref = {
      set: async (update, opts) => {
        Object.assign(d.data, update);
      },
    };
  }

  const redispatchedJobs = [];
  const mockRetryClient = {
    request: async (req) => {
      redispatchedJobs.push(req.data.jobId);
      return { status: 200 };
    },
  };

  const mockDb = {
    collection: () => ({
      where: () => ({
        where: () => ({
          limit: () => ({
            get: async () => ({
              empty: false,
              docs: mockDocs,
            }),
          }),
        }),
      }),
    }),
  };

  const retryResult = await executeVideoRetry({
    workerUrl: "https://mock-worker.run.app",
    db: mockDb,
    client: mockRetryClient,
    FieldValue: { serverTimestamp: () => "MOCK_TIMESTAMP" },
  });

  assert.equal(retryResult.dispatched, 2, "Must dispatch both VIDEO_DISPATCH_TIMEOUT and VIDEO_DISPATCH_FAILED");
  assert.ok(redispatchedJobs.includes("job-timeout"), "VIDEO_DISPATCH_TIMEOUT must be redispatched");
  assert.ok(redispatchedJobs.includes("job-failed"), "VIDEO_DISPATCH_FAILED must be redispatched");
  assert.equal(redispatchedJobs.includes("job-completed"), false, "COMPLETED video must NEVER be redispatched");
  assert.equal(mockDocs[0].data.status, "PROCESSING_VIDEO");
  assert.equal(mockDocs[1].data.status, "PROCESSING_VIDEO");
  assert.equal(mockDocs[2].data.status, "COMPLETED");
});

// ============================================================================
// 9. Scheduled Firestore Mirror Delivery Worker with Retry and Idempotency
// ============================================================================
test("9. scheduled Firestore mirror delivery worker with retry and idempotency", async (t) => {
  await t.test("more than 50 older DELIVERED records followed by a PENDING record; pending record is processed", async () => {
    // 55 older DELIVERED records followed by 1 PENDING record
    const deliveredLogs = Array.from({ length: 55 }, (_, i) => ({
      id: `log-delivered-${i}`,
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: i % 2 === 0 ? "ARCHIVED" : "CREATED", // tests both archived and legacy action: CREATED
      newData: {
        submissionId: `sub-old-${i}`,
        status: "DELIVERED",
        attempts: 1,
      },
      createdAt: new Date(Date.now() - (60 - i) * 60000),
    }));

    const pendingLog = {
      id: "log-pending-target",
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: "CREATED",
      newData: {
        submissionId: "sub-target-1",
        enquiryNumber: "KZ-TARGET-1",
        status: "PENDING",
        attempts: 0,
        payload: {
          leadSubmission: { submissionId: "sub-target-1", enquiryNumber: "KZ-TARGET-1" },
        },
      },
      createdAt: new Date(),
    };

    const allLogs = [...deliveredLogs, pendingLog];
    const updated = new Map();

    const mockDbClient = {
      activityLog: {
        findMany: async ({ where, take }) => {
          return allLogs.filter((log) => {
            if (log.entityType !== where.entityType) return false;
            if (where.action?.not && log.action === where.action.not) return false;
            if (where.NOT) {
              for (const notClause of where.NOT) {
                if (notClause.newData?.path?.[0] === "status" && notClause.newData.equals === log.newData?.status) {
                  return false;
                }
              }
            }
            if (where.OR) {
              return where.OR.some((clause) => {
                if (clause.newData?.path?.[0] === "status") {
                  return clause.newData.equals === log.newData?.status;
                }
                return false;
              });
            }
            return true;
          }).slice(0, take);
        },
        update: async ({ where, data }) => {
          updated.set(where.id, data);
          return { id: where.id, ...data };
        },
      },
    };

    const mirrorCalls = [];
    const mockMirror = async (col, docId, data) => {
      mirrorCalls.push({ col, docId, data });
      return { mirrored: true };
    };

    const result = await deliverPendingFirestoreMirrors(50, mockDbClient, {
      safeFirestoreMirror: mockMirror,
      isConfigured: () => true,
    });

    assert.equal(result.delivered, 1, "Must process and deliver the pending record despite 55 older delivered records");
    assert.equal(mirrorCalls.length, 1);
    assert.equal(mirrorCalls[0].docId, "sub-target-1");
    assert.equal(updated.get("log-pending-target").action, "ARCHIVED");
    assert.equal(updated.get("log-pending-target").newData.status, "DELIVERED");
  });

  await t.test("missing Firebase configuration must not result in DELIVERED", async () => {
    const unconfiguredLog = {
      id: "log-unconfigured",
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: "CREATED",
      newData: {
        submissionId: "sub-unconfigured",
        enquiryNumber: "KZ-U1",
        status: "PENDING",
        attempts: 0,
        payload: {
          leadSubmission: { submissionId: "sub-unconfigured" },
        },
      },
      createdAt: new Date(),
    };

    const updated = new Map();
    const mockDbClient = {
      activityLog: {
        findMany: async () => [unconfiguredLog],
        update: async ({ where, data }) => {
          updated.set(where.id, data);
          return { id: where.id, ...data };
        },
      },
    };

    const result = await deliverPendingFirestoreMirrors(50, mockDbClient, {
      safeFirestoreMirror: async () => ({ mirrored: false, reason: "not-configured" }),
      isConfigured: () => false,
    });

    assert.equal(result.delivered, 0, "Must NEVER mark delivered when configuration is missing");
    assert.equal(updated.get("log-unconfigured").newData.status, "CONFIG_BLOCKED");
    assert.match(updated.get("log-unconfigured").newData.lastError, /not configured/);
  });

  await t.test("RETRY before nextAttemptAt must be skipped", async () => {
    const futureTime = new Date("2026-09-12T13:00:00Z");
    const currentTime = new Date("2026-09-12T12:00:00Z");

    const retryLog = {
      id: "log-future-retry",
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: "UPDATED",
      newData: {
        submissionId: "sub-retry-1",
        status: "RETRY",
        attempts: 1,
        nextAttemptAt: futureTime.toISOString(),
        payload: { leadSubmission: { submissionId: "sub-retry-1" } },
      },
      createdAt: new Date("2026-09-12T11:00:00Z"),
    };

    const updated = new Map();
    const mockDbClient = {
      activityLog: {
        findMany: async () => [retryLog],
        update: async ({ where, data }) => {
          updated.set(where.id, data);
          return { id: where.id, ...data };
        },
      },
    };

    let mirrorCalled = false;
    const result = await deliverPendingFirestoreMirrors(50, mockDbClient, {
      safeFirestoreMirror: async () => { mirrorCalled = true; return { mirrored: true }; },
      isConfigured: () => true,
      now: () => currentTime,
    });

    assert.equal(result.delivered, 0, "Must not deliver before nextAttemptAt");
    assert.equal(result.skipped, 1, "Must record skipped for not-yet-due retry");
    assert.equal(mirrorCalled, false, "Must not call Firestore for not-yet-due retry");
    assert.equal(updated.has("log-future-retry"), false, "Must not touch record before nextAttemptAt");
  });

  await t.test("RETRY after nextAttemptAt must be attempted", async () => {
    const pastTime = new Date("2026-09-12T11:55:00Z");
    const currentTime = new Date("2026-09-12T12:00:00Z");

    const retryLog = {
      id: "log-due-retry",
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: "UPDATED",
      newData: {
        submissionId: "sub-retry-2",
        status: "RETRY",
        attempts: 1,
        nextAttemptAt: pastTime.toISOString(),
        payload: { leadSubmission: { submissionId: "sub-retry-2" } },
      },
      createdAt: new Date("2026-09-12T11:00:00Z"),
    };

    const updated = new Map();
    const mockDbClient = {
      activityLog: {
        findMany: async () => [retryLog],
        update: async ({ where, data }) => {
          updated.set(where.id, data);
          return { id: where.id, ...data };
        },
      },
    };

    let mirrorCalled = false;
    const result = await deliverPendingFirestoreMirrors(50, mockDbClient, {
      safeFirestoreMirror: async () => { mirrorCalled = true; return { mirrored: true }; },
      isConfigured: () => true,
      now: () => currentTime,
    });

    assert.equal(result.delivered, 1, "Must deliver retry record after nextAttemptAt");
    assert.equal(mirrorCalled, true);
    assert.equal(updated.get("log-due-retry").newData.status, "DELIVERED");
    assert.equal(updated.get("log-due-retry").action, "ARCHIVED");
  });

  await t.test("maximum-attempt record must become terminal", async () => {
    const failingLog = {
      id: "log-failing-max",
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: "UPDATED",
      newData: {
        submissionId: "sub-fail-max",
        status: "RETRY",
        attempts: 4, // Next attempt will be 5 == max
        nextAttemptAt: new Date(Date.now() - 1000).toISOString(),
        payload: { leadSubmission: { submissionId: "sub-fail-max" } },
      },
      createdAt: new Date(Date.now() - 3600000),
    };

    const updated = new Map();
    const mockDbClient = {
      activityLog: {
        findMany: async () => [failingLog],
        update: async ({ where, data }) => {
          updated.set(where.id, data);
          return { id: where.id, ...data };
        },
      },
    };

    const result = await deliverPendingFirestoreMirrors(50, mockDbClient, {
      safeFirestoreMirror: async () => ({ mirrored: false, reason: "write-failed" }),
      isConfigured: () => true,
    });

    assert.equal(result.failed, 1);
    const updatedData = updated.get("log-failing-max");
    assert.equal(updatedData.action, "ARCHIVED", "Terminal record must be archived out of the queue");
    assert.equal(updatedData.newData.status, "FAILED", "Must transition to terminal FAILED status");
    assert.equal(updatedData.newData.attempts, 5);
    assert.equal(updatedData.newData.nextAttemptAt, null, "Terminal record must have no nextAttemptAt");
  });

  await t.test("55 older future retries, 1 newer PENDING, 1 newer due RETRY, and 1 legacy RETRY with no nextAttemptAt: only eligible records occupy limit and all are processed", async () => {
    const now = new Date("2026-09-12T12:00:00Z");
    const futureTime = new Date("2026-09-12T14:00:00Z").toISOString();
    const pastTime = new Date("2026-09-12T10:00:00Z").toISOString();

    // 55 older RETRY records whose nextAttemptAt is in the future
    const futureRetryLogs = Array.from({ length: 55 }, (_, i) => ({
      id: `log-future-retry-${i}`,
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: "UPDATED",
      newData: {
        submissionId: `sub-future-${i}`,
        status: "RETRY",
        attempts: 1,
        nextAttemptAt: futureTime,
        payload: { leadSubmission: { submissionId: `sub-future-${i}` } },
      },
      createdAt: new Date(now.getTime() - (100 - i) * 60000),
    }));

    // 1 newer PENDING record
    const newerPendingLog = {
      id: "log-newer-pending",
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: "CREATED",
      newData: {
        submissionId: "sub-newer-pending",
        enquiryNumber: "KZ-PENDING-NEW",
        status: "PENDING",
        attempts: 0,
        payload: {
          leadSubmission: { submissionId: "sub-newer-pending", enquiryNumber: "KZ-PENDING-NEW" },
        },
      },
      createdAt: new Date(now.getTime() - 10000),
    };

    // 1 newer due RETRY record (nextAttemptAt in the past)
    const newerDueRetryLog = {
      id: "log-newer-due-retry",
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: "UPDATED",
      newData: {
        submissionId: "sub-newer-due",
        enquiryNumber: "KZ-DUE-NEW",
        status: "RETRY",
        attempts: 2,
        nextAttemptAt: pastTime,
        payload: {
          leadSubmission: { submissionId: "sub-newer-due", enquiryNumber: "KZ-DUE-NEW" },
        },
      },
      createdAt: new Date(now.getTime() - 5000),
    };

    // 1 legacy RETRY record with NO nextAttemptAt (must remain recoverable)
    const legacyRetryLog = {
      id: "log-legacy-retry",
      entityType: "FIRESTORE_MIRROR_OUTBOX",
      action: "UPDATED",
      newData: {
        submissionId: "sub-legacy-retry",
        enquiryNumber: "KZ-LEGACY-RETRY",
        status: "RETRY",
        attempts: 1,
        nextAttemptAt: undefined, // no nextAttemptAt field
        payload: {
          leadSubmission: { submissionId: "sub-legacy-retry", enquiryNumber: "KZ-LEGACY-RETRY" },
        },
      },
      createdAt: new Date(now.getTime() - 20000),
    };

    const allLogs = [...futureRetryLogs, newerPendingLog, newerDueRetryLog, legacyRetryLog];
    const updated = new Map();

    const mockDbClient = {
      activityLog: {
        findMany: async ({ where, take }) => {
          return allLogs
            .filter((log) => {
              if (log.entityType !== where.entityType) return false;
              if (where.action?.not && log.action === where.action.not) return false;
              if (where.OR) {
                const orMatched = where.OR.some((clause) => {
                  if (clause.newData) {
                    const [field] = clause.newData.path;
                    if (clause.newData.equals !== undefined) {
                      return log.newData?.[field] === clause.newData.equals;
                    }
                  }
                  if (clause.AND) {
                    return clause.AND.every((andClause) => {
                      if (andClause.newData) {
                        const [field] = andClause.newData.path;
                        if (andClause.newData.equals !== undefined) {
                          return log.newData?.[field] === andClause.newData.equals;
                        }
                        if (andClause.newData.lte !== undefined) {
                          const val = log.newData?.[field];
                          return val !== null && val !== undefined && val <= andClause.newData.lte;
                        }
                      }
                      if (andClause.OR) {
                        return andClause.OR.some((nestedOr) => {
                          const [field] = nestedOr.newData.path;
                          if (nestedOr.newData.equals !== undefined) {
                            const isPrismaAnyNull =
                              nestedOr.newData.equals === Prisma.AnyNull ||
                              nestedOr.newData.equals === "AnyNull" ||
                              nestedOr.newData.equals === "DbNull" ||
                              nestedOr.newData.equals === "JsonNull" ||
                              typeof nestedOr.newData.equals === "symbol" ||
                              (typeof nestedOr.newData.equals === "object" && nestedOr.newData.equals !== null) ||
                              String(nestedOr.newData.equals).includes("Null");
                            if (isPrismaAnyNull) {
                              return log.newData?.[field] === null || log.newData?.[field] === undefined;
                            }
                            return log.newData?.[field] === nestedOr.newData.equals;
                          }
                          if (nestedOr.newData.lte !== undefined) {
                            const val = log.newData?.[field];
                            return val !== null && val !== undefined && val <= nestedOr.newData.lte;
                          }
                          return false;
                        });
                      }
                      return true;
                    });
                  }
                  return false;
                });
                if (!orMatched) return false;
              }
              return true;
            })
            .slice(0, take);
        },
        update: async ({ where, data }) => {
          updated.set(where.id, data);
          return { id: where.id, ...data };
        },
      },
    };

    const deliveredDocs = [];
    const mockMirror = async (col, docId, data) => {
      deliveredDocs.push(docId);
      return { mirrored: true };
    };

    const result = await deliverPendingFirestoreMirrors(50, mockDbClient, {
      safeFirestoreMirror: mockMirror,
      isConfigured: () => true,
      now: () => now,
    });

    assert.equal(result.delivered, 3, "Must process and deliver all 3 eligible records: newer pending, newer due retry, and legacy retry");
    assert.equal(result.failed, 0);
    assert.equal(deliveredDocs.length, 3);
    assert.ok(deliveredDocs.includes("sub-newer-pending"), "Newer pending record must be delivered");
    assert.ok(deliveredDocs.includes("sub-newer-due"), "Newer due retry record must be delivered");
    assert.ok(deliveredDocs.includes("sub-legacy-retry"), "Legacy retry record without nextAttemptAt must be delivered");
    assert.equal(updated.get("log-newer-pending").newData.status, "DELIVERED");
    assert.equal(updated.get("log-newer-due-retry").newData.status, "DELIVERED");
    assert.equal(updated.get("log-legacy-retry").newData.status, "DELIVERED");
    assert.equal(updated.get("log-newer-pending").action, "ARCHIVED");
    assert.equal(updated.get("log-newer-due-retry").action, "ARCHIVED");
    assert.equal(updated.get("log-legacy-retry").action, "ARCHIVED");
  });

  await t.test("regression: production buildFirestoreOutboxWhere contains no ordinary equals: null JSON filter and satisfies Prisma.ActivityLogWhereInput", () => {
    const now = new Date("2026-09-12T12:00:00Z");
    const where = buildFirestoreOutboxWhere(now, true);

    // Recursively assert that the generated query contains no ordinary JavaScript equals: null
    function assertNoOrdinaryNull(obj, path = "") {
      if (!obj || typeof obj !== "object") return;
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;
        if (key === "equals") {
          assert.notEqual(
            value,
            null,
            `Found ordinary JavaScript null at ${currentPath}. Prisma JsonNullableFilter requires a Prisma JSON null filter constant (e.g. Prisma.AnyNull), not ordinary null.`,
          );
        }
        if (typeof value === "object" && value !== null) {
          assertNoOrdinaryNull(value, currentPath);
        }
      }
    }
    assertNoOrdinaryNull(where);

    // Source code static checks on lib/firebase/firestoreRest.ts
    const firestoreSource = source("lib/firebase/firestoreRest.ts");
    assert.match(
      firestoreSource,
      /satisfies\s+Prisma\.ActivityLogWhereInput/,
      "Query must statically satisfy Prisma.ActivityLogWhereInput",
    );
    assert.doesNotMatch(
      firestoreSource,
      /eligibleConditions\s*:\s*any\[\]/,
      "Must not declare eligibleConditions as any[] to bypass Prisma validation",
    );
    assert.doesNotMatch(
      firestoreSource,
      /equals:\s*null\b/,
      "Must not use ordinary equals: null in JSON query",
    );
  });
});

// ============================================================================
// 10. Media Upload Safety: MIME Whitelist and Size Cap Validation
// ============================================================================
test("10. media upload safety: MIME whitelist and size cap validation via handleGalleryUpload", async () => {
  function makeMockJobRef() {
    let data = {};
    return {
      get: async () => ({ exists: false }),
      set: async (update) => {
        data = { ...data, ...update };
      },
      getData: () => data,
    };
  }

  // Unsupported MIME type
  const badMimeRef = makeMockJobRef();
  const badMimeEvent = {
    data: {
      name: "uploads/gallery/malicious.exe",
      bucket: "kidzeedwarka.appspot.com",
      contentType: "application/x-msdownload",
      size: "1024",
    },
  };
  const badMimeResult = await handleGalleryUpload(badMimeEvent, {
    jobRef: badMimeRef,
    FieldValue: { serverTimestamp: () => "TS" },
  });
  assert.equal(badMimeResult.action, "REJECTED");
  assert.equal(badMimeResult.status, "REJECTED");
  assert.equal(badMimeRef.getData().status, "REJECTED");
  assert.match(badMimeRef.getData().reason, /Unsupported file type/i);

  // Oversized image (> 12MB)
  const bigImageRef = makeMockJobRef();
  const bigImageEvent = {
    data: {
      name: "uploads/gallery/huge-photo.jpg",
      bucket: "kidzeedwarka.appspot.com",
      contentType: "image/jpeg",
      size: String(15 * 1024 * 1024), // 15MB > 12MB
    },
  };
  const bigImageResult = await handleGalleryUpload(bigImageEvent, {
    jobRef: bigImageRef,
    FieldValue: { serverTimestamp: () => "TS" },
  });
  assert.equal(bigImageResult.action, "REJECTED");
  assert.equal(bigImageRef.getData().status, "REJECTED");

  // Oversized video (> 800MB)
  const bigVideoRef = makeMockJobRef();
  const bigVideoEvent = {
    data: {
      name: "uploads/gallery/huge-video.mp4",
      bucket: "kidzeedwarka.appspot.com",
      contentType: "video/mp4",
      size: String(850 * 1024 * 1024), // 850MB > 800MB
    },
  };
  const bigVideoResult = await handleGalleryUpload(bigVideoEvent, {
    jobRef: bigVideoRef,
    FieldValue: { serverTimestamp: () => "TS" },
  });
  assert.equal(bigVideoResult.action, "REJECTED");
  assert.equal(bigVideoRef.getData().status, "REJECTED");

  // Valid video (15MB) without worker URL -> accepted and transitions to CLOUD_RUN_REQUIRED
  const validVideoRef = makeMockJobRef();
  const validVideoEvent = {
    data: {
      name: "uploads/gallery/activity-video.mp4",
      bucket: "kidzeedwarka.appspot.com",
      contentType: "video/mp4",
      size: String(15 * 1024 * 1024),
    },
  };
  const validVideoResult = await handleGalleryUpload(validVideoEvent, {
    jobRef: validVideoRef,
    FieldValue: { serverTimestamp: () => "TS" },
  });
  assert.equal(validVideoResult.action, "CLOUD_RUN_REQUIRED");
  assert.equal(validVideoResult.status, "CLOUD_RUN_REQUIRED");
  assert.equal(validVideoRef.getData().status, "CLOUD_RUN_REQUIRED");
});
