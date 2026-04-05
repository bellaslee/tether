/**
 * Postgres-backed fields that must never appear in outbound LLM prompts.
 * Allowed identifiers: `people.id` (UUID), coarse enums like category/status when needed.
 *
 * @see docs/plans/phase-2-ai-memory-layer.md
 */
export const FORBIDDEN_PROMPT_PERSON_COLUMNS = [
  'full_name',
  'display_name',
  'birthday',
  'location',
  'pronouns',
  'occupation',
  'company',
  'how_you_met',
  'relationship_context',
  'met_at',
] as const;

export type ForbiddenPromptPersonColumn =
  (typeof FORBIDDEN_PROMPT_PERSON_COLUMNS)[number];
