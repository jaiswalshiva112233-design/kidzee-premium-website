import { NextRequest, NextResponse } from "next/server";

import { requireAdmin } from "@/lib/admin/auth";
import { buildGrowthSnapshot } from "@/lib/growth/analysis";
import { executeGrowthAi } from "@/lib/growth/aiControl";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (session.role !== "OWNER") {
      return NextResponse.json(
        { success: false, message: "Owner access is required." },
        { status: 403 },
      );
    }
    const body = (await request.json()) as { question?: unknown };
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 600) : "";
    if (!question) return NextResponse.json({ success: false, message: "Please enter a question." }, { status: 400 });
    const snapshot = await buildGrowthSnapshot(30);
    const result = await executeGrowthAi({
      scope: "CHAT",
      instructions: "You are the evidence-first growth analyst for one preschool. Use only the supplied admission data. The supplied dataset excludes recruitment, careers, internal staff traffic, test submissions, bots, spam and repeated submissions. Never invent spend, conversions or other missing data. Never blame the website automatically. Separate evidence from inference. If the sample is small, say insufficient data. Answer in concise, plain language with Finding, Evidence, Exact Action, Confidence and Risk. Optimise for genuine enquiries, visits and admissions, not clicks.",
      input: `Current 30-day snapshot:\n${JSON.stringify(snapshot)}\n\nOwner question:\n${question}`,
    });
    const insufficientData = snapshot.metrics.genuineVisitors < 20 || snapshot.metrics.leads < 5;
    await prisma.growthAnalysisRun.create({ data: {
      scope: "CHAT",
      status: result.text ? "COMPLETED" : result.disabled ? "AI_DISABLED" : "NO_PROVIDER_RESPONSE",
      question,
      evidence: JSON.parse(JSON.stringify(snapshot)),
      answer: result.text,
      provider: result.provider,
      model: result.model,
      insufficientData,
      createdById: session.userId,
      completedAt: new Date(),
    } });
    const scopeNotice = "Data scope: admission leads only; careers and internal/test traffic are excluded.";
    return NextResponse.json({ success: true, aiEnabled: !result.disabled, answer: `${scopeNotice}\n\n${result.text ?? (result.disabled ? "AI Analysis is OFF. CentreOS is still collecting every website, lead and conversion event. Turn AI Analysis on when you want this historical data analysed." : "The configured model did not return an answer. The evidence-based brief above remains available.")}` });
  } catch (error) {
    const status = error instanceof Error && error.message === "UNAUTHENTICATED" ? 401 : 500;
    return NextResponse.json({ success: false, message: "Growth analysis is temporarily unavailable." }, { status });
  }
}
