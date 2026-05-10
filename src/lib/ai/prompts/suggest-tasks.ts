import type { LinkedPersonProfileForPrompt } from '@/lib/ai/prompts/extract-facts';
import { PLAIN_TEXT_NO_MARKDOWN_GUARDRAIL } from '@/lib/ai/prompts/plain-text-output';

export const SUGGEST_TASKS_PROMPT_VERSION = 8;

export function buildSuggestTasksInstructions() {
  return [
    'Suggest gentle follow-up reminders from user-authored interaction notes (may include several dated segments).',
    'Audience: the same user who wrote the notes—their personal relationship management tool, not messaging for the contact.',
    'linked_people_profile lists each linked person by person_id with their first_name (for disambiguation) and optional pronouns/occupation for tone and context only.',
    'note_text_with_person_placeholders uses [person:<uuid>] tokens to mark attendees and any other people the user named.',
    'Set person_id to whichever linked person the reminder is about (must be one of linked_person_ids). Omit person_id only when the action is genuinely note-wide and not about any specific attendee.',
    'GUARDRAIL: Only emit follow-ups for a linked person whose first_name (case-insensitive) or [person:<uuid>] token actually appears in note_text_with_person_placeholders. If a linked person is not mentioned in the note, output no follow-ups for them.',
    'Other attendees and third parties referenced in the note belong to themselves only—never write a reminder about one linked person that is really about another person mentioned in the note.',
    'Small, actionable reminders.',
    'No phone, email, or street address in title or description.',
    'Skip intents already in user_declined_reminders or accepted_tasks (same or paraphrased).',
    'JSON matching schema only.',
    PLAIN_TEXT_NO_MARKDOWN_GUARDRAIL,
  ].join('\n');
}

export function buildSuggestTasksUserPayload(input: {
  interactionId: string;
  allowedPersonIds: string[];
  linkedPeopleProfile: LinkedPersonProfileForPrompt[];
  redactedNote: string;
  userDeclinedReminders: Array<{ title: string; description: string | null }>;
  acceptedTasks: Array<{ title: string; description: string | null }>;
}) {
  return `Input JSON:\n${JSON.stringify({
    interaction_id: input.interactionId,
    linked_person_ids: input.allowedPersonIds,
    linked_people_profile: input.linkedPeopleProfile,
    note_text_with_person_placeholders: input.redactedNote,
    user_declined_reminders: input.userDeclinedReminders,
    accepted_tasks: input.acceptedTasks,
  })}`;
}
