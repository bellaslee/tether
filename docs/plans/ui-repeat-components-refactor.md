# Repeat UI audit and shared React components

This ExecPlan is a living document. The sections `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` must be kept up to date as work proceeds.

Repository ExecPlan authoring rules live at `.agent/PLANS.md`. This document must be maintained in accordance with that file.

**Prerequisite (checked in):** The CRM UI is implemented under `src/app` and `src/components` per `AGENTS.md` and prior plans such as `docs/plans/phase-1-core-crm.md`. The stack is Next.js App Router, TypeScript, and Tailwind CSS. A shared button primitive already exists at `src/components/ui/button.tsx`.

---

## Purpose / Big Picture

After this work, **visually and behaviorally identical UI patterns** appear in **one place** as small, typed React components (or documented Tailwind class helpers) instead of being copy-pasted across pages and feature modules. A contributor can change the look of a **text field**, **inline error**, or **card shell** once and have every screen that uses it stay consistent. **End users** see the same warm, minimal CRM aesthetic everywhere, with fewer accidental inconsistencies (spacing, focus rings, error styling).

This is primarily a **maintainability and consistency** change. There may be no new user-facing features; success is measured by **reduced duplication**, **stable visuals** after refactors, and **clean page files** that compose named components rather than long repeated `className` strings.

**How to see it working:** Open people list, person detail, timeline, settings, auth forms, and management panels; confirm inputs, errors, and list rows still look and behave as before. Run `npm run lint` and `npm run build` with no new errors. Optionally use project search to confirm the longest duplicated `className` fragments appear only in shared modules.

**Documentation:** `AGENTS.md` at the repository root gains a **Design guide** subsection that records how to build UI in this product—tone, surfaces, forms, navigation, accessibility expectations, and which shared primitives in `src/components/ui/` to use—so humans and agents do not re-derive rules from scattered files.

---

## Progress

- [x] (2026-04-04) Complete Milestone A: inventory of repeated patterns and proposed component boundaries (document in this plan’s Artifacts section or Decision Log as the list stabilizes).
- [x] (2026-04-04) Complete Milestone B: add shared primitives under `src/components/ui/` (or agreed folder) with TypeScript props and accessibility defaults.
- [x] (2026-04-04) Complete Milestone C: migrate highest-impact call sites (forms and panels) to primitives; remove duplicate class strings.
- [x] (2026-04-04) Complete Milestone D: migrate remaining pages (`src/app`) and large route files; shrink `people/[id]/page.tsx` composition surface where repetition is structural. *(People list search migrated; `[id]/page.tsx` had no duplicated CRM input strings left to extract.)*
- [x] (2026-04-04) Complete Milestone E: add a **Design guide** section to `AGENTS.md` (repo root); align it with landed primitives and existing UI guidance elsewhere in that file.
- [x] (2026-04-04) Run `npm run lint` and `npm run build`; manual spot-check of auth, people, timeline, interactions, settings.

Use timestamps on items as they complete, per `.agent/PLANS.md`.

---

## Surprises & Discoveries

Document unexpected coupling (for example a “primitive” that needs server-only imports), Tailwind conflicts, or components that should stay local after all.

- Observation: No `clsx` / `tailwind-merge` was added; primitives concatenate classes like `button.tsx`. Optional `className` on controls may not override same-utility conflicts from size presets—call sites should prefer `fieldSize` over fighting padding with extra classes when possible.  
  Evidence: `src/components/ui/form-control-classes.ts`, `form-input.tsx`.
- Observation: `FormInput` / `FormTextarea` are server-safe (no `'use client'`) and work from the People page Server Component for the GET search field.  
  Evidence: `src/app/(crm)/people/page.tsx`.

---

## Decision Log

- **Decision:** Prefer **small presentational primitives** (`Input`, `Textarea`, `FieldError`, `FormCard`) over one giant “form layout” component unless repetition proves otherwise.  
  **Rationale:** Matches `AGENTS.md` guidance to keep route files as composition; primitives stay reusable across auth and CRM without forcing one layout.  
  **Date:** 2026-04-04 / User request

- **Decision:** Default new shared UI to **`src/components/ui/`** next to `button.tsx`; use route-local `src/app/.../_components/` only for UI that is **not** reused outside one route tree.  
  **Rationale:** `AGENTS.md` names `src/components` as the home for shared UI.  
  **Date:** 2026-04-04 / AGENTS.md

