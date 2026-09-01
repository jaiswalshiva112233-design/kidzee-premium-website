import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const required = ["firebase.json", ".firebaserc", "firestore.rules", "firestore.indexes.json", "storage.rules", "apphosting.yaml", ".env.example"];
for (const file of required) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`Missing Firebase deployment file: ${file}`);
}
const firebaseConfig = JSON.parse(fs.readFileSync(path.join(root, "firebase.json"), "utf8"));
JSON.parse(fs.readFileSync(path.join(root, "firestore.indexes.json"), "utf8"));
const firestoreRules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const storageRules = fs.readFileSync(path.join(root, "storage.rules"), "utf8");
const appHosting = fs.readFileSync(path.join(root, "apphosting.yaml"), "utf8");
const firebaseRc = JSON.parse(fs.readFileSync(path.join(root, ".firebaserc"), "utf8"));
const functionsSource = fs.readFileSync(path.join(root, "functions", "src", "index.js"), "utf8");
if (firebaseRc?.projects?.default !== "kidzee-dwarka-centreos") throw new Error("The production Firebase project is not selected safely.");
if (firebaseConfig?.firestore?.database !== "default") throw new Error("Firebase rules must target the Delhi Firestore database named default.");
if (/allow\s+read\s*,\s*write\s*:\s*if\s+true/.test(`${firestoreRules}\n${storageRules}`)) throw new Error("Unsafe public read/write rule detected.");
if (!firestoreRules.includes("request.auth") || !storageRules.includes("request.auth")) throw new Error("Authentication checks are missing from Firebase rules.");
for (const variable of [
  "DATABASE_URL", "DIRECT_URL", "ADMIN_SESSION_SECRET", "ADMIN_PANEL_PASSWORD",
  "ADMIN_OWNER_EMAIL", "ADMIN_OWNER_NAME", "INTERNAL_DEVICE_SECRET",
  "FIREBASE_PROJECT_ID", "FIREBASE_STORAGE_BUCKET", "FIREBASE_DATABASE_ID",
  "NEXT_PUBLIC_FIREBASE_API_KEY", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", "NEXT_PUBLIC_FIREBASE_APP_ID",
  "FIREBASE_AUTH_ENABLED",
  "NEXT_PUBLIC_SANITY_PROJECT_ID", "NEXT_PUBLIC_SANITY_DATASET",
  "NEXT_PUBLIC_SANITY_API_VERSION", "SANITY_API_WRITE_TOKEN",
  "BILLING_CRON_SECRET", "WEBSITE_ANALYTICS_ENABLED",
  "WEBSITE_ADVERTISING_ENABLED", "WEBSITE_META_PIXEL_ENABLED",
]) {
  if (!appHosting.includes(`variable: ${variable}`)) throw new Error(`App Hosting is missing ${variable}.`);
}
for (const variable of ["WEBSITE_ANALYTICS_ENABLED", "WEBSITE_ADVERTISING_ENABLED", "WEBSITE_META_PIXEL_ENABLED"]) {
  const disabled = new RegExp(`variable: ${variable}\\s+value: ["']?false["']?`, "m");
  if (!disabled.test(appHosting)) throw new Error(`${variable} must remain disabled for the controlled trial.`);
}
for (const variable of [
  "OPENAI_API_KEY", "MEDIA_WORKER_URL", "NEXT_PUBLIC_FIREBASE_VAPID_KEY",
  "WHATSAPP_ACCESS_TOKEN", "WHATSAPP_CRON_SECRET", "MARKETING_CRON_SECRET",
  "META_CONVERSIONS_API_ACCESS_TOKEN", "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GROWTH_SYNC_SECRET", "OWNER_INTELLIGENCE_CRON_SECRET", "NOTIFICATION_CRON_SECRET",
]) {
  if (appHosting.includes(`variable: ${variable}`)) throw new Error(`Disabled trial integration ${variable} must not require an App Hosting secret.`);
}
if (!functionsSource.includes("retryMarketingConversions") || !functionsSource.includes("every 15 minutes")) {
  throw new Error("The scheduled marketing retry function is missing.");
}
if (!functionsSource.includes("generateMonthlyCentreInvoices") || !functionsSource.includes("every day 00:10")) {
  throw new Error("The scheduled recurring billing function is missing.");
}
for (const [flag, exportName] of [
  ["GROWTH_SUMMARY_SCHEDULER_ENABLED", "buildDailyGrowthSummary"],
  ["MARKETING_SCHEDULER_ENABLED", "retryMarketingConversions"],
  ["GROWTH_SCHEDULER_ENABLED", "synchronizeGrowthSources"],
  ["WHATSAPP_SCHEDULER_ENABLED", "processWhatsAppAutomation"],
  ["NOTIFICATION_SCHEDULER_ENABLED", "processCentreNotifications"],
  ["OWNER_INTELLIGENCE_SCHEDULER_ENABLED", "refreshOwnerIntelligence"],
]) {
  const guard = `if (optionalSchedulerEnabled("${flag}")) {`;
  const guardIndex = functionsSource.indexOf(guard);
  const exportIndex = functionsSource.indexOf(`exports.${exportName} = onSchedule`);
  if (guardIndex < 0 || exportIndex < guardIndex) {
    throw new Error(`${exportName} must remain absent unless ${flag} is explicitly enabled.`);
  }
}
for (const secret of [
  "MARKETING_CRON_SECRET",
  "GROWTH_SYNC_SECRET",
  "WHATSAPP_CRON_SECRET",
  "NOTIFICATION_CRON_SECRET",
  "OWNER_INTELLIGENCE_CRON_SECRET",
]) {
  const declarationIndex = functionsSource.indexOf(`defineSecret("${secret}")`);
  const firstGuardIndex = functionsSource.lastIndexOf("if (optionalSchedulerEnabled(", declarationIndex);
  if (declarationIndex < 0 || firstGuardIndex < 0) {
    throw new Error(`${secret} must be declared only inside its enabled scheduler block.`);
  }
}
console.log("Firebase configuration files and deny-by-default rules are valid.");
