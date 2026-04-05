'use client';

import { useCallback, useState } from 'react';
import { updateCrmTask, updateFactReview } from '@/lib/actions/ai-memory';
import { FactReviewForms } from '@/components/ai/fact-review-forms';
import {
  ManualFactForm,
  ManualReminderForm,
} from '@/components/ai/manual-memory-add-forms';
import {
  SuggestFactsControl,
  SuggestFollowUpsControl,
} from '@/components/ai/person-memory-ai-toolbar';
import { TaskReviewForms } from '@/components/ai/task-review-forms';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/lib/db/database.types';

const memoryCardClass =
  'card-surface flex min-h-0 h-full min-w-0 flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8';

type FactRow = Tables<'facts'>;
type TaskRow = Tables<'tasks'>;

type FactsProps = {
  personId: string;
  aiEnabled: boolean;
  hasRecentNotes: boolean;
  facts: FactRow[];
};

export function PersonFactsMemorySection({
  personId,
  aiEnabled,
  hasRecentNotes,
  facts,
}: FactsProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const onSaved = useCallback(() => setAddOpen(false), []);
  const startAdd = () => {
    setFormKey((k) => k + 1);
    setAddOpen(true);
  };

  return (
    <section
      className={memoryCardClass}
      aria-labelledby="person-memory-facts-heading"
    >
      <header className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2
            id="person-memory-facts-heading"
            className="font-display text-2xl tracking-tight text-foreground"
          >
            Facts
          </h2>
          <p className="mt-1 text-sm text-muted">
            Review and accept what you want to keep on this profile.
          </p>
        </div>
        <div className="min-w-0 shrink-0">
          <div className="flex w-full min-w-0 flex-row flex-wrap items-start justify-end gap-2">
            {!addOpen ? (
              <Button
                type="button"
                variant="secondaryMuted"
                size="sm"
                onClick={startAdd}
              >
                Add fact
              </Button>
            ) : null}
            <SuggestFactsControl
              personId={personId}
              aiEnabled={aiEnabled}
              hasRecentNotes={hasRecentNotes}
            />
          </div>
        </div>
      </header>
      <div className="mt-6 min-h-0 flex-1 space-y-4">
        {addOpen ? (
          <ManualFactForm
            key={formKey}
            personId={personId}
            onCancel={() => setAddOpen(false)}
            onSaved={onSaved}
          />
        ) : null}
        {facts.length === 0 && !addOpen ? (
          <p className="text-sm text-muted">
            <span className="font-medium text-foreground/80">Add fact</span> to
            capture something yourself, or use{' '}
            <span className="font-medium text-foreground/80">Suggest facts</span>{' '}
            when you have timeline notes—candidates show up here for review.
          </p>
        ) : null}
        {facts.length > 0 ? (
          <ul className="space-y-4">
            {facts.map((fact) => (
              <li key={fact.id}>
                <FactReviewForms
                  key={`${fact.id}-${fact.updated_at}`}
                  fact={fact}
                  action={updateFactReview}
                />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}

type RemindersProps = {
  personId: string;
  aiEnabled: boolean;
  hasRecentNotes: boolean;
  tasks: TaskRow[];
};

export function PersonRemindersMemorySection({
  personId,
  aiEnabled,
  hasRecentNotes,
  tasks,
}: RemindersProps) {
  const [addOpen, setAddOpen] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const onSaved = useCallback(() => setAddOpen(false), []);
  const startAdd = () => {
    setFormKey((k) => k + 1);
    setAddOpen(true);
  };

  return (
    <section
      className={memoryCardClass}
      aria-labelledby="person-memory-tasks-heading"
    >
      <header className="flex shrink-0 flex-row items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h2
            id="person-memory-tasks-heading"
            className="font-display text-2xl tracking-tight text-foreground"
          >
            Open loops &amp; reminders
          </h2>
          <p className="mt-1 text-sm text-muted">
            Follow-up ideas grounded in your notes—delete or snooze anytime.
          </p>
        </div>
        <div className="min-w-0 shrink-0">
          <div className="flex w-full min-w-0 flex-row flex-wrap items-start justify-end gap-2">
            {!addOpen ? (
              <Button
                type="button"
                variant="secondaryMuted"
                size="sm"
                onClick={startAdd}
              >
                Add reminder
              </Button>
            ) : null}
            <SuggestFollowUpsControl
              personId={personId}
              aiEnabled={aiEnabled}
              hasRecentNotes={hasRecentNotes}
            />
          </div>
        </div>
      </header>
      <div className="mt-6 min-h-0 flex-1 space-y-4">
        {addOpen ? (
          <ManualReminderForm
            key={formKey}
            personId={personId}
            onCancel={() => setAddOpen(false)}
            onSaved={onSaved}
          />
        ) : null}
        {tasks.length === 0 && !addOpen ? (
          <p className="text-sm text-muted">
            <span className="font-medium text-foreground/80">Add reminder</span>{' '}
            for something you want to follow up on, or use{' '}
            <span className="font-medium text-foreground/80">
              Suggest reminders
            </span>{' '}
            from your notes.
          </p>
        ) : null}
        {tasks.length > 0 ? (
          <ul className="space-y-3">
            {tasks.map((task) => (
              <li key={task.id}>
                <TaskReviewForms task={task} action={updateCrmTask} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
