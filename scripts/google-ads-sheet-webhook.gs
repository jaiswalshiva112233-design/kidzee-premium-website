// Existing CentreOS Auto Lead Sync web app. Keep Sheet1 and its first six mappings.
var CONVERSION_SHEET_NAME = "Sheet1";
var CONVERSION_NAMES = ["Submit lead form Website", "Qualified lead", "Admissions"];
var CONVERSION_HEADERS = ["Google Click ID", "Conversion Name", "Conversion Time", "Conversion Value", "Conversion Currency", "Phone Number", "GBRAID", "WBRAID", "Order ID"];

function getConversionSheet(requireExtended) {
  var spreadsheetId = PropertiesService.getScriptProperties().getProperty("CENTREOS_CONVERSION_SPREADSHEET_ID") || "";
  if (!spreadsheetId) throw new Error("Conversion spreadsheet is not configured");
  var sheet = SpreadsheetApp.openById(spreadsheetId).getSheetByName(CONVERSION_SHEET_NAME);
  if (!sheet) throw new Error("Conversion sheet not found");
  var width = requireExtended === false ? 6 : CONVERSION_HEADERS.length;
  var headers = sheet.getRange(1, 1, 1, width).getDisplayValues()[0];
  for (var i = 0; i < width; i++) {
    if (String(headers[i] || "").trim() !== CONVERSION_HEADERS[i]) throw new Error("Conversion sheet columns do not match expected mapping");
  }
  return sheet;
}

// Owner-run schema upgrade; does not change existing lead rows or consent settings.
function upgradeConversionColumns() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getConversionSheet(false);
    var existing = sheet.getRange(1, 7, 1, 3).getDisplayValues()[0];
    for (var i = 0; i < existing.length; i++) {
      if (existing[i] && existing[i] !== CONVERSION_HEADERS[i + 6]) throw new Error("Unexpected extra columns; inspect before migration");
    }
    sheet.getRange(1, 7, 1, 3).setValues([CONVERSION_HEADERS.slice(6)]);
    SpreadsheetApp.flush();
    getConversionSheet();
  } finally { lock.releaseLock(); }
}

function conversionTimeWithOffset(value) {
  var match = /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2}):(\d{2})(?:\+05:30)?$/.exec(String(value || "").trim());
  if (!match || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59) throw new Error("Invalid conversion time");
  return match[1] + "T" + match[2].padStart(2, "0") + ":" + match[3] + ":" + match[4] + "+05:30";
}
function jsonResult(payload) { return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON); }
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var expected = PropertiesService.getScriptProperties().getProperty("CENTREOS_WEBHOOK_SECRET") || "";
    var supplied = typeof data.secret === "string" ? data.secret : "";
    if (expected.length < 32 || supplied.length !== expected.length) throw new Error("Unauthorized");
    var difference = 0;
    for (var i = 0; i < expected.length; i++) difference |= expected.charCodeAt(i) ^ supplied.charCodeAt(i);
    if (difference !== 0) throw new Error("Unauthorized");
    if (data.action === "health") {
      getConversionSheet();
      return jsonResult({ status: "success", healthy: true, schemaVersion: 2 });
    }
    var name = String(data.conversionName || "").trim();
    if (CONVERSION_NAMES.indexOf(name) === -1) throw new Error("Unknown conversion name");
    var gclid = String(data.gclid || "").trim();
    var gbraid = String(data.gbraid || "").trim();
    var wbraid = String(data.wbraid || "").trim();
    var orderId = String(data.orderId || "").trim();
    var phone = String(data.phone || "").trim().replace(/^'/, "");
    for (var j = 0, ids = [gclid, gbraid, wbraid]; j < ids.length; j++) {
      if (ids[j] && !/^[A-Za-z0-9_-]{10,512}$/.test(ids[j])) throw new Error("Invalid Google click identifier");
    }
    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) throw new Error("Invalid phone number");
    if (!gclid && !gbraid && !wbraid && !phone) throw new Error("A click identifier or phone number is required");
    if (orderId && !/^[A-Za-z0-9_-]{1,128}$/.test(orderId)) throw new Error("Invalid order ID");
    if (data.schemaVersion === 2 && !orderId) throw new Error("Stable event ID is required");
    var time = conversionTimeWithOffset(data.conversionTime);
    var value = data.conversionValue == null ? 1 : Number(data.conversionValue);
    if (!isFinite(value)) throw new Error("Invalid conversion value");
    var currency = String(data.conversionCurrency || "INR").trim().toUpperCase();
    if (currency !== "INR") throw new Error("Invalid conversion currency");
    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = getConversionSheet();
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var rows = sheet.getRange(2, 1, lastRow - 1, 9).getDisplayValues();
        for (var k = 0; k < rows.length; k++) {
          var sameOrder = orderId && rows[k][8] === orderId && rows[k][1] === name;
          var sameLegacy = rows[k][0] === gclid && rows[k][1] === name && rows[k][2] === time && rows[k][5] === phone;
          if (sameOrder || sameLegacy) return jsonResult({ status: "success", duplicate: true, schemaVersion: 2 });
        }
      }
      var target = lastRow + 1;
      [1, 3, 6, 7, 8, 9].forEach(function(column) { sheet.getRange(target, column).setNumberFormat("@"); });
      sheet.getRange(target, 1, 1, 9).setValues([[gclid, name, time, value, currency, phone, gbraid, wbraid, orderId]]);
      SpreadsheetApp.flush();
    } finally { lock.releaseLock(); }
    return jsonResult({ status: "success", schemaVersion: 2 });
  } catch (error) { return jsonResult({ status: "error", message: String(error) }); }
}
