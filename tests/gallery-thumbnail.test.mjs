import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("review videos can receive a private thumbnail and become an album cover", () => {
  const manager = source("components/admin/GalleryManager.tsx");
  const route = source("app/api/admin/gallery/route.ts");
  const gallery = source("lib/sanity/gallery.ts");

  assert.match(manager, /uploadVideoThumbnail/);
  assert.match(manager, /Add Thumbnail/);
  assert.match(manager, /Replace Thumbnail/);
  assert.match(manager, /poster=\{item\.imageUrl \?\? undefined\}/);
  assert.match(route, /action === "uploadVideoThumbnail"/);
  assert.match(route, /existingMedia\.mediaType !== "VIDEO"/);
  assert.match(route, /defined\(image\.asset\)/);
  assert.match(route, /coverMediaId: mediaId/);
  assert.match(gallery, /firstVideoThumbnail/);
});
