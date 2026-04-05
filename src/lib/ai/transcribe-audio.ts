import "server-only";

import type OpenAI from "openai";

export const TRANSCRIBE_MODEL = "gpt-4o-mini-transcribe" as const;

export async function transcribeAudioFile(
  openai: OpenAI,
  file: File,
): Promise<string> {
  const result = await openai.audio.transcriptions.create({
    file,
    model: TRANSCRIBE_MODEL,
    response_format: "json",
  });
  return result.text ?? "";
}
