import type { Tables } from '@/lib/db/database.types';

export type QuickLogPresetCardModel = Pick<
  Tables<'quick_log_presets'>,
  | 'id'
  | 'label'
  | 'primary_person_id'
  | 'interaction_type_id'
  | 'interaction_title'
  | 'attendee_person_ids'
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
    interaction_type_name: row.interaction_types?.name ?? '—',
  };
}
