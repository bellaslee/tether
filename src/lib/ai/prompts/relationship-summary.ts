import type { RelationshipSummaryKind } from '@/lib/db/database.types';

export const RELATIONSHIP_SUMMARY_PROMPT_VERSION = 3;

function kindInstructions(kind: RelationshipSummaryKind) {
  if (kind === 'profile_brief') {
    return 'profile_brief: Warm, compact—who they are to the note author, what matters lately, stable context. Ground only in supplied facts and snippets.';
  }
  return 'next_meeting: Prep for the next conversation—threads to pick up, what to ask, what to remember. Five numbered lines, one topic per line. Ground only in supplied facts and snippets.';
}

export function buildRelationshipSummaryInstructions(
  kind: RelationshipSummaryKind,
) {
  return [
    'Personal relationship management tool brief. Audience: the user who captured these notes—private, first-person utility.',
    'Subject as UUID only; input uses [person:<uuid>] in snippets. Use those tokens grammatically as names; never say "UUID" in output (UI substitutes names).',
    'subject_pronouns and subject_occupation are optional profile hints for grammar and context only—ground claims in facts and snippets, not these fields alone.',
    'No structured PII (phone, email, street address, birth dates). No guessing beyond the supplied material.',
    kindInstructions(kind),
    'Output JSON: single field "content" (string).',
  ].join('\n');
}

export function buildRelationshipSummaryUserPayload(input: {
  subjectPersonId: string;
  categoryId: string;
  status: string;
  kind: RelationshipSummaryKind;
  subjectPronouns: string | null;
  subjectOccupation: string | null;
  acceptedFactLines: string[];
  recentNotes: Array<{
    interaction_id: string;
    occurred_at: string;
    redacted_note: string | null;
  }>;
}) {
  return `Input JSON:\n${JSON.stringify({
    subject_person_id: input.subjectPersonId,
    category_id: input.categoryId,
    person_status: input.status,
    summary_kind: input.kind,
    subject_pronouns: input.subjectPronouns,
    subject_occupation: input.subjectOccupation,
    accepted_facts: input.acceptedFactLines,
    recent_interactions: input.recentNotes,
  })}`;
}
