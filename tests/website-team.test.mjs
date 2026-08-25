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
  assert.match(route, /hasAdminPermission\("website\.manage"\)/);
  assert.match(route, /hasAllowedOrigin\(request\)/);
  assert.match(permissions, /path: "\/admin\/website"[\s\S]*permission: "website\.manage"/);
  assert.match(permissions, /path: "\/api\/admin\/website-team"[\s\S]*permission: "website\.manage"/);
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

test("homepage receives up to nine featured profiles and shows at most three at once", () => {
  assert.match(home, /getFeaturedWebsiteTeamMembers\(9\)/);
  assert.match(teamData, /MAX_WEBSITE_TEAM_PROFILES = 9/);
  assert.match(teamData, /Math\.min\(limit, MAX_WEBSITE_TEAM_PROFILES\)/);
  assert.match(preview, /<HomeTeamCarousel members=\{members\}/);
  assert.match(carousel, /const DESKTOP_PAGE_SIZE = 3/);
  assert.match(carousel, /members\.length > DESKTOP_PAGE_SIZE/);
});

test("one to three homepage profiles remain static", () => {
  assert.match(carousel, /if \(!moving\)/);
  assert.match(carousel, /members\.length === 1/);
  assert.match(carousel, /members\.length === 2/);
  assert.match(carousel, /lg:grid-cols-3/);
});

test("four to nine profiles use a slow one-direction desktop carousel and manual mobile swipe", () => {
  assert.match(carousel, /const AUTOPLAY_DELAY_MS = 6200/);
  assert.match(carousel, /setPageIndex\(\(current\) => current \+ 1\)/);
  assert.match(carousel, /duration-\[900ms\]/);
  assert.match(carousel, /snap-x snap-mandatory/);
  assert.match(carousel, /lg:hidden/);
  assert.match(carousel, /hidden lg:block/);
  assert.match(carousel, /Show the next team profiles/);
});

test("team motion pauses for interaction and respects reduced motion", () => {
  assert.match(carousel, /prefers-reduced-motion: reduce/);
  assert.match(carousel, /paused \|\| reducedMotion/);
  assert.match(carousel, /onMouseEnter=\{\(\) => setPaused\(true\)\}/);
  assert.match(carousel, /onFocusCapture=\{\(\) => setPaused\(true\)\}/);
  assert.match(carousel, /motion-reduce:transition-none/);
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
