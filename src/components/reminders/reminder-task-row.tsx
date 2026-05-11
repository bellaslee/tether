import Link from 'next/link';
import { TaskReviewForms } from '@/components/ai/task-review-forms';
import { updateCrmTask } from '@/lib/actions/ai-memory/reminders';
import type { Tables } from '@/lib/db/database.types';
import { personShownName } from '@/lib/people/list-name';

type PersonLabel = Pick<Tables<'people'>, 'id' | 'full_name' | 'display_name'>;

const DEFAULT_COPY = {
  unknownPerson: 'Unknown person',
  general: 'General',
} as const;

type Props = {
  task: Tables<'tasks'>;
  peopleById: Map<string, PersonLabel>;
  unknownPersonLabel?: string;
  generalLabel?: string;
};

export function ReminderTaskRow({
  task,
  peopleById,
  unknownPersonLabel = DEFAULT_COPY.unknownPerson,
  generalLabel = DEFAULT_COPY.general,
}: Props) {
  const person = task.person_id ? peopleById.get(task.person_id) : undefined;
  return (
    <>
      {person ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
          <Link
            href={`/people/${person.id}`}
            className="text-accent underline-offset-4 hover:underline"
          >
            {personShownName(person)}
          </Link>
        </p>
      ) : task.person_id ? (
        <p className="mb-2 text-xs text-muted">{unknownPersonLabel}</p>
      ) : (
        <p className="mb-2 text-xs text-muted">{generalLabel}</p>
      )}
      <TaskReviewForms
        key={`${task.id}-${task.updated_at}`}
        task={task}
        action={updateCrmTask}
      />
    </>
  );
}
