"use server";

import { revalidatePath } from "next/cache";
import type { ContactMethodType } from "@/lib/db/database.types";
import { getPrmSupabaseContext } from "@/lib/prm/context";
import { CONTACT_METHOD_TYPES } from "@/lib/domain/constants";

export type ActionResult = { error?: string; ok?: true };

function isContactMethodType(value: string): value is ContactMethodType {
  return CONTACT_METHOD_TYPES.includes(value as ContactMethodType);
}

async function assertOwnsPerson(personId: string) {
  const ctx = await getPrmSupabaseContext();
  if (!ctx) {
    return { error: "You need to sign in again." as const, ctx: null };
  }
  const { data, error } = await ctx.client
    .from("people")
    .select("id")
    .eq("id", personId)
    .eq("user_id", ctx.userId)
    .maybeSingle();
  if (error || !data) {
    return { error: "Person not found." as const, ctx: null };
  }
  return { ctx, error: undefined as undefined };
}

export async function createContactMethod(
  personId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const gate = await assertOwnsPerson(personId);
  if (!gate.ctx) {
    return { error: gate.error };
  }
  const { ctx } = gate;

  const typeRaw = String(formData.get("type") ?? "");
  const value = String(formData.get("value") ?? "").trim();
  const notes = optionalString(formData.get("notes"));
  const is_primary = formData.get("is_primary") === "on";

  if (!isContactMethodType(typeRaw)) {
    return { error: "Choose a valid contact type." };
  }
  if (!value) {
    return { error: "Value is required." };
  }

  if (is_primary) {
    const clear = await ctx.client
      .from("contact_methods")
      .update({ is_primary: false })
      .eq("person_id", personId);
    if (clear.error) {
      return { error: clear.error.message };
    }
  }

  const { error } = await ctx.client.from("contact_methods").insert({
    person_id: personId,
    type: typeRaw,
    value,
    notes,
    is_primary,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/people/${personId}`);
  return { ok: true };
}

export async function updateContactMethod(
  personId: string,
  methodId: string,
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const gate = await assertOwnsPerson(personId);
  if (!gate.ctx) {
    return { error: gate.error };
  }
  const { ctx } = gate;

  const typeRaw = String(formData.get("type") ?? "");
  const value = String(formData.get("value") ?? "").trim();
  const notes = optionalString(formData.get("notes"));

  if (!isContactMethodType(typeRaw)) {
    return { error: "Choose a valid contact type." };
  }
  if (!value) {
    return { error: "Value is required." };
  }

  const { error } = await ctx.client
    .from("contact_methods")
    .update({ type: typeRaw, value, notes })
    .eq("id", methodId)
    .eq("person_id", personId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/people/${personId}`);
  return { ok: true };
}

export async function deleteContactMethod(personId: string, methodId: string): Promise<ActionResult> {
  const gate = await assertOwnsPerson(personId);
  if (!gate.ctx) {
    return { error: gate.error };
  }
  const { ctx } = gate;

  const { error } = await ctx.client
    .from("contact_methods")
    .delete()
    .eq("id", methodId)
    .eq("person_id", personId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/people/${personId}`);
  return { ok: true };
}

export async function setPrimaryContactMethod(personId: string, methodId: string): Promise<ActionResult> {
  const gate = await assertOwnsPerson(personId);
  if (!gate.ctx) {
    return { error: gate.error };
  }
  const { ctx } = gate;

  const clear = await ctx.client
    .from("contact_methods")
    .update({ is_primary: false })
    .eq("person_id", personId);
  if (clear.error) {
    return { error: clear.error.message };
  }

  const { error } = await ctx.client
    .from("contact_methods")
    .update({ is_primary: true })
    .eq("id", methodId)
    .eq("person_id", personId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/people/${personId}`);
  return { ok: true };
}

function optionalString(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text.length > 0 ? text : null;
}

export async function setPrimaryContactMethodForm(formData: FormData) {
  const personId = String(formData.get("person_id") ?? "").trim();
  const methodId = String(formData.get("method_id") ?? "").trim();
  if (!personId || !methodId) {
    return;
  }
  await setPrimaryContactMethod(personId, methodId);
}

export async function deleteContactMethodForm(formData: FormData) {
  const personId = String(formData.get("person_id") ?? "").trim();
  const methodId = String(formData.get("method_id") ?? "").trim();
  if (!personId || !methodId) {
    return;
  }
  await deleteContactMethod(personId, methodId);
}
