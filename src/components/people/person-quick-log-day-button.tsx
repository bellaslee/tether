'use client';

import type { ComponentProps } from 'react';
import { DayButton as RDPDayButton } from 'react-day-picker';

/** Deterministic “random” palette slot from calendar date (stable across re-renders). */
function paletteIndexForIsoDate(isoDate: string): number {
  let h = 0;
  for (let i = 0; i < isoDate.length; i++) {
    h = (Math.imul(31, h) + isoDate.charCodeAt(i)) | 0;
  }
  return Math.abs(h) % 3;
}

type SwatchTone = 'coral' | 'sun' | 'sky';

function swatchToneForIsoDate(isoDate: string): SwatchTone {
  const i = paletteIndexForIsoDate(isoDate);
  if (i === 1) return 'sun';
  if (i === 2) return 'sky';
  return 'coral';
}

/** Selected days use site accent palette with one color per day (hashed from the date). */
export function PersonQuickLogDayButton(
  props: ComponentProps<typeof RDPDayButton>,
) {
  const { day, modifiers, className } = props;
  const isSelected = Boolean(modifiers.selected) && !modifiers.disabled;
  const tone = isSelected ? swatchToneForIsoDate(day.isoDate) : null;

  return (
    <RDPDayButton
      {...props}
      className={[
        className,
        tone ? `prm-quick-log-swatch prm-quick-log-swatch--${tone}` : '',
      ]
        .filter(Boolean)
        .join(' ')}
    />
  );
}
