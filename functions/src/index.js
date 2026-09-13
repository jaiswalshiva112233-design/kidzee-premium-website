const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { onObjectFinalized } = require("firebase-functions/v2/storage");
const { defineSecret, defineString } = require("firebase-functions/params");
const { GoogleAuth } = require("google-auth-library");
const sharp = require("sharp");

initializeApp();

const billingCronSecret = defineSecret("BILLING_CRON_SECRET");
const marketingCronSecret = defineSecret("MARKETING_CRON_SECRET");
const centreOsBaseUrl = defineString("CENTREOS_BASE_URL", {
  default: "https://kidzeedwarka.com",
});
const mediaWorkerUrl = defineString("MEDIA_WORKER_URL", { default: "" });

function optionalSchedulerEnabled(flagName) {
  return String(process.env[flagName] || "").trim().toLowerCase() === "true";
}

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);
const VIDEO_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_VIDEO_BYTES = 800 * 1024 * 1024;

function mediaJobId(path) {
  return Buffer.from(path).toString("base64url").slice(0, 120);
}

async function saveDerivative(bucket, destination, data, contentType) {
  await bucket.file(destination).save(data, {
    resumable: false,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000,immutable",
      metadata: { generatedBy: "kidzee-gallery-processor-v1" },
    },
  });
  return destination;
}

if (optionalSchedulerEnabled("GROWTH_SUMMARY_SCHEDULER_ENABLED")) {
exports.buildDailyGrowthSummary = onSchedule(
  {
    schedule: "every day 06:15",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "256MiB",
    maxInstances: 1,
  },
  async () => {
    const db = getFirestore();
    const now = new Date();
    const day = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const start = new Date(`${day}T00:00:00+05:30`);
    const [events, leads, careers] = await Promise.all([
      db.collection("websiteEvents").where("trafficClass", "==", "GENUINE").where("createdAt", ">=", start).count().get(),
      db.collection("leadSubmissions").where("trafficClass", "==", "GENUINE").where("receivedAt", ">=", start).count().get(),
      db.collection("careerApplications").where("createdAt", ">=", start).count().get(),
    ]);
    await db.collection("adminSummaries").doc(`growth-${day}`).set(
      {
        day,
        genuineEvents: events.data().count,
        genuineLeads: leads.data().count,
        careerApplications: careers.data().count,
        generatedAt: FieldValue.serverTimestamp(),
        version: 1,
      },
      { merge: true },
    );
  },
);
}

