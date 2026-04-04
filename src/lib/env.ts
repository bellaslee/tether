const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openAiApiKey = process.env.OPENAI_API_KEY;

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function getPublicSupabaseEnv() {
  if (!isNonEmpty(publicSupabaseUrl) || !isNonEmpty(publicSupabaseAnonKey)) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local.",
    );
  }

  return {
    anonKey: publicSupabaseAnonKey,
    url: publicSupabaseUrl,
  };
}

export function getOpenAiApiKey() {
  if (!isNonEmpty(openAiApiKey)) {
    throw new Error("Missing OPENAI_API_KEY. Add it to .env.local before using AI features.");
  }

  return openAiApiKey;
}

export function getSetupStatus() {
  return [
    {
      description: isNonEmpty(publicSupabaseUrl)
        ? "The browser-safe Supabase URL is available to the app."
        : "Add NEXT_PUBLIC_SUPABASE_URL after running `npx supabase status -o env`.",
      label: "Supabase URL",
      ready: isNonEmpty(publicSupabaseUrl),
    },
    {
      description: isNonEmpty(publicSupabaseAnonKey)
        ? "The browser-safe anon key is available for the shared Supabase client."
        : "Add NEXT_PUBLIC_SUPABASE_ANON_KEY from your local Supabase status output.",
      label: "Supabase anon key",
      ready: isNonEmpty(publicSupabaseAnonKey),
    },
    {
      description: isNonEmpty(openAiApiKey)
        ? "Server-side OpenAI wiring is ready for future extraction and summary features."
        : "Add OPENAI_API_KEY when you are ready to build AI features on top of the CRM.",
      label: "OpenAI API key",
      ready: isNonEmpty(openAiApiKey),
    },
  ] as const;
}
