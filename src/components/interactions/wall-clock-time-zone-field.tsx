'use client';

import { useMemo } from 'react';

/** Submitted with interaction forms so the server can parse `datetime-local` in the browser zone when session metadata has no timezone yet. */
export function WallClockTimeZoneField() {
  const tz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    [],
  );
  return <input type="hidden" name="wall_time_zone" value={tz} />;
}
