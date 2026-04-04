const publicSupabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publicSupabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const openAiApiKey = process.env.OPENAI_API_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const crmLocalDevBypassAuth = process.env.CRM_LOCAL_DEV_BYPASS_AUTH;
const crmLocalDevUserId = process.env.CRM_LOCAL_DEV_USER_ID;

function isNonEmpty(value: string | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/** True when cookie/session Supabase clients can be constructed without throwing. */
export function hasPublicSupabaseEnv() {
  return isNonEmpty(publicSupabaseUrl) && isNonEmpty(publicSupabaseAnonKey);
}

const uuidRe =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isTruthyEnv(value: string | undefined) {
  if (!isNonEmpty(value)) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

export function isLocalDevBypassAuthEnabled() {
  return (
    process.env.NODE_ENV === "development" &&
    isTruthyEnv(crmLocalDevBypassAuth) &&
    isNonEmpty(crmLocalDevUserId) &&
    uuidRe.test(crmLocalDevUserId.trim()) &&
    isNonEmpty(supabaseServiceRoleKey)
  );
}

export function assertLocalDevBypassAllowed() {
  if (process.env.NODE_ENV !== "development") {
    throw new Error("Local dev auth bypass is only allowed when NODE_ENV is development.");
  }
  if (!isTruthyEnv(crmLocalDevBypassAuth)) {
    throw new Error("Set CRM_LOCAL_DEV_BYPASS_AUTH=true to use the service role client locally.");
  }
  if (!isNonEmpty(crmLocalDevUserId) || !uuidRe.test(crmLocalDevUserId.trim())) {
    throw new Error(
      "Set CRM_LOCAL_DEV_USER_ID to a valid auth.users UUID when bypass is enabled.",
    );
  }
  if (!isNonEmpty(supabaseServiceRoleKey)) {
    throw new Error(
      "Set SUPABASE_SERVICE_ROLE_KEY from `npx supabase status` when bypass is enabled.",
    );
  }
}

export function getLocalDevBypassUserId() {
  assertLocalDevBypassAllowed();
  return crmLocalDevUserId!.trim();
}

export function getServiceRoleSupabaseEnv() {
  assertLocalDevBypassAllowed();
  const { url } = getPublicSupabaseEnv();
  if (!isNonEmpty(supabaseServiceRoleKey)) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY.");
  }
  return { serviceRoleKey: supabaseServiceRoleKey, url };
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
  const bypassReady =
    process.env.NODE_ENV === "development" &&
    isTruthyEnv(crmLocalDevBypassAuth) &&
    isNonEmpty(crmLocalDevUserId) &&
    uuidRe.test(crmLocalDevUserId.trim()) &&
    isNonEmpty(supabaseServiceRoleKey);

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
    {
      description: bypassReady
        ? "Optional local dev auth bypass is configured (service role + CRM_LOCAL_DEV_USER_ID)."
        : "Optional: set CRM_LOCAL_DEV_BYPASS_AUTH, CRM_LOCAL_DEV_USER_ID, and SUPABASE_SERVICE_ROLE_KEY to work without signing in locally.",
      label: "Local dev bypass (optional)",
      ready: bypassReady,
    },
  ] as const;
}
