# Backlog

Ideas and follow-ups that are not scheduled work yet.

## Features

### Account and onboarding

- [ ] after sign up, show a clear message that email confirmation may be required
      before sign-in works (avoid a silent redirect to sign-in only)
- [ ] onboarding tutorial, guided tour, or in-app FAQ for first-time use
- [ ] ability to delete your own account

### People list, relationship memory, and person detail

- [ ] reduce perceived delay when switching person detail tabs (overview vs
      contact and connections, and similar)
- [ ] explain “relationship warmth” in the UI (what it measures and why it
      changes after interactions)
- [ ] surface in product how the relationship / profile brief is produced (AI vs
      rules, editable, refresh behavior) so users are not guessing
- [ ] ability to specify what kind of pre-meeting brief you want
- [ ] for prompts, pass in occupation and pronouns
- [x] add relationship strength indicator (Cold, Warm, Hot)
- [x] ability to sort people cards by interaction date, added date, and met the
      person date. This should appear under the description for the people home
      page.
- [x] ability to filter by relationship strength
- [x] allow user to select view: list by category or grid
- [x] ability to delete people
- [x] ability to sort also there people by relationship warmth
- [x] ability to collapse relationship briefs if already generated
- [x] ability to edit relationship briefs

### Interactions and timeline

- [ ] search interactions
- [ ] fix: default “when” date on log interaction so it matches the user’s
      current local calendar day (timezone / date-boundary bug)
- [ ] fix: set the default "when" time to the current time
- [ ] fix: the date met field shows one year into the future
- [ ] refactor: get rid of direction field in all interactions and the database
- [ ] feat: allow custom sorting of interaction types, like the categories
- [x] enable timeline interaction editing
- [x] one combined participant control with an explicit “mark as main” on one
      row for the interaction edit UI
- [x] voice to text
- [x] calendar time selection in increments of 5 only
- [x] if not main attendee, show the chip of the main attendee on interaction in
      people view

### Reminders, dashboard, and calendar

- [ ] ability to view upcoming birthdays, connection anniversaries, upcoming
      events, and open tasks on a dashboard view
- [ ] calendar view for timeline and/or reminders across people (complement to
      the existing list views)
- [x] ability to differentiate between upcoming vs. done on reminders view

### App-wide UX and components

- [ ] dark mode
- [ ] make sure picklist is a component and fix carat location
- [ ] keyboard shortcuts
- [x] command enter not working on fact and task edit save
- [x] fix edit/delete button on mobile to stack on interactions

### Reliability and codebase

- [x] code review to address inefficiencies
- [x] address supabase warnings
- [x] refactor all content out of all route pages so that they are loaded in from variables, which live near the top of each file.

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
