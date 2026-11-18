import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");

test("only Playgroup uses the young-group adult-child ratio", () => {
  const page = source("app/programmes/[slug]/page.tsx");
  assert.match(page, /const ratio =\s*programme\.slug === "playgroup"\s*\? `1:\$\{ratioSettings\.youngGroupChildrenPerTeacher\} adult-child ratio`\s*:\s*`1:\$\{ratioSettings\.kindergartenChildrenPerTeacher\} adult-child ratio`/);
  const settings = source("lib/sanity/programmeSettings.ts");
  assert.match(settings, /youngGroupChildrenPerTeacher: 8/);
  assert.match(settings, /kindergartenChildrenPerTeacher: 10/);
});

test("homepage and programme FAQ put Nursery with LKG and UKG", () => {
  const trust = source("components/TrustBar.tsx");
  const faq = source("components/ProgrammeFAQ.tsx");
  assert.match(trust, /Adult-child ratios/);
  assert.match(trust, /in Playgroup; 1:/);
  assert.match(trust, /in Nursery, Junior KG \(LKG\) and Senior KG \(UKG\)/);
  assert.match(faq, /What is the adult-child ratio/);
  assert.match(faq, /for Playgroup, and 1:/);
  assert.match(faq, /for Nursery, Junior KG \(LKG\) and Senior KG \(UKG\)/);
});

test("admissions and managed landing templates use programme-specific adult ratios", () => {
  const campaign = source("components/admissions/AdmissionsCampaign.tsx");
  const managed = source("components/growth/LandingPageExperience.tsx");
  assert.match(campaign, /Adult-child ratio: Playgroup 1:8 · Nursery to UKG 1:10/);
  assert.match(managed, /adult-child ratio is 1:8 for Playgroup and 1:10 for Nursery/);
  for (const text of [campaign, managed]) {
    assert.doesNotMatch(text, /(?:teacher[-– ](?:child|student)|student[-– ]teacher) ratio/i);
    assert.doesNotMatch(text, /1:8[^\n]{0,30}Playgroup\s*(?:&(?:amp;)?|and|\/)\s*Nursery/i);
  }
  assert.match(campaign, /isDaycare \? "After-preschool, selected-day & occasional care"/);
});

test("website ratio manager keeps saved keys compatible but labels the new groups", () => {
  const manager = source("components/admin/ProgrammeRatioManager.tsx");
  assert.match(manager, /One supervising adult : children/);
  assert.match(manager, /Nursery, Junior KG \(LKG\) and Senior KG \(UKG\)/);
  assert.doesNotMatch(manager, /Playgroup and Nursery|Teacher-child/);
  assert.match(manager, /youngGroupChildrenPerTeacher/);
  assert.match(manager, /kindergartenChildrenPerTeacher/);
});
