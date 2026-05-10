/**
 * Postgres-backed fields that must never appear in outbound LLM prompts.
 * Allowed identifiers: `people.id` (UUID), coarse enums like category/status when needed.
 *
 * **Account login email:** The signed-in user's auth email (`AccountSupabaseContext.accountEmail`)
 * must never be concatenated into LLM instructions, user messages, or metadata sent to the model.
 * AI server actions use `AccountContextForLlmActions` (client + userId only) so email is not in scope.
 * User-authored note text may still contain any string the user typed; do not inject the account email from session.
 *
 * @see docs/plans/phase-2-ai-memory-layer.md
 */
export const FORBIDDEN_PROMPT_PERSON_COLUMNS = [
  'full_name',
  'display_name',
  'birthday',
  'location',
  'company',
  'how_you_met',
  'relationship_context',
  'met_at',
] as const;

export type ForbiddenPromptPersonColumn =
  (typeof FORBIDDEN_PROMPT_PERSON_COLUMNS)[number];
