# Mobile reading comfort and horizontal overflow

This ExecPlan is a living document. The sections Progress, Surprises & Discoveries, Decision Log, and Outcomes & Retrospective must be kept up to date as work proceeds. Repository authoring rules for ExecPlans live in [.agent/PLANS.md](/.agent/PLANS.md) at the repository root; this document follows that guide.

## Purpose / Big Picture

People using Tether on a phone should be able to scroll vertically through People, a person profile, the timeline, and forms without the page growing wider than the screen. Long names, notes, and form fields should stay inside the viewport and wrap instead of forcing horizontal scroll. Category list cards should show the name on its own row with chips underneath on narrow widths, matching the grid view’s clarity, while wider screens keep the side‑by‑side layout.

After this work, open the app at a viewport width around 320 to 390 pixels (or use responsive mode in desktop browser devtools), visit `/people` in category view, open a person with a long name and long “how you met” text, and confirm there is no horizontal scrollbar. Form pages such as `/people/new` should show inputs that span the content area without sticking out past the padded shell.

## Progress

- [x] (2026-04-05) Audited `.prm-page` padding in `src/app/globals.css` against the sticky profile header in `src/components/people/person-detail-header.tsx` and aligned negative margins and width calc so the sticky strip matches the main shell at 1.5rem / 2.5rem / 3rem horizontal padding.
- [x] (2026-04-05) Updated `PeopleListItem` in `src/app/(prm)/people/page.tsx` so category (row) view stacks name and chips in a column below the `sm` breakpoint and restores the row layout from `sm` upward.
- [x] (2026-04-05) Hardened form controls in `src/components/ui/form-control-classes.ts` with `min-w-0 max-w-full`, added `min-w-0` to `TextField` and `TextareaField` wrappers, and tightened `PersonForm` grid with `min-w-0` and `minmax(0,1fr)` columns.
- [x] (2026-04-05) Added `min-width: 0` to `.prm-page` and `.prm-form-shell`, and `min-w-0` on `body` in `src/app/layout.tsx`, so flex descendants can shrink instead of overflowing.
- [x] (2026-04-05) Mobile-only reading tweaks: `max-sm:leading-8` on selected page lead paragraphs; `max-sm:leading-8` and `[overflow-wrap:anywhere]` on interaction note preview and long profile fields; `DetailItem` and interaction titles use safe wrapping.
- [x] (2026-04-05) Ran `npm run lint` from the repository root; ESLint completed with exit code 0.

## Surprises & Discoveries

- Observation: The sticky bar on the person profile used Tailwind spacing `mx-8` / `mx-14` / `mx-16` while `.prm-page` uses `1.5rem`, `2.5rem`, and `3rem` horizontal padding (Tailwind `6`, `10`, and `12`). That mismatch made the sticky strip wider than `<main>` and was a likely source of horizontal scroll on phones.

  Evidence: Compare `src/app/globals.css` `.prm-page` rules with the previous `PersonDetailHeader` classes (now updated to `-mx-6` / `sm:-mx-10` / `lg:-mx-12` and matching `w-[calc(...)]` and `px` values).

- Observation: In CSS flex and grid layouts, items default to `min-width: auto`, so a child with `width: 100%` may still refuse to shrink below its content width unless an ancestor sets `min-width: 0` (or `minmax(0, …)` in grid templates).

  Evidence: MDN and common flexbox overflow debugging; reflected in changes to form controls, shells, and `PersonForm`.

## Decision Log

- Decision: Use Tailwind `max-sm:` (below 640px) for typography tweaks so `sm` and up match prior desktop appearance.

  Rationale: The user asked to avoid changing desktop UI; `max-sm:` limits relaxed line-height and wrapping helpers to small viewports only.

  Date/Author: 2026-04-05 / implementation pass.

- Decision: Use `[overflow-wrap:anywhere]` for long user-generated strings (names, notes, titles) instead of only `break-words`.

  Rationale: `overflow-wrap: anywhere` can break long unbroken tokens where `break-word` might still overflow in edge cases.

  Date/Author: 2026-04-05 / implementation pass.

- Decision: Align sticky header bleed to `.prm-page` using `6` / `10` / `12` margin and padding steps, not the marketing layout’s `8` / `14` / `16`.

  Rationale: Person profile lives inside `.prm-page`; the sticky element must cancel exactly that padding to avoid horizontal overflow.

  Date/Author: 2026-04-05 / implementation pass.

## Outcomes & Retrospective

The implementation delivers aligned sticky header edges, responsive people list cards, form and shell overflow fixes, and small mobile-only line-height and wrapping improvements on high-traffic reading surfaces (people list lead copy, timeline and reminders intros, interaction notes, person profile context blocks, new/edit interaction and person intros). Desktop layouts at `sm` and above are intentionally unchanged aside from neutral fixes (wrapping long strings, grid `minmax`) that do not alter typical short-text layouts.

Follow-up ideas (not in scope here): shorten or stack the “Contact and Connections” tab label on very narrow screens; audit settings and marketing `src/app/page.tsx` with the same `max-sm:leading-8` pattern if phones feel tight there too.

