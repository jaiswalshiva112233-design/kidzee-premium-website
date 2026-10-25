import assert from "node:assert/strict";
import test from "node:test";
import { evaluateConsentState, googleAdsLeadPayload, googleAdsPageConfig, configureGoogleConsentMode } from "../lib/marketing/consent.ts";
const settings={ advertisingEnabled:true,googleAdsId:"AW-123456",googleAdsConversionLabel:"synthetic",googleAdsAdvancedConsentMode:true,googleTagManagerId:"",analyticsEnabled:true,googleAnalyticsId:"G-ABC123",metaPixelEnabled:true,metaPixelId:"123456" };
const denied={analytics:false,marketing:false};
test("consent denied loads only the direct Google Ads cookieless path, without GA4 or Meta",()=>{
  for(const consent of [null,denied]){
    const state=evaluateConsentState({settings,consent,pathname:"/admissions"});
    assert.equal(state.loadedGoogleAds,true);assert.equal(state.loadedDirectGa4,false);assert.equal(state.loadedMetaPixel,false);
    assert.equal(state.consentMode.ad_storage,"denied");assert.equal(state.consentMode.ad_user_data,"denied");
    assert.equal(state.canEmitGoogleAdsConversion,true);
  }
});
test("consent-denied conversion excludes enquiry and click identifiers from its payload and URLs",()=>{
  const payload=googleAdsLeadPayload({settings,consent:denied,enquiryNumber:"ENQ-PRIVATE",pageUrl:"https://example.com/admissions?gclid=PRIVATE_CLICK&email=private@example.com#private",referrer:"https://google.com/search?q=private"});
  assert.deepEqual(payload,{send_to:"AW-123456/synthetic",value:1,currency:"INR",page_location:"https://example.com/admissions",page_referrer:"https://google.com/search"});
  assert.equal(JSON.stringify(payload).includes("PRIVATE"),false);
  assert.equal(googleAdsPageConfig(denied,"https://example.com/?gclid=private","").allow_ad_personalization_signals,false);
});
test("default denied and redaction precede grant updates, and withdrawal sends denied again",()=>{
  const commands=[];const tag=(...args)=>commands.push(args);
  configureGoogleConsentMode(tag,{analytics:true,marketing:true});
  assert.equal(commands[0][1],"default");assert.equal(commands[0][2].ad_user_data,"denied");
  assert.deepEqual(commands[1],["set","ads_data_redaction",true]);
  assert.deepEqual(commands[2],["set","url_passthrough",false]);
  assert.equal(commands[3][2].ad_user_data,"granted");
  configureGoogleConsentMode(tag,denied,true);
  assert.equal(commands.at(-1)[2].ad_user_data,"denied");
  assert.equal(commands.filter(c=>c[1]==="default").length,1);
});
test("admin, staff, disabled integrations and unreviewed GTM containers cannot use the denied path",()=>{
  for(const args of [{settings,pathname:"/admin"},{settings,pathname:"/api/test"},{settings,pathname:"/",staffExcluded:true},{settings:{...settings,advertisingEnabled:false},pathname:"/"},{settings:{...settings,googleTagManagerId:"GTM-ABC123"},pathname:"/"}]) {
    assert.equal(evaluateConsentState({...args,consent:denied}).canEmitGoogleAdsConversion,false);
  }
  assert.equal(evaluateConsentState({settings:{...settings,googleAdsAdvancedConsentMode:false},consent:denied,pathname:"/"}).loadedGoogleAds,false);
});
test("granted conversions retain deduplication while malformed or admin-page events are rejected",()=>{
  const input={settings,consent:{analytics:true,marketing:true},enquiryNumber:"ENQ-SYNTHETIC",pageUrl:"https://example.com/admissions",referrer:""};
  assert.equal(googleAdsLeadPayload(input).transaction_id,"ENQ-SYNTHETIC");
  assert.equal(googleAdsLeadPayload({...input,enquiryNumber:""}),null);
  assert.equal(googleAdsLeadPayload({...input,pageUrl:"https://example.com/admin"}),null);
});
