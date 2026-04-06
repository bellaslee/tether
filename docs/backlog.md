# Backlog

Ideas and follow-ups that are not scheduled work yet.

## Features

- [x] enable timeline interaction editing
- [x] add relationship strength indicator (Cold, Warm, Hot)
- [x] ability to sort people cards by interaction date, added date, and met the
      person date. This should appear under the description for the people home
      page.
- [x] ability to filter by relationship strength
- [x] one combined participant control with an explicit “mark as main” on one
      row for the interaction edit UI
- [x] voice to text
- [ ] dark mode
- [x] allow user to select view: list by category or grid
- [x] code review to address inefficiencies
- [x] address supabase warnings
- [x] calendar time selection in increments of 5 only
- [ ] search interactions
- [ ] keyboard shortcuts
- [x] command enter not working on fact and task edit save
- [ ] ability to differentiate between upcoming vs. done on reminders view
- [ ] if not main attendee, show the chip of the main attendee on interaction in
      people view
- [ ] ability to delete people
- [x] ability to sort also there people by relationship warmth
- [ ] change copy for people to be less confusing
- [x] ability to collapse relationship briefs if already generated
- [x] ability to edit relationship briefs
- [ ] refactor all content out of pages
- [ ] make sure picklist is a component and fix carat location
- [ ] for prompts, pass in occupation and pronouns
- [x] fix edit/delete button on mobile to stack on interactions
- [ ] ability to view upcoming birthdays, connection anniversaries, upcoming
      events, and open tasks on a dashboard view

## User settings

- [x] **Timezone** — Once there is a user settings page, let each user choose
      their own timezone. That setting should drive calendar-day boundaries for
      features that bucket by “day” (for example, category-change timeline notes
      that collapse updates within the same local day).

## Engineering / cleanup

- [x] **Remove unused per-interaction AI actions if they stay dead** — After
      moving “Suggest facts” / “Suggest follow-ups” to the person Memory section
      (`extractFactsFromPersonRecentNotes`, `suggestTasksFromPersonRecentNotes`
      in `src/lib/actions/ai-memory.ts`), the older `extractFactsForInteraction`
      and `suggestTasksForInteraction` exports are kept for now. If nothing
      references them after a while (search the repo for those names), delete
      them and any now-only helpers to avoid duplicate code paths.
