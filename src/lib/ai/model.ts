import "server-only";

import { getOpenAiModel } from "@/lib/env";

export function defaultResponsesModel() {
  return getOpenAiModel();
}
