import "server-only";

import { createSign } from "node:crypto";

type CachedToken = { token: string; expiresAt: number };
let cachedToken: CachedToken | null = null;

function encode(value: object) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      client_email?: string;
      private_key?: string;
      project_id?: string;
    };
    if (!parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
}

async function tokenFromServiceAccount() {
  const account = serviceAccount();
  if (!account) return null;

  const privateKey = account.private_key!;
  const now = Math.floor(Date.now() / 1000);
  const header = encode({ alg: "RS256", typ: "JWT" });
  const payload = encode({
    iss: account.client_email,
    sub: account.client_email,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope:
      "https://www.googleapis.com/auth/datastore https://www.googleapis.com/auth/devstorage.read_write https://www.googleapis.com/auth/firebase.messaging",
  });
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(privateKey, "base64url")}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Google token request failed (${response.status}).`);
  const result = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!result.access_token) throw new Error("Google token response was incomplete.");
  return { token: result.access_token, expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000 };
}

async function tokenFromMetadataServer() {
  const response = await fetch(
    "http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token",
    { headers: { "Metadata-Flavor": "Google" }, cache: "no-store", signal: AbortSignal.timeout(5_000) },
  );
  if (!response.ok) throw new Error(`Google metadata token failed (${response.status}).`);
  const result = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!result.access_token) throw new Error("Google metadata token was incomplete.");
  return { token: result.access_token, expiresAt: Date.now() + (result.expires_in ?? 3600) * 1000 };
}

export function firebaseProjectId() {
  return (
    process.env.FIREBASE_PROJECT_ID?.trim() ||
    process.env.GCLOUD_PROJECT?.trim() ||
    serviceAccount()?.project_id?.trim() ||
    ""
  );
}

export function firebaseServerConfigured() {
  return Boolean(firebaseProjectId());
}

export async function getGoogleAccessToken() {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const localToken = await tokenFromServiceAccount();
  cachedToken = localToken ?? (await tokenFromMetadataServer());
  return cachedToken.token;
}
