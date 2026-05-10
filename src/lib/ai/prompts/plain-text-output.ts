/**
 * Shared instruction for models: user-visible strings should not use Markdown
 * (UI renders plain text).
 */
export const PLAIN_TEXT_NO_MARKDOWN_GUARDRAIL =
  'GUARDRAIL — Plain text only in every user-visible string you output (assistant replies, summaries, fact bodies, reminder titles and descriptions, interaction titles and notes, and similar): do not use Markdown. No **bold**, _italic_, `code spans`, # headings, bullet lines starting with - or *, [label](url) links, or > blockquotes. Use normal sentences and line breaks. When instructions explicitly require numbered lines (e.g. next-meeting briefs), use only a digit, a period, and a space at the start of each line (1. …) with no other Markdown.';