exports.retryMarketingConversions = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "256MiB",
    maxInstances: 1,
    secrets: [marketingCronSecret],
  },
  async () => {
    const baseUrl = centreOsBaseUrl.value().trim().replace(/\/$/, "");
    const secret = marketingCronSecret.value();
    if (!/^https:\/\//.test(baseUrl) || secret.length < 32) {
      throw new Error("Marketing retry scheduler is not configured safely.");
    }
    const response = await fetch(`${baseUrl}/api/internal/marketing-conversions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) {
      throw new Error(`Marketing retry endpoint returned ${response.status}.`);
    }
  },
);

if (optionalSchedulerEnabled("GROWTH_SCHEDULER_ENABLED")) {
const growthSyncSecret = defineSecret("GROWTH_SYNC_SECRET");
exports.synchronizeGrowthSources = onSchedule(
  {
    schedule: "every day 05:45",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "256MiB",
    maxInstances: 1,
    secrets: [growthSyncSecret],
  },
  async () => {
    const baseUrl = centreOsBaseUrl.value().trim().replace(/\/$/, "");
    const secret = growthSyncSecret.value();
    if (!/^https:\/\//.test(baseUrl) || secret.length < 32) throw new Error("Growth source scheduler is not configured safely.");
    const response = await fetch(`${baseUrl}/api/internal/growth-sync`, { method: "POST", headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(55_000) });
    if (!response.ok) throw new Error(`Growth source endpoint returned ${response.status}.`);
  },
);
}

if (optionalSchedulerEnabled("WHATSAPP_SCHEDULER_ENABLED")) {
const whatsappCronSecret = defineSecret("WHATSAPP_CRON_SECRET");
exports.processWhatsAppAutomation = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "256MiB",
    maxInstances: 1,
    secrets: [whatsappCronSecret],
  },
  async () => {
    const baseUrl = centreOsBaseUrl.value().trim().replace(/\/$/, "");
    const secret = whatsappCronSecret.value();
    if (!/^https:\/\//.test(baseUrl) || secret.length < 32) {
      throw new Error("WhatsApp scheduler is not configured safely.");
    }
    const response = await fetch(`${baseUrl}/api/internal/whatsapp-automation`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) throw new Error(`WhatsApp automation endpoint returned ${response.status}.`);
  },
);
}

if (optionalSchedulerEnabled("NOTIFICATION_SCHEDULER_ENABLED")) {
const notificationCronSecret = defineSecret("NOTIFICATION_CRON_SECRET");
exports.processCentreNotifications = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "256MiB",
    maxInstances: 1,
    secrets: [notificationCronSecret],
  },
  async () => {
    const baseUrl = centreOsBaseUrl.value().trim().replace(/\/$/, "");
    const secret = notificationCronSecret.value();
    if (!/^https:\/\//.test(baseUrl) || secret.length < 32) throw new Error("Notification scheduler is not configured safely.");
    const response = await fetch(`${baseUrl}/api/internal/notifications`, { method: "POST", headers: { Authorization: `Bearer ${secret}` }, signal: AbortSignal.timeout(55_000) });
    if (!response.ok) throw new Error(`Notification endpoint returned ${response.status}.`);
  },
);
}

exports.generateMonthlyCentreInvoices = onSchedule(
  {
    schedule: "every day 00:10",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "256MiB",
    maxInstances: 1,
    secrets: [billingCronSecret],
  },
  async () => {
    const baseUrl = centreOsBaseUrl.value().trim().replace(/\/$/, "");
    const secret = billingCronSecret.value();
    if (!/^https:\/\//.test(baseUrl) || secret.length < 32) {
      throw new Error("Recurring billing scheduler is not configured safely.");
    }
    const response = await fetch(`${baseUrl}/api/internal/recurring-billing`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) throw new Error(`Recurring billing endpoint returned ${response.status}.`);
  },
);

if (optionalSchedulerEnabled("OWNER_INTELLIGENCE_SCHEDULER_ENABLED")) {
const ownerIntelligenceCronSecret = defineSecret("OWNER_INTELLIGENCE_CRON_SECRET");
exports.refreshOwnerIntelligence = onSchedule(
  {
    schedule: "every 15 minutes",
    timeZone: "Asia/Kolkata",
    region: "asia-south1",
    memory: "256MiB",
    maxInstances: 1,
    secrets: [ownerIntelligenceCronSecret],
  },
  async () => {
    const baseUrl = centreOsBaseUrl.value().trim().replace(/\/$/, "");
    const secret = ownerIntelligenceCronSecret.value();
    if (!/^https:\/\//.test(baseUrl) || secret.length < 32) {
      throw new Error("Owner intelligence scheduler is not configured safely.");
    }
    const response = await fetch(`${baseUrl}/api/internal/owner-intelligence`, {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}` },
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) throw new Error(`Owner intelligence endpoint returned ${response.status}.`);
  },
);
}

