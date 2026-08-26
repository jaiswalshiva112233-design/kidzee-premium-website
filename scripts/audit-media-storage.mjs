import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const mediaExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".gif", ".mp4", ".webm", ".mov", ".pdf"]);

async function walk(directory, source) {
  const found = [];
  try {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) found.push(...await walk(absolute, source));
      else if (mediaExtensions.has(path.extname(entry.name).toLowerCase())) {
        const details = await stat(absolute);
        found.push({ source, path: path.relative(root, absolute).replaceAll("\\", "/"), bytes: details.size });
      }
    }
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  return found;
}

const [publicFiles, uploadFiles, schema] = await Promise.all([
  walk(path.join(root, "public"), "BUNDLED_PUBLIC"),
  walk(path.join(root, "uploads"), "LOCAL_UPLOAD"),
  readFile(path.join(root, "prisma", "schema.prisma"), "utf8"),
]);
const databaseBinaryFields = schema.split(/\r?\n/).map((line, index) => ({ line: index + 1, text: line.trim() })).filter((line) => /\bBytes\??\b/.test(line.text));

console.log(JSON.stringify({
  audit: "CentreOS media storage safety",
  generatedAt: new Date().toISOString(),
  destructiveChanges: false,
  bundledPublic: { count: publicFiles.length, bytes: publicFiles.reduce((sum, item) => sum + item.bytes, 0), files: publicFiles },
  localUploads: { count: uploadFiles.length, bytes: uploadFiles.reduce((sum, item) => sum + item.bytes, 0), files: uploadFiles },
  databaseBinaryFields,
  migrationPolicy: [
    "Do not delete bundled or legacy media during the trial update.",
    "All new public photos use Firebase/GCS optimized derivatives and metadata-only database rows.",
    "All new student documents use private Firebase/GCS paths and authenticated streaming.",
    "Legacy database files remain readable until an Owner backup and separate verified migration are completed.",
  ],
}, null, 2));
