import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADMISSIONS_SESSION, preschoolProgrammeHours, earlyStartOffer } from '../lib/website/admissionsSession.ts';
import { isIndexableLandingContent } from '../lib/website/landingIndexing.ts';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('confirmed next-session hours and offer remain programme-specific', () => {
  assert.equal(ADMISSIONS_SESSION, '2027–28');
  assert.equal(preschoolProgrammeHours.playgroup, '9:30 AM–12:30 PM');
  assert.equal(preschoolProgrammeHours.nursery, preschoolProgrammeHours.playgroup);
  assert.equal(preschoolProgrammeHours.juniorKg, '9:30 AM–1:00 PM');
  assert.equal(preschoolProgrammeHours.seniorKg, preschoolProgrammeHours.juniorKg);
  const offer = JSON.stringify(earlyStartOffer);
  for (const text of ['30% Off Annual Charges', 'Tuition Begins in March', 'Summer Camp Included', 'December 2026']) assert.ok(offer.includes(text));
  assert.doesNotMatch(offer, /₹|\bINR\b/);
});
test('managed pages only enter the sitemap with explicit indexing consent', () => {
  for (const content of [null, undefined, false, [], {}, {indexable:false}, {indexable:'true'}, {indexable:1}]) assert.equal(isIndexableLandingContent(content), false);
  assert.equal(isIndexableLandingContent({indexable:true}), true);
  const sitemap = read('app/sitemap.ts');
  assert.match(sitemap, /page.slug !== ADMISSIONS_CAMPAIGN_SLUG && isIndexableLandingContent\(page.content\)/);
  assert.match(read('app/landing/[slug]/page.tsx'), /isIndexableLandingContent\(page.content\)/);
});
test('website admissions is separate from paid campaign while sharing the existing safe form', () => {
  const page = read('app/admissions/page.tsx');
  assert.match(page, /<PageShell>/);
  assert.match(page, /<AdmissionForm/);
  assert.match(page, /<WebsiteAdmissionsOffer/);
  assert.doesNotMatch(page, /<AdmissionsCampaign/);
  assert.match(read('app/landing/[slug]/page.tsx'), /<AdmissionsCampaign landingPageId=/);
});
test('public evergreen copy has no old session or obsolete school opening time', () => {
  for (const file of ['components/growth/LandingPageExperience.tsx','components/ContactLocation.tsx','app/contact/page.tsx','lib/site.ts','lib/sanity/contentSettings.ts']) {
    assert.doesNotMatch(read(file), /2026[–-]27|8:30 AM|preschoolOpens: "08:30"/, file);
  }
});
