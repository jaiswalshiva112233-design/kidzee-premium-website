import "server-only";

export function whatsappCloudConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

export async function sendWhatsAppDocument(options: {
  to: string;
  documentUrl: string;
  filename: string;
  caption: string;
}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) throw new Error("WhatsApp Cloud API is not configured.");
  const to = options.to.replace(/\D/g, "");
  if (!/^91[6-9]\d{9}$/.test(to)) throw new Error("A valid Indian WhatsApp number is required.");
  const response = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "document",
      document: { link: options.documentUrl, filename: options.filename.slice(0, 120), caption: options.caption.slice(0, 1024) },
    }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`WhatsApp send failed (${response.status}).`);
  return response.json() as Promise<{ messages?: Array<{ id?: string }> }>;
}

export async function sendWhatsAppTemplate(options: {
  to: string;
  templateName: string;
  language?: string;
  bodyParameters?: string[];
  headerDocument?: { url: string; filename: string };
}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  if (!token || !phoneNumberId) throw new Error("WhatsApp Cloud API is not configured.");
  const to = options.to.replace(/\D/g, "");
  if (!/^91[6-9]\d{9}$/.test(to)) throw new Error("A valid Indian WhatsApp number is required.");
  if (!/^[a-z0-9_]{1,512}$/.test(options.templateName)) throw new Error("A valid approved WhatsApp template is required.");
  const components: Array<Record<string, unknown>> = [];
  if (options.headerDocument) {
    components.push({
      type: "header",
      parameters: [{
        type: "document",
        document: {
          link: options.headerDocument.url,
          filename: options.headerDocument.filename.slice(0, 120),
        },
      }],
    });
  }
  if (options.bodyParameters?.length) {
    components.push({
      type: "body",
      parameters: options.bodyParameters.map((value) => ({
        type: "text",
        text: value.slice(0, 1_000),
      })),
    });
  }
  const response = await fetch(`https://graph.facebook.com/v22.0/${encodeURIComponent(phoneNumberId)}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: options.templateName,
        language: { code: options.language || "en" },
        components: components.length ? components : undefined,
      },
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error(`WhatsApp template send failed (${response.status}).`);
  return response.json() as Promise<{ messages?: Array<{ id?: string }> }>;
}
