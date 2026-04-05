import type { RelationshipSummaryKind } from '@/lib/db/database.types';

export const RELATIONSHIP_SUMMARY_PROMPT_VERSION = 1;

function kindInstructions(kind: RelationshipSummaryKind) {
  if (kind === 'profile_brief') {
    return [
      'Write a warm, compact profile-style brief: who they are to the user, what matters lately, and stable context.',
      'Use neutral language; do not guess private details. Ground claims in the provided facts and note snippets only.',
    ].join('\n');
  }
  return [
    'Write a practical next-meeting brief: what to ask about, open threads, and anything worth remembering for the next conversation.',
    'Stay grounded in the supplied facts and recent notes. Do not invent contact information.',
  ].join('\n');
}

export function buildRelationshipSummaryInstructions(
  kind: RelationshipSummaryKind,
) {
  return [
    'You help a personal relationship CRM. The subject person is identified only by UUID.',
    'You receive accepted facts (text only, no names required) and recent interaction snippets with [person:<uuid>] placeholders.',
    'Never include structured PII (phone, email, exact address, birth dates).',
    "Treat the UUIDs as the person's name gramatically, as they will be converted to display names locally in the UI.",
    "Do not use the word 'UUID' or anything related to it in the output.",
    kindInstructions(kind),
    'Output only JSON with a single "content" string field.',
  ].join('\n');
}

export function buildRelationshipSummaryUserPayload(input: {
  subjectPersonId: string;
  categoryId: string;
  status: string;
  kind: RelationshipSummaryKind;
  acceptedFactLines: string[];
  recentNotes: Array<{
    interaction_id: string;
    occurred_at: string;
    redacted_note: string | null;
  }>;
}) {
  return [
    'Input JSON:',
    JSON.stringify(
      {
        subject_person_id: input.subjectPersonId,
        category_id: input.categoryId,
        person_status: input.status,
        summary_kind: input.kind,
        accepted_facts: input.acceptedFactLines,
        recent_interactions: input.recentNotes,
      },
      null,
      2,
    ),
  ].join('\n');
}
