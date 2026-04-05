export const EXTRACT_FACTS_PROMPT_VERSION = 1;

export function buildExtractFactsInstructions() {
  return [
    'You help a personal relationship CRM. Extract short, reviewable candidate facts from the user-authored note.',
    'People are identified only by UUID. The note may contain placeholders like [person:<uuid>] instead of names.',
    'Each fact must reference exactly one subject: set person_id to one of the allowed IDs from the JSON input.',
    'Do not invent contact details. If a fact would need a phone or email, omit it or refer abstractly without numbers.',
    'Output only structured JSON matching the schema. Use concise factual statements (one idea per fact).',
  ].join('\n');
}

export function buildExtractFactsUserPayload(input: {
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
