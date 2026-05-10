import { z } from 'zod';
import type { PersonStatus } from '@/lib/db/database.types';

const personStatusZ = z.enum(['active', 'dormant', 'archived']);

/**
 * Flat proposal shape for OpenAI structured outputs (`responses.parse`).
 * JSON Schema must not use `oneOf` inside `proposals.items` — discriminated unions are rejected.
 */
export const chatProposalItemSchema = z.object({
  kind: z.enum([
    'create_person',
    'update_person',
    'create_interaction',
    'update_interaction',
    'create_fact',
    'create_reminder',
  ]),
  person_id: z.string().uuid().nullable().optional(),
  interaction_id: z.string().uuid().nullable().optional(),
  primary_person_id: z.string().uuid().nullable().optional(),
  attendee_person_ids: z.array(z.string().uuid()).nullable().optional(),
  full_name: z.string().nullable().optional(),
  display_name: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  status: personStatusZ.nullable().optional(),
  pronouns: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  how_you_met: z.string().nullable().optional(),
  relationship_context: z.string().nullable().optional(),
  birthday: z.string().nullable().optional(),
  met_at: z.string().nullable().optional(),
  occurred_at_local: z.string().nullable().optional(),
  interaction_type_id: z.string().uuid().nullable().optional(),
  title: z.string().nullable().optional(),
  raw_note: z.string().nullable().optional(),
  fact_body: z.string().nullable().optional(),
  reminder_title: z.string().nullable().optional(),
  reminder_description: z.string().nullable().optional(),
});

export const chatResultSchema = z.object({
  reply: z.string().min(1),
  proposals: z.array(chatProposalItemSchema).max(6),
});

export type ChatProposalItem = z.infer<typeof chatProposalItemSchema>;
export type ChatTurnResult = z.infer<typeof chatResultSchema>;

export type ChatProposalCreatePerson = {
  kind: 'create_person';
  full_name: string;
  display_name: string | null;
  category_id: string;
  status: PersonStatus;
  pronouns: string | null;
  location: string | null;
  occupation: string | null;
  company: string | null;
  how_you_met: string | null;
  relationship_context: string | null;
  birthday: string | null;
  met_at: string | null;
};

export type ChatProposalUpdatePerson = {
  kind: 'update_person';
  person_id: string;
  full_name: string;
  display_name: string | null;
  category_id: string;
  status: PersonStatus;
  pronouns: string | null;
  location: string | null;
  occupation: string | null;
  company: string | null;
  how_you_met: string | null;
  relationship_context: string | null;
  birthday: string | null;
  met_at: string | null;
};

export type ChatProposalCreateInteraction = {
  kind: 'create_interaction';
  /** Required: the person the user anchored the moment on. */
  primary_person_id: string;
  attendee_person_ids: string[];
  occurred_at_local: string;
  interaction_type_id: string;
  title: string | null;
  raw_note: string | null;
};

export type ChatProposalUpdateInteraction = {
  kind: 'update_interaction';
  interaction_id: string;
  primary_person_id: string | null;
  attendee_person_ids: string[];
  occurred_at_local: string;
  interaction_type_id: string;
  title: string | null;
  raw_note: string | null;
};

export type ChatProposalCreateFact = {
  kind: 'create_fact';
  person_id: string;
  fact_body: string;
};

export type ChatProposalCreateReminder = {
  kind: 'create_reminder';
  person_id: string;
  reminder_title: string;
  reminder_description: string | null;
};

export type ChatProposal =
  | ChatProposalCreatePerson
  | ChatProposalUpdatePerson
  | ChatProposalCreateInteraction
  | ChatProposalUpdateInteraction
  | ChatProposalCreateFact
  | ChatProposalCreateReminder;

export type ChatProposalWithClientId = ChatProposal & { clientId: string };

function nn(s: string | null | undefined): string | null {
  if (s == null) {
    return null;
  }
  const t = String(s).trim();
  return t.length > 0 ? t : null;
}

/** Turn API-shaped proposal into a strict domain proposal, or null if invalid for that kind. */
export function normalizeChatProposalItem(
  raw: ChatProposalItem,
): ChatProposal | null {
  const attendees = raw.attendee_person_ids ?? [];

  switch (raw.kind) {
    case 'create_person': {
      const full_name = (raw.full_name ?? '').trim();
      if (!full_name || !raw.category_id || !raw.status) {
        return null;
      }
      return {
        kind: 'create_person',
        full_name,
        display_name: nn(raw.display_name),
        category_id: raw.category_id,
        status: raw.status,
        pronouns: nn(raw.pronouns),
        location: nn(raw.location),
        occupation: nn(raw.occupation),
        company: nn(raw.company),
        how_you_met: nn(raw.how_you_met),
        relationship_context: nn(raw.relationship_context),
        birthday: nn(raw.birthday),
        met_at: nn(raw.met_at),
      };
    }
    case 'update_person': {
      const full_name = (raw.full_name ?? '').trim();
      if (!raw.person_id || !full_name || !raw.category_id || !raw.status) {
        return null;
      }
      return {
        kind: 'update_person',
        person_id: raw.person_id,
        full_name,
        display_name: nn(raw.display_name),
        category_id: raw.category_id,
        status: raw.status,
        pronouns: nn(raw.pronouns),
        location: nn(raw.location),
        occupation: nn(raw.occupation),
        company: nn(raw.company),
        how_you_met: nn(raw.how_you_met),
        relationship_context: nn(raw.relationship_context),
        birthday: nn(raw.birthday),
        met_at: nn(raw.met_at),
      };
    }
    case 'create_interaction': {
      const occurred = (raw.occurred_at_local ?? '').trim();
      const primary = (raw.primary_person_id ?? '').trim();
      if (!occurred || !raw.interaction_type_id || !primary) {
        return null;
      }
      const attendeeList = attendees.filter((id) => id && id !== primary);
      return {
        kind: 'create_interaction',
        primary_person_id: primary,
        attendee_person_ids: attendeeList,
        occurred_at_local: occurred,
        interaction_type_id: raw.interaction_type_id,
        title: nn(raw.title),
        raw_note: nn(raw.raw_note),
      };
    }
    case 'update_interaction': {
      const occurred = (raw.occurred_at_local ?? '').trim();
      if (!raw.interaction_id || !occurred || !raw.interaction_type_id) {
        return null;
      }
      return {
        kind: 'update_interaction',
        interaction_id: raw.interaction_id,
        primary_person_id: raw.primary_person_id ?? null,
        attendee_person_ids: attendees,
        occurred_at_local: occurred,
        interaction_type_id: raw.interaction_type_id,
        title: nn(raw.title),
        raw_note: nn(raw.raw_note),
      };
    }
    case 'create_fact': {
      const body = (raw.fact_body ?? '').trim();
      if (!raw.person_id || !body) {
        return null;
      }
      return {
        kind: 'create_fact',
        person_id: raw.person_id,
        fact_body: body,
      };
    }
    case 'create_reminder': {
      const title = (raw.reminder_title ?? '').trim();
      if (!raw.person_id || !title) {
        return null;
      }
      return {
        kind: 'create_reminder',
        person_id: raw.person_id,
        reminder_title: title,
        reminder_description: nn(raw.reminder_description),
      };
    }
    default:
      return null;
  }
}
