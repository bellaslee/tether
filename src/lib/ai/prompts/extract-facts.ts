import { PLAIN_TEXT_NO_MARKDOWN_GUARDRAIL } from '@/lib/ai/prompts/plain-text-output';

export const EXTRACT_FACTS_PROMPT_VERSION = 8;

export type LinkedPersonProfileForPrompt = {
  person_id: string;
  first_name: string | null;
  pronouns: string | null;
  occupation: string | null;
};

export function buildExtractFactsInstructions() {
  return [
    'Extract reviewable candidate facts for a personal relationship management tool from user-authored notes.',
    'Audience: the same user who wrote the notes—output is for their private review, not a third party.',
    'linked_people_profile lists each linked person by person_id with their first_name (for disambiguation) and optional pronouns/occupation for grammar and context only—do not emit pronouns or occupation as facts unless the note clearly states them.',
    'Multi-date notes OK. People appear in note_text_with_person_placeholders as [person:<uuid>] tokens.',
    'person_id on every fact MUST be one of linked_person_ids. Other attendees and any third parties referenced in the note belong to themselves only—their traits, interests, and life events are never the subject of another linked person\'s fact.',
    'GUARDRAIL: Only emit facts for a linked person whose first_name (case-insensitive) or [person:<uuid>] token actually appears in note_text_with_person_placeholders. If a linked person is not mentioned in the note, output no facts for them.',
    'Only what the text states or strongly supports—no inference, generalization, or note-summary-as-facts.',
    'One atomic idea per fact; one subject per fact (no multi-person facts unless schema allows).',
    'Prefer durable recall (bio, ties, prefs, goals, milestones). Skip mood, petty logistics, or fleeting state unless it marks a real event or ongoing situation.',
    'No invented contact info or missing specifics. If referent or claim is ambiguous, omit.',
    'Respect user_declined_facts and accepted_facts: no repeats or paraphrases; for accepted_facts, add only clearly new detail.',
    'Facts should stand alone when read later. Fewer high-confidence items beats noisy volume; empty output if none.',
    'Examples: "Lives in Chicago."; "Nonprofit job since last year."; "Dog named Mochi."; "Runs half marathons."; "Moved in with partner."',
    'JSON matching schema only.',
    PLAIN_TEXT_NO_MARKDOWN_GUARDRAIL,
  ].join('\n');
}

export function buildExtractFactsUserPayload(input: {
  interactionId: string;
  allowedPersonIds: string[];
  linkedPeopleProfile: LinkedPersonProfileForPrompt[];
  redactedNote: string;
  userDeclinedFacts: string[];
  acceptedFacts: string[];
}) {
  return `Input JSON:\n${JSON.stringify({
    interaction_id: input.interactionId,
    linked_person_ids: input.allowedPersonIds,
    linked_people_profile: input.linkedPeopleProfile,
    note_text_with_person_placeholders: input.redactedNote,
    user_declined_facts: input.userDeclinedFacts,
    accepted_facts: input.acceptedFacts,
  })}`;
}
