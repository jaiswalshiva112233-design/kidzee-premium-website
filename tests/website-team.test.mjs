import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const route = source("app/api/admin/website-team/route.ts");
const page = source("app/admin/website/team/page.tsx");
const manager = source("components/admin/WebsiteTeamManager.tsx");
const teamData = source("lib/sanity/team.ts");
const home = source("app/page.tsx");
const preview = source("components/HomeTeamPreview.tsx");
const carousel = source("components/HomeTeamCarousel.tsx");
const aboutTeam = source("components/Team.tsx");
const permissions = source("lib/admin/permissions.ts");
const globals = source("app/globals.css");

test("website team manager and API enforce a nine-profile limit", () => {
  assert.match(route, /const MAX_TEAM_MEMBERS = 9/);
  assert.match(route, /profileCount >= MAX_TEAM_MEMBERS/);
  assert.match(route, /already has 9 profiles/);
  assert.match(manager, /const MAX_TEAM_PROFILES = 9/);
  assert.match(manager, /\$\{members\.length\} of \$\{MAX_TEAM_PROFILES\}/);
  assert.match(manager, /9 of 9 profiles added/);
  assert.match(manager, /disabled=\{saving \|\| \(!form\.id && atProfileLimit\)\}/);
});

test("website team page and upload API require website.manage", () => {
  assert.match(page, /hasAdminPermission\("website\.manage"\)/);
  assert.match(route, /session\.permissions\.includes\("website\.manage"\)/);
  assert.match(route, /hasAllowedOrigin\(request\)/);
  assert.match(permissions, /path: "\/admin\/website"[\s\S]*permission: "website\.manage"/);
  assert.match(permissions, /path: "\/api\/admin\/website-team"[\s\S]*permission: "website\.manage"/);
});

test("website team portraits use the existing Sanity website-media storage path", () => {
  assert.match(route, /sanityServerClient\.assets\.upload/);
  assert.match(route, /uploadedAsset\?\._id/);
  assert.match(route, /_ref: assetId/);
  assert.doesNotMatch(route, /pathPrefix: "public\/website\/team"/);
  assert.doesNotMatch(route, /storePublicGalleryImage/);
});

test("public team query exposes only approved public profile fields", () => {
  for (const field of [
    "name",
    "role",
    "programme",
    "qualification",
    "experience",
    "introduction",
    "photoAlt",
    "imageUrl",
    "featured",
    "sortOrder",
  ]) {
    assert.match(teamData, new RegExp(`\\b${field}\\b`));
  }

  assert.match(teamData, /published == true/);
  assert.doesNotMatch(
    teamData,
    /phone|salary|aadhaar|panNumber|payroll|attendance|internalNotes|emergencyContact/i,
  );
});

test("homepage receives up to nine featured profiles and applies managed movement speed", () => {
  assert.match(home, /getFeaturedWebsiteTeamMembers\(9\)/);
  assert.match(home, /getWebsiteTeamSettings\(\)/);
  assert.match(teamData, /MAX_WEBSITE_TEAM_PROFILES = 9/);
  assert.match(teamData, /Math\.min\(limit, MAX_WEBSITE_TEAM_PROFILES\)/);
  assert.match(preview, /movementSpeed=\{movementSpeed\}/);
  assert.match(carousel, /const DESKTOP_PAGE_SIZE = 3/);
  assert.match(carousel, /members\.length > DESKTOP_PAGE_SIZE/);
});

test("one to three homepage profiles remain static", () => {
  assert.match(carousel, /if \(!moving\)/);
  assert.match(carousel, /members\.length === 1/);
  assert.match(carousel, /members\.length === 2/);
  assert.match(carousel, /lg:grid-cols-3/);
});

test("four to nine profiles use a seamless one-direction marquee on desktop and mobile", () => {
  assert.match(carousel, /repeatedMembers = \[\.\.\.members, \.\.\.members\]/);
  assert.match(carousel, /team-marquee-track/);
  assert.match(carousel, /speedDurations\[movementSpeed\]/);
  assert.match(globals, /animation: team-marquee/);
  assert.match(globals, /translate3d/);
});

test("team motion speed is owner managed in Sanity and respects reduced motion", () => {
  assert.match(route, /action === "setMovementSpeed"/);
  assert.match(route, /_id: "websiteTeamSettings"/);
  assert.match(manager, /Staff photo movement speed/);
  assert.match(manager, /\["SLOW", "NORMAL", "FAST"\]/);
  assert.match(teamData, /movementSpeed/);
  assert.match(globals, /prefers-reduced-motion: reduce/);
  assert.match(globals, /\.team-marquee-track[\s\S]*animation: none !important/);
});

test("About page supports all nine published profiles with stable portrait crops and fallback", () => {
  assert.match(aboutTeam, /members\.map/);
  assert.doesNotMatch(aboutTeam, /members\.slice/);
  assert.match(aboutTeam, /lg:grid-cols-3/);
  assert.match(aboutTeam, /aspect-\[4\/5\]/);
  assert.match(aboutTeam, /object-cover/);
  assert.match(aboutTeam, /Photo coming soon/);
  assert.match(carousel, /Photo coming soon/);
});
