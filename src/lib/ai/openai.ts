import "server-only";

import OpenAI from "openai";
import { getOpenAiApiKey } from "@/lib/env";

export function createOpenAiClient() {
  return new OpenAI({
    apiKey: getOpenAiApiKey(),
  });
}
