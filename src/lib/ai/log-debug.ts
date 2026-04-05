import "server-only";

import { isAiDebugPromptsEnabled } from "@/lib/env";

export function logAiRequestDebug(label: string, payload: Record<string, unknown>) {
  if (!isAiDebugPromptsEnabled()) {
    return;
  }
  console.info(`[crm-ai-debug] ${label}`, payload);
}
