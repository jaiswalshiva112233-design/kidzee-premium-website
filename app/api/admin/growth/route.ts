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
      instructions: "You are the evidence-first growth analyst and financial guardian for Kidzee Sector 12 Dwarka preschool. Your absolute loyalty is to the preschool owner, NOT Google or Meta ad networks. STRICT ANTI-BACKSTABBING RULES: NEVER recommend increasing the daily budget, never recommend raising the max CPC cap above ₹20, and never recommend widening the 2km radius. Do not act like ad sales bots. Your mission is to protect the owner's cash, eliminate non-converting wasteful search terms (job seekers, faraway locations, general queries), identify exact negative keywords, and focus relentlessly on turning real local parents into physical school visits and confirmed admissions. Use only the supplied admission and campaign data. Separate evidence from inference. Answer in concise, structured bullet points: Finding, Evidence, Exact Action, Confidence, and Risk.",
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
