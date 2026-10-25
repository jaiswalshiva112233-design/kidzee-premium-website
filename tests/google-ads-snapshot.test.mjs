import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { normalizeGoogleAdsSnapshot } from "../lib/marketing/googleAdsSnapshot.ts";
const now = new Date("2026-10-24T10:00:00Z");
const base = () => ({ customerId: "3462690519", currency: "INR", timeZone: "Asia/Calcutta", periodStart: "2026-09-24", periodEnd: "2026-10-24", campaigns: [
  { id: "1", budgetId: "10", name: "First", status: "PAUSED", costMicros: 6092070000, budgetMicros: 500000000, clicks: 203, impressions: 2105, conversions: 0, allConversions: 211 },
  { id: "2", budgetId: "10", name: "Shared", status: "ENABLED", costMicros: 0, budgetMicros: 500000000, clicks: 0, impressions: 0, conversions: 0, allConversions: 0 }
] });

test("daily snapshot converts micros exactly once and does not count shared budgets twice", () => {
  const result = normalizeGoogleAdsSnapshot(base(), "3462690519", now);
  assert.equal(result.metrics.spend, 6092.07);
  assert.equal(result.metrics.budget, 500);
  assert.equal(result.metrics.conversions, 0);
  assert.equal(result.metrics.allConversions, 211);
  assert.equal(result.periodStart.toISOString(), "2026-09-23T18:30:00.000Z");
  assert.equal(result.periodEnd.toISOString(), "2026-10-23T18:30:00.000Z");
});

test("rejects wrong accounts, currencies, dates, negative spend, unsafe integers and duplicate campaigns", () => {
  for (const mutate of [
    b=>b.customerId="0000000000", b=>b.currency="USD", b=>b.periodEnd="2026-10-23", b=>b.periodStart="2026-09-23",
    b=>b.campaigns[0].costMicros=-1, b=>b.campaigns[0].costMicros=Infinity,
    b=>b.campaigns[0].costMicros=Number.MAX_SAFE_INTEGER+1, b=>b.campaigns.push(b.campaigns[0])
  ]) { const value=base(); mutate(value); assert.throws(()=>normalizeGoogleAdsSnapshot(value, "3462690519", now)); }
});

test("zero-traffic accounts remain valid and cannot acquire invented sample metrics", () => {
  const value = base(); value.campaigns = [];
  const { metrics } = normalizeGoogleAdsSnapshot(value, "3462690519", now);
  assert.equal(metrics.spend, 0); assert.equal(metrics.clicks, 0); assert.equal(metrics.budget, 0);
});

const source = readFileSync(new URL("../scripts/google-ads-centreos-sync.gs", import.meta.url), "utf8");
function script(preview = false, zeroTraffic = false) {
  const requests = [];
  const row = { campaign: { id: "1", name: "Synthetic", status: "PAUSED" }, campaignBudget: { id: "10", amountMicros: 500000000 }, metrics: { costMicros: 1000000, clicks: 2, impressions: 10, conversions: 0, allConversions: 3 } };
  const context = {
    AdsApp: { currentAccount: () => ({ getCustomerId:()=>"346-269-0519", getCurrencyCode:()=>"INR", getTimeZone:()=>"Asia/Calcutta" }), getExecutionInfo:()=>({isPreview:()=>preview}), search:(query)=>{ const entries=query.includes("metrics.cost_micros") ? [row] : [row,...(zeroTraffic ? [{campaign:{id:"2",name:"No activity",status:"PAUSED"},campaignBudget:{id:"20",amountMicros:400000000}}] : [])]; let index=0; return {hasNext:()=>index<entries.length,next:()=>entries[index++]}; } },
    Utilities: { formatDate:()=>"2026-10-24" }, Logger: { log:()=>{} },
    UrlFetchApp: { fetch: (url,options)=>{requests.push({url,options});return {getResponseCode:()=>200,getContentText:()=>'{"success":true}'};} }
  };
  vm.createContext(context); vm.runInContext(source,context);
  context.CENTREOS_SYNC.secret="synthetic-token-longer-than-32-characters";
  return { context, requests };
}

test("Ads script preview transmits nothing; a run sends reporting totals and fails on a rejected snapshot", () => {
  const preview=script(true); preview.context.main(); assert.equal(preview.requests.length,0);
  const run=script(); run.context.main();
  const payload=JSON.parse(run.requests[0].options.payload);
  assert.equal(payload.periodStart,"2026-09-24"); assert.equal(payload.periodEnd,"2026-10-24");
  assert.equal(payload.campaigns[0].costMicros,1000000);
  assert.equal(payload.campaigns[0].status,"PAUSED");
  assert.equal(Object.hasOwn(payload,"phone"),false);
  run.context.UrlFetchApp.fetch=()=>({getResponseCode:()=>401});
  assert.throws(()=>run.context.main());
});


test("reporting includes zero-activity campaign identities and their configured budgets", () => {
  const run = script(false, true); run.context.main();
  const payload = JSON.parse(run.requests[0].options.payload);
  assert.equal(payload.campaigns.length, 2);
  assert.deepEqual(payload.campaigns[1], { id: "2", name: "No activity", status: "PAUSED", budgetId: "20", budgetMicros: 400000000, costMicros: 0, clicks: 0, impressions: 0, conversions: 0, allConversions: 0 });
});

test("missing campaign metadata cannot silently remove reported spend", () => {
  const run = script();
  const search = run.context.AdsApp.search;
  run.context.AdsApp.search = query => query.includes("metrics.cost_micros") ? search(query) : {hasNext:()=>false};
  assert.throws(() => run.context.main(), /metadata is incomplete/);
  assert.equal(run.requests.length, 0);
});

test("an account with no period activity still reports its stored campaign identities", () => {
  const run = script(false, true);
  const search = run.context.AdsApp.search;
  run.context.AdsApp.search = query => query.includes("metrics.cost_micros") ? {hasNext:()=>false} : search(query);
  run.context.main();
  const payload = JSON.parse(run.requests[0].options.payload);
  assert.equal(payload.campaigns.length, 2);
  assert.equal(payload.campaigns.reduce((sum,row)=>sum+row.costMicros,0), 0);
});

test("campaign identities are queried without a reporting-date filter", () => {
  const run = script(); const queries = [];
  const search = run.context.AdsApp.search;
  run.context.AdsApp.search = query => { queries.push(query); return search(query); };
  run.context.main();
  assert.equal(queries.length, 2);
  assert.match(queries[0], /LAST_30_DAYS/);
  assert.doesNotMatch(queries[1], /segments.date|metrics\./);
});
