export const SUGGEST_TASKS_PROMPT_VERSION = 2;

export function buildSuggestTasksInstructions() {
  return [
    'You suggest gentle follow-up reminders from user-authored interaction notes in a personal CRM (the text may include several dated segments from recent interactions).',
    'People appear only as UUIDs; the note may use [person:<uuid>] placeholders.',
    'Propose small, actionable reminders. When a task clearly belongs to one linked person, set person_id to their UUID from the allowed list; otherwise omit person_id.',
    'Do not include phone numbers, emails, or street addresses in titles or descriptions.',
    'The input JSON may include user_declined_reminders: follow-ups the user already declined for this same interaction (title and optional description). Do not suggest reminders that repeat, paraphrase, or cover the same follow-up intent as any of those entries.',
    'Output only JSON matching the schema.',
  ].join('\n');
}

export function buildSuggestTasksUserPayload(input: {
  interactionId: string;
  allowedPersonIds: string[];
  redactedNote: string;
  userDeclinedReminders: Array<{ title: string; description: string | null }>;
}) {
  return [
    'Input JSON:',
    JSON.stringify(
      {
        interaction_id: input.interactionId,
        linked_person_ids: input.allowedPersonIds,
        note_text_with_person_placeholders: input.redactedNote,
        user_declined_reminders: input.userDeclinedReminders,
      },
      null,
      2,
    ),
  ].join('\n');
}
