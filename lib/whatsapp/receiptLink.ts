import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

function secret() {
  const value = process.env.WHATSAPP_DOCUMENT_SECRET?.trim() ?? "";
  if (value.length < 32) throw new Error("WHATSAPP_DOCUMENT_SECRET is not configured safely.");
  return value;
}

function signature(receiptId: string, expires: number) {
  return createHmac("sha256", secret()).update(`${receiptId}:${expires}`).digest("hex");
}

export function createReceiptDocumentUrl(receiptId: string, lifetimeSeconds = 7 * 24 * 60 * 60) {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://kidzeedwarka.com").replace(/\/$/, "");
  const expires = Math.floor(Date.now() / 1_000) + lifetimeSeconds;
  return `${base}/api/receipts/${encodeURIComponent(receiptId)}/pdf?expires=${expires}&signature=${signature(receiptId, expires)}`;
}

export function verifyReceiptDocumentSignature(receiptId: string, expiresText: string | null, supplied: string | null) {
  const expires = Number(expiresText);
  if (!Number.isInteger(expires) || expires < Math.floor(Date.now() / 1_000) || expires > Math.floor(Date.now() / 1_000) + 31 * 24 * 60 * 60) return false;
  if (!supplied || !/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = signature(receiptId, expires);
  return supplied.length === expected.length && timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}
