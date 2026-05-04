export type QuickLogSnapshot = {
  nonce: number;
  mode: 'log' | 'editPreset';
  editingPresetId: string | null;
  primaryPersonId: string;
  attendeeIds: string[];
  interactionTypeId: string;
  interactionTitle: string;
  /** Preset card label (edit mode only). */
  presetLabel: string;
};
