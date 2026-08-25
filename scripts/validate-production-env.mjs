import "dotenv/config";

const problems = [];
const value = (name) => String(process.env[name] || "").trim();
const placeholder = (input) => /^(?:change|replace|your[-_]|example|dummy|test[-_]|todo|xxx|insert[-_])/i.test(input);
const required = (name, minimum = 1) => {
  if (value(name).length < minimum) problems.push(`${name} is missing or too short`);
  else if (placeholder(value(name))) problems.push(`${name} needs a production value`);
};
const match = (name, pattern, message) => {
  if (placeholder(value(name))) problems.push(`${name} needs a production value`);
  else if (!pattern.test(value(name))) problems.push(`${name} ${message}`);
};
const httpsUrl = (name) => {
  try {
    const parsed = new URL(value(name));
    if (parsed.protocol !== "https:") throw new Error();
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname.endsWith(".test") || parsed.hostname === "example.com") {
      problems.push(`${name} needs a production HTTPS value`);
    }
  } catch {
    problems.push(`${name} must be a valid HTTPS URL`);
  }
};

httpsUrl("NEXT_PUBLIC_SITE_URL");
httpsUrl("CENTREOS_BASE_URL");
match("DATABASE_URL", /^(postgres(?:ql)?|prisma\+postgres):\/\//, "must be a PostgreSQL or Prisma Postgres connection URL");
match("DIRECT_URL", /^postgres(?:ql)?:\/\//, "must be a direct PostgreSQL connection URL");
required("ADMIN_SESSION_SECRET", 32);
required("INTERNAL_DEVICE_SECRET", 32);
required("ADMIN_PANEL_PASSWORD", 12);
match("ADMIN_OWNER_EMAIL", /^[^\s@]+@[^\s@]+\.[^\s@]+$/, "must be a valid email address");
required("ADMIN_OWNER_NAME", 2);

match("FIREBASE_PROJECT_ID", /^[a-z][a-z0-9-]{4,29}$/, "is invalid");
match("FIREBASE_STORAGE_BUCKET", /^[A-Za-z0-9._-]+(?:\.appspot\.com|\.firebasestorage\.app)$/, "is invalid");
required("NEXT_PUBLIC_FIREBASE_API_KEY", 20);
required("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", 6);
match("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", /^\d{5,30}$/, "is invalid");
required("NEXT_PUBLIC_FIREBASE_APP_ID", 10);
required("NEXT_PUBLIC_FIREBASE_VAPID_KEY", 40);
httpsUrl("MEDIA_WORKER_URL");

required("NEXT_PUBLIC_SANITY_PROJECT_ID", 6);
match("NEXT_PUBLIC_SANITY_DATASET", /^[A-Za-z0-9_-]{1,64}$/, "is invalid");
match("NEXT_PUBLIC_SANITY_API_VERSION", /^\d{4}-\d{2}-\d{2}$/, "must use YYYY-MM-DD");
required("SANITY_API_WRITE_TOKEN", 20);

required("OPENAI_API_KEY", 20);
required("OPENAI_MIRA_MODEL", 2);
required("OPENAI_GROWTH_MODEL", 2);
for (const name of ["OPENAI_MIRA_MONTHLY_CALL_LIMIT", "OPENAI_GROWTH_MONTHLY_CALL_LIMIT"]) {
  if (!Number.isInteger(Number(value(name))) || Number(value(name)) < 1) problems.push(`${name} must be a positive integer`);
}

required("WHATSAPP_ACCESS_TOKEN", 20);
match("WHATSAPP_PHONE_NUMBER_ID", /^\d{5,30}$/, "is invalid");
required("WHATSAPP_VERIFY_TOKEN", 24);
required("WHATSAPP_APP_SECRET", 32);
required("MARKETING_CRON_SECRET", 32);
required("WHATSAPP_CRON_SECRET", 32);
required("BILLING_CRON_SECRET", 32);
required("GROWTH_SYNC_SECRET", 32);
required("OWNER_INTELLIGENCE_CRON_SECRET", 32);
required("NOTIFICATION_CRON_SECRET", 32);
required("WHATSAPP_DOCUMENT_SECRET", 32);
for (const name of [
  "WHATSAPP_TEMPLATE_ENQUIRY_NOTIFICATION",
  "WHATSAPP_TEMPLATE_VISIT_REMINDER",
  "WHATSAPP_TEMPLATE_ADMISSION_CONFIRMATION",
  "WHATSAPP_TEMPLATE_FEE_REMINDER",
  "WHATSAPP_TEMPLATE_RECEIPT_DOCUMENT",
  "WHATSAPP_TEMPLATE_DAYCARE_REMINDER",
  "WHATSAPP_TEMPLATE_FOLLOW_UP_REMINDER",
]) match(name, /^[a-z0-9_]{1,512}$/, "must be an approved lowercase WhatsApp template name");
required("META_CONVERSIONS_API_ACCESS_TOKEN", 20);
match("META_GRAPH_API_VERSION", /^v\d{1,2}\.\d{1,2}$/, "is invalid");

for (const name of [
  "GOOGLE_ADS_CUSTOMER_ID",
  "GOOGLE_ADS_ADMISSION_CONVERSION_ACTION_ID",
  "GOOGLE_ADS_LEAD_CONVERSION_ACTION_ID",
  "GOOGLE_ADS_QUALIFIED_LEAD_CONVERSION_ACTION_ID",
]) match(name, /^\d{5,20}$/, "is invalid");
for (const name of [
  "GOOGLE_ADS_DEVELOPER_TOKEN",
  "GOOGLE_ADS_CLIENT_ID",
  "GOOGLE_ADS_CLIENT_SECRET",
  "GOOGLE_ADS_REFRESH_TOKEN",
]) required(name, 10);
match("GOOGLE_ADS_API_VERSION", /^v\d+$/, "is invalid");
for (const name of [
  "GOOGLE_ADS_ADMISSION_VALUE",
  "GOOGLE_ADS_LEAD_VALUE",
  "GOOGLE_ADS_QUALIFIED_LEAD_VALUE",
]) {
  if (!Number.isFinite(Number(value(name))) || Number(value(name)) < 0) {
    problems.push(`${name} must be a non-negative number`);
  }
}

if (!/^GTM-[A-Z0-9]{4,20}$/.test(value("NEXT_PUBLIC_GTM_ID")) &&
    !/^G-[A-Z0-9]{4,20}$/.test(value("NEXT_PUBLIC_GA_MEASUREMENT_ID"))) {
  problems.push("NEXT_PUBLIC_GTM_ID or NEXT_PUBLIC_GA_MEASUREMENT_ID must be configured");
}
match("NEXT_PUBLIC_GOOGLE_ADS_ID", /^AW-\d{5,20}$/, "is invalid");
required("NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL", 1);
match("NEXT_PUBLIC_META_PIXEL_ID", /^\d{5,30}$/, "is invalid");
required("GOOGLE_SITE_VERIFICATION", 5);
for (const name of [
  "WEBSITE_ANALYTICS_ENABLED",
  "WEBSITE_ADVERTISING_ENABLED",
  "WEBSITE_META_PIXEL_ENABLED",
]) {
  if (!/^(true|false)$/.test(value(name))) problems.push(`${name} must be true or false`);
}

if (problems.length) {
  console.error("Production environment validation failed:");
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

console.log("Production environment variables are complete and structurally valid.");
