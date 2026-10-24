// Install in Google Ads > Tools > Bulk actions > Scripts, then schedule daily.
// Read-only to Google Ads. Sends campaign totals only, never parent/student data.
var CENTREOS_SYNC = {
  customerId: "3462690519",
  endpoint: "https://kidzeedwarka.com/api/internal/google-ads-snapshot",
  secret: "REPLACE_WITH_DEDICATED_GOOGLE_ADS_SNAPSHOT_SECRET"
};
function main() {
  var account = AdsApp.currentAccount();
  if (account.getCustomerId().replace(/-/g, "") !== CENTREOS_SYNC.customerId ||
      account.getCurrencyCode() !== "INR" ||
      ["Asia/Calcutta", "Asia/Kolkata"].indexOf(account.getTimeZone()) === -1 ||
      CENTREOS_SYNC.secret.indexOf("REPLACE_") === 0 || CENTREOS_SYNC.secret.length < 32) {
    throw new Error("Configure the expected account and a dedicated snapshot secret first.");
  }
  var today = Utilities.formatDate(new Date(), account.getTimeZone(), "yyyy-MM-dd");
  var todayUtc = new Date(today + "T00:00:00Z");
  var start = new Date(todayUtc.getTime() - 30 * 86400000).toISOString().slice(0,10);
  var rows = AdsApp.search("SELECT campaign.id, campaign.name, campaign.status, campaign_budget.id, " +
    "campaign_budget.amount_micros, metrics.cost_micros, metrics.clicks, metrics.impressions, " +
    "metrics.conversions, metrics.all_conversions FROM campaign WHERE segments.date DURING LAST_30_DAYS");
  var campaigns = [];
  while (rows.hasNext()) {
    var row = rows.next();
    campaigns.push({ id: String(row.campaign.id), name: row.campaign.name, status: row.campaign.status,
      budgetId: String(row.campaignBudget.id), budgetMicros: Number(row.campaignBudget.amountMicros),
      costMicros: Number(row.metrics.costMicros), clicks: Number(row.metrics.clicks),
      impressions: Number(row.metrics.impressions), conversions: Number(row.metrics.conversions),
      allConversions: Number(row.metrics.allConversions) });
  }
  if (AdsApp.getExecutionInfo().isPreview()) {
    Logger.log("Preview only: " + campaigns.length + " campaigns; no data sent.");
    return;
  }
  var response = UrlFetchApp.fetch(CENTREOS_SYNC.endpoint, { method: "post", contentType: "application/json",
    headers: { Authorization: "Bearer " + CENTREOS_SYNC.secret }, muteHttpExceptions: true,
    payload: JSON.stringify({ customerId: CENTREOS_SYNC.customerId, currency: "INR", timeZone: account.getTimeZone(),
      periodStart: start, periodEnd: today, campaigns: campaigns }) });
  if (response.getResponseCode() !== 200 || JSON.parse(response.getContentText()).success !== true) {
    throw new Error("CentreOS snapshot rejected; HTTP " + response.getResponseCode());
  }
  Logger.log("CentreOS campaign snapshot saved. Reporting period: " + start + " to " + today + " (end exclusive).");
}
