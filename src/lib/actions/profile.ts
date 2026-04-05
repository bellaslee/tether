"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/db/server";
import { getPrmSupabaseContext } from "@/lib/prm/context";

export type ProfileFormState = {
  error?: string;
  success?: string;
};

const MAX_NAME_LEN = 200;
const MIN_PASSWORD_LEN = 8;

export async function updateAccountNameAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const ctx = await getPrmSupabaseContext();
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

export async function updateAccountPasswordAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const ctx = await getPrmSupabaseContext();
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
