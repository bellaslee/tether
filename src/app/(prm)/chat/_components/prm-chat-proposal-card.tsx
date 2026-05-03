'use client';

import { useMemo, useState, useTransition } from 'react';
import type { PersonOption } from '@/components/people/attendee-picker';
import { Button, buttonClassName } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { TextField } from '@/components/ui/text-field';
import { TextareaField } from '@/components/ui/textarea-field';
import { FormInput } from '@/components/ui/form-input';
import { FormTextarea } from '@/components/ui/form-textarea';
import { Picklist } from '@/components/ui/picklist';
import { formControlClassName } from '@/components/ui/form-control-classes';
import { listRowCardClassName } from '@/components/ui/list-row-card';
import { toNewInteractionDatetimeLocalInputValueInZone } from '@/lib/datetime';
import type { InteractionTypeOption } from '@/lib/interactions/type-options';
import { personShownName } from '@/lib/people/list-name';
import type { PrmChatProposal } from '@/lib/ai/schemas/prm-chat';
import type { PrmChatProposalWithClientId } from '@/lib/actions/prm-chat';
import { applyChatProposal } from '@/lib/actions/prm-chat';

type Props = {
  messageId: string;
  proposal: PrmChatProposalWithClientId;
  chatPeople: PersonOption[];
  chatCategories: { id: string; name: string }[];
  chatInteractionTypes: InteractionTypeOption[];
  momentWallZone: string;
  onCancel: () => void;
  onApplied: (summary: string) => void;
};

function stripClientId(p: PrmChatProposalWithClientId): PrmChatProposal {
  const { clientId, ...rest } = p;
  void clientId;
  return rest as PrmChatProposal;
}

function normalizeInteractionDraft(
  d: PrmChatProposal,
  wallZone: string,
): PrmChatProposal {
  if (d.kind !== 'create_interaction' && d.kind !== 'update_interaction') {
    return d;
  }
  const occurred =
    d.occurred_at_local?.trim() ||
    toNewInteractionDatetimeLocalInputValueInZone(wallZone);
  const attendeeBase = d.attendee_person_ids.filter((id) => id);
  if (d.kind === 'update_interaction') {
    const primary = d.primary_person_id?.trim() || null;
    return {
      ...d,
      occurred_at_local: occurred,
      primary_person_id: primary,
      attendee_person_ids: attendeeBase.filter((id) => id !== primary),
    };
  }
  const primaryCreate = d.primary_person_id?.trim() ?? '';
  return {
    ...d,
    occurred_at_local: occurred,
    primary_person_id: primaryCreate,
    attendee_person_ids: attendeeBase.filter((id) => id !== primaryCreate),
  };
}

