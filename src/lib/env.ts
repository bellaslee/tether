const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL;
const crmAiDebugPrompts = process.env.CRM_AI_DEBUG_PROMPTS;

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** True when cookie/session Supabase clients can be constructed without throwing. */
export function hasPublicSupabaseEnv() {
  return isNonEmpty(publicSupabaseUrl) && isNonEmpty(publicSupabaseAnonKey);
}

export function isTruthyEnv(value: string | undefined) {
  if (!isNonEmpty(value)) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
}

export function getPublicSupabaseEnv() {
  if (!isNonEmpty(publicSupabaseUrl) || !isNonEmpty(publicSupabaseAnonKey)) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Add them to .env.local.',
    );
  }

  return {
    anonKey: publicSupabaseAnonKey,
    url: publicSupabaseUrl,
  };
}

export function hasOpenAiApiKey() {
  return isNonEmpty(openAiApiKey);
}

export function getOpenAiApiKey() {
  if (!isNonEmpty(openAiApiKey)) {
    throw new Error(
      'Missing OPENAI_API_KEY. Add it to .env.local before using AI features.',
    );
  }

  return openAiApiKey;
}

/** Default model for Responses API calls; override with OPENAI_MODEL. */
export function getOpenAiModel() {
  const m = openAiModel?.trim();
  return m && m.length > 0 ? m : 'gpt-4o-mini';
}

/** Development-only: log redacted AI request metadata (never logs full note text). */
export function isAiDebugPromptsEnabled() {
  return (
    process.env.NODE_ENV === 'development' && isTruthyEnv(crmAiDebugPrompts)
  );
}

export function getSetupStatus() {
  return [
    {
      description: isNonEmpty(publicSupabaseUrl)
        ? 'The browser-safe Supabase URL is available to the app.'
        : 'Add NEXT_PUBLIC_SUPABASE_URL after running `npx supabase status -o env`.',
      label: 'Supabase URL',
      ready: isNonEmpty(publicSupabaseUrl),
    },
    {
      description: isNonEmpty(publicSupabaseAnonKey)
        ? 'The browser-safe anon key is available for the shared Supabase client.'
        : 'Add NEXT_PUBLIC_SUPABASE_ANON_KEY from your local Supabase status output.',
      label: 'Supabase anon key',
      ready: isNonEmpty(publicSupabaseAnonKey),
    },
    {
      description: isNonEmpty(openAiApiKey)
        ? 'Server-side OpenAI wiring is ready for future extraction and summary features.'
        : 'Add OPENAI_API_KEY when you are ready to build AI features on top of the CRM.',
      label: 'OpenAI API key',
      ready: isNonEmpty(openAiApiKey),
    },
  ] as const;
}
