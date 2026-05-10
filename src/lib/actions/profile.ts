"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/db/server";
import { getAccountSupabaseContext } from "@/lib/account/context";
import { isValidIanaTimeZone } from "@/lib/timezones";

export type ProfileFormState = {
  error?: string;
  success?: string;
};

const MAX_NAME_LEN = 200;
const MIN_PASSWORD_LEN = 8;

function revalidateRoutesAffectedByAccountTimezone() {
  revalidatePath("/settings/profile");
  revalidatePath("/people", "layout");
  revalidatePath("/timeline");
  revalidatePath("/reminders");
  revalidatePath("/chat");
  revalidatePath("/interactions", "layout");
}

/** When auth metadata has no zone, persist the browser-reported IANA id (no-op if already set). */
export async function syncBrowserTimezoneIfUnsetAction(
  formData: FormData,
): Promise<{ synced: boolean }> {
  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    return { synced: false };
  }
  if (ctx.accountTimeZone) {
    return { synced: false };
  }

  const timezone = String(formData.get("timezone") ?? "").trim();
  if (!isValidIanaTimeZone(timezone)) {
    return { synced: false };
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.updateUser({
    data: { timezone },
  });

  if (error) {
    return { synced: false };
  }

  revalidateRoutesAffectedByAccountTimezone();
  return { synced: true };
}

export async function updateAccountNameAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    return { error: "Profile is not available in this environment." };
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  if (full_name.length > MAX_NAME_LEN) {
    return { error: `Use at most ${MAX_NAME_LEN} characters.` };
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.updateUser({
    data: { full_name },
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/profile");
  revalidatePath("/people", "layout");
  return { success: "Name saved." };
}

export async function updateAccountTimezoneAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    return { error: "Profile is not available in this environment." };
  }

  const timezone = String(formData.get("timezone") ?? "").trim();
  if (!isValidIanaTimeZone(timezone)) {
    return { error: "Choose a valid time zone." };
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.updateUser({
    data: { timezone },
  });

  if (error) {
    return { error: error.message };
  }

  revalidateRoutesAffectedByAccountTimezone();
  return { success: "Time zone saved." };
}

export async function updateAccountPasswordAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const ctx = await getAccountSupabaseContext();
  if (!ctx) {
    return { error: "Profile is not available in this environment." };
  }

  const password = String(formData.get("password") ?? "");
  const password_confirm = String(formData.get("password_confirm") ?? "");

  if (password.length < MIN_PASSWORD_LEN) {
    return {
      error: `Password must be at least ${MIN_PASSWORD_LEN} characters.`,
    };
  }
  if (password !== password_confirm) {
    return { error: "Passwords do not match." };
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.updateUser({ password });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/settings/profile");
  return { success: "Password updated." };
}
