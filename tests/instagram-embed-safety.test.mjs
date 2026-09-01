import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { persistExternalEmbedRecord } from "../lib/media/embed-persistence.ts";
import {
  InstagramShareResolutionError,
  normalizeInstagramEmbedUrl,
  normalizeInstagramShareUrl,
  resolveInstagramEmbedUrl,
} from "../lib/media/instagram-embed.ts";

const projectRoot = process.cwd();
const source = (file) =>
  fs.readFileSync(path.join(projectRoot, file), "utf8");

const shortcode = "C1Ab_23-x";

for (const [label, input, expectedKind] of [
  ["www Reel", `https://www.instagram.com/reel/${shortcode}/`, "reel"],
  ["non-www Reel", `https://instagram.com/reel/${shortcode}`, "reel"],
  ["mobile Reel", `https://m.instagram.com/reel/${shortcode}/`, "reel"],
  ["plural Reels", `https://www.instagram.com/reels/${shortcode}/`, "reel"],
  ["post", `https://www.instagram.com/p/${shortcode}/`, "p"],
  ["scheme-less", `instagram.com/reel/${shortcode}`, "reel"],
  ["query parameters", `https://www.instagram.com/reel/${shortcode}/?igsh=abc`, "reel"],
  ["embed suffix", `https://www.instagram.com/reel/${shortcode}/embed/`, "reel"],
]) {
  test(`normalizes ${label}`, () => {
    const normalized = normalizeInstagramEmbedUrl(input);
    assert.ok(normalized);
    assert.equal(normalized.kind, expectedKind);
    assert.equal(normalized.shortcode, shortcode);
    assert.equal(
      normalized.publicUrl,
      `https://www.instagram.com/${expectedKind}/${shortcode}/`,
    );
    assert.equal(
      normalized.embedUrl,
      `https://www.instagram.com/${expectedKind}/${shortcode}/embed/`,
    );
  });
}

test("rejects unsafe or incomplete Instagram-like URLs", () => {
  for (const input of [
    "",
    "javascript:https://instagram.com/reel/C12345/",
    "data:text/html,instagram.com/reel/C12345/",
    "ftp://instagram.com/reel/C12345/",
    "https://instagram.com.evil.example/reel/C12345/",
    "https://evil-instagram.com/reel/C12345/",
    "https://evil.example@instagram.com/reel/C12345/",
    "https://instagram.com:444/reel/C12345/",
    "https://instagram.com/reel/abc/",
    "https://instagram.com/reel/C12345%2Fevil/",
    "https://instagram.com/reel/C12345/extra/",
    "https://instagram.com/share/reel/",
  ]) {
    assert.equal(normalizeInstagramEmbedUrl(input), null, input);
  }
});

test("canonical URL and duplicate key ignore host, query and trailing slash", () => {
  const variants = [
    `https://www.instagram.com/reel/${shortcode}/`,
    `https://m.instagram.com/reels/${shortcode}?igsh=anything`,
  ].map((value) => normalizeInstagramEmbedUrl(value));
  assert.ok(variants.every(Boolean));
  assert.equal(new Set(variants.map((item) => item.publicUrl)).size, 1);
  assert.equal(new Set(variants.map((item) => item.duplicateKey)).size, 1);
});

test("recognizes Instagram share forms without mistaking their token for a Reel shortcode", () => {
  const share = `https://www.instagram.com/share/reel/${shortcode}/`;
  assert.equal(normalizeInstagramEmbedUrl(share), null);
  assert.equal(normalizeInstagramShareUrl(share), share);
  assert.equal(normalizeInstagramEmbedUrl(`https://instagr.am/p/${shortcode}/`), null);
  assert.equal(
    normalizeInstagramShareUrl(`https://instagr.am/p/${shortcode}/`),
    `https://instagr.am/p/${shortcode}/`,
  );
});

test("resolves a trusted Instagram share redirect to the canonical Reel", async () => {
  const resolved = await resolveInstagramEmbedUrl(
    `https://www.instagram.com/share/reel/share_token/`,
    {
      fetchImpl: async () =>
        new Response(null, {
          status: 302,
          headers: { location: `https://www.instagram.com/reel/${shortcode}/?igsh=test` },
        }),
    },
  );
  assert.equal(resolved?.publicUrl, `https://www.instagram.com/reel/${shortcode}/`);
});

