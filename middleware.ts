import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/db/database.types";

/** True when the request may carry a Supabase SSR session (chunked cookies use `.0`, `.1`, …). */
function requestMayHaveSupabaseSession(request: NextRequest): boolean {
  return request.cookies
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return supabaseResponse;
  }

  if (!requestMayHaveSupabaseSession(request)) {
    return supabaseResponse;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}

/** Refreshes the Supabase session cookie. PRM routes under `src/app/(prm)` enforce
 *  sign-in via `requirePrmAccess()` in the layout, not here.
 *
 *  When you add a new authenticated page or API that relies on refreshed cookies,
 *  add its path pattern here so session refresh still runs. */
export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/people/:path*",
    "/timeline/:path*",
    "/reminders/:path*",
    "/interactions/:path*",
    "/settings/:path*",
    "/api/transcribe",
  ],
};
