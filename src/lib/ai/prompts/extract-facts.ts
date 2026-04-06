export const EXTRACT_FACTS_PROMPT_VERSION = 5;

export function buildExtractFactsInstructions() {
  return [
    'Extract reviewable candidate facts for a personal relationship management tool from user-authored notes.',
    'Audience: the same user who wrote the notes—output is for their private review, not a third party.',
    'Multi-date notes OK. People use [person:<uuid>]. linked_person_ids is the main subject—facts for them only, not other attendees.',
    'Only what the text states or strongly supports—no inference, generalization, or note-summary-as-facts.',
    'One atomic idea per fact; person_id must be one linked_person_ids entry; one subject per fact (no multi-person facts unless schema allows).',
    'Prefer durable recall (bio, ties, prefs, goals, milestones). Skip mood, petty logistics, or fleeting state unless it marks a real event or ongoing situation.',
    'No invented contact info or missing specifics. If referent or claim is ambiguous, omit.',
    'Respect user_declined_facts and accepted_facts: no repeats or paraphrases; for accepted_facts, add only clearly new detail.',
    'Facts should stand alone when read later. Fewer high-confidence items beats noisy volume; empty output if none.',
    'Examples: "Lives in Chicago."; "Nonprofit job since last year."; "Dog named Mochi."; "Runs half marathons."; "Moved in with partner."',
    'JSON matching schema only.',
  ].join('\n');
}

export function buildExtractFactsUserPayload(input: {
  interactionId: string;
  allowedPersonIds: string[];
  redactedNote: string;
  userDeclinedFacts: string[];
  acceptedFacts: string[];
}) {
  return `Input JSON:\n${JSON.stringify({
    interaction_id: input.interactionId,
    linked_person_ids: input.allowedPersonIds,
    note_text_with_person_placeholders: input.redactedNote,
    user_declined_facts: input.userDeclinedFacts,
    accepted_facts: input.acceptedFacts,
  })}`;
}
