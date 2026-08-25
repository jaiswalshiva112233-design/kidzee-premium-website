import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyWhatsAppWebhookToken(
  supplied: string | null,
  expected: string | undefined,
) {
  const secret = expected?.trim() ?? "";
  return Boolean(
    supplied &&
      secret.length >= 24 &&
      supplied.length === secret.length &&
      timingSafeEqual(Buffer.from(supplied), Buffer.from(secret)),
  );
}

export function verifyWhatsAppWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string | undefined,
) {
  const secret = appSecret?.trim() ?? "";
  if (secret.length < 32) return false;
  const supplied = signatureHeader?.replace(/^sha256=/i, "") ?? "";
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return supplied.length === expected.length &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected));
}