test("resolves a trusted Instagram HTML canonical URL", async () => {
  const resolved = await resolveInstagramEmbedUrl(
    "https://instagr.am/p/share_token/",
    {
      fetchImpl: async () =>
        new Response(
          `<html><head><link rel="canonical" href="https://www.instagram.com/p/${shortcode}/"></head></html>`,
          { status: 200, headers: { "content-type": "text/html" } },
        ),
    },
  );
  assert.equal(resolved?.publicUrl, `https://www.instagram.com/p/${shortcode}/`);
});

test("blocks a share redirect that leaves trusted Instagram hosts", async () => {
  await assert.rejects(
    resolveInstagramEmbedUrl(
      "https://www.instagram.com/share/reel/share_token/",
      {
        fetchImpl: async () =>
          new Response(null, {
            status: 302,
            headers: { location: "https://evil.example/reel/C12345/" },
          }),
      },
    ),
    (error) =>
      error instanceof InstagramShareResolutionError &&
      error.code === "UNSAFE_REDIRECT",
  );
});

test("Sanity persistence failure compensates a newly-created Prisma inventory row", async () => {
  let compensated = 0;
  await assert.rejects(
    persistExternalEmbedRecord({
      findStoredFile: async () => null,
      createStoredFile: async () => ({ id: "stored-1" }),
      recoverStoredFile: async () => null,
      persistMedia: async () => {
        throw new Error("Sanity unavailable");
      },
      compensateStoredFile: async () => {
        compensated += 1;
      },
      isUniqueConflict: () => false,
    }),
    /Sanity unavailable/,
  );
  assert.equal(compensated, 1);
});

test("Prisma persistence failure stops before Sanity and creates no compensation work", async () => {
  let mediaWrites = 0;
  let compensated = 0;
  await assert.rejects(
    persistExternalEmbedRecord({
      findStoredFile: async () => null,
      createStoredFile: async () => {
        throw new Error("Prisma unavailable");
      },
      recoverStoredFile: async () => null,
      persistMedia: async () => {
        mediaWrites += 1;
      },
      compensateStoredFile: async () => {
        compensated += 1;
      },
      isUniqueConflict: () => false,
    }),
    /Prisma unavailable/,
  );
  assert.equal(mediaWrites, 0);
  assert.equal(compensated, 0);
});

test("a concurrent unique conflict recovers the stable inventory row without duplication", async () => {
  const existing = { id: "stable-stored-id" };
  let mediaWrites = 0;
  const result = await persistExternalEmbedRecord({
    findStoredFile: async () => null,
    createStoredFile: async () => {
      const error = new Error("unique");
      error.code = "P2002";
      throw error;
    },
    recoverStoredFile: async () => existing,
    persistMedia: async (storedFile) => {
      assert.equal(storedFile, existing);
      mediaWrites += 1;
    },
    compensateStoredFile: async () => assert.fail("must not compensate reused row"),
    isUniqueConflict: (error) => error?.code === "P2002",
  });
  assert.equal(result.storedFile, existing);
  assert.equal(result.storedFileCreated, false);
  assert.equal(mediaWrites, 1);
});

test("gallery client, API and public renderer use the shared canonical embed flow", () => {
  const manager = source("components/admin/GalleryManager.tsx");
  const api = source("app/api/admin/gallery/route.ts");
  const viewer = source("components/Gallery/GalleryAlbumViewer.tsx");
  assert.match(manager, /normalizeInstagramEmbedUrl/);
  assert.match(manager, /normalizeInstagramShareUrl/);
  assert.match(manager, /onPaste=\{handleEmbedPaste\}/);
  assert.match(manager, /type="text"/);
  assert.match(manager, /inputMode="url"/);
  assert.match(manager, /Instagram link recognised/);
  assert.match(manager, /tap Share → Copy link/);
  assert.match(api, /resolveInstagramEmbedUrl/);
  assert.match(api, /stableEmbedIds/);
  assert.match(api, /duplicateUrls/);
  assert.match(api, /persistExternalEmbedRecord/);
  assert.match(api, /activityLog\.upsert/);
  assert.match(viewer, /embedPlayerUrl/);
  assert.match(viewer, /ExternalMediaEmbed/);
});

test("homepage reviews reuse the canonical external Parent Story Reel", () => {
  const reviews = source("components/Reviews.tsx");
  assert.match(reviews, /item\.embedProvider/);
  assert.match(reviews, /item\.embedUrl/);
  assert.match(reviews, /item\.embedPlayerUrl/);
  assert.match(reviews, /ExternalMediaEmbed/);
  assert.match(reviews, /thumbnailUrl/);
  assert.doesNotMatch(
    reviews,
    /featuredStory\?\.video\.videoUrl \? \(/,
  );
});
