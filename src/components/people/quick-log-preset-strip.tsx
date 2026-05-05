'use client';

import type { QuickLogPresetCardModel } from '@/lib/quick-log/preset-card-model';
import { personShownName } from '@/lib/people/list-name';
import { Button } from '@/components/ui/button';
import { listRowCardClassName } from '@/components/ui/list-row-card';
import { usePersonQuickLog } from '@/components/people/person-quick-log-context';
import type { PersonOption } from '@/components/people/interaction-participant-picker';

type QuickLogPresetStripProps = {
  presets: QuickLogPresetCardModel[];
  peopleById: Map<string, PersonOption>;
};

function peopleSummary(
  preset: QuickLogPresetCardModel,
  peopleById: Map<string, PersonOption>,
): string {
  const n = preset.attendee_person_ids.length;
  if (!preset.primary_person_id) {
    if (n === 0) {
      return 'No people';
    }
    if (n === 1) {
      const only = peopleById.get(preset.attendee_person_ids[0] ?? '');
      return only ? personShownName(only) : '1 person';
    }
    return `${n} people`;
  }
  const primary = peopleById.get(preset.primary_person_id);
  const primaryName = primary ? personShownName(primary) : 'Unknown';
  if (n === 0) {
    return primaryName;
  }
  return `${primaryName} +${n}`;
}

export function QuickLogPresetStrip({
  presets,
  peopleById,
}: QuickLogPresetStripProps) {
  const { openQuickLogWithPreset, openEditPreset } = usePersonQuickLog();

  if (presets.length === 0) {
    return null;
  }

  return (
    <div className="-mx-6 min-w-0 sm:-mx-8">
      <p className="mb-2 px-6 text-xs font-semibold uppercase tracking-[0.24em] text-muted sm:px-8">
        Quick log presets
      </p>
      <div
        className="flex gap-3 overflow-x-auto px-6 pb-1 pt-0.5 scroll-px-6 sm:px-8 sm:scroll-px-8"
        role="list"
      >
        {presets.map((preset) => (
          <div
            key={preset.id}
            role="listitem"
            className={listRowCardClassName(
              'flex w-[min(100%,16rem)] shrink-0 snap-start flex-col gap-2 p-4',
            )}
          >
            <button
              type="button"
              onClick={() => openQuickLogWithPreset(preset)}
              className="min-w-0 text-left"
            >
              <p className="font-display text-lg leading-snug tracking-tight [overflow-wrap:anywhere]">
                {preset.label}
              </p>
              <p className="mt-1 text-xs text-muted">{preset.interaction_type_name}</p>
              {preset.interaction_title &&
              preset.interaction_title !== 'Quick log' ? (
                <p className="mt-1 line-clamp-2 text-xs text-foreground/80">
                  {preset.interaction_title}
                </p>
              ) : null}
              <p className="mt-2 text-xs font-medium text-foreground/90">
                {peopleSummary(preset, peopleById)}
              </p>
            </button>
            <div className="flex flex-wrap gap-2 border-t border-border-soft pt-2">
              <Button
                type="button"
                variant="ghostSubtle"
                size="sm"
                className="shrink-0"
                onClick={() => openEditPreset(preset)}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
