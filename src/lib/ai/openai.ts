import "server-only";

import OpenAI from "openai";
import { getOpenAiApiKey, hasOpenAiApiKey } from "@/lib/env";

export function createOpenAiClient() {
  return new OpenAI({
    apiKey: getOpenAiApiKey(),
  });
}

export function tryCreateOpenAiClient(): OpenAI | null {
  if (!hasOpenAiApiKey()) {
    return null;
  }
  return new OpenAI({ apiKey: getOpenAiApiKey() });
}
