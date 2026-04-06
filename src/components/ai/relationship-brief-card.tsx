'use client';

import Link from 'next/link';
import { useActionState, useCallback, useState } from 'react';
import { updateRelationshipSummaryContent } from '@/lib/actions/ai-memory/summaries';
import type { AiMemoryActionResult } from '@/lib/actions/ai-memory/types';
import type { Tables } from '@/lib/db/database.types';
import { Button } from '@/components/ui/button';
import { FieldError } from '@/components/ui/field-error';
import { FormTextarea } from '@/components/ui/form-textarea';
import { listRowCardClassName } from '@/components/ui/list-row-card';

type SummaryRow = Tables<'relationship_summaries'>;

function briefPreview(content: string, maxLen = 100) {
  const singleLine = content.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLen) return singleLine;
  return `${singleLine.slice(0, maxLen).trimEnd()}…`;
}

function SourceFootnote({
  summary,
  interactionLabels,
}: {
  summary: SummaryRow;
  interactionLabels: Record<string, string>;
}) {
  const intIds = summary.source_interaction_ids ?? [];
  const factCount = (summary.source_fact_ids ?? []).length;

  if (intIds.length === 0 && factCount === 0) {
    return null;
  }

  return (
    <p className="text-xs leading-relaxed text-muted">
      Grounded in{' '}
      {factCount > 0 ? (
        <>
          {factCount} accepted fact{factCount === 1 ? '' : 's'}
          {intIds.length > 0 ? ' and ' : ''}
        </>
      ) : null}
      {intIds.length > 0 ? (
        <>
          notes from{' '}
          {intIds.map((id, i) => (
            <span key={id}>
              {i > 0 ? ', ' : null}
              <Link
                href={`/people/${summary.person_id}`}
                className="font-medium text-accent underline-offset-4 hover:underline"
              >
                {interactionLabels[id] ?? 'a past note'}
              </Link>
            </span>
          ))}
        </>
      ) : null}
      .
    </p>
  );
}

type Props = {
  kindLabel: string;
  summary: SummaryRow;
  interactionLabels: Record<string, string>;
};

export function RelationshipBriefCard({
  kindLabel,
  summary,
  interactionLabels,
}: Props) {
  const [open, setOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const saveAction = useCallback(
    async (prev: AiMemoryActionResult, formData: FormData) => {
      const result = await updateRelationshipSummaryContent(prev, formData);
      if (result.ok) {
        setIsEditing(false);
      }
      return result;
    },
    [],
  );

  const [state, formAction, pending] = useActionState<
    AiMemoryActionResult,
    FormData
  >(saveAction, {});

  const preview = briefPreview(summary.content);
  const textareaKey = `${summary.id}-${summary.updated_at}`;

  return (
    <details
      className={`group min-w-0 ${listRowCardClassName('space-y-0')}`}
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 marker:hidden outline-none ring-accent/30 focus-visible:ring-2 [&::-webkit-details-marker]:hidden">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex min-w-0 items-center gap-2">
            <span
              className="inline-flex shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
              aria-hidden
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
            <span className="min-w-0 truncate text-xs font-semibold uppercase tracking-wide text-muted">
              {kindLabel}
            </span>
          </span>
          {!open ? (
            <span className="block min-w-0 truncate pl-6 text-sm text-muted">
              {preview}
            </span>
          ) : null}
        </span>
        {!isEditing && open ? (
          <span
            className="shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              Edit
            </Button>
          </span>
        ) : null}
      </summary>

      <div className="mt-4 space-y-3 border-t border-border-soft pt-4">
        {!isEditing ? (
          <>
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/90">
              {summary.content}
            </p>
            <SourceFootnote
              summary={summary}
              interactionLabels={interactionLabels}
            />
          </>
        ) : (
          <form action={formAction} className="space-y-2">
            <input type="hidden" name="summary_id" value={summary.id} />
            <FormTextarea
              key={textareaKey}
              name="content"
              rows={8}
              defaultValue={summary.content}
              fieldSize="compact"
              aria-label={`Edit ${kindLabel.toLowerCase()}`}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="submit"
                size="sm"
                variant="primary"
                disabled={pending}
              >
                Save
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghostSubtle"
                disabled={pending}
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
            </div>
            {state.error ? (
              <FieldError size="inline">{state.error}</FieldError>
            ) : null}
          </form>
        )}
      </div>
    </details>
  );
}
