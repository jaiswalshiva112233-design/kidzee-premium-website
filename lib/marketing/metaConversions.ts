import "server-only";

import { createHash } from "node:crypto";
import { logServerError, logServerWarning } from "@/lib/server/safeLogging";

type MetaConversionEvent = {
  pixelId: string;
  eventId: string;
  eventTime: Date;
  eventSourceUrl: string | null;
  phone: string;
  parentName: string;
  email?: string | null;
  externalId?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbc?: string | null;
  fbp?: string | null;
};

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function cleanGraphVersion(value: string | undefined) {
  return /^v\d{1,2}\.\d{1,2}$/.test(value ?? "")
    ? value!
    : "v24.0";
}

function normaliseEmail(value: string) {
  return value.trim().toLowerCase();
}

function firstName(value: string) {
  return value.trim().toLowerCase().split(/\s+/)[0] || "";
}

async function sendMetaConversion(
  eventName: "Lead" | "QualifiedLead" | "CompleteRegistration",
  event: MetaConversionEvent,
) {
  const accessToken = process.env.META_CONVERSIONS_API_ACCESS_TOKEN?.trim();

  if (!accessToken || !/^\d{5,35}$/.test(event.pixelId)) {
    return { sent: false, reason: "not_configured" as const };
  }

  const phone = event.phone.replace(/\D/g, "");
  const userData: Record<string, unknown> = {};

  if (phone) {
    userData.ph = [sha256(phone)];
  }

  const cleanedFirstName = firstName(event.parentName);

  if (cleanedFirstName) {
    userData.fn = [sha256(cleanedFirstName)];
  }

  if (event.email) {
    userData.em = [sha256(normaliseEmail(event.email))];
  }

  if (event.externalId) {
    userData.external_id = [sha256(event.externalId.trim().toLowerCase())];
  }

  if (event.clientIpAddress) userData.client_ip_address = event.clientIpAddress;
  if (event.clientUserAgent) userData.client_user_agent = event.clientUserAgent;
  if (event.fbc) userData.fbc = event.fbc;
  if (event.fbp) userData.fbp = event.fbp;

  const payload: Record<string, unknown> = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(event.eventTime.getTime() / 1000),
        event_id: event.eventId,
        event_source_url: event.eventSourceUrl || undefined,
        action_source: "website",
        user_data: userData,
        custom_data: {
          content_name:
            eventName === "Lead"
              ? "Website admission enquiry"
              : eventName === "QualifiedLead"
                ? "Qualified preschool lead"
                : "Confirmed preschool admission",
          currency: "INR",
          value: eventName === "Lead" ? 1 : 10,
        },
      },
    ],
  };

  const testEventCode = process.env.META_TEST_EVENT_CODE?.trim();
  if (testEventCode) payload.test_event_code = testEventCode;

  const endpoint = new URL(
    `https://graph.facebook.com/${cleanGraphVersion(process.env.META_GRAPH_API_VERSION)}/${event.pixelId}/events`,
  );
  endpoint.searchParams.set("access_token", accessToken);

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      logServerWarning(`Meta Conversions API rejected ${eventName}.`, new Error(`ProviderStatus${response.status}`));
      return { sent: false, reason: "rejected" as const };
    }

    return { sent: true, reason: null };
  } catch (error) {
    logServerError(`Meta Conversions API ${eventName} failed.`, error);
    return { sent: false, reason: "network_error" as const };
  }
}

export function sendMetaLeadConversion(event: MetaConversionEvent) {
  return sendMetaConversion("Lead", event);
}

export function sendMetaAdmissionConversion(event: MetaConversionEvent) {
  return sendMetaConversion("CompleteRegistration", event);
}

export function sendMetaQualifiedLeadConversion(event: MetaConversionEvent) {
  return sendMetaConversion("QualifiedLead", event);
}

export function sendMetaConversionEvent(
  eventName: "Lead" | "QualifiedLead" | "CompleteRegistration",
  event: MetaConversionEvent,
) {
  return sendMetaConversion(eventName, event);
}
