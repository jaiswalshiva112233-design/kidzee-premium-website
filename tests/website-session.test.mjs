import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ADMISSIONS_SESSION, preschoolProgrammeHours, earlyStartOffer } from '../lib/website/admissionsSession.ts';
import { isIndexableLandingContent } from '../lib/website/landingIndexing.ts';
import { conciseMetaDescription } from '../lib/website/metaDescription.ts';
const read = path => readFileSync(new URL('../' + path, import.meta.url), 'utf8');

test('gallery search summaries end on readable words and preserve short descriptions', () => {
  assert.equal(conciseMetaDescription('  A short\n description. '), 'A short description.');
  assert.equal(conciseMetaDescription('Our children celebrate a joyful morning', 25), 'Our children celebrate a…');
  assert.ok(conciseMetaDescription('a'.repeat(300)).length<=155);
});

test('confirmed next-session hours and offer remain programme-specific', () => {
  assert.equal(ADMISSIONS_SESSION, '2027–28');
  assert.equal(preschoolProgrammeHours.playgroup, '9:30 AM–12:30 PM');
  assert.equal(preschoolProgrammeHours.nursery, preschoolProgrammeHours.playgroup);
  assert.equal(preschoolProgrammeHours.juniorKg, '9:30 AM–1:00 PM');
  assert.equal(preschoolProgrammeHours.seniorKg, preschoolProgrammeHours.juniorKg);
  const offer = JSON.stringify(earlyStartOffer);
  for (const text of ['30% Off Annual Charges', 'Tuition begins in March', 'limited number', 'Summer Camp Included']) assert.ok(offer.includes(text));
  assert.equal(earlyStartOffer.disclaimer, 'Terms and conditions apply.');
  assert.doesNotMatch(offer, /₹|\bINR\b/);
  for (const file of ['lib/website/admissionsSession.ts','lib/website/admissionsCampaign.ts','components/admissions/AdmissionsCampaign.tsx','components/admissions/WebsiteAdmissionsOffer.tsx']) {
    assert.doesNotMatch(read(file), /instal+ment|(?:collect|payable|due|payment).{0,70}(?:enrol+l?ment|at admission)/i, file);
  }
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
