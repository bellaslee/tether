import "server-only";

import { isAiDebugPromptsEnabled } from "@/lib/env";

export function logAiRequestDebug(label: string, payload: Record<string, unknown>) {
  if (!isAiDebugPromptsEnabled()) {
    return;
  }
  console.info(`[prm-ai-debug] ${label}`, payload);
}
