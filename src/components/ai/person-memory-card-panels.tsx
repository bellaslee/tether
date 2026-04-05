'use client';

import { useCallback, useState } from 'react';
import { updateFactReview } from '@/lib/actions/ai-memory/facts';
import { updateCrmTask } from '@/lib/actions/ai-memory/reminders';
import { FactReviewForms } from '@/components/ai/fact-review-forms';
import {
  ManualFactForm,
  ManualReminderForm,
} from '@/components/ai/manual-memory-add-forms';
import { TaskReviewForms } from '@/components/ai/task-review-forms';
import { Button } from '@/components/ui/button';
import type { Tables } from '@/lib/db/database.types';

const memoryCardClass =
  'card-surface flex h-full min-w-0 flex-col rounded-[1.75rem] border border-border-soft p-6 sm:p-8';

type FactRow = Tables<'facts'>;
type TaskRow = Tables<'tasks'>;

const FACTS_INITIAL_VISIBLE = 5;
const TASKS_INITIAL_VISIBLE = 3;

type FactsProps = {
  personId: string;
  facts: FactRow[];
};

export function PersonFactsMemorySection({
  personId,
  facts,
}: FactsProps) {
  const [factsExpanded, setFactsExpanded] = useState(false);
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
            Accept what you want to keep, or decline candidates you do not want
            suggested again from the same note.
          </p>
        </div>
        <div className="min-w-0 shrink-0">
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
        </div>
      </header>
      <div className="mt-6 flex-1 space-y-4">
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
            capture something yourself, or log a timeline note on this
            profile—candidate facts from your notes will show up here for
            review.
          </p>
        ) : null}
        {facts.length > 0 ? (
          <>
            <ul
              id="person-memory-facts-list"
              className="space-y-4"
            >
              {(factsExpanded ? facts : facts.slice(0, FACTS_INITIAL_VISIBLE)).map(
                (fact) => (
                  <li key={fact.id}>
                    <FactReviewForms
                      key={`${fact.id}-${fact.updated_at}`}
                      fact={fact}
                      action={updateFactReview}
                    />
                  </li>
                ),
              )}
            </ul>
            {facts.length > FACTS_INITIAL_VISIBLE && !factsExpanded ? (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="secondaryMuted"
                  size="sm"
                  aria-expanded={false}
                  aria-controls="person-memory-facts-list"
                  onClick={() => setFactsExpanded(true)}
                >
                  Show {facts.length - FACTS_INITIAL_VISIBLE} more fact
                  {facts.length - FACTS_INITIAL_VISIBLE === 1 ? '' : 's'}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}

type RemindersProps = {
  personId: string;
  tasks: TaskRow[];
};

export function PersonRemindersMemorySection({
  personId,
  tasks,
}: RemindersProps) {
  const [tasksExpanded, setTasksExpanded] = useState(false);
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
            Follow-up ideas from your notes—decline what you do not want, snooze
            anytime, or edit to remove one permanently.
          </p>
        </div>
        <div className="min-w-0 shrink-0">
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
        </div>
      </header>
      <div className="mt-6 flex-1 space-y-4">
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
            for something you want to follow up on, or add a note to a timeline
            interaction—suggested reminders from your notes will appear here.
          </p>
        ) : null}
        {tasks.length > 0 ? (
          <>
            <ul
              id="person-memory-tasks-list"
              className="space-y-3"
            >
              {(tasksExpanded ? tasks : tasks.slice(0, TASKS_INITIAL_VISIBLE)).map(
                (task) => (
                  <li key={task.id}>
                    <TaskReviewForms
                      key={`${task.id}-${task.updated_at}`}
                      task={task}
                      action={updateCrmTask}
                    />
                  </li>
                ),
              )}
            </ul>
            {tasks.length > TASKS_INITIAL_VISIBLE && !tasksExpanded ? (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="secondaryMuted"
                  size="sm"
                  aria-expanded={false}
                  aria-controls="person-memory-tasks-list"
                  onClick={() => setTasksExpanded(true)}
                >
                  Show {tasks.length - TASKS_INITIAL_VISIBLE} more reminder
                  {tasks.length - TASKS_INITIAL_VISIBLE === 1 ? '' : 's'}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
