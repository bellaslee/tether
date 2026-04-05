export const SUGGEST_TASKS_PROMPT_VERSION = 1;

export function buildSuggestTasksInstructions() {
  return [
    'You suggest gentle follow-up reminders from user-authored interaction notes in a personal CRM (the text may include several dated segments from recent interactions).',
    'People appear only as UUIDs; the note may use [person:<uuid>] placeholders.',
    'Propose small, actionable reminders. When a task clearly belongs to one linked person, set person_id to their UUID from the allowed list; otherwise omit person_id.',
    'Do not include phone numbers, emails, or street addresses in titles or descriptions.',
    'Output only JSON matching the schema.',
  ].join('\n');
}

export function buildSuggestTasksUserPayload(input: {
  interactionId: string;
  allowedPersonIds: string[];
  redactedNote: string;
}) {
  return [
    'Input JSON:',
    JSON.stringify(
      {
        interaction_id: input.interactionId,
        linked_person_ids: input.allowedPersonIds,
        note_text_with_person_placeholders: input.redactedNote,
      },
      null,
      2,
    ),
  ].join('\n');
}
