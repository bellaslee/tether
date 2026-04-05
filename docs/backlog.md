# Backlog

Ideas and follow-ups that are not scheduled work yet.

## Features

- [x] enable timeline interaction editing
- [x] add relationship strength indicator (Cold, Warm, Hot)
- [ ] sort people cards by interaction date, added date, and met the person date
- [ ] filter by relationship strength
- [ ] fix suggest button placeholder taking up too much space

## User settings

- **Timezone** — Once there is a user settings page, let each user choose their
  own timezone. That setting should drive calendar-day boundaries for features
  that bucket by “day” (for example, category-change timeline notes that
  collapse updates within the same local day).

## Engineering / cleanup

- **Remove unused per-interaction AI actions if they stay dead** — After moving
  “Suggest facts” / “Suggest follow-ups” to the person Memory section
  (`extractFactsFromPersonRecentNotes`, `suggestTasksFromPersonRecentNotes` in
  `src/lib/actions/ai-memory.ts`), the older `extractFactsForInteraction` and
  `suggestTasksForInteraction` exports are kept for now. If nothing references
  them after a while (search the repo for those names), delete them and any
  now-only helpers to avoid duplicate code paths.
