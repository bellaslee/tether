/**
 * Playful top borders aligned with landing / auth cards:
 * sun → sky → coral accent, repeating by index.
 */
export const PANEL_TOP_ACCENT_CLASSES = [
  'border-t-2 border-t-accent-sun/50',
  'border-t-2 border-t-accent-sky/45',
  'border-t-2 border-t-accent/40',
] as const;

export function panelTopAccentAt(index: number): string {
  const n = PANEL_TOP_ACCENT_CLASSES.length;
  return PANEL_TOP_ACCENT_CLASSES[((index % n) + n) % n];
}

export function randomPanelTopAccentClass(): string {
  const i = Math.floor(Math.random() * PANEL_TOP_ACCENT_CLASSES.length);
  return PANEL_TOP_ACCENT_CLASSES[i];
}
