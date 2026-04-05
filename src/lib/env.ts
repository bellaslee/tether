const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openAiApiKey = process.env.OPENAI_API_KEY;
const openAiModel = process.env.OPENAI_MODEL;
const crmAiDebugPrompts = process.env.CRM_AI_DEBUG_PROMPTS;
const upstashRedisRestUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashRedisRestToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const crmDisableLlmRateLimit = process.env.CRM_DISABLE_LLM_RATE_LIMIT;
const publicCrmUsageTracking = process.env.NEXT_PUBLIC_CRM_USAGE_TRACKING;

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

/** Upstash REST credentials for @upstash/redis (LLM rate limiting). */
export function hasUpstashRedisForRateLimit() {
  return (
    isNonEmpty(upstashRedisRestUrl) && isNonEmpty(upstashRedisRestToken)
  );
}

/** When true, skips distributed LLM rate limits (emergency / local only). */
export function isCrmLlmRateLimitDisabled() {
  return isTruthyEnv(crmDisableLlmRateLimit);
}

/** Client + server: first-party usage / screen / LLM metadata logging. */
export function isCrmUsageTrackingEnabled() {
  return isTruthyEnv(publicCrmUsageTracking);
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
    {
      description:
        hasUpstashRedisForRateLimit() || isCrmLlmRateLimitDisabled()
          ? 'Upstash Redis is configured (or LLM rate limits are explicitly disabled).'
          : process.env.NODE_ENV !== 'production'
            ? 'Optional locally: add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for LLM rate limits.'
            : isNonEmpty(openAiApiKey)
              ? 'Production AI needs Upstash Redis for per-user LLM rate limits, or set CRM_DISABLE_LLM_RATE_LIMIT=true only if you accept the risk.'
              : 'Add Upstash credentials when you enable OpenAI in production.',
      label: 'LLM rate limits (Upstash)',
      ready:
        !isNonEmpty(openAiApiKey) ||
        hasUpstashRedisForRateLimit() ||
        isCrmLlmRateLimitDisabled() ||
        process.env.NODE_ENV !== 'production',
    },
  ] as const;
}
