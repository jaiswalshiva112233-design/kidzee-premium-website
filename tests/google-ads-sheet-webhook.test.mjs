import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../scripts/google-ads-sheet-webhook.gs", import.meta.url), "utf8");

function createHarness() {
  const rows = [["Google Click ID", "Conversion Name", "Conversion Time", "Conversion Value", "Conversion Currency", "Phone Number", "GBRAID", "WBRAID", "Order ID"]];
  const formats = [];
  let lockHeld = false;
  const sheet = {
    getLastRow: () => rows.length,
    getRange(row, column, height = 1, width = 1) {
      return {
        getDisplayValues: () => rows.slice(row - 1, row - 1 + height).map((item) => Array.from({length:width}, (_, i) => String(item[column - 1 + i] ?? ""))),
        setNumberFormat: (format) => formats.push({ row, column, format }),
        setValues: (values) => {
          for (let i=0;i<values.length;i++) { rows[row - 1 + i] ??= []; for(let j=0;j<values[i].length;j++) rows[row - 1 + i][column - 1 + j] = values[i][j]; }
        },
      };
    },
  };
  const secret = "synthetic-test-secret-at-least-32-characters";
  const context = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => key === "CENTREOS_WEBHOOK_SECRET" ? secret : "synthetic_conversion_sheet" }) },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => { throw new Error("No active spreadsheet in a web app"); },
      openById: (id) => { assert.equal(id, "synthetic_conversion_sheet"); return { getSheetByName: (name) => name === "Sheet1" ? sheet : null }; },
      flush: () => undefined,
    },
    LockService: {
      getScriptLock: () => ({
        waitLock: () => { assert.equal(lockHeld, false); lockHeld = true; },
        releaseLock: () => { assert.equal(lockHeld, true); lockHeld = false; },
      }),
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (value) => ({
        setMimeType: () => ({ getContent: () => value }),
      }),
    },
  };
  vm.createContext(context);
  vm.runInContext(source, context);
  const post = (data) => JSON.parse(context.doPost({ postData: { contents: JSON.stringify({ secret, ...data }) } }).getContent());
  return { rows, formats, post, context };
}

test("normalizes the early-hour IST timestamp as unambiguous ISO text", () => {
  const { rows, formats, post } = createHarness();
  assert.deepEqual(post({
    conversionName: "Qualified lead",
    conversionTime: "2026-09-22 1:23:49",
    phone: "+918178358227",
    conversionValue: 1,
    conversionCurrency: "INR",
  }), { status: "success", schemaVersion: 2 });
  assert.equal(rows[1][2], "2026-09-22T01:23:49+05:30");
  assert.equal(rows[1][5], "+918178358227");
  assert.deepEqual(formats.map(({ column, format }) => [column, format]), [[1, "@"], [3, "@"], [6, "@"], [7, "@"], [8, "@"], [9, "@"]]);
});

test("retries do not append an identical conversion twice", () => {
  const { rows, post } = createHarness();
  const event = {
    conversionName: "Submit lead form Website",
    conversionTime: "2026-09-22T10:00:00+05:30",
    gclid: "CjwKCA1234567890",
    phone: "+918178358227",
  };
  assert.equal(post(event).status, "success");
  assert.deepEqual(post(event), { status: "success", duplicate: true, schemaVersion: 2 });
  assert.equal(rows.length, 2);
});

test("invalid names and missing identifiers cannot enter the conversion sheet", () => {
  const { rows, post } = createHarness();
  assert.equal(post({ conversionName: "Unknown", conversionTime: "2026-09-22 10:00:00", phone: "+918178358227" }).status, "error");
  assert.equal(post({ conversionName: "Admissions", conversionTime: "2026-09-22 10:00:00" }).status, "error");
  assert.equal(rows.length, 1);
});


test("unauthenticated requests cannot append forged conversion rows", () => {
  const { rows, post } = createHarness();
  const valid = { conversionName: "Qualified lead", conversionTime: "2026-10-24T10:00:00+05:30", gclid: "synthetic_click_id" };
  assert.equal(post({ ...valid, secret: "" }).status, "error");
  assert.equal(post({ ...valid, secret: "wrong-token-but-the-same-length-as-the-real-one" }).status, "error");
  assert.equal(rows.length, 1);
});


test("authenticated health checks work without an active spreadsheet and never append rows", () => {
  const { rows, formats, post } = createHarness();
  assert.deepEqual(post({ action: "health" }), { status: "success", healthy: true, schemaVersion: 2 });
  assert.equal(rows.length, 1);
  assert.equal(formats.length, 0);
  assert.equal(post({ action: "health", secret: "" }).status, "error");
});

test("health checks reject a missing spreadsheet configuration", () => {
  const { post, context } = createHarness();
  const secret = context.PropertiesService.getScriptProperties().getProperty("CENTREOS_WEBHOOK_SECRET");
  context.PropertiesService.getScriptProperties = () => ({ getProperty: key => key === "CENTREOS_WEBHOOK_SECRET" ? secret : "" });
  assert.deepEqual(post({ action: "health" }), { status: "error", message: "Error: Conversion spreadsheet is not configured" });
});

test("a changed column mapping blocks health confirmation and lead writes", () => {
  const { rows, post } = createHarness();
  rows[0][1] = "Unexpected column";
  assert.equal(post({ action: "health" }).status, "error");
  assert.equal(post({ conversionName: "Qualified lead", conversionTime: "2026-10-24T10:00:00+05:30", gclid: "synthetic_click_id" }).status, "error");
  assert.equal(rows.length, 1);
});


test("braid-only events retain case and stable IDs; retries cannot append them twice", () => {
 const { rows, post } = createHarness();
 const event = {schemaVersion:2, conversionName:"Qualified lead",conversionTime:"2026-10-24T10:00:00+05:30",gbraid:"Synthetic_Braid_123",wbraid:"Synthetic_WBraid_456",orderId:"qualified-lead-ENQ-SYNTHETIC"};
 assert.equal(post(event).status,"success");
 assert.deepEqual(rows[1].slice(6),[event.gbraid,event.wbraid,event.orderId]);
 assert.equal(post({...event,conversionTime:"2026-10-24T10:01:00+05:30"}).duplicate,true);
 assert.equal(rows.length,2);
});
test("column upgrade preserves existing records and is safe to run twice", () => {
 const {rows,context}=createHarness(); rows[0]=rows[0].slice(0,6);rows.push(["legacy_click","Admissions","original_time",1,"INR","+919000000000"]);
 const original=JSON.stringify(rows[1]); context.upgradeConversionColumns(); context.upgradeConversionColumns();
 assert.equal(JSON.stringify(rows[1]),original);assert.equal(rows[0].length,9);
 assert.equal(rows[0][0],"Google Click ID");assert.equal(rows[0][6],"GBRAID");
});
test("unexpected extra headers stop migration rather than overwriting existing columns", () => {
 const {rows,context}=createHarness(); rows[0][6]="Unrelated data";
 assert.throws(()=>context.upgradeConversionColumns(), /Unexpected extra columns/);assert.equal(rows[0][6],"Unrelated data");
});
