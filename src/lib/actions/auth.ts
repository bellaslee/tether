"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/db/server";
import { isValidIanaTimeZone } from "@/lib/timezones";

export type AuthFormState = {
  error?: string;
};

export async function signUpAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const privacyAccepted = formData.get("privacy_accepted");
  const tzRaw = String(formData.get("timezone") ?? "").trim();
  const timezone = isValidIanaTimeZone(tzRaw) ? tzRaw : "UTC";
  if (!email || !password) {
    return { error: "Email and password are required." };
  }
  if (privacyAccepted !== "on") {
    return { error: "Please confirm you have read and agree to the Privacy Policy." };
  }

  const client = await createSupabaseServerClient();
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { timezone },
    },
  });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  if (!data.session) {
    redirect(`/signup/check-email?email=${encodeURIComponent(email)}`);
  }
  redirect("/people");
}

export async function signInAction(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const client = await createSupabaseServerClient();
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/people");
}

export async function signOutAction() {
  const client = await createSupabaseServerClient();
  await client.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/");
}
