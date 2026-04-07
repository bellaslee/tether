import type { RelationshipSummaryKind } from '@/lib/db/database.types';

export const RELATIONSHIP_SUMMARY_PROMPT_VERSION = 4;

function kindInstructions(kind: RelationshipSummaryKind) {
  if (kind === 'profile_brief') {
    return 'profile_brief: Warm, compact—who they are to the note author, what matters lately, stable context. Ground only in supplied facts and snippets.';
  }
  return [
    'next_meeting: Prep for the next conversation—threads to pick up, what to ask, what to remember. Five numbered lines, one topic per line. Ground only in supplied facts and snippets.',
    'Use brief_reference_datetime_utc as "now" for all timing (how long since last touch, how soon until planned time).',
    'Weight subject_last_interaction (last past touch that counts toward last touch) and upcoming_interactions_with_subject (planned future rows for this person) when prioritizing what to mention and how urgent or stale topics feel.',
    'If upcoming_interactions_with_subject is empty, do not invent plans; still use last-touch timing vs reference date.',
  ].join(' ');
}

export function buildRelationshipSummaryInstructions(
  kind: RelationshipSummaryKind,
) {
  const lines = [
    'Personal relationship management tool brief. Audience: the user who captured these notes—private, first-person utility.',
    'Subject as UUID only; input uses [person:<uuid>] in snippets. Use those tokens grammatically as names; never say "UUID" in output (UI substitutes names).',
    'subject_pronouns and subject_occupation are optional profile hints for grammar and context only—ground claims in facts and snippets, not these fields alone.',
    'No structured PII (phone, email, street address, birth dates). No guessing beyond the supplied material.',
    kindInstructions(kind),
    'Output JSON: single field "content" (string).',
  ];
  if (kind === 'next_meeting') {
    lines.splice(
      4,
      0,
      'Temporal fields (brief_reference_datetime_utc, subject_last_interaction, upcoming_interactions_with_subject) are authoritative for scheduling context; recent_interactions are past snippets only.',
    );
  }
  return lines.join('\n');
}

export type RelationshipSummaryRecentNote = {
  interaction_id: string;
  occurred_at: string;
  redacted_note: string | null;
};

/** Past touch + planned rows for next_meeting briefs (subject-linked interactions only). */
export type PreMeetingTemporalPayload = {
  brief_reference_datetime_utc: string;
  subject_last_interaction: RelationshipSummaryRecentNote | null;
  upcoming_interactions_with_subject: RelationshipSummaryRecentNote[];
};

export function buildRelationshipSummaryUserPayload(input: {
  subjectPersonId: string;
  categoryId: string;
  status: string;
  kind: RelationshipSummaryKind;
  subjectPronouns: string | null;
  subjectOccupation: string | null;
  acceptedFactLines: string[];
  recentNotes: RelationshipSummaryRecentNote[];
  preMeetingTemporal?: PreMeetingTemporalPayload;
}) {
  const core = {
    subject_person_id: input.subjectPersonId,
    category_id: input.categoryId,
    person_status: input.status,
    summary_kind: input.kind,
    subject_pronouns: input.subjectPronouns,
    subject_occupation: input.subjectOccupation,
    accepted_facts: input.acceptedFactLines,
    recent_interactions: input.recentNotes,
    ...(input.preMeetingTemporal
      ? {
          brief_reference_datetime_utc:
            input.preMeetingTemporal.brief_reference_datetime_utc,
          subject_last_interaction:
            input.preMeetingTemporal.subject_last_interaction,
          upcoming_interactions_with_subject:
            input.preMeetingTemporal.upcoming_interactions_with_subject,
        }
      : {}),
  };
  return `Input JSON:\n${JSON.stringify(core)}`;
}
