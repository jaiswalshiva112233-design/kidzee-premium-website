import assert from 'node:assert/strict';
import test from 'node:test';
import { getAdmissionsEnquiry, campaignPortraitUrl, admissionsCampaignFaqs, ADMISSIONS_CAMPAIGN_DESCRIPTION } from '../lib/website/admissionsCampaign.ts';

test('legacy pricing enquiry links become a contact request without publishing pricing', () => {
  assert.deepEqual(getAdmissionsEnquiry({enquiry:'fees'}), {initialProgramme:'',initialEnquiryType:'CALLBACK'});
  assert.doesNotMatch(JSON.stringify(admissionsCampaignFaqs) + ADMISSIONS_CAMPAIGN_DESCRIPTION, /₹|\bfees?\b|pricing|payable|monthly tuition/i);
});
test('daycare presets and unknown query values stay within supported programmes', () => {
  assert.deepEqual(getAdmissionsEnquiry({programme:'daycare'}), {initialProgramme:'DAYCARE',initialEnquiryType:'DAYCARE'});
  assert.deepEqual(getAdmissionsEnquiry({programme:['nursery','invalid'],enquiry:'invalid'}), {initialProgramme:'NURSERY',initialEnquiryType:'SCHOOL_VISIT'});
});
test('campaign portraits retain the approved asset while limiting delivery size', () => {
  const source='https://cdn.sanity.io/images/project/production/photo-1062x1480.png';
  const url=new URL(campaignPortraitUrl(source));
  assert.equal(url.origin + url.pathname, source);
  assert.equal(url.searchParams.get('w'), '640');
  assert.equal(url.searchParams.get('fit'), 'max');
  assert.equal(url.searchParams.get('auto'), 'format');
  for (const other of ['/images/team.jpg','https://cdn.sanity.io.example/images/team.png']) assert.equal(campaignPortraitUrl(other),other);
});

