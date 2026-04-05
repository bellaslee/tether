import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/db/database.types";

export async function refreshLastInteractionAtForPersonIds(
  client: SupabaseClient<Database>,
  userId: string,
  personIds: string[],
) {
  const unique = [...new Set(personIds.filter(Boolean))];
  for (const personId of unique) {
    const { data: links, error: linksError } = await client
      .from("interaction_people")
      .select("interaction_id")
      .eq("person_id", personId);

    if (linksError) {
      throw new Error(linksError.message);
    }

    const interactionIds = (links ?? []).map((row) => row.interaction_id);
    let lastAt: string | null = null;

    if (interactionIds.length > 0) {
      const nowIso = new Date().toISOString();
      const { data: latest, error: latestError } = await client
        .from("interactions")
        .select("occurred_at")
        .eq("user_id", userId)
        .eq("counts_toward_last_touch", true)
        .lte("occurred_at", nowIso)
        .in("id", interactionIds)
        .order("occurred_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestError) {
        throw new Error(latestError.message);
      }
      lastAt = latest?.occurred_at ?? null;
    }

    const { error: updateError } = await client
      .from("people")
      .update({ last_interaction_at: lastAt })
      .eq("id", personId)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(updateError.message);
    }
  }
}
