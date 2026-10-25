import assert from 'node:assert/strict';
import { register } from 'node:module';
import test from 'node:test';
register(new URL('./test-loader.mjs', import.meta.url).href);
const { enqueueMarketingConversions, enqueuePendingQualifiedLeadConversions } = await import('../lib/marketing/admissionConversions.ts');
const { QUALIFIED_LEAD_STATUSES } = await import('../lib/marketing/conversionMilestones.ts');
const originalTime = new Date('2026-10-01T10:00:00Z');
function fixture(overrides={}) {
 const enquiry={id:'e1',enquiryNumber:'ENQ-SYNTHETIC-RECOVERY',status:'QUALIFIED',createdAt:new Date('2026-09-30T10:00:00Z'),qualifiedAt:originalTime,admittedAt:null,stageChangedAt:new Date('2026-10-02T10:00:00Z'),activities:[],phone:'+919000000000',websiteSubmissions:[{source:'GOOGLE_ADS',gclid:'synthetic-click-123'}],...overrides};
 const ledger=new Map();
 const db={enquiry:{findUnique:async()=>enquiry,findMany:async({skip})=>skip?[]:[enquiry]},marketingConversionJob:{findMany:async()=>[...ledger.values()].map(j=>({enquiryId:j.enquiryId,provider:j.provider})),upsert:async({where,create,update})=>{assert.deepEqual(update,{}); if(!ledger.has(where.deduplicationKey))ledger.set(where.deduplicationKey,create);return ledger.get(where.deduplicationKey)}}};
 return {enquiry,ledger,db};
}
test('worker recovers a missing qualified event with original time, and repeated recovery is idempotent',async()=>{
 const {ledger,db}=fixture();
 assert.equal(await enqueuePendingQualifiedLeadConversions(100,db),1);
 assert.equal([...ledger.values()][0].payload.conversionTime,originalTime.toISOString());
 assert.equal(await enqueuePendingQualifiedLeadConversions(100,db),0);
 assert.equal(ledger.size,1);
});
test('closing an already-qualified lead does not lose its genuine missing qualification feedback',async()=>{
 const {ledger,db}=fixture({status:'CLOSED'});
 assert.equal(await enqueuePendingQualifiedLeadConversions(100,db),1);
 assert.equal([...ledger.values()][0].payload.conversionTime,originalTime.toISOString());
});
test('legacy recovery uses the first audited qualifying milestone rather than the recovery clock',async()=>{
 const {ledger,db}=fixture({status:'CLOSED',qualifiedAt:null,activities:[{occurredAt:originalTime}]});
 await enqueueMarketingConversions('e1','QUALIFIED_LEAD',db);
 assert.equal([...ledger.values()][0].payload.conversionTime,originalTime.toISOString());
});
test('all supported qualification stages enqueue feedback with a stable fallback timestamp',async()=>{
 for(const status of QUALIFIED_LEAD_STATUSES){
  const {ledger,db,enquiry}=fixture({status,qualifiedAt:null});
  await enqueueMarketingConversions('e1','QUALIFIED_LEAD',db);
  assert.equal(ledger.size,1,status);
  assert.equal([...ledger.values()][0].payload.conversionTime,enquiry.stageChangedAt.toISOString());
 }
});
test('a never-qualified lead and denied/test-only submissions cannot generate recovered qualification feedback',async()=>{
 const never=fixture({status:'NEW',qualifiedAt:null});
 assert.deepEqual(await enqueueMarketingConversions('e1','QUALIFIED_LEAD',never.db),{eligible:false,queued:0});
 const denied=fixture({websiteSubmissions:[]});
 assert.equal(await enqueuePendingQualifiedLeadConversions(100,denied.db),0);
 assert.equal(denied.ledger.size,0);
});
test('recovery creates a missing provider job without changing an existing provider payload',async()=>{
 const {ledger,db,enquiry}=fixture();
 const key='GOOGLE_ADS:QUALIFIED_LEAD:'+enquiry.enquiryNumber;
 const existing={enquiryId:'e1',provider:'GOOGLE_ADS',payload:{conversionTime:'original-payload'}};
 ledger.set(key,existing);
 enquiry.websiteSubmissions.push({source:'META_ADS',fbclid:'synthetic-meta'});
 assert.equal(await enqueuePendingQualifiedLeadConversions(100,db),1);
 assert.equal(ledger.get(key),existing);
 assert.equal(ledger.size,2);
});
