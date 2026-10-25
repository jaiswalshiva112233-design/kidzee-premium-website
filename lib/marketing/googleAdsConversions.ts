import "server-only";

import { createHash } from "node:crypto";
import { logServerError, logServerWarning } from "@/lib/server/safeLogging";

export type GoogleConversionEvent = {
  enquiryNumber: string;
  conversionTime: Date;
  gclid: string | null;
  gbraid: string | null;
  wbraid: string | null;
  phone: string;
  email: string | null;
};

function cleanDigits(value: string | undefined) {
  return (value ?? "").replace(/\D/g, "");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function conversionDateTime(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "+00:00").replace("T", " ");
}

function conversionActionId(eventType: "LEAD" | "QUALIFIED_LEAD" | "ADMISSION") {
  const environmentName =
    eventType === "LEAD"
      ? "GOOGLE_ADS_LEAD_CONVERSION_ACTION_ID"
      : eventType === "QUALIFIED_LEAD"
        ? "GOOGLE_ADS_QUALIFIED_LEAD_CONVERSION_ACTION_ID"
        : "GOOGLE_ADS_ADMISSION_CONVERSION_ACTION_ID";

  return cleanDigits(process.env[environmentName]);
}

function configuration(eventType: "LEAD" | "QUALIFIED_LEAD" | "ADMISSION") {
  const customerId = cleanDigits(process.env.GOOGLE_ADS_CUSTOMER_ID);
  const actionId = conversionActionId(eventType);
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN?.trim() ?? "";
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET?.trim() ?? "";
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN?.trim() ?? "";
  const apiVersion = /^v\d+$/.test(process.env.GOOGLE_ADS_API_VERSION ?? "")
    ? process.env.GOOGLE_ADS_API_VERSION!
    : "v25";

  if (
    !customerId ||
    !actionId ||
    !developerToken ||
    !clientId ||
    !clientSecret ||
    !refreshToken
  ) {
    return null;
  }

  return {
    customerId,
    conversionActionId: actionId,
    developerToken,
    clientId,
    clientSecret,
    refreshToken,
    apiVersion,
    loginCustomerId: cleanDigits(process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID),
  };
}

async function accessToken(config: NonNullable<ReturnType<typeof configuration>>) {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: config.refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(8_000),
  });

  if (!response.ok) throw new Error(`OAuth token request failed (${response.status}).`);

  const payload = (await response.json()) as { access_token?: unknown };
  if (typeof payload.access_token !== "string") {
    throw new Error("OAuth response did not include an access token.");
  }

  return payload.access_token;
}

function formatISTDateTime(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}+05:30`;
}

export function formatE164Phone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+91${digits.slice(1)}`;
  return phone.startsWith("+") && /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : "";
}

export async function checkGoogleAdsSheetHealth(): Promise<"VERIFIED" | "NOT_CONFIGURED" | "UNAVAILABLE"> {
  const webhookUrl = process.env.GOOGLE_ADS_SHEET_WEBHOOK_URL?.trim() ?? "";
  const secret = process.env.GOOGLE_ADS_SHEET_WEBHOOK_SECRET?.trim() ?? "";
  if (!URL.canParse(webhookUrl) || secret.length < 32) return "NOT_CONFIGURED";
  const target = new URL(webhookUrl);
  if (target.protocol !== "https:" || target.hostname !== "script.google.com" ||
      !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(target.pathname) || target.search || target.hash) {
    return "NOT_CONFIGURED";
  }
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ secret, action: "health" }),
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });
    const result = await response.json() as { status?: unknown; healthy?: unknown };
    return response.ok && result.status === "success" && result.healthy === true ? "VERIFIED" : "UNAVAILABLE";
  } catch {
    return "UNAVAILABLE";
  }
}

