import type { Tables } from '@/lib/db/database.types';

export type QuickLogPresetCardModel = Pick<
  Tables<'quick_log_presets'>,
  | 'id'
  | 'label'
  | 'primary_person_id'
  | 'interaction_type_id'
  | 'interaction_title'
  | 'attendee_person_ids'
  | 'time_local'
> & {
  interaction_type_name: string;
};

type PresetRowWithType = Pick<
  Tables<'quick_log_presets'>,
  | 'id'
  | 'label'
  | 'primary_person_id'
  | 'interaction_type_id'
  | 'interaction_title'
  | 'attendee_person_ids'
  | 'time_local'
> & {
  interaction_types: { name: string } | null;
};

export function toQuickLogPresetCardModel(row: PresetRowWithType): QuickLogPresetCardModel {
  return {
    id: row.id,
    label: row.label,
    primary_person_id: row.primary_person_id,
    interaction_type_id: row.interaction_type_id,
    interaction_title: row.interaction_title,
    attendee_person_ids: row.attendee_person_ids ?? [],
    time_local: row.time_local ?? '12:00',
    interaction_type_name: row.interaction_types?.name ?? '—',
  };
}
