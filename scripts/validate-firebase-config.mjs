import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = ["firebase.json", "firestore.rules", "firestore.indexes.json", "storage.rules", "apphosting.yaml", ".env.example"];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing Firebase deployment file: ${file}`);
}
JSON.parse(fs.readFileSync(path.join(root, "firebase.json"), "utf8"));
JSON.parse(fs.readFileSync(path.join(root, "firestore.indexes.json"), "utf8"));
const firestoreRules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const storageRules = fs.readFileSync(path.join(root, "storage.rules"), "utf8");
const appHosting = fs.readFileSync(path.join(root, "apphosting.yaml"), "utf8");
const functionsSource = fs.readFileSync(path.join(root, "functions", "src", "index.js"), "utf8");
if (/allow\s+read\s*,\s*write\s*:\s*if\s+true/.test(`${firestoreRules}\n${storageRules}`)) throw new Error("Unsafe public read/write rule detected.");
if (!firestoreRules.includes("request.auth") || !storageRules.includes("request.auth")) throw new Error("Authentication checks are missing from Firebase rules.");
for (const variable of [
  "DATABASE_URL", "DIRECT_URL", "ADMIN_SESSION_SECRET", "ADMIN_PANEL_PASSWORD",
  "ADMIN_OWNER_EMAIL", "ADMIN_OWNER_NAME", "INTERNAL_DEVICE_SECRET",
  "FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET", "FIREBASE_DATABASE_ID",
  "NEXT_PUBLIC_FIREBASE_API_KEY", "FIREBASE_AUTH_ENABLED", "MEDIA_WORKER_URL",
  "NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET",
  "NEXT_PUBLIC_SANITY_API_VERSION", "SANITY_API_WRITE_TOKEN",
  "OPENAI_API_KEY", "OPENAI_MIRA_MODEL", "OPENAI_GROWTH_MODEL",
  "OPENAI_MIRA_MONTHLY_CALL_LIMIT", "OPENAI_GROWTH_MONTHLY_CALL_LIMIT",
  "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_PHONE_NUMBER_ID", "WHATSAPP_VERIFY_TOKEN",
  "WHATSAPP_APP_SECRET", "META_CONVERSIONS_API_ACCESS_TOKEN", "META_GRAPH_API_VERSION",
  "MARKETING_CRON_SECRET", "BILLING_CRON_SECRET", "GOOGLE_ADS_CUSTOMER_ID",
  "GOOGLE_ADS_ADMISSION_CONVERSION_ACTION_ID", "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CLIENT_ID", "GOOGLE_ADS_CLIENT_SECRET", "GOOGLE_ADS_REFRESH_TOKEN",
  "GOOGLE_ADS_API_VERSION", "GOOGLE_ADS_ADMISSION_VALUE", "NEXT_PUBLIC_GTM_ID",
  "NEXT_PUBLIC_GA_MEASUREMENT_ID", "NEXT_PUBLIC_GOOGLE_ADS_ID",
  "NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL", "NEXT_PUBLIC_META_PIXEL_ID",
  "GOOGLE_SITE_VERIFICATION", "WEBSITE_ANALYTICS_ENABLED",
  "WEBSITE_ADVERTISING_ENABLED", "WEBSITE_META_PIXEL_ENABLED",
]) {
  if (!appHosting.includes(`variable: ${variable}`)) throw new Error(`App Hosting is missing ${variable}.`);
}
if (!functionsSource.includes("retryMarketingConversions") || !functionsSource.includes("every 15 minutes")) {
  throw new Error("The scheduled marketing retry function is missing.");
}
if (!functionsSource.includes("generateMonthlyCentreInvoices") || !functionsSource.includes("every day 00:10")) {
  throw new Error("The scheduled recurring billing function is missing.");
}
console.log("Firebase configuration files and deny-by-default rules are valid.");
