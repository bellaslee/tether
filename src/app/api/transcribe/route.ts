import { NextResponse } from "next/server";
import { getCrmSupabaseContext } from "@/lib/crm/context";
import { tryCreateOpenAiClient } from "@/lib/ai/openai";
import { transcribeAudioFile } from "@/lib/ai/transcribe-audio";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  if (!(await getCrmSupabaseContext())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  try {
    const text = await transcribeAudioFile(openai, audio);
    return NextResponse.json({ text });
  } catch (err) {
    console.error("transcribe:", err);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 502 },
    );
  }
}