- **Decision:** Keep **Server Components as default**; add `'use client'` only on components that need browser-only APIs, client state, or event handlers. If a primitive wraps a native `<input>`, implement it as a thin forwardRef component that can be used from client forms; avoid pulling server-only modules into those files.  
  **Rationale:** Aligns with App Router defaults in `AGENTS.md`.  
  **Date:** 2026-04-04 / AGENTS.md

- **Decision:** When two panels share **structure and behavior** (not just colors), extract a **shared component**; when they only share **Tailwind tokens**, prefer a **`cn()` helper** or a single `className` constant in `src/components/ui/` rather than forcing abstraction.  
  **Rationale:** Avoids premature abstraction that obscures differences; still removes magic string drift.  
  **Date:** 2026-04-04 / ExecPlan

- **Decision:** Capture visual and UX conventions in **`AGENTS.md`** as a dedicated **Design guide** section rather than a new standalone doc unless the guide outgrows a single file.  
  **Rationale:** Agents and contributors already treat `AGENTS.md` as the product contract; keeping the guide there avoids a second source of truth and duplicates the warm, friend-first tone already stated in that file.  
  **Date:** 2026-04-04 / User request

---

## Outcomes & Retrospective

Summarize which primitives landed, approximate count of removed duplicate strings (or files touched), any intentional exceptions left inline, lessons about client vs server boundaries, and whether the **Design guide** in `AGENTS.md` stayed accurate after migration (update the guide in the same PR if drift appears). Update when the plan completes.

**Landed primitives** (under `src/components/ui/`): `form-control-classes.ts` (`formControlClassName`, sizes `default` | `compact` | `dense`), `field-error.tsx`, `form-input.tsx`, `form-textarea.tsx`, `text-field.tsx`, `textarea-field.tsx`, `list-row-card.tsx` (`listRowCardClassName`, `ListRowCard`, `ListRowCardLi`). Existing `button.tsx` unchanged.

**Migrations:** Auth forms, person form, interaction forms (person, global, edit disclosure), contact method add/row, attendee picker, person category field, manage categories / connection types / interaction types panels, person connections add form, people list search—plus centralized form error callouts.

**Intentional inline exceptions:** Checkbox/radio styling, chip-style borders (`interaction-meta-chips.tsx`), large `card-surface` shells, attendee row hover still composed via `listRowCardClassName` + extra utilities. Person detail and timeline routes did not duplicate the CRM text-input string after grep; no route-local `_components` extract was needed there for this pass.

**Design guide:** New **Design guide (shared UI)** section in `AGENTS.md` documents the above imports and file locations.

---

## Context and Orientation

**Next.js App Router** means route entry files live under `src/app/`. Many CRM screens are under `src/app/(crm)/`. **Server Components** are the default; **Client Components** are marked with `'use client'` at the top of the file.

**Tailwind CSS** means styling is expressed as `className` strings. **Duplication** here means the same long string (or same combination of utility classes) appears in multiple files, which makes redesigns error-prone.

**Existing shared UI:** `src/components/ui/button.tsx` is the established pattern for a variant-based control. Feature-level components live under `src/components/people/`, `src/components/interactions/`, `src/components/auth/`, `src/components/timeline/`, and `src/components/app/`.

**Known duplication hotspots (non-exhaustive, as of plan authoring):** A repeated **text input** style appears across `person-form.tsx`, `person-interaction-form.tsx`, `global-interaction-form.tsx`, `interaction-edit-disclosure.tsx`, `login-form.tsx`, `signup-form.tsx`, `attendee-picker.tsx`, `person-category-field.tsx`, `manage-categories-panel.tsx`, `manage-connection-types-panel.tsx`, `manage-interaction-types-panel.tsx`, `person-connections-panel.tsx`, and `people/page.tsx`. The pattern is along the lines of full width, `rounded-2xl`, `border-border-soft`, `bg-white/80`, padding, `text-sm`, and `ring-accent/30` on focus. **Error callouts** repeat `border-red-200 bg-red-50` with similar padding across forms. **List row shells** repeat `rounded-2xl border border-border-soft bg-white/60 px-4 py-3` in several manage panels and connection rows. **Smaller-radius** variants (`rounded-xl`, tighter padding) appear in `contact-method-add-form.tsx` and `contact-method-row.tsx`; decide whether to unify radii or expose a `size` variant on primitives. The person detail route `src/app/(crm)/people/[id]/page.tsx` is large and likely contains composition that could use shared **empty states**, **section headers**, or **cards** once those patterns are named.

