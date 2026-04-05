export const EXTRACT_FACTS_PROMPT_VERSION = 2;

export function buildExtractFactsInstructions() {
  return [
    'You are extracting reviewable candidate facts for a personal relationship CRM from user-authored notes.',
    'The input may contain one or more dated interaction notes. People are identified only by UUID, and notes may refer to them using placeholders like [person:<uuid>].',
    'Extract only facts that are explicitly stated or strongly supported by the text. Do not infer, guess, or generalize beyond the note.',
    'Each fact must have exactly one subject. Set person_id to one allowed UUID from the input. Do not create relationship facts involving multiple subjects unless the schema explicitly supports that.',
    'Write each fact as a short, atomic, reviewable statement. One fact = one idea. Do not combine multiple details into a single fact.',
    'Prefer facts that are useful to remember across future interactions, such as biography, relationships, preferences, routines, goals, recurring activities, important life events, and durable context.',
    'Include past events only when they are meaningful personal history or likely to matter later, such as a move, graduation, breakup, job change, injury, loss, or milestone.',
    'Do not extract temporary or fast-expiring states, such as current mood, short-lived plans, minor scheduling details, or one-off logistical updates, unless they clearly represent an important event or ongoing situation.',
    'Do not invent contact details, identifiers, or missing specifics. If a fact would require guessing a phone number, email, address, date, or name, omit it.',
    'Do not restate the note as a summary. Extract distinct candidate facts only.',
    'Avoid duplicate, overlapping, or overly generic facts. If two facts say nearly the same thing, keep the more specific one.',
    'The input JSON may include user_declined_facts: short statements the user already declined for this same interaction. Do not output new facts that repeat, paraphrase, or re-derive the same information as any entry in that list, even if the note still mentions it.',
    'If the text is ambiguous about who a fact refers to, omit it.',
    'If the text is ambiguous or weakly suggestive, omit it rather than hedging.',
    'Output only valid structured JSON matching the schema and nothing else.',
    'Good facts should still make sense when read on their own, outside the original note.',
    'When possible, prefer durable identity/context facts over transient updates. A historical fact is acceptable if it describes a meaningful event in the person’s life history.',
    'Be selective. It is better to return fewer high-confidence facts than many low-value or overly personal ones.',
    'Examples of good facts:',
    '- "Lives in Chicago."',
    '- "Started a new job at a nonprofit last year."',
    '- "Has a dog named Mochi."',
    '- "Runs half marathons regularly."',
    '- "Recently moved in with their partner."',
    'Examples of bad facts:',
    '- "Seemed stressed."',
    '- "Might be thinking about changing jobs."',
    '- "Had dinner on Tuesday."',
    '- "Was busy this week."',
    '- "Talked about work and family."',
    'Return an empty output if there are no good facts to extract.',
  ].join('\n');
}

export function buildExtractFactsUserPayload(input: {
  interactionId: string;
  allowedPersonIds: string[];
  redactedNote: string;
  userDeclinedFacts: string[];
}) {
  return [
    'Input JSON:',
    JSON.stringify(
      {
        interaction_id: input.interactionId,
        linked_person_ids: input.allowedPersonIds,
        note_text_with_person_placeholders: input.redactedNote,
        user_declined_facts: input.userDeclinedFacts,
      },
      null,
      2,
    ),
  ].join('\n');
}
