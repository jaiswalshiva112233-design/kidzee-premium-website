import type { AiModelScope } from "@/generated/prisma/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { getGrowthAiControl, setGrowthAiControl } from "@/lib/growth/aiControl";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const scopes = new Set<AiModelScope>(["WEBSITE", "ADS", "CHAT", "MIRA", "TERRA", "LUNA"]);
const protocols = new Set(["OPENAI_RESPONSES", "OPENAI_CHAT_COMPATIBLE"]);
const text = (value: unknown, limit: number) => typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, limit) : "";

async function owner() {
  const session = await getAdminSession();
  return session?.role === "OWNER" ? session : null;
}

async function responseData() {
  const [control, routes, counts] = await Promise.all([
    getGrowthAiControl(),
    prisma.aiModelRoute.findMany({ orderBy: { scope: "asc" } }),
    prisma.activityLog.groupBy({ by: ["entityType"], where: { entityType: "WEBSITE_ANALYTICS_EVENT" }, _count: true }),
  ]);
  return {
    control,
    routes,
    dataCollectionContinues: true,
    collectedEvents: counts.reduce((sum, item) => sum + item._count, 0),
  };
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, message: "You are not authorised." }, { status: 401 });
  return NextResponse.json({ success: true, canManage: session.role === "OWNER", ...(await responseData()) });
}

export async function POST(request: Request) {
  const session = await owner();
  if (!session) return NextResponse.json({ success: false, message: "Only the Owner can change AI controls." }, { status: 403 });
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const action = text(body.action, 40);
    if (action === "toggle") {
      await setGrowthAiControl(body.enabled === true, session.userId);
    } else if (action === "save-route") {
      const scope = text(body.scope, 30) as AiModelScope;
      const provider = text(body.provider, 80);
      const protocol = text(body.protocol, 50);
      const model = text(body.model, 150);
      const baseUrl = text(body.baseUrl, 500);
      const apiKeyEnvVar = text(body.apiKeyEnvVar, 100);
      const maxOutputTokens = Math.trunc(Number(body.maxOutputTokens));
      const monthlyCallLimit = Math.trunc(Number(body.monthlyCallLimit));
      if (!scopes.has(scope) || !provider || !protocols.has(protocol) || !model || !/^[A-Z][A-Z0-9_]{2,100}$/.test(apiKeyEnvVar) || maxOutputTokens < 64 || maxOutputTokens > 16_000 || monthlyCallLimit < 0) {
        return NextResponse.json({ success: false, message: "Enter a valid AI route, model, limits and secret environment-variable name." }, { status: 400 });
      }
      const parsed = new URL(baseUrl);
      if (parsed.protocol !== "https:") throw new Error("AI provider URLs must use HTTPS.");
      const saved = await prisma.aiModelRoute.upsert({
        where: { scope },
        create: { scope, provider, protocol, model, baseUrl: parsed.toString().replace(/\/$/, ""), apiKeyEnvVar, enabled: body.enabled === true, maxOutputTokens, monthlyCallLimit, updatedById: session.userId },
        update: { provider, protocol, model, baseUrl: parsed.toString().replace(/\/$/, ""), apiKeyEnvVar, enabled: body.enabled === true, maxOutputTokens, monthlyCallLimit, updatedById: session.userId },
      });
      await prisma.activityLog.create({ data: { adminUserId: session.userId, action: "UPDATED", entityType: "AiModelRoute", entityId: saved.id, description: `${scope} AI route was updated. No secret value was stored.` } });
    } else {
      return NextResponse.json({ success: false, message: "Unknown AI control action." }, { status: 400 });
    }
    return NextResponse.json({ success: true, message: "AI Growth settings saved.", canManage: true, ...(await responseData()) });
  } catch (error) {
    return NextResponse.json({ success: false, message: error instanceof Error ? error.message : "AI Growth settings could not be saved." }, { status: 400 });
  }
}