## Context and Orientation

Tether is a Next.js App Router app. Authenticated CRM-style routes live under `src/app/(prm)/` and share `src/app/(prm)/layout.tsx`, which wraps pages in `AppNav`, usage provider, and footer. Most list and detail pages use the `.prm-page` class from `src/app/globals.css` for horizontal padding and max width. Form-heavy routes use `.prm-form-shell` with the same padding scale.

**People list** is implemented in `src/app/(prm)/people/page.tsx`. Each row is `PeopleListItem`, which takes a `variant` of `row` (category sections) or `stacked` (grid view).

**Person profile** uses `src/components/people/person-detail-header.tsx` for the sticky top area and `src/app/(prm)/people/[id]/page.tsx` for the main content.

**Shared form styling** comes from `src/components/ui/form-control-classes.ts`, consumed by `FormInput` and `FormTextarea`, and labeled wrappers in `text-field.tsx` and `textarea-field.tsx`.

**Tailwind breakpoints** use the default `sm` at 640px unless configured otherwise in this project.

## Plan of Work

First, fix the structural overflow: match the person profile sticky header’s negative horizontal margin and compensating width to the `.prm-page` padding at each breakpoint so nothing extends past the viewport. Then teach the people list row variant to use a column flex direction by default and switch to a horizontal layout only from `sm` upward, mirroring the stacked grid card behavior on phones.

Harden inputs by adding `min-w-0` and `max-w-full` to the shared form control class string so every text field and textarea can shrink inside flex and grid parents. Add `min-w-0` to the outer wrapper of `TextField` and `TextareaField`. On `PersonForm`, ensure the grid allows column shrink with `min-w-0` on the grid and `minmax(0, 1fr)` track sizing for two-column layouts at `sm`.

Add `min-width: 0` to `.prm-page` and `.prm-form-shell` in `globals.css`, and `min-w-0` on the document `body` in `src/app/layout.tsx`, so the flex column chain from body downward permits shrinking.

For reading comfort on small screens only, append `max-sm:leading-8` to lead paragraphs under main headings on People, Timeline, Reminders, and key form intros. Apply the same line-height bump and `[overflow-wrap:anywhere]` to `InteractionNotePreview` and to long prose blocks on the person profile (for example “how you met” and “relationship context”). Add `min-w-0` and wrapping on `DetailItem` values and on interaction titles in timeline rows so long content does not spill horizontally.

## Concrete Steps

From the repository root (`/Users/bella/Developer/projects/tether` or your clone), install dependencies if needed with `npm install`, then run:

    npm run lint

Expect ESLint to finish with no errors (exit code 0). To manually verify, run `npm run dev`, open `http://localhost:3000`, sign in if required, and resize the viewport below 640px width while visiting `/people`, a person profile, `/timeline`, and `/people/new`.

## Validation and Acceptance

- Run `npm run lint` from the repo root; expect success with exit code 0.

- With viewport width 375px or less and category view selected on `/people`, each person card shows the name first and the chip row below; from 640px width upward, the name and chips return to a horizontal arrangement with chips right-aligned.

- On a person profile, scrolling the page does not introduce a horizontal scrollbar; the sticky header background aligns with the main content edges without sticking out.

- On `/people/new` and `/people/[id]/edit`, text inputs and textareas stay within the padded column; no field extends past the visible content area.

- Long interaction notes and long profile text wrap within the card; interaction titles wrap instead of forcing overflow.

## Idempotence and Recovery

All changes are static UI and stylesheet edits. Re-running the same edits or reverting via git is safe. No database migrations or environment changes are required.

## Artifacts and Notes

Key files touched:

- `src/app/(prm)/people/page.tsx` — responsive list item layout; lead paragraph line-height on mobile.
- `src/components/people/person-detail-header.tsx` — sticky strip margin and width alignment.
- `src/app/globals.css` — `min-width: 0` on `.prm-page` and `.prm-form-shell`.
- `src/app/layout.tsx` — `min-w-0` on `body`.
- `src/components/ui/form-control-classes.ts`, `text-field.tsx`, `textarea-field.tsx` — overflow-safe controls.
- `src/components/people/person-form.tsx` — grid shrink behavior.
- `src/app/(prm)/people/[id]/page.tsx` — profile title wrapping, context prose, timeline row titles, `DetailItem`.
- `src/components/interactions/interaction-note-preview.tsx` — note line-height and wrapping on mobile.
- `src/app/(prm)/timeline/page.tsx`, `src/app/(prm)/reminders/page.tsx`, `src/app/(prm)/interactions/new/page.tsx`, `src/app/(prm)/people/new/page.tsx`, `src/app/(prm)/people/[id]/edit/page.tsx` — lead copy line-height where applicable.

## Interfaces and Dependencies

No new npm packages. Styling uses Tailwind utility classes and the existing `formControlClassName` helper. Breakpoints follow the default Tailwind `sm` preset (640px minimum width).

---

Revision note (2026-04-05): Initial version written after implementation of mobile overflow fixes and `max-sm` reading tweaks; documents decisions and file map for future contributors.
