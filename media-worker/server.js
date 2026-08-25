const { execFile } = require("node:child_process");
const { mkdtemp, rm } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { extname, join } = require("node:path");
const { promisify } = require("node:util");
const express = require("express");
const { initializeApp } = require("firebase-admin/app");
const { FieldValue, getFirestore } = require("firebase-admin/firestore");
const { getStorage } = require("firebase-admin/storage");

initializeApp();
const run = promisify(execFile);
const app = express();
app.use(express.json({ limit: "256kb" }));

function safeText(value, maximumLength) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

async function ffmpeg(argumentsList) {
  await run("ffmpeg", argumentsList, {
    timeout: 14 * 60 * 1000,
    windowsHide: true,
    maxBuffer: 2 * 1024 * 1024,
  });
}

async function upload(bucket, localPath, destination, contentType) {
  await bucket.upload(localPath, {
    destination,
    resumable: false,
    metadata: {
      contentType,
      cacheControl: "public,max-age=31536000,immutable",
      metadata: { generatedBy: "kidzee-cloud-run-ffmpeg-v1" },
    },
  });
  return destination;
}

app.get("/health", (_request, response) => {
  response.status(200).json({ ok: true });
});

app.post("/process", async (request, response) => {
  const jobId = safeText(request.body?.jobId, 120);
  const bucketName = safeText(request.body?.bucket, 250);
  const sourcePath = safeText(request.body?.sourcePath, 700);
  if (
    !/^[A-Za-z0-9_-]{8,120}$/.test(jobId) ||
    !bucketName ||
    !sourcePath.startsWith("uploads/gallery/")
  ) {
    response.status(400).json({ ok: false, message: "Invalid media job." });
    return;
  }

  const db = getFirestore();
  const jobRef = db.collection("mediaProcessingJobs").doc(jobId);
  const bucket = getStorage().bucket(bucketName);
  const workDirectory = await mkdtemp(join(tmpdir(), "kidzee-media-"));
  const sourceExtension = extname(sourcePath).slice(0, 12) || ".source";
  const inputPath = join(workDirectory, `source${sourceExtension}`);
  const outputPath = join(workDirectory, "optimized.mp4");
  const posterPath = join(workDirectory, "poster.jpg");
  const thumbnailPath = join(workDirectory, "thumbnail.jpg");

  try {
    await jobRef.set(
      {
        status: "PROCESSING_VIDEO",
        worker: "CLOUD_RUN_FFMPEG",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    await bucket.file(sourcePath).download({ destination: inputPath });

    await ffmpeg([
      "-y",
      "-i", inputPath,
      "-vf", "scale='min(1280,iw)':-2:force_original_aspect_ratio=decrease",
      "-c:v", "libx264",
      "-preset", "medium",
      "-crf", "23",
      "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-b:a", "128k",
      "-movflags", "+faststart",
      outputPath,
    ]);
    await ffmpeg([
      "-y", "-ss", "00:00:01", "-i", inputPath,
      "-frames:v", "1",
      "-vf", "scale='min(1280,iw)':-2:force_original_aspect_ratio=decrease",
      "-q:v", "3",
      posterPath,
    ]);
    await ffmpeg([
      "-y", "-ss", "00:00:01", "-i", inputPath,
      "-frames:v", "1",
      "-vf", "scale=480:480:force_original_aspect_ratio=increase,crop=480:480",
      "-q:v", "3",
      thumbnailPath,
    ]);

    const basePath = `public/gallery/derivatives/${jobId}`;
    const derivatives = await Promise.all([
      upload(bucket, outputPath, `${basePath}/optimized.mp4`, "video/mp4"),
      upload(bucket, posterPath, `${basePath}/poster.jpg`, "image/jpeg"),
      upload(bucket, thumbnailPath, `${basePath}/thumbnail.jpg`, "image/jpeg"),
    ]);
    await jobRef.set(
      {
        status: "COMPLETED",
        worker: "CLOUD_RUN_FFMPEG",
        derivatives,
        completedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    response.status(200).json({ ok: true, derivatives });
  } catch (error) {
    await jobRef.set(
      {
        status: "FAILED",
        message: error instanceof Error ? error.message.slice(0, 500) : "Video processing failed.",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
    response.status(500).json({ ok: false, message: "Video processing failed." });
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
  }
});

app.listen(Number(process.env.PORT || 8080), () => {
  console.log("Kidzee media worker ready.");
});