async function handleGalleryUpload(event, deps = {}) {
  const object = event.data;
  if (!object.name || !object.name.startsWith("uploads/gallery/")) return;

  const db = deps.db || getFirestore();
  const jobId = mediaJobId(object.name);
  const jobRef = deps.jobRef || db.collection("mediaProcessingJobs").doc(jobId);
  const generation = String(object.generation || "");
  const previous = await jobRef.get();
  if (
    previous.exists &&
    previous.get("status") === "COMPLETED" &&
    previous.get("generation") === generation
  ) {
    return { action: "RETURN_EARLY_IDEMPOTENT", status: "COMPLETED" };
  }

  const contentType = object.contentType || "application/octet-stream";
  const size = Number(object.size || 0);
  const isImage = IMAGE_TYPES.has(contentType);
  const isVideo = VIDEO_TYPES.has(contentType);
  const accepted =
    (isImage && size > 0 && size <= MAX_IMAGE_BYTES) ||
    (isVideo && size > 0 && size <= MAX_VIDEO_BYTES);

  const serverTimestamp = deps.FieldValue?.serverTimestamp
    ? deps.FieldValue.serverTimestamp()
    : FieldValue.serverTimestamp();

  await jobRef.set(
    {
      sourcePath: object.name,
      bucket: object.bucket,
      contentType,
      size,
      generation,
      status: accepted ? "PROCESSING" : "REJECTED",
      reason: accepted ? null : "Unsupported file type or file exceeds the configured source limit.",
      updatedAt: serverTimestamp,
      createdAt: previous.exists ? previous.get("createdAt") : serverTimestamp,
    },
    { merge: true },
  );

  if (!accepted) return { action: "REJECTED", status: "REJECTED" };

  if (isVideo) {
    const workerUrl = deps.workerUrl || (mediaWorkerUrl.value ? mediaWorkerUrl.value().trim().replace(/\/$/, "") : "");
    if (workerUrl) {
      try {
        let client = deps.client;
        if (!client) {
          const auth = new GoogleAuth();
          client = await auth.getIdTokenClient(workerUrl);
        }
        await jobRef.set(
          {
            status: "QUEUED_FOR_VIDEO_PROCESSING",
            worker: "CLOUD_RUN_FFMPEG",
            updatedAt: serverTimestamp,
          },
          { merge: true },
        );
        await client.request({
          url: `${workerUrl}/process`,
          method: "POST",
          data: {
            jobId,
            bucket: object.bucket,
            sourcePath: object.name,
          },
          timeout: 30_000,
        });
        await jobRef.set(
          {
            status: "PROCESSING_VIDEO",
            worker: "CLOUD_RUN_FFMPEG",
            message: "Video worker acknowledged dispatch and is processing.",
            updatedAt: serverTimestamp,
          },
          { merge: true },
        );
        return { action: "DISPATCH_ACKNOWLEDGED", status: "PROCESSING_VIDEO" };
      } catch (error) {
        const isTimeout =
          Boolean(error) &&
          (error.code === "ECONNABORTED" ||
            error.code === "ETIMEDOUT" ||
            error.name === "AbortError" ||
            /timeout/i.test(error.message || ""));

        const check = await jobRef.get();
        const currentStatus = check.exists ? check.get("status") : null;
        if (
          currentStatus === "COMPLETED" ||
          currentStatus === "PROCESSING_VIDEO"
        ) {
          return { action: "PRESERVE_EXISTING_STATUS", status: currentStatus };
        }

        if (isTimeout) {
          await jobRef.set(
            {
              status: "VIDEO_DISPATCH_TIMEOUT",
              worker: "CLOUD_RUN_FFMPEG",
              retryable: true,
              message: "Video worker dispatch timed out before acknowledgement; job remains retryable.",
              lastError: error instanceof Error ? error.message.slice(0, 500) : "Worker dispatch timeout",
              updatedAt: serverTimestamp,
            },
            { merge: true },
          );
          throw error;
        }

        await jobRef.set(
          {
            status: "VIDEO_DISPATCH_FAILED",
            worker: "CLOUD_RUN_FFMPEG",
            retryable: true,
            message:
              error instanceof Error
                ? error.message.slice(0, 500)
                : "Video worker dispatch failed.",
            lastError: error instanceof Error ? error.message.slice(0, 500) : "Worker dispatch failed",
            updatedAt: serverTimestamp,
          },
          { merge: true },
        );
        throw error;
      }
    }

    await jobRef.set(
      {
        status: "CLOUD_RUN_REQUIRED",
        worker: "FFMPEG",
        requiredOutputs: ["optimized-video", "poster", "thumbnail"],
        message: "Deploy the optional Cloud Run FFmpeg worker before publishing this video.",
        updatedAt: serverTimestamp,
      },
      { merge: true },
    );
    return { action: "CLOUD_RUN_REQUIRED", status: "CLOUD_RUN_REQUIRED" };
  }

    const bucket = deps.bucket || (deps.storage ? deps.storage.bucket(object.bucket) : getStorage().bucket(object.bucket));
    const sourceFile = bucket.file(object.name);
    try {
      const [sourceBuffer] = await sourceFile.download();
      const oriented = sharp(sourceBuffer, { failOn: "warning" }).rotate();
      const basePath = `public/gallery/derivatives/${jobId}`;
      const metadata = await oriented.metadata();
      const derivatives = [];

      const thumbnail = await oriented
        .clone()
        .resize({ width: 480, height: 480, fit: "cover", position: "attention", withoutEnlargement: true })
        .webp({ quality: 82, effort: 4 })
        .toBuffer();
      derivatives.push(
        await saveDerivative(bucket, `${basePath}/thumbnail-480.webp`, thumbnail, "image/webp"),
      );

      const web = await oriented
        .clone()
        .resize({ width: 1_200, withoutEnlargement: true })
        .webp({ quality: 85, effort: 4 })
        .toBuffer();
      derivatives.push(
        await saveDerivative(bucket, `${basePath}/web-1200.webp`, web, "image/webp"),
      );

      const large = await oriented
        .clone()
        .resize({ width: 2_000, withoutEnlargement: true })
        .avif({ quality: 62, effort: 4 })
        .toBuffer();
      derivatives.push(
        await saveDerivative(bucket, `${basePath}/large-2000.avif`, large, "image/avif"),
      );

      await jobRef.set(
        {
          status: "COMPLETED",
          worker: "FIREBASE_IMAGE_PROCESSOR",
          original: {
            width: metadata.width || null,
            height: metadata.height || null,
            format: metadata.format || null,
          },
          derivatives,
          completedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    } catch (error) {
      await jobRef.set(
        {
          status: "FAILED",
          message: error instanceof Error ? error.message.slice(0, 500) : "Image processing failed.",
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      throw error;
    }
}

exports.processGalleryUpload = onObjectFinalized(
  {
    region: "asia-south2",
    memory: "1GiB",
    timeoutSeconds: 540,
    maxInstances: 2,
    concurrency: 1,
  },
  handleGalleryUpload,
);
async function executeVideoRetry(deps = {}) {
  const workerUrl = deps.workerUrl || (mediaWorkerUrl.value ? mediaWorkerUrl.value().trim().replace(/\/$/, "") : "");
  if (!workerUrl) return { processed: 0, skipped: "no-worker-url" };

  const db = deps.db || getFirestore();
  const serverTimestamp = deps.FieldValue?.serverTimestamp ? deps.FieldValue.serverTimestamp() : FieldValue.serverTimestamp();
  const now = typeof deps.now === "function" ? deps.now() : (deps.now || Date.now());

  const query = db
    .collection("mediaProcessingJobs")
    .where("retryable", "==", true)
    .where("status", "in", ["VIDEO_DISPATCH_TIMEOUT", "VIDEO_DISPATCH_FAILED"])
    .limit(deps.limit || 10);

  const retryJobs = await query.get();
  if (retryJobs.empty) return { processed: 0, dispatched: 0, skipped: 0 };

  const auth = deps.auth || new GoogleAuth();
  const client = deps.client || (await auth.getIdTokenClient(workerUrl));

  let dispatched = 0;
  let skipped = 0;

  for (const doc of retryJobs.docs) {
    const data = typeof doc.data === "function" ? doc.data() : doc.data;

    // Strict safety guards: Never retry COMPLETED or PROCESSING_VIDEO jobs
    if (data.status === "COMPLETED" || data.status === "PROCESSING_VIDEO") {
      skipped += 1;
      continue;
    }

    if (data.retryable === false) {
      skipped += 1;
      continue;
    }

    if (data.status !== "VIDEO_DISPATCH_TIMEOUT" && data.status !== "VIDEO_DISPATCH_FAILED") {
      skipped += 1;
      continue;
    }

    // Delay eligibility enforcement
    if (data.nextAttemptAt) {
      const nextAttemptTime = typeof data.nextAttemptAt.toMillis === "function"
        ? data.nextAttemptAt.toMillis()
        : new Date(data.nextAttemptAt).getTime();
      if (!Number.isNaN(nextAttemptTime) && nextAttemptTime > now) {
        skipped += 1;
        continue; // Not yet due for retry
      }
    }

    const attempts = Number(data.dispatchAttempts || 0) + 1;
    if (attempts > 5) {
      await doc.ref.set(
        {
          retryable: false,
          status: "VIDEO_DISPATCH_ABANDONED",
          updatedAt: serverTimestamp,
        },
        { merge: true },
      );
      continue;
    }

    const backoffMs = Math.min(60 * 60 * 1000, 5 * 60 * 1000 * 2 ** (attempts - 1));
    const nextAttemptAtDate = new Date(now + backoffMs);

    try {
      await doc.ref.set(
        {
          dispatchAttempts: attempts,
          status: "QUEUED_FOR_VIDEO_PROCESSING",
          updatedAt: serverTimestamp,
        },
        { merge: true },
      );

      await client.request({
        url: `${workerUrl}/process`,
        method: "POST",
        data: {
          jobId: doc.id,
          bucket: data.bucket || data.sourceBucket || (process.env.STORAGE_BUCKET || "kidzee-dwarka-media"),
          sourcePath: data.sourcePath,
        },
        timeout: 30_000,
      });

      await doc.ref.set(
        {
          status: "PROCESSING_VIDEO",
          message: "Video worker acknowledged dispatch and is processing.",
          updatedAt: serverTimestamp,
        },
        { merge: true },
      );
      dispatched += 1;
    } catch (err) {
      const isTimeout = err.code === "ECONNABORTED" || /timeout/i.test(err.message || "");
      const nextStatus = isTimeout ? "VIDEO_DISPATCH_TIMEOUT" : "VIDEO_DISPATCH_FAILED";
      const canRetry = attempts < 5;

      await doc.ref.set(
        {
          status: nextStatus,
          retryable: canRetry,
          dispatchAttempts: attempts,
          lastError: err instanceof Error ? err.message.slice(0, 500) : "Retry failed",
          lastAttemptAt: serverTimestamp,
          nextAttemptAt: canRetry ? nextAttemptAtDate : null,
          updatedAt: serverTimestamp,
        },
        { merge: true },
      );
    }
  }

  return { processed: retryJobs.docs.length, dispatched, skipped };
}

exports.processGalleryUpload.handleGalleryUpload = handleGalleryUpload;
exports.processGalleryUpload.executeVideoRetry = executeVideoRetry;

if (optionalSchedulerEnabled("VIDEO_RETRY_SCHEDULER_ENABLED")) {
  exports.retryVideoProcessingJobs = onSchedule(
    {
      schedule: "every 30 minutes",
      timeZone: "Asia/Kolkata",
      region: "asia-south1",
      memory: "256MiB",
      maxInstances: 1,
    },
    async () => {
      await executeVideoRetry();
    },
  );
}
