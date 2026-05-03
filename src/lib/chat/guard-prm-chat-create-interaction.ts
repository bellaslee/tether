import 'server-only';

import type { PrmChatProposalCreateInteraction } from '@/lib/ai/schemas/prm-chat';

export type PersonMentionLite = {
  id: string;
  full_name: string;
  display_name: string | null;
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Heuristic: whether `message` plausibly refers to this person by full name,
 * display name, or first name (word-bounded, min length to reduce noise).
 */
export function personMentionedInMessage(
  message: string,
  full_name: string,
  display_name: string | null,
): boolean {
  const msg = message.toLowerCase();
  const full = full_name.trim().toLowerCase();
  if (full.length >= 3 && msg.includes(full)) {
    return true;
  }
  const disp = display_name?.trim().toLowerCase();
  if (disp && disp.length >= 2 && msg.includes(disp)) {
    return true;
  }
  const first = full.split(/\s+/)[0] ?? '';
  if (first.length >= 3) {
    const re = new RegExp(`\\b${escapeRegExp(first)}\\b`, 'i');
    if (re.test(message)) {
      return true;
    }
  }
  return false;
}

/**
 * Drops create_interaction proposals whose primary or attendees include people
 * not plausibly named in the triggering user message (same-turn guardrail).
 */
export function filterCreateInteractionByUserMessage(
  proposal: PrmChatProposalCreateInteraction,
  userMessage: string,
  people: readonly PersonMentionLite[],
): PrmChatProposalCreateInteraction | null {
  const msg = userMessage.trim();
  if (!msg) {
    return null;
  }
  const mentioned = new Set(
    people
      .filter((p) => personMentionedInMessage(msg, p.full_name, p.display_name))
      .map((p) => p.id),
  );
  const primary = proposal.primary_person_id?.trim() ?? '';
  if (!primary || !mentioned.has(primary)) {
    return null;
  }
  const attendees = proposal.attendee_person_ids.filter(
    (id) => id && id !== primary && mentioned.has(id),
  );
  return {
    ...proposal,
    primary_person_id: primary,
    attendee_person_ids: attendees,
  };
}
