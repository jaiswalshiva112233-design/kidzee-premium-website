import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";
register(new URL("./test-loader.mjs", import.meta.url).href);
register('data:text/javascript,' + encodeURIComponent(`export async function resolve(s,c,n){
  if(s==="next/server") return {shortCircuit:true,url:"data:text/javascript,export const NextResponse=Response;"};
  if(s==="@/lib/prisma") return {shortCircuit:true,url:"data:text/javascript,export const prisma={growthDataSnapshot:{upsert:(x)=>globalThis.snapshotTestWrite(x)}};"};
  return n(s,c);
}`));
const { POST } = await import("../app/api/internal/google-ads-snapshot/route.ts");
const secret = "synthetic-snapshot-secret-more-than-32-characters";
function setup(t) {
  const previous = { secret:process.env.GOOGLE_ADS_SNAPSHOT_SECRET, account:process.env.GOOGLE_ADS_CUSTOMER_ID };
  process.env.GOOGLE_ADS_SNAPSHOT_SECRET=secret; process.env.GOOGLE_ADS_CUSTOMER_ID="3462690519";
  const writes=[]; globalThis.snapshotTestWrite=async data=>writes.push(data);
  t.after(()=>{ for(const [key,value] of [["GOOGLE_ADS_SNAPSHOT_SECRET",previous.secret],["GOOGLE_ADS_CUSTOMER_ID",previous.account]]) value===undefined?delete process.env[key]:process.env[key]=value; delete globalThis.snapshotTestWrite; });
  return writes;
}
function payload() {
  const end=new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  const start=new Date(Date.parse(end)-30*86400000).toISOString().slice(0,10);
  return {customerId:"3462690519",currency:"INR",timeZone:"Asia/Calcutta",periodStart:start,periodEnd:end,campaigns:[]};
}
function request(data,token=secret) { return new Request("https://example.com/api/internal/google-ads-snapshot",{method:"POST",headers:{Authorization:"Bearer "+token},body:JSON.stringify(data)}); }
test("snapshot endpoint rejects missing or invalid authentication before touching the database",async t=>{
  const writes=setup(t);
  assert.equal((await POST(request(payload(),""))).status,401);
  assert.equal((await POST(request(payload(),"wrong"))).status,401);
  assert.equal(writes.length,0);
});
test("snapshot endpoint rejects another account or malformed metrics without saving",async t=>{
  const writes=setup(t);const data=payload();data.customerId="0000000000";
  assert.equal((await POST(request(data))).status,400);assert.equal(writes.length,0);
});
test("repeated daily snapshots update one key, retain the exact period and store no extra personal fields",async t=>{
  const writes=setup(t);const data=payload();data.phone="synthetic-do-not-store";
  assert.equal((await POST(request(data))).status,200);
  assert.equal((await POST(request(data))).status,200);
  assert.equal(writes[0].where.deduplicationKey,writes[1].where.deduplicationKey);
  assert.equal(writes[0].create.dimensions.provenance,"AUTOMATED_SYNC");
  assert.equal(JSON.stringify(writes[0]).includes(data.phone),false);
  assert.equal(writes[0].create.periodEnd.toISOString().slice(11),"18:30:00.000Z");
});
test("database failure is returned as failure rather than a successful sync",async t=>{
  setup(t);globalThis.snapshotTestWrite=async()=>{throw Error("synthetic-db-failure");};
  assert.equal((await POST(request(payload()))).status,500);
});
