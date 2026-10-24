import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
register(new URL("./test-loader.mjs", import.meta.url).href);
register('data:text/javascript,'+encodeURIComponent(`export async function resolve(s,c,n){if(s==="@/lib/prisma")return{shortCircuit:true,url:"data:text/javascript,export const prisma=new Proxy({},{get:(_,k)=>globalThis.dashboardTestDb[k]});"};return n(s,c);}`));
const { buildMarketingControlData }=await import("../lib/growth/marketingControl.ts");
function setup(t,stale=false){
  const now=new Date();const end=new Date(now);end.setUTCHours(0,0,0,0);
  const start=new Date(end.getTime()-30*86400000);const captures={};
  globalThis.dashboardTestDb={
    growthDataSnapshot:{findMany:async()=>[{collectedAt:new Date(now.getTime()-(stale?40*86400000:0)),periodStart:start,periodEnd:end,dimensions:{provenance:"AUTOMATED_SYNC"},metrics:{spend:100,clicks:0,impressions:0},source:"GOOGLE_ADS",dataset:"campaign-performance"}]},
    websiteLeadSubmission:{findMany:async query=>{captures.leads=query;return[{enquiryId:"synthetic",source:"GOOGLE_ADS",trafficChannel:"GOOGLE_ADS",utmCampaign:"Test",utmTerm:null,landingPage:"/",landingPageId:null,enquiry:{status:"ADMITTED",admission:{status:"CONFIRMED"},appointments:[{status:"COMPLETED"}]}}];}},
    marketingConversionJob:{groupBy:async query=>{captures.jobs=query;return[{status:"DEAD",_count:5}];}},
    landingPage:{findMany:async()=>[]},feePayment:{findMany:async query=>{captures.payments=query;return[];}}
  };
  t.after(()=>delete globalThis.dashboardTestDb);return{captures,start,end};
}
test("fresh automatic reporting aligns lead and payment dates with the campaign snapshot",async t=>{
  const {captures,start,end}=setup(t);const data=await buildMarketingControlData("GOOGLE");
  assert.equal(data.sourceStatus,"CONNECTED");
  assert.deepEqual(captures.leads.where.receivedAt,{gte:start,lt:end});
  assert.deepEqual(captures.payments.where.paymentDate,{gte:start,lt:end});
  assert.equal(data.totals.costPerAdmission,100);
  assert.equal(data.totals.clicks,0);
  assert.equal(data.conversionDelivery.DEAD,5);
  assert.ok(captures.jobs.where.OR[0].status.in.includes("DEAD"));
});
test("stale spend cannot produce a current cost-per-admission claim",async t=>{
  setup(t,true);const data=await buildMarketingControlData("GOOGLE");
  assert.equal(data.sourceStatus,"STALE");assert.equal(data.totals.costPerAdmission,0);
  assert.equal(data.totals.costPerVisit,0);
});
