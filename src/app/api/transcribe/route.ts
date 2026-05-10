import { NextResponse } from "next/server";
import {
  enforceLlmRateLimits,
  getLlmRateLimitClientIpFromRequest,
} from "@/lib/ai/llm-rate-limit";
import { tryCreateOpenAiClient } from "@/lib/ai/openai";
import { transcribeAudioFile, TRANSCRIBE_MODEL } from "@/lib/ai/transcribe-audio";
import { getAccountSupabaseContext } from "@/lib/account/context";
import { recordLlmUsage } from "@/lib/usage/record-usage-event";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const account = await getAccountSupabaseContext();
  if (!account) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { client, userId } = account;

  const openai = tryCreateOpenAiClient();
  if (!openai) {
    return NextResponse.json(
      { error: "OpenAI is not configured" },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const audio = formData.get("audio");
  if (!audio || !(audio instanceof File)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  if (audio.size === 0) {
    return NextResponse.json({ error: "Empty audio file" }, { status: 400 });
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    return NextResponse.json({ error: "Audio file too large" }, { status: 413 });
  }

  const rateLimit = await enforceLlmRateLimits({
    userId,
    clientIp: getLlmRateLimitClientIpFromRequest(request),
  });
  if (!rateLimit.ok) {
    const retrySec = Math.max(1, Math.ceil(rateLimit.retryAfterMs / 1000));
    return NextResponse.json(
      { error: rateLimit.message },
      {
        status: 429,
        headers: { "Retry-After": String(retrySec) },
      },
    );
  }

  try {
    const text = await transcribeAudioFile(openai, audio);
    recordLlmUsage(client, "transcribe", {
      model: TRANSCRIBE_MODEL,
      ok: true,
    });
    return NextResponse.json({ text });
  } catch (err) {
    recordLlmUsage(client, "transcribe", {
      model: TRANSCRIBE_MODEL,
      ok: false,
      error_code: "transcribe_failed",
    });
    console.error("transcribe:", err);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 502 },
    );
  }
}