**Terms:**

- **Primitive** means a low-level UI building block (input, label, error text) with minimal domain knowledge.

- **Composition** means a page or feature component arranges primitives and domain components without embedding long repeated markup.

- **`cn()`** means a small utility (often `clsx` plus `tailwind-merge`) that merges `className` strings safely; if the project already has one under `src/lib`, use it. If not, adding it is acceptable when it prevents conflicting Tailwind classes on merged props.

---

## Plan of Work

### Milestone A — Audit and naming

Systematically search `src/**/*.tsx` for repeated `className` fragments. Good mechanical signals include: identical strings spanning more than two files, repeated combinations like “rounded card + border + soft background,” and copy-pasted form field markup (`<label>` + `<input>` + error). Group findings into candidate primitives (for example `UiInput`, `UiTextarea`, `FieldError`, `SettingsCard`, `EmptyState`). For each group, record: **files affected**, **variations** (width, `rounded-xl` vs `rounded-2xl`, `resize-y`, optional `transition`), and whether the markup must stay in a **client** file because of hooks or events.

Deliverable: an ordered backlog in the **Decision Log** or **Artifacts** section (highest repetition first). Do not start coding primitives until at least the top three groups are agreed and named.

### Milestone B — Introduce primitives

Add components under `src/components/ui/` following the style of `button.tsx`: explicit prop types, `forwardRef` where refs must reach a native element, and sensible defaults for **accessibility** (associate labels and inputs with `htmlFor` / `id`, use `role="alert"` for errors where appropriate, do not remove focus rings). Prefer **variants** (size: default vs compact) over boolean props where `AGENTS.md` composition guidance would otherwise lead to `isCompact`, `isDense`, `isSearch`, etc. exploding—see internal skill **Vercel composition patterns** if boolean props accumulate.

Implement in small batches: for example `field-error.tsx`, `text-field.tsx`, `textarea-field.tsx`, then `panel-card.tsx` or `list-row-card.tsx` if those boundaries survived the audit.

### Milestone C — Migrate forms and panels

Replace inline class strings in auth forms, person forms, interaction forms, and the three “manage * panel” components. Keep **behavior identical** (same `name`, `defaultValue`, validation, server actions). After each file, run `npm run lint` on the touched path.

### Milestone D — Migrate pages and large routes

Refactor `src/app/(crm)/people/[id]/page.tsx`, `timeline/page.tsx`, `people/page.tsx`, and other routes where Milestone A found repetition. Target **readability**: page components should read as a short list of sections, not hundreds of lines of repeated markup. If a pattern is **only** used on one page but appears **many times** on that page, a **route-local** `_components/` file is appropriate.

### Milestone E — Design guide in `AGENTS.md`

Add a **Design guide** (or similarly titled) section to **`AGENTS.md`** at the repository root. It should be **self-contained for implementers**: enough that someone new can choose the right primitive and match the app’s character without reading every page source file.

Recommended contents (adjust to what the codebase actually provides after Milestone B):

- **Product tone and language:** Friend-first, warm, non-sales CRM; reuse and point to existing **UX Guardrails** / wording rules in `AGENTS.md` rather than contradicting them.

- **Layout and surfaces:** How pages use max-width, section spacing, and card-like regions; when to use shared shells versus one-off Tailwind. Reference real tokens if the app uses CSS variables or theme names (for example `border-border-soft`, `bg-white/80`).

- **Forms:** Standard pattern for label, control, helper text, and error; which **`src/components/ui/`** components to import; focus and error visibility expectations.

- **Navigation and wayfinding:** How `src/components/app/app-nav.tsx` (or successor) fits the shell; internal links via `next/link`.

- **Accessibility:** Heading hierarchy, labels, focus rings, alerts—aligned with the **UI and Accessibility Guidance** section already in `AGENTS.md`, with any project-specific examples.

- **Where code lives:** `src/components/ui/` for cross-route primitives; `src/components/<domain>/` for feature components; route-local `_components/` for single-route-only UI.

**Timing:** Draft a short outline after Milestone A if helpful; **fill in primitive names and import paths after Milestone B**; revise after Milestones C–D so the guide matches what shipped. The Progress checkbox for Milestone E is not complete until the guide reflects the final set of shared components (or explicitly lists deferred patterns).

