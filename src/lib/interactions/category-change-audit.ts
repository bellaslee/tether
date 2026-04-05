import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";
import { fetchInteractionIdsForUserPerson } from "@/lib/interactions/interaction-people-queries";

const CATEGORY_CHANGE_SLUG = "category_change";

function utcDatePrefix(iso: string) {
  return iso.slice(0, 10);
}

function todayUtcPrefix() {
  return new Date().toISOString().slice(0, 10);
}

/** New audit rows on the person's creation day use created_at so the timeline stays anchored to when they were added. */
function occurredAtForNewCategoryAudit(personCreatedAt: string) {
  const now = new Date().toISOString();
  if (utcDatePrefix(personCreatedAt) === utcDatePrefix(now)) {
    return personCreatedAt;
  }
  return now;
}

function parseFromName(title: string | null): string | null {
  if (!title) {
    return null;
  }
  const m = /^From "(.*)" to ".*"$/.exec(title.trim());
  return m?.[1] ?? null;
}

export async function syncCategoryChangeTimelineEntry(
  client: SupabaseClient<Database>,
  userId: string,
  personId: string,
  previousCategoryId: string,
  newCategoryId: string,
  personCreatedAt: string,
) {
  if (previousCategoryId === newCategoryId) {
    return;
  }

  const { data: typeRow, error: typeError } = await client
    .from("interaction_types")
    .select("id")
    .eq("user_id", userId)
    .eq("slug", CATEGORY_CHANGE_SLUG)
    .maybeSingle();

  if (typeError || !typeRow) {
    throw new Error(
      typeError?.message ??
        'Missing interaction type "Category change". Add it under Timeline types.',
    );
  }

  const { data: cats, error: catsError } = await client
    .from("person_categories")
    .select("id, name")
    .eq("user_id", userId)
    .in("id", [previousCategoryId, newCategoryId]);

  if (catsError || !cats || cats.length < 2) {
    throw new Error(catsError?.message ?? "Could not load category names.");
  }

  const nameById = new Map(cats.map((c) => [c.id, c.name]));
  const oldName = nameById.get(previousCategoryId);
  const newName = nameById.get(newCategoryId);
  if (!oldName || !newName) {
    throw new Error("Could not resolve category labels.");
  }

  const linksRes = await fetchInteractionIdsForUserPerson(
    client,
    userId,
    personId,
  );
  if ("error" in linksRes) {
    throw new Error(linksRes.error);
  }

  const linkIds = linksRes.ok;

  let auditRows: { id: string; occurred_at: string; title: string | null }[] =
    [];

  if (linkIds.length > 0) {
    const { data: rows, error: auditErr } = await client
      .from("interactions")
      .select("id, occurred_at, title")
      .eq("user_id", userId)
      .eq("interaction_type_id", typeRow.id)
      .in("id", linkIds);

    if (auditErr) {
      throw new Error(auditErr.message);
    }
    auditRows = rows ?? [];
  }

  const today = todayUtcPrefix();
  const todaysAudit = auditRows
    .filter((row) => utcDatePrefix(row.occurred_at) === today)
    .sort(
      (a, b) =>
        new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime(),
    )[0];

  const stableFrom = parseFromName(todaysAudit?.title ?? null) ?? oldName;
  const title = `From "${stableFrom}" to "${newName}"`;

  if (todaysAudit) {
    const { error: updErr } = await client
      .from("interactions")
      .update({
        title,
        counts_toward_last_touch: false,
      })
      .eq("id", todaysAudit.id)
      .eq("user_id", userId);

    if (updErr) {
      throw new Error(updErr.message);
    }
    return;
  }

  const occurredAt = occurredAtForNewCategoryAudit(personCreatedAt);

  const { data: created, error: insErr } = await client
    .from("interactions")
    .insert({
      user_id: userId,
      occurred_at: occurredAt,
      interaction_type_id: typeRow.id,
      direction: null,
      title,
      raw_note: null,
      counts_toward_last_touch: false,
    })
    .select("id")
    .single();

  if (insErr || !created) {
    throw new Error(insErr?.message ?? "Could not record category change.");
  }

  const { error: ipErr } = await client.from("interaction_people").insert({
    interaction_id: created.id,
    person_id: personId,
    role: "primary",
  });

  if (ipErr) {
    await client
      .from("interactions")
      .delete()
      .eq("id", created.id)
      .eq("user_id", userId);
    throw new Error(ipErr.message);
  }
}