async function sendViaGoogleSheetWebhook(
  eventType: "LEAD" | "QUALIFIED_LEAD" | "ADMISSION",
  event: GoogleConversionEvent,
) {
  const webhookUrl = process.env.GOOGLE_ADS_SHEET_WEBHOOK_URL?.trim();
  if (!webhookUrl) return null;
  const url = new URL(webhookUrl);
  if (url.protocol !== "https:" || url.hostname !== "script.google.com" ||
      !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname)) {
    return { sent: false, reason: "not_configured" as const };
  }

  const webhookSecret = process.env.GOOGLE_ADS_SHEET_WEBHOOK_SECRET?.trim() ?? "";
  if (webhookSecret.length < 32) return { sent: false, reason: "not_configured" as const };

  const conversionName =
    eventType === "LEAD"
      ? "Submit lead form Website"
      : eventType === "QUALIFIED_LEAD"
        ? "Qualified lead"
        : "Admissions";

  const payload = {
    secret: webhookSecret,
    gclid: event.gclid || "",
    conversionName,
    conversionTime: formatISTDateTime(event.conversionTime),
    conversionValue: 1,
    conversionCurrency: "INR",
    phone: formatE164Phone(event.phone),
  };

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    redirect: "follow",
    signal: AbortSignal.timeout(12_000),
  });

  if (!response.ok) {
    throw new Error(`Google Sheet Webhook returned HTTP ${response.status}`);
  }

  const data = (await response.json().catch(() => ({ status: "invalid_response" }))) as {
    status?: string;
    message?: string;
  };
  if (data.status !== "success") {
    throw new Error(`Google Sheet Webhook did not confirm delivery: ${data.message || data.status || "unknown"}`);
  }

  return { sent: true, reason: null };
}

export async function sendGoogleConversion(
  eventType: "LEAD" | "QUALIFIED_LEAD" | "ADMISSION",
  event: GoogleConversionEvent,
) {
  try {
    const webhookResult = await sendViaGoogleSheetWebhook(eventType, event);
    if (webhookResult) {
      return webhookResult;
    }
  } catch (webhookError) {
    logServerError("Google Sheet conversion webhook delivery failed.", webhookError);
    // A timeout can happen after the Sheet accepted the row. Retry that route;
    // switching to a different conversion action could count the lead twice.
    return { sent: false, reason: "sheet_delivery_failed" as const };
  }

  const config = configuration(eventType);

  if (!config) return { sent: false, reason: "not_configured" as const };

  const clickIdentifier = event.gclid
    ? { gclid: event.gclid }
    : event.wbraid
      ? { wbraid: event.wbraid }
      : event.gbraid
        ? { gbraid: event.gbraid }
        : null;

  if (!clickIdentifier) return { sent: false, reason: "missing_click_id" as const };

  const userIdentifiers: Array<Record<string, string>> = [];
  const phone = formatE164Phone(event.phone);

  if (phone) userIdentifiers.push({ hashedPhoneNumber: sha256(phone) });
  if (event.email) {
    userIdentifiers.push({ hashedEmail: sha256(event.email.trim().toLowerCase()) });
  }

  try {
    const token = await accessToken(config);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      "developer-token": config.developerToken,
      "Content-Type": "application/json",
    };
    if (config.loginCustomerId) headers["login-customer-id"] = config.loginCustomerId;

    const valueName = `GOOGLE_ADS_${eventType}_VALUE`;
    const value = Number(process.env[valueName] ?? (eventType === "ADMISSION" ? "10" : "1"));
    const orderId =
      eventType === "LEAD"
        ? event.enquiryNumber
        : `${eventType.toLowerCase().replaceAll("_", "-")}-${event.enquiryNumber}`;
    const response = await fetch(
      `https://googleads.googleapis.com/${config.apiVersion}/customers/${config.customerId}:uploadClickConversions`,
      {
        method: "POST",
        headers,
        cache: "no-store",
        signal: AbortSignal.timeout(12_000),
        body: JSON.stringify({
          partialFailure: true,
          conversions: [
            {
              conversionAction: `customers/${config.customerId}/conversionActions/${config.conversionActionId}`,
              conversionDateTime: conversionDateTime(event.conversionTime),
              conversionValue: Number.isFinite(value) ? value : 1,
              currencyCode: "INR",
              orderId,
              consent: { adUserData: "GRANTED" },
              userIdentifiers,
              ...clickIdentifier,
            },
          ],
        }),
      },
    );

    const result = await response.json().catch(() => null) as {
      partialFailureError?: { code?: number };
      results?: Array<{ conversionAction?: string }>;
    } | null;
    if (!response.ok || result?.partialFailureError?.code ||
        result?.results?.[0]?.conversionAction !==
          `customers/${config.customerId}/conversionActions/${config.conversionActionId}`) {
      logServerWarning(`Google Ads rejected a ${eventType} conversion.`, new Error(`ProviderStatus${response.status}`));
      return { sent: false, reason: "rejected" as const };
    }

    return { sent: true, reason: null };
  } catch (error) {
    logServerError(`Google Ads ${eventType} conversion failed.`, error);
    return { sent: false, reason: "network_error" as const };
  }
}

export function sendGoogleAdmissionConversion(event: GoogleConversionEvent) {
  return sendGoogleConversion("ADMISSION", event);
}
