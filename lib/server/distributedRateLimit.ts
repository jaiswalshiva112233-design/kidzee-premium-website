import "server-only";

import { createHash } from "node:crypto";

import { prisma } from "@/lib/prisma";

type RateLimitInput = {
  scope: string;
  identifier: string;
  limit: number;
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function requestIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  ).slice(0, 120);
}

export async function consumeDistributedRateLimit({
  scope,
  identifier,
  limit,
  windowMs,
}: RateLimitInput): Promise<RateLimitResult> {
  if (!scope || !identifier || limit < 1 || windowMs < 1_000) {
    throw new Error("Invalid distributed rate-limit configuration.");
  }

  const nowMs = Date.now();
  const windowStartMs = Math.floor(nowMs / windowMs) * windowMs;
  const windowEndMs = windowStartMs + windowMs;
  const bucketKey = digest(`${scope}:${identifier}:${windowStartMs}`);

  const bucket = await prisma.rateLimitBucket.upsert({
    where: { bucketKey },
    create: {
      bucketKey,
      scope,
      windowStart: new Date(windowStartMs),
      windowEnd: new Date(windowEndMs),
      count: 1,
    },
    update: { count: { increment: 1 } },
    select: { count: true },
  });

  // Opportunistic cleanup is bounded and does not affect enforcement.
  if (bucket.count === 1 && bucketKey.endsWith("00")) {
    void prisma.rateLimitBucket
      .deleteMany({ where: { windowEnd: { lt: new Date(nowMs - 86_400_000) } } })
      .catch(() => undefined);
  }

  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterSeconds: Math.max(1, Math.ceil((windowEndMs - nowMs) / 1_000)),
  };
}
