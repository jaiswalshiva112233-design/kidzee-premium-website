import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = readFileSync(new URL("../scripts/google-ads-sheet-webhook.gs", import.meta.url), "utf8");

function createHarness() {
  const rows = [["Google Click ID", "Conversion Name", "Conversion Time", "Conversion Value", "Conversion Currency", "Phone Number"]];
  const formats = [];
  let lockHeld = false;
  const sheet = {
    getLastRow: () => rows.length,
    getRange(row, column, height = 1, width = 1) {
      return {
        getDisplayValues: () => rows.slice(row - 1, row - 1 + height).map((item) => item.slice(column - 1, column - 1 + width).map(String)),
        setNumberFormat: (format) => formats.push({ row, column, format }),
        setValues: (values) => {
          for (const value of values) rows[row - 1] = value;
        },
      };
    },
  };
  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ getSheetByName: (name) => name === "Sheet1" ? sheet : null }),
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
  const post = (data) => JSON.parse(context.doPost({ postData: { contents: JSON.stringify(data) } }).getContent());
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
  }), { status: "success" });
  assert.equal(rows[1][2], "2026-09-22T01:23:49+05:30");
  assert.equal(rows[1][5], "+918178358227");
  assert.deepEqual(formats.map(({ column, format }) => [column, format]), [[1, "@"], [3, "@"], [6, "@"]]);
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
  assert.deepEqual(post(event), { status: "success", duplicate: true });
  assert.equal(rows.length, 2);
});

test("invalid names and missing identifiers cannot enter the conversion sheet", () => {
  const { rows, post } = createHarness();
  assert.equal(post({ conversionName: "Unknown", conversionTime: "2026-09-22 10:00:00", phone: "+918178358227" }).status, "error");
  assert.equal(post({ conversionName: "Admissions", conversionTime: "2026-09-22 10:00:00" }).status, "error");
  assert.equal(rows.length, 1);
});