---

## Concrete Steps

From the repository root (`personal-crm`), after substantive edits:

    npm run lint

    npm run build

For local visual verification:

    npm run dev

Then open `http://127.0.0.1:3000` (or the host shown in the terminal) and walk the CRM and auth routes. Compare key screens to a screenshot or to production before the refactor if available.

---

## Validation and Acceptance

**Lint and build:** `npm run lint` exits zero. `npm run build` completes without TypeScript errors.

**Behavior:** All existing forms submit as before; keyboard focus and tab order are unchanged or improved. Error messages still appear when server actions fail.

**Duplication:** The longest repeated input and error `className` strings from Milestone A are either removed or centralized; grep for a chosen signature string (for example `ring-accent/30 focus:ring-2` alongside `bg-white/80`) should show far fewer distinct files than before, with remaining hits mostly in `src/components/ui/`.

**Server vs client:** No accidental `'use client'` on large subtrees solely to use a primitive; primitives stay lean so Server Components can import them when they only wrap native elements.

**Design guide:** `AGENTS.md` includes the new section; every file path and component name mentioned there exists in the tree (or the guide states “planned” only if intentionally deferring—and then track in Progress).

---

## Idempotence and Recovery

Work is **safe to do incrementally**. Each merged primitive batch should leave the app in a working state. If a migration breaks a screen, revert the last file or restore the previous `className` on that element and narrow the primitive API. Git history is the primary rollback mechanism.

---

## Artifacts and Notes

**Audit summary (2026-04-04)**

| Pattern | Primitive(s) | Notes |
|--------|----------------|-------|
| CRM text input / select / textarea (soft border, focus ring, `bg-white/80` or compact `bg-white/90`) | `formControlClassName`, `FormInput`, `FormTextarea` | `fieldSize`: default (2xl, py-3), compact (xl, py-2), dense (flex row renames, py-2.5). |
| Label + input + hint + optional field error | `TextField`, `TextareaField` | `hintAfter` for copy below control (e.g. password rules). |
| Form-level / inline error callout | `FieldError` | Variants: default, compact, inline, textOnly. |
| Settings-style list row shell | `listRowCardClassName`, `ListRowCardLi` | Base `rounded-2xl border … bg-white/60 px-4 py-3`. |

**Highest-traffic files migrated:** `person-form.tsx`, `login-form.tsx`, `signup-form.tsx`, `person-interaction-form.tsx`, `global-interaction-form.tsx`, `interaction-edit-disclosure.tsx`, `contact-method-add-form.tsx`, `contact-method-row.tsx`, `attendee-picker.tsx`, `person-category-field.tsx`, `manage-categories-panel.tsx`, `manage-connection-types-panel.tsx`, `manage-interaction-types-panel.tsx`, `person-connections-panel.tsx`, `src/app/(crm)/people/page.tsx`.

---

## Interfaces and Dependencies

By the end of the refactor, expect **stable names** such as:

- `src/components/ui/field-error.tsx` — props: `children`, optional `id`, `className`; renders an alert-styled block.

- `src/components/ui/text-field.tsx` — props: extends native `input` attributes where appropriate; supports `label`, `error`, sizes; uses `forwardRef`.

- `src/components/ui/textarea-field.tsx` — same idea for `<textarea>` including `rows` / `resize` behavior.

Optional higher-level pieces if the audit supports them:

- `src/components/ui/panel-card.tsx` or `list-row.tsx` — consistent padded border surface for list items and settings rows.

Dependencies: reuse whatever **class merge** utility the repo already uses; if none exists, `clsx` and `tailwind-merge` are a common pair—add them only if justified by variant merging on primitives.

Do **not** introduce a heavy external component library unless the product owner asks; stay consistent with Tailwind-first `AGENTS.md` guidance.

---

## Revision history

- **2026-04-04:** Initial authoring. Created plan for audit and extraction of repeated UI into `src/components/ui/` primitives, with milestones and known duplication hotspots from current `src/**/*.tsx` search.

- **2026-04-04:** Added Milestone E and related Progress, Purpose, Validation, Decision Log, and Outcomes notes: author a **Design guide** section in **`AGENTS.md`**, timed after primitives land and revised after migrations.

- **2026-04-04:** Executed plan: added primitives, migrated forms/panels/people search, added **Design guide** to `AGENTS.md`, lint/build green.
