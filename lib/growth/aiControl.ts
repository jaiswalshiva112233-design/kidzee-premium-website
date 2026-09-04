import "server-only";

import type { AiModelScope, Prisma } from "@/generated/prisma/client";

import { prisma } from "@/lib/prisma";
import { logServerError, logServerWarning } from "@/lib/server/safeLogging";

const CONTROL_KEY = "GROWTH_AI_CONTROL";

export type GrowthAiControl = {
  enabled: boolean;
  updatedAt: string | null;
};

export async function getGrowthAiControl(): Promise<GrowthAiControl> {
  const setting = await prisma.centreSetting.findUnique({ where: { key: CONTROL_KEY } });
  const value = setting?.value;
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { enabled: false, updatedAt: null };
  }
  const record = value as Record<string, unknown>;
  return {
    enabled: record.enabled === true,
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : null,
  };
}

export async function setGrowthAiControl(enabled: boolean, actorId: string) {
  const value: Prisma.InputJsonObject = { enabled, updatedAt: new Date().toISOString() };
  await prisma.$transaction([
    prisma.centreSetting.upsert({
      where: { key: CONTROL_KEY },
      create: { key: CONTROL_KEY, value, description: "Owner-controlled switch for every external AI API call." },
      update: { value },
    }),
    prisma.activityLog.create({
      data: {
        adminUserId: actorId,
        action: "UPDATED",
        entityType: "GrowthAiControl",
        entityId: CONTROL_KEY,
        description: `Growth AI analysis was turned ${enabled ? "on" : "off"}. Data collection remains active.`,
        newData: value,
      },
    }),
  ]);
  return { enabled, updatedAt: value.updatedAt as string };
}

function responseText(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const response = value as {
    output?: Array<{ content?: Array<{ type?: string; text?: string }> }>;
    choices?: Array<{ message?: { content?: string } }>;
  };
  const responsesText = (response.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("\n")
    .trim();
  return responsesText || response.choices?.[0]?.message?.content?.trim() || "";
}

async function reserveCall(routeId: string, monthlyLimit: number) {
  if (monthlyLimit <= 0) return false;
  const month = new Date().toISOString().slice(0, 7);
  const key = `ai-route-usage-${routeId}-${month}`;
  return prisma.$transaction(async (transaction) => {
    const current = await transaction.centreSetting.findUnique({ where: { key } });
    const currentValue = current?.value;
    const count = currentValue && typeof currentValue === "object" && !Array.isArray(currentValue) && "count" in currentValue
      ? Number((currentValue as { count?: unknown }).count) || 0
      : 0;
    if (count >= monthlyLimit) return false;
    const value = { count: count + 1, limit: monthlyLimit, month, routeId };
    await transaction.centreSetting.upsert({ where: { key }, create: { key, value }, update: { value } });
    return true;
  });
}

export async function executeGrowthAi(options: {
  scope: AiModelScope;
  instructions: string;
  input: string;
}) {
  const control = await getGrowthAiControl();
  if (!control.enabled) return { text: null, provider: null, model: null, disabled: true };

  const route = await prisma.aiModelRoute.findUnique({ where: { scope: options.scope } });
  if (!route?.enabled || route.model === "configure-in-centreos") {
    return { text: null, provider: route?.provider ?? null, model: route?.model ?? null, disabled: false };
  }
  if (!/^[A-Z][A-Z0-9_]{2,100}$/.test(route.apiKeyEnvVar)) {
    logServerWarning("Growth AI route contains an invalid secret environment-variable name.", new Error("InvalidEnvironmentVariableName"));
    return { text: null, provider: route.provider, model: route.model, disabled: false };
  }
  let apiKey = process.env[route.apiKeyEnvVar]?.trim();
  if (!apiKey) {
    const setting = await prisma.centreSetting.findUnique({
      where: { key: `SECRET_${route.apiKeyEnvVar}` },
    });
    const val = setting?.value;
    if (val && typeof val === "object" && !Array.isArray(val) && "secret" in val) {
      apiKey = String((val as { secret?: unknown }).secret || "").trim();
    }
  }

  if (!apiKey || !(await reserveCall(route.id, route.monthlyCallLimit))) {
    return { text: null, provider: route.provider, model: route.model, disabled: false };
  }

  let baseUrl: URL;
  try {
    baseUrl = new URL(route.baseUrl);
    if (baseUrl.protocol !== "https:") throw new Error("HTTPSRequired");
  } catch {
    logServerWarning("Growth AI route contains an invalid HTTPS provider URL.", new Error("InvalidProviderUrl"));
    return { text: null, provider: route.provider, model: route.model, disabled: false };
  }

  const chatCompatible = route.protocol === "OPENAI_CHAT_COMPATIBLE";
  const endpoint = new URL(chatCompatible ? "chat/completions" : "responses", `${baseUrl.toString().replace(/\/$/, "")}/`);
  const body = chatCompatible
    ? { model: route.model, messages: [{ role: "system", content: options.instructions }, { role: "user", content: options.input }], max_tokens: route.maxOutputTokens }
    : { model: route.model, instructions: options.instructions, input: options.input, max_output_tokens: route.maxOutputTokens };

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      logServerWarning("Configured growth AI provider rejected the request.", new Error(`ProviderStatus${response.status}`));
      return { text: null, provider: route.provider, model: route.model, disabled: false };
    }
    const text = responseText(await response.json());
    return { text: text || null, provider: route.provider, model: route.model, disabled: false };
  } catch (error) {
    logServerError("Configured growth AI request failed.", error);
    return { text: null, provider: route.provider, model: route.model, disabled: false };
  }
}
