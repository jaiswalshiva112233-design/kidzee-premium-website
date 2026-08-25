import "server-only";

import { executeGrowthAi } from "@/lib/growth/aiControl";

type AiPurpose = "mira" | "growth";

export async function createOpenAiResponse(options: {
  purpose: AiPurpose;
  instructions: string;
  input: string;
}) {
  const result = await executeGrowthAi({
    scope: options.purpose === "mira" ? "MIRA" : "CHAT",
    instructions: options.instructions,
    input: options.input,
  });
  return result.text;
}
