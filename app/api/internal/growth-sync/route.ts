import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { syncGrowthSources } from "@/lib/growth/sourceSync";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorised(request: Request) { const secret = process.env.GROWTH_SYNC_SECRET?.trim() ?? ""; const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? ""; return secret.length >= 32 && supplied.length === secret.length && timingSafeEqual(Buffer.from(secret), Buffer.from(supplied)); }
export async function POST(request: Request) { if (!authorised(request)) return NextResponse.json({ success: false }, { status: 401 }); try { return NextResponse.json({ success: true, ...(await syncGrowthSources()) }); } catch { return NextResponse.json({ success: false }, { status: 500 }); } }
