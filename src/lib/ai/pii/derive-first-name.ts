/**
 * Derive a first name from a person's `full_name` for use as a disambiguating
 * handle in LLM prompts. Returns the first whitespace-delimited token, trimmed,
 * or an empty string when the input is blank.
 *
 * We intentionally pass *only* the first name (no surname) to keep PII minimal
 * while giving the model a stable, human-readable label so it can attribute
 * facts and follow-ups to the correct linked person.
 */
export function deriveFirstNameFromFullName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return '';
  return trimmed.split(/\s+/)[0] ?? '';
}
