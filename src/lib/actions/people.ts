"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { PersonCategory, PersonStatus } from "@/lib/db/database.types";
import { getCrmSupabaseContext } from "@/lib/crm/context";
import { PERSON_CATEGORIES, PERSON_STATUSES } from "@/lib/domain/constants";

export type ActionResult = { error?: string; ok?: true };

function isPersonCategory(value: string): value is PersonCategory {
  return PERSON_CATEGORIES.includes(value as PersonCategory);
}

function isPersonStatus(value: string): value is PersonStatus {
  return PERSON_STATUSES.includes(value as PersonStatus);
}

export async function createPerson(_prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: "You need to sign in again." };
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "");
  const statusRaw = String(formData.get("status") ?? "active");
  const preferred_name = optionalString(formData.get("preferred_name"));
  const pronouns = optionalString(formData.get("pronouns"));
  const location = optionalString(formData.get("location"));
  const occupation = optionalString(formData.get("occupation"));
  const company = optionalString(formData.get("company"));
  const how_you_met = optionalString(formData.get("how_you_met"));
  const relationship_context = optionalString(formData.get("relationship_context"));
  const birthday = optionalString(formData.get("birthday"));

  if (!full_name) {
    return { error: "Name is required." };
  }
  if (!isPersonCategory(categoryRaw)) {
    return { error: "Choose a valid category." };
  }
  if (!isPersonStatus(statusRaw)) {
    return { error: "Choose a valid status." };
  }

  const { data, error } = await ctx.client
    .from("people")
    .insert({
      user_id: ctx.userId,
      full_name,
      category: categoryRaw,
      status: statusRaw,
      preferred_name,
      pronouns,
      location,
      occupation,
      company,
      how_you_met,
      relationship_context,
      birthday: birthday || null,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { error: error?.message ?? "Could not create person." };
  }

  revalidatePath("/people");
  redirect(`/people/${data.id}`);
}

export async function updatePersonFormAction(
  personId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  return updatePerson(personId, _prev, formData);
}

export async function updatePerson(personId: string, _prev: ActionResult, formData: FormData): Promise<ActionResult> {
  const ctx = await getCrmSupabaseContext();
  if (!ctx) {
    return { error: "You need to sign in again." };
  }

  const full_name = String(formData.get("full_name") ?? "").trim();
  const categoryRaw = String(formData.get("category") ?? "");
  const statusRaw = String(formData.get("status") ?? "active");
  const preferred_name = optionalString(formData.get("preferred_name"));
  const pronouns = optionalString(formData.get("pronouns"));
  const location = optionalString(formData.get("location"));
  const occupation = optionalString(formData.get("occupation"));
  const company = optionalString(formData.get("company"));
  const how_you_met = optionalString(formData.get("how_you_met"));
  const relationship_context = optionalString(formData.get("relationship_context"));
  const birthday = optionalString(formData.get("birthday"));

  if (!full_name) {
    return { error: "Name is required." };
  }
  if (!isPersonCategory(categoryRaw)) {
    return { error: "Choose a valid category." };
  }
  if (!isPersonStatus(statusRaw)) {
    return { error: "Choose a valid status." };
  }

  const { error } = await ctx.client
    .from("people")
    .update({
      full_name,
      category: categoryRaw,
      status: statusRaw,
      preferred_name,
      pronouns,
      location,
      occupation,
      company,
      how_you_met,
      relationship_context,
      birthday: birthday || null,
    })
    .eq("id", personId)
    .eq("user_id", ctx.userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/people");
  revalidatePath(`/people/${personId}`);
  revalidatePath(`/people/${personId}/edit`);
  return { ok: true };
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}