export function PrmChatProposalCard({
  messageId,
  proposal,
  chatPeople,
  chatCategories,
  chatInteractionTypes,
  momentWallZone,
  onCancel,
  onApplied,
}: Props) {
  const [draft, setDraft] = useState<PrmChatProposal>(() => {
    let base = normalizeInteractionDraft(
      stripClientId(proposal),
      momentWallZone,
    );
    if (base.kind === 'create_person' && !base.category_id.trim() && chatCategories[0]) {
      base = { ...base, category_id: chatCategories[0].id };
    }
    if (
      (base.kind === 'create_interaction' || base.kind === 'update_interaction') &&
      !base.interaction_type_id.trim() &&
      chatInteractionTypes[0]
    ) {
      return { ...base, interaction_type_id: chatInteractionTypes[0].id };
    }
    return base;
  });

  const peopleSorted = useMemo(
    () =>
      [...chatPeople].sort((a, b) =>
        personShownName(a).localeCompare(personShownName(b), undefined, {
          sensitivity: 'base',
        }),
      ),
    [chatPeople],
  );

  const interactionTypeIdForMemo =
    draft.kind === 'create_interaction' || draft.kind === 'update_interaction'
      ? draft.interaction_type_id
      : '';

  const interactionTypeOptions = useMemo(() => {
    if (draft.kind !== 'create_interaction' && draft.kind !== 'update_interaction') {
      return chatInteractionTypes;
    }
    const id = interactionTypeIdForMemo;
    if (id && !chatInteractionTypes.some((t) => t.id === id)) {
      return [
        {
          id,
          name: 'Type from suggestion (not in your list — pick a match below)',
        },
        ...chatInteractionTypes,
      ];
    }
    return chatInteractionTypes;
  }, [chatInteractionTypes, draft.kind, interactionTypeIdForMemo]);

  const categoryIdForMemo =
    draft.kind === 'create_person' || draft.kind === 'update_person'
      ? draft.category_id
      : '';

  const categoryOptions = useMemo(() => {
    if (draft.kind !== 'create_person' && draft.kind !== 'update_person') {
      return chatCategories;
    }
    const id = categoryIdForMemo;
    if (id && !chatCategories.some((c) => c.id === id)) {
      return [
        { id, name: 'Category from suggestion — pick a match below' },
        ...chatCategories,
      ];
    }
    return chatCategories;
  }, [chatCategories, draft.kind, categoryIdForMemo]);

  const updatePersonIdForMemo = draft.kind === 'update_person' ? draft.person_id : '';

  const updatePersonSelectOptions = useMemo(() => {
    if (draft.kind !== 'update_person') {
      return [] as { id: string; label: string }[];
    }
    const base = peopleSorted.map((p) => ({
      id: p.id,
      label: personShownName(p),
    }));
    if (
      updatePersonIdForMemo &&
      !chatPeople.some((p) => p.id === updatePersonIdForMemo)
    ) {
      return [
        {
          id: updatePersonIdForMemo,
          label: 'Profile from suggestion — confirm below',
        },
        ...base,
      ];
    }
    return base;
  }, [draft.kind, updatePersonIdForMemo, peopleSorted, chatPeople]);
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  const title = useMemo(() => {
    switch (draft.kind) {
      case 'create_person':
        return 'Review: add someone';
      case 'update_person':
        return 'Review: update profile';
      case 'create_interaction':
        return 'Review: log a moment';
      case 'update_interaction':
        return 'Review: update moment';
      case 'create_fact':
        return 'Review: save a fact';
      case 'create_reminder':
        return 'Review: save a reminder';
      default:
        return 'Review suggested change';
    }
  }, [draft.kind]);

  const prefix = `${messageId}-${proposal.clientId}`;

  function updateDraft(next: PrmChatProposal) {
    setDraft(next);
    setError(undefined);
  }

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const res = await applyChatProposal(draft);
      if ('error' in res) {
        setError(res.error);
        return;
      }
      onApplied(res.message);
    });
  }

  return (
    <div className="card-surface rounded-2xl border border-border-soft p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border-soft pb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-muted">
          Confirm saves to your PRM, cancel discards this card.
        </p>
      </div>

      <div className="mt-4 space-y-4">
        {draft.kind === 'create_person' || draft.kind === 'update_person' ? (
          <>
            {draft.kind === 'update_person' ? (
              <div className="space-y-2">
                <label
                  htmlFor={`${prefix}-person`}
                  className="text-sm font-semibold text-foreground"
                >
                  Person
                </label>
                <Picklist
                  id={`${prefix}-person`}
                  required
                  value={draft.person_id}
                  onChange={(e) =>
                    updateDraft({ ...draft, person_id: e.target.value })
                  }
                >
                  {updatePersonSelectOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </Picklist>
              </div>
            ) : null}
            <TextField
              id={`${prefix}-full_name`}
              label="Full name"
              value={draft.full_name}
              onChange={(e) =>
                updateDraft({ ...draft, full_name: e.target.value })
              }
              required
            />
            <TextField
              id={`${prefix}-display_name`}
              label="Display name"
              value={draft.display_name ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  display_name: e.target.value.trim() || null,
                })
              }
            />
            <div className="space-y-2">
              <label
                htmlFor={`${prefix}-category`}
                className="text-sm font-semibold text-foreground"
              >
                Category
              </label>
              <Picklist
                id={`${prefix}-category`}
                required
                value={draft.category_id}
                onChange={(e) =>
                  updateDraft({ ...draft, category_id: e.target.value })
                }
              >
                {categoryOptions.length === 0 ? (
                  <option value="">Add categories under People first</option>
                ) : null}
                {categoryOptions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Picklist>
            </div>
            <div className="space-y-2">
              <label
                htmlFor={`${prefix}-status`}
                className="text-sm font-semibold text-foreground"
              >
                Status
              </label>
              <select
                id={`${prefix}-status`}
                className={formControlClassName({ size: 'default' })}
                value={draft.status}
                onChange={(e) =>
                  updateDraft({
                    ...draft,
                    status: e.target.value as typeof draft.status,
                  })
                }
              >
                <option value="active">Active</option>
                <option value="dormant">Dormant</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <TextField
              id={`${prefix}-pronouns`}
              label="Pronouns"
              value={draft.pronouns ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  pronouns: e.target.value.trim() || null,
                })
              }
            />
            <TextField
              id={`${prefix}-location`}
              label="Location"
              value={draft.location ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  location: e.target.value.trim() || null,
                })
              }
            />
            <TextField
              id={`${prefix}-occupation`}
              label="Occupation"
              value={draft.occupation ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  occupation: e.target.value.trim() || null,
                })
              }
            />
            <TextField
              id={`${prefix}-company`}
              label="Company"
              value={draft.company ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  company: e.target.value.trim() || null,
                })
              }
            />
            <TextareaField
              id={`${prefix}-how_you_met`}
              label="How you met"
              value={draft.how_you_met ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  how_you_met: e.target.value.trim() || null,
                })
              }
            />
            <TextareaField
              id={`${prefix}-relationship_context`}
              label="Relationship context"
              value={draft.relationship_context ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  relationship_context: e.target.value.trim() || null,
                })
              }
            />
            <TextField
              id={`${prefix}-birthday`}
              label="Birthday (free text)"
              value={draft.birthday ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  birthday: e.target.value.trim() || null,
                })
              }
            />
            <TextField
              id={`${prefix}-met_at`}
              label="Met at (YYYY-MM, optional)"
              value={draft.met_at ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  met_at: e.target.value.trim() || null,
                })
              }
            />
          </>
        ) : null}

        {draft.kind === 'create_interaction' || draft.kind === 'update_interaction' ? (
          <>
            {draft.kind === 'update_interaction' ? (
              <div className={listRowCardClassName('space-y-1.5 py-3 text-sm')}>
                <p className="font-medium text-foreground">Editing this moment</p>
                <p className="text-muted">
                  {draft.title?.trim() || 'Untitled'} · {draft.occurred_at_local}
                </p>
                {draft.raw_note?.trim() ? (
                  <p className="line-clamp-3 text-xs leading-relaxed text-muted">
                    {draft.raw_note.trim()}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-2">
              <label
                htmlFor={`${prefix}-primary`}
                className="text-sm font-semibold text-foreground"
              >
                Main person{' '}
                {draft.kind === 'create_interaction' ? (
                  <span className="font-normal text-muted">(required)</span>
                ) : (
                  <span className="font-normal text-muted">(optional)</span>
                )}
              </label>
              <Picklist
                id={`${prefix}-primary`}
                required={draft.kind === 'create_interaction'}
                value={
                  draft.kind === 'create_interaction'
                    ? draft.primary_person_id
                    : (draft.primary_person_id ?? '')
                }
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  if (draft.kind === 'create_interaction') {
                    updateDraft({
                      ...draft,
                      primary_person_id: raw,
                      attendee_person_ids: draft.attendee_person_ids.filter(
                        (id) => id !== raw,
                      ),
                    });
                  } else {
                    const nextPrimary = raw || null;
                    updateDraft({
                      ...draft,
                      primary_person_id: nextPrimary,
                      attendee_person_ids: draft.attendee_person_ids.filter(
                        (id) => id !== nextPrimary,
                      ),
                    });
                  }
                }}
              >
                {draft.kind === 'update_interaction' ? (
                  <option value="">None</option>
                ) : (
                  <option value="">Select main person</option>
                )}
                {peopleSorted.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personShownName(p)}
                  </option>
                ))}
              </Picklist>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Also with</p>
              {draft.kind === 'create_interaction' ? (
                <p className="text-xs text-muted">
                  Only people you named in your message should be checked here.
                </p>
              ) : null}
              {peopleSorted.filter((p) => p.id !== (draft.primary_person_id ?? '')).length ===
              0 ? (
                <p className="text-xs text-muted">
                  Add people under People to pick additional attendees.
                </p>
              ) : (
                <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {peopleSorted
                    .filter((p) => p.id !== (draft.primary_person_id ?? ''))
                    .map((p) => {
                      const cid = `${prefix}-att-${p.id}`;
                      return (
                        <li
                          key={p.id}
                          className={listRowCardClassName(
                            'flex items-center gap-3 py-2.5',
                          )}
                        >
                          <input
                            id={cid}
                            type="checkbox"
                            className="size-4 shrink-0 rounded border-border-soft text-foreground"
                            checked={draft.attendee_person_ids.includes(p.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const next = checked
                                ? [...draft.attendee_person_ids, p.id]
                                : draft.attendee_person_ids.filter((id) => id !== p.id);
                              updateDraft({
                                ...draft,
                                attendee_person_ids: [...new Set(next)].sort(),
                              });
                            }}
                          />
                          <label
                            htmlFor={cid}
                            className="cursor-pointer text-sm text-foreground"
                          >
                            {personShownName(p)}
                          </label>
                        </li>
                      );
                    })}
                </ul>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label
                  htmlFor={`${prefix}-occurred`}
                  className="text-sm font-semibold text-foreground"
                >
                  When
                </label>
                <FormInput
                  id={`${prefix}-occurred`}
                  type="datetime-local"
                  value={draft.occurred_at_local}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      occurred_at_local: e.target.value,
                    })
                  }
                  required
                />
                <p className="text-xs text-muted">
                  Same kind of control as logging a moment elsewhere — this value
                  is read as local wall time in {momentWallZone} when you
                  confirm.
                </p>
              </div>
              <div className="space-y-2">
                <label
                  htmlFor={`${prefix}-type_id`}
                  className="text-sm font-semibold text-foreground"
                >
                  Type
                </label>
                <Picklist
                  id={`${prefix}-type_id`}
                  required
                  value={draft.interaction_type_id}
                  onChange={(e) =>
                    updateDraft({
                      ...draft,
                      interaction_type_id: e.target.value,
                    })
                  }
                >
                  {interactionTypeOptions.length === 0 ? (
                    <option value="">No types — add one under settings</option>
                  ) : null}
                  {interactionTypeOptions.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </Picklist>
              </div>
            </div>
            <TextField
              id={`${prefix}-int_title`}
              label="Title"
              value={draft.title ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  title: e.target.value.trim() || null,
                })
              }
            />
            <TextareaField
              id={`${prefix}-raw_note`}
              label="Note"
              value={draft.raw_note ?? ''}
              onChange={(e) =>
                updateDraft({
                  ...draft,
                  raw_note: e.target.value.trim() || null,
                })
              }
            />
          </>
        ) : null}

        {draft.kind === 'create_fact' ? (
          <>
            <div className="space-y-2">
              <label
                htmlFor={`${prefix}-fact-person`}
                className="text-sm font-semibold text-foreground"
              >
                Who it&apos;s about
              </label>
              <Picklist
                id={`${prefix}-fact-person`}
                required
                value={draft.person_id}
                onChange={(e) =>
                  updateDraft({ ...draft, person_id: e.target.value })
                }
              >
                <option value="">Select…</option>
                {peopleSorted.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personShownName(p)}
                  </option>
                ))}
              </Picklist>
            </div>
            <TextareaField
              id={`${prefix}-fact-body`}
              label="What to remember"
              hint="Saved directly to this profile—no AI."
              fieldSize="compact"
              rows={3}
              required
              value={draft.fact_body}
              onChange={(e) =>
                updateDraft({ ...draft, fact_body: e.target.value })
              }
            />
          </>
        ) : null}

        {draft.kind === 'create_reminder' ? (
          <>
            <div className="space-y-2">
              <label
                htmlFor={`${prefix}-rem-person`}
                className="text-sm font-semibold text-foreground"
              >
                Who it&apos;s for
              </label>
              <Picklist
                id={`${prefix}-rem-person`}
                required
                value={draft.person_id}
                onChange={(e) =>
                  updateDraft({ ...draft, person_id: e.target.value })
                }
              >
                <option value="">Select…</option>
                {peopleSorted.map((p) => (
                  <option key={p.id} value={p.id}>
                    {personShownName(p)}
                  </option>
                ))}
              </Picklist>
            </div>
            <TextField
              id={`${prefix}-rem-title`}
              label="Reminder"
              hint="Shows as an active open loop you can complete or snooze."
              fieldSize="compact"
              required
              value={draft.reminder_title}
              onChange={(e) =>
                updateDraft({ ...draft, reminder_title: e.target.value })
              }
            />
            <div className="space-y-2">
              <label
                htmlFor={`${prefix}-rem-desc`}
                className="text-sm font-semibold text-foreground"
              >
                Details{' '}
                <span className="font-normal text-muted">(optional)</span>
              </label>
              <FormTextarea
                id={`${prefix}-rem-desc`}
                rows={2}
                fieldSize="compact"
                value={draft.reminder_description ?? ''}
                onChange={(e) =>
                  updateDraft({
                    ...draft,
                    reminder_description: e.target.value.trim() || null,
                  })
                }
                aria-label="Reminder details (optional)"
              />
            </div>
          </>
        ) : null}

        {error ? (
          <FieldError size="compact">{error}</FieldError>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-1">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="cursor-pointer"
            disabled={pending}
            onClick={confirm}
          >
            {pending ? 'Saving…' : 'Confirm'}
          </Button>
          <button
            type="button"
            className={buttonClassName({
              variant: 'secondaryMuted',
              size: 'sm',
              className: 'cursor-pointer',
            })}
            disabled={pending}
            onClick={onCancel}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
