import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { getAdmissionsEnquiry, campaignPortraitUrl, admissionsCampaignFaqs, ADMISSIONS_CAMPAIGN_DESCRIPTION } from '../lib/website/admissionsCampaign.ts';
import { getCampaignParentReviews, PARENT_REVIEW_ALBUM_SLUG } from '../lib/website/parentReviews.ts';

test('legacy pricing enquiry links become a contact request without publishing pricing', () => {
  assert.deepEqual(getAdmissionsEnquiry({enquiry:'fees'}), {initialProgramme:'',initialEnquiryType:'CALLBACK'});
  assert.doesNotMatch(JSON.stringify(admissionsCampaignFaqs) + ADMISSIONS_CAMPAIGN_DESCRIPTION, /₹|\bfees?\b|pricing|payable|monthly tuition/i);
});

test('campaign proof and map do not alter shared tracking or invent media sources', () => {
  const read = file => readFileSync(new URL('../components/admissions/' + file, import.meta.url), 'utf8');
  const video = read('CampaignParentVideo.tsx');
  const map = read('CampaignMap.tsx');
  const campaign = read('AdmissionsCampaign.tsx');
  assert.match(video, /ReviewPlayer key=\{active.id\}/);
  assert.match(video, /review.poster/);
  assert.match(video, /controls playsInline preload="none"/);
  assert.doesNotMatch(video + map, /gtag\(|fbq\(|FORM_SUBMITTED|WHATSAPP_CLICK|fetch\(/);
  assert.match(map, /opened \? <iframe/);
  assert.match(campaign, /embedUrl=\{site\.mapEmbed\} directionsUrl=\{site\.map\}/);
  assert.match(campaign, /import AdmissionForm from "@\/components\/AdmissionForm"/);
});

test('landing reviews follow the published album, not hardcoded media or private gallery items', () => {
  const page = readFileSync(new URL('../app/landing/[slug]/page.tsx', import.meta.url), 'utf8');
  const gallery = readFileSync(new URL('../lib/sanity/gallery.ts', import.meta.url), 'utf8');
  const admin = readFileSync(new URL('../app/api/admin/gallery/route.ts', import.meta.url), 'utf8');
  assert.equal(PARENT_REVIEW_ALBUM_SLUG, 'parent-reviews-testimonials');
  assert.match(page, /getPublishedGalleryAlbumBySlug\(PARENT_REVIEW_ALBUM_SLUG\)/);
  assert.match(page, /getCampaignParentReviews\(reviewAlbum\?\.media\)/);
  assert.match(gallery.slice(gallery.indexOf('export async function getPublishedGalleryAlbumBySlug')), /albumId == \^\._id &&\s+published == true/);
  assert.match(admin, /revalidatePath\("\/landing\/preschool-admissions-dwarka-sector-12"\)/);
});

const review = (id, overrides = {}) => ({ _id:id, mediaType:'VIDEO', imageUrl:'https://cdn.sanity.io/images/project/production/review.jpg', thumbnailUrl:null, videoUrl:null, embedUrl:'https://www.instagram.com/reel/Db78s7ehDRu/', embedProvider:'INSTAGRAM', ...overrides });
test('review selection retains both parents and automatically includes later published videos', () => {
  const media = [review('first'), review('second', {embedUrl:'https://www.instagram.com/reel/DYg8ahfhUuq/'}), review('third', {videoUrl:'/videos/new-parent.mp4'})];
  const result = getCampaignParentReviews(media);
  assert.deepEqual(result.map(r=>r.id), ['first','second','third']);
  assert.equal(result[0].source,'https://www.instagram.com/reel/Db78s7ehDRu/embed/');
  assert.equal(result[2].provider,'VIDEO');
  assert.ok(result.every(r=>r.poster && r.thumbnail));
  assert.deepEqual(getCampaignParentReviews([]), []);
  assert.deepEqual(getCampaignParentReviews(), []);
});
test('reviews reject missing thumbnails, photos, unsupported sources and duplicates', () => {
  const media = [review('valid'), review('duplicate', {embedUrl:'https://www.instagram.com/reel/Db78s7ehDRu/?utm_source=test'}), review('photo',{mediaType:'PHOTO'}), review('blank',{imageUrl:null}), review('unsafe',{embedUrl:'javascript:alert(1)'}), review('wrong-host',{embedUrl:'https://www.instagram.com.evil.test/reel/DYg8ahfhUuq/'}), review('bad-poster',{imageUrl:'https://evil.test/image.jpg'}), review('bad-video',{videoUrl:'javascript:alert(1)',embedUrl:null})];
  assert.deepEqual(getCampaignParentReviews(media).map(r=>r.id), ['valid']);
});
test('uploaded videos and YouTube are supported without trusting stored iframe markup', () => {
  const result = getCampaignParentReviews([review('youtube',{embedProvider:'YOUTUBE',embedUrl:'https://youtu.be/abcdefghijk',embedPlayerUrl:'https://evil.test/'}),review('upload',{videoUrl:'https://cdn.sanity.io/files/project/production/review.mp4'})]);
  assert.equal(result[0].source,'https://www.youtube-nocookie.com/embed/abcdefghijk');
  assert.equal(result[1].provider,'VIDEO');
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

