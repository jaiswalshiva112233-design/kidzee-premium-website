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
  // Date-filtered metrics can omit campaigns with no activity. Read identities separately.
  var metricsById = Object.create(null);
  var rows = AdsApp.search("SELECT campaign.id, metrics.cost_micros, metrics.clicks, metrics.impressions, " +
    "metrics.conversions, metrics.all_conversions FROM campaign WHERE segments.date DURING LAST_30_DAYS");
  while (rows.hasNext()) {
    var metricRow = rows.next();
    metricsById[String(metricRow.campaign.id)] = metricRow.metrics;
  }
  var campaigns = [];
  var identities = AdsApp.search("SELECT campaign.id, campaign.name, campaign.status, campaign_budget.id, " +
    "campaign_budget.amount_micros FROM campaign");
  while (identities.hasNext()) {
    var row = identities.next();
    var id = String(row.campaign.id);
    var metrics = metricsById[id] || { costMicros: 0, clicks: 0, impressions: 0, conversions: 0, allConversions: 0 };
    campaigns.push({ id: id, name: row.campaign.name, status: row.campaign.status,
      budgetId: String(row.campaignBudget.id), budgetMicros: Number(row.campaignBudget.amountMicros),
      costMicros: Number(metrics.costMicros), clicks: Number(metrics.clicks),
      impressions: Number(metrics.impressions), conversions: Number(metrics.conversions),
      allConversions: Number(metrics.allConversions) });
    delete metricsById[id];
  }
  if (Object.keys(metricsById).length) throw new Error("Campaign metadata is incomplete; snapshot was not sent.");
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
