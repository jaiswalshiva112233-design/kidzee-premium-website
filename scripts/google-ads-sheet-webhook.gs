// Deployed as the existing CentreOS Auto Lead Sync web app.
// Keep the deployment URL and the Sheet1/Data Manager mappings unchanged.
var CONVERSION_SHEET_NAME = "Sheet1";
var CONVERSION_NAMES = [
  "Submit lead form Website",
  "Qualified lead",
  "Admissions",
];

function conversionTimeWithOffset(value) {
  var match = /^(\d{4}-\d{2}-\d{2})[ T](\d{1,2}):(\d{2}):(\d{2})(?:\+05:30)?$/.exec(
    String(value || "").trim(),
  );
  if (!match || Number(match[2]) > 23 || Number(match[3]) > 59 || Number(match[4]) > 59) {
    throw new Error("Invalid conversion time");
  }
  return match[1] + "T" + match[2].padStart(2, "0") + ":" + match[3] + ":" + match[4] + "+05:30";
}

function jsonResult(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var conversionName = String(data.conversionName || "").trim();
    if (CONVERSION_NAMES.indexOf(conversionName) === -1) {
      throw new Error("Unknown conversion name");
    }

    var gclid = String(data.gclid || "").trim();
    var phone = String(data.phone || "").trim().replace(/^'/, "");
    if (gclid && !/^[A-Za-z0-9_-]{10,200}$/.test(gclid)) {
      throw new Error("Invalid Google Click ID");
    }
    if (phone && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      throw new Error("Invalid phone number");
    }
    if (!gclid && !phone) {
      throw new Error("A Google Click ID or phone number is required");
    }

    var conversionTime = conversionTimeWithOffset(data.conversionTime);
    var conversionValue = data.conversionValue == null ? 1 : Number(data.conversionValue);
    if (!isFinite(conversionValue)) {
      throw new Error("Invalid conversion value");
    }
    var conversionCurrency = String(data.conversionCurrency || "INR").trim().toUpperCase();
    if (conversionCurrency !== "INR") {
      throw new Error("Invalid conversion currency");
    }

    var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = spreadsheet.getSheetByName(CONVERSION_SHEET_NAME);
    if (!sheet) {
      throw new Error("Conversion sheet not found");
    }

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        var rows = sheet.getRange(2, 1, lastRow - 1, 6).getDisplayValues();
        for (var i = 0; i < rows.length; i++) {
          if (
            rows[i][0] === gclid &&
            rows[i][1] === conversionName &&
            rows[i][2] === conversionTime &&
            rows[i][5] === phone
          ) {
            return jsonResult({ status: "success", duplicate: true });
          }
        }
      }

      var targetRow = lastRow + 1;
      sheet.getRange(targetRow, 1).setNumberFormat("@");
      sheet.getRange(targetRow, 3).setNumberFormat("@");
      sheet.getRange(targetRow, 6).setNumberFormat("@");
      sheet.getRange(targetRow, 1, 1, 6).setValues([[
        gclid,
        conversionName,
        conversionTime,
        conversionValue,
        conversionCurrency,
        phone,
      ]]);
      SpreadsheetApp.flush();
    } finally {
      lock.releaseLock();
    }

    return jsonResult({ status: "success" });
  } catch (error) {
    return jsonResult({ status: "error", message: String(error) });
  }
}
