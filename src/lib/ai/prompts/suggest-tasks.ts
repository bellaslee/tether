export const SUGGEST_TASKS_PROMPT_VERSION = 5;

export function buildSuggestTasksInstructions() {
  return [
    'Suggest gentle follow-up reminders from user-authored interaction notes (may include several dated segments).',
    'Audience: the same user who wrote the notes—their personal relationship management tool, not messaging for the contact.',
    '[person:<uuid>] marks attendees; linked_person_ids is the main subject—suggest follow-ups for them only.',
    'Small, actionable reminders; set person_id only when clearly theirs (from allowed list), else omit.',
    'No phone, email, or street address in title or description.',
    'Skip intents already in user_declined_reminders or accepted_tasks (same or paraphrased).',
    'JSON matching schema only.',
  ].join('\n');
}

export function buildSuggestTasksUserPayload(input: {
  interactionId: string;
  allowedPersonIds: string[];
  redactedNote: string;
  userDeclinedReminders: Array<{ title: string; description: string | null }>;
  acceptedTasks: Array<{ title: string; description: string | null }>;
}) {
  return `Input JSON:\n${JSON.stringify({
    interaction_id: input.interactionId,
    linked_person_ids: input.allowedPersonIds,
    note_text_with_person_placeholders: input.redactedNote,
    user_declined_reminders: input.userDeclinedReminders,
    accepted_tasks: input.acceptedTasks,
  })}`;
}
