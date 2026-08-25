import { NextResponse } from "next/server";
import type { AiModelScope, Prisma } from "@/generated/prisma/client";
import { getAdminSession } from "@/lib/admin/auth";
import { buildGrowthSnapshot } from "@/lib/growth/analysis";
import { executeGrowthAi } from "@/lib/growth/aiControl";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ success: false, message: "You are not authorised." }, { status: 401 });
  if (session.role !== "OWNER") return NextResponse.json({ success: false, message: "Owner access is required." }, { status: 403 });
  const body = await request.json().catch(() => ({})) as { scope?: string };
  const scope: AiModelScope = body.scope === "ADS" ? "ADS" : "WEBSITE";
  const snapshot = await buildGrowthSnapshot(30);
  const evidence = JSON.parse(JSON.stringify(snapshot)) as Prisma.InputJsonValue;
  const result = await executeGrowthAi({ scope, instructions: "You are Kidzee CentreOS admissions growth analyst. Use only the supplied evidence. The supplied admission evidence excludes careers, recruitment, internal staff traffic, tests, bots and repeated submissions. Never invent figures. Separate evidence, hypothesis, exact reversible action, expected impact, confidence, data sufficiency and risk. Recommend preview-first changes only; never claim to apply them.", input: JSON.stringify(snapshot) });
  const answer = result.disabled ? "AI analysis is OFF. Website, lead, attribution, ad-conversion and performance data continue collecting." : result.text ?? "The selected model route is not configured or there is not enough provider capacity. No recommendation was invented.";
  await prisma.growthAnalysisRun.create({ data: { scope, status: result.text ? "COMPLETED" : "INSUFFICIENT_DATA", question: `${scope} 30-day analysis`, evidence, answer, provider: result.provider, model: result.model, insufficientData: !result.text, createdById: session.userId, completedAt: new Date() } });
  return NextResponse.json({ success: true, answer, scope });
}
