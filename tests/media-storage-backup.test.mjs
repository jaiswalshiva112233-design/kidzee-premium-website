import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
const schema = read("prisma/schema.prisma");
const migration = read("prisma/migrations/20260826110000_media_storage_backup_safety/migration.sql");
const galleryApi = read("app/api/admin/gallery/route.ts");
const galleryManager = read("components/admin/GalleryManager.tsx");
const viewer = read("components/Gallery/GalleryAlbumViewer.tsx");
const embed = read("components/Gallery/ExternalMediaEmbed.tsx");
const studentDocuments = read("app/api/admin/student-documents/route.ts");
const storageRules = read("storage.rules");
const backup = read("lib/admin/backupExports.ts");
const backupPage = read("app/admin/settings/backup/page.tsx");
const permissions = read("lib/admin/permissions.ts");
const dataControl = read("lib/admin/dataControl.ts");

test("database stores file metadata and makes legacy StudentDocument blobs nullable", () => {
  assert.match(schema, /model StoredFile \{/);
  assert.match(schema, /fileData\s+Bytes\?/);
  assert.match(schema, /storedFileId\s+String\?\s+@unique/);
  assert.match(migration, /ALTER COLUMN "fileData" DROP NOT NULL/);
  assert.match(migration, /DATABASE_LEGACY/);
});

test("public and private storage visibility are separated by constraints and rules", () => {
  assert.match(migration, /StoredFile_visibility_path_check/);
  assert.match(storageRules, /match \/public\/gallery\/media\/\{allPaths=\*\*\}[\s\S]*allow read: if true/);
  assert.match(storageRules, /match \/private\/students\/\{allPaths=\*\*\}[\s\S]*allow read, write: if false/);
});

test("student documents use protected Firebase paths and authenticated streaming", () => {
  assert.match(studentDocuments, /storePrivateStudentFile/);
  assert.match(studentDocuments, /downloadPrivateFile/);
  assert.match(studentDocuments, /action: download \? "DOWNLOADED" : "VIEWED"/);
  assert.match(studentDocuments, /Cache-Control"\s*:\s*"private, no-store/);
});

test("student photo and document limits match launch policy", () => {
  assert.match(studentDocuments, /MAX_FILE_SIZE = 5 \* 1024 \* 1024/);
  assert.match(studentDocuments, /MAX_PROFILE_PHOTO_SIZE = 5 \* 1024 \* 1024/);
  assert.match(read("lib/media/imageProcessing.ts"), /output\.byteLength > 300 \* 1024/);
});

test("public gallery photos keep the established compressed Sanity asset path", () => {
  assert.match(galleryApi, /MAX_IMAGE_SIZE_BYTES = 12 \* 1024 \* 1024/);
  assert.match(galleryApi, /processPublicImage\(fileBytes\)/);
  assert.match(galleryApi, /assets\.upload\("image", processedPhoto\.web/);
  assert.match(galleryApi, /mediaSource: "SANITY_ASSET"/);
  assert.match(galleryApi, /_ref: uploadedPhotoAsset\?\._id/);
  assert.doesNotMatch(galleryApi, /mediaSource: "FIREBASE_STORAGE"/);
  assert.match(galleryApi, /revalidatePath\("\/gallery\/\[slug\]", "page"\)/);
  assert.match(read("lib/media/imageProcessing.ts"), /resize\(\{ width: 1_600/);
});

test("reels are URL-based, duplicate-safe and lazy loaded after click", () => {
  assert.match(galleryApi, /action === "createEmbed"/);
  assert.match(galleryApi, /INSTAGRAM/);
  assert.match(galleryApi, /YOUTUBE/);
  assert.match(galleryApi, /This reel is already/);
  assert.match(embed, /active \? |if \(active\)/);
  assert.match(embed, /<iframe/);
  assert.match(embed, /onClick=\{\(\) => setActive\(true\)\}/);
  assert.doesNotMatch(embed, /platform\.instagram\.com\/en_US\/embeds\.js/);
});

test("custom video thumbnails and covers work for external image fields", () => {
  assert.match(galleryApi, /uploadVideoThumbnail/);
  assert.match(galleryApi, /externalThumbnailUrl/);
  assert.match(galleryApi, /defined\(externalImageUrl\)/);
  assert.match(galleryManager, /Add Thumbnail/);
  assert.match(galleryManager, /Set Cover/);
});

test("broken media cannot be published", () => {
  assert.match(galleryApi, /Add a working video or reel URL and a thumbnail before publishing/);
  assert.match(galleryApi, /This photo is not ready/);
});

test("public gallery supports lightbox, lazy embeds and load more", () => {
  assert.match(viewer, /role="dialog"/);
  assert.match(viewer, /createPortal\(/);
  assert.match(viewer, /document\.body/);
  assert.match(viewer, /ExternalMediaEmbed/);
  assert.match(viewer, /visibleCount/);
  assert.match(viewer, /Load more moments/);
  assert.match(viewer, /badge=\{parentStories \? "Parent Story" : "Centre Reel"\}/);
  assert.doesNotMatch(viewer, /<video\s/);
});

test("trial defaults disable AI and direct uploads while enabling safe features", () => {
  const defaults = read("lib/media/mediaSafety.ts");
  assert.match(defaults, /aiMediaFeaturesEnabled: false/);
  assert.match(defaults, /directVideoUploadEnabled: false/);
  assert.match(defaults, /externalEmbedsEnabled: true/);
  assert.match(defaults, /originalArchiveEnabled: false/);
  assert.match(defaults, /compressionEnabled: true/);
  assert.match(defaults, /privateProtectionLocked: true/);
});

test("Owner-only storage and backup controls are permission protected", () => {
  assert.match(permissions, /\/admin\/settings\/storage", permission: "owner\.only"/);
  assert.match(permissions, /\/admin\/settings\/backup", permission: "owner\.only"/);
  assert.match(permissions, /\/api\/admin\/storage-health", permission: "owner\.only"/);
  assert.match(permissions, /\/api\/admin\/backup-exports", permission: "owner\.only"/);
  assert.match(backupPage, /session\.role !== "OWNER"/);
  assert.match(backupPage, /<BackupExportCenter/);
});

test("safe backups exclude credentials, signed URLs and binary file bodies", () => {
  assert.match(backup, /password\|secret\|token\|credential/);
  assert.match(backup, /sensitive value excluded/);
  assert.match(backup, /excludedBinary/);
  assert.match(backup, /Binary media and signed URLs are not included/);
  assert.doesNotMatch(backup, /process\.env\[/);
});

test("manual backups cover operations, attribution, careers and explicit media paths", () => {
  for (const model of [
    "websiteLeadSubmission",
    "studentEnrollmentContract",
    "studentCharge",
    "daycareSession",
    "activityLog",
    "marketingConversionJob",
    "careerApplication",
    "landingPage",
    "campaignUrl",
  ]) {
    assert.match(backup, new RegExp(`prisma\\.${model}\\.findMany`));
  }
  assert.match(backup, /optimizedImagePath/);
  assert.match(backup, /thumbnailPath/);
  assert.match(backup, /originalArchivePath/);
  assert.doesNotMatch(backup, /resumeData:\s*true/);
});

test("safe cleanup archives linked external student files instead of orphaning them", () => {
  assert.match(dataControl, /documents: \{ select: \{ id: true, storedFileId: true \} \}/);
  assert.match(dataControl, /transaction\.storedFile\.updateMany/);
  assert.match(dataControl, /status: "ARCHIVED"/);
});
