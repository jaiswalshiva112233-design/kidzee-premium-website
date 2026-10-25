type JsonRecord = Record<string, unknown>;
function record(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid snapshot object.");
  return value as JsonRecord;
}
function amount(value: unknown, integer = false) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 ||
      (integer && !Number.isSafeInteger(value))) throw new Error("Invalid snapshot metric.");
  return value;
}
function day(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
      new Date(value + "T00:00:00Z").toISOString().slice(0, 10) !== value) throw new Error("Invalid reporting date.");
  return value;
}
export function normalizeGoogleAdsSnapshot(value: unknown, expectedCustomerId: string, now = new Date()) {
  const input = record(value);
  if (!/^\d{10}$/.test(expectedCustomerId) || input.customerId !== expectedCustomerId ||
      input.currency !== "INR" || !["Asia/Calcutta", "Asia/Kolkata"].includes(String(input.timeZone))) {
    throw new Error("Snapshot account, currency or time zone does not match.");
  }
  const start = day(input.periodStart), end = day(input.periodEnd);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  if (end !== today || Date.parse(end) - Date.parse(start) !== 30 * 86400000) throw new Error("Snapshot must cover the last 30 complete account days.");
  if (!Array.isArray(input.campaigns) || input.campaigns.length > 1000) throw new Error("Invalid campaign rows.");
  const ids = new Set<string>(), budgets = new Map<string, number>();
  const campaigns = input.campaigns.map((raw: unknown) => {
    const row = record(raw);
    const id = String(row.id), budgetId = String(row.budgetId);
    if (!/^\d+$/.test(id) || !/^\d+$/.test(budgetId) || ids.has(id) ||
        typeof row.name !== "string" || !row.name.trim() || row.name.length > 250 ||
        !["ENABLED", "PAUSED", "REMOVED"].includes(String(row.status))) throw new Error("Invalid campaign identity.");
    ids.add(id);
    const spend = amount(row.costMicros, true) / 1000000;
    const dailyBudget = amount(row.budgetMicros, true) / 1000000;
    if (budgets.has(budgetId) && budgets.get(budgetId) !== dailyBudget) throw new Error("Conflicting shared budget.");
    if (row.status !== "REMOVED") budgets.set(budgetId, dailyBudget);
    const clicks = amount(row.clicks, true), impressions = amount(row.impressions, true);
    return { id, campaignName: row.name.trim(), status: String(row.status), budget: dailyBudget,
      spend, clicks, impressions, conversions: amount(row.conversions), allConversions: amount(row.allConversions),
      ctr: impressions ? clicks / impressions * 100 : 0, cpc: clicks ? spend / clicks : 0 };
  });
  const sum = (key: "spend" | "clicks" | "impressions" | "conversions" | "allConversions") => campaigns.reduce((total, row) => total + row[key], 0);
  const spend = sum("spend"), clicks = sum("clicks"), impressions = sum("impressions");
  return {
    customerId: expectedCustomerId,
    periodStart: new Date(start + "T00:00:00+05:30"),
    periodEnd: new Date(end + "T00:00:00+05:30"),
    metrics: { campaigns, spend, clicks, impressions, conversions: sum("conversions"), allConversions: sum("allConversions"),
      budget: [...budgets.values()].reduce((a,b)=>a+b,0), ctr: impressions ? clicks / impressions * 100 : 0, cpc: clicks ? spend / clicks : 0 },
  };
}
