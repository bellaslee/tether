'use client';

import { startTransition, useActionState, useCallback, useState } from 'react';
import type { AiMemoryActionResult } from '@/lib/actions/ai-memory/types';
import type { Tables } from '@/lib/db/database.types';
import { Button } from '@/components/ui/button';
import { ConfirmLightbox } from '@/components/ui/confirm-lightbox';
import { FormTextarea } from '@/components/ui/form-textarea';
import { FieldError } from '@/components/ui/field-error';
import { listRowCardClassName } from '@/components/ui/list-row-card';

type FactRow = Tables<'facts'>;

type Props = {
  fact: FactRow;
  action: (
    prev: AiMemoryActionResult,
    formData: FormData,
  ) => Promise<AiMemoryActionResult>;
};

function formatFactCreatedLine(iso: string) {
  const d = new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Added ${d}`;
}

function formatArchivedLine(iso: string) {
  const d = new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Archived ${d}`;
}

export function FactReviewForms({ fact, action }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmArchiveOpen, setConfirmArchiveOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(action, {});

  const isArchived = Boolean(fact.archived_at);
  const isAccepted = fact.review_status === 'accepted';
  const isCandidate = fact.review_status === 'candidate';

  const headerPrimary = isArchived
    ? formatArchivedLine(fact.archived_at ?? '')
    : isAccepted
      ? formatFactCreatedLine(fact.created_at)
      : isCandidate
        ? 'Candidate'
        : 'Dismissed';

  const headerClassName = isAccepted && !isArchived
    ? 'text-xs text-muted'
    : 'text-xs font-semibold uppercase tracking-wide text-muted';

  const textareaKey = `${fact.id}-${fact.updated_at}`;

  const submitDelete = useCallback(() => {
    const fd = new FormData();
    fd.set('fact_id', fact.id);
    fd.set('intent', 'delete');
    startTransition(() => {
      void formAction(fd);
    });
  }, [fact.id, formAction]);

  const submitArchive = useCallback(() => {
    const fd = new FormData();
    fd.set('fact_id', fact.id);
    fd.set('intent', 'archive');
    startTransition(() => {
      void formAction(fd);
    });
  }, [fact.id, formAction]);

  if (isArchived) {
    return (
      <div className={listRowCardClassName('space-y-3')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={headerClassName}>{headerPrimary}</span>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
          {fact.body}
        </p>
        <form action={formAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="fact_id" value={fact.id} />
          <Button
            type="submit"
            name="intent"
            value="unarchive"
            size="sm"
            variant="secondary"
            disabled={pending}
          >
            Restore
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghostSubtle"
            disabled={pending}
            onClick={() => setConfirmDeleteOpen(true)}
          >
            Delete
          </Button>
        </form>
        {state.error ? (
          <FieldError size="inline">{state.error}</FieldError>
        ) : null}
        <ConfirmLightbox
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          title="Delete this fact?"
          description="It will be removed from this profile. This can't be undone."
          confirmLabel="Delete"
          onConfirm={submitDelete}
        />
      </div>
    );
  }

  if (isAccepted && !isEditing) {
    return (
      <div className={listRowCardClassName('space-y-3')}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={headerClassName}>{headerPrimary}</span>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghostSubtle"
              onClick={() => setConfirmArchiveOpen(true)}
            >
              Archive
            </Button>
          </div>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
          {fact.body}
        </p>
        <ConfirmLightbox
          open={confirmArchiveOpen}
          onClose={() => setConfirmArchiveOpen(false)}
          title="Archive this fact?"
          description="It will move out of your active list and out of search until you restore it from the archive. Nothing is deleted."
          confirmLabel="Archive"
          onConfirm={() => {
            setConfirmArchiveOpen(false);
            submitArchive();
          }}
        />
      </div>
    );
  }

  return (
    <div className={listRowCardClassName('space-y-3')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={headerClassName}>{headerPrimary}</span>
      </div>
      <form action={formAction} className="space-y-2">
        <input type="hidden" name="fact_id" value={fact.id} />
        <FormTextarea
          key={textareaKey}
          name="body"
          rows={3}
          defaultValue={fact.body}
          fieldSize="compact"
          aria-label="Fact text"
        />
        <div className="flex flex-wrap gap-2">
          {isCandidate ? (
            <>
              <Button
                type="submit"
                name="intent"
                value="accept"
                size="sm"
                variant="primary"
                disabled={pending}
              >
                Accept
              </Button>
              <Button
                type="submit"
                name="intent"
                value="dismiss"
                size="sm"
                variant="ghostSubtle"
                disabled={pending}
              >
                Decline
              </Button>
            </>
          ) : (
            <>
              <Button
                type="submit"
                name="intent"
                value="save"
                size="sm"
                variant="secondary"
                disabled={pending}
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghostSubtle"
                disabled={pending}
                onClick={() => setConfirmDeleteOpen(true)}
              >
                Delete
              </Button>
            </>
          )}
        </div>
        {state.error ? (
          <FieldError size="inline">{state.error}</FieldError>
        ) : null}
      </form>
      {!isCandidate ? (
        <ConfirmLightbox
          open={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          title="Delete this fact?"
          description="It will be removed from this profile. This can't be undone."
          confirmLabel="Delete"
          onConfirm={submitDelete}
        />
      ) : null}
    </div>
  );
}
